// Saltline 3D: game FPS 3D một tệp HTML (bản gốc của bên thứ ba, chủ trang tải lên, giữ nguyên) ở trang riêng games/cangden3d/.
(function () {
  GV.register({
    id: 'cangden3d', type: 'game', cat: 'Hành động', name: 'Saltline 3D', icon: '🚢',
    desc: 'Bắn súng 3D góc nhìn thứ nhất ở bến cảng chiều mưa: cắt 3 trạm uplink rồi chạy ra tàu. Toàn bộ hình ảnh và âm thanh tạo bằng code trong một tệp HTML. Chơi bằng chuột phím, cảm ứng hoặc tay cầm. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/cangden3d/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🚢</div><p>Đang mở Saltline 3D ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
