// Phố Đêm 3D: game thế giới mở 3D (lái xe, nhiệm vụ, cảnh sát), trang riêng games/phodem3d/ (nhiều file ES module, Three.js cục bộ).
(function () {
  GV.register({
    id: 'phodem3d', type: 'game', cat: 'Hành động', name: 'Phố Đêm 3D', icon: '🌃',
    cover: 'img/cover-phodem3d.webp', coverS: 'img/cover-phodem3d-s.webp',
    desc: 'Thành phố mở 3D về đêm do GameVui tự xây: đi bộ, nhảy lên những chiếc xe đỗ bên đường, lái và drift giữa dòng xe AI, làm nhiệm vụ Giao hàng, Taxi, Đua phố để kiếm tiền, gây tai nạn thì cảnh sát truy đuổi, bị vây là bị bắt. Chu kỳ ngày đêm, radio, bản đồ nhỏ. Không máu me. Chơi bằng bàn phím hoặc cảm ứng. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/phodem3d/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🌃</div><p>Đang mở Phố Đêm 3D ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
