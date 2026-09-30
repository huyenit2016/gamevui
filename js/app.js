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
    setBest(id, v, low) {
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

  let tab = 'all', cat = '', query = '', cleanup = null;
  const favs = () => store.get('favs', []);

  function cats() {
    const set = new Set();
    GV.items.filter(i => tab === 'all' || tab === 'fav' || i.type === tab).forEach(i => set.add(i.cat));
    return [...set];
  }

  const hue = c => { let h = 0; for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };

  const DEF_HOT = ['aitutor', 'lang', 'translator', 'lotoonline', 'masoi', 'uno', 'tienlen', 'chess', 'cotuong', 'loto16', 'snake', 'tetris'];
  const DEF_NEW = ['aitutor', 'lang', 'coursemaker', 'translator', 'meeting', 'classroom', 'chess', 'cotuong', 'masoi', 'uno', 'tienlen', 'lotoonline', 'splitbill', 'teams', 'scoreboard'];
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

  function renderHome() {
    const ng = GV.items.filter(i => i.type === 'game').length, online = GV.items.filter(i => i.cat === 'Nhiều người').length;
    $('#stats').innerHTML = `<b>${ng}</b> game · <b>${GV.items.length - ng}</b> tiện ích · <b>${online}</b> game chơi cùng bạn bè · miễn phí, không cần cài đặt`;
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
  GV.go = function (k) {
    const m = { all: ['all', ''], game: ['game', ''], online: ['game', 'Nhiều người'], learn: ['all', 'Học tập'], tool: ['tool', ''] }[k]; if (!m) return;
    tab = m[0]; cat = m[1]; query = ''; const q = $('#q'); if (q) q.value = '';
    if (location.hash.length > 2) location.hash = '#/'; else renderHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function toggleFav(id) {
    const f = favs(), i = f.indexOf(id);
    i >= 0 ? f.splice(i, 1) : f.push(id);
    store.set('favs', f);
  }

  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    const m = location.hash.match(/^#\/(game|tool)\/([\w-]+)/);
    const item = m && GV.items.find(i => i.id === m[2] && i.type === m[1]);
    const stage = $('#stage');
    stage.innerHTML = ''; stage.onclick = null;
    document.body.classList.toggle('ingame', !!item);
    if (!item) {
      document.title = 'GameVui – Game & Tiện ích online';
      $('#view').hidden = true; $('#home').hidden = false;
      renderHome();
      if (GV.ads) GV.ads.hydrate(document.querySelector('footer'));
      return;
    }
    $('#home').hidden = true; $('#view').hidden = false; $('#view').style.setProperty('--h', hue(item.cat)); markNav('');
    document.title = item.name + ' – GameVui';
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
