"""Tổng hợp hiệu quả các bài đã đăng qua Buffer (Facebook, TikTok, YouTube) trong N ngày gần nhất.

Số liệu lấy từ trường `metrics` của bài trong Buffer API (Buffer tự cập nhật vài giờ một lần,
xem `metricsUpdatedAt`). Lượt xem: YouTube/TikTok dùng `views`, Facebook dùng `impressions`.
Tương tác = reactions + comments + shares + clicks.

Ví dụ:
  python -m autopost.insights                    # 7 ngày, in bảng Markdown
  python -m autopost.insights --days 14 --json   # dữ liệu thô từng bài
"""

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from .buffer import gql

VN = ZoneInfo("Asia/Ho_Chi_Minh")
ENGAGE = ("reactions", "comments", "shares", "clicks")

POSTS = """
query($input: PostsInput!, $after: String) {
  posts(first: 50, after: $after, input: $input) {
    edges { node { id channelService sentAt externalLink metricsUpdatedAt text metrics { type value } } }
    pageInfo { hasNextPage endCursor }
  }
}
"""


def fetch(days):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    out = []
    for org in gql("query { account { organizations { id } } }")["account"]["organizations"]:
        after = None
        while True:
            data = gql(POSTS, {"input": {"organizationId": org["id"], "filter": {"status": ["sent"]}},
                               "after": after})["posts"]
            for edge in data["edges"]:
                n = edge["node"]
                if not n.get("sentAt"):
                    continue
                sent = datetime.fromisoformat(n["sentAt"].replace("Z", "+00:00"))
                if sent < since:
                    continue
                m = {x["type"]: x["value"] for x in n.get("metrics") or []}
                link = n.get("externalLink") or ""
                out.append({
                    "service": n["channelService"],
                    "sent_vn": sent.astimezone(VN).strftime("%Y-%m-%d %H:%M"),
                    "hour_vn": sent.astimezone(VN).hour,
                    "kind": "video" if any(k in link for k in ("/reel/", "/shorts/", "/video/", "watch?v=")) else "bài/ảnh",
                    "views": int(m.get("views", m.get("impressions", 0)) or 0),
                    "engagement": int(sum(m.get(k, 0) or 0 for k in ENGAGE)),
                    "watch_avg_s": m.get("averageTimeWatched"),
                    "link": link,
                    "title": (n.get("text") or "").split("\n")[0][:70],
                    "metrics_at": n.get("metricsUpdatedAt"),
                })
            if not data["pageInfo"]["hasNextPage"]:
                break
            after = data["pageInfo"]["endCursor"]
    return sorted(out, key=lambda p: p["sent_vn"])


def _table(rows, keyname, keyfn):
    agg = defaultdict(lambda: [0, 0, 0])
    for p in rows:
        a = agg[keyfn(p)]
        a[0] += 1
        a[1] += p["views"]
        a[2] += p["engagement"]
    lines = [f"| {keyname} | Bài | Lượt xem | TB xem/bài | Tương tác |", "|---|---|---|---|---|"]
    for k, (n, v, e) in sorted(agg.items(), key=lambda kv: -kv[1][1] / kv[1][0]):
        lines.append(f"| {k} | {n} | {v} | {v / n:.0f} | {e} |")
    return "\n".join(lines)


def slot(p):
    h = p["hour_vn"]
    if h < 5:
        return "đêm (0-5h)"
    if h < 11:
        return "sáng (5-11h)"
    if h < 14:
        return "trưa (11-14h)"
    return "chiều (14-18h)" if h < 18 else "tối (18-24h)"


def report(posts, days):
    if not posts:
        return f"Không có bài nào đăng trong {days} ngày qua."
    total_v = sum(p["views"] for p in posts)
    total_e = sum(p["engagement"] for p in posts)
    parts = [
        f"**{len(posts)} bài, {total_v} lượt xem, {total_e} tương tác** trong {days} ngày.",
        "## Theo kênh\n" + _table(posts, "Kênh", lambda p: p["service"]),
        "## Theo khung giờ đăng (giờ VN)\n" + _table(posts, "Khung giờ", slot),
        "## Theo kênh và khung giờ\n" + _table(posts, "Kênh / khung", lambda p: f"{p['service']} {slot(p)}"),
        "## Theo kiểu bài\n" + _table(posts, "Kiểu", lambda p: f"{p['service']} {p['kind']}"),
        "## 5 bài nhiều lượt xem nhất\n" + "\n".join(
            f"- {p['views']} xem, {p['engagement']} tương tác: [{p['title']}]({p['link']}) ({p['service']}, {p['sent_vn']})"
            for p in sorted(posts, key=lambda p: -p["views"])[:5]),
    ]
    zero = [p for p in posts if p["service"] == "tiktok" and not p["views"]]
    if zero and len(zero) == sum(p["service"] == "tiktok" for p in posts):
        parts.append("_Lưu ý: mọi bài TikTok đều 0 lượt xem trong Buffer, có thể Buffer chưa đồng bộ số liệu TikTok; nên đối chiếu trong TikTok Studio._")
    return "\n\n".join(parts)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--days", type=int, default=7)
    p.add_argument("--json", action="store_true", help="In dữ liệu thô từng bài")
    args = p.parse_args(argv)
    posts = fetch(args.days)
    print(json.dumps(posts, ensure_ascii=False, indent=2) if args.json else report(posts, args.days))
    return 0


if __name__ == "__main__":
    sys.exit(main())
