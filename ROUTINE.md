# Hướng dẫn cho routine

## Routine soạn bài (20:00 mỗi tối)

1. Đọc file quy tắc `00_Thuong hieu/Quy tac noi dung tuyen dung` trên Drive. Quy tắc trong file đó luôn được ưu tiên.
2. Kiểm tra thư mục `01_Yeu cau rieng`: có yêu cầu mới thì làm yêu cầu đó trước.
3. Tìm tin tuyển dụng mới ở Cần Thơ, các tỉnh ĐBSCL và TP.HCM. Mở từng tin gốc, chỉ giữ tin còn hạn, có tên công ty, có cách ứng tuyển và không có dấu hiệu lừa đảo.
4. Bỏ tin đã có trong tab `Tin tuyen dung` (trùng link gốc) hoặc đã đăng trong 14 ngày.
5. Ghi tin đạt vào tab `Tin tuyen dung`.
6. Dùng mẫu thương hiệu D24 "Bảng tin tuyển dụng tổng hợp". Mỗi bài tạo một JSON theo `examples/bangtin-mau.json` (tên vị trí dưới khoảng 26 ký tự, mỗi danh sách tối đa 6 tin, ô ĐBSCL tối đa 4 tỉnh). Ảnh: `node render/bangtin.js <json> out/` (dùng `out/bangtin.png`). Video động có nhạc nền: `render/video.sh <json> out/video.mp4` (Remotion, khoảng 2 đến 3 phút). Bài 8:00 dùng ảnh; bài 14:00 dùng video với nhóm tin khác bài 8:00. Xem lại ảnh và vài khung video trước khi dùng. Thông tin liên hệ lấy từ `assets/brand.json`, không tự sửa.
7. Caption theo mẫu `examples/bai-mau-d24/`: Facebook có danh sách tin theo khu vực, khối liên hệ (hotline, Zalo, timviecso.vn, design24.vn, email), cảnh báo không thu phí và 10 đến 15 hashtag; TikTok 2 đến 3 câu kèm khoảng 10 hashtag; YouTube tiêu đề dưới 100 ký tự có #Shorts, mô tả có liên hệ và nguồn.
8. Tải ảnh, video, caption lên `03_Cho dang/<ngày>_<giờ>_<chủ đề>/` và thêm 2 dòng vào tab `Lich dang` với trạng thái `Cho dang`.

## Routine đăng bài (8:00 và 14:00)

1. Lấy dòng `Lich dang` đúng ngày và khung giờ, trạng thái `Cho dang`.
2. Tải file từ thư mục bài trên Drive.
3. Chạy `python -m autopost.media <file...> --folder <ngày>` để lấy URL công khai.
4. Lấy id kênh trong `channels.json` (kiểm tra lại bằng `python -m autopost.buffer channels` nếu đăng lỗi).
5. Đăng ngay qua Buffer cho từng kênh, luôn kèm `--service <mạng>`:
   - 8:00: Facebook, `--image-url`.
   - 14:00: TikTok và YouTube với `--video-url --title "<tiêu đề>"`; Facebook với `--video-url` (tự đăng dạng Reels).
6. Ghi id/link bài vào `Lich dang`, đổi trạng thái thành `Da dang`, chuyển thư mục bài sang `05_Da dang`, ghi giờ đăng vào tab `Tin tuyen dung`.
7. Kênh lỗi: ghi lỗi vào cột `Ghi chu / loi`, gửi email báo chủ Trang, không đăng lại quá 2 lần.

## Đăng timviecso.vn

### Đăng tự động khoảng 2 giờ một tin

Tác vụ Claude "Đăng timviecso.vn (2 giờ 1 tin)" chạy `python3 -m autopost.careerviet --max 1` mỗi 2 giờ (`.github/workflows/quet-tin.yml` chỉ để chạy tay): lấy tin mới nhất trên CareerViet có nơi làm việc chính ở Cần Thơ, ĐBSCL hoặc TP.HCM, chọn khu vực đang thiếu nhất trên trang theo tỉ lệ Cần Thơ 4 : ĐBSCL 3 : TP.HCM 2 (hòa thì ưu tiên Cần Thơ, rồi ĐBSCL; khu vực thiếu không có tin mới thì lấy khu vực kế), lọc cố định (còn hạn, có tên công ty, không có dấu hiệu thu phí, chưa có trên trang), tự gắn logo và link nguồn, đăng 1 tin. Không có tin mới thì chờ lượt sau.

### Gỡ tin hết hạn (mỗi ngày 0:23)

Tác vụ Claude "Gỡ tin hết hạn timviecso.vn" chạy `python3 -m autopost.timviecso expired --delete`: gỡ mọi tin có hạn nộp trước hôm nay (giờ Việt Nam). Tin không ghi hạn thì giữ. Chạy `expired` không có `--delete` để chỉ xem danh sách.

### Routine rà soát timviecso.vn (tạm dừng)

Tác vụ này đang tắt. Khi bật lại:

1. Chạy `python -m autopost.timviecso list` và lấy các tin đăng từ lần rà trước.
2. Với mỗi tin, mở link "Nguồn: ..." ở cuối mô tả. Gỡ tin (`python -m autopost.timviecso delete <id> --reason "..."`) nếu: tin gốc đã gỡ hoặc hết hạn, công ty đáng ngờ, có dấu hiệu thu phí hay lừa đảo, sai khu vực, hoặc nội dung lỗi nặng (trống, sai lương, sai công ty).
3. Tin chỉ có lỗi nhỏ (dòng thừa như "Phúc lợi:", yêu cầu phân biệt còn sót) thì gỡ rồi đăng lại bản đã sửa bằng `python -m autopost.timviecso post <file.json>`.
4. Đăng thêm tối đa 3 tin TP.HCM mới nhất đã xác minh, theo cách của tác vụ cũ: JSON theo mô tả đầu `autopost/timviecso.py`, `location` là `TP HCM`, tóm tắt bằng lời mình, `source` là link gốc, để trống logo để chương trình tự lấy.
5. Ghi các tin đã gỡ và lý do vào tab `Nhat ky timviecso` của sheet `Lich dang` (tạo tab nếu chưa có: Thời gian, Mã tin, Tiêu đề, Công ty, Việc làm, Lý do).

## Báo cáo hiệu quả hàng tuần (thứ Hai 8:41)

Tác vụ Claude "Báo cáo hiệu quả tuần" chạy `python3 -m autopost.insights --days 7` (số liệu `metrics` của bài trong Buffer: lượt xem, tương tác theo kênh, khung giờ, kiểu bài, top 5 bài), so với tuần trước (`--days 14`), rồi viết đề xuất giờ đăng và kiểu video vào `/mnt/project-files/auto-post/bao-cao/hieu-qua-tuan-<yyyy-mm-dd>.md`. Bài mới đăng dưới 24 giờ chưa đủ số liệu, không dùng để kết luận.
