# 📝 Ghi chú phát triển sau (Backlog)

Những việc đã thống nhất là **để lại làm sau**. Đánh dấu `[x]` khi xong.

## Giao diện (UI)
- [ ] Thay emoji icon của 57 game/tiện ích bằng bộ icon/ảnh nghệ thuật riêng (hiện dùng emoji trên nền gradient theo thể loại).
- [ ] Ảnh minh hoạ thật cho thẻ game (cần cung cấp ảnh; đề xuất 16:10, WebP < 60 KB).
- [ ] Gắn skeleton loading (đã có sẵn class `.skel`) cho danh sách phòng online, thư viện khoá học, CMS.
- [ ] Bỏ emoji còn sót trong nội dung banner "Gợi ý cho bạn" (`js/ads.js`) và nút bên trong từng game.
- [ ] Đổi màu vẽ trên canvas của một số game cho khớp bảng màu mới (rắn, xếp hình…); không ảnh hưởng luật chơi.
- [ ] Trang bảng xếp hạng và hồ sơ người chơi (cần thiết kế dữ liệu Firebase trước — hiện chưa có).
- [ ] Thông báo (chuông) trên thanh đầu trang khi có tính năng thông báo thật.
- [ ] Chuyển trang 404/500 sang tông tối nếu muốn đồng bộ (đang giữ phong cách đỏ–vàng Tết).

## Bảo mật & vận hành
- [ ] Bắt xác minh email khi đăng ký; chặn đoán mã `setup/secret` (đổi/xoá sau khi có admin).
- [ ] Dọn phòng rác phía server (Cloud Function/cron) thay vì chỉ khi admin mở CMS.
- [ ] Repo private + deploy qua Cloudflare Pages/Netlify nếu muốn ẩn hẳn mã nguồn gốc.
- [ ] Điền thông tin liên hệ quảng cáo trong `js/ads-config.js` (`contact`) và tên chủ sở hữu trong `LICENSE`.

## Tính năng
- [ ] Lớp học 1-1: mã phòng dài hơn 4 số hoặc thêm mật khẩu phòng.
- [ ] Dọn các lớp "ma" cũ trong CMS (tab Phòng) sau khi dán Rules mới.
