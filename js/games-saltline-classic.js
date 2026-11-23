// Saltline 3D · Classic: bản Saltline gốc (1 tệp HTML do chủ dự án Huyen tạo, © 2026 Huyen), ở trang riêng games/saltline-classic/.
(function () {
  GV.register({
    id: 'saltline-classic', type: 'game', cat: 'Hành động', name: 'Saltline 3D · Classic', icon: '🚢',
    cover: 'img/cover-cangden3d.webp', coverS: 'img/cover-cangden3d-s.webp',
    desc: 'Bản Saltline gốc: bắn súng 3D góc nhìn thứ nhất ở bến cảng chiều mưa, cắt 3 trạm uplink rồi chạy ra tàu cứu hộ. Chơi bằng chuột phím, cảm ứng hoặc tay cầm. Muốn bản bản đồ chiến thuật thì chơi Saltline 3D 2.2. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/saltline-classic/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🚢</div><p>Đang mở Saltline 3D · Classic ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
