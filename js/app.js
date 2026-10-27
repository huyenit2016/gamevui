(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gv_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gv_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  const GV = window.GV = {
    items: [],
    cfg: { hot: null, nw: null, off: [] },
    store,
    register(o) { this.items.push(o); },
    best(id) { return store.get('best_' + id, 0); },
    // Lưu kỷ lục. low=true nghĩa là điểm càng thấp càng tốt. Trả về true nếu phá kỷ lục.
    hooks: {}, // móc mở rộng: hooks.score(id, v) được gọi khi game ghi điểm cuối ván (Làng Nông Vui dùng để thưởng xu)
    setBest(id, v, low) {
      try { if (GV.hooks && GV.hooks.score) GV.hooks.score(id, v, low); } catch (e) {}
      const b = store.get('best_' + id, 0);
      if (!b || (low ? v < b : v > b)) { store.set('best_' + id, v); return true; }
      return false;
    },
    // Vuốt trên phần tử -> cb('left'|'right'|'up'|'down')
    swipe(el, cb) {
      let sx, sy;
      el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      el.addEventListener('touchend', e => {
        const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      }, { passive: true });
    },
    // Đăng ký phím, trả về hàm gỡ
    keys(fn, prevent = true) {
      const h = e => {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
        fn(e);
        if (prevent && (e.key.startsWith('Arrow') || e.key === ' ')) e.preventDefault();
      };
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    },
    // chỉ cho phép liên kết http(s) – chặn javascript:/data:
    safeUrl: u => /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '#',
    rnd: n => Math.floor(Math.random() * n),
    shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = GV.rnd(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; },
    esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    beep(freq = 440, ms = 120) {
      try {
        const A = GV._ac || (GV._ac = new (window.AudioContext || window.webkitAudioContext)());
        const o = A.createOscillator(), g = A.createGain();
        o.frequency.value = freq; g.gain.value = .08; o.connect(g); g.connect(A.destination);
        o.start(); o.stop(A.currentTime + ms / 1000);
      } catch (e) {}
    }
  };
  Object.assign(GV, window.GV_I18N || { t: k => k, lang: () => 'en', setLang() {}, i18nApply() {} });

  let tab = 'all', cat = '', query = '', cleanup = null;
  const favs = () => store.get('favs', []);

  function cats() {
    const set = new Set();
    GV.items.filter(i => tab === 'all' || tab === 'fav' || i.type === tab).forEach(i => set.add(i.cat));
    return [...set];
  }

  const hue = c => { let h = 0; for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };

  const DEF_HOT = ['avatarfarm', 'aitutor', 'lang', 'translator', 'lotoonline', 'masoi', 'uno', 'tienlen', 'chess', 'cotuong', 'loto16', 'snake', 'tetris'];
  const DEF_NEW = ['avatarfarm', 'cotyphu', 'aitutor', 'lang', 'coursemaker', 'translator', 'meeting', 'classroom', 'chess', 'cotuong', 'masoi', 'uno', 'tienlen', 'lotoonline', 'splitbill', 'teams', 'scoreboard'];
  const HOT = () => GV.cfg.hot || DEF_HOT, NEW = () => GV.cfg.nw || DEF_NEW;
  const isAdmin = () => !!(GV.account && GV.account.isAdmin);
  const visible = i => !GV.cfg.off.includes(i.id) || isAdmin();

  const tagOf = i => i.cat === 'Nhiều người' ? 'Online' : i.cat === 'Học tập' ? 'Học tập' : i.type === 'game' ? 'Game' : 'Tiện ích';
  // nhãn nút theo loại: game -> Chơi · học tập -> Học · tiện ích -> Dùng thử
  const verbOf = (i, big) => i.cat === 'Học tập' ? [big ? 'Học ngay' : 'Học', 'cap'] : i.type === 'game' ? [big ? 'Chơi ngay' : 'Chơi', 'play'] : ['Dùng thử', 'sparkles'];
  // variant: '' thẻ thường · 'big' thẻ lớn · 'feat' thẻ nổi bật (chiếm 2x2 trong "Đang hot")
  function cardHTML(i, f, variant) {
    const badge = NEW().includes(i.id) ? '<span class="bdg new">NEW</span>' : (HOT().includes(i.id) ? '<span class="bdg hot">HOT</span>' : '');
    const on = f.includes(i.id), v = variant === true ? 'big' : (variant || '');
    return `<a class="card${v ? ' ' + v : ''}" style="--h:${hue(i.cat)}" href="#/${i.type}/${i.id}" aria-label="${GV.esc(i.name)}">
      <div class="art"><span class="bg"></span><span class="ic" aria-hidden="true">${i.icon}</span>${badge}
        <span class="fv${on ? ' on' : ''}" data-f="${i.id}" role="button" tabindex="0" aria-pressed="${on}" aria-label="Yêu thích" title="Yêu thích">${GV.ic('star', 16, on)}</span></div>
      <div class="body"><span class="cat">${tagOf(i)}</span><h3>${GV.esc(i.name)}</h3><p>${GV.esc(i.desc)}</p><span class="go">${(([t, ic]) => GV.ic(ic, 14, ic === 'play') + t)(verbOf(i, !!v))}</span></div>
    </a>`;
  }
  // "Chơi gần đây": thẻ ngang gọn để khác hẳn "Đang hot"
  const recentHTML = i => `<a class="rc" style="--h:${hue(i.cat)}" href="#/${i.type}/${i.id}" aria-label="${verbOf(i)[0]}: ${GV.esc(i.name)}"><span class="rt" aria-hidden="true">${i.icon}</span><span class="rx"><b>${GV.esc(i.name)}</b><small>${tagOf(i)}</small></span><span class="rp">${GV.ic('play', 14, true)}</span></a>`;

  /* "Utility Workstation": các tiện ích nhỏ chạy ngay trong tab Tiện ích (QR, Pomodoro, Key, Đổi đơn vị) + khối System Inspector */
  let wsOff = [];
  const WS = ['omni-qr', 'pomodoro', 'omni-keygen', 'unit', 'stopwatch', 'timer', 'clock'];
  function unmountWS() { const w = $('#ws'); wsOff.forEach(f => { try { f && f(); } catch (e) {} }); wsOff = []; if (w) { w.innerHTML = ''; delete w.dataset.m; } }
  GV.unmountWS = unmountWS;
  function mountWS(w) {
    if (w.dataset.m) return; w.dataset.m = '1'; w.innerHTML = '';
    WS.forEach(id => { const it = GV.items.find(i => i.id === id); if (!it) return; const c = document.createElement('div'); c.className = 'wsc'; w.appendChild(c); try { wsOff.push(it.mount(c)); } catch (e) { console.warn(e); } });
    const c = document.createElement('div'); c.className = 'wsc'; w.appendChild(c);
    const rows = () => { let kb = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('gv_') === 0) kb += (k.length + (localStorage.getItem(k) || '').length) * 2; } } catch (e) {}
      return [[GV.t('ws.eng'), 'Vanilla JS + HTML5', ''], [GV.t('ws.gfx'), 'Canvas 2D · SVG', 'c'], [GV.t('ws.net'), GV.t(navigator.onLine ? 'ws.on' : 'ws.off'), navigator.onLine ? 'g' : 'r'], [GV.t('ws.lang'), GV.lang().toUpperCase(), ''], [GV.t('ws.vp'), innerWidth + 'x' + innerHeight, ''], [GV.t('ws.dpr'), String(+(devicePixelRatio || 1).toFixed(2)) + '×', ''], [GV.t('ws.store'), (kb / 1024).toFixed(1) + ' KB', 'a'], [GV.t('ws.items'), GV.items.length + ' items', 'c']]; };
    const paint = () => { c.innerHTML = '<div class="om s"><div class="omc"><div class="omh"><i>&lt;/&gt;</i><div><h3>' + GV.t('ws.insp') + '</h3></div></div><div class="insp">' + rows().map(r => '<div><span>' + GV.esc(r[0]) + '</span><b class="' + r[2] + '">' + GV.esc(r[1]) + '</b></div>').join('') + '</div></div></div>'; };
    paint(); const rs = () => paint(); addEventListener('resize', rs); addEventListener('online', rs); addEventListener('offline', rs);
    wsOff.push(() => { removeEventListener('resize', rs); removeEventListener('online', rs); removeEventListener('offline', rs); });
  }
  function renderHome() {
    const ng = GV.items.filter(i => i.type === 'game').length, online = GV.items.filter(i => i.cat === 'Nhiều người').length;
    // thẻ số liệu kiểu dashboard (dữ liệu thật của người chơi, lưu trên máy)
    const mxEl = $('#metrics');
    if (mxEl) {
      const fv = favs().length, rc = store.get('recent', []).map(id => GV.items.find(i => i.id === id)).filter(Boolean), learnN = GV.items.filter(i => i.cat === 'Học tập').length;
      const M = [['gamepad', GV.t('mx.lib'), ng, GV.t('mx.lib.s', { n: online }), 'c'], ['wrench', GV.t('mx.tool'), GV.items.length - ng, GV.t('mx.tool.s', { n: learnN }), 'p'], ['star', GV.t('mx.fav'), fv, GV.t(fv ? 'mx.fav.s1' : 'mx.fav.s0'), 'g'], ['clock', GV.t('mx.rec'), rc.length, rc[0] ? GV.esc(rc[0].name) : GV.t('mx.rec.s0'), 'a']];
      mxEl.innerHTML = M.map(([ic, l, v, sub, c]) => `<div class="tilt mxc ${c}"><div><small>${l}</small><b>${v}</b><span>${sub}</span></div><i class="mxi">${GV.ic(ic, 26)}</i></div>`).join('');
    }
    $('#stats').innerHTML = GV.t('st', { ng, tools: GV.items.length - ng, online });
    const chips = $('#chips');
    const list = cats();
    if (cat && !list.includes(cat)) cat = '';
    chips.innerHTML = list.length > 1 ? ['', ...list].map(c => `<button data-c="${GV.esc(c)}" class="${c === cat ? 'on' : ''}">${c || 'Mọi thể loại'}</button>`).join('') : '';
    const f = favs(), q = query.trim().toLowerCase();
    const items = GV.items.filter(i => visible(i) &&
      (tab === 'all' || (tab === 'fav' ? f.includes(i.id) : i.type === tab)) &&
      (!cat || i.cat === cat) &&
      (!q || (i.name + ' ' + i.desc + ' ' + i.cat).toLowerCase().includes(q)));
    const showcase = tab === 'all' && !cat && !q;
    const th = $('#thead'); if (th) th.hidden = !(tab === 'tool' && !q);
    const wsEl = $('#ws'), want = tab === 'tool' && !cat && !q;
    if (wsEl) { wsEl.hidden = !want; $('#allh').hidden = !want; if (want) mountWS(wsEl); else unmountWS(); }
    // khu nổi bật (chỉ hiện ở màn hình chính, chưa lọc)
    const hot = HOT().map(id => GV.items.find(i => i.id === id)).filter(i => i && visible(i));
    $('#hotwrap').hidden = !showcase; $('#hot').innerHTML = hot.slice(0, 9).map((i, k) => cardHTML(i, f, k === 0 ? 'feat' : '')).join('');
    const rec = store.get('recent', []).map(id => GV.items.find(i => i.id === id)).filter(Boolean).slice(0, 8);
    $('#recentwrap').hidden = !showcase || !rec.length; $('#recent').innerHTML = rec.map(recentHTML).join('');
    $('.ticker').hidden = true;
    const ha = $('#heroart'); if (ha) ha.innerHTML = (hot.length ? hot : GV.items).slice(0, 4).map((i, k) => `<a class="ht t${k}" style="--h:${hue(i.cat)}" href="#/${i.type}/${i.id}" tabindex="-1"><span>${i.icon}</span><b>${GV.esc(i.name)}</b></a>`).join('');
    let html;
    if (showcase) {
      const multi = items.filter(i => i.cat === 'Nhiều người'), games = items.filter(i => i.type === 'game' && i.cat !== 'Nhiều người'), learn = items.filter(i => i.cat === 'Học tập'), tools = items.filter(i => i.type === 'tool' && i.cat !== 'Học tập');
      const sec = (ic, t, arr, sub) => arr.length ? `<div class="sech span"><h2 class="sec">${GV.ic(ic, 22)}${t} <small>${arr.length}</small></h2>${sub ? `<p class="secsub">${sub}</p>` : ''}</div>` + arr.map(i => cardHTML(i, f)).join('') : '';
      const adSlot = '<div class="ad span" data-slot="inline"></div>';
      html = sec('users', 'Chơi cùng bạn bè', multi, 'Tạo phòng, gửi mã và chơi cùng nhau') + adSlot + sec('cap', 'Học tập', learn, 'Ngoại ngữ, trợ lý AI, phiên dịch và lớp học 1-1') + sec('gamepad', 'Game giải trí', games, 'Giải trí nhanh, chơi một mình hoặc thử thách kỷ lục') + adSlot + sec('wrench', 'Tiện ích hằng ngày', tools, 'Công cụ nhỏ – dùng là có ích');
    } else html = items.map(i => cardHTML(i, f)).join('');
    $('#grid').innerHTML = html;
    if (window.GV.ads) GV.ads.hydrate($('#home'));
    $('#empty').hidden = items.length > 0;
    $('#tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    markNav(cat === 'Nhiều người' ? 'online' : cat === 'Học tập' ? 'learn' : tab === 'tool' ? 'tool' : tab === 'game' ? 'game' : 'all');
  }
  const markNav = k => document.querySelectorAll('[data-go]').forEach(b => { const on = b.dataset.go === k; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
  // chuyển nhanh tới một bộ lọc của trang chủ (dùng cho menu trên cùng & thanh điều hướng dưới)
  GV.rerenderHome = () => { try { renderHome(); } catch (e) {} };
  GV.go = function (k) {
    const m = { all: ['all', ''], game: ['game', ''], online: ['game', 'Nhiều người'], learn: ['all', 'Học tập'], tool: ['tool', ''] }[k]; if (!m) return;
    tab = m[0]; cat = m[1]; query = ''; const q = $('#q'); if (q) q.value = '';
    if (location.hash.length > 2) location.hash = '#/'; else renderHome();
    // chọn mục lọc (không phải "Trang chủ") → cuộn tới danh sách để thấy ngay kết quả; Trang chủ → lên đầu
    setTimeout(() => { const t = k === 'all' ? null : $('#tabs'); window.scrollTo({ top: t ? Math.max(0, t.getBoundingClientRect().top + scrollY - 100) : 0, behavior: 'smooth' }); }, 60);
  };

  function toggleFav(id) {
    const f = favs(), i = f.indexOf(id);
    i >= 0 ? f.splice(i, 1) : f.push(id);
    store.set('favs', f);
  }

  /* CMS gộp vào web: #/cms[/<tab>] – nạp lười css/cms.css + registry/story-render/cms-story/cms.js lần đầu mở */
  let cmsP = null;
  function loadCMS() {
    if (cmsP) return cmsP;
    const root = $('#cmsroot'); root.innerHTML = '<div id="cms" data-embedded="1"><p class="hint" style="text-align:center;margin-top:40px">…</p></div>';
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'css/cms.css'; document.head.appendChild(css);
    const load = src => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = () => no(new Error(src)); document.head.appendChild(sc); });
    cmsP = ['js/registry.js', 'js/story-render.js', 'js/cms-story.js', 'js/cms.js'].reduce((p, f) => p.then(() => load(f)), Promise.resolve()).catch(e => { cmsP = null; root.innerHTML = '<p class="msg">Không tải được CMS: ' + GV.esc(e.message) + '</p>'; });
    return cmsP;
  }
  function route() {
    const isCms = /^#\/cms(\/|$)/.test(location.hash);
    $('#cmsview').hidden = !isCms;
    document.body.classList.toggle('cmsv', isCms);
    if (isCms) {
      unmountWS(); const stage0 = $('#stage'); stage0.innerHTML = ''; stage0.onclick = null; if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
      document.body.classList.remove('ingame', 'tv', 'novbar'); document.body.classList.add('omni');
      $('#home').hidden = true; $('#view').hidden = true; document.title = 'CMS – OmniHub';
      const pt = $('#ptitle span'); if (pt) { pt.setAttribute('data-i18n', 'title.cms'); pt.textContent = GV.t('title.cms'); }
      document.querySelectorAll('.rail button,.bnav button').forEach(b => b.classList.remove('on')); const nc = $('#navcms'); if (nc) nc.classList.add('on');
      window.scrollTo(0, 0); loadCMS(); return;
    }
    document.body.classList.remove('cms-app'); const nc0 = $('#navcms'); if (nc0) nc0.classList.remove('on');
    routeMain();
  }
  function routeMain() {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    const m = location.hash.match(/^#\/(game|tool)\/([\w-]+)/);
    const item = m && GV.items.find(i => i.id === m[2] && i.type === m[1]);
    const stage = $('#stage');
    stage.innerHTML = ''; stage.onclick = null;
    document.body.classList.toggle('ingame', !!item);
    if (item) unmountWS(); // rời trang chủ: gỡ widget (tránh trùng selector/timer ngầm)
    document.body.classList.toggle('omni', !item);
    document.body.classList.toggle('novbar', !!item);
    document.body.classList.toggle('tv', !!item && item.type === 'tool'); // trang tiện ích: áp giao diện "Utility Workstation" kính mờ + neon
    const pt = $('#ptitle span'); if (pt) { pt.textContent = item ? item.name : GV.t('title.home'); if (item) pt.removeAttribute('data-i18n'); else pt.setAttribute('data-i18n', 'title.home'); }
    document.querySelectorAll('.rail a.rl,.bnav a.rl').forEach(x => x.classList.toggle('on', !!item && x.getAttribute('href') === '#/' + item.type + '/' + item.id));
    if (!item) {
      document.title = 'OmniHub – Game & Tiện ích online';
      $('#view').hidden = true; $('#home').hidden = false;
      renderHome();
      if (GV.ads) GV.ads.hydrate(document.querySelector('footer'));
      return;
    }
    $('#home').hidden = true; $('#view').hidden = false; $('#view').style.setProperty('--h', hue(item.cat)); markNav('');
    document.title = item.name + ' – OmniHub';
    if (!visible(item)) { $('#vtitle').textContent = item.icon + ' ' + item.name; stage.innerHTML = '<p class="msg">🔧 Chức năng này đang tạm đóng để bảo trì. Bạn quay lại sau nhé!</p>'; return; }
    $('#vtitle').textContent = item.icon + ' ' + item.name;
    const vf = $('#vfav');
    const paintFav = () => { const on = favs().includes(item.id); vf.innerHTML = GV.ic('star', 18, on); vf.classList.toggle('on', on); vf.setAttribute('aria-pressed', on); };
    paintFav(); vf.onclick = () => { toggleFav(item.id); paintFav(); };
    window.scrollTo(0, 0);
    if (GV.ads) { const a = document.querySelector('#view .ad'); if (a) { a.removeAttribute('data-done'); a.innerHTML = ''; GV.ads.hydrate($('#view')); } }
    store.set('recent', [item.id, ...store.get('recent', []).filter(x => x !== item.id)].slice(0, 8));
    try { cleanup = item.mount(stage) || null; }
    catch (e) { console.error(e); stage.innerHTML = '<div class="msg" style="text-align:center">🤒 Ôi, chức năng này đang “đau bụng” một chút.<br><small>' + GV.esc(e.message) + '</small><br><br><button class="btn" onclick="location.reload()">🔄 Tải lại</button> <a class="btn ghost" href="#/">🏠 Về trang chủ</a></div>'; }
  }

  GV.rerender = () => { if (!$('#home').hidden) renderHome(); };
  GV.start = function () {
    GV.items.sort((a, b) => (a.type === b.type ? 0 : a.type === 'game' ? -1 : 1));
    $('#tabs').addEventListener('click', e => { const t = e.target.dataset.t; if (t) { tab = t; cat = ''; renderHome(); } });
    $('#chips').addEventListener('click', e => { if (e.target.dataset.c !== undefined) { cat = e.target.dataset.c; renderHome(); } });
    $('#q').addEventListener('input', e => { query = e.target.value; if (location.hash.length > 2) location.hash = '#/'; else renderHome(); });
    $('#home').addEventListener('click', e => {
      const f = e.target.closest('[data-f]');
      if (f) { e.preventDefault(); toggleFav(f.dataset.f); renderHome(); }
    });
    $('#home').addEventListener('keydown', e => { const f = e.target.closest && e.target.closest('[data-f]'); if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleFav(f.dataset.f); renderHome(); } });
    document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) GV.go(b.dataset.go); });
    $('#rand').addEventListener('click', () => { const g = GV.items.filter(i => i.type === 'game' && i.cat !== 'Nhiều người'); const i = g[GV.rnd(g.length)]; location.hash = `#/game/${i.id}`; });
    $('#goOnline').addEventListener('click', () => { const t = $('#tabs'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('#home').addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    $('#theme').addEventListener('click', () => {
      const d = document.documentElement, dark = d.dataset.theme !== 'light';
      d.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('gv_theme', d.dataset.theme); } catch (e) {}
    });
    window.addEventListener('hashchange', route);
    route();
  };
})();

/* Mobile đang chơi: trang bị khoá 1 màn hình. iOS/Chrome có thể đẩy cả trang lên khi mở bàn phím hoặc scrollIntoView → che đầu trang, trống đáy.
   Khi rời ô nhập, đóng bàn phím hoặc xoay màn hình thì trả document về vị trí 0 (nội dung cuộn riêng trong .stage). */
(function () {
  const back = () => { if (document.body.classList.contains('ingame') && innerWidth < 600) setTimeout(() => { if (window.scrollY || document.documentElement.scrollTop) window.scrollTo(0, 0); }, 80); };
  document.addEventListener('focusout', back); window.addEventListener('orientationchange', back);
  if (window.visualViewport) { let h = visualViewport.height; visualViewport.addEventListener('resize', () => { if (visualViewport.height > h) back(); h = visualViewport.height; }); }
  // không để document tự cuộn quá 1px khi đang chơi (trừ lúc bàn phím mở: có ô nhập đang focus)
  window.addEventListener('scroll', () => { const a = document.activeElement; if (document.body.classList.contains('ingame') && innerWidth < 600 && window.scrollY > 1 && !(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) window.scrollTo(0, 0); }, { passive: true });
})();

/* Hiệu ứng nghiêng 3D theo con trỏ cho các thẻ .tilt (chỉ chuột, tắt khi người dùng chọn giảm chuyển động) */
(function () {
  if (matchMedia('(hover:none)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  document.addEventListener('mousemove', e => {
    const c = e.target.closest && e.target.closest('.tilt'); if (!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(900px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg) translateZ(0)`;
  }, { passive: true });
  document.addEventListener('mouseout', e => { const c = e.target.closest && e.target.closest('.tilt'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
})();

/* Chuông thông báo (kiểu OmniHub): gợi ý mục mới + lối tắt; chấm báo chỉ hiện khi danh sách đổi so với lần bạn xem trước */
(function () {
  const $ = s => document.querySelector(s); let b = $('#bell'), box = $('#notifbox'); if (!b || !box) return;
  const build = () => {
    const nw = (GV.cfg && GV.cfg.nw) || ['langsuong', 'crypto-agent', 'english10', 'accumulating-merit'];
    const L = ['langsuong', 'crypto-agent', 'english10'].concat(nw).filter((id, i, a) => a.indexOf(id) === i).map(id => GV.items.find(x => x.id === id)).filter(Boolean).slice(0, 4);
    return L.map(i => `<a href="#/${i.type}/${i.id}"><span class="ni">${i.icon}</span><span><b>${GV.esc(i.name)}</b><small>${GV.esc((i.desc || '').slice(0, 70))}</small></span></a>`).join('') || '<p class="hint">' + GV.t('notif.none') + '</p>';
  };
  const sig = () => { try { return localStorage.getItem('gv_notif_seen') || ''; } catch (e) { return ''; } };
  const open = v => { box.hidden = !v; b.setAttribute('aria-expanded', v); if (v) { $('#nlist').innerHTML = build(); const k = $('#nlist').textContent.length + ':' + $('#nlist').querySelectorAll('a').length; try { localStorage.setItem('gv_notif_seen', k); } catch (e) {} $('#belldot').hidden = true; } };
  b.addEventListener('click', e => { e.stopPropagation(); open(box.hidden); });
  document.addEventListener('click', e => { if (!box.hidden && !e.target.closest('.notif')) open(false); });
  window.addEventListener('hashchange', () => open(false));
  setTimeout(() => { const tmp = document.createElement('div'); tmp.innerHTML = build(); const k = tmp.textContent.length + ':' + tmp.querySelectorAll('a').length; $('#belldot').hidden = sig() === k; }, 800);
})();

// đổi ngôn ngữ: vẽ lại phần có chữ sinh bằng JS (thẻ số liệu, dòng thống kê, tiêu đề)
document.addEventListener('gv:lang', () => { if (GV.unmountWS) GV.unmountWS(); if (GV.rerenderHome) GV.rerenderHome(); const pt = document.querySelector('#ptitle span'); if (pt && pt.dataset.i18n) pt.textContent = GV.t(pt.dataset.i18n); });
