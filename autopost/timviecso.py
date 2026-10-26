"""Đăng tin tuyển dụng lên trang https://timviecso.vn/design24/jobs.

Trang đó gửi tin qua API https://api.timviecso.vn/api/v1/job-postings (GET liệt kê, POST thêm,
DELETE xóa). Nếu máy chủ có khóa bảo vệ, lưu khóa thành Network secret của môi trường Claude
(host api.timviecso.vn) hoặc đặt biến môi trường TIMVIECSO_TOKEN khi chạy ở nơi khác.

File tin là JSON, một tin hoặc danh sách tin, cùng trường với form trên trang:
  {"title": "...", "location": "TP Cần Thơ", "employer": {"name": "...", "logo": "", "industry": "..."},
   "salary": "10 - 12 triệu", "deadline": "2026-11-30", "originalTitle": "...", "workType": "Toàn thời gian",
   "workingTime": "...", "experience": "...", "education": "...", "quantity": 1, "address": "...",
   "description": ["..."], "requirements": ["..."], "benefits": ["..."], "source": "https://link-tin-goc"}
"source" không có trên trang nên được ghi thành dòng "Nguồn: ..." cuối phần mô tả.
Để trống employer.logo thì logo được lấy từ ảnh og:image của tin gốc (CareerViet đặt logo công ty ở đó).

Ví dụ:
  python -m autopost.timviecso list
  python -m autopost.timviecso post tin.json --dry-run
  python -m autopost.timviecso post tin.json
  python -m autopost.timviecso delete <id> --reason "..."
"""

import argparse
import html
import json
import os
import re
import sys
import time
import unicodedata
from datetime import date

import requests

API = "https://api.timviecso.vn/api/v1/job-postings"
TIMEOUT = 60
RETRIES = 3
FIELDS = ["title", "location", "salary", "deadline", "originalTitle", "workType", "workingTime",
          "experience", "education", "address"]
REQUIRED = ["title", "location", "salary", "deadline"]


class TimviecsoError(RuntimeError):
    pass


def call(method, url, payload=None):
    """Gọi API, thử lại khi lỗi mạng, 429 hoặc 5xx."""
    headers = {"Content-Type": "application/json"}
    token = os.environ.get("TIMVIECSO_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    last = None
    for attempt in range(1, RETRIES + 1):
        try:
            resp = requests.request(method, url, headers=headers, json=payload, timeout=TIMEOUT)
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if resp.status_code < 500 and resp.status_code != 429:
                body = resp.json() if resp.content else {}
                if resp.ok and body.get("success") is not False:
                    return body.get("data")
                raise TimviecsoError(f"{resp.status_code}: {body.get('message') or body.get('messagge') or resp.text[:500]}")
            last = f"{resp.status_code} {resp.text[:300]}"
        time.sleep(2 ** attempt)
    raise TimviecsoError(f"Lỗi sau {RETRIES} lần thử: {last}")


def list_jobs():
    return call("GET", API) or []


# Ảnh chung của trang tuyển dụng, không phải logo công ty.
GENERIC_LOGO = re.compile(r"careerviet\.vn/(logo/|themes/|content/)|/_next/static/", re.I)


def find_logo(source_url):
    """Lấy URL logo công ty từ thẻ og:image của trang tin gốc; trả về "" nếu không có."""
    try:
        resp = requests.get(source_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException:
        return ""
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', resp.text) or \
        re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', resp.text)
    url = html.unescape(m.group(1)).strip() if m else ""
    return url if url.startswith("https://") and not GENERIC_LOGO.search(url) else ""


def _key(text):
    s = unicodedata.normalize("NFD", str(text or "")).encode("ascii", "ignore").decode().lower()
    return " ".join("".join(c if c.isalnum() else " " for c in s).split())


def job_key(job):
    """Khóa chống trùng: tên công ty + tiêu đề gốc."""
    return _key((job.get("employer") or {}).get("name")), _key(job.get("originalTitle") or job.get("title"))


def _lines(value):
    if isinstance(value, str):
        value = value.splitlines()
    return [str(v).strip() for v in value or [] if str(v).strip()]


def build_payload(job):
    """Chuẩn hóa một tin về đúng dạng form của trang gửi lên."""
    missing = [f for f in REQUIRED if not str(job.get(f) or "").strip()]
    if not str((job.get("employer") or {}).get("name") or "").strip():
        missing.append("employer.name")
    if missing:
        raise TimviecsoError(f"Thiếu trường {', '.join(missing)} ở tin: {job.get('title')}")
    out = {f: str(job.get(f) or "").strip() for f in FIELDS}
    out["deadline"] = out["deadline"][:10]
    if out["deadline"] < date.today().isoformat():
        raise TimviecsoError(f"Tin đã hết hạn ({out['deadline']}): {out['title']}")
    out["originalTitle"] = out["originalTitle"] or out["title"]
    emp = job["employer"]
    out["employer"] = {k: str(emp.get(k) or "").strip() for k in ("name", "logo", "industry")}
    out["quantity"] = max(1, int(job.get("quantity") or 1))
    out["description"] = _lines(job.get("description"))
    if job.get("source"):
        out["description"].append(f"Nguồn: {job['source'].strip()}")
    out["requirements"] = _lines(job.get("requirements"))
    out["benefits"] = list(dict.fromkeys(_lines(job.get("benefits"))))
    return out


def post_jobs(jobs, dry_run=False):
    """Đăng từng tin, bỏ tin đã có trên trang. Trả về danh sách kết quả từng tin."""
    seen = {job_key(j) for j in list_jobs()}
    results = []
    for job in jobs:
        title = job.get("title")
        try:
            emp = job.setdefault("employer", {})
            if not emp.get("logo") and job.get("source"):
                emp["logo"] = find_logo(job["source"])
            payload = build_payload(job)
            if job_key(payload) in seen:
                results.append({"title": title, "status": "trung"})
                continue
            if dry_run:
                results.append({"title": title, "status": "thu", "payload": payload})
            else:
                data = call("POST", API, payload) or {}
                results.append({"title": title, "status": "da_dang", "id": data.get("_id")})
            seen.add(job_key(payload))
        except TimviecsoError as exc:
            results.append({"title": title, "status": "loi", "error": str(exc)})
    return results


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="Liệt kê tin đang có trên trang")
    pp = sub.add_parser("post", help="Đăng tin từ file JSON")
    pp.add_argument("file")
    pp.add_argument("--dry-run", action="store_true", help="Chỉ kiểm tra và in nội dung, không đăng")
    pd = sub.add_parser("delete", help="Gỡ một tin khỏi trang")
    pd.add_argument("id")
    pd.add_argument("--reason", required=True, help="Lý do gỡ, in ra để ghi nhật ký")
    args = p.parse_args(argv)

    if args.cmd == "delete":
        call("DELETE", f"{API}/{args.id}")
        print(f"Đã gỡ {args.id}: {args.reason}")
        return 0

    if args.cmd == "list":
        for j in list_jobs():
            print(f"{j.get('_id')}  {j.get('createdAt', '')[:10]}  {j.get('location')}  |  {j.get('title')}  |  {(j.get('employer') or {}).get('name')}")
        return 0

    with open(args.file, encoding="utf-8") as f:
        data = json.load(f)
    results = post_jobs(data if isinstance(data, list) else [data], dry_run=args.dry_run)
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 1 if any(r["status"] == "loi" for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
