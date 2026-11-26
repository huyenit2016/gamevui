// The Haunted House – Căn Nhà Cuối Hẻm: game kinh dị sinh tồn FPS 3D (1 tệp HTML, Three.js cục bộ), trang riêng games/haunted-house/.
(function () {
  GV.register({
    id: 'haunted-house', type: 'game', cat: 'Hành động', name: 'The Haunted House', icon: '👻',
    cover: 'img/cover-haunted-house.webp', coverS: 'img/cover-haunted-house-s.webp',
    desc: 'Kinh dị sinh tồn góc nhìn thứ nhất trong căn nhà bỏ hoang kiểu Việt Nam, đêm mưa. Tìm đèn pin, mở khoá phòng thờ, giải mã 4 số, thu thập vật phẩm nghi lễ rồi xuống hầm giải thoát linh hồn. Hồn ma có AI nghe tiếng bước chân, nhìn thấy bạn trong tầm mắt, lục soát cả chỗ trốn. Âm thanh không gian, có lưu game. Dùng bàn phím + chuột, nên đeo tai nghe. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/haunted-house/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">👻</div><p>Đang mở The Haunted House ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
