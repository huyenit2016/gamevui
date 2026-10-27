// Hiển thị banner quảng cáo: AdSense (nếu cấu hình) → banner tự chèn → (không có thì không hiện gì).
(function () {
  const C = () => window.GV_ADS || { enabled: false };
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
    el.remove(); // chưa cấu hình AdSense/banner tự chèn → không hiện khối quảng cáo nào (đã bỏ banner "Gợi ý cho bạn")
  }
  GV.ads = { hydrate(root) { if (!C().enabled) { (root || document).querySelectorAll('.ad').forEach(e => e.remove()); return; } (root || document).querySelectorAll('.ad:not([data-done])').forEach(fill); } };
})();
