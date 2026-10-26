"""Tạo giọng đọc cho video bảng tin bằng Vbee (mỗi cảnh một câu, khớp với cảnh trong video).

Xác thực: Network secret của môi trường Claude cho host api.vbee.vn gắn sẵn 2 header
Authorization: Bearer <token> và App-Id: <app id>. Chạy ở nơi khác thì đặt VBEE_TOKEN và VBEE_APP_ID.
Giọng: --voice hoặc biến môi trường VBEE_VOICE (mặc định SG - Tường Vy nếu không đặt).

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
DEFAULT_VOICE = "hn_female_ngochuyen_full_48k-fhg"
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
]

DIGITS = "không một hai ba bốn năm sáu bảy tám chín".split()


def spoken(text):
    for pat, rep in ABBR:
        text = re.sub(pat, rep, text)
    text = re.sub(r"(\d+)\s*[–-]\s*(\d+)", r"\1 đến \2", text)
    text = re.sub(r",\s*([,.])", r"\1", text)
    text = re.sub(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", r"\1 tháng \2 năm \3", text)
    text = re.sub(r"\b(\d{1,2})/(\d{1,2})\b", r"\1 tháng \2", text)
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


def script(d):
    """Lời đọc theo đúng thứ tự cảnh trong video/src/BangTin.tsx.
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


def _headers():
    h = {"Content-Type": "application/json"}
    if os.environ.get("VBEE_APP_ID"):
        h["App-Id"] = os.environ["VBEE_APP_ID"]
    if os.environ.get("VBEE_TOKEN"):
        h["Authorization"] = f"Bearer {os.environ['VBEE_TOKEN']}"
    return h


def tts(text, voice, path, speed=1.05):
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
            if r.status_code < 500 and r.status_code != 429:
                break
        time.sleep(2 ** attempt)
    raise SystemExit(f"Vbee lỗi: {last}")


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
    p.add_argument("--dry-run", action="store_true", help="chỉ in lời đọc, không gọi Vbee")
    a = p.parse_args(argv)
    data = json.loads(Path(a.json).read_text(encoding="utf-8"))
    lines = script(data)
    if a.dry_run:
        for i, line in enumerate(lines):
            print(f"[{i}] ({len(line)} ký tự) {line}")
        return 0
    voice = resolve_voice(a.voice)
    slug = time.strftime("%Y%m%d-%H%M%S")
    folder = PUBLIC / "voice" / slug
    folder.mkdir(parents=True, exist_ok=True)
    data["voice"] = []
    for i, line in enumerate(lines):
        f = folder / f"{i}.mp3"
        tts(line, voice, f, a.speed)
        data["voice"].append({"src": f"voice/{slug}/{i}.mp3", "dur": round(duration(f), 2), "text": line})
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
