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

  let fbP = null;
  function fb() {
    if (fbP) return fbP;
    fbP = (async () => {
      const cfg = getCfg(); if (!cfg || !cfg.databaseURL) throw new Error('Chưa có cấu hình Firebase');
      if (!window.firebase || !firebase.database) for (const s of SRC) await loadScript(s);
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      await firebase.auth().signInAnonymously();
      return { db: firebase.database(), uid: firebase.auth().currentUser.uid, TS: firebase.database.ServerValue.TIMESTAMP };
    })();
    fbP.catch(() => { fbP = null; });
    return fbP;
  }

  GV.register({
    id: 'lotoonline', type: 'game', cat: 'Gia đình', name: 'Lô tô online', icon: '🌐', desc: 'Chơi lô tô nhiều người qua mạng bằng mã phòng.',
    mount(el) {
      let dead = false, unsub = null, timer = null;
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
        if (!getCfg()) return showSetup();
        const code = hashCode();
        el.innerHTML = `<div class="tool" style="max-width:420px"><div class="big">🌐 Lô tô online</div>
        <label>Tên của bạn <input class="nm" maxlength="16" placeholder="Ví dụ: Huyền" style="width:100%" value="${GV.esc(GV.store.get('lo_name', ''))}"></label>
        <button class="btn mk">➕ Tạo phòng mới</button>
        <div class="hint">— hoặc vào phòng có sẵn —</div>
        <div class="row"><input class="cd" inputmode="numeric" maxlength="4" placeholder="Mã 4 số" style="width:120px;text-align:center;font-size:1.3rem" value="${code}"><button class="btn ghost jn">Vào phòng</button></div>
        <p class="msg">${err ? GV.esc(err) : ''}</p><p class="hint"><a href="#" class="rc">Đổi cấu hình Firebase</a></p></div>`;
        const name = () => { const n = $('.nm').value.trim(); if (!n) { $('.msg').textContent = 'Nhập tên của bạn trước nhé.'; $('.nm').focus(); return null; } GV.store.set('lo_name', n); return n; };
        const busy = t => { $('.msg').textContent = t; el.querySelectorAll('button').forEach(b => b.disabled = !!t); };
        $('.mk').onclick = async () => { const n = name(); if (!n) return; busy('Đang tạo phòng…'); try { await createRoom(n); } catch (e) { entry(e.message); } };
        $('.jn').onclick = async () => { const n = name(); if (!n) return; const c = $('.cd').value.trim(); if (!/^\d{4}$/.test(c)) { $('.msg').textContent = 'Mã phòng gồm 4 chữ số.'; return; } busy('Đang vào phòng…'); try { await join(c, n); } catch (e) { entry(e.message); } };
        $('.rc').onclick = ev => { ev.preventDefault(); GV.store.set('fbcfg', null); if (!window.GV_FIREBASE) showSetup(); else $('.msg').textContent = 'Cấu hình nằm trong js/firebase-config.js.'; };
      }

      async function createRoom(name) {
        const { db, uid, TS } = await fb();
        for (let i = 0; i < 12; i++) {
          const code = String(1000 + GV.rnd(9000));
          const r = await db.ref(`rooms/${code}/host`).transaction(cur => cur === null ? uid : undefined);
          if (r.committed) { await db.ref('rooms/' + code).update({ round: 1, status: 'lobby', createdAt: TS }); return join(code, name); }
        }
        throw new Error('Không tạo được phòng, thử lại.');
      }

      async function join(code, name) {
        const { db, uid } = await fb();
        const snap = await db.ref(`rooms/${code}/host`).once('value');
        if (!snap.exists()) throw new Error('Không tìm thấy phòng ' + code);
        history.replaceState(null, '', '#/game/lotoonline/' + code);
        room(db, uid, code, name);
      }

      /* ---------- Phòng chơi ---------- */
      function room(db, uid, code, name) {
        const ref = db.ref('rooms/' + code), me = ref.child('players/' + uid);
        me.child('online').onDisconnect().set(false);
        me.update({ name, online: true });
        let R = null, k = +GV.store.get('lo_k', 4), auto = false, gen = 0, claimed = new Set(), seenWin = new Set(), lastLen = -1, myT = [], myRound = null;
        el.innerHTML = `<style>${GV.lotoCSS}
          .l16 .code{font-size:2rem;font-weight:900;letter-spacing:.2em;color:var(--acc)}
          .l16 .pl{list-style:none;margin:8px 0 0;padding:0;font-size:14px}.l16 .pl li{padding:3px 0;border-bottom:1px solid var(--line)}
          .l16 .wn{margin:6px 0 0;font-size:14px}</style>
        <div class="l16">
          <aside class="side">
            <section class="pn cur"><div class="lb">PHÒNG</div><div class="code">${code}</div>
              <div class="row"><button class="btn ghost share" style="padding:5px 12px">🔗 Chia sẻ</button><button class="btn ghost leave" style="padding:5px 12px">🚪 Rời</button></div>
              <div class="lb" style="margin-top:12px">SỐ VỪA GỌI</div><div class="no">--</div>
              <div class="host" hidden><div class="row"><button class="btn start">▶ Bắt đầu ván</button><button class="btn draw">🎲 Gọi số</button><button class="btn ghost auto">⏯ Tự động</button></div>
              <div class="row" style="margin-top:8px"><label>Tốc độ <select class="sp"><option value="5000">Chậm</option><option value="3500" selected>Vừa</option><option value="2000">Nhanh</option></select></label><button class="btn ghost nw" style="padding:5px 12px">🔄 Ván mới</button></div></div>
              <div class="row" style="margin-top:8px"><label><input type="checkbox" class="say"> 🔊 Đọc số</label></div>
              <div class="st"></div></section>
            <section class="pn"><b>👥 Người chơi</b><ul class="pl"></ul></section>
            <section class="pn"><b>🏆 Kinh</b><div class="wn">Chưa có ai.</div></section>
            <section class="pn"><b>📜 Lịch sử</b><div class="hist"></div></section>
            <section class="pn"><b>🔢 Bảng 1–90</b><div class="pool"></div></section>
          </aside>
          <section><div class="head"><h3 class="ttl">🎫 Vé của bạn</h3><div class="kk"><label>Số vé <select class="k">${[2, 4, 8, 16].map(n => `<option ${n === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div></div>
            <div class="tks"></div></section>
          <div class="modal"><div class="mc"><div class="big">🎉 KINH!</div><h3 class="wt"></h3><button class="btn ok close">Tiếp tục</button></div></div>
        </div>`;
        const isHost = () => R && R.host === uid;

        function newTickets() { // chỉ sinh vé khi phòng đang ở sảnh
          const t = GV.lotoMakeTickets(k); myT = t; myRound = R.round;
          me.update({ tickets: enc(t), k, round: R.round });
        }
        function draw1() {
          const called = toList(R.called);
          if (R.status !== 'playing' || called.length >= 90) { stopAuto(); return; }
          const s = new Set(called), rest = []; for (let n = 1; n <= 90; n++) if (!s.has(n)) rest.push(n);
          ref.child('called/' + called.length).set(rest[GV.rnd(rest.length)]);
        }
        function stopAuto() { auto = false; clearInterval(timer); }
        function startAuto() { clearInterval(timer); auto = true; timer = setInterval(draw1, +$('.sp').value); }

        function onVal(snap) {
          if (dead) return;
          R = snap.val();
          if (!R) { cleanup(); entry('Phòng đã bị xóa.'); return; }
          const players = R.players || {}, mine = players[uid] || {}, called = toList(R.called), cs = new Set(called);
          // vé của tôi
          if (R.status === 'lobby') {
            if (!mine.tickets || mine.round !== R.round || mine.k !== k) { if (!gen || gen !== R.round + '/' + k) { gen = R.round + '/' + k; newTickets(); } }
            else { myT = dec(mine.tickets); myRound = R.round; }
          } else myT = mine.tickets && mine.round === R.round ? dec(mine.tickets) : [];
          // giao diện
          $('.host').hidden = !isHost();
          const st = R.status;
          $('.start').hidden = st !== 'lobby'; $('.draw').hidden = $('.auto').hidden = st !== 'playing';
          $('.no').textContent = called.length ? pad(called[called.length - 1]) : '--';
          $('.hist').innerHTML = called.slice().reverse().slice(0, 24).map((n, i) => `<span class="${i ? '' : 'lt'}">${pad(n)}</span>`).join('');
          $('.pool').innerHTML = Array.from({ length: 90 }, (_, i) => `<span class="${cs.has(i + 1) ? 'on' : ''}">${i + 1}</span>`).join('');
          $('.kk').hidden = st !== 'lobby';
          // thắng
          const wins = Object.values(R.winners || {}).filter(w => w && w.round === R.round);
          const valid = wins.filter(w => { const p = players[w.uid]; const t = p && p.tickets && p.round === R.round ? dec(p.tickets)[w.idx] : null; return t && rowWon(t, cs); });
          const won = new Set(valid.filter(w => w.uid === uid).map(w => w.idx));
          $('.wn').innerHTML = valid.length ? valid.map(w => `🏆 <b>${GV.esc(w.name)}</b> – vé #${pad(w.idx + 1)} ✓`).join('<br>') : 'Chưa có ai.';
          $('.st').innerHTML = st === 'lobby' ? 'Đang chờ chủ phòng bắt đầu…' : `Đã gọi <b>${called.length}/90</b> số`;
          $('.pl').innerHTML = Object.entries(players).map(([id, p]) => `<li>${p.online ? '🟢' : '⚪'} ${GV.esc(p.name || '?')}${id === R.host ? ' 👑' : ''}${id === uid ? ' (bạn)' : ''} <span class="hint">${p.tickets && p.round === R.round ? p.k + ' vé' : 'xem'}</span>${valid.some(w => w.uid === id) ? ' 🏆' : ''}</li>`).join('');
          $('.tks').innerHTML = myT.length ? GV.lotoTicketsHTML(myT, cs, won) : `<p class="hint">${st === 'playing' ? 'Ván đang chơi – bạn vào muộn nên chỉ xem. Ván sau sẽ có vé.' : 'Đang tạo vé…'}</p>`;
          // âm thanh khi có số mới
          if (lastLen >= 0 && called.length > lastLen) { const n = called[called.length - 1]; GV.beep(400 + n * 4, 90); if ($('.say').checked && window.speechSynthesis) try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(n)); u.lang = 'vi-VN'; u.rate = .9; speechSynthesis.speak(u); } catch (e) {} }
          lastLen = called.length;
          // tự động báo kinh
          if (st === 'playing') myT.forEach((t, i) => { const key = `${R.round}_${uid}_${i}`; if (!claimed.has(key) && rowWon(t, cs) && !(R.winners && R.winners[key])) { claimed.add(key); ref.child('winners/' + key).set({ uid, name, idx: i, round: R.round, n: called.length }); } });
          // thông báo người mới kinh
          valid.forEach(w => { const key = `${w.round}_${w.uid}_${w.idx}`; if (!seenWin.has(key)) { seenWin.add(key); $('.wt').textContent = `${w.name} kinh với vé #${pad(w.idx + 1)}!`; $('.modal').classList.add('show'); GV.beep(880, 350); if (isHost()) stopAuto(); } });
          if (st === 'lobby') { stopAuto(); seenWin.clear(); claimed.clear(); }
        }

        ref.on('value', onVal);
        unsub = () => ref.off('value', onVal);
        $('.k').onchange = e => { k = +e.target.value; GV.store.set('lo_k', k); if (R) onVal({ val: () => R }); };
        $('.start').onclick = () => { const ps = Object.values(R.players || {}).filter(p => p.tickets && p.round === R.round); if (!ps.length) return; ref.child('status').set('playing'); };
        $('.draw').onclick = draw1;
        $('.auto').onclick = () => auto ? stopAuto() : startAuto();
        $('.sp').onchange = () => auto && startAuto();
        $('.nw').onclick = () => { stopAuto(); ref.update({ round: (R.round || 1) + 1, status: 'lobby', called: null, winners: null }); };
        $('.close').onclick = () => $('.modal').classList.remove('show');
        $('.leave').onclick = () => { cleanup(); me.child('online').set(false); history.replaceState(null, '', '#/game/lotoonline'); entry(); };
        $('.share').onclick = async () => {
          const url = location.origin + location.pathname + '#/game/lotoonline/' + code;
          try { if (navigator.share) await navigator.share({ title: 'Lô tô online', text: 'Vào phòng lô tô ' + code, url }); else { await navigator.clipboard.writeText(url); $('.share').textContent = 'Đã chép ✓'; } } catch (e) {}
        };
      }
      function cleanup() { if (unsub) unsub(); unsub = null; clearInterval(timer); try { speechSynthesis.cancel(); } catch (e) {} }

      entry();
      return () => { dead = true; cleanup(); };
    }
  });
})();
