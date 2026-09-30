// Khung phòng chơi nhiều người dùng chung (Firebase). Chủ phòng là "máy chủ" của ván: xử lý luật, bot, thời gian.
//  - mprooms/<mã>        : thông tin phòng công khai (host, meta, players, bots, pub, act, chat)
//  - mpprivate/<mã>/<uid>: dữ liệu riêng của từng người (bài trên tay, vai trò...) – chỉ chính người đó đọc được
//  - mpstate/<mã>        : toàn bộ trạng thái ván – chỉ chủ phòng đọc/ghi (để tải lại trang không mất ván)
//  - mplobby/<mã>        : danh sách phòng đang mở
// Mỗi game khai báo bằng GV.mp.define({ id, name, icon, desc, min, max, init, reduce, pub, priv, bot, tick, render })
(function () {
  const pad2 = n => String(n).padStart(2, '0');
  const fmtT = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + pad2(s % 60); };
  const clean = o => JSON.parse(JSON.stringify(o === undefined ? null : o));

  const CSS = `
  .mp{width:100%;display:flex;flex-direction:column;gap:12px}
  .mp .bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}
  .mp .code{font-weight:900;letter-spacing:.2em;color:var(--acc);font-size:1.3rem}
  .mp .seats{display:flex;gap:6px;flex-wrap:wrap}
  .mp .seat{background:var(--inp);border:1px solid var(--line);border-radius:99px;padding:3px 12px;font-size:13px}
  .mp .seat.turn{border-color:var(--ok);box-shadow:0 0 0 2px #3ddc9755}
  .mp .box{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:12px}
  .mp .chat .cl{max-height:150px;overflow:auto;font-size:13px;text-align:left}
  .mp .err{color:var(--bad);font-weight:700;min-height:1.2em;text-align:center}
  .mp .lgbox{max-height:110px;overflow:auto;font-size:13px;color:var(--mut);text-align:left}
  .mp .pbtn{border:0;border-radius:10px;padding:8px 12px;cursor:pointer;font-weight:700;background:var(--card);color:var(--fg);border:1px solid var(--line)}
  .mp .pbtn:hover{border-color:var(--acc)}.mp .pbtn.sel{background:var(--acc);color:#fff}.mp .pbtn:disabled{opacity:.4;cursor:default}
  `;

  GV.mp = {
    defs: {},
    define(def) {
      GV.mp.defs[def.id] = def;
      GV.register({ id: def.id, type: 'game', cat: def.cat || 'Nhiều người', name: def.name, icon: def.icon, desc: def.desc, mount: el => mount(def, el) });
    },
    css: CSS, fmtT
  };

  function mount(def, el) {
    const F = GV.fbInfo();
    let dead = false, listOff = null, roomOff = null, loopT = null, tickT = null;
    const $ = s => el.querySelector(s);
    const hashRe = new RegExp(def.id + '\\/(\\d{4})');
    const hashCode = () => (location.hash.match(hashRe) || [])[1] || '';

    /* ---------- Màn hình vào phòng ---------- */
    function entry(err) {
      if (dead) return;
      if (listOff) listOff(), listOff = null;
      if (!F.cfg()) { el.innerHTML = '<p class="msg">Chưa cấu hình Firebase – xem FIREBASE.md.</p>'; return; }
      el.innerHTML = `<style>${CSS}</style><div class="tool" style="max-width:420px"><div class="big">${def.icon} ${GV.esc(def.name)}</div>
        <p class="hint">${def.min}–${def.max} người · thiếu người có thể thêm bot</p>
        <label>Tên của bạn <input class="nm" maxlength="16" placeholder="Ví dụ: Huyền" style="width:100%" value="${GV.esc(GV.store.get('lo_name', ''))}"></label>
        <label>Tên phòng / nhóm <input class="rn" maxlength="24" placeholder="Ví dụ: Nhóm tối thứ 7" style="width:100%" value="${GV.esc(GV.store.get('lo_room', ''))}"></label>
        <button class="btn mk">➕ Tạo phòng mới</button>
        <div class="hint">— hoặc vào phòng đang mở —</div><div class="rl hint">Đang tải danh sách phòng…</div>
        <div class="hint">— hoặc nhập mã phòng —</div>
        <div class="row"><input class="cd" inputmode="numeric" maxlength="4" placeholder="Mã 4 số" style="width:120px;text-align:center;font-size:1.3rem" value="${hashCode()}"><button class="btn ghost jn">Vào phòng</button></div>
        <p class="msg">${err ? GV.esc(err) : ''}</p></div>`;
      const name = () => { const n = $('.nm').value.trim(); if (!n) { $('.msg').textContent = 'Nhập tên của bạn trước nhé.'; $('.nm').focus(); return null; } GV.store.set('lo_name', n); return n; };
      const busy = t => { $('.msg').textContent = t; el.querySelectorAll('button').forEach(b => b.disabled = !!t); };
      const go = async (fn) => { try { await fn(); } catch (e) { entry(F.explain(e)); } };
      $('.mk').onclick = () => { const n = name(); if (!n) return; const rn = $('.rn').value.trim() || ('Phòng của ' + n); GV.store.set('lo_room', $('.rn').value.trim()); busy('Đang tạo phòng…'); go(() => createRoom(n, rn)); };
      $('.jn').onclick = () => { const n = name(); if (!n) return; const c = $('.cd').value.trim(); if (!/^\d{4}$/.test(c)) { $('.msg').textContent = 'Mã phòng gồm 4 chữ số.'; return; } busy('Đang vào phòng…'); go(() => join(c, n)); };
      $('.rl').onclick = ev => { const b = ev.target.closest('[data-c]'); if (!b) return; const n = name(); if (!n) return; busy('Đang vào phòng…'); go(() => join(b.dataset.c, n)); };
      F.fb().then(({ db }) => {
        if (dead) return;
        janitor(db);
        const q = db.ref('mplobby').orderByChild('at').startAt(Date.now() - 2 * 3600e3), cb = snap => {
          const box = $('.rl'); if (!box) return;
          const rows = Object.entries(snap.val() || {}).filter(([, r]) => r && r.game === def.id && r.status !== 'closed').sort((a, b) => b[1].at - a[1].at);
          box.innerHTML = rows.length ? rows.map(([c, r]) => `<div class="row" style="justify-content:space-between;text-align:left;padding:6px 8px;border:1px solid var(--line);border-radius:10px;margin-bottom:6px"><span><b>${GV.esc(r.name || 'Phòng ' + c)}</b><br><span class="hint">#${c} · ${GV.esc(r.hostName || '')} · ${r.count || 0} người · ${r.status === 'lobby' ? '⏳ đang chờ' : '🎲 đang chơi'}</span></span><button class="btn ghost" data-c="${c}" style="padding:6px 12px">Vào</button></div>`).join('') : 'Chưa có phòng nào đang mở – hãy tạo phòng mới!';
        };
        q.on('value', cb); listOff = () => q.off('value', cb);
      }).catch(() => { const b = $('.rl'); if (b) b.textContent = 'Không tải được danh sách phòng.'; });
      if (hashCode() && GV.store.get('lo_name', '')) { /* để người dùng bấm Vào */ }
    }

    // Dọn các phòng bỏ hoang (quá 6 giờ không hoạt động) để không tồn dữ liệu rác
    function janitor(db) {
      db.ref('mplobby').orderByChild('at').endAt(Date.now() - 2 * 3600e3).limitToFirst(10).once('value').then(snap => {
        const up = {}; Object.keys(snap.val() || {}).forEach(c => { up[`mprooms/${c}`] = null; up[`mpprivate/${c}`] = null; up[`mpstate/${c}`] = null; up[`mplobby/${c}`] = null; });
        if (Object.keys(up).length) db.ref().update(up).catch(() => {});
      }).catch(() => {});
    }

    async function createRoom(name, roomName) {
      const { db, uid, TS } = await F.fb();
      for (let i = 0; i < 12; i++) {
        const code = String(1000 + GV.rnd(9000));
        const r = await F.timeout(db.ref(`mprooms/${code}/host`).transaction(cur => cur === null ? uid : undefined));
        if (r.committed) {
          await F.timeout(db.ref(`mprooms/${code}/meta`).set({ game: def.id, name: roomName, status: 'lobby', round: 1, createdAt: TS }));
          try { await F.timeout(db.ref('mplobby/' + code).set({ game: def.id, name: roomName, hostName: name, status: 'lobby', count: 0, at: TS })); } catch (e) { console.warn('lobby', e); }
          return join(code, name);
        }
      }
      throw new Error('Không tạo được phòng, thử lại.');
    }

    async function join(code, name) {
      const { db, uid, TS } = await F.fb();
      const snap = await F.timeout(db.ref(`mprooms/${code}/meta`).once('value'));
      const meta = snap.val();
      if (!meta) throw new Error('Không tìm thấy phòng ' + code);
      if (meta.game !== def.id) throw new Error('Phòng này là game khác.');
      history.replaceState(null, '', `#/game/${def.id}/${code}`);
      room(db, uid, TS, code, name);
    }

    /* ---------- Phòng ---------- */
    function room(db, uid, TS, code, name) {
      const ref = db.ref('mprooms/' + code), root = db.ref(), me = ref.child('players/' + uid);
      me.child('online').onDisconnect().set(false);
      ref.child('act/' + uid).onDisconnect().remove();
      me.update({ name, online: true });
      me.child('at').transaction(c => c || Date.now());
      const api = { rnd: GV.rnd, shuffle: GV.shuffle, now: () => Date.now(), host: null };
      let R = null, P = null, S = null, seen = null, recvAt = Date.now(), lastErr = 0, actN = 0, restoring = false, lobbySig = '', chatSig = '';
      const errs = {}, ui = {};
            const isHost = () => R && R.host === uid;

      el.innerHTML = `<style>${CSS}${def.css || ''}</style>
      <div class="mp">
        <div class="bar"><span><b class="rname"></b> <span class="code">${code}</span></span>
          <span class="row"><button class="btn ghost share" style="padding:5px 12px">🔗 Chia sẻ</button><button class="btn ghost leave" style="padding:5px 12px">🚪 Rời</button></span></div>
        <div class="seats"></div>
        <div class="box lobby" hidden>
          <div class="hint">Cần ${def.min}–${def.max} người. Chủ phòng bấm bắt đầu khi đủ người (có thể thêm bot).</div>
          <div class="row hostctl" hidden style="margin-top:8px"><button class="btn ghost addbot">🤖 + Bot</button><button class="btn ghost rmbot">🤖 − Bot</button><button class="btn ok start">▶ Bắt đầu</button><button class="btn bad closeroom">⛔ Đóng phòng</button></div>
          ${(def.opts || []).map(o => `<label class="optl" style="display:block;margin-top:8px">${GV.esc(o.label)} <select class="opt" data-k="${o.k}">${o.values.map(v => `<option>${v}</option>`).join('')}</select></label>`).join('')}
          <div class="msg wait"></div>
        </div>
        <div class="err"></div>
        <div class="game" hidden></div>
        <div class="row hostend" hidden><button class="btn newg">🔄 Ván mới (về sảnh)</button></div>
        ${def.summary ? `<details class="box hst"><summary>📚 Lịch sử các ván</summary><div class="hl hint">Chưa có ván nào.</div><div class="row hostclr" hidden style="margin-top:6px"><button class="btn ghost clh" style="padding:5px 12px">🗑 Xoá lịch sử</button></div></details>` : ''}
        <details class="box chat"><summary>💬 Chat</summary><div class="cl"></div><div class="row" style="margin-top:6px"><input class="ci" maxlength="200" placeholder="Nhập tin nhắn…" style="flex:1"><button class="btn cs" style="padding:6px 14px">Gửi</button></div></details>
      </div>`;

      /* --- người chơi & bot --- */
      const seats = () => {
        const a = [];
        Object.entries(R.players || {}).forEach(([id, p]) => p && a.push({ id, name: p.name || '?', bot: false, online: p.online !== false, at: p.at || 0, opts: p.opts || {} }));
        Object.entries(R.bots || {}).forEach(([id, p]) => p && a.push({ id, name: p.name || 'Bot', bot: true, online: true, at: p.at || 0 }));
        return a.sort((x, y) => x.at - y.at || (x.id < y.id ? -1 : 1));
      };

      /* --- chủ phòng: công bố trạng thái --- */
      function publish(extra) {
        const up = Object.assign({}, extra);
        const pub = clean(def.pub(S)) || {}; pub._t = Date.now();
        up[`mprooms/${code}/pub`] = pub;
        seats().filter(s => !s.bot).forEach(s => { const pv = clean(def.priv(S, s.id)) || {}; pv._err = errs[s.id] || null; up[`mpprivate/${code}/${s.id}`] = pv; });
        up[`mpstate/${code}`] = S.over ? null : JSON.stringify(S); // chỉ giữ trạng thái khi ván còn đang chơi
        if (S.over) {
          up[`mprooms/${code}/meta/status`] = 'ended';
          if (def.summary && !S._h) { S._h = 1; const sm = clean(def.summary(S)) || {}; up[`mprooms/${code}/history/${R.meta.round || 1}`] = { round: R.meta.round || 1, at: Date.now(), title: 'Ván ' + (R.meta.round || 1) + (sm.title ? ' · ' + sm.title : ''), lines: sm.lines || null }; }
        }
        root.update(up).catch(e => { showErr(F.explain(e)); });
      }
      function startGame() {
        const st = seats();
        if (st.length < def.min) return showErr(`Cần ít nhất ${def.min} người (thêm bot nếu thiếu).`);
        if (st.length > def.max) return showErr(`Tối đa ${def.max} người.`);
        S = def.init(st.map(s => ({ id: s.id, name: s.name, bot: s.bot, opts: s.opts || {} })), api); seen = Object.assign({}, seen);
        publish({ [`mprooms/${code}/meta/status`]: 'playing' });
      }
      function processActs() {
        if (!isHost() || !S || S.over) return;
        let changed = false; const act = R.act || {};
        for (const id in act) {
          const a = act[id]; if (!a || !(a.n > (seen[id] || 0))) continue;
          seen[id] = a.n;
          const e = def.reduce(S, id, a.a, api); errs[id] = e ? { msg: e, at: Date.now() } : null; changed = true;
        }
        if (changed) publish();
      }
      let beat = Date.now(), trimN = 0;
      function hostLoop() {
        if (isHost() && R && Date.now() - beat > 600000) { beat = Date.now(); db.ref('mplobby/' + code + '/at').set(TS); } // giữ phòng "còn sống"
        if (isHost() && R && ++trimN % 25 === 0) { // giữ dữ liệu gọn: chat tối đa 50 tin, lịch sử tối đa 30 ván
          const ch = Object.entries(R.chat || {}).sort((a, b) => a[1].at - b[1].at); if (ch.length > 50) ch.slice(0, ch.length - 50).forEach(([k]) => ref.child('chat/' + k).remove());
          const hs = Object.keys(R.history || {}).sort((a, b) => a - b); if (hs.length > 30) hs.slice(0, hs.length - 30).forEach(k => ref.child('history/' + k).remove());
        }
        if (!isHost() || !S || S.over || !R) return;
        let changed = false;
        for (const s of seats()) {
          const auto = s.bot || !s.online; // bot, hoặc người chơi mất kết nối => máy chơi hộ
          if (!auto) continue;
          const a = def.bot(S, s.id, api);
          if (a) { def.reduce(S, s.id, a, api); changed = true; break; }
        }
        if (def.tick && def.tick(S, Date.now(), api)) changed = true;
        if (changed) publish();
      }

      /* --- nhận dữ liệu --- */
      function onVal(snap) {
        if (dead) return;
        R = snap.val();
        if (!R || !R.meta) { cleanup(); entry('Phòng không còn tồn tại.'); return; }
        recvAt = Date.now(); api.host = R.host;
        if (R.meta.closed && R.host !== uid) { cleanup(); history.replaceState(null, '', `#/game/${def.id}`); entry('Chủ phòng đã đóng phòng.'); return; }
        const st = R.meta.status, hostNow = isHost();
        if (hostNow && seen === null) seen = Object.fromEntries(Object.entries(R.act || {}).map(([k, v]) => [k, (v && v.n) || 0]));
        if (hostNow && st === 'playing' && !S && !restoring) { // chủ phòng tải lại trang giữa ván
          restoring = true;
          root.child('mpstate/' + code).once('value').then(x => { try { S = JSON.parse(x.val()); } catch (e) { S = null; } restoring = false; if (S) publish(); });
        }
        if (hostNow && st === 'lobby') S = null;
        if (hostNow && !loopT) loopT = setInterval(hostLoop, 800);
        if (!hostNow && loopT) { clearInterval(loopT); loopT = null; }
        processActs();
        if (hostNow && !R.meta.closed) { // đồng bộ danh sách phòng công khai
          const cnt = seats().filter(s => !s.bot && s.online).length, sig = cnt + '/' + st;
          if (sig !== lobbySig) { lobbySig = sig; db.ref('mplobby/' + code).update({ count: cnt, status: st, at: TS }); }
        }
        renderAll();
      }
      function renderAll() {
        const st = R.meta.status, host = isHost(), sl = seats();
        $('.rname').textContent = R.meta.name || '';
        const turnId = R.pub && R.pub.turn;
        $('.seats').innerHTML = sl.map(s => `<span class="seat ${turnId === s.id ? 'turn' : ''}">${s.bot ? '🤖' : s.online ? '🟢' : '⚪'} ${GV.esc(s.name)}${s.id === R.host ? ' 👑' : ''}${s.id === uid ? ' (bạn)' : ''}</span>`).join('');
        $('.lobby').hidden = st !== 'lobby';
        $('.hostctl').hidden = !host;
        $('.wait').textContent = st === 'lobby' ? (host ? `Đang có ${sl.length} người.` : 'Đang chờ chủ phòng bắt đầu…') : '';
        $('.hostend').hidden = !(host && st === 'ended');
        const g = $('.game'); g.hidden = st === 'lobby' || !R.pub;
        if (!g.hidden) renderGame();
        el.querySelectorAll('.opt').forEach(sel => { const v = ((R.players[uid] || {}).opts || {})[sel.dataset.k]; const o = def.opts.find(x => x.k === sel.dataset.k); if (document.activeElement !== sel) sel.value = v != null ? v : o.def; });
        renderHist();
        renderChat();
        if (P && P._err && P._err.at > lastErr) { lastErr = P._err.at; showErr(P._err.msg); }
      }
      function ctx() {
        return {
          pub: R.pub, priv: P || {}, me: uid, code, round: R.meta.round || 1, isHost: isHost(), ui, esc: GV.esc, fmtT,
          names: Object.fromEntries(seats().map(s => [s.id, s.name])), seats: seats(),
          left: dl => dl - ((R.pub._t || Date.now()) + (Date.now() - recvAt)),
          send: a => { actN = Math.max(actN + 1, Date.now()); ref.child('act/' + uid).set({ n: actN, a: clean(a) }); },
          toast: showErr
        };
      }
      function renderGame() {
        const g = $('.game'), y = window.scrollY, x = window.scrollX;
        g.style.minHeight = g.offsetHeight + 'px';
        try { def.render(g, ctx()); } catch (e) { console.error(e); g.textContent = 'Lỗi hiển thị: ' + e.message; }
        window.scrollTo(x, y); requestAnimationFrame(() => { g.style.minHeight = ''; window.scrollTo(x, y); });
        tickCountdown();
      }
      function tickCountdown() {
        if (!R || !R.pub) return;
        el.querySelectorAll('[data-dl]').forEach(n => { n.textContent = fmtT(ctx().left(+n.dataset.dl)); });
      }
      let errT = null;
      function showErr(m) { const e = $('.err'); if (!e) return; e.textContent = m; clearTimeout(errT); errT = setTimeout(() => { e.textContent = ''; }, 3500); }

      /* --- lịch sử các ván --- */
      function renderHist() {
        const hl = $('.hl'); if (!hl) return;
        const h = Object.values(R.history || {}).filter(Boolean).sort((a, b) => b.round - a.round), host = isHost();
        $('.hostclr').hidden = !host;
        hl.innerHTML = h.length ? h.map(x => `<div style="border-bottom:1px solid var(--line);padding:4px 0;text-align:left"><b>${GV.esc(x.title || '')}</b>${host ? ` <a href="#" data-h="${x.round}" style="color:var(--bad)" title="Xoá ván này">✕</a>` : ''}${toList(x.lines).map(l => `<div>${GV.esc(l)}</div>`).join('')}</div>`).join('') : 'Chưa có ván nào.';
      }
      const toList = v => !v ? [] : Array.isArray(v) ? v.filter(x => x != null) : Object.keys(v).sort((a, b) => a - b).map(k => v[k]);

      /* --- chat --- */
      function renderChat() {
        const list = Object.values(R.chat || {}).filter(Boolean).sort((a, b) => a.at - b.at).slice(-40);
        const sig = list.length + ':' + (list.length ? list[list.length - 1].at : 0);
        if (sig === chatSig) return; chatSig = sig;
        const cl = $('.cl'); cl.innerHTML = list.map(m => `<div><b>${GV.esc(m.name)}:</b> ${GV.esc(m.text)}</div>`).join('') || '<span class="hint">Chưa có tin nhắn.</span>';
        cl.scrollTop = cl.scrollHeight;
      }
      const sendChat = () => { const t = $('.ci').value.trim(); if (!t) return; $('.ci').value = ''; ref.child('chat').push({ uid, name, text: t.slice(0, 200), at: Date.now() }).catch(e => showErr(F.explain(e))); };
      $('.cs').onclick = sendChat; $('.ci').onkeydown = e => { if (e.key === 'Enter') sendChat(); };

      /* --- điều khiển --- */
      ref.on('value', onVal);
      const pref = root.child(`mpprivate/${code}/${uid}`);
      const onP = s => { P = s.val(); if (R && R.pub && R.meta.status !== 'lobby') renderGame(); if (P && P._err && P._err.at > lastErr) { lastErr = P._err.at; showErr(P._err.msg); } };
      pref.on('value', onP);
      roomOff = () => { ref.off('value', onVal); pref.off('value', onP); };
      tickT = setInterval(tickCountdown, 1000);
      $('.addbot').onclick = () => { const n = Object.keys(R.bots || {}).length + 1; if (seats().length >= def.max) return showErr('Phòng đã đầy.'); ref.child('bots/b' + (Date.now() % 100000)).set({ name: 'Bot ' + n, at: Date.now() }); };
      $('.rmbot').onclick = () => { const ids = Object.keys(R.bots || {}); if (ids.length) ref.child('bots/' + ids[ids.length - 1]).remove(); };
      $('.start').onclick = startGame;
      el.querySelectorAll('.opt').forEach(sel => { sel.onchange = () => me.child('opts/' + sel.dataset.k).set(sel.value); });
      if ($('.clh')) {
        $('.clh').onclick = () => { if (confirm('Xoá toàn bộ lịch sử các ván?')) ref.child('history').remove(); };
        $('.hl').onclick = e => { const r = e.target.dataset.h; if (r === undefined) return; e.preventDefault(); if (isHost() && confirm('Xoá ván ' + r + ' khỏi lịch sử?')) ref.child('history/' + r).remove(); };
      }
      $('.newg').onclick = () => { S = null; root.update({ [`mprooms/${code}/meta/status`]: 'lobby', [`mprooms/${code}/meta/round`]: (R.meta.round || 1) + 1, [`mprooms/${code}/pub`]: null, [`mprooms/${code}/act`]: null, [`mpprivate/${code}`]: null, [`mpstate/${code}`]: null }); seen = null; };
      // Xoá hẳn dữ liệu phòng (tránh để rác trong database)
      async function deleteRoom() {
        cleanup(); history.replaceState(null, '', `#/game/${def.id}`);
        try { await root.update({ [`mprooms/${code}`]: null, [`mpprivate/${code}`]: null, [`mpstate/${code}`]: null, [`mplobby/${code}`]: null }); entry('Đã xoá phòng ' + code + '.'); }
        catch (e) { entry(F.explain(e)); }
      }
      $('.closeroom').onclick = () => { if (confirm('Đóng và xoá phòng? Mọi người sẽ bị đưa ra ngoài.')) deleteRoom(); };
      $('.leave').onclick = () => {
        if (!R) return;
        const others = seats().filter(s => !s.bot && s.online && s.id !== uid), host = isHost();
        if (host && others.length) { if (confirm('Bạn là chủ phòng. Rời đi sẽ đóng và xoá phòng cho mọi người. Tiếp tục?')) deleteRoom(); return; }
        if (!others.length) { // không còn ai khác trong phòng
          if (confirm('Không còn người chơi nào khác trong phòng.\nXoá phòng luôn để tránh rác dữ liệu?')) return deleteRoom();
        }
        cleanup(); root.update({ [`mprooms/${code}/players/${uid}`]: null, [`mprooms/${code}/act/${uid}`]: null, [`mpprivate/${code}/${uid}`]: null }).catch(() => me.child('online').set(false));
        history.replaceState(null, '', `#/game/${def.id}`); entry();
      };
      $('.share').onclick = async () => {
        const url = location.origin + location.pathname + `#/game/${def.id}/${code}`;
        try { if (navigator.share) await navigator.share({ title: def.name, text: `Vào phòng ${def.name} ${code}`, url }); else { await navigator.clipboard.writeText(url); $('.share').textContent = 'Đã chép ✓'; } } catch (e) {}
      };
    }

    function cleanup() { if (roomOff) roomOff(); roomOff = null; clearInterval(loopT); clearInterval(tickT); loopT = tickT = null; }

    entry();
    return () => { dead = true; if (listOff) listOff(); cleanup(); };
  }
})();
