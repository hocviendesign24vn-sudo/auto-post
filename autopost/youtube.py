"""Tải video Shorts lên YouTube qua YouTube Data API v3.

Cần 3 biến môi trường (OAuth của dự án Google Cloud, quyền youtube.upload):
  YT_CLIENT_ID
  YT_CLIENT_SECRET
  YT_REFRESH_TOKEN

Ví dụ:
  python -m autopost.youtube check
  python -m autopost.youtube upload --video post.mp4 --title "..." --description-file mo-ta.txt --privacy private
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

TOKEN_URL = "https://oauth2.googleapis.com/token"
API = "https://www.googleapis.com/youtube/v3"
UPLOAD = "https://www.googleapis.com/upload/youtube/v3/videos"
TIMEOUT = 300
RETRIES = 3


class YouTubeError(RuntimeError):
    pass


def _access_token():
    keys = ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")
    missing = [k for k in keys if not os.environ.get(k)]
    if missing:
        raise YouTubeError(f"Thiếu biến môi trường: {', '.join(missing)}")
    resp = requests.post(
        TOKEN_URL,
        data={
            "client_id": os.environ["YT_CLIENT_ID"],
            "client_secret": os.environ["YT_CLIENT_SECRET"],
            "refresh_token": os.environ["YT_REFRESH_TOKEN"],
            "grant_type": "refresh_token",
        },
        timeout=60,
    )
    data = resp.json()
    if "access_token" not in data:
        raise YouTubeError(f"Không lấy được access token: {data.get('error_description') or data}")
    return data["access_token"]


def _call(method, url, token, **kwargs):
    """Gọi API, thử lại khi lỗi mạng hoặc lỗi 5xx."""
    last = None
    headers = {"Authorization": f"Bearer {token}", **kwargs.pop("headers", {})}
    for attempt in range(1, RETRIES + 1):
        try:
            resp = requests.request(method, url, headers=headers, timeout=TIMEOUT, **kwargs)
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if resp.status_code < 500:
                if not resp.ok:
                    raise YouTubeError(f"{resp.status_code}: {resp.text[:500]}")
                return resp
            last = f"{resp.status_code} {resp.text[:300]}"
        time.sleep(2 ** attempt)
    raise YouTubeError(f"Lỗi sau {RETRIES} lần thử: {last}")


def check():
    """Kiểm tra token và trả về tên kênh."""
    token = _access_token()
    items = _call("GET", f"{API}/channels", token, params={"part": "snippet", "mine": "true"}).json().get("items", [])
    if not items:
        raise YouTubeError("Tài khoản này chưa có kênh YouTube")
    return {"channel_id": items[0]["id"], "title": items[0]["snippet"]["title"]}


def upload(video_path, title, description, tags=(), privacy="public"):
    """Tải video lên theo kiểu resumable. privacy: public, unlisted hoặc private."""
    token = _access_token()
    meta = {
        "snippet": {"title": title[:100], "description": description, "tags": list(tags), "categoryId": "22"},
        "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False},
    }
    size = os.path.getsize(video_path)
    session = _call(
        "POST",
        UPLOAD,
        token,
        params={"uploadType": "resumable", "part": "snippet,status"},
        headers={
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": "video/mp4",
            "X-Upload-Content-Length": str(size),
        },
        data=json.dumps(meta),
    )
    with open(video_path, "rb") as fh:
        resp = _call("PUT", session.headers["Location"], token, headers={"Content-Type": "video/mp4"}, data=fh.read())
    video_id = resp.json()["id"]
    return {"video_id": video_id, "url": f"https://youtube.com/shorts/{video_id}"}


def main(argv=None):
    parser = argparse.ArgumentParser(prog="autopost.youtube")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check")
    u = sub.add_parser("upload")
    u.add_argument("--video", required=True)
    u.add_argument("--title", required=True)
    u.add_argument("--description-file", required=True)
    u.add_argument("--tags", default="", help="các thẻ, cách nhau bằng dấu phẩy")
    u.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"])
    args = parser.parse_args(argv)

    try:
        if args.cmd == "check":
            out = check()
        else:
            description = Path(args.description_file).read_text(encoding="utf-8").strip()
            tags = [t.strip() for t in args.tags.split(",") if t.strip()]
            out = upload(args.video, args.title, description, tags, args.privacy)
    except YouTubeError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, **out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
