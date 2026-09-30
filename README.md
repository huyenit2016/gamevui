# 🎮 GameVui

Web tĩnh 100% (HTML + CSS + JS thuần) gồm **22 game** và **20 tiện ích**. Không cần build, không cần npm – chạy thẳng từ GitHub Pages.

## Bật web public
1. Vào **Settings → Pages** của repo.
2. **Source**: *Deploy from a branch* → Branch: `main`, thư mục `/ (root)` → **Save**.
3. Sau ~1 phút web có tại `https://<user>.github.io/gamevui/`.

Chạy thử local: mở `index.html` bằng trình duyệt (hoặc `python3 -m http.server`).

## Danh sách
**Game:** Rắn săn mồi, Xếp hình (Tetris), Phá gạch, Chim bay, 2048, Lật hình, Dò mìn, Sudoku, Đoán số, Cờ ca-rô 3×3 (minimax), Cờ caro 5 ô, Kéo búa bao, Simon, Đập chuột chũi, Thử phản xạ, Xếp số 15, Connect 4, Gõ phím nhanh, Khủng long chạy, Đoán chữ, Lô tô, Lô tô 16 vé.

**Tiện ích:** Máy tính, Đổi đơn vị, Bấm giờ, Hẹn giờ, Pomodoro, Đồng hồ thế giới, Tính ngày & tuổi, Tính phần trăm, Đếm từ, Đổi kiểu chữ, Văn bản mẫu, JSON formatter, Base64/URL, Tạo mật khẩu, Việc cần làm, Ghi chú, Bảng màu, Vòng quay may mắn, Xúc xắc, BMI.

## Thêm game / tiện ích mới
Tạo file trong `js/`, thêm `<script>` vào `index.html`, rồi đăng ký:

```js
GV.register({
  id: 'demo', type: 'game', // hoặc 'tool'
  cat: 'Arcade', name: 'Tên', icon: '🎲', desc: 'Mô tả ngắn',
  mount(el) { el.innerHTML = 'Xin chào'; return () => { /* dọn dẹp khi thoát */ }; }
});
```

Kỷ lục, danh sách yêu thích, ghi chú… được lưu trong `localStorage` của trình duyệt.

Demo: https://huyenit2016.github.io/gamevui/
