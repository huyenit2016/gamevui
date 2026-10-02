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
- [x] **Game 2 người** (cùng máy): Pong ✔, Xe tăng đối kháng ✔ (còn: bắn tàu, đua xe 2 người, đấu kiếm…)
- [x] **Hành động**: Diệt zombie ✔, Bắn cung ✔, Xạ thủ bắn tỉa ✔, Không chiến ✔
- [x] **Thể thao**: Đá phạt đền ✔, Bóng rổ ✔, Bida ✔, Bowling ✔
- [x] **Mô phỏng**: Nông trại ✔, Tiệm bánh ✔, Nhà bếp nhỏ ✔ (còn: bán hàng)
- [x] **Toán & chữ**: Toán nhanh ✔, Đố từ vựng ✔, Ghép chữ ✔
- [x] **Sáng tạo**: Tô màu theo số ✔, Vẽ & trang trí ✔, Thời trang công chúa ✔ (còn: trang điểm, làm tóc, làm móng)
- [x] **Đua xe** ✔, **Ăn kẹo (kiểu Pac-Man)** ✔, **Đặt bom (Bomberman)** ✔, **Người que chạy** ✔ (còn: Mario-like, Contra-like)
- [x] **Mê cung** ✔, **Đào vàng** ✔, **Thoát khỏi nhà ma** ✔ (còn: escape room nhiều phòng, chọc phá)

### Theo chủ đề & mùa lễ
- [x] **Lễ hội**: Hứng lì xì Tết ✔, Bầu cua tôm cá (xu ảo) ✔, Ghép đôi Valentine ✔, Noel giao quà ✔, Halloween nhặt kẹo ✔ (còn: gói bánh chưng, xếp người tuyết, nhà ma…)
- [ ] **Công chúa / Con gái / Chú khỉ buồn / Trẻ em** (nhóm bé)
- [ ] **Game Anime, Naruto, Pokemon, Pikachu (nối thú), Minecraft, Lego, 3D**
  *(lưu ý bản quyền: dùng ý tưởng/phong cách gần gũi, không dùng tên/hình nhân vật có bản quyền)*

### Loại khác
- [x] **Phòng thủ tháp** ✔, **Câu cá** ✔ (còn: đế chế, chiến binh, săn bắn, đột kích)
- [ ] **Âm nhạc / Kim cương / Chơi cờ (thêm cờ vây, cờ thú, cờ cá ngựa)**
- [x] **Giải đố IQ vui** ✔ (còn: game văn phòng giờ nghỉ, thêm game 2 người kiểu Y8)

### Đề xuất hệ thống thể loại (khi thêm nhiều game)
- [ ] Tab thể loại cuộn ngang có icon (thay chip hiện tại), thêm nhãn **Game Hot / Game Hay / Game Mới** lọc nhanh giống ảnh tham khảo.
- [ ] Mỗi game có nhiều thể loại (tag) thay vì một `cat`.
- [ ] Đo lượt chơi theo game (Firebase `stats/games`) để tự xếp "Hot / Hay".

## 🧰 Tiện ích mới đã thêm (tháng 10/2026)
- [x] Sổ chi tiêu · Theo dõi thói quen · Tính vay & tiết kiệm · Máy đếm nhịp (`js/tools-new.js`)
- [ ] Ý tưởng tiếp: mã QR, đổi tiền tệ (cần nguồn tỷ giá miễn phí), lịch âm, nhắc uống nước, đếm calo, ghi chú giọng nói.

## 👩‍🌾 Avatar nông trại – bản 2, 3 (MVP đã xong)
MVP (`js/games-avatarfarm.js`): nhân vật tuỳ biến, 8 cây, cấp độ, cửa hàng đồ, nhiệm vụ hằng ngày, điểm danh, lưu `localStorage`.
- [ ] Vật nuôi (gà, bò, lợn): cho ăn, thu trứng/sữa; thêm thành tựu.
- [ ] Trang trí kéo thả (hàng rào, cây cảnh, nhà kho) và thêm đồ avatar theo mùa lễ.
- [ ] Bộ sprite đẹp hơn (CC0 hoặc ảnh do chủ cung cấp) thay hình vẽ bằng canvas/emoji.
- [ ] Lưu đám mây Firebase `farms/<uid>`, ghé thăm bạn bè, bảng xếp hạng tuần (cần Rules mới + chống gian lận cơ bản).

## 🏘️ Làng Nông Vui – đã làm (tham khảo ý tưởng cơ chế từ game trồng trọt/làng phổ biến, KHÔNG dùng hình ảnh hay tên của họ)
- [x] Giai đoạn đầu: trồng rau, cây ăn quả (táo, cam, xoài thu nhiều lần), nuôi gà/vịt/bò/lợn/cừu, bán sản phẩm.
- [x] Sau 30 phút chơi: xây & trang trí nhà, câu cá, đua xe, cờ tỷ phú (3 máy), cày xu tự động, trò chơi có sẵn (thưởng xu theo điểm), thăm hàng xóm.
- [ ] Làng 3D/2.5D, thú cưng, sự kiện theo mùa, bản đồ nhiều khu, nhiệm vụ cốt truyện.
- [ ] Hàng xóm: nhắn tin/tặng quà, hái giúp, bảng xếp hạng tuần; cờ tỷ phú chơi online nhiều người thật.
- [ ] Đua xe nhiều người, đua kart 3D; bộ sprite đẹp hơn.
