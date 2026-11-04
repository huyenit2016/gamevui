// Lên Chùa Cầu An: game 3D (Three.js) độc lập trong games/lenchua/. Mở thẳng trang riêng toàn màn hình như Ma Sói VIP.
(function () {
  GV.register({
    id: 'lenchua', type: 'game', cat: 'Mô phỏng', name: 'Lên Chùa Cầu An', icon: '🪷',
    desc: 'Dạo chùa 3D lúc hoàng hôn: thắp hương, thỉnh chuông, gõ mõ tụng kinh, treo lời cầu an hay thả đèn hoa đăng, xin quẻ đầu năm. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/lenchua/index.html';
      el.innerHTML = `<div style="padding:40px 16px;text-align:center"><div style="font-size:3rem">🪷</div><p>Đang mở Lên Chùa Cầu An ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
