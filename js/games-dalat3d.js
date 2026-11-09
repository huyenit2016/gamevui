// Đà Lạt Phố Hội 3D: game 3D online kinh doanh đồ ăn thức uống ở Quảng trường Lâm Viên, trang riêng games/dalat3d/ (nhiều file module, Three.js qua CDN).
(function () {
  GV.register({
    id: 'dalat3d', type: 'game', cat: 'Mô phỏng', name: 'Đà Lạt Phố Hội 3D', icon: '🌼',
    desc: 'Hoá thân tiểu thương ở Quảng trường Lâm Viên Đà Lạt: mua nguyên liệu ở chợ, chế biến khoai nướng, bánh tráng nướng, cà phê, dâu tây… và bán cho khách, bạn bè. Bản thử miễn phí, mua một lần để mở khoá đầy đủ. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/dalat3d/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🌼</div><p>Đang mở Đà Lạt Phố Hội 3D ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
