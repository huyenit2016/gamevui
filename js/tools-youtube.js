// Xem YouTube: trình phát nhúng CHÍNH THỨC (youtube-nocookie.com) + chế độ cửa sổ nổi.
// Không chặn/lách quảng cáo (trái điều khoản YouTube) – quảng cáo do YouTube quyết định, muốn không quảng cáo hãy dùng YouTube Premium.
// Cửa sổ nổi: (1) mini player trong trang, kéo thả được, ở lại khi chuyển trang; (2) Picture-in-Picture thật (Document PiP, Chrome/Edge 116+).
(function () {
  const esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const ID = /^[\w-]{11}$/;
  const EMB = 'https://www.youtube-nocookie.com/embed/';
  function parse(t) {
    t = String(t || '').trim(); if (!t) return null;
    if (ID.test(t)) return { v: t };
    let u; try { u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t); } catch (e) { return null; }
    if (!/(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|^youtu\.be$/.test(u.hostname)) return null;
    const list = u.searchParams.get('list') || '', start = parseInt(u.searchParams.get('t') || u.searchParams.get('start') || '0', 10) || 0;
    let v = u.searchParams.get('v') || '';
    if (u.hostname === 'youtu.be') v = u.pathname.slice(1).split('/')[0];
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/); if (m) v = m[1];
    if (/^\/playlist/.test(u.pathname) && list) return { list };
    if (!ID.test(v)) return list ? { list } : null;
    return { v, list, start };
  }
  const src = (p, start, auto) => EMB + (p.v || 'videoseries') + '?' + new URLSearchParams(Object.assign({ rel: 0, playsinline: 1, enablejsapi: 1, autoplay: auto ? 1 : 0, origin: location.origin },
    p.list ? { list: p.list } : {}, start ? { start: Math.floor(start) } : {})).toString();

  // ----- trình phát dùng chung: sống ở <body> để không bị tải lại khi đổi trang/chế độ -----
  const P = GV.ytPlayer = GV.ytPlayer || { cur: null, time: 0, mode: 'hidden', slot: null, raf: 0, pip: null };
  function box() {
    let b = document.getElementById('ytfloat'); if (b) return b;
    b = document.createElement('div'); b.id = 'ytfloat'; b.hidden = true;
    b.innerHTML = `<style>
#ytfloat{position:fixed;z-index:70;background:#000;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px #000a;border:1px solid #ffffff22}
#ytfloat iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
#ytfloat.mini{width:min(340px,70vw);aspect-ratio:16/9;right:14px;bottom:86px;touch-action:none}
@media(min-width:600px){#ytfloat.mini{bottom:18px}}
#ytfloat .ytbar{display:none;position:absolute;left:0;right:0;top:0;z-index:2;height:30px;align-items:center;justify-content:space-between;padding:0 6px;background:linear-gradient(#000c,transparent);cursor:grab}
#ytfloat.mini .ytbar{display:flex}#ytfloat .ytbar span{font:600 11px system-ui;color:#fff;opacity:.85}
#ytfloat .ytbar button{border:0;background:#0009;color:#fff;border-radius:8px;width:26px;height:24px;margin-left:4px;cursor:pointer;font-size:13px}
</style><div class="ytbar"><span>YouTube</span><span><button data-a="open" title="Mở lại trang Xem YouTube">⤢</button><button data-a="x" title="Đóng">✕</button></span></div><iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="YouTube"></iframe>`;
    document.body.appendChild(b);
    b.querySelector('[data-a=x]').onclick = () => P.stop();
    b.querySelector('[data-a=open]').onclick = () => { location.hash = '#/tool/youtube'; };
    // kéo thả cửa sổ nhỏ
    const bar = b.querySelector('.ytbar'); let dr = null;
    bar.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; const r = b.getBoundingClientRect(); dr = { x: e.clientX - r.left, y: e.clientY - r.top }; bar.setPointerCapture(e.pointerId); });
    bar.addEventListener('pointermove', e => { if (!dr) return; b.style.left = Math.max(0, Math.min(innerWidth - b.offsetWidth, e.clientX - dr.x)) + 'px'; b.style.top = Math.max(0, Math.min(innerHeight - b.offsetHeight, e.clientY - dr.y)) + 'px'; b.style.right = b.style.bottom = 'auto'; });
    bar.addEventListener('pointerup', () => { dr = null; });
    // theo dõi thời điểm phát (để đổi chế độ không mất vị trí)
    window.addEventListener('message', e => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
      if (d && d.info && typeof d.info.currentTime === 'number') P.time = d.info.currentTime;
    });
    b.querySelector('iframe').addEventListener('load', e => { try { e.target.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*'); } catch (x) {} });
    return b;
  }
  P.play = function (p, start) {
    const b = box(), f = b.querySelector('iframe'); P.cur = p; P.time = start || 0; f.src = src(p, start, true); b.hidden = false;
  };
  P.reload = function () { if (!P.cur) return; const f = box().querySelector('iframe'); f.src = src(P.cur, P.time, true); };
  P.stop = function () { const b = box(); b.querySelector('iframe').src = 'about:blank'; b.hidden = true; P.cur = null; P.mode = 'hidden'; P.slot = null; cancelAnimationFrame(P.raf); if (P.pip) { try { P.pip.close(); } catch (e) {} } };
  P.setMode = function (m) {
    const b = box(); P.mode = m; b.classList.toggle('mini', m === 'mini');
    if (m === 'mini') { b.style.cssText = ''; b.style.zIndex = 70; cancelAnimationFrame(P.raf); P.slot = null; }
    else if (m === 'page') { const loop = () => { if (P.mode !== 'page') return; const s = P.slot && document.body.contains(P.slot) ? P.slot : null; if (s) { const r = s.getBoundingClientRect(); const st = b.style; st.left = r.left + 'px'; st.top = r.top + 'px'; st.width = r.width + 'px'; st.height = r.height + 'px'; st.right = st.bottom = 'auto'; st.borderRadius = '16px'; b.hidden = !P.cur; } P.raf = requestAnimationFrame(loop); }; cancelAnimationFrame(P.raf); loop(); }
  };
  P.pipOK = () => 'documentPictureInPicture' in window;
  P.openPip = async function () {
    if (!P.pipOK() || !P.cur) return false;
    try {
      const w = await documentPictureInPicture.requestWindow({ width: 480, height: 270 }); P.pip = w; const b = box();
      w.document.body.style.cssText = 'margin:0;background:#000;overflow:hidden'; const st = w.document.createElement('style'); st.textContent = '#ytfloat{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;border:0!important;border-radius:0!important}#ytfloat .ytbar{display:none!important}'; w.document.head.appendChild(st);
      w.document.body.appendChild(b); b.hidden = false; P.reload();
      w.addEventListener('pagehide', () => { P.pip = null; document.body.appendChild(b); P.setMode('mini'); P.reload(); });
      return true;
    } catch (e) { return false; }
  };

  const hist = () => GV.store.get('yt_hist', []), favs = () => GV.store.get('yt_fav', []);
  GV.register({
    id: 'youtube', type: 'tool', cat: 'Giải trí', name: 'Xem YouTube', icon: '▶️', desc: 'Dán link YouTube để xem bằng trình phát chính thức, có cửa sổ nổi (mini player / Picture-in-Picture) để vừa xem vừa dùng trang khác.',
    mount(el) {
      el.innerHTML = `<style>
.yt{width:100%;max-width:1100px;margin:0 auto;text-align:left}.yt *{box-sizing:border-box}
.yt .ytrow{display:flex;gap:10px}.yt .ytrow input{flex:1;min-width:0;height:46px;border-radius:12px;padding:0 14px;font-size:16px}.yt .ytrow .btn{height:46px}
.yt .ytslot{margin-top:14px;aspect-ratio:16/9;width:100%;border-radius:16px;background:radial-gradient(ellipse at center,#182b46,#050a12);display:grid;place-items:center;color:#94a3b8;text-align:center;padding:20px}
.yt .ytact{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.yt .ytact .btn{height:40px}
.yt .ytnote{font-size:.78rem;color:var(--mut);margin:6px 0 14px;line-height:1.5}
.yt .ytlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}.yt .ytlist button{display:flex;gap:10px;align-items:center;text-align:left;padding:8px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer;font:inherit;min-width:0}
.yt .ytlist img{width:80px;height:45px;border-radius:8px;object-fit:cover;flex:none;background:#000}.yt .ytlist span{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yt h4{margin:18px 0 8px}.yt .err{color:#fb7185;font-size:.85rem;min-height:1.2em;margin-top:6px}
</style><div class="yt"><div class="ytrow"><input id="ytu" type="text" inputmode="url" placeholder="Dán link YouTube hoặc ID video…" autocomplete="off"><button class="btn" id="ytgo">Phát</button></div><div class="err" id="yte"></div>
<div class="ytslot" id="yts"><div>▶️<br>Dán link video, Shorts hoặc playlist YouTube ở trên để xem.</div></div>
<div class="ytact"><button class="btn ghost" id="ytmini">⧉ Cửa sổ nhỏ</button><button class="btn ghost" id="ytpip" ${P.pipOK() ? '' : 'hidden'}>🗗 Picture-in-Picture</button><button class="btn ghost" id="ytfv">☆ Yêu thích</button></div>
<p class="ytnote">Dùng trình phát nhúng chính thức của YouTube (youtube-nocookie.com): OmniHub không chặn hay thay đổi quảng cáo – quảng cáo (nếu có) do YouTube/người đăng quyết định; muốn xem không quảng cáo hãy dùng YouTube Premium. Cửa sổ nhỏ ở lại khi bạn chuyển sang trang khác; kéo thanh trên cùng để di chuyển.${P.pipOK() ? '' : ' Trình duyệt này chưa hỗ trợ Picture-in-Picture cho video nhúng (cần Chrome/Edge 116+ trên máy tính) – hãy dùng "Cửa sổ nhỏ".'}</p>
<h4>Yêu thích</h4><div class="ytlist" id="ytf"></div><h4>Đã xem gần đây</h4><div class="ytlist" id="ytl"></div></div>`;
      const slot = $(el, '#yts'), err = $(el, '#yte');
      const card = x => `<button data-v="${esc(x.v || '')}" data-l="${esc(x.list || '')}">${x.v ? `<img loading="lazy" referrerpolicy="no-referrer" alt="" src="https://i.ytimg.com/vi/${esc(x.v)}/mqdefault.jpg">` : '<img alt="">'}<span>${esc(x.v ? x.v : 'Playlist ' + x.list)}</span></button>`;
      const paint = () => { $(el, '#ytf').innerHTML = favs().map(card).join('') || '<span class="ytnote">Chưa có.</span>'; $(el, '#ytl').innerHTML = hist().map(card).join('') || '<span class="ytnote">Chưa có.</span>'; const f = P.cur && favs().some(x => x.v === P.cur.v && (x.list || '') === (P.cur.list || '')); $(el, '#ytfv').textContent = f ? '★ Đã yêu thích' : '☆ Yêu thích'; };
      function go(p, start) {
        err.textContent = ''; if (!p) { err.textContent = 'Link không hợp lệ. Hãy dán link youtube.com / youtu.be hoặc ID 11 ký tự.'; return; }
        const h = hist().filter(x => !(x.v === p.v && (x.list || '') === (p.list || ''))); h.unshift({ v: p.v || '', list: p.list || '' }); GV.store.set('yt_hist', h.slice(0, 12));
        slot.innerHTML = ''; P.slot = slot; P.play(p, start || p.start || 0); P.setMode('page'); paint();
      }
      $(el, '#ytgo').onclick = () => go(parse($(el, '#ytu').value));
      $(el, '#ytu').addEventListener('keydown', e => { if (e.key === 'Enter') $(el, '#ytgo').click(); });
      el.addEventListener('click', e => { const b = e.target.closest('.ytlist button'); if (b) go(b.dataset.v ? { v: b.dataset.v, list: b.dataset.l } : { list: b.dataset.l }); });
      $(el, '#ytmini').onclick = () => { if (!P.cur) { err.textContent = 'Hãy phát một video trước.'; return; } P.setMode('mini'); slot.innerHTML = '<div>Đang phát ở cửa sổ nhỏ (góc màn hình).<br>Bấm ⤢ trên cửa sổ nhỏ để quay lại đây.</div>'; };
      $(el, '#ytpip').onclick = async () => { if (!P.cur) { err.textContent = 'Hãy phát một video trước.'; return; } P.setMode('mini'); const ok = await P.openPip(); if (!ok) err.textContent = 'Không mở được Picture-in-Picture, đã chuyển sang cửa sổ nhỏ.'; else slot.innerHTML = '<div>Đang phát trong cửa sổ Picture-in-Picture.</div>'; };
      $(el, '#ytfv').onclick = () => { if (!P.cur) return; let f = favs(); const i = f.findIndex(x => x.v === (P.cur.v || '') && (x.list || '') === (P.cur.list || '')); i >= 0 ? f.splice(i, 1) : f.unshift({ v: P.cur.v || '', list: P.cur.list || '' }); GV.store.set('yt_fav', f.slice(0, 30)); paint(); };
      // quay lại trang khi đang có video: gắn lại vào khung
      if (P.cur && P.mode !== 'hidden') { if (P.mode === 'mini') { P.setMode('page'); } P.slot = slot; slot.innerHTML = ''; P.setMode('page'); }
      const q = parse(new URLSearchParams(location.hash.split('?')[1] || '').get('v')); if (q) go(q);
      paint();
      return () => { if (P.cur && P.mode === 'page') { P.setMode('mini'); } };
    }
  });
})();
