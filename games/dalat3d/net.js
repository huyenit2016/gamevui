// Mạng online cho Đà Lạt Phố Hội 3D (Firebase qua js/fb.js): hiện diện người chơi + quầy của họ, chat, xếp hạng doanh thu.
const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Không tải được ' + src)); document.head.appendChild(s); });
const ts = () => window.firebase.database.ServerValue.TIMESTAMP;
export const Net = { on: false, uid: null, off: 0, handlers: {}, err: '' };
Net.fail = e => { if (!Net.on) return; Net.on = false; Net.err = (e && e.message) || 'Máy chủ từ chối quyền truy cập'; clearInterval(Net.timer); Net.handlers.fail && Net.handlers.fail(); };
Net.init = async function () {
  try {
    if (!window.GV) window.GV = { store: { get(k, d) { try { const v = localStorage.getItem('gv_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set() {} } };
    if (!window.GV.fbInfo) { await load('../../js/firebase-config.js'); await load('../../js/fb.js'); }
    const f = await Promise.race([GV.fbInfo().fb(), new Promise((_, no) => setTimeout(() => no(new Error('Quá thời gian kết nối')), 10000))]);
    Net.db = f.db; Net.uid = f.uid; Net.on = true;
    try { Net.off = +(await f.db.ref('.info/serverTimeOffset').once('value')).val() || 0; } catch (e) {}
    return true;
  } catch (e) { Net.on = false; Net.err = (e && e.message) || String(e); return false; }
};
Net.now = () => Date.now() + Net.off;
// get() trả {n,x,z,a,e,av,s,t,p,o} hoặc null. Ghi khi đi/đổi trạng thái, nhịp tim 8 giây.
Net.join = function (get) {
  if (!Net.on || Net.joined) return; Net.joined = true;
  const me = Net.db.ref('dalat/players/' + Net.uid); try { me.onDisconnect().remove(); } catch (e) {}
  let last = { x: 1e9, z: 1e9, k: '', a: 0, t: 0 };
  Net.timer = setInterval(() => {
    const s = get(); if (!s) return; const now = Date.now(), k = [s.e, s.s, s.t, s.p, s.o, s.n].join('|');
    const moved = Math.hypot(s.x - last.x, s.z - last.z) > .4 || k !== last.k || Math.abs(s.a - last.a) > .2;
    if (moved ? now - last.t > 450 : now - last.t > 8000) { last = { x: s.x, z: s.z, k, a: s.a, t: now }; me.set({ n: s.n, x: +s.x.toFixed(1), z: +s.z.toFixed(1), a: +s.a.toFixed(2), e: s.e || '', av: s.av, s: s.s | 0, t: s.t | 0, p: s.p | 0, o: s.o ? 1 : 0, at: ts() }).catch(Net.fail); }
  }, 250);
  const pl = Net.db.ref('dalat/players');
  const put = snap => { if (snap.key === Net.uid) return; const v = snap.val(); if (!v || typeof v !== 'object') return; Net.handlers.player && Net.handlers.player(snap.key, v, Net.now() - (v.at || 0)); };
  pl.on('child_added', put, Net.fail); pl.on('child_changed', put, Net.fail); pl.on('child_removed', snap => Net.handlers.leave && Net.handlers.leave(snap.key), Net.fail);
};
Net.prune = id => { if (Net.on) Net.db.ref('dalat/players/' + id).remove().catch(() => {}); };
Net.leave = () => { try { clearInterval(Net.timer); if (Net.on) Net.db.ref('dalat/players/' + Net.uid).remove(); } catch (e) {} };
Net.chatStart = function (cb) {
  if (!Net.on || Net.chatOn) return; Net.chatOn = true;
  Net.db.ref('dalat/chat').limitToLast(30).on('child_added', s => { const v = s.val(); if (v && typeof v.t === 'string') cb(s.key, v); }, Net.fail);
  (async () => { try { const sn = await Net.db.ref('dalat/chat').limitToFirst(20).once('value'), v = sn.val() || {}; for (const k in v) if (v[k] && v[k].at < Net.now() - 3600000) Net.db.ref('dalat/chat/' + k).remove().catch(() => {}); } catch (e) {} })();
};
Net.chatSend = function (name, text) { if (!Net.on) return false; Net.db.ref('dalat/chat').push({ n: name, t: text, at: ts() }).catch(() => {}); return true; };
Net.rankSave = function (name, s, k) { if (!Net.on) return; clearTimeout(Net._rt); Net._rt = setTimeout(() => Net.db.ref('dalat/rank/' + Net.uid).set({ n: name, s: Math.min(5e6, Math.round(s)), k }).catch(() => {}), 2500); };
Net.rankTop = async function () { const sn = await Net.db.ref('dalat/rank').orderByChild('s').limitToLast(20).once('value'), v = sn.val() || {}; return Object.entries(v).map(([id, x]) => Object.assign({ id }, x)).sort((a, b) => b.s - a.s); };
