// Hiển thị banner quảng cáo: AdSense (nếu cấu hình) → banner tự chèn → banner giới thiệu game của GameVui.
(function () {
  const C = () => window.GV_ADS || { enabled: false };
  const HOUSE = [
    { t: '🐺 Ma sói online – rủ hội đêm nay?', d: 'Sói cắn đêm, dân làng bỏ phiếu ban ngày. Có bot cho đủ người!', h: '#/game/masoi', c: 270 },
    { t: '🎱 Lô tô online – gọi số cả nhà cùng dò', d: 'Tạo phòng, gửi mã 4 số, chơi ngay với cả nhóm.', h: '#/game/lotoonline', c: 350 },
    { t: '♞ Cờ vua & ♟️ Cờ tướng online', d: 'Đấu với bạn bè hoặc thử sức với máy.', h: '#/game/chess', c: 30 },
    { t: '🃏 Uno – Tiến lên miền Nam online', d: 'Bài ngon, bot thông minh, chặt heo thả ga!', h: '#/game/uno', c: 160 },
    { t: '💸 Chia tiền nhóm sau buổi ăn', d: 'Không còn cãi nhau chuyện ai nợ ai.', h: '#/tool/splitbill', c: 150 }
  ];
  let adsLoaded = false;
  function loadAdsense(client) {
    if (adsLoaded) return; adsLoaded = true;
    const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
    document.head.appendChild(s);
  }
  const kind = n => ({ 'home-top': 'home', 'inline': 'inline', 'game': 'game', 'footer': 'footer' }[n] || 'inline');

  function fill(el) {
    const cfg = C(), slot = el.dataset.slot || 'inline';
    el.dataset.done = '1';
    const as = cfg.adsense || {}, sid = (as.slots || {})[kind(slot)];
    if (as.client && sid) { // Google AdSense
      loadAdsense(as.client);
      el.innerHTML = `<span class="adl">Quảng cáo</span><ins class="adsbygoogle" style="display:block" data-ad-client="${GV.esc(as.client)}" data-ad-slot="${GV.esc(sid)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      return;
    }
    const cu = (cfg.custom || []).filter(x => x && x.img && x.url);
    if (cu.length) { // banner tự chèn
      const b = cu[GV.rnd(cu.length)];
      el.innerHTML = `<span class="adl">Quảng cáo</span><a href="${GV.esc(GV.safeUrl(b.url))}" target="_blank" rel="sponsored noopener"><img src="${GV.esc(GV.safeUrl(b.img))}" alt="${GV.esc(b.alt || 'Quảng cáo')}" loading="lazy" style="max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto"></a>`;
      return;
    }
    const h = HOUSE[GV.rnd(HOUSE.length)]; // banner giới thiệu game của GameVui
    el.innerHTML = `<a class="house" href="${h.h}" style="--h:${h.c}"><span class="adl">Gợi ý cho bạn</span><b>${h.t}</b><span>${h.d}</span><em>${h.h.includes("/tool/") ? "Dùng thử" : "Chơi ngay"}</em></a>`;
  }
  GV.ads = { hydrate(root) { if (!C().enabled) { (root || document).querySelectorAll('.ad').forEach(e => e.remove()); return; } (root || document).querySelectorAll('.ad:not([data-done])').forEach(fill); } };
})();
