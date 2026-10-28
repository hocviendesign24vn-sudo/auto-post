"""Đưa ảnh/video lên nhánh `media` của repo để có URL công khai cho Buffer.

Repo phải để Public thì URL raw.githubusercontent.com mới mở được không cần đăng nhập.

Ví dụ:
  python -m autopost.media out/post1_facebook.png out/post2_video.mp4 --folder 2026-10-27
"""

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = "ngminhthotech/auto-post"
BRANCH = "media"
RAW = f"https://raw.githubusercontent.com/{REPO}/{BRANCH}"


def _git(*args, cwd):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def publish(files, folder, repo_dir="."):
    """Commit các file vào media/<folder>/ trên nhánh media, đẩy lên và trả về URL công khai."""
    repo_dir = Path(repo_dir).resolve()
    tmp = Path(tempfile.mkdtemp(prefix="media-"))
    try:
        remote = _git("remote", "get-url", "origin", cwd=repo_dir)
        has_branch = bool(_git("ls-remote", "--heads", "origin", BRANCH, cwd=repo_dir))
        if has_branch:
            _git("clone", "--depth", "1", "--branch", BRANCH, remote, str(tmp), cwd=repo_dir)
        else:
            _git("init", "-q", "-b", BRANCH, cwd=tmp)
            _git("remote", "add", "origin", remote, cwd=tmp)
        dest = tmp / "media" / folder
        dest.mkdir(parents=True, exist_ok=True)
        urls = {}
        for f in files:
            src = Path(f)
            shutil.copy2(src, dest / src.name)
            urls[src.name] = f"{RAW}/media/{folder}/{src.name}"
        _git("add", "-A", cwd=tmp)
        _git("-c", "user.name=auto-post", "-c", "user.email=auto-post@users.noreply.github.com",
             "commit", "-q", "-m", f"Media {folder}", cwd=tmp)
        _git("push", "-q", "origin", BRANCH, cwd=tmp)
        return urls
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main(argv=None):
    parser = argparse.ArgumentParser(prog="autopost.media")
    parser.add_argument("files", nargs="+")
    parser.add_argument("--folder", required=True, help="thư mục con, vd. ngày đăng 2026-10-27")
    args = parser.parse_args(argv)
    try:
        urls = publish(args.files, args.folder)
    except subprocess.CalledProcessError as exc:
        print(json.dumps({"ok": False, "error": (exc.stderr or str(exc))[:500]}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, "urls": urls}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
