"""Gửi bài sang kịch bản Make.com để Make đăng lên Facebook Fanpage.

Dùng khi chưa có Page Access Token riêng. Kịch bản Make gồm:
  Webhooks (Custom webhook) -> Google Drive (Download a file) -> Facebook Pages (đăng bài) -> Webhook response

Cần biến môi trường:
  MAKE_WEBHOOK_URL  địa chỉ webhook của kịch bản (giữ bí mật như mật khẩu)

Ví dụ:
  python -m autopost.make photo --drive-file-id 1AbC... --caption-file caption.txt
  python -m autopost.make video --drive-file-id 1AbC... --caption-file caption.txt
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

TIMEOUT = 300
RETRIES = 3


class MakeError(RuntimeError):
    pass


def send(kind, drive_file_id, caption, comment=""):
    """Gửi một bài sang Make. kind: photo hoặc video. Trả về nội dung Make phản hồi."""
    url = os.environ.get("MAKE_WEBHOOK_URL")
    if not url:
        raise MakeError("Thiếu MAKE_WEBHOOK_URL trong biến môi trường")
    payload = {"type": kind, "drive_file_id": drive_file_id, "caption": caption, "comment": comment}
    last = None
    for attempt in range(1, RETRIES + 1):
        try:
            resp = requests.post(url, json=payload, timeout=TIMEOUT)
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if resp.ok:
                try:
                    return resp.json()
                except ValueError:
                    return {"response": resp.text}
            if resp.status_code < 500 and resp.status_code != 429:
                raise MakeError(f"{resp.status_code}: {resp.text[:500]}")
            last = f"{resp.status_code} {resp.text[:300]}"
        time.sleep(2 ** attempt)
    raise MakeError(f"Lỗi sau {RETRIES} lần thử: {last}")


def main(argv=None):
    parser = argparse.ArgumentParser(prog="autopost.make")
    parser.add_argument("kind", choices=["photo", "video"])
    parser.add_argument("--drive-file-id", required=True)
    parser.add_argument("--caption-file", required=True)
    parser.add_argument("--comment", default="", help="bình luận thêm sau khi đăng (vd. link ứng tuyển)")
    args = parser.parse_args(argv)

    try:
        caption = Path(args.caption_file).read_text(encoding="utf-8").strip()
        out = send(args.kind, args.drive_file_id, caption, args.comment)
    except MakeError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, **out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
