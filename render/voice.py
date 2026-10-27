"""Tạo giọng đọc cho video bảng tin bằng Vbee (mỗi cảnh một câu, khớp với cảnh trong video).

Xác thực: Network secret của môi trường Claude cho host api.vbee.vn gắn sẵn 2 header
Authorization: Bearer <token> và App-Id: <app id>. Chạy ở nơi khác thì đặt VBEE_TOKEN và VBEE_APP_ID.
Giọng: --voice hoặc biến môi trường VBEE_VOICE (mặc định giọng clone Nguyễn Hoài Anh).

Ví dụ:
  python3 render/voice.py examples/bangtin-mau.json --dry-run          # chỉ in lời đọc
  python3 render/voice.py examples/bangtin-mau.json --out /tmp/props.json
  python3 render/voice.py voices                                        # liệt kê giọng
Kết quả --out là JSON bảng tin có thêm trường "voice" để truyền cho render/video.sh.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import requests

API = "https://api.vbee.vn/v1/tts"
VOICES_API = "https://vbee.vn/api/public/v1/voices"
LEGACY_API = "https://vbee.vn/api/v1/tts"
DEFAULT_VOICE = "s_cantho_male_nguyenhoaianhdemo_zero_shot_story_vc"  # giọng clone Nguyễn Hoài Anh
DEFAULT_SPEED = "1.0"
MAX_CHARS = 300
ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "video" / "public"
CONTACT = json.loads((ROOT / "assets" / "brand.json").read_text(encoding="utf-8"))

ABBR = [  # viết tắt trên ảnh -> cách đọc
    (r"\bNV/CV\b", "nhân viên, chuyên viên"),
    (r"\bNV\b", "nhân viên"),
    (r"\bCVC\b", "chuyên viên chính"),
    (r"\bCV\b", "chuyên viên"),
    (r"\bKH\b", "khách hàng"),
    (r"\bSX\b", "sản xuất"),
    (r"\bXD\b", "xây dựng"),
    (r"\bTP\. ?HCM\b", "Thành phố Hồ Chí Minh"),
    (r"\bTP\. ", "Thành phố "),
    (r"\bTP\b", "trưởng phòng"),
    (r"\bQHKH\b", "quan hệ khách hàng"),
    (r"\bBĐS\b", "bất động sản"),
    (r"\bTM-DV\b", "thương mại dịch vụ"),
    (r"&", "và"),
    (r"\s*\(([^)]*)\)", r", \1,"),
    (r"\bĐBSCL\b", "Đồng bằng sông Cửu Long"),
    (r"\bTNHH\b", "trách nhiệm hữu hạn"),
    (r"\bTMCP\b", "thương mại cổ phần"),
    (r"\bMTV\b", "một thành viên"),
    (r"\bCông ty CP\b", "Công ty cổ phần"),
]

DIGITS = "không một hai ba bốn năm sáu bảy tám chín".split()


def spoken(text):
    text = text.replace("24/7", "hai bốn trên bảy")
    for pat, rep in ABBR:
        text = re.sub(pat, rep, text)
    text = re.sub(r"(\d+)\s*[–-]\s*(\d+)", r"\1 đến \2", text)
    text = re.sub(r",\s*([,.])", r"\1", text)
    text = re.sub(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", r"\1 tháng \2 năm \3", text)
    text = re.sub(r"\b(\d{1,2})/(\d{1,2})\b", r"\1 tháng \2", text)
    text = re.sub(r"\b24\b", "hai mươi bốn", text)  # Vbee hay đọc "hai mươi tư"; Design24 đã có trong phat-am.json là "hai bốn"
    text = re.sub(r"\s+", " ", text).strip()
    # Viết hoa chữ đầu mỗi câu
    return re.sub(r"(^|[.!?]\s+)(\w)", lambda m: m.group(1) + m.group(2).upper(), text)


def phone(num):
    """Đọc số điện thoại theo từng nhóm chữ số."""
    groups = num.split()
    return ", ".join(" ".join(DIGITS[int(c)] for c in g if c.isdigit()) for g in groups)


def title(name):
    words = spoken(name).lower().split()
    return " ".join(w if w in ("và",) else w[:1].upper() + w[1:] for w in words)


def salary(sal):
    s = sal.strip()
    if s.lower().startswith("thỏa thuận"):
        return "lương thỏa thuận"
    return "lương " + s[0].lower() + s[1:]


def fit(parts, tail="", limit=MAX_CHARS - 5):
    """Ghép các ý cho tới khi chạm giới hạn ký tự (giữ video khoảng 45 giây)."""
    out = ""
    for p in parts:
        cand = (out + " " + p).strip()
        if out and len(spoken(cand + " " + tail)) > limit:
            break
        out = cand
    return spoken((out + " " + tail).strip())


PRON = json.loads((ROOT / "assets" / "phat-am.json").read_text(encoding="utf-8"))
VN_ENDINGS = ("c", "ch", "m", "n", "ng", "nh", "p", "t")


def _sub_words(text, table):
    for k in sorted(table, key=len, reverse=True):
        text = re.sub(r"(?<![\w.])" + re.escape(k) + r"(?![\w])", table[k], text, flags=re.I)
    return text


def is_english(word):
    """Đoán từ không đọc được theo tiếng Việt (tên riêng, viết tắt tiếng Anh...)."""
    w = word.strip(".,;:!?()'\"")
    if len(w) < 2 or not w.isalpha():
        return False
    if w.isupper():
        return True  # viết tắt như STEC, TTC
    low = w.lower()
    if re.search(r"[fjwz]", low):
        return True
    if re.match(r"(bl|br|cl|cr|dr|fl|gl|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tw|wh|wr)", low):
        return True
    plain = not re.search(r"[^a-z]", low)  # không dấu
    if plain and low[-1] not in "aeiouy" and not low.endswith(VN_ENDINGS):
        return True
    return False


def readable(text):
    """Đổi sang cách đọc tiếng Việt; trả về None nếu vẫn còn từ tiếng Anh không đọc được."""
    t = _sub_words(text, PRON["dich"])
    t = spoken(_sub_words(t, PRON["doc"]))
    return None if any(is_english(w) for w in t.split()) else t


def lower_first(s):
    return s[:1].lower() + s[1:]


def job_line(j):
    pos = readable(j["pos"])
    if not pos:
        return None
    sal = j["sal"].strip()
    pay = "lương thỏa thuận" if sal.lower().startswith("thỏa thuận") else "lương " + lower_first(sal).replace("đến", "lên đến")
    if re.match(r"\d", sal):
        pay = "lương từ " + sal
    return f"{pos}. {pay[:1].upper() + pay[1:]}."  # tên công ty đã hiện trên màn hình


def script_basic(d):
    """Lời đọc cho mẫu cũ video/src/BangTin.tsx.
    Câu ngắn, nhiều dấu chấm phẩy để giọng ngắt nhịp tự nhiên; bỏ qua tên tiếng Anh khó đọc."""
    lines = []
    regions = ", ".join(d["regionsLine"][:-1]) + ", và " + d["regionsLine"][-1]
    lines.append(f"Đì sai hai bốn xin chào! Đây là bảng tin tuyển dụng tổng hợp, ngày {d['date'][:5]}. Việc làm mới tại {regions}.")
    st = d["stats"]
    s = f"Hôm nay, có {st[0]['value']} vị trí đang tuyển"
    if len(st) > 1 and st[1]["value"].isdigit():
        s += f", ở {st[1]['value']} {st[1]['label'].splitlines()[0]}"
    if len(st) > 2:
        s += f". Hạn nộp muộn nhất, là ngày {st[2]['value']}"
    lines.append(s + ". Cùng xem ngay nhé!")
    for i, lst in enumerate(d["lists"]):
        head = f"{'Đầu tiên' if i == 0 else 'Tiếp theo'}, {title(lst['name'])}."
        jobs = [x for x in (job_line(j) for j in lst["jobs"]) if x]
        lines.append(fit([head] + jobs, f"Và còn nhiều vị trí khác, trên màn hình.", limit=200))
    if d.get("grid") and d["grid"]["cells"]:
        parts = ["Ở miền Tây."]
        for c in d["grid"]["cells"]:
            pos = next((p for p in (readable(j["pos"]) for j in c["jobs"]) if p), None)
            if pos:
                parts.append(f"{c['province']}, cần {lower_first(pos)}.")
        lines.append(fit(parts, "Cùng nhiều cơ hội khác.", limit=180))
    lines.append(
        f"Muốn ứng tuyển? Hãy nhắn tin cho trang Đì sai hai bốn, hoặc Da lô, số {phone(CONTACT['zalo'])}. "
        "Lưu ý! Nhà tuyển dụng thật, không bao giờ thu phí ứng viên."
    )
    return [_sub_words(spoken(x), PRON["doc"]) for x in lines]


INDUSTRY = [  # giống video/src/derive.ts
    ("xây dựng, kỹ thuật", r"xây dựng|thi công|chỉ huy|kỹ sư|giám sát|hiện trường|qs|mep|cơ điện|kỹ thuật|bảo trì|điện lạnh"),
    ("kế toán, tài chính", r"kế toán|tài chính|kiểm soát|thu hồi nợ|accountant"),
    ("kinh doanh, bán hàng", r"kinh doanh|sales|bán hàng|thị trường|khách hàng|merchandiser|qhkh"),
    ("sản xuất, chất lượng", r"sản xuất|đúc|luyện|quality|chất lượng|xưởng|r&d"),
    ("ngân hàng, bảo hiểm", r"giao dịch viên|ngân hàng|bảo hiểm|giám định"),
    ("vận tải, dịch vụ", r".*"),
]
# Thứ tự trong derive.ts quyết định ngành; ở đây dò theo đúng thứ tự đó
INDUSTRY_ORDER = ["kế toán, tài chính", "xây dựng, kỹ thuật", "kinh doanh, bán hàng", "sản xuất, chất lượng", "ngân hàng, bảo hiểm", "vận tải, dịch vụ"]
NUM_WORDS = "không một hai ba bốn năm sáu bảy tám chín mười".split()


def industry(pos):
    table = dict(INDUSTRY)
    return next(k for k in INDUSTRY_ORDER if re.search(table[k], pos, re.I))


def sal_max(sal):
    nums = [float(x.replace(",", ".")) for x in re.findall(r"\d+(?:[.,]\d+)?", sal)]
    return max(nums) if nums else None


def count_word(n):
    return NUM_WORDS[n] if n <= 10 else str(n)


def region_name(name):
    return title(name) if name.isupper() else name


def pay_text(sal):
    s = sal.strip()
    if s.lower().startswith("thỏa thuận"):
        return "lương thỏa thuận"
    if s.lower().startswith("đến"):
        return "lương lên " + s.lower()
    return "lương từ " + s


def script(d):
    """Lời đọc cho mẫu video/src/v2/BangTinPro.tsx, đúng thứ tự cảnh:
    mở đầu, nhà tuyển dụng, ngành nghề, top lương, Cần Thơ, miền Tây, khu vực khác, sắp hết hạn, cách ứng tuyển, mã QR, kết.
    Câu ngắn, có dấu ngắt để giọng lên xuống tự nhiên; tên tiếng Anh khó đọc thì bỏ hoặc dịch."""
    jobs = [dict(j, region=l["name"]) for l in d["lists"] for j in l["jobs"]]
    if d.get("grid"):
        jobs += [dict(j, region=c["province"]) for c in d["grid"]["cells"] for j in c["jobs"]]
    total = len(jobs)
    top = max((sal_max(j["sal"]) or 0) for j in jobs)
    dd, mm, yy = (int(x) for x in d["date"].split("/"))
    lines = []
    lines.append(
        "Xin chào bạn, đến với bản tin Tìm Việc Số, được cập nhật liên tục 24/7. "
        "Dự án này được nghiên cứu và phát triển tại Học viện Design24. "
        f"Hôm nay, ngày {dd}, tháng {mm}, năm {yy}, chúng tôi cập nhật bản tin việc làm, "
        f"gồm có {total} vị trí. Lương cao nhất, lên đến {int(top)} triệu đồng một tháng!"
    )
    # Nhà tuyển dụng (tường logo) và số vị trí theo khu vực
    cos = []
    for j in jobs:
        co = readable(re.sub(r"\s*\(.*?\)", "", j["co"]))
        if co and co not in cos:
            cos.append(co)
    parts = []
    if cos:
        parts.append("Nhà tuyển dụng hôm nay có " + ", ".join(cos[:3]) + (", và nhiều đơn vị khác." if len(cos) > 3 else "."))
    ct = [l for l in d["lists"] if "cần thơ" in l["name"].lower()]
    counts = [f"{region_name(l['name'])} có {count_word(len(l['jobs']))} vị trí" for l in ct]
    if d.get("grid"):
        counts.append(f"miền Tây có {count_word(sum(len(c['jobs']) for c in d['grid']['cells']))} vị trí")
    counts += [f"{region_name(l['name'])} có {count_word(len(l['jobs']))} vị trí" for l in d["lists"] if l not in ct]
    parts.append(", ".join(counts) + ".")
    lines.append(fit(parts, "", limit=260))
    # Ngành nghề
    counts = {}
    for j in jobs:
        k = industry(j["pos"])
        counts[k] = counts.get(k, 0) + 1
    ranked = sorted(counts.items(), key=lambda x: -x[1])
    s = f"Ngành tuyển nhiều nhất hôm nay, là {ranked[0][0]}, với {count_word(ranked[0][1])} vị trí."
    if len(ranked) > 1:
        s += f" Tiếp theo là {ranked[1][0]}, với {count_word(ranked[1][1])} vị trí."
    lines.append(s)
    # Top lương
    tops = sorted([j for j in jobs if sal_max(j["sal"])], key=lambda j: -sal_max(j["sal"]))
    readable_tops = [(j, readable(j["pos"])) for j in tops]
    readable_tops = [(j, p) for j, p in readable_tops if p][:3]
    if readable_tops:
        j0, p0 = readable_tops[0]
        s = f"Và đây, là top lương cao nhất! Đứng đầu là {lower_first(p0)}, {pay_text(j0['sal'])}."
        rest = [f"{lower_first(p)} ở {region_name(j['region']) if j['region'].isupper() else j['region']}" for j, p in readable_tops[1:]]
        if rest:
            s += " Theo sau là " + ", và ".join(rest) + "."
        lines.append(s)
    else:
        lines.append("Và đây, là những vị trí có mức lương hấp dẫn nhất hôm nay!")
    def region_line(l):
        ranked_jobs = sorted(l["jobs"], key=lambda j: -(sal_max(j["sal"]) or 0))
        star = next((j for j in ranked_jobs if readable(j["pos"])), None)
        others = [readable(j["pos"]) for j in l["jobs"] if j is not star]
        others = [o for o in others if o]
        s = f"Tại {region_name(l['name'])}."
        if star:
            co = readable(star["co"])
            s += f" Việc nổi bật là {lower_first(readable(star['pos']))}"
            s += f", ở {co}" if co else ""
            s += f". {pay_text(star['sal'])[:1].upper() + pay_text(star['sal'])[1:]}"
            s += f", hạn nộp ngày {star['dl']}." if star.get("dl") else "."
        tail = f"Ngoài ra, còn {count_word(len(l['jobs']) - 1)} vị trí khác"
        if others:
            tail += ", như " + lower_first(others[0])
        return fit([s], tail + ".", limit=280)
    # Thứ tự khu vực giống video: Cần Thơ, miền Tây, rồi TP.HCM
    can_tho = [l for l in d["lists"] if "cần thơ" in l["name"].lower()]
    for l in can_tho:
        lines.append(region_line(l))
    # Miền Tây
    if d.get("grid") and d["grid"]["cells"]:
        parts = ["Về miền Tây."]
        for n, c in enumerate(d["grid"]["cells"]):
            j = next((j for j in c["jobs"] if readable(j["pos"])), None)
            if not j:
                continue
            m = sal_max(j["sal"])
            extra = f", lương tới {int(m)} triệu" if m and n == 0 else ""
            parts.append(f"{c['province']}, đang cần {lower_first(readable(j['pos']))}{extra}.")
        lines.append(fit(parts, "", limit=260))
    for l in d["lists"]:
        if l not in can_tho:
            lines.append(region_line(l))
    # Sắp hết hạn nộp (giống soonJobs trong DeadlineScene.tsx)
    def dl_key(j):
        dd_, mm_ = (int(x) for x in j["dl"].split("/")[:2])
        return mm_ * 100 + dd_
    soon = sorted([j for j in jobs if j.get("dl")], key=dl_key)[:4]
    if soon:
        parts = ["Đừng bỏ lỡ những vị trí sắp hết hạn nộp!"]
        for j in soon:
            pos, co = readable(j["pos"]), readable(re.sub(r"\s*\(.*?\)", "", j["co"]))
            if pos:
                parts.append(f"Ngày {j['dl']}, {co + ' tuyển ' + lower_first(pos) if co else lower_first(pos)}.")
        lines.append(fit(parts, "", limit=280))
    # Cách ứng tuyển: chọn việc, rồi một trong hai cách (độc lập, không phải các bước nối tiếp)
    lines.append(
        "Ứng tuyển thế nào? Trước hết, chọn việc làm phù hợp, xem kỹ yêu cầu, mức lương, hạn nộp và địa điểm. "
        "Sau đó, liên hệ trực tiếp với nhà tuyển dụng. Hoặc nhanh hơn, truy cập timviecso.vn, "
        "hoặc tải ứng dụng Tìm Việc Số trên CH Play và App Store."
    )
    # 2 mã QR (QRScene.tsx: trên là app CH Play, dưới là website)
    lines.append(
        "Quét mã phía trên để tải ứng dụng Tìm Việc Số trên CH Play. "
        "Hoặc quét mã phía dưới để truy cập website timviecso.vn, xem đầy đủ tin tuyển dụng và ứng tuyển nhanh hơn."
    )
    # Kết
    lines.append("Việc làm mới được cập nhật liên tục. Theo dõi Đì sai hai bốn, để không bỏ lỡ nhé!")
    return [_sub_words(spoken(x), PRON["doc"]) for x in lines]


def caption(line):
    """Chữ hiện trên phụ đề: đổi cách đọc phiên âm về chữ viết gốc (Da lô -> Zalo, số điện thoại...)."""
    for word, spoken_form in sorted(PRON["doc"].items(), key=lambda x: -len(x[1])):
        if word[:1].isupper() or "." in word:
            line = re.sub(re.escape(spoken_form), word, line, flags=re.I)
    line = line.replace(phone(CONTACT["zalo"]), CONTACT["zalo"])
    return line.replace("phan pết", "Fanpage")


def _headers():
    h = {"Content-Type": "application/json"}
    if os.environ.get("VBEE_APP_ID"):
        h["App-Id"] = os.environ["VBEE_APP_ID"]
    if os.environ.get("VBEE_TOKEN"):
        h["Authorization"] = f"Bearer {os.environ['VBEE_TOKEN']}"
    return h


def _download(url, path):
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    path.write_bytes(r.content)


def tts_batch(text, voice, path, speed=1.0):
    """Batch API (mode async): dùng cho giọng clone mà Realtime API chưa hỗ trợ. Hỏi lại kết quả mỗi 2 giây."""
    r = requests.post(API, headers=_headers(), timeout=120, json={
        "text": text, "mode": "async", "voiceCode": voice, "outputFormat": "mp3", "bitrate": 128, "speed": speed,
        "webhookUrl": "https://example.com/vbee-webhook"})
    if not r.ok:
        raise SystemExit(f"Vbee batch lỗi: {r.status_code} {r.text[:300]}")
    rid = r.json().get("requestId") or r.json().get("result", {}).get("requestId")
    for _ in range(90):
        time.sleep(2)
        g = requests.get(f"{API}/requests/{rid}", headers=_headers(), timeout=60)
        if not g.ok:
            continue
        body = g.json()
        body = body.get("result", body)
        if body.get("status") == "COMPLETED" and body.get("audioLink"):
            _download(body["audioLink"], path)
            return
        if body.get("status") == "FAILED":
            raise SystemExit(f"Vbee batch thất bại: {json.dumps(body, ensure_ascii=False)[:300]}")
    raise SystemExit(f"Vbee batch quá thời gian chờ (request {rid})")


def tts_legacy(text, voice, path, speed=1.0):
    """API cũ trên vbee.vn (cần Network secret cho host vbee.vn và biến VBEE_APP_ID hoặc header App-Id)."""
    body = {"app_id": os.environ.get("VBEE_APP_ID", ""), "response_type": "indirect", "callback_url": "https://example.com/vbee-webhook",
            "input_text": text, "voice_code": voice, "audio_type": "mp3", "bitrate": 128, "speed_rate": round(speed, 1)}
    r = requests.post(LEGACY_API, headers=_headers(), timeout=120, json=body)
    if not r.ok or r.json().get("status") != 1:
        raise SystemExit(f"Vbee (API cũ) lỗi: {r.status_code} {r.text[:300]}")
    rid = r.json()["result"]["request_id"]
    for _ in range(90):
        time.sleep(2)
        g = requests.get(f"{LEGACY_API}/{rid}", headers=_headers(), timeout=60)
        if not g.ok:
            continue
        res = g.json().get("result", {})
        if res.get("status") == "SUCCESS" and res.get("audio_link"):
            _download(res["audio_link"], path)
            return
        if res.get("status") == "FAILURE":
            raise SystemExit(f"Vbee (API cũ) thất bại: {json.dumps(res, ensure_ascii=False)[:300]}")
    raise SystemExit(f"Vbee (API cũ) quá thời gian chờ (request {rid})")


def tts(text, voice, path, speed=1.0):
    """Thử Realtime API; giọng nào Realtime báo không có (thường là giọng clone) thì chuyển sang Batch, rồi API cũ."""
    last = None
    for attempt in range(1, 4):
        try:
            r = requests.post(API, headers=_headers(), timeout=120, json={
                "text": text, "mode": "sync", "voiceCode": voice, "outputFormat": "mp3", "bitrate": 128, "speed": speed})
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if r.ok and not r.headers.get("content-type", "").startswith("application/json"):
                path.write_bytes(r.content)
                return
            last = f"{r.status_code} {r.text[:300]}"
            if r.status_code == 400 and "voice" in r.text.lower():
                break
            if r.status_code < 500 and r.status_code != 429:
                raise SystemExit(f"Vbee lỗi: {last}")
        time.sleep(2 ** attempt)
    errors = [f"realtime: {last}"]
    for fn in (tts_batch, tts_legacy):
        try:
            fn(text, voice, path, speed)
            return
        except (SystemExit, requests.RequestException) as exc:
            errors.append(f"{fn.__name__}: {exc}")
    raise SystemExit("Vbee lỗi với mọi API: " + " | ".join(errors))


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         check=True, capture_output=True, text=True).stdout
    return float(out.strip())


def list_voices(ownership=None):
    out, cursor = [], None
    while True:
        params = {"limit": 100}
        if ownership:
            params["voice_ownership"] = ownership
        if cursor:
            params["cursor"] = cursor
        r = requests.get(VOICES_API, headers=_headers(), params=params, timeout=60)
        r.raise_for_status()
        res = r.json()["result"]
        out += res["voices"]
        cursor = res.get("pagination", {}).get("next_cursor")
        if not res.get("pagination", {}).get("has_next_page") or not cursor:
            return out


def voices():
    for own in ("PERSONAL", None):
        for v in list_voices(own):
            print(f"{own or 'ALL'}\t{v['code']}\t{v['name']}\t{v.get('gender')}")


def resolve_voice(voice):
    """Nhận mã giọng hoặc tên giọng (vd. giọng clone "Nguyễn Hoài Anh") và trả về mã giọng."""
    if "_" in voice or "-" in voice:
        return voice
    for own in ("PERSONAL", None):
        for v in list_voices(own):
            if v["name"].strip().lower() == voice.strip().lower() or voice.lower() in v["name"].lower():
                return v["code"]
    raise SystemExit(f"Không tìm thấy giọng '{voice}' trong Vbee")


def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]
    if argv and argv[0] == "voices":
        voices()
        return 0
    p = argparse.ArgumentParser(prog="render/voice.py")
    p.add_argument("json")
    p.add_argument("--out", help="ghi JSON bảng tin kèm trường voice")
    p.add_argument("--voice", default=os.environ.get("VBEE_VOICE", DEFAULT_VOICE))
    p.add_argument("--speed", type=float, default=float(os.environ.get("VBEE_SPEED", DEFAULT_SPEED)))
    p.add_argument("--style", choices=["pro", "basic"], default="pro", help="pro: mẫu BangTinPro; basic: mẫu cũ")
    p.add_argument("--dry-run", action="store_true", help="chỉ in lời đọc, không gọi Vbee")
    a = p.parse_args(argv)
    data = json.loads(Path(a.json).read_text(encoding="utf-8"))
    lines = script(data) if a.style == "pro" else script_basic(data)
    if a.dry_run:
        for i, line in enumerate(lines):
            print(f"[{i}] ({len(line)} ký tự) {line}")
            print(f"     phụ đề: {caption(line)}")
        return 0
    voice = resolve_voice(a.voice)
    slug = time.strftime("%Y%m%d-%H%M%S")
    folder = PUBLIC / "voice" / slug
    folder.mkdir(parents=True, exist_ok=True)
    data["voice"] = []
    for i, line in enumerate(lines):
        f = folder / f"{i}.mp3"
        tts(line, voice, f, a.speed)
        data["voice"].append({"src": f"voice/{slug}/{i}.mp3", "dur": round(duration(f), 2), "text": caption(line)})
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
