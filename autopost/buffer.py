"""Đăng bài lên Facebook, TikTok, YouTube qua Buffer GraphQL API.

Cần biến môi trường:
  BUFFER_API_KEY  khóa API tạo ở https://publish.buffer.com/settings/api

Buffer không nhận file tải lên: ảnh/video phải có URL công khai, cố định (xem autopost/media.py).

Ví dụ:
  python -m autopost.buffer channels
  python -m autopost.buffer post --channel <id> --text-file caption.txt --video-url https://... --at 2026-10-27T07:00:00Z
  python -m autopost.buffer post --channel <id> --text-file caption.txt --image-url https://... --metadata '{"youtube": {"title": "..."}}'
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

API = "https://api.buffer.com"
TIMEOUT = 120
RETRIES = 3


class BufferError(RuntimeError):
    pass


def gql(query, variables=None):
    """Gửi một truy vấn GraphQL, thử lại khi lỗi mạng, 429 hoặc 5xx."""
    key = os.environ.get("BUFFER_API_KEY")
    if not key:
        raise BufferError("Thiếu BUFFER_API_KEY trong biến môi trường")
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    last = None
    for attempt in range(1, RETRIES + 1):
        try:
            resp = requests.post(API, headers=headers, json={"query": query, "variables": variables or {}}, timeout=TIMEOUT)
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if resp.status_code < 500 and resp.status_code != 429:
                body = resp.json() if resp.content else {}
                if resp.ok and not body.get("errors"):
                    return body["data"]
                raise BufferError(f"{resp.status_code}: {json.dumps(body.get('errors') or body, ensure_ascii=False)[:800]}")
            last = f"{resp.status_code} {resp.text[:300]}"
        time.sleep(2 ** attempt)
    raise BufferError(f"Lỗi sau {RETRIES} lần thử: {last}")


def channels():
    """Liệt kê các kênh đã kết nối (id, tên, mạng) trong mọi tổ chức của tài khoản."""
    orgs = gql("query { account { organizations { id name } } }")["account"]["organizations"]
    out = []
    for org in orgs:
        data = gql(
            "query($org: OrganizationId!) { channels(input: {organizationId: $org}) { id name service } }",
            {"org": org["id"]},
        )["channels"]
        for ch in data:
            # Tài liệu Buffer ghi kiểu trả về có thể lồng một cấp; chấp nhận cả hai dạng.
            for item in ch if isinstance(ch, list) else [ch]:
                out.append({**item, "organization": org["name"]})
    return out


CREATE_POST = """
mutation($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id dueAt } }
    ... on MutationError { message }
  }
}
"""


def create_post(channel_id, text, image_url=None, video_url=None, due_at=None, metadata=None):
    """Tạo bài. Có due_at (ISO 8601, UTC) thì hẹn giờ, không có thì đăng ngay."""
    assets = []
    if image_url:
        assets.append({"image": {"url": image_url}})
    if video_url:
        assets.append({"video": {"url": video_url}})
    payload = {
        "channelId": channel_id,
        "text": text,
        "assets": assets,
        "schedulingType": "automatic",
        "mode": "customScheduled" if due_at else "shareNow",
    }
    if due_at:
        payload["dueAt"] = due_at
    if metadata:
        payload["metadata"] = metadata
    result = gql(CREATE_POST, {"input": payload})["createPost"]
    if "message" in result:
        raise BufferError(result["message"])
    return result["post"]


def main(argv=None):
    parser = argparse.ArgumentParser(prog="autopost.buffer")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("channels")
    p = sub.add_parser("post")
    p.add_argument("--channel", required=True)
    p.add_argument("--text-file", required=True)
    p.add_argument("--image-url")
    p.add_argument("--video-url")
    p.add_argument("--at", help="giờ đăng ISO 8601 UTC, bỏ trống để đăng ngay")
    p.add_argument("--metadata", help="JSON metadata theo mạng, vd. {\"youtube\": {\"title\": \"...\"}}")
    args = parser.parse_args(argv)

    try:
        if args.cmd == "channels":
            out = {"channels": channels()}
        else:
            text = Path(args.text_file).read_text(encoding="utf-8").strip()
            meta = json.loads(args.metadata) if args.metadata else None
            out = {"post": create_post(args.channel, text, args.image_url, args.video_url, args.at, meta)}
    except BufferError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, **out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
