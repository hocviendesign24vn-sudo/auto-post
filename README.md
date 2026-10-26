# Auto Post - Tìm Việc Số

Tự động tìm tin tuyển dụng ở Cần Thơ, ĐBSCL và TP.HCM, dựng bài và đăng lên Facebook Fanpage, TikTok, YouTube Shorts lúc 8:00 và 14:00 (giờ Việt Nam).

Dữ liệu và lịch đăng nằm trên Google Drive, thư mục **Auto Post** (sheet `Lich dang`, file quy tắc trong `00_Thuong hieu`).

## Cấu trúc

| Đường dẫn | Việc |
| --- | --- |
| `autopost/facebook.py` | Đăng ảnh, Reels, bình luận lên Fanpage qua Graph API |
| `render/render.js` | Dựng ảnh Facebook 1080x1350 và các khung video 1080x1920 từ JSON |
| `render/make_video.sh` | Ghép khung thành video MP4 dọc |
| `examples/sample-data.json` | Dữ liệu mẫu (7 tin thật ngày 26/10/2026) |
| `ROUTINE.md` | Hướng dẫn cho routine soạn bài và đăng bài |

## Biến môi trường

Đặt trong môi trường cloud của Claude (không commit vào repo):

| Biến | Ý nghĩa |
| --- | --- |
| `FB_PAGE_ID` | ID Fanpage |
| `FB_PAGE_TOKEN` | Page Access Token dài hạn, quyền `pages_manage_posts` |

## Chạy thử

```bash
pip install -r requirements.txt
python -m autopost.facebook check
node render/render.js examples/sample-data.json out/
render/make_video.sh out/ out/post2_video.mp4
python -m autopost.facebook photo --image out/post1_facebook.png --caption-file caption.txt --draft
```

`--draft` tạo bài ẩn (ảnh) hoặc bản nháp (Reels), không hiện công khai.
