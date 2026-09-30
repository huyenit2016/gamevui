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

## 🎮 Danh mục game sẽ phát triển thêm
Tham khảo từ một trang game lớn (ảnh bạn gửi). Hiện web có các nhóm: **Arcade, Trí tuệ, Phản xạ, Bàn cờ, Nhiều người (online), Học tập**, cùng nhóm tiện ích. Dưới đây là các danh mục **chưa có** — làm dần khi có thời gian, ưu tiên chọn game nhẹ, chơi được trên điện thoại.

### Ưu tiên cao (hợp với web hiện tại)
- [ ] **Game 2 người** (cùng máy): Pong, bắn tàu, đua xe 2 người, Đấu kiếm...
- [ ] **Hành động / Xạ thủ / Bắn tỉa / Bắn cung / Bắn Xe Tăng**
- [ ] **Bóng đá / Bóng rổ / Thể thao / Bida (Game Bida) / Bowling**
- [ ] **Nông trại / Nấu ăn / Làm bánh / Bán hàng** (game quản lý nhẹ, click-idle)
- [ ] **Toán học** (nhanh tay tính toán, điền số), **Học tiếng Anh** (thêm game từ vựng, ghép chữ)
- [ ] **Tô màu** (tô màu theo số / vẽ), **Trang trí / Thiết kế / Thời trang / Trang điểm / Làm tóc / Làm móng**
- [ ] **Đua xe**, **Phiêu lưu / Kinh điển** (Mario-like, Pac-Man, Bomberman, Contra-like)
- [ ] **Tìm lối thoát / Escape / Mê cung**, **Đào vàng**, **Chọc phá / Người que**

### Theo chủ đề & mùa lễ
- [ ] **Game Tết**, **Valentine / Tình yêu**, **Noel**, **Halloween / Kinh dị**
- [ ] **Công chúa / Con gái / Chú khỉ buồn / Trẻ em** (nhóm bé)
- [ ] **Game Anime, Naruto, Pokemon, Pikachu (nối thú), Minecraft, Lego, 3D**
  *(lưu ý bản quyền: dùng ý tưởng/phong cách gần gũi, không dùng tên/hình nhân vật có bản quyền)*

### Loại khác
- [ ] **Diệt Zombie, Phòng thủ (tower defense), Đế chế, Chiến binh, Chiến thuật, Đối kháng, Không chiến, Săn bắn, Đột kích**
- [ ] **Âm nhạc / Kim cương / Câu cá / Chơi cờ (thêm cờ vây, cờ thú, cờ cá ngựa) / Luyện trí nhớ**
- [ ] **Văn phòng** (mini game giải trí giờ nghỉ), **Giải đố IQ**, **Y8-style 2 người**

### Đề xuất hệ thống thể loại (khi thêm nhiều game)
- [ ] Tab thể loại cuộn ngang có icon (thay chip hiện tại), thêm nhãn **Game Hot / Game Hay / Game Mới** lọc nhanh giống ảnh tham khảo.
- [ ] Mỗi game có nhiều thể loại (tag) thay vì một `cat`.
- [ ] Đo lượt chơi theo game (Firebase `stats/games`) để tự xếp "Hot / Hay".
