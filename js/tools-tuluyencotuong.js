// Tu Luyện Cờ Tướng: ứng dụng luyện cờ tướng 1 tệp HTML (chủ gửi), trang riêng app/tuluyencotuong/ (dữ liệu lưu localStorage trong chính trang).
(function () {
  GV.register({
    id: 'tuluyencotuong', type: 'tool', cat: 'Học tập', name: 'Tu Luyện Cờ Tướng', icon: '♟️',
    cover: 'img/cover-tuluyencotuong.webp', coverS: 'img/cover-tuluyencotuong-s.webp',
    desc: 'Luyện cờ tướng mỗi ngày: bài học, thế cờ tàn theo cấp độ, đấu với máy, quét và phân tích ván đã chơi, nhiệm vụ ngày, cấp bậc và chuỗi ngày luyện tập. Dữ liệu chỉ lưu trên máy bạn. Mở ở trang riêng.',
    mount(el) {
      const url = 'app/tuluyencotuong/';
      el.innerHTML = `<div class="tool" style="text-align:center;padding:40px 16px"><div style="font-size:3rem">♟️</div><p>Đang mở Tu Luyện Cờ Tướng ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
