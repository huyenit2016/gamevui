// Sài Gòn Du Ký 3D: game 3D du lịch Thành phố Hồ Chí Minh chơi online, trang riêng games/saigon3d/ (nhiều file module, Three.js qua CDN).
// Mở thẳng trang riêng bằng location.replace để nút Back không kẹt vòng lặp.
(function () {
  GV.register({
    id: 'saigon3d', type: 'game', cat: 'Mô phỏng', name: 'Sài Gòn Du Ký 3D', icon: '🏙️',
    desc: 'Dạo quanh Thành phố Hồ Chí Minh 3D: check-in chợ Bến Thành, Nhà thờ Đức Bà, Dinh Độc Lập, Landmark 81…, hỏi đáp, thưởng thức ẩm thực đường phố, chụp ảnh và cùng bạn bè khám phá online. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/saigon3d/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🏙️</div><p>Đang mở Sài Gòn Du Ký 3D ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
