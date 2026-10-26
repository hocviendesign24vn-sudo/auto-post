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


def script(d):
    """Lời đọc theo đúng thứ tự cảnh trong video/src/BangTin.tsx."""
    lines = []
    regions = ", ".join(d["regionsLine"][:-1]) + " và " + d["regionsLine"][-1]
    lines.append(f"Chào bạn! Đây là bảng tin tuyển dụng tổng hợp ngày {d['date'][:5]}, việc làm mới tại {regions}.")
    st = d["stats"]
    s = f"Hôm nay có {st[0]['value']} vị trí đang tuyển"
    if len(st) > 1 and st[1]["value"].isdigit():
        s += f", ở {st[1]['value']} {st[1]['label'].splitlines()[0]}"
    if len(st) > 2:
        s += f". Hạn nộp muộn nhất là ngày {st[2]['value']}"
    lines.append(s + ". Cùng xem chi tiết nhé!")
    for i, lst in enumerate(d["lists"]):
        head = f"{'Đầu tiên là' if i == 0 else 'Tiếp theo,'} {title(lst['name'])}."
        jobs = [f"{j['pos']} tại {j['co']}, {salary(j['sal'])}." for j in lst["jobs"]]
        lines.append(fit([head] + jobs, f"Xem đủ {len(jobs)} vị trí trên màn hình nhé.", limit=190))
    if d.get("grid") and d["grid"]["cells"]:
        parts = ["Ở Miền Tây,"] + [f"{c['province']} cần {c['jobs'][0]['pos']}," for c in d["grid"]["cells"]]
        lines.append(fit(parts, "và nhiều cơ hội khác.", limit=170).replace(", và", " và"))
    lines.append(
        f"Inbox Fanpage hoặc nhắn Zalo số {phone(CONTACT['zalo'])} để nhận link ứng tuyển. "
        "Lưu ý, nhà tuyển dụng thật không bao giờ thu phí ứng viên."
    )
    return [spoken(x) for x in lines]


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


def voices():
    r = requests.get(VOICES_API, headers=_headers(), params={"language_code": "vi-VN", "limit": 100}, timeout=60)
    r.raise_for_status()
    for v in r.json()["result"]["voices"]:
        print(f"{v['code']}\t{v['name']}\t{v['gender']}")


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
    p.add_argument("--speed", type=float, default=float(os.environ.get("VBEE_SPEED", "1.05")))
    p.add_argument("--dry-run", action="store_true", help="chỉ in lời đọc, không gọi Vbee")
    a = p.parse_args(argv)
    data = json.loads(Path(a.json).read_text(encoding="utf-8"))
    lines = script(data)
    if a.dry_run:
        for i, line in enumerate(lines):
            print(f"[{i}] ({len(line)} ký tự) {line}")
        return 0
    slug = time.strftime("%Y%m%d-%H%M%S")
    folder = PUBLIC / "voice" / slug
    folder.mkdir(parents=True, exist_ok=True)
    data["voice"] = []
    for i, line in enumerate(lines):
        f = folder / f"{i}.mp3"
        tts(line, a.voice, f, a.speed)
        data["voice"].append({"src": f"voice/{slug}/{i}.mp3", "dur": round(duration(f), 2), "text": line})
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
