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

  function cardHTML(i, f, big) {
    const badge = NEW().includes(i.id) ? '<span class="bdg new">NEW</span>' : (HOT().includes(i.id) ? '<span class="bdg hot">HOT</span>' : '');
    return `<a class="card${big ? ' big' : ''}" style="--h:${hue(i.cat)}" href="#/${i.type}/${i.id}">
      <span class="tag">${i.cat === 'Nhiều người' ? '🌐 Online' : i.cat === 'Học tập' ? '📚 Học tập' : i.type === 'game' ? 'Game' : 'Tiện ích'}</span>${badge}
      <span class="fv" data-f="${i.id}" title="Yêu thích">${f.includes(i.id) ? '★' : '☆'}</span>
      <div class="ic">${i.icon}</div><h3>${GV.esc(i.name)}</h3><p>${GV.esc(i.desc)}</p>${big ? '<span class="play">Chơi ngay ▶</span>' : ''}
    </a>`;
  }

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
    $('#hotwrap').hidden = !showcase; $('#hot').innerHTML = hot.map(i => cardHTML(i, f, true)).join('');
    const rec = store.get('recent', []).map(id => GV.items.find(i => i.id === id)).filter(Boolean).slice(0, 8);
    $('#recentwrap').hidden = !showcase || !rec.length; $('#recent').innerHTML = rec.map(i => cardHTML(i, f, true)).join('');
    $('.ticker').hidden = !showcase;
    const tr = $('#track'); if (showcase && !tr.dataset.done) { const em = GV.items.map(i => `<span>${i.icon}</span>`).join(''); tr.innerHTML = em + em; tr.dataset.done = 1; }
    let html;
    if (showcase) {
      const multi = items.filter(i => i.cat === 'Nhiều người'), games = items.filter(i => i.type === 'game' && i.cat !== 'Nhiều người'), learn = items.filter(i => i.cat === 'Học tập'), tools = items.filter(i => i.type === 'tool' && i.cat !== 'Học tập');
      const sec = (t, arr) => arr.length ? `<h2 class="sec span">${t} <small>${arr.length}</small></h2>` + arr.map(i => cardHTML(i, f)).join('') : '';
      const adSlot = '<div class="ad span" data-slot="inline"></div>';
      html = sec('👥 Chơi cùng bạn bè (online)', multi) + adSlot + sec('📚 Học tập – ngoại ngữ, AI, họp & dịch', learn) + sec('🎮 Game giải trí', games) + adSlot + sec('🧰 Tiện ích hằng ngày', tools);
    } else html = items.map(i => cardHTML(i, f)).join('');
    $('#grid').innerHTML = html;
    if (window.GV.ads) GV.ads.hydrate($('#home'));
    $('#empty').hidden = items.length > 0;
    $('#tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  }

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
    if (!item) {
      document.title = 'GameVui – Game & Tiện ích online';
      $('#view').hidden = true; $('#home').hidden = false;
      renderHome();
      if (GV.ads) GV.ads.hydrate(document.querySelector('footer'));
      return;
    }
    $('#home').hidden = true; $('#view').hidden = false;
    document.title = item.name + ' – GameVui';
    if (!visible(item)) { $('#vtitle').textContent = item.icon + ' ' + item.name; stage.innerHTML = '<p class="msg">🔧 Chức năng này đang tạm đóng để bảo trì. Bạn quay lại sau nhé!</p>'; return; }
    $('#vtitle').textContent = item.icon + ' ' + item.name;
    const vf = $('#vfav');
    vf.textContent = favs().includes(item.id) ? '★' : '☆';
    vf.onclick = () => { toggleFav(item.id); vf.textContent = favs().includes(item.id) ? '★' : '☆'; };
    window.scrollTo(0, 0);
    if (GV.ads) { const a = document.querySelector('#view .ad'); if (a) { a.removeAttribute('data-done'); a.innerHTML = ''; GV.ads.hydrate($('#view')); } }
    store.set('recent', [item.id, ...store.get('recent', []).filter(x => x !== item.id)].slice(0, 8));
    try { cleanup = item.mount(stage) || null; }
    catch (e) { console.error(e); stage.innerHTML = '<p class="msg">Có lỗi khi tải: ' + GV.esc(e.message) + '</p>'; }
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
    $('#rand').addEventListener('click', () => { const g = GV.items.filter(i => i.type === 'game' && i.cat !== 'Nhiều người'); const i = g[GV.rnd(g.length)]; location.hash = `#/game/${i.id}`; });
    $('#goOnline').addEventListener('click', () => { tab = 'game'; cat = 'Nhiều người'; query = ''; $('#q').value = ''; renderHome(); $('#tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('#home').addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    $('#theme').addEventListener('click', () => {
      const d = document.documentElement, dark = d.dataset.theme ? d.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      d.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('gv_theme', d.dataset.theme); } catch (e) {}
    });
    window.addEventListener('hashchange', route);
    route();
  };
})();
