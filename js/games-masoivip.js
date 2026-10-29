// Ma Sói · Lời Nguyền Làng Sương (bản chơi 1 người cùng AI, ngoại tuyến): trang HTML độc lập trong games/masoi-vip/, nhúng bằng iframe.
(function () {
  GV.register({
    id: 'masoi-vip', type: 'game', cat: 'Nhập vai', name: 'Ma Sói VIP · Làng Sương', icon: '🐺',
    desc: 'Một mình cùng AI, hoàn toàn ngoại tuyến. Tìm ra Ma Sói trước khi quá muộn. (Muốn chơi cùng bạn bè: dùng "Ma Sói · Lời Nguyền Làng Sương" ở mục Nhiều người.)',
    mount(el) {
      el.innerHTML = '<style>.mvf{width:100%;height:min(86dvh,900px);min-height:520px;border:0;border-radius:16px;background:#0b141b;display:block}@media(max-width:599px){.mvf{height:calc(100dvh - 190px);min-height:0;border-radius:12px}}</style><iframe class="mvf" title="Ma Sói · Lời Nguyền Làng Sương" src="games/masoi-vip/index.html" sandbox="allow-scripts allow-same-origin allow-modals allow-popups" allow="fullscreen" allowfullscreen></iframe>';
      return () => { const f = el.querySelector('iframe'); if (f) f.src = 'about:blank'; };
    }
  });
})();
