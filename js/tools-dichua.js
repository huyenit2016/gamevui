// Thẻ "Đi Chùa Online" trên OmniHub: dẫn sang chuyên trang app/dichuaonline/ (trang độc lập, có chế độ LIVE cho TikTok).
(function () {
  GV.register({
    id: 'dichua', type: 'tool', cat: 'Giải trí', name: 'Đi Chùa Online', icon: '🪷', desc: 'Bàn thờ Phật ảo: dâng hoa, thắp nhang, chuông mõ, nhạc thiền, lời nguyện realtime và kết nối livestream TikTok.',
    mount(el) {
      const url = 'app/dichuaonline/';
      el.innerHTML = `<div class="tool" style="text-align:center;max-width:560px"><div style="font-size:3rem">🪷</div><h2 style="margin:0">Đi Chùa Online</h2><p class="hint">Dâng hoa, thắp nhang, thỉnh chuông, gõ mõ, nghe nhạc thiền và gửi lời nguyện lành cùng mọi người. Có chế độ LIVE để phát trên TikTok: khi có người tặng quà, tên và ảnh đại diện hiện lên cùng một lời nguyện lành.</p><p><a class="btn" href="${url}">🪷 Vào chánh điện</a> <a class="btn ghost" href="${url}?live=1">📺 Chế độ LIVE</a></p></div>`;
      return () => {};
    }
  });
})();
