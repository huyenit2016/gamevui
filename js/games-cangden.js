// Cảng Đen · Đột kích 3D: game bắn súng góc nhìn thứ nhất 3D (Three.js) trong bến cảng container đêm mưa, trang riêng games/cangden/.
(function () {
  GV.register({
    id: 'cangden', type: 'game', cat: 'Hành động', name: 'Cảng Đen · Đột kích 3D', icon: '⚓',
    desc: 'Bắn súng 3D góc nhìn thứ nhất giữa bến cảng đêm mưa: cắt 3 trạm điều khiển, hạ robot an ninh nổi loạn và chạy ra tàu cứu hộ. Mặt đường ướt, bloom, âm thanh tạo bằng code; chơi bằng chuột phím, cảm ứng hoặc tay cầm. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/cangden/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">⚓</div><p>Đang mở Cảng Đen ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
