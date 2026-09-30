(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gv_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gv_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  const GV = window.GV = {
    items: [],
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

  function renderHome() {
    const chips = $('#chips');
    const list = cats();
    if (cat && !list.includes(cat)) cat = '';
    chips.innerHTML = list.length > 1 ? ['', ...list].map(c => `<button data-c="${GV.esc(c)}" class="${c === cat ? 'on' : ''}">${c || 'Mọi thể loại'}</button>`).join('') : '';
    const f = favs(), q = query.trim().toLowerCase();
    const items = GV.items.filter(i =>
      (tab === 'all' || (tab === 'fav' ? f.includes(i.id) : i.type === tab)) &&
      (!cat || i.cat === cat) &&
      (!q || (i.name + ' ' + i.desc + ' ' + i.cat).toLowerCase().includes(q)));
    $('#grid').innerHTML = items.map(i => `
      <a class="card" href="#/${i.type}/${i.id}">
        <span class="tag">${i.type === 'game' ? 'Game' : 'Tiện ích'}</span>
        <span class="fv" data-f="${i.id}" title="Yêu thích">${f.includes(i.id) ? '★' : '☆'}</span>
        <div class="ic">${i.icon}</div><h3>${GV.esc(i.name)}</h3><p>${GV.esc(i.desc)}</p>
      </a>`).join('');
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
      return;
    }
    $('#home').hidden = true; $('#view').hidden = false;
    document.title = item.name + ' – GameVui';
    $('#vtitle').textContent = item.icon + ' ' + item.name;
    const vf = $('#vfav');
    vf.textContent = favs().includes(item.id) ? '★' : '☆';
    vf.onclick = () => { toggleFav(item.id); vf.textContent = favs().includes(item.id) ? '★' : '☆'; };
    window.scrollTo(0, 0);
    try { cleanup = item.mount(stage) || null; }
    catch (e) { console.error(e); stage.innerHTML = '<p class="msg">Có lỗi khi tải: ' + GV.esc(e.message) + '</p>'; }
  }

  GV.start = function () {
    GV.items.sort((a, b) => (a.type === b.type ? 0 : a.type === 'game' ? -1 : 1));
    $('#tabs').addEventListener('click', e => { const t = e.target.dataset.t; if (t) { tab = t; cat = ''; renderHome(); } });
    $('#chips').addEventListener('click', e => { if (e.target.dataset.c !== undefined) { cat = e.target.dataset.c; renderHome(); } });
    $('#q').addEventListener('input', e => { query = e.target.value; if (location.hash.length > 2) location.hash = '#/'; else renderHome(); });
    $('#grid').addEventListener('click', e => {
      const f = e.target.closest('[data-f]');
      if (f) { e.preventDefault(); toggleFav(f.dataset.f); renderHome(); }
    });
    window.addEventListener('hashchange', route);
    route();
  };
})();
