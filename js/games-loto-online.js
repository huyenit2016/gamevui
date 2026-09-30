// Lô tô online nhiều người (Firebase Realtime Database + đăng nhập ẩn danh). Xem FIREBASE.md.
(function () {
  const V = '10.12.2';
  const SRC = ['app', 'auth', 'database'].map(m => `https://www.gstatic.com/firebasejs/${V}/firebase-${m}-compat.js`);
  const pad = n => String(n).padStart(2, '0');
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Không tải được thư viện Firebase (kiểm tra mạng)')); document.head.appendChild(s); });
  const toList = v => !v ? [] : Array.isArray(v) ? v.filter(x => x != null) : Object.keys(v).sort((a, b) => a - b).map(k => v[k]);
  const enc = ts => ts.map(t => t.map(r => r.join(',')).join(';')).join('|');
  const dec = str => !str ? [] : str.split('|').map(t => t.split(';').map(r => r.split(',').map(Number)));
  const getCfg = () => window.GV_FIREBASE || GV.store.get('fbcfg', null);
  const rowWon = (t, called) => t.some(row => row.filter(Boolean).every(n => called.has(n)));

  // Giải thích lỗi Firebase bằng tiếng Việt dễ hiểu
  function explain(e) {
    const c = (e && (e.code || '')) + ' ' + (e && e.message || '');
    if (/operation-not-allowed|admin-restricted/i.test(c)) return 'Chưa bật đăng nhập ẩn danh: Firebase → Authentication → Sign-in method → Anonymous → Enable.';
    if (/PERMISSION_DENIED|permission/i.test(c)) return 'Firebase từ chối quyền ghi: hãy dán lại Rules mới trong FIREBASE.md rồi Publish.';
    if (/unauthorized-domain/i.test(c)) return 'Tên miền chưa được cho phép: Authentication → Settings → Authorized domains → thêm huyenit2016.github.io.';
    if (/TIMEOUT/.test(c)) return 'Không kết nối được Realtime Database (quá 12 giây). Kiểm tra databaseURL trong js/firebase-config.js khớp địa chỉ ở trang Realtime Database, và database đã được tạo.';
    if (/api-key|invalid-api/i.test(c)) return 'apiKey không hợp lệ, kiểm tra lại js/firebase-config.js.';
    if (/network/i.test(c)) return 'Lỗi mạng, thử lại sau.';
    return 'Lỗi: ' + (e && e.message || e);
  }
  const timeout = (p, ms = 12000) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('TIMEOUT')), ms))]);

  let fbP = null;
  GV.fbInfo = () => ({ fb: () => fb(), explain, timeout, cfg: getCfg });
  function fb() {
    if (fbP) return fbP;
    fbP = (async () => {
      const cfg = getCfg(); if (!cfg || !cfg.databaseURL) throw new Error('Chưa có cấu hình Firebase');
      if (!window.firebase || !firebase.database) for (const s of SRC) await loadScript(s);
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      await timeout(firebase.auth().signInAnonymously());
      return { db: firebase.database(), uid: firebase.auth().currentUser.uid, TS: firebase.database.ServerValue.TIMESTAMP };
    })();
    fbP.catch(() => { fbP = null; });
    return fbP;
  }

  GV.register({
    id: 'lotoonline', type: 'game', cat: 'Nhiều người', name: 'Lô tô online', icon: '🌐', desc: 'Chơi lô tô nhiều người qua mạng bằng mã phòng.',
    mount(el) {
      let dead = false, unsub = null, timer = null, listOff = null, offVis = null;
      const $ = s => el.querySelector(s);
      const hashCode = () => (location.hash.match(/lotoonline\/(\d{4})/) || [])[1] || '';

      /* ---------- Màn hình thiết lập / vào phòng ---------- */
      function showSetup() {
        el.innerHTML = `<div class="tool"><h3 style="margin:0">⚙️ Cần cấu hình Firebase</h3>
        <p class="hint" style="text-align:left">Game online cần một dự án Firebase miễn phí (Realtime Database + Anonymous Auth). Làm theo hướng dẫn trong <b>FIREBASE.md</b> của repo, rồi dán khối <code>firebaseConfig</code> vào <code>js/firebase-config.js</code> — hoặc dán tạm vào ô dưới (chỉ lưu trên máy này):</p>
        <textarea class="cfg" style="min-height:130px" placeholder='apiKey: "...", authDomain: "...", databaseURL: "https://...firebasedatabase.app", projectId: "...", appId: "..."'></textarea>
        <div class="row"><button class="btn save">Lưu &amp; tiếp tục</button></div><p class="msg"></p></div>`;
        $('.save').onclick = () => {
          const t = $('.cfg').value, cfg = {};
          for (const m of t.matchAll(/["']?(apiKey|authDomain|databaseURL|projectId|storageBucket|messagingSenderId|appId|measurementId)["']?\s*:\s*["']([^"']+)["']/g)) cfg[m[1]] = m[2];
          if (!cfg.apiKey || !cfg.databaseURL) { $('.msg').textContent = 'Thiếu apiKey hoặc databaseURL.'; return; }
          GV.store.set('fbcfg', cfg); fbP = null; entry();
        };
      }

      function entry(err) {
        if (dead) return;
        if (listOff) listOff(), listOff = null;
        if (!getCfg()) return showSetup();
        const code = hashCode();
        el.innerHTML = `<div class="tool" style="max-width:420px"><div class="big">🌐 Lô tô online</div>
        <label>Tên của bạn <input class="nm" maxlength="16" placeholder="Ví dụ: Huyền" style="width:100%" value="${GV.esc(GV.store.get('lo_name', ''))}"></label>
        <label>Tên phòng / nhóm <input class="rn" maxlength="24" placeholder="Ví dụ: Nhóm tối thứ 7" style="width:100%" value="${GV.esc(GV.store.get('lo_room', ''))}"></label>
        <label>🔊 Đọc số bằng <select class="lg" style="width:100%">${[['vi', 'Tiếng Việt'], ['en', 'English'], ['ja', '日本語 (Nhật)'], ['off', 'Tắt']].map(([v, n]) => `<option value="${v}" ${v === GV.store.get('lo_lang', 'vi') ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <button class="btn mk">➕ Tạo phòng mới</button>
        <div class="hint">— hoặc vào phòng đang mở —</div>
        <div class="rl hint">Đang tải danh sách phòng…</div>
        <div class="hint">— hoặc nhập mã phòng —</div>
        <div class="row"><input class="cd" inputmode="numeric" maxlength="4" placeholder="Mã 4 số" style="width:120px;text-align:center;font-size:1.3rem" value="${code}"><button class="btn ghost jn">Vào phòng</button></div>
        <p class="msg">${err ? GV.esc(err) : ''}</p><p class="hint"><a href="#" class="rc">Đổi cấu hình Firebase</a></p></div>`;
        $('.lg').onchange = e => { GV.store.set('lo_lang', e.target.value); GV.lotoUnlock(); GV.lotoSpeak(e.target.value === 'ja' ? 88 : 88, e.target.value); };
        const name = () => { GV.lotoUnlock(); const n = $('.nm').value.trim(); if (!n) { $('.msg').textContent = 'Nhập tên của bạn trước nhé.'; $('.nm').focus(); return null; } GV.store.set('lo_name', n); return n; };
        const busy = t => { $('.msg').textContent = t; el.querySelectorAll('button').forEach(b => b.disabled = !!t); };
        $('.mk').onclick = async () => { const n = name(); if (!n) return; const rn = $('.rn').value.trim() || ('Phòng của ' + n); GV.store.set('lo_room', $('.rn').value.trim()); busy('Đang tạo phòng…'); try { await createRoom(n, rn); } catch (e) { entry(explain(e)); } };
        $('.jn').onclick = async () => { const n = name(); if (!n) return; const c = $('.cd').value.trim(); if (!/^\d{4}$/.test(c)) { $('.msg').textContent = 'Mã phòng gồm 4 chữ số.'; return; } busy('Đang vào phòng…'); try { await join(c, n); } catch (e) { entry(explain(e)); } };
        $('.rl').onclick = async ev => { const b = ev.target.closest('[data-c]'); if (!b) return; const n = name(); if (!n) return; busy('Đang vào phòng…'); try { await join(b.dataset.c, n); } catch (e) { entry(explain(e)); } };
        watchList();
        $('.rc').onclick = ev => { ev.preventDefault(); GV.store.set('fbcfg', null); if (!window.GV_FIREBASE) showSetup(); else $('.msg').textContent = 'Cấu hình nằm trong js/firebase-config.js.'; };
      }

      function watchList() {
        if (listOff) listOff(); listOff = null;
        fb().then(({ db }) => {
          if (dead) return;
          db.ref('lobby').orderByChild('at').endAt(Date.now() - 6 * 3600e3).limitToFirst(10).once('value').then(sn => { const up = {}; Object.keys(sn.val() || {}).forEach(c => { up['rooms/' + c] = null; up['lobby/' + c] = null; }); if (Object.keys(up).length) db.ref().update(up).catch(() => {}); }).catch(() => {});
          const q = db.ref('lobby').orderByChild('at').startAt(Date.now() - 6 * 3600e3), cb = snap => {
            const box = $('.rl'); if (!box) return;
            const v = snap.val() || {}, rows = Object.entries(v).filter(([, r]) => r && r.status !== 'closed').sort((a, b) => b[1].at - a[1].at);
            box.innerHTML = rows.length ? rows.map(([c, r]) => `<div class="row" style="justify-content:space-between;text-align:left;padding:6px 8px;border:1px solid var(--line);border-radius:10px;margin-bottom:6px"><span><b>${GV.esc(r.name || 'Phòng ' + c)}</b><br><span class="hint">#${c} · ${GV.esc(r.hostName || '')} · ${r.count || 0} người · ${r.status === 'playing' ? '🎲 đang chơi' : '⏳ đang chờ'}</span></span><button class="btn ghost" data-c="${c}" style="padding:6px 12px">Vào</button></div>`).join('') : 'Chưa có phòng nào đang mở – hãy tạo phòng mới!';
          };
          q.on('value', cb); listOff = () => q.off('value', cb);
        }).catch(() => { const b = $('.rl'); if (b) b.textContent = 'Không tải được danh sách phòng.'; });
      }

      async function createRoom(name, roomName) {
        const { db, uid, TS } = await fb();
        for (let i = 0; i < 12; i++) {
          const code = String(1000 + GV.rnd(9000));
          const r = await timeout(db.ref(`rooms/${code}/host`).transaction(cur => cur === null ? uid : undefined));
          if (r.committed) { await timeout(db.ref('rooms/' + code).update({ round: 1, status: 'lobby', createdAt: TS }));
            // tên phòng + danh sách công khai: không bắt buộc (bỏ qua nếu Rules cũ chưa cho phép)
            try { await timeout(db.ref('rooms/' + code).child('name').set(roomName)); await timeout(db.ref('lobby/' + code).set({ name: roomName, hostName: name, status: 'lobby', count: 0, at: TS })); } catch (e) { console.warn('lobby', e); }
            return join(code, name); }
        }
        throw new Error('Không tạo được phòng, thử lại.');
      }

      async function join(code, name) {
        const { db, uid, TS } = await fb();
        const snap = await timeout(db.ref(`rooms/${code}/host`).once('value'));
        if (!snap.exists()) throw new Error('Không tìm thấy phòng ' + code);
        history.replaceState(null, '', '#/game/lotoonline/' + code);
        room(db, uid, TS, code, name);
      }

      /* ---------- Phòng chơi ---------- */
      function room(db, uid, TS, code, name) {
        const ref = db.ref('rooms/' + code), me = ref.child('players/' + uid);
        me.child('online').onDisconnect().set(false);
        me.update({ name, online: true });
        let lobbySig = '', R = null, k = +GV.store.get('lo_k', 4), auto = false, nextAt = 0, wake = null, gen = 0, seenWin = new Set(), lastLen = -1,
          myT = [], marked = new Set(), marksRound = null, lang = GV.store.get('lo_lang', 'vi'), lastValid = [], lastCs = new Set(), lastWon = new Set();
        const marksKey = () => `lo_marks_${code}_${R.round}`;
        const saveMarks = () => GV.store.set(marksKey(), [...marked]);
        el.innerHTML = `<style>${GV.lotoCSS}
          .l16 .code{font-size:2rem;font-weight:900;letter-spacing:.2em;color:var(--acc)}
          .l16 .pl{list-style:none;margin:8px 0 0;padding:0;font-size:14px}.l16 .pl li{padding:3px 0;border-bottom:1px solid var(--line)}
          .l16 .wn,.l16 .hs{margin:6px 0 0;font-size:13px}.l16 .hs details{border-bottom:1px solid var(--line);padding:4px 0}.l16 .hs summary{cursor:pointer}
          .l16 .hs .x{cursor:pointer;color:var(--bad);margin-left:6px}.l16 .kmsg{font-weight:700;font-size:13px}</style>
        <div class="l16">
          <aside class="side">
            <section class="pn cur"><div class="lb rname">PHÒNG</div><div class="code">${code}</div>
              <div class="row"><button class="btn ghost share" style="padding:5px 12px">🔗 Chia sẻ</button><button class="btn ghost leave" style="padding:5px 12px">🚪 Rời</button></div>
              <div class="lb" style="margin-top:12px">SỐ VỪA GỌI</div><div class="no">--</div>
              <div class="host" hidden><div class="row"><button class="btn start">▶ Bắt đầu ván</button><button class="btn draw">🎲 Gọi số</button><button class="btn ghost auto">▶ Tự động</button></div>
              <div class="row" style="margin-top:8px"><label>Tốc độ <select class="sp"><option value="6000">Chậm (6s)</option><option value="4000" selected>Vừa (4s)</option><option value="2500">Nhanh (2.5s)</option></select></label></div>
              <div class="row"><label><input type="checkbox" class="stopk" checked> Dừng tự động khi có người kinh</label></div>
              <div class="row" style="margin-top:6px"><button class="btn ghost nw" style="padding:5px 12px">🔄 Ván mới</button><button class="btn bad cl" style="padding:5px 12px">⛔ Đóng phòng</button></div><div class="hint cd" style="margin-top:4px"></div></div>
              <div class="row" style="margin-top:8px"><label>🔊 <select class="lg">${[['vi', 'Tiếng Việt'], ['en', 'English'], ['ja', '日本語'], ['off', 'Tắt']].map(([v, n]) => `<option value="${v}" ${v === lang ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
              <div class="st"></div></section>
            <section class="pn"><b>👥 Người chơi</b><ul class="pl"></ul></section>
            <section class="pn"><b>🏆 Kinh ván này</b><div class="wn">Chưa có ai.</div></section>
            <section class="pn"><b>📚 Lịch sử các ván</b><div class="hs">Chưa có ván nào.</div><div class="host2" hidden style="margin-top:8px"><button class="btn ghost clh" style="padding:5px 12px">🗑 Xoá lịch sử kinh</button></div></section>
            <section class="pn"><b>📜 Số đã gọi</b><div class="hist"></div></section>
            <section class="pn"><b>🔢 Bảng 1–90</b><div class="pool"></div></section>
          </aside>
          <section><div class="head"><h3 class="ttl">🎫 Vé của bạn</h3><div class="row"><span class="kk"><label>Số vé <select class="k">${Array.from({ length: 16 }, (_, i) => i + 1).map(n => `<option ${n === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></span><button class="btn ok kinh" hidden>🎉 KINH!</button></div></div>
            <div class="kmsg"></div><div class="hint kh" hidden>Nghe số nào có trên vé thì bấm vào ô để dò. Đủ một hàng thì bấm KINH!</div>
            <div class="tks"></div></section>
          <div class="modal"><div class="mc"><div class="big">🎉 KINH!</div><h3 class="wt"></h3><button class="btn ok close">Tiếp tục</button></div></div>
        </div>`;
        const isHost = () => R && R.host === uid;
        let tkHtml = '';
        const buildTk = () => myT.length ? GV.lotoTicketsHTML(myT, lastCs, lastWon, marked) : `<p class="hint">${R && R.status === 'playing' ? 'Ván đang chơi – bạn vào muộn nên chỉ xem. Ván sau sẽ có vé.' : 'Đang tạo vé…'}</p>`;
        // Chỉ vẽ lại khi nội dung thật sự đổi, và giữ nguyên vị trí cuộn (tránh bị giật lên đầu trang trên điện thoại)
        const renderTk = () => {
          const h = buildTk(); if (h === tkHtml) return;
          const box = $('.tks'), y = window.scrollY, x = window.scrollX;
          box.style.minHeight = box.offsetHeight + 'px';
          box.innerHTML = h; tkHtml = h;
          window.scrollTo(x, y);
          requestAnimationFrame(() => { box.style.minHeight = ''; window.scrollTo(x, y); });
        };

        function newTickets() { // chỉ sinh vé khi phòng đang ở sảnh
          myT = GV.lotoMakeTickets(k); marked = new Set(); saveMarks();
          me.update({ tickets: enc(myT), k, round: R.round });
        }

        /* ----- Gọi số (chủ phòng) ----- */
        function draw1() {
          if (!R || R.status !== 'playing' || toList(R.called).length >= 90) { stopAuto(); return; }
          // transaction: chọn số + ghi trong một bước nên không bao giờ trùng số hoặc ghi đè khi bấm nhanh
          ref.child('called').transaction(cur => {
            const l = toList(cur); if (l.length >= 90) return;
            const s = new Set(l), rest = []; for (let n = 1; n <= 90; n++) if (!s.has(n)) rest.push(n);
            l.push(rest[GV.rnd(rest.length)]); return l;
          }).catch(e => { $('.cd').textContent = explain(e); stopAuto(); });
        }
        const speed = () => +$('.sp').value;
        function setAutoUI(msg) { $('.auto').textContent = auto ? '⏸ Dừng tự động' : '▶ Tự động'; if (msg !== undefined) $('.cd').textContent = msg; }
        async function keepAwake() { try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => wake = null); } } catch (e) {} }
        function stopAuto(msg) { auto = false; clearInterval(timer); timer = null; try { wake && wake.release(); } catch (e) {} wake = null; if (!dead) setAutoUI(msg || ''); }
        function startAuto() {
          if (!R || R.status !== 'playing') return;
          clearInterval(timer); auto = true; nextAt = Date.now() + speed(); keepAwake();
          // kiểm tra mỗi 0,5s theo đồng hồ thật để không lệch khi trình duyệt bị làm chậm
          timer = setInterval(() => {
            if (!auto) return;
            const left = nextAt - Date.now();
            if (left <= 0) { nextAt = Date.now() + speed(); draw1(); } else $('.cd').textContent = `Tự động: số tiếp theo sau ${Math.ceil(left / 1000)}s`;
          }, 500);
          setAutoUI('Tự động: đang chạy');
        }
        document.addEventListener('visibilitychange', onVis); function onVis() { if (!document.hidden && auto) keepAwake(); }
        offVis = () => document.removeEventListener('visibilitychange', onVis);

        /* ----- Đồng bộ dữ liệu phòng ----- */
        function onVal(snap) {
          if (dead) return;
          R = snap.val();
          if (!R) { cleanup(); entry('Phòng đã bị xóa.'); return; }
          if (R.closed && R.host !== uid) { cleanup(); history.replaceState(null, '', '#/game/lotoonline'); entry('Chủ phòng đã đóng phòng.'); return; }
          $('.rname').textContent = (R.name || 'PHÒNG').toUpperCase();
          const players = R.players || {}, mine = players[uid] || {}, called = toList(R.called), cs = new Set(called), st = R.status;
          if (marksRound !== R.round) { marksRound = R.round; marked = new Set(GV.store.get(marksKey(), [])); lastLen = called.length; }
          // vé của tôi
          if (st === 'lobby') {
            if (!mine.tickets || mine.round !== R.round || mine.k !== k) { if (gen !== R.round + '/' + k) { gen = R.round + '/' + k; newTickets(); } }
            else myT = dec(mine.tickets);
          } else myT = mine.tickets && mine.round === R.round ? dec(mine.tickets) : [];
          // giao diện chung
          $('.host').hidden = $('.host2').hidden = !isHost();
          if (isHost() && !R.closed) { // đồng bộ danh sách phòng công khai
            const cnt = Object.values(players).filter(p => p && p.online).length, sig = cnt + '/' + st;
            if (sig !== lobbySig) { lobbySig = sig; db.ref('lobby/' + code).update({ count: cnt, status: st, at: TS }); }
          }
          $('.start').hidden = st !== 'lobby'; $('.draw').hidden = $('.auto').hidden = st !== 'playing';
          $('.no').textContent = called.length ? pad(called[called.length - 1]) : '--';
          $('.hist').innerHTML = called.slice().reverse().slice(0, 30).map((n, i) => `<span class="${i ? '' : 'lt'}">${pad(n)}</span>`).join('') || '<span class="hint">Chưa gọi số nào</span>';
          $('.pool').innerHTML = Array.from({ length: 90 }, (_, i) => `<span class="${cs.has(i + 1) ? 'on' : ''}">${i + 1}</span>`).join('');
          $('.kk').hidden = st !== 'lobby';
          $('.kinh').hidden = $('.kh').hidden = !(st === 'playing' && myT.length);
          // người kinh (mọi máy tự kiểm tra lại vé của người báo)
          const wins = Object.values(R.winners || {}).filter(w => w && w.round === R.round);
          const valid = wins.filter(w => { const p = players[w.uid]; const t = p && p.tickets && p.round === R.round ? dec(p.tickets)[w.idx] : null; return t && rowWon(t, cs); });
          lastValid = valid; lastCs = cs; lastWon = new Set(valid.filter(w => w.uid === uid).map(w => w.idx));
          $('.wn').innerHTML = valid.length ? valid.map(w => `🏆 <b>${GV.esc(w.name)}</b> – vé #${pad(w.idx + 1)} ✓`).join('<br>') : 'Chưa có ai.';
          $('.st').innerHTML = st === 'lobby' ? 'Đang chờ chủ phòng bắt đầu…' : `Đã gọi <b>${called.length}/90</b> số`;
          $('.pl').innerHTML = Object.entries(players).map(([id, p]) => `<li>${p.online ? '🟢' : '⚪'} ${GV.esc(p.name || '?')}${id === R.host ? ' 👑' : ''}${id === uid ? ' (bạn)' : ''} <span class="hint">${p.tickets && p.round === R.round ? p.k + ' vé' : 'xem'}</span>${valid.some(w => w.uid === id) ? ' 🏆' : ''}</li>`).join('');
          renderHistory();
          renderTk();
          // số mới: bíp + đọc
          if (lastLen >= 0 && called.length > lastLen) { const n = called[called.length - 1]; GV.beep(400 + n * 4, 90); GV.lotoSpeak(n, lang); }
          lastLen = called.length;
          // thông báo có người kinh
          valid.forEach(w => {
            const key = `${w.round}_${w.uid}_${w.idx}`;
            if (!seenWin.has(key)) {
              seenWin.add(key); $('.wt').textContent = `${w.name} kinh với vé #${pad(w.idx + 1)}!`; $('.modal').classList.add('show'); GV.beep(880, 350);
              if (isHost() && auto && $('.stopk').checked) stopAuto('Đã tạm dừng vì có người kinh – bấm ▶ Tự động để chơi tiếp.');
            }
          });
          if (st === 'lobby') { if (auto) stopAuto(); seenWin.clear(); }
          if (st === 'playing' && called.length >= 90 && auto) stopAuto('Đã gọi hết 90 số.');
        }
        function renderHistory() {
          const h = Object.values(R.history || {}).filter(Boolean).sort((a, b) => b.round - a.round);
          $('.hs').innerHTML = h.length ? h.map(x => {
            const w = toList(x.winners);
            return `<details><summary>Ván ${x.round} · ${x.n} số · ${w.length ? '🏆 ' + w.map(z => GV.esc(z.name)).join(', ') : 'không ai kinh'}${isHost() ? ` <span class="x" data-h="${x.round}" title="Xoá ván này">✕</span>` : ''}</summary>
              ${w.map(z => `🏆 ${GV.esc(z.name)} – vé #${pad(z.idx + 1)}${z.n ? ' (sau ' + z.n + ' số)' : ''}`).join('<br>')}${x.calls ? `<div class="hint" style="text-align:left">Thứ tự số: ${GV.esc(x.calls.split(',').join(' '))}</div>` : ''}</details>`;
          }).join('') : 'Chưa có ván nào.';
        }

        ref.on('value', onVal);
        unsub = () => ref.off('value', onVal);

        /* ----- Sự kiện ----- */
        $('.k').onchange = e => { k = +e.target.value; GV.store.set('lo_k', k); if (R) onVal({ val: () => R }); };
        $('.lg').onchange = e => { lang = e.target.value; GV.store.set('lo_lang', lang); GV.lotoUnlock(); GV.lotoSpeak(88, lang); };
        $('.start').onclick = () => { GV.lotoUnlock(); const ps = Object.values(R.players || {}).filter(p => p.tickets && p.round === R.round); if (!ps.length) return; ref.child('status').set('playing'); };
        $('.draw').onclick = () => { GV.lotoUnlock(); draw1(); };
        $('.auto').onclick = () => { GV.lotoUnlock(); auto ? stopAuto() : startAuto(); };
        $('.sp').onchange = () => { if (auto) nextAt = Date.now() + speed(); };
        $('.nw').onclick = async () => {
          stopAuto();
          const called = toList(R.called);
          if (called.length || lastValid.length) { // lưu kết quả ván vừa rồi vào lịch sử
            try { await ref.child('history/' + R.round).set({ round: R.round, at: TS, n: called.length, calls: called.join(','), winners: lastValid.map(w => ({ name: w.name, idx: w.idx, n: w.n || 0 })) }); } catch (e) { console.warn('history', e); }
          }
          ref.update({ round: (R.round || 1) + 1, status: 'lobby', called: null, winners: null });
        };
        $('.clh').onclick = () => { if (confirm('Xoá toàn bộ lịch sử kinh của các ván trước?')) ref.child('history').remove(); };
        $('.hs').onclick = e => { const r = e.target.dataset.h; if (r && isHost() && confirm('Xoá ván ' + r + ' khỏi lịch sử?')) { e.preventDefault(); ref.child('history/' + r).remove(); } else if (r) e.preventDefault(); };
        // Xoá hẳn dữ liệu phòng (tránh để rác trong database)
        async function deleteRoom() {
          stopAuto(); cleanup(); history.replaceState(null, '', '#/game/lotoonline');
          try { await db.ref().update({ ['rooms/' + code]: null, ['lobby/' + code]: null }); entry('Đã xoá phòng ' + code + '.'); } catch (e) { entry(explain(e)); }
        }
        $('.cl').onclick = () => { if (confirm('Đóng và xoá phòng? Mọi người sẽ bị đưa ra ngoài.')) deleteRoom(); };
        $('.leave').onclick = () => {
          if (!R) return;
          const others = Object.entries(R.players || {}).filter(([id, p]) => id !== uid && p && p.online !== false), host = isHost();
          if (host && others.length) { if (confirm('Bạn là chủ phòng. Rời đi sẽ đóng và xoá phòng cho mọi người. Tiếp tục?')) deleteRoom(); return; }
          if (!others.length && confirm('Không còn người chơi nào khác trong phòng.\nXoá phòng luôn để tránh rác dữ liệu?')) return deleteRoom();
          stopAuto(); cleanup(); me.remove().catch(() => me.child('online').set(false)); history.replaceState(null, '', '#/game/lotoonline'); entry();
        };
        $('.close').onclick = () => $('.modal').classList.remove('show');

        $('.share').onclick = async () => {
          const url = location.origin + location.pathname + '#/game/lotoonline/' + code;
          try { if (navigator.share) await navigator.share({ title: 'Lô tô online', text: 'Vào phòng lô tô ' + code, url }); else { await navigator.clipboard.writeText(url); $('.share').textContent = 'Đã chép ✓'; } } catch (e) {}
        };
        // tự dò: người chơi bấm vào ô số
        $('.tks').onclick = e => {
          const c = e.target.closest('.n'); if (!c || !R || R.status !== 'playing') return;
          const key = c.dataset.t + ':' + c.dataset.n;
          marked.has(key) ? marked.delete(key) : marked.add(key);
          c.classList.toggle('c', marked.has(key)); // đổi màu ngay tại ô, không vẽ lại cả danh sách vé
          tkHtml = buildTk(); saveMarks();
        };
        // bấm KINH: kiểm tra các ô đã dò của mình
        $('.kinh').onclick = () => {
          const cs = lastCs, msg = $('.kmsg'); let found = [], wrong = false, partial = false;
          myT.forEach((t, i) => t.forEach(row => {
            const nums = row.filter(Boolean), m = nums.filter(n => marked.has(i + ':' + n)).length;
            if (m === nums.length) { if (nums.every(n => cs.has(n))) { if (!found.includes(i)) found.push(i); } else wrong = true; }
            else if (m >= 4) partial = true;
          }));
          if (!found.length) { msg.style.color = 'var(--bad)'; msg.textContent = wrong ? '❌ Trong hàng có số CHƯA được gọi – bạn dò nhầm!' : partial ? '❌ Còn thiếu số ở hàng gần đủ.' : '❌ Chưa có hàng nào đủ 5 số đã dò.'; GV.beep(200, 200); return; }
          msg.style.color = 'var(--ok)'; msg.textContent = '✅ Đã báo kinh!';
          found.forEach(i => { const key = `${R.round}_${uid}_${i}`; if (!(R.winners && R.winners[key])) ref.child('winners/' + key).set({ uid, name, idx: i, round: R.round, n: toList(R.called).length }); });
        };
      }
      function cleanup() { if (unsub) unsub(); unsub = null; clearInterval(timer); timer = null; if (offVis) offVis(); offVis = null; try { speechSynthesis.cancel(); } catch (e) {} }

      entry();
      return () => { dead = true; cleanup(); };
    }
  });
})();
