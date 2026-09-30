// Đếm lượt truy cập: mỗi phiên +1 tổng lượt; mỗi IP mới +1 "người dùng duy nhất". IP được băm SHA-256, không lưu IP gốc.
(function () {
  const el = document.getElementById('visits');
  if (!el) return;
  const show = (t, u) => { el.textContent = `👁 ${t.toLocaleString('vi-VN')} lượt truy cập · ${u.toLocaleString('vi-VN')} người dùng (theo IP)`; };
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  async function ipKey(uid) {
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch('https://api.ipify.org?format=json', { signal: ctl.signal }); clearTimeout(tm);
      const ip = (await r.json()).ip;
      const h = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gamevui|' + ip)));
      return h.slice(0, 16);
    } catch (e) { // không lấy được IP: dùng mã thiết bị ẩn danh
      const h = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gamevui-dev|' + uid)));
      return h.slice(0, 16);
    }
  }
  async function run() {
    const F = GV.fbInfo && GV.fbInfo(); if (!F || !F.cfg()) return;
    const { db, uid, TS } = await F.fb();
    const inc = c => c === null || c === undefined ? 1 : c + 1;
    let counted = false; try { counted = sessionStorage.getItem('gv_counted') === '1'; } catch (e) {}
    if (!counted) {
      const key = await ipKey(uid), ipRef = db.ref('stats/ips/' + key);
      const snap = await ipRef.once('value'), isNew = !snap.exists();
      const now = Date.now(), cur = snap.val() || {};
      await ipRef.set(isNew ? { first: now, last: now, n: 1 } : { first: cur.first || now, last: now, n: (cur.n || 0) + 1 });
      await db.ref('stats/total').transaction(inc);
      if (isNew) await db.ref('stats/unique').transaction(inc);
      try { sessionStorage.setItem('gv_counted', '1'); } catch (e) {}
    }
    const [t, u] = await Promise.all([db.ref('stats/total').once('value'), db.ref('stats/unique').once('value')]);
    show(t.val() || 0, u.val() || 0);
  }
  // chạy sau khi trang đã hiển thị xong để không làm chậm lần tải đầu
  const go = () => run().catch(() => { el.textContent = ''; });
  if (document.readyState === 'complete') setTimeout(go, 1200); else window.addEventListener('load', () => setTimeout(go, 1200));
})();
