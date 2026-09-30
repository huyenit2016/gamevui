// CMS GameVui: đăng nhập, phân quyền (admin · CTV · giáo viên · học sinh), quản lý phòng & dọn rác, người dùng, cấu hình web, thông báo, thư viện khoá học, giao bài.
(function () {
  const A = GV.account, L = GV.learn, esc = GV.esc, T = (m, o) => GV.toast(m, o);
  const root = document.getElementById('cms');
  const $ = (s, r = root) => r.querySelector(s), $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const fdate = t => t ? new Date(t).toLocaleString('vi-VN') : '—';
  const ago = ms => { const m = Math.floor(ms / 60000); return m < 1 ? 'vừa xong' : m < 60 ? m + ' phút' : m < 1440 ? Math.floor(m / 60) + ' giờ' : Math.floor(m / 1440) + ' ngày'; };
  const GAME = { uno: '🃏 Uno', tienlen: '♠️ Tiến lên', masoi: '🐺 Ma sói', cotuong: '♟️ Cờ tướng', chess: '♞ Cờ vua', lotoonline: '🌐 Lô tô' };
  let timers = [], tab = (location.hash || '').slice(1) || 'home';
  const clearTimers = () => { timers.forEach(clearInterval); timers = []; };
  GV.cmsOff = [];

  /* =============== ĐĂNG NHẬP / ĐĂNG KÝ =============== */
  function authView(msg) {
    root.innerHTML = `<div class="cx"><div class="card2 authbox"><h2 style="text-align:center">🔐 Đăng nhập GameVui</h2>
      <p class="hint" style="text-align:center">Khách vẫn chơi bình thường <b>không cần đăng nhập</b>. Đăng nhập để giao bài / nhận bài, đăng khoá học hoặc quản trị.</p>
      <div class="row"><button class="pbtn sel" data-m="in">Đăng nhập</button><button class="pbtn" data-m="up">Đăng ký</button><button class="pbtn" data-m="rs">Quên mật khẩu</button></div>
      <form class="col" style="max-width:none;margin-top:10px" autocomplete="on">
        <input class="w nm" placeholder="Họ tên" autocomplete="name" hidden>
        <input class="w em" type="email" placeholder="Email" autocomplete="email" required>
        <input class="w pw" type="password" placeholder="Mật khẩu (≥ 6 ký tự)" autocomplete="current-password">
        <select class="w rq" hidden><option value="student">Tôi là học sinh</option><option value="teacher">Tôi là giáo viên (cần admin duyệt)</option><option value="collab">Tôi là cộng tác viên (cần admin duyệt)</option></select>
        <input class="w sc" type="password" placeholder="Mã thiết lập quản trị (chỉ chủ website – tuỳ chọn)" hidden>
        <button class="btn go" type="submit">Đăng nhập</button><div class="msg er" style="color:var(--bad)">${esc(msg || '')}</div></form></div></div>`;
    let mode = 'in';
    const set = m => {
      mode = m; $$('[data-m]').forEach(b => b.classList.toggle('sel', b.dataset.m === m));
      $('.nm').hidden = $('.rq').hidden = $('.sc').hidden = m !== 'up'; $('.pw').hidden = m === 'rs';
      $('.pw').autocomplete = m === 'up' ? 'new-password' : 'current-password';
      $('.go').textContent = { in: 'Đăng nhập', up: 'Tạo tài khoản', rs: 'Gửi email đặt lại mật khẩu' }[m];
    };
    $$('[data-m]').forEach(b => b.onclick = () => set(b.dataset.m));
    $('form').onsubmit = async e => {
      e.preventDefault(); const em = $('.em').value, pw = $('.pw').value, btn = $('.go'); btn.disabled = true; $('.er').textContent = '';
      try {
        if (mode === 'in') await A.signIn(em, pw);
        else if (mode === 'up') {
          if (!$('.nm').value.trim()) throw { code: '', message: 'Nhập họ tên của bạn.' };
          await A.signUp(em, pw, $('.nm').value, $('.rq').value);
          if ($('.sc').value) { const ok = await A.claimAdmin($('.sc').value).catch(() => false); T(ok ? 'Đã thiết lập bạn là Quản trị viên 🛡️' : 'Mã thiết lập không đúng – bạn đang là học sinh.', { type: ok ? 'success' : 'warn' }); }
          else if ($('.rq').value !== 'student') T('Đã gửi yêu cầu làm ' + A.ROLES[$('.rq').value] + ' – chờ quản trị viên duyệt.', { type: 'info' });
        } else { await A.resetPassword(em); T('Đã gửi email đặt lại mật khẩu (kiểm tra cả thư mục Spam).', { type: 'success' }); btn.disabled = false; return; }
        T('Xin chào ' + ((A.profile && A.profile.name) || em) + '!', { type: 'success' }); panelView();
      } catch (x) { $('.er').textContent = x.message && !x.code ? x.message : A.authMsg(x); btn.disabled = false; }
    };
  }

  /* =============== KHUNG CHÍNH =============== */
  const TABS = [
    ['home', '🏠 Tổng quan', ['admin', 'collab', 'teacher', 'student']],
    ['rooms', '🛰️ Phòng & dọn rác', ['admin']],
    ['users', '👥 Người dùng', ['admin']],
    ['config', '⚙️ Cấu hình web', ['admin']],
    ['announce', '📢 Thông báo', ['admin', 'collab']],
    ['library', '📚 Thư viện khoá học', ['admin', 'collab', 'teacher']],
    ['class', '🎓 Lớp & bài giao', ['admin', 'teacher']],
    ['mywork', '🧑‍🎓 Bài của tôi', ['admin', 'collab', 'teacher', 'student']]
  ];
  function panelView() {
    clearTimers(); if (GV.cmsOff.length) GV.cmsOff.splice(0).forEach(f => { try { f(); } catch (e) {} });
    if (!A.user) return authView();
    const tabs = TABS.filter(t => t[2].includes(A.role)); if (!tabs.find(t => t[0] === tab)) tab = 'home';
    root.innerHTML = `<div class="cx"><div class="card2 row" style="justify-content:space-between"><span style="font-size:1.1rem"><b>${A.ICON[A.role]} ${esc((A.profile && A.profile.name) || A.user.email)}</b> <span class="tag ${A.isAdmin ? 'ok' : ''}">${A.ROLES[A.role]}</span> ${A.profile && A.profile.requested ? `<span class="tag warn">đang chờ duyệt: ${A.ROLES[A.profile.requested]}</span>` : ''}<br><span class="hint">${esc(A.user.email)}</span></span><span class="row"><button class="btn ghost sm rr" title="Tải lại vai trò nếu admin vừa duyệt cho bạn">🔄 Cập nhật quyền</button><a class="btn ghost sm" href="./">🎮 Về GameVui</a><button class="btn ghost sm lo">Đăng xuất</button></span></div>
      <div class="tabsx">${tabs.map(t => `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}">${t[1]}<span class="badge" id="bd-${t[0]}" hidden></span></button>`).join('')}</div><div id="tabc"></div></div>`;
    $('.lo').onclick = () => A.signOut();
    $('.rr').onclick = () => recheck(true);
    $$('.tabsx [data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; history.replaceState(null, '', '#' + tab); panelView(); });
    const fn = { home, rooms, users, config, announce, library, class: classTab, mywork }[tab]; Promise.resolve(fn($('#tabc'))).catch(e => { $('#tabc').innerHTML = `<div class="card2"><b style="color:var(--bad)">⚠️ ${esc(GV.fbInfo().explain(e))}</b></div>`; });
    if (A.isAdmin) watchJunk();
  }
  const db = () => A.db;
  const badge = (id, n) => { const b = document.getElementById('bd-' + id); if (b) { b.hidden = !n; b.textContent = n; } };

  /* =============== TỔNG QUAN =============== */
  async function home(c) {
    const p = A.profile || {}, me = ['guest', 'student', 'teacher', 'collab', 'admin'].indexOf(A.role) - 1; // cột của vai trò
    const cols = ['student', 'teacher', 'collab', 'admin'];
    c.innerHTML = `<div class="card2"><h2>Xin chào 👋</h2>
        <div class="grid2"><div><label class="f">Họ tên hiển thị</label><div class="row" style="justify-content:flex-start"><input class="w nm" value="${esc(p.name || '')}" style="flex:1"><button class="btn sm sv">Lưu</button></div></div>
        ${A.role === 'student' || A.role === 'teacher' ? `<div><label class="f">Xin nâng quyền</label><div class="row" style="justify-content:flex-start"><select class="rq" style="flex:1"><option value="">— không —</option>${A.role === 'student' ? '<option value="teacher">Giáo viên</option>' : ''}<option value="collab">Cộng tác viên</option></select><button class="btn ghost sm rqb">Gửi yêu cầu</button></div></div>` : ''}</div></div>
      ${A.isAdmin ? '<div class="grid2" id="stats"></div>' : ''}
      <div class="card2"><h3>Quyền của từng vai trò</h3><div class="tw"><table class="perm"><tr><th>Chức năng</th><th>Khách</th>${cols.map(r => `<th class="${r === A.role ? 'me' : ''}">${A.ICON[r]} ${A.ROLES[r]}</th>`).join('')}</tr>
        ${A.PERMS.map(r => `<tr><td>${esc(r[0])}</td>${r.slice(1).map((v, i) => `<td class="${v ? 'y' : 'n'} ${i === me + 1 && i > 0 ? 'me' : ''}">${v ? '✔' : '—'}</td>`).join('')}</tr>`).join('')}</table></div>
        <div class="hint">Quyền được cưỡng chế bằng Firebase Rules (không chỉ ẩn nút trên giao diện).</div></div>
      ${!A.isAdmin ? `<details class="card2"><summary>🔑 Tôi là chủ website (nhập mã thiết lập quản trị)</summary><p class="hint">Mã do bạn tự đặt trong Firebase tại <code>setup/secret</code> (xem FIREBASE.md). Chỉ dùng lần đầu để trở thành Quản trị viên.</p><div class="row"><input class="sc" type="password" placeholder="Mã thiết lập"><button class="btn sm cl">Xác nhận</button></div></details>` : ''}`;
    $('.sv', c).onclick = async () => { await db().ref('users/' + A.user.uid + '/name').set($('.nm', c).value.trim()); A.profile = Object.assign(A.profile || {}, { name: $('.nm', c).value.trim() }); T('Đã lưu tên.', { type: 'success' }); };
    if ($('.rqb', c)) $('.rqb', c).onclick = async () => { const v = $('.rq', c).value; if (!v) return; await db().ref('users/' + A.user.uid + '/requested').set(v); T('Đã gửi yêu cầu – chờ quản trị viên duyệt.', { type: 'success' }); A.profile.requested = v; panelView(); };
    if ($('.cl', c)) $('.cl', c).onclick = async () => { const ok = await A.claimAdmin($('.sc', c).value).catch(() => false); T(ok ? 'Bạn đã là Quản trị viên 🛡️' : 'Mã thiết lập không đúng.', { type: ok ? 'success' : 'error' }); if (ok) panelView(); };
    if (A.isAdmin) {
      const [tot, uni, us] = await Promise.all([db().ref('stats/total').once('value'), db().ref('stats/unique').once('value'), db().ref('users').once('value')]);
      const u = Object.values(us.val() || {}), by = r => u.filter(x => (x.role || 'student') === r).length;
      $('#stats', c).innerHTML = [['👁', tot.val() || 0, 'Lượt truy cập'], ['🌐', uni.val() || 0, 'Người dùng (IP)'], ['👥', u.length, 'Tài khoản'], ['🎓', by('teacher'), 'Giáo viên'], ['✍️', by('collab'), 'Cộng tác viên'], ['⏳', u.filter(x => x.requested).length, 'Chờ duyệt']].map(([i, n, l]) => `<div class="stat">${i}<b>${n}</b>${l}</div>`).join('');
    }
  }

  /* =============== PHÒNG & DỌN RÁC =============== */
  const HOUR2 = 2 * 3600e3;
  const ROOT = { mp: 'mprooms', mpl: 'mplobby', calls: 'calls', cl: 'calllobby', lg: 'rooms', ll: 'lobby' };
  let lastScan = null, prevJunk = null, knownRooms = null;
  async function scan() {
    const d = {}; await Promise.all(Object.entries(ROOT).map(async ([k, p]) => { try { d[k] = (await db().ref(p).once('value')).val() || {}; } catch (e) { d[k] = {}; } }));
    const now = Date.now(), rows = [];
    for (const [code, r] of Object.entries(d.mp)) {
      const meta = r.meta || {}, pl = Object.entries(r.players || {}).filter(([, p]) => p), online = pl.filter(([, p]) => p.online !== false).length, lob = d.mpl[code], at = (lob && lob.at) || meta.createdAt || 0, age = at ? now - at : Infinity, why = [];
      if (!r.meta) why.push('mất dữ liệu phòng'); if (online === 0 && age > 120000) why.push('không còn ai trong phòng'); if (age > HOUR2) why.push('bỏ hoang > 2 giờ'); if (meta.closed) why.push('đã đóng');
      rows.push({ kind: 'mp', code, title: meta.name || '(không tên)', game: GAME[meta.game] || meta.game || '?', host: (r.players && r.host && r.players[r.host] && r.players[r.host].name) || '—', online, total: pl.length, bots: Object.keys(r.bots || {}).length, status: meta.status || '?', age, why, players: pl.map(([id, p]) => (p.online !== false ? '🟢 ' : '⚪ ') + (p.name || id)), paths: [`mprooms/${code}`, `mpprivate/${code}`, `mpstate/${code}`, `mplobby/${code}`] });
    }
    for (const code of Object.keys(d.mpl)) if (!d.mp[code]) rows.push({ kind: 'mp', code, title: d.mpl[code].name || '(mồ côi)', game: GAME[d.mpl[code].game] || d.mpl[code].game || '?', host: d.mpl[code].hostName || '—', online: 0, total: 0, bots: 0, status: 'mồ côi', age: now - (d.mpl[code].at || 0), why: ['mục danh sách mồ côi (phòng không còn)'], players: [], paths: [`mplobby/${code}`, `mpprivate/${code}`, `mpstate/${code}`] });
    for (const [code, r] of Object.entries(d.calls)) {
      const lob = d.cl[code], at = (lob && lob.at) || r.createdAt || 0, age = at ? now - at : Infinity, why = [];
      if (!lob) why.push('không có trong danh sách lớp'); if (age > HOUR2) why.push('bỏ hoang > 2 giờ'); if (!r.host) why.push('mất dữ liệu lớp');
      rows.push({ kind: 'call', code, title: r.title || '(lớp học)', game: '🎓 Lớp 1-1', host: r.hostName || '—', online: r.guest ? 2 : 1, total: r.guest ? 2 : 1, bots: 0, status: r.guest ? 'đang học' : 'chờ học viên', age, why, players: [r.hostName && 'GV ' + r.hostName, r.guestName && 'HV ' + r.guestName].filter(Boolean), paths: [`calls/${code}`, `calllobby/${code}`] });
    }
    for (const code of Object.keys(d.cl)) if (!d.calls[code]) rows.push({ kind: 'call', code, title: d.cl[code].title || '(mồ côi)', game: '🎓 Lớp 1-1', host: d.cl[code].hostName || '—', online: 0, total: 0, bots: 0, status: 'mồ côi', age: now - (d.cl[code].at || 0), why: ['mục danh sách lớp mồ côi'], players: [], paths: [`calllobby/${code}`] });
    for (const code of Object.keys(d.lg)) rows.push({ kind: 'legacy', code, title: 'Phòng Lô tô (bản cũ)', game: '🗑 Dữ liệu cũ', host: '—', online: 0, total: 0, bots: 0, status: 'cũ', age: Infinity, why: ['dữ liệu của phiên bản cũ'], players: [], paths: [`rooms/${code}`, `lobby/${code}`] });
    for (const code of Object.keys(d.ll)) if (!d.lg[code]) rows.push({ kind: 'legacy', code, title: 'Mục danh sách cũ', game: '🗑 Dữ liệu cũ', host: '—', online: 0, total: 0, bots: 0, status: 'cũ', age: Infinity, why: ['dữ liệu của phiên bản cũ'], players: [], paths: [`lobby/${code}`] });
    rows.forEach(r => r.junk = r.why.length > 0);
    return rows;
  }
  const delRows = async rows => { const up = {}; rows.forEach(r => r.paths.forEach(p => up[p] = null)); if (Object.keys(up).length) await db().ref().update(up); };
  let junkTimer = null;
  function watchJunk() { // chạy nền khi admin đang mở CMS: báo toast + tự dọn nếu bật
    clearInterval(junkTimer);
    const tick = async (first) => {
      let rows; try { rows = await scan(); } catch (e) { return; }
      lastScan = rows; const junk = rows.filter(r => r.junk); badge('rooms', junk.length);
      const auto = (await db().ref('config/autoclean').once('value')).val() === true;
      if (auto && junk.length) { try { await delRows(junk); T(`Đã tự động dọn ${junk.length} phòng rác 🧹`, { type: 'success' }); lastScan = rows.filter(r => !r.junk); prevJunk = new Set(); badge('rooms', 0); if (tab === 'rooms') roomsDraw(); return; } catch (e) { T('Tự dọn thất bại: ' + GV.fbInfo().explain(e), { type: 'error' }); } }
      const keys = new Set(junk.map(r => r.kind + r.code));
      if (prevJunk !== null) { const fresh = junk.filter(r => !prevJunk.has(r.kind + r.code)); if (fresh.length) T(`Phát hiện ${fresh.length} phòng rác mới${fresh.length === 1 ? ': ' + fresh[0].game + ' #' + fresh[0].code : ''}.`, { type: 'warn', action: { label: 'Dọn ngay', fn: async () => { await delRows(fresh); T('Đã dọn xong 🧹', { type: 'success' }); tick(); } } }); }
      else if (junk.length) T(`Có ${junk.length} phòng rác đang tồn tại.`, { type: 'warn', action: { label: 'Xem & dọn', fn: () => { tab = 'rooms'; panelView(); } } });
      if (knownRooms !== null) rows.filter(r => !r.junk && !knownRooms.has(r.kind + r.code)).slice(0, 3).forEach(r => T(`${r.game} #${r.code} vừa mở (${r.title})`, { type: 'info', icon: '🆕', ttl: 3500 }));
      knownRooms = new Set(rows.map(r => r.kind + r.code)); prevJunk = keys;
      if (tab === 'rooms') roomsDraw();
    };
    tick(true); junkTimer = setInterval(tick, 20000); timers.push(junkTimer);
  }
  let roomsEl = null;
  async function rooms(c) {
    roomsEl = c; c.innerHTML = `<div class="card2"><div class="row" style="justify-content:space-between"><h2 style="margin:0">🛰️ Tất cả phòng đang có</h2><span class="row"><button class="btn ghost sm rf">🔄 Làm mới</button><button class="btn bad sm cj">🧹 Dọn tất cả rác</button></span></div>
      <label class="row" style="justify-content:flex-start;margin-top:8px"><input type="checkbox" class="au"> Tự động dọn rác khi trang CMS đang mở (kiểm tra mỗi 20 giây)</label>
      <div class="hint">Phòng "rác" = không còn ai, bỏ hoang quá 2 giờ, mất dữ liệu, hoặc dữ liệu cũ. Phòng đang có người chơi sẽ không bị đụng tới.</div><div class="rl2" style="margin-top:10px">Đang quét…</div></div>`;
    $('.au', c).checked = (await db().ref('config/autoclean').once('value')).val() === true;
    $('.au', c).onchange = async e => { await db().ref('config/autoclean').set(e.target.checked); T(e.target.checked ? 'Đã bật tự động dọn rác.' : 'Đã tắt tự động dọn rác.', { type: 'info' }); };
    $('.rf', c).onclick = async () => { lastScan = await scan(); roomsDraw(); T('Đã làm mới danh sách.', { type: 'info', ttl: 1800 }); };
    $('.cj', c).onclick = async () => { const junk = (lastScan || []).filter(r => r.junk); if (!junk.length) return T('Không có phòng rác nào 🎉', { type: 'success' }); if (!confirm(`Xoá ${junk.length} phòng rác?`)) return; await delRows(junk); T(`Đã dọn ${junk.length} phòng rác 🧹`, { type: 'success' }); lastScan = await scan(); prevJunk = new Set(lastScan.filter(r => r.junk).map(r => r.kind + r.code)); roomsDraw(); badge('rooms', lastScan.filter(r => r.junk).length); };
    if (!lastScan) lastScan = await scan(); roomsDraw();
  }
  function roomsDraw() {
    const c = roomsEl; if (!c || !c.isConnected || !lastScan) return; const box = $('.rl2', c); if (!box) return; const rows = lastScan.slice().sort((a, b) => (b.junk - a.junk) || a.age - b.age);
    const junk = rows.filter(r => r.junk).length; badge('rooms', junk);
    box.innerHTML = `<div class="hint" style="margin-bottom:6px"><b>${rows.length}</b> phòng · <b style="color:${junk ? 'var(--bad)' : 'var(--ok)'}">${junk} rác</b></div>` + (rows.length ? `<div class="tw"><table><tr><th>Loại</th><th>Mã</th><th>Tên / chủ</th><th>Người</th><th>Trạng thái</th><th>Tuổi</th><th>Tình trạng</th><th></th></tr>${rows.map((r, i) => `<tr><td>${esc(r.game)}</td><td><b>${esc(r.code)}</b></td><td>${esc(r.title)}<br><span class="hint">${esc(r.host)}</span></td><td>${r.online}/${r.total}${r.bots ? ' +' + r.bots + '🤖' : ''}</td><td>${esc(r.status)}</td><td>${r.age === Infinity ? '—' : ago(r.age)}</td><td>${r.junk ? `<span class="tag bad">🗑 rác</span><br><span class="hint">${esc(r.why.join(', '))}</span>` : '<span class="tag ok">✅ ổn</span>'}</td><td><button class="pbtn sm" data-v="${i}">Xem</button> <button class="btn bad sm" data-d="${i}">Xoá</button></td></tr><tr class="pv" id="pv${i}" hidden><td colspan="8"><span class="hint">Người chơi:</span> ${r.players.length ? r.players.map(esc).join(' · ') : '(không có)'}</td></tr>`).join('')}</table></div>` : '<div class="msg">🎉 Hiện không có phòng nào.</div>');
    box.onclick = async e => {
      const v = e.target.closest('[data-v]'), d = e.target.closest('[data-d]');
      if (v) { const x = document.getElementById('pv' + v.dataset.v); x.hidden = !x.hidden; }
      if (d) { const r = rows[+d.dataset.d]; if (!confirm(`Xoá phòng ${r.game} #${r.code}?${r.online ? '\nĐang có ' + r.online + ' người trong phòng!' : ''}`)) return; await delRows([r]); T(`Đã xoá phòng #${r.code}.`, { type: 'success' }); lastScan = await scan(); roomsDraw(); }
    };
  }

  /* =============== NGƯỜI DÙNG & PHÂN QUYỀN =============== */
  async function users(c) {
    c.innerHTML = '<div class="card2"><h2>👥 Người dùng & phân quyền</h2><input class="w q" placeholder="Tìm theo tên / email…"><div class="ul tw" style="margin-top:8px">Đang tải…</div></div>';
    const [us, ad] = await Promise.all([db().ref('users').once('value'), db().ref('admins').once('value')]);
    const U = Object.entries(us.val() || {}).map(([id, u]) => Object.assign({ id }, u)).sort((a, b) => (b.requested ? 1 : 0) - (a.requested ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0)), AD = ad.val() || {};
    badge('users', U.filter(u => u.requested).length);
    const draw = () => {
      const q = $('.q', c).value.toLowerCase(), list = U.filter(u => !q || (u.name + ' ' + u.email).toLowerCase().includes(q));
      $('.ul', c).innerHTML = `<table><tr><th>Tên</th><th>Email</th><th>Vai trò</th><th>Yêu cầu</th><th>Tạo lúc</th><th></th></tr>${list.map(u => { const r = AD[u.id] ? 'admin' : (u.role || 'student'); return `<tr><td><b>${esc(u.name || '—')}</b>${u.id === A.user.uid ? ' <span class="tag">bạn</span>' : ''}</td><td>${esc(u.email || '')}</td><td><select data-r="${u.id}">${Object.keys(A.ROLES).map(k => `<option value="${k}" ${k === r ? 'selected' : ''}>${A.ROLES[k]}</option>`).join('')}</select></td><td>${u.requested ? `<span class="tag warn">${A.ROLES[u.requested]}</span> <button class="btn ok sm" data-a="${u.id}">Duyệt</button>` : '—'}</td><td class="hint">${fdate(u.createdAt)}</td><td><button class="btn sm" data-s="${u.id}">Lưu</button> <button class="pbtn sm" data-x="${u.id}">🗑</button></td></tr>`; }).join('')}</table>`;
    };
    $('.q', c).oninput = draw; draw();
    const setRole = async (id, role) => {
      const u = U.find(x => x.id === id); if (id === A.user.uid && role !== 'admin' && Object.keys(AD).length <= 1) return T('Bạn là quản trị viên duy nhất – không thể tự hạ quyền.', { type: 'warn' });
      await db().ref('users/' + id + '/role').set(role === 'admin' ? 'student' : role);
      if (role === 'admin') { await db().ref('admins/' + id).set({ k: 'by-admin' }); AD[id] = { k: 1 }; } else { await db().ref('admins/' + id).remove(); delete AD[id]; }
      await db().ref('users/' + id + '/requested').remove(); u.role = role === 'admin' ? 'student' : role; u.requested = null; T(`Đã đổi quyền của ${u.name || u.email} → ${A.ROLES[role]}.`, { type: 'success' }); draw(); badge('users', U.filter(x => x.requested).length);
    };
    $('.ul', c).onclick = async e => {
      const s = e.target.closest('[data-s]'), a = e.target.closest('[data-a]'), x = e.target.closest('[data-x]');
      if (s) await setRole(s.dataset.s, $(`[data-r="${s.dataset.s}"]`, c).value);
      if (a) await setRole(a.dataset.a, U.find(u => u.id === a.dataset.a).requested);
      if (x) { const u = U.find(v => v.id === x.dataset.x); if (u.id === A.user.uid) return T('Không thể xoá chính mình.', { type: 'warn' }); if (!confirm(`Xoá hồ sơ ${u.name || u.email}? (Tài khoản đăng nhập vẫn tồn tại trong Firebase Authentication.)`)) return; await db().ref().update({ ['users/' + u.id]: null, ['admins/' + u.id]: null, ['userIndex/' + A.emailKey(u.email)]: null }); U.splice(U.indexOf(u), 1); T('Đã xoá hồ sơ.', { type: 'success' }); draw(); }
    };
  }

  /* =============== CẤU HÌNH WEB =============== */
  async function config(c) {
    const cur = (await db().ref('config/site').once('value')).val() || {}, ad = cur.ads || {}, as = ad.adsense || {}, sl = as.slots || {};
    const ids = (window.GV_REGISTRY || []), chips = ids.map(i => `<span data-id="${i.id}" title="${esc(i.name)}">${i.icon} ${i.id}</span>`).join('');
    const csv = a => (a || []).join(', ');
    c.innerHTML = `<div class="card2"><h2>⚙️ Cấu hình web (tự động áp dụng cho mọi khách)</h2>
      <div class="grid2"><div><h3>Trang chủ</h3><label class="f">Nhãn nhỏ phía trên tiêu đề</label><input class="w pill" value="${esc(cur.pill ?? '✨ Mới: Cờ vua · Cờ tướng · Ma sói · Uno online')}">
        <label class="f">Khẩu hiệu – phần đầu</label><input class="w lead" value="${esc(cur.heroLead ?? 'Rủ hội chơi liền tay,')}"><label class="f">Khẩu hiệu – phần nhấn màu</label><input class="w grad" value="${esc(cur.heroGrad ?? 'không tải – không lag – không drama')}"><label class="f">Emoji cuối</label><input class="w emo" value="${esc(cur.heroEmoji ?? '🔥')}">
        <label class="f">Câu ở chân trang</label><input class="w foot" value="${esc(cur.footer ?? 'GameVui – nơi bạn bè gặp nhau để chơi, học và cười thật nhiều 💛')}"></div>
        <div><h3>Bật / tắt & nổi bật</h3><label class="f">Mục "🔥 Đang hot" (id, cách nhau dấu phẩy; để trống = mặc định)</label><textarea class="w hot" style="min-height:60px">${esc(csv(cur.hot))}</textarea>
        <label class="f">Mục gắn nhãn NEW</label><textarea class="w nw" style="min-height:60px">${esc(csv(cur.nw))}</textarea>
        <label class="f">Tạm đóng (ẩn với khách, admin vẫn thấy)</label><textarea class="w off" style="min-height:60px">${esc(csv(cur.off))}</textarea>
        <div class="hint">Bấm id để thêm vào ô đang chọn:</div><div class="idchips">${chips}</div></div></div></div>
      <div class="card2"><h3>📣 Quảng cáo</h3><label class="row" style="justify-content:flex-start"><input type="checkbox" class="aden" ${ad.enabled === false ? '' : 'checked'}> Hiển thị khu vực quảng cáo</label>
        <div class="grid2"><div><label class="f">AdSense client (ca-pub-…)</label><input class="w acl" value="${esc(as.client || '')}" placeholder="ca-pub-1234567890123456"><label class="f">Slot: trang chủ / xen kẽ / game / chân trang</label><div class="row"><input class="sl1" style="width:22%" value="${esc(sl.home || '')}"><input class="sl2" style="width:22%" value="${esc(sl.inline || '')}"><input class="sl3" style="width:22%" value="${esc(sl.game || '')}"><input class="sl4" style="width:22%" value="${esc(sl.footer || '')}"></div></div>
        <div><label class="f">Banner tự chèn (mỗi dòng: <code>ảnh | liên kết | mô tả</code>)</label><textarea class="w cb" style="min-height:90px" placeholder="https://…/banner.png | https://link-tiep-thi | Tên nhà tài trợ">${esc((ad.custom || []).map(b => [b.img, b.url, b.alt || ''].join(' | ')).join('\n'))}</textarea></div></div></div>
      <div class="card2 row"><button class="btn ok sv">💾 Lưu & áp dụng</button><a class="btn ghost" href="./" target="_blank">👁 Xem trang chủ</a><button class="btn ghost rs">↩︎ Khôi phục mặc định</button><button class="pbtn ex">⬇️ Xuất JSON</button><label class="pbtn">⬆️ Nhập JSON<input type="file" class="im" accept=".json" hidden></label></div>`;
    let focus = $('.hot', c); $$('textarea.hot,textarea.nw,textarea.off', c).forEach(t => t.onfocus = () => focus = t);
    $('.idchips', c).onclick = e => { const s = e.target.closest('[data-id]'); if (!s) return; const v = focus.value.split(',').map(x => x.trim()).filter(Boolean); if (!v.includes(s.dataset.id)) v.push(s.dataset.id); focus.value = v.join(', '); };
    const ids2 = t => $(t, c).value.split(',').map(s => s.trim()).filter(Boolean);
    const collect = () => ({ pill: $('.pill', c).value, heroLead: $('.lead', c).value, heroGrad: $('.grad', c).value, heroEmoji: $('.emo', c).value, footer: $('.foot', c).value, hot: ids2('.hot'), nw: ids2('.nw'), off: ids2('.off'),
      ads: { enabled: $('.aden', c).checked, adsense: { client: $('.acl', c).value.trim(), slots: { home: $('.sl1', c).value.trim(), inline: $('.sl2', c).value.trim(), game: $('.sl3', c).value.trim(), footer: $('.sl4', c).value.trim() } }, custom: $('.cb', c).value.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p[0] && p[1]).map(p => ({ img: p[0], url: p[1], alt: p[2] || '' })) }, updatedAt: Date.now() });
    $('.sv', c).onclick = async () => { await db().ref('config/site').set(collect()); T('Đã lưu! Khách sẽ thấy cấu hình mới trong vài giây.', { type: 'success' }); };
    $('.rs', c).onclick = async () => { if (!confirm('Khôi phục cấu hình mặc định?')) return; await db().ref('config/site').remove(); GV.store.set('siteconf', null); T('Đã khôi phục mặc định.', { type: 'success' }); config(c); };
    $('.ex', c).onclick = () => L.download('gamevui-config.json', JSON.stringify(collect(), null, 1), 'application/json');
    $('.im', c).onchange = async e => { try { const j = JSON.parse(await L.readFile(e.target.files[0])); await db().ref('config/site').set(j); T('Đã nhập cấu hình.', { type: 'success' }); config(c); } catch (x) { T('File JSON không hợp lệ.', { type: 'error' }); } };
  }

  /* =============== THÔNG BÁO =============== */
  async function announce(c) {
    const a = (await db().ref('config/announce').once('value')).val() || {};
    c.innerHTML = `<div class="card2"><h2>📢 Thông báo toàn web</h2><p class="hint">Hiện thành dải trên đầu trang chủ và một thông báo nổi (toast) cho khách. Khách tắt được; thông báo mới sẽ hiện lại.</p>
      <label class="f">Nội dung</label><textarea class="w tx" style="min-height:70px">${esc(a.text || '')}</textarea><div class="grid2"><div><label class="f">Loại</label><select class="w ty">${[['info', '📢 Thông tin'], ['success', '🎉 Tin vui'], ['warn', '⚠️ Cảnh báo']].map(([k, n]) => `<option value="${k}" ${a.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label class="f">Liên kết (tuỳ chọn)</label><input class="w lk" value="${esc(a.link || '')}" placeholder="https://…"></div></div>
      <label class="row" style="justify-content:flex-start"><input type="checkbox" class="ac" ${a.active !== false ? 'checked' : ''}> Đang hiển thị</label>
      <div class="row"><button class="btn ok sv">📣 Đăng thông báo</button><button class="btn ghost rm">Gỡ thông báo</button></div></div>`;
    $('.sv', c).onclick = async () => { const text = $('.tx', c).value.trim(); if (!text) return T('Nhập nội dung thông báo.', { type: 'warn' }); await db().ref('config/announce').set({ id: Date.now(), text, type: $('.ty', c).value, link: $('.lk', c).value.trim(), active: $('.ac', c).checked, by: A.user.uid }); T('Đã đăng thông báo.', { type: 'success' }); };
    $('.rm', c).onclick = async () => { await db().ref('config/announce').remove(); $('.tx', c).value = ''; T('Đã gỡ thông báo.', { type: 'info' }); };
  }

  /* =============== THƯ VIỆN KHOÁ HỌC =============== */
  async function library(c) {
    const canMod = A.has('admin', 'collab');
    c.innerHTML = `<div class="card2"><h2>📚 Thư viện khoá học</h2><div class="grid2"><div><h3>Đăng khoá mới</h3>
        <input type="file" class="fi" accept=".csv,.tsv,.txt,.json"> <button class="pbtn tp">⬇️ File mẫu</button>
        <textarea class="w ta" style="min-height:90px;margin-top:6px" placeholder="…hoặc dán nội dung (bài, từ, cách đọc, nghĩa, ví dụ)"></textarea>
        <div class="row"><input class="nm" placeholder="Tên khoá" style="flex:1"><select class="lg">${['en', 'ja', 'ko', 'zh'].map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('')}</select></div>
        <input class="w ds" placeholder="Mô tả ngắn (tuỳ chọn)" style="margin-top:6px"><div class="row"><button class="btn ok pb">📤 Đăng lên thư viện</button></div><div class="pvm hint"></div></div>
        <div><h3>Khoá của bạn trên máy này</h3><div class="loc"></div></div></div></div>
      <div class="card2"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Đang có trong thư viện</h3><button class="pbtn sm rf">🔄</button></div><div class="ll tw">Đang tải…</div></div>`;
    $('.tp', c).onclick = () => L.download('mau-khoa-hoc.csv', L.TEMPLATE, 'text/csv;charset=utf-8');
    $('.fi', c).onchange = async e => { const f = e.target.files[0]; if (!f) return; $('.ta', c).value = await L.readFile(f); if (!$('.nm', c).value) $('.nm', c).value = f.name.replace(/\.[^.]+$/, ''); };
    $('.loc', c).innerHTML = L.courses.custom().map(x => `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:3px 0"><span>${L.LANGS[x.lang].flag} ${esc(x.name)} <span class="hint">${L.flat(x).length} từ</span></span><button class="pbtn sm" data-u="${x.id}">📤 Đăng</button></div>`).join('') || '<span class="hint">Chưa có (tạo ở công cụ "Tạo khoá học").</span>';
    const pub = async course => { try { await L.library.publish(course, $('.ds', c).value.trim()); T(`Đã đăng "${course.name}" lên thư viện 🎉`, { type: 'success' }); drawList(); } catch (e) { T(e.message || GV.fbInfo().explain(e), { type: 'error' }); } };
    $('.loc', c).onclick = e => { const b = e.target.closest('[data-u]'); if (b) pub(L.courses.find(b.dataset.u)); };
    $('.pb', c).onclick = () => {
      const r = L.parseImport($('.ta', c).value); if (r.err) return T(r.err, { type: 'error' });
      const course = L.buildCourse(r.rows, $('.nm', c).value.trim() || r.name || 'Khoá học mới', $('.lg', c).value); $('.pvm', c).textContent = `Đọc được ${L.flat(course).length} từ / ${course.units.length} bài.`; pub(course);
    };
    async function drawList() {
      const list = await L.library.list(); badge('library', 0);
      $('.ll', c).innerHTML = list.length ? `<table><tr><th>Khoá</th><th>Ngôn ngữ</th><th>Số từ</th><th>Người đăng</th><th>Ngày</th><th></th></tr>${list.map(m => `<tr><td><b>${esc(m.name)}</b><br><span class="hint">${esc(m.desc || '')}</span></td><td>${L.LANGS[m.lang] ? L.LANGS[m.lang].flag : m.lang}</td><td>${m.n || '?'}</td><td>${esc(m.byName || '')}</td><td class="hint">${fdate(m.at)}</td><td>${canMod || m.by === A.user.uid ? `<button class="btn bad sm" data-x="${m.id}">Xoá</button>` : ''}</td></tr>`).join('')}</table>` : '<div class="msg">Thư viện đang trống – hãy đăng khoá đầu tiên!</div>';
    }
    $('.ll', c).onclick = async e => { const b = e.target.closest('[data-x]'); if (!b || !confirm('Xoá khoá học này khỏi thư viện?')) return; try { await L.library.remove(b.dataset.x); T('Đã xoá.', { type: 'success' }); drawList(); } catch (x) { T(GV.fbInfo().explain(x), { type: 'error' }); } };
    $('.rf', c).onclick = drawList; drawList();
  }

  /* =============== LỚP & BÀI GIAO (giáo viên) =============== */
  async function classTab(c) {
    const me = A.user.uid;
    c.innerHTML = `<div class="card2"><h2>🎓 Học sinh của tôi</h2><div class="row"><input class="em" type="email" placeholder="Email học sinh (đã đăng ký tài khoản)" style="flex:1;min-width:220px"><button class="btn add">➕ Thêm học sinh</button></div><div class="sl tw" style="margin-top:8px">Đang tải…</div></div>
      <div class="card2"><h3>📌 Giao bài</h3><div class="row"><select class="st"></select><select class="co"></select><button class="btn ok as">Giao bài</button></div><div class="hint">Học sinh thấy bài trong "Học ngoại ngữ → Thư viện" và trong tab "Bài của tôi".</div></div>
      <div class="card2"><h3>📊 Kết quả học</h3><div class="rs tw hint">Chọn một học sinh ở bảng trên để xem kết quả.</div></div>`;
    let S = {}; const load = async () => { S = (await db().ref('teacherStudents/' + me).once('value')).val() || {}; draw(); };
    const lib = await L.library.list(); $('.co', c).innerHTML = lib.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('') || '<option value="">(thư viện trống)</option>';
    const draw = async () => {
      const ids = Object.keys(S); $('.st', c).innerHTML = ids.map(id => `<option value="${id}">${esc(S[id].name || S[id].email)}</option>`).join('') || '<option value="">(chưa có học sinh)</option>';
      const asg = await Promise.all(ids.map(async id => [id, (await db().ref('assign/' + id).once('value')).val() || {}]));
      $('.sl', c).innerHTML = ids.length ? `<table><tr><th>Học sinh</th><th>Bài đã giao</th><th></th></tr>${asg.map(([id, a]) => `<tr><td><b>${esc(S[id].name || '')}</b><br><span class="hint">${esc(S[id].email)}</span></td><td>${Object.entries(a).filter(([, v]) => v.by === me || A.isAdmin).map(([cid, v]) => `<span class="tag">${esc(v.name || cid)} <a href="#" data-ua="${id}|${cid}" style="color:var(--bad)">✕</a></span>`).join(' ') || '—'}</td><td><button class="pbtn sm" data-r="${id}">Kết quả</button> <button class="pbtn sm" data-rm="${id}">Bỏ</button></td></tr>`).join('')}</table>` : '<div class="hint">Chưa có học sinh nào.</div>';
    };
    $('.add', c).onclick = async () => {
      const em = $('.em', c).value.trim().toLowerCase(); if (!em) return; const uid = (await db().ref('userIndex/' + A.emailKey(em)).once('value')).val();
      if (!uid) return T('Không tìm thấy tài khoản với email này – học sinh cần đăng ký trước.', { type: 'warn' });
      const nm = (await db().ref('users/' + uid + '/name').once('value')).val() || em; await db().ref('teacherStudents/' + me + '/' + uid).set({ email: em, name: nm }); $('.em', c).value = ''; T(`Đã thêm ${nm}.`, { type: 'success' }); load();
    };
    $('.as', c).onclick = async () => { const sid = $('.st', c).value, cid = $('.co', c).value; if (!sid || !cid) return; const m = lib.find(x => x.id === cid); await db().ref('assign/' + sid + '/' + cid).set({ name: m.name, by: me, byName: (A.profile && A.profile.name) || A.user.email, at: A.TS }); T(`Đã giao "${m.name}" cho ${S[sid].name}.`, { type: 'success' }); draw(); };
    c.onclick = async e => {
      const r = e.target.closest('[data-r]'), rm = e.target.closest('[data-rm]'), ua = e.target.closest('[data-ua]');
      if (ua) { e.preventDefault(); const [sid, cid] = ua.dataset.ua.split('|'); await db().ref('assign/' + sid + '/' + cid).remove(); T('Đã thu hồi bài.', { type: 'info' }); draw(); }
      if (rm && confirm('Bỏ học sinh này khỏi danh sách?')) { await db().ref('teacherStudents/' + me + '/' + rm.dataset.rm).remove(); load(); }
      if (r) { const s = await db().ref('results/' + r.dataset.r).limitToLast(30).once('value'), list = Object.values(s.val() || {}).sort((a, b) => b.at - a.at); $('.rs', c).innerHTML = list.length ? `<b>${esc(S[r.dataset.r].name)}</b><table><tr><th>Khoá</th><th>Điểm</th><th>Lúc</th></tr>${list.map(x => `<tr><td>${esc(x.c)}</td><td><b>${x.ok}/${x.n}</b> (${Math.round(x.ok / x.n * 100)}%)</td><td class="hint">${fdate(x.at)}</td></tr>`).join('')}</table>` : 'Học sinh này chưa có kết quả.'; }
    };
    load();
  }

  /* =============== BÀI CỦA TÔI =============== */
  async function mywork(c) {
    c.innerHTML = '<div class="card2"><h2>📌 Bài được giao</h2><div class="as">Đang tải…</div></div><div class="card2"><h2>📊 Kết quả của tôi</h2><div class="rs">Đang tải…</div></div>';
    const asg = await L.library.assigned(), rs = Object.values((await db().ref('results/' + A.user.uid).limitToLast(40).once('value')).val() || {}).sort((a, b) => b.at - a.at);
    $('.as', c).innerHTML = asg.length ? asg.map(a => `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 0"><span><b>${esc(a.name)}</b> <span class="hint">· GV ${esc(a.byName || '')} · ${fdate(a.at)}</span></span><button class="btn sm" data-g="${a.cid}">Nhận & học ▶</button></div>`).join('') : '<div class="hint">Chưa có bài nào được giao.</div>';
    $('.rs', c).innerHTML = rs.length ? `<table><tr><th>Khoá</th><th>Điểm</th><th>Lúc</th></tr>${rs.map(x => `<tr><td>${esc(x.c)}</td><td><b>${x.ok}/${x.n}</b> (${Math.round(x.ok / x.n * 100)}%)</td><td class="hint">${fdate(x.at)}</td></tr>`).join('')}</table>` : '<div class="hint">Chưa có kết quả – làm bài kiểm tra trong "Học ngoại ngữ" khi đã đăng nhập.</div>';
    c.onclick = async e => { const b = e.target.closest('[data-g]'); if (!b) return; b.disabled = true; try { await L.library.importToLocal(b.dataset.g); T('Đã nhận bài! Mở "Học ngoại ngữ" để học.', { type: 'success', action: { label: 'Mở ngay', fn: () => { location.href = './#/tool/lang'; } } }); } catch (x) { T(x.message, { type: 'error' }); b.disabled = false; } };
  }

  // kiểm tra lại vai trò (khi admin vừa duyệt) – tự chạy khi quay lại tab
  async function recheck(manual) {
    if (!A.user) return; const old = A.role; A._p = null; await A.init();
    if (A.role !== old) { T(`Quyền của bạn đã đổi: ${A.ROLES[old]} → ${A.ROLES[A.role]} 🎉`, { type: 'success' }); panelView(); }
    else if (manual) T('Quyền hiện tại: ' + A.ROLES[A.role], { type: 'info' });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recheck(false).catch(() => {}); });

  /* =============== KHỞI ĐỘNG =============== */
  document.getElementById('theme').onclick = () => { const d = document.documentElement, dark = d.dataset.theme ? d.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; d.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('gv_theme', d.dataset.theme); } catch (e) {} };
  (async () => {
    if (!GV.fbInfo().cfg()) { root.innerHTML = '<div class="cx"><div class="card2"><b>Chưa cấu hình Firebase</b> – xem FIREBASE.md.</div></div>'; return; }
    await A.init();
    if (A.user) panelView(); else authView();
  })();
})();
