// TikSave: trang HTML độc lập (games/tiksave/index.html + app.json do chủ gửi) nhúng bằng iframe. Lấy dữ liệu qua API công khai tikwm.com.
(function () {
  GV.register({
    id: 'tiksave', type: 'tool', cat: 'Tiện ích', name: 'TikSave', icon: '🎵',
    desc: 'Dán link TikTok để tải video không logo hoặc tách nhạc MP3. Chỉ dùng cá nhân, tôn trọng bản quyền người sáng tạo.',
    mount(el) {
      el.innerHTML = '<style>.tsf{width:100%;height:min(80dvh,760px);min-height:480px;border:0;border-radius:16px;background:#0e0f13;display:block}@media(max-width:599px){.tsf{height:calc(100dvh - 190px);min-height:0}}</style><iframe class="tsf" title="TikSave" src="games/tiksave/index.html" sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-forms" allow="clipboard-read; clipboard-write"></iframe>';
      return () => { const f = el.querySelector('iframe'); if (f) f.src = 'about:blank'; };
    }
  });
})();
