"""Tư liệu hình ảnh cho video bảng tin: cảnh quay thật làm nền từng cảnh và logo/ảnh bìa nhà tuyển dụng.

Cảnh quay lấy từ Mixkit (miễn phí, dùng thương mại không cần ghi nguồn), tải về video/public/broll/.
Logo, ảnh bìa lấy từ tin gốc trên CareerViet (trường "id" của từng tin là mã tin CareerViet, ví dụ 35C8A209).

Ví dụ:
  python3 render/tulieu.py broll out/props.json            # gán cảnh quay cho 9 cảnh của BangTinPro
  python3 render/tulieu.py broll out/props.json --set 2     # bộ cảnh thứ hai (đổi cho bài sau trong ngày)
  python3 render/tulieu.py logo examples/bangtin.json       # tải logo/ảnh bìa cho các tin có "id"
"""

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "video" / "public"
MIXKIT = "https://assets.mixkit.co/videos/{i}/{i}-720.mp4"
# Thứ tự cảnh BangTinPro: mở đầu, nhà tuyển dụng, ngành nghề, top lương, khu vực 1, khu vực 2, miền Tây, 3 bước, kết
SETS = [
    [41541, 914, 4547, 4801, 4067, 22033, 21950, 4919, 917],
    [4010, 918, 4648, 42648, 25480, 4872, 15596, 4915, 914],
]
# Ảnh bìa mặc định của CareerViet (công ty không có ảnh riêng) thì bỏ
DEFAULT_COVERS = {"fd049126a58d0f82fd3fde2c0360edaf"}


def _duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         check=True, capture_output=True, text=True).stdout
    return round(float(out), 2)


def broll(props, set_no=1):
    data = json.loads(Path(props).read_text(encoding="utf-8"))
    folder = PUBLIC / "broll"
    folder.mkdir(parents=True, exist_ok=True)
    data["broll"] = []
    for i in SETS[(set_no - 1) % len(SETS)]:
        f = folder / f"{i}.mp4"
        if not f.exists():
            r = requests.get(MIXKIT.format(i=i), timeout=120)
            r.raise_for_status()
            f.write_bytes(r.content)
        data["broll"].append({"src": f"broll/{i}.mp4", "dur": _duration(f)})
    Path(props).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _save_image(url, path):
    from PIL import Image
    r = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    if hashlib.md5(r.content).hexdigest() in DEFAULT_COVERS:
        return False
    path.write_bytes(r.content)
    im = Image.open(path)
    if im.format != "GIF" and max(im.size) > 900:
        im.thumbnail((900, 900))
        im.save(path)
    return True


def logo(json_path):
    sys.path.insert(0, str(ROOT))
    from autopost import careerviet
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    folder = PUBLIC / "media"
    folder.mkdir(parents=True, exist_ok=True)
    jobs = [j for l in data["lists"] for j in l["jobs"]] + [j for c in (data.get("grid") or {}).get("cells", []) for j in c["jobs"]]
    for j in jobs:
        if not j.get("id"):
            continue
        d = careerviet.detail(j["id"])
        for key, field in (("logo", "emp_logo"), ("cover", "emp_banner_cover")):
            url = d.get(field)
            if not url:
                continue
            path = folder / f"{j['id']}-{key}{Path(url.split('?')[0]).suffix.lower() or '.png'}"
            for _ in range(3):
                try:
                    if _save_image(url, path):
                        j[key] = f"media/{path.name}"
                    break
                except (requests.RequestException, OSError) as exc:
                    print(f"{j['id']} {key}: {exc}", file=sys.stderr)
    Path(json_path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main(argv=None):
    p = argparse.ArgumentParser(prog="render/tulieu.py")
    sub = p.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("broll")
    b.add_argument("props")
    b.add_argument("--set", type=int, default=1)
    g = sub.add_parser("logo")
    g.add_argument("json")
    a = p.parse_args(argv)
    if a.cmd == "broll":
        broll(a.props, a.set)
    else:
        logo(a.json)
    return 0


if __name__ == "__main__":
    sys.exit(main())
