"""Đăng bài lên Facebook Fanpage qua Graph API.

Cần 2 biến môi trường:
  FB_PAGE_ID     ID của Fanpage
  FB_PAGE_TOKEN  Page Access Token dài hạn (quyền pages_manage_posts)
Tùy chọn:
  FB_GRAPH_VERSION  mặc định v24.0

Ví dụ:
  python -m autopost.facebook check
  python -m autopost.facebook photo --image post.png --caption-file caption.txt --draft
  python -m autopost.facebook reel --video post.mp4 --caption-file caption.txt
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

GRAPH_VERSION = os.environ.get("FB_GRAPH_VERSION", "v24.0")
GRAPH = f"https://graph.facebook.com/{GRAPH_VERSION}"
RUPLOAD = f"https://rupload.facebook.com/video-upload/{GRAPH_VERSION}"
TIMEOUT = 120
RETRIES = 3


class FacebookError(RuntimeError):
    pass


def _creds():
    page_id = os.environ.get("FB_PAGE_ID")
    token = os.environ.get("FB_PAGE_TOKEN")
    if not page_id or not token:
        raise FacebookError("Thiếu FB_PAGE_ID hoặc FB_PAGE_TOKEN trong biến môi trường")
    return page_id, token


def _call(method, url, **kwargs):
    """Gọi API, thử lại khi lỗi mạng hoặc lỗi 5xx."""
    last = None
    for attempt in range(1, RETRIES + 1):
        try:
            resp = requests.request(method, url, timeout=TIMEOUT, **kwargs)
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if resp.status_code < 500:
                data = resp.json() if resp.content else {}
                if resp.ok and "error" not in data:
                    return data
                err = data.get("error", {})
                raise FacebookError(f"{resp.status_code} {err.get('type', '')}: {err.get('message', resp.text)}")
            last = f"{resp.status_code} {resp.text[:300]}"
        time.sleep(2 ** attempt)
    raise FacebookError(f"Lỗi sau {RETRIES} lần thử: {last}")


def check():
    """Kiểm tra token còn dùng được và đúng Trang."""
    page_id, token = _creds()
    return _call("GET", f"{GRAPH}/{page_id}", params={"fields": "id,name,link", "access_token": token})


def post_photo(image_path, caption, published=True):
    """Đăng một bài ảnh. published=False tạo bài ẩn để thử."""
    page_id, token = _creds()
    with open(image_path, "rb") as fh:
        data = _call(
            "POST",
            f"{GRAPH}/{page_id}/photos",
            data={"caption": caption, "published": str(published).lower(), "access_token": token},
            files={"source": (Path(image_path).name, fh, "image/png")},
        )
    return {"id": data.get("id"), "post_id": data.get("post_id")}


def post_reel(video_path, caption, state="PUBLISHED"):
    """Đăng Reels theo 3 bước: start, upload, finish. state=DRAFT để thử."""
    page_id, token = _creds()
    start = _call("POST", f"{GRAPH}/{page_id}/video_reels", data={"upload_phase": "start", "access_token": token})
    video_id = start["video_id"]
    size = os.path.getsize(video_path)
    with open(video_path, "rb") as fh:
        _call(
            "POST",
            f"{RUPLOAD}/{video_id}",
            headers={"Authorization": f"OAuth {token}", "offset": "0", "file_size": str(size)},
            data=fh.read(),
        )
    _call(
        "POST",
        f"{GRAPH}/{page_id}/video_reels",
        data={
            "upload_phase": "finish",
            "video_id": video_id,
            "video_state": state,
            "description": caption,
            "access_token": token,
        },
    )
    return {"video_id": video_id}


def comment(object_id, message):
    """Bình luận vào bài (dùng để thêm link ứng tuyển)."""
    _, token = _creds()
    return _call("POST", f"{GRAPH}/{object_id}/comments", data={"message": message, "access_token": token})


def main(argv=None):
    parser = argparse.ArgumentParser(prog="autopost.facebook")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check")
    p = sub.add_parser("photo")
    p.add_argument("--image", required=True)
    p.add_argument("--caption-file", required=True)
    p.add_argument("--draft", action="store_true", help="tạo bài ẩn, không hiện trên Trang")
    r = sub.add_parser("reel")
    r.add_argument("--video", required=True)
    r.add_argument("--caption-file", required=True)
    r.add_argument("--draft", action="store_true", help="lưu nháp, không đăng công khai")
    args = parser.parse_args(argv)

    try:
        if args.cmd == "check":
            out = check()
        elif args.cmd == "photo":
            caption = Path(args.caption_file).read_text(encoding="utf-8").strip()
            out = post_photo(args.image, caption, published=not args.draft)
        else:
            caption = Path(args.caption_file).read_text(encoding="utf-8").strip()
            out = post_reel(args.video, caption, state="DRAFT" if args.draft else "PUBLISHED")
    except FacebookError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, **out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
