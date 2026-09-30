// Tiện ích Firebase dùng chung (nạp SDK, đăng nhập ẩn danh, giải thích lỗi). Xem FIREBASE.md.
(function () {
  const V = '10.12.2';
  const SRC = ['app', 'auth', 'database'].map(m => `https://www.gstatic.com/firebasejs/${V}/firebase-${m}-compat.js`);
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Không tải được thư viện Firebase (kiểm tra mạng)')); document.head.appendChild(s); });
  const getCfg = () => window.GV_FIREBASE || GV.store.get('fbcfg', null);

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

})();
