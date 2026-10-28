"""Quét tin mới nhất trên CareerViet (Cần Thơ, các tỉnh ĐBSCL, TP.HCM) rồi đăng lên timviecso.vn/design24/jobs.

Cân bằng khu vực: mỗi tin đăng vào khu vực đang thiếu nhất so với tỉ lệ mong muốn
(WEIGHT: Cần Thơ 4, ĐBSCL 3, TP.HCM 2, tức khoảng 45% / 33% / 22% số tin trên trang).
Hòa thì ưu tiên Cần Thơ, rồi ĐBSCL, rồi TP.HCM. Khu vực thiếu nhất không có tin mới thì lấy khu vực kế tiếp.

Chạy bằng GitHub Actions (.github/workflows/quet-tin.yml), không cần Claude. Lịch của GitHub
hay trễ, nên mỗi lần chạy giữ máy khoảng 50 phút và tự quét 5 phút một lần (--loop-minutes, --every).
Mỗi lượt đăng tối đa --max tin mới (mặc định 2, để tin lên đều); hết tin mới thì chờ lượt sau.
Tác vụ Claude mỗi giờ rà lại các tin đã đăng và gỡ tin có vấn đề.

Lọc cố định: còn hạn nộp, có tên công ty (bỏ tin ẩn danh), không có dấu hiệu thu phí,
chưa có trên trang (so link gốc và tên công ty + tiêu đề).

Ví dụ:
  python -m autopost.careerviet --dry-run
  python -m autopost.careerviet --max 2
  python -m autopost.careerviet --max 2 --loop-minutes 50 --every 5
"""

import argparse
import html
import json
import re
import sys
import time
from datetime import date, datetime

import requests

from autopost import timviecso

SITE = "https://careerviet.vn"
DETAIL = "https://internal-api.careerviet.vn/api/v1/js/jsk/jobs/detail/public"
HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 60
CAN_THO = 71
# An Giang, Bạc Liêu, Bến Tre, Cà Mau, Đồng Tháp, Hậu Giang, Kiên Giang, Sóc Trăng,
# Tiền Giang, Trà Vinh, Vĩnh Long, "Mekong Delta" (mã tỉnh của CareerViet; Long An đã nhập vào Tây Ninh).
MEKONG = [76, 781, 75, 78, 67, 780, 77, 79, 73, 74, 70, 1064]
HCM = 8
# Khu vực theo thứ tự ưu tiên: (nhãn location trên timviecso, mã tỉnh CareerViet, trọng số).
REGIONS = [
    ("TP Cần Thơ", [CAN_THO], 4),
    ("Đồng bằng sông Cửu Long", MEKONG, 3),
    ("TP HCM", [HCM], 2),
]
JOB_LINK = re.compile(r"/vi/tim-viec-lam/[a-z0-9-]+\.([0-9A-F]{8})\.html")
# Dấu hiệu tin đòi tiền người lao động.
SCAM = re.compile(r"đặt cọc|nộp phí|phí hồ sơ|phí đào tạo|phí đồng phục|đóng phí|chuyển khoản trước|"
                  r"việc nhẹ lương cao|không cần kinh nghiệm.{0,20}thu nhập khủng", re.I)
# Dòng có yêu cầu phân biệt thì bỏ khỏi tin.
BIASED = re.compile(r"ngoại hình|giới tính|chiều cao|cân nặng|độ tuổi|^\W*(nam|nữ)\b", re.I)


def list_ids(location_id):
    """Mã tin trên trang đầu của một tỉnh, kèm link tin."""
    resp = requests.get(f"{SITE}/viec-lam/tinh-l{location_id}-vi.html", headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return {m.group(1): SITE + m.group(0) for m in JOB_LINK.finditer(resp.text)}


def detail(job_id):
    resp = requests.get(DETAIL, params={"job_id": job_id, "user_id": "", "my_job": 0}, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json().get("data") or {}


def lines(raw):
    """HTML mô tả thành danh sách dòng, bỏ dấu đầu dòng và dòng có yêu cầu phân biệt."""
    text = re.sub(r"<\s*(br|/p|/li|/div|/h\d)[^>]*>", "\n", raw or "", flags=re.I)
    text = html.unescape(re.sub(r"<[^>]+>", "", text))
    out = []
    for line in text.splitlines():
        line = re.sub(r"^[\s\-–•·*+●○▪]+", "", line).strip()
        if line and not BIASED.search(line):
            out.append(line)
    return out


def money(d):
    lo, hi = d.get("job_from_salary") or 0, d.get("job_to_salary") or 0
    if d.get("job_salary_unit") != "vnd" or not (lo or hi):
        return "Thỏa thuận"
    fmt = lambda v: f"{v / 1e6:g}"
    if lo and hi:
        return f"{fmt(lo)} - {fmt(hi)} triệu"
    return f"Từ {fmt(lo)} triệu" if lo else f"Đến {fmt(hi)} triệu"


def experience(d):
    lo, hi = d.get("job_experience") or 0, d.get("job_to_experience") or 0
    if not d.get("job_is_experience") or not (lo or hi):
        return "Chưa cập nhật"
    return f"{lo} - {hi} năm" if lo and hi else f"Từ {lo or hi} năm"


def region_of(location_id):
    return next(r for r in REGIONS if location_id in r[1])


def to_job(d, link, location_id):
    """Chuyển tin CareerViet sang dạng tin của timviecso; trả về (tin, lý do loại)."""
    if d.get("job_is_public") == 0:
        return None, "tin không công khai"
    if d.get("location_id") not in region_of(location_id)[1]:
        return None, f"nơi làm việc chính ngoài khu vực ({d.get('location_name_vn')})"
    company = (d.get("emp_name") or d.get("job_contact_company") or "").strip()
    if not company or re.fullmatch(r"confidential|bảo mật|giấu tên|ẩn danh|công ty ẩn danh", company, re.I):
        return None, "không có tên công ty"
    deadline = (d.get("job_last_date") or "")[:10]
    if not deadline or deadline < date.today().isoformat():
        return None, "hết hạn"
    body = " ".join([d.get("job_content") or "", d.get("job_require_skill") or "", d.get("job_benefit") or ""])
    if SCAM.search(html.unescape(re.sub(r"<[^>]+>", " ", body))):
        return None, "có dấu hiệu thu phí"
    places = [w for w in d.get("job_workstation") or [] if w.get("location_id") == location_id] or d.get("job_workstation") or []
    industries = d.get("industries") or []
    job_type = d.get("job_type") or ""
    description = lines(d.get("job_content")) + ["Ứng tuyển: nộp đơn trực tiếp tại link tin gốc. Không mất phí."]
    return {
        "title": d.get("job_title", "").strip(),
        "originalTitle": d.get("job_title", "").strip(),
        "location": region_of(location_id)[0],
        "employer": {"name": company, "logo": d.get("emp_logo") or "",
                     "industry": industries[0]["industry_name_vn"] if industries else ""},
        "salary": money(d),
        "deadline": deadline,
        "workType": "Bán thời gian" if job_type[1:2] == "1" and job_type[:1] != "1" else "Toàn thời gian",
        "workingTime": (d.get("job_work_time") or "").strip() or "Chưa cập nhật",
        "experience": experience(d),
        "education": d.get("degree_name_vn") or "Chưa cập nhật",
        "quantity": 1,
        "address": "; ".join(w["emp_work_location"] for w in places[:2] if w.get("emp_work_location"))
                   or d.get("location_name_vn") or "Chưa cập nhật",
        "description": description,
        "requirements": lines(d.get("job_require_skill")) or ["Chưa cập nhật"],
        "benefits": [b["benefit_name_vn"] for b in d.get("benefits") or [] if b.get("benefit_name_vn")],
        "source": link,
    }, None


def region_order(counts):
    """Khu vực thiếu nhất so với trọng số đứng trước; hòa thì theo thứ tự ưu tiên."""
    return sorted(REGIONS, key=lambda r: (counts.get(r[0], 0) / r[2], REGIONS.index(r)))


def scan(max_posts, dry_run=False, max_checks=80):
    posted = timviecso.list_jobs()
    on_site = {m for j in posted for line in j.get("description") or [] for m in JOB_LINK.findall(line)}
    counts = {}
    for j in posted:
        counts[j.get("location")] = counts.get(j.get("location"), 0) + 1
    found = {}  # nhãn khu vực -> {mã tin: (link, mã tỉnh)}, chỉ quét khi cần
    checks, results, skipped = 0, [], []
    for _ in range(max_posts):
        posted_one = False
        for label, locs, _w in region_order(counts):
            if label not in found:
                found[label] = {}
                for loc in locs:
                    try:
                        for job_id, link in list_ids(loc).items():
                            found[label].setdefault(job_id, (link, loc))
                    except requests.RequestException as exc:
                        print(f"Bỏ qua tỉnh {loc}: {exc}", file=sys.stderr)
            # Mã tin CareerViet tăng dần theo thời gian đăng: mã lớn là tin mới.
            fresh = sorted((i for i in found[label] if i not in on_site), key=lambda i: int(i, 16), reverse=True)
            for job_id in fresh:
                if checks >= max_checks:
                    break
                checks += 1
                on_site.add(job_id)
                link, loc = found[label][job_id]
                try:
                    job, reason = to_job(detail(job_id), link, loc)
                except (requests.RequestException, ValueError) as exc:
                    job, reason = None, f"lỗi đọc tin: {exc}"
                if not job:
                    skipped.append({"link": link, "ly_do": reason})
                    continue
                res = timviecso.post_jobs([job], dry_run=dry_run)[0]
                results.append({**res, "khu_vuc": label})
                if res["status"] in ("da_dang", "thu"):
                    counts[label] = counts.get(label, 0) + 1
                    posted_one = True
                    break
            if posted_one:
                break
        if not posted_one:
            break
    return {"tin_tren_trang": counts, "ket_qua": results, "bo_qua": skipped}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--max", type=int, default=2, help="Số tin đăng tối đa mỗi lượt (mặc định 2)")
    p.add_argument("--dry-run", action="store_true", help="Chỉ in tin sẽ đăng, không đăng")
    p.add_argument("--loop-minutes", type=float, default=0, help="Chạy lặp trong bấy nhiêu phút (0 = quét một lần)")
    p.add_argument("--every", type=float, default=5, help="Khoảng cách giữa các lượt quét, phút")
    args = p.parse_args(argv)
    end = time.monotonic() + args.loop_minutes * 60
    errors = 0
    while True:
        start = time.monotonic()
        try:
            report = scan(args.max, dry_run=args.dry_run)
        except Exception as exc:  # một lượt lỗi (mạng, trang đổi) không được dừng cả vòng lặp
            report = {"loi": str(exc), "ket_qua": []}
        errors += sum(r["status"] == "loi" for r in report["ket_qua"]) + ("loi" in report)
        print(datetime.now().strftime("%H:%M:%S"), json.dumps(report, ensure_ascii=False), flush=True)
        wait = args.every * 60 - (time.monotonic() - start)
        if time.monotonic() + wait >= end:
            break
        time.sleep(max(0, wait))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
