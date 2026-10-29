// Ma Sói · Lời Nguyền Làng Sương (bản chơi 1 người cùng AI, ngoại tuyến): trang HTML độc lập trong games/masoi-vip/.
// Mở thẳng trang đó (location.replace → nút Back quay về trang trước, không kẹt vòng lặp), không nhúng vào khung chính.
(function () {
  GV.register({
    id: 'masoi-vip', type: 'game', cat: 'Nhập vai', name: 'Ma Sói VIP · Làng Sương', icon: '🐺',
    desc: 'Một mình cùng AI, hoàn toàn ngoại tuyến. Tìm ra Ma Sói trước khi quá muộn. Mở ở trang riêng toàn màn hình. (Muốn chơi cùng bạn bè: dùng "Ma Sói · Lời Nguyền Làng Sương" ở mục Nhiều người.)',
    mount(el) {
      const url = 'games/masoi-vip/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🐺</div><p>Đang mở Ma Sói VIP ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
