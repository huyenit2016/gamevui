// Tài khoản & phân quyền (Firebase Auth email/mật khẩu) + cấu hình web tự động từ CMS.
// Khách không cần đăng nhập. Vai trò: admin (quản trị) · collab (cộng tác viên) · teacher (giáo viên) · student (học sinh).
(function () {
  const ROLES = { admin: 'Quản trị viên', collab: 'Cộng tác viên', teacher: 'Giáo viên', student: 'Học sinh' };
  const ICON = { admin: '🛡️', collab: '✍️', teacher: '👩‍🏫', student: '🧑‍🎓' };
  // Ma trận quyền (hiển thị trong CMS; quyền thật được Firebase Rules cưỡng chế)
  const PERMS = [
    ['Chơi game, dùng tiện ích, học ngoại ngữ', 1, 1, 1, 1, 1],
    ['Xem & nhập khoá học từ thư viện cộng đồng', 1, 1, 1, 1, 1],
    ['Nhận bài giao, lưu kết quả học', 0, 1, 1, 1, 1],
    ['Đăng khoá học lên thư viện', 0, 0, 1, 1, 1],
    ['Kiểm duyệt / xoá khoá học của người khác', 0, 0, 0, 1, 1],
    ['Giao bài & xem kết quả học sinh', 0, 0, 1, 0, 1],
    ['Đăng thông báo cho toàn web', 0, 0, 0, 1, 1],
    ['Cấu hình giao diện, quảng cáo, bật/tắt chức năng', 0, 0, 0, 0, 1],
    ['Xem tất cả phòng, dọn phòng rác', 0, 0, 0, 0, 1],
    ['Quản lý người dùng & phân quyền', 0, 0, 0, 0, 1]
  ];
  const A = GV.account = { ROLES, ICON, PERMS, user: null, profile: null, role: 'guest', isAdmin: false, ready: false, _cbs: [] };
  const esc = GV.esc;
  A.onChange = cb => { A._cbs.push(cb); if (A.ready) cb(A); };
  const emailKey = e => String(e || '').trim().toLowerCase().replace(/\./g, ',');
  A.emailKey = emailKey;
  A.has = (...roles) => roles.includes(A.role);

  async function refresh() {
    const F = GV.fbInfo(); if (!F.cfg()) { A.ready = true; return; }
    const { db, auth, TS } = await F.fb(); A.db = db; A.auth = auth; A.TS = TS;
    const user = auth.currentUser; // luôn lấy người dùng hiện tại (fb() chỉ nhớ người dùng lúc khởi tạo)
    A.user = user && !user.isAnonymous ? user : null; A.profile = null; A.isAdmin = false; A.role = 'guest';
    if (A.user) {
      const [p, a] = await Promise.all([db.ref('users/' + A.user.uid).once('value'), db.ref('admins/' + A.user.uid).once('value')]);
      A.profile = p.val(); A.isAdmin = a.exists();
      A.role = A.isAdmin ? 'admin' : (A.profile && A.profile.role) || 'student';
    }
    A.ready = true;
  }
  A.init = () => { if (A._p) return A._p; A._p = refresh().catch(e => { console.warn('account', e); A.ready = true; }).then(() => { A._cbs.forEach(cb => { try { cb(A); } catch (e) { console.error(e); } }); }); return A._p; };

  A.signIn = async (email, pw) => { const F = GV.fbInfo(); const { auth } = await F.fb(); await auth.signInWithEmailAndPassword(email.trim(), pw); A._p = null; await A.init(); return A; };
  A.signUp = async (email, pw, name, requested) => {
    const F = GV.fbInfo(); const { auth, db, TS } = await F.fb();
    const c = await auth.createUserWithEmailAndPassword(email.trim(), pw); const u = c.user;
    await db.ref('users/' + u.uid).set({ email: email.trim().toLowerCase(), name: name.trim() || email.split('@')[0], role: 'student', requested: requested && requested !== 'student' ? requested : null, createdAt: TS });
    try { await db.ref('userIndex/' + emailKey(email)).set(u.uid); } catch (e) { console.warn('userIndex', e); }
    A._p = null; await A.init(); return A;
  };
  A.signOut = async () => { const F = GV.fbInfo(); const { auth } = await F.fb(); await auth.signOut(); A._p = null; location.reload(); };
  A.resetPassword = async email => { const F = GV.fbInfo(); const { auth } = await F.fb(); await auth.sendPasswordResetEmail(email.trim()); };
  A.claimAdmin = async secret => { const { db, auth } = await GV.fbInfo().fb(); await db.ref('admins/' + auth.currentUser.uid).set({ k: secret }); A._p = null; await A.init(); return A.isAdmin; };
  A.authMsg = e => {
    const c = (e && e.code) || '';
    return ({ 'auth/invalid-email': 'Email không hợp lệ.', 'auth/user-not-found': 'Không tìm thấy tài khoản.', 'auth/wrong-password': 'Sai mật khẩu.', 'auth/invalid-credential': 'Sai email hoặc mật khẩu.', 'auth/email-already-in-use': 'Email này đã được đăng ký.', 'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).', 'auth/operation-not-allowed': 'Chưa bật đăng nhập Email/Mật khẩu trong Firebase (Authentication → Sign-in method → Email/Password).', 'auth/too-many-requests': 'Thử quá nhiều lần, vui lòng đợi một lúc.', 'auth/network-request-failed': 'Lỗi mạng.' })[c] || GV.fbInfo().explain(e);
  };

  /* ---------- Cấu hình web do CMS quản lý (áp dụng tự động) ---------- */
  GV.cfg = GV.cfg || { hot: null, nw: null, off: [] };
  const $ = s => document.querySelector(s);
  function applySite(c) {
    if (!c) return;
    if (c.pill != null && $('#pill')) $('#pill').textContent = c.pill;
    if ($('#htitle') && (c.heroLead != null || c.heroGrad != null)) $('#htitle').innerHTML = `${esc(c.heroLead != null ? c.heroLead : 'Chơi vui mỗi ngày.')} <span class="grad">${esc(c.heroGrad != null ? c.heroGrad : 'Không cần cài đặt.')}</span> ${esc(c.heroEmoji != null ? c.heroEmoji : '')}`;
    if (c.footer != null && $('#foot')) $('#foot').textContent = c.footer;
    if (Array.isArray(c.hot)) GV.cfg.hot = c.hot.filter(Boolean);
    if (Array.isArray(c.nw)) GV.cfg.nw = c.nw.filter(Boolean);
    GV.cfg.off = Array.isArray(c.off) ? c.off.filter(Boolean) : [];
    if (c.ads) { window.GV_ADS = Object.assign(window.GV_ADS || {}, c.ads, { adsense: Object.assign({}, (window.GV_ADS || {}).adsense, c.ads.adsense || {}) }); document.querySelectorAll('.ad').forEach(a => { a.removeAttribute('data-done'); a.innerHTML = ''; }); if (GV.ads) GV.ads.hydrate(); }
    if (GV.rerender) GV.rerender();
  }
  function showAnnounce(a) {
    const box = $('#announce'); if (!box) return;
    let dis = null; try { dis = localStorage.getItem('gv_ann_dis'); } catch (e) {}
    if (!a || !a.active || !a.text || String(a.id) === dis) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="annc ${esc(a.type || 'info')}"><span>${{ info: '📢', warn: '⚠️', success: '🎉' }[a.type] || '📢'} ${esc(a.text)}${a.link ? ` <a href="${esc(GV.safeUrl(a.link))}" target="_blank" rel="noopener">Xem thêm ›</a>` : ''}</span><button aria-label="Đóng">✕</button></div>`;
    box.querySelector('button').onclick = () => { try { localStorage.setItem('gv_ann_dis', String(a.id)); } catch (e) {} box.innerHTML = ''; };
    let seen = null; try { seen = localStorage.getItem('gv_ann_seen'); } catch (e) {}
    if (String(a.id) !== seen && GV.toast) { try { localStorage.setItem('gv_ann_seen', String(a.id)); } catch (e) {} GV.toast(a.text, { type: a.type === 'warn' ? 'warn' : a.type === 'success' ? 'success' : 'info', ttl: 7000 }); }
  }
  A.applySite = applySite; A.showAnnounce = showAnnounce;
  A.loadConfig = async () => {
    const cached = GV.store.get('siteconf', null); if (cached) applySite(cached);
    if (!A.db) return;
    const [s, a] = await Promise.all([A.db.ref('config/site').once('value'), A.db.ref('config/announce').once('value')]);
    const c = s.val(); GV.store.set('siteconf', c || null); applySite(c || {}); showAnnounce(a.val());
  };

  /* ---------- Nút tài khoản trên thanh đầu trang ---------- */
  function paintHeader() {
    const a = $('#acct'); if (!a) return;
    const ico = GV.ic ? GV.ic('user', 16) : '';
    if (A.user) {
      const nm = (A.profile && A.profile.name) || A.user.email, ini = esc(String(nm).trim().charAt(0).toUpperCase());
      a.innerHTML = `<span class="av on">${ini}</span><span class="an">${esc(String(nm).split(' ').pop())}</span>`; a.title = ROLES[A.role] + ' – ' + A.user.email; a.setAttribute('aria-label', 'Tài khoản: ' + nm);
    } else { a.innerHTML = `<span class="av">${ico}</span><span class="an">Đăng nhập</span>`; a.title = 'Đăng nhập để giao bài, nhận bài, quản trị…'; a.setAttribute('aria-label', 'Đăng nhập'); }
    const b = $('#acct2'); if (b) { b.querySelector('span').textContent = A.user ? 'Tài khoản' : 'Đăng nhập'; b.classList.toggle('authed', !!A.user); }
  }
  A.onChange(paintHeader);
  // Quản trị viên: nhắc phòng rác ngay khi vào web
  A.onChange(async () => {
    if (!A.isAdmin || !$('#acct') || !GV.toast) return;
    try {
      const snap = await A.db.ref('mplobby').orderByChild('at').endAt(Date.now() - 2 * 3600e3).limitToFirst(20).once('value'); const n = Object.keys(snap.val() || {}).length;
      if (n) GV.toast(`Có ${n} phòng bỏ hoang cần dọn.`, { type: 'warn', action: { label: 'Mở CMS để dọn', fn: () => { location.href = 'cms.html#rooms'; } } });
    } catch (e) {}
  });
  document.addEventListener('DOMContentLoaded', () => { paintHeader(); });
  const boot = () => setTimeout(() => A.init().then(() => A.loadConfig().catch(() => {})), 500);
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
  // áp dụng cấu hình đã lưu ngay khi tải (chưa cần chờ Firebase)
  document.addEventListener('DOMContentLoaded', () => { const c = GV.store.get('siteconf', null); if (c) applySite(c); });
})();
