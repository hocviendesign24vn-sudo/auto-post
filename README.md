# Auto Post - Tìm Việc Số

Tự động tìm tin tuyển dụng ở Cần Thơ, ĐBSCL và TP.HCM, dựng bài và đăng lên Facebook Fanpage, TikTok, YouTube Shorts lúc 8:00 và 14:00 (giờ Việt Nam).

Đường đăng chính: **Buffer** (`autopost/buffer.py`), ảnh/video lấy URL công khai từ nhánh `media` (`autopost/media.py`). Các module `facebook`, `youtube`, `make` là phương án dự phòng.

Dữ liệu và lịch đăng nằm trên Google Drive, thư mục **Auto Post** (sheet `Lich dang`, file quy tắc trong `00_Thuong hieu`).

## Cấu trúc

| Đường dẫn | Việc |
| --- | --- |
| `autopost/buffer.py` | Đăng lên Facebook, TikTok, YouTube qua Buffer GraphQL API |
| `autopost/media.py` | Đưa ảnh/video lên nhánh `media` để có URL công khai |
| `autopost/facebook.py` | Đăng ảnh, Reels, bình luận lên Fanpage qua Graph API |
| `autopost/make.py` | Gửi bài sang kịch bản Make.com để đăng Facebook (dùng thay Graph API) |
| `autopost/youtube.py` | Tải video Shorts lên YouTube qua YouTube Data API v3 |
| `render/render.js` | Dựng ảnh Facebook 1080x1350 và các khung video 1080x1920 từ JSON |
| `render/make_video.sh` | Ghép khung thành video MP4 dọc |
| `examples/sample-data.json` | Dữ liệu mẫu (7 tin thật ngày 26/10/2026) |
| `ROUTINE.md` | Hướng dẫn cho routine soạn bài và đăng bài |

## Biến môi trường

Đặt trong môi trường cloud của Claude (không commit vào repo):

| Biến | Ý nghĩa |
| --- | --- |
| `BUFFER_API_KEY` | Khóa API Buffer. Trên Claude nên lưu thành Network secret (host `api.buffer.com`, header `Authorization: Bearer <khóa>`) thay vì biến này |
| `FB_PAGE_ID` | ID Fanpage |
| `FB_PAGE_TOKEN` | Page Access Token dài hạn, quyền `pages_manage_posts` |
| `MAKE_WEBHOOK_URL` | Webhook kịch bản Make đăng Facebook (bí mật) |
| `YT_CLIENT_ID`, `YT_CLIENT_SECRET` | OAuth client của dự án Google Cloud |
| `YT_REFRESH_TOKEN` | Refresh token có quyền `youtube.upload` |

## Chạy thử

```bash
pip install -r requirements.txt
python -m autopost.facebook check
node render/render.js examples/sample-data.json out/
render/make_video.sh out/ out/post2_video.mp4
python -m autopost.facebook photo --image out/post1_facebook.png --caption-file caption.txt --draft
```

`--draft` tạo bài ẩn (ảnh) hoặc bản nháp (Reels), không hiện công khai.
