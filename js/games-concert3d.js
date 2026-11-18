// Concert 3D: bản mockup "VIBEVERSE – Neon Arena 3D" do chủ dự án gửi (1 tệp HTML, Three.js cục bộ), ở trang riêng games/concert3d/.
(function () {
  GV.register({
    id: 'concert3d', type: 'game', cat: 'Mô phỏng', name: 'Concert 3D', icon: '🎤',
    cover: 'img/cover-concert3d.webp', coverS: 'img/cover-concert3d-s.webp',
    desc: 'Đêm nhạc neon 3D VIBEVERSE: sân khấu tròn, màn hình hologram, khán đài hàng trăm khán giả. Đi lại, xoay camera, thả emote, lightstick, chat; Host đổi nguồn hologram (camera, video, HLS, YouTube), bật ánh sáng và confetti. Dùng trên máy tính, màn hình rộng từ 1024 px. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/concert3d/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🎤</div><p>Đang mở Concert 3D ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
