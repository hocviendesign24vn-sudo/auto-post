"""Đăng bài lên Facebook, TikTok, YouTube qua Buffer GraphQL API.

Xác thực: tạo khóa ở https://publish.buffer.com/settings/api rồi lưu thành Network secret
của môi trường Claude (host api.buffer.com, header Authorization: Bearer <khóa>).
Chạy ở nơi khác thì đặt biến môi trường BUFFER_API_KEY.

Buffer không nhận file tải lên: ảnh/video phải có URL công khai, cố định (xem autopost/media.py).

Ví dụ:
  python -m autopost.buffer channels
  python -m autopost.buffer post --channel <id> --text-file caption.txt --video-url https://... --at 2026-10-27T07:00:00Z
  python -m autopost.buffer post --channel <id> --service youtube --title "..." --text-file mo-ta.txt --video-url https://... --draft
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
    # Khóa thường do Network secret của môi trường Claude gắn vào ở proxy;
    # BUFFER_API_KEY chỉ cần khi chạy ở nơi khác.
    key = os.environ.get("BUFFER_API_KEY")
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
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
    __typename
    ... on PostActionSuccess { post { id status dueAt } }
    ... on MutationError { message }
  }
}
"""

# Mã danh mục YouTube "Education"; Buffer bắt buộc có categoryId cho bài YouTube.
YOUTUBE_CATEGORY = "27"


def default_metadata(service, title=None, video=False):
    """Metadata tối thiểu Buffer yêu cầu cho từng mạng (đã kiểm chứng ngày 26/10/2026)."""
    if service == "facebook":
        return {"facebook": {"type": "reel" if video else "post"}}
    if service == "tiktok":
        return {"tiktok": {"title": title}} if title else None
    if service == "youtube":
        meta = {"categoryId": YOUTUBE_CATEGORY, "privacy": "public", "madeForKids": False}
        if title:
            meta["title"] = title[:100]
        return {"youtube": meta}
    return None


def create_post(channel_id, text, image_url=None, video_url=None, due_at=None, metadata=None, draft=False):
    """Tạo bài. Có due_at (ISO 8601, UTC) thì hẹn giờ, không có thì đăng ngay; draft=True chỉ lưu nháp."""
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
        "needsApproval": False,
    }
    if draft:
        payload.update(mode="addToQueue", saveToDraft=True)
    elif due_at:
        payload.update(mode="customScheduled", dueAt=due_at)
    else:
        payload["mode"] = "shareNow"
    if metadata:
        payload["metadata"] = metadata
    result = gql(CREATE_POST, {"input": payload})["createPost"]
    if "post" not in result:
        raise BufferError(f"{result.get('__typename')}: {result.get('message')}")
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
    p.add_argument("--service", choices=["facebook", "tiktok", "youtube"], help="tự thêm metadata bắt buộc của mạng này")
    p.add_argument("--title", help="tiêu đề video (TikTok, YouTube)")
    p.add_argument("--metadata", help="JSON metadata tự đặt, ghi đè --service")
    p.add_argument("--draft", action="store_true", help="chỉ lưu nháp trong Buffer, không đăng")
    args = parser.parse_args(argv)

    try:
        if args.cmd == "channels":
            out = {"channels": channels()}
        else:
            text = Path(args.text_file).read_text(encoding="utf-8").strip()
            if args.metadata:
                meta = json.loads(args.metadata)
            elif args.service:
                meta = default_metadata(args.service, args.title, video=bool(args.video_url))
            else:
                meta = None
            out = {"post": create_post(args.channel, text, args.image_url, args.video_url, args.at, meta, args.draft)}
    except BufferError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, **out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
