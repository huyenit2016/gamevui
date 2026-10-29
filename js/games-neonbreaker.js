// Neon Breaker: game phá gạch HTML độc lập (games/neon-breaker/ + app.json do chủ gửi), nhúng bằng iframe.
(function () {
  GV.register({
    id: 'neon-breaker', type: 'game', cat: 'Arcade', name: 'Neon Breaker', icon: '🧱',
    desc: 'Phá gạch giữa ngân hà với đồ họa neon rực rỡ.',
    mount(el) {
      el.innerHTML = '<style>.nbf{width:100%;height:min(84dvh,860px);min-height:480px;border:0;border-radius:16px;background:#05030f;display:block}@media(max-width:599px){.nbf{height:calc(100dvh - 190px);min-height:0}}</style><iframe class="nbf" title="Neon Breaker" src="games/neon-breaker/index.html" sandbox="allow-scripts allow-same-origin allow-modals" allow="fullscreen" allowfullscreen></iframe>';
      return () => { const f = el.querySelector('iframe'); if (f) f.src = 'about:blank'; };
    }
  });
})();
