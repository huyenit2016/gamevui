// VIBEVERSE 3D: thế giới concert neon 3D (1 tệp HTML do chủ gửi, Three.js cục bộ), ở trang riêng games/vibeverse/.
(function () {
  GV.register({
    id: 'vibeverse', type: 'game', cat: 'Mô phỏng', name: 'VIBEVERSE 3D', icon: '🎧',
    cover: 'img/cover-vibeverse.webp', coverS: 'img/cover-vibeverse-s.webp',
    desc: 'Thế giới âm nhạc neon 3D: hoá thân nhân vật, đi lại, chạy, nhảy, vẫy tay, reo hò giữa đám đông concert, chat gần bạn bè (cùng trình duyệt hoặc qua máy chủ chat riêng) và dán link YouTube để phát trên màn hình sân khấu. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/vibeverse/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🎧</div><p>Đang mở VIBEVERSE 3D ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
