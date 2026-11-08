// Mạng online (Firebase Realtime Database qua js/fb.js của OmniHub): hiện diện người chơi, chat, xếp hạng vui.
// Nếu không kết nối được (chưa cấu hình, mạng chặn…) game vẫn chơi bình thường một mình.
const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Không tải được ' + src)); document.head.appendChild(s); });
const ts = () => window.firebase.database.ServerValue.TIMESTAMP;
export const Net = { on: false, uid: null, off: 0, handlers: {}, err: '' };
// Máy chủ từ chối (Rules chưa cập nhật…) → quay về chơi một mình, không giả vờ đang online
Net.fail = e => { if (!Net.on) return; Net.on = false; Net.err = (e && e.message) || 'Máy chủ từ chối quyền truy cập'; clearInterval(Net.timer); Net.handlers.fail && Net.handlers.fail(); };

Net.init = async function () {
  try {
    if (!window.GV) window.GV = { store: { get(k, d) { try { const v = localStorage.getItem('gv_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set() {} } };
    if (!window.GV.fbInfo) { await load('../../js/firebase-config.js'); await load('../../js/fb.js'); }
    const f = await Promise.race([GV.fbInfo().fb(), new Promise((_, no) => setTimeout(() => no(new Error('Quá thời gian kết nối')), 10000))]);
    Net.db = f.db; Net.uid = f.uid; Net.on = true;
    try { const o = (await f.db.ref('.info/serverTimeOffset').once('value')).val(); Net.off = +o || 0; } catch (e) {}
    return true;
  } catch (e) { Net.on = false; Net.err = (e && e.message) || String(e); return false; }
};
Net.now = () => Date.now() + Net.off;

// Ghi vị trí của mình (chỉ khi đi/đổi cử chỉ, hoặc nhịp tim 8 giây) và nghe người khác.
Net.join = function (get) {
  if (!Net.on || Net.joined) return; Net.joined = true;
  const me = Net.db.ref('saigon/players/' + Net.uid); try { me.onDisconnect().remove(); } catch (e) {}
  let last = { x: 1e9, z: 1e9, e: '', a: 0, t: 0 };
  Net.timer = setInterval(() => {
    const s = get(); if (!s) return; const now = Date.now();
    const moved = Math.hypot(s.x - last.x, s.z - last.z) > .4 || s.e !== last.e || Math.abs(s.a - last.a) > .2;
    if (moved ? now - last.t > 450 : now - last.t > 8000) { last = { x: s.x, z: s.z, e: s.e, a: s.a, t: now }; me.set({ n: s.n, x: +s.x.toFixed(1), z: +s.z.toFixed(1), a: +s.a.toFixed(2), e: s.e || '', av: s.av, at: ts() }).catch(Net.fail); }
  }, 250);
  const pl = Net.db.ref('saigon/players');
  const put = snap => { if (snap.key === Net.uid) return; const v = snap.val(); if (!v || typeof v !== 'object') return; Net.handlers.player && Net.handlers.player(snap.key, v, Net.now() - (v.at || 0)); };
  pl.on('child_added', put, Net.fail); pl.on('child_changed', put, Net.fail); pl.on('child_removed', snap => Net.handlers.leave && Net.handlers.leave(snap.key), Net.fail);
};
Net.prune = id => { if (Net.on) Net.db.ref('saigon/players/' + id).remove().catch(() => {}); };   // Rules chỉ cho xoá mục đã quá 90 giây
Net.leave = () => { try { clearInterval(Net.timer); if (Net.on) Net.db.ref('saigon/players/' + Net.uid).remove(); } catch (e) {} };

// Chat: nghe 30 tin cuối; dọn tin cũ hơn 1 giờ (Rules cho phép)
Net.chatStart = function (cb) {
  if (!Net.on || Net.chatOn) return; Net.chatOn = true;
  Net.db.ref('saigon/chat').limitToLast(30).on('child_added', s => { const v = s.val(); if (v && typeof v.t === 'string') cb(s.key, v); }, Net.fail);
  (async () => { try { const sn = await Net.db.ref('saigon/chat').limitToFirst(20).once('value'), v = sn.val() || {}; for (const k in v) if (v[k] && v[k].at < Net.now() - 3600000) Net.db.ref('saigon/chat/' + k).remove().catch(() => {}); } catch (e) {} })();
};
Net.chatSend = function (name, text) { if (!Net.on) return false; Net.db.ref('saigon/chat').push({ n: name, t: text, at: ts() }).catch(() => {}); return true; };

// Xếp hạng vui (điểm tự báo, không có ý nghĩa thi đua nghiêm túc)
Net.rankSave = function (name, s, k) { if (!Net.on) return; clearTimeout(Net._rt); Net._rt = setTimeout(() => Net.db.ref('saigon/rank/' + Net.uid).set({ n: name, s, k }).catch(() => {}), 2500); };
Net.rankTop = async function () { const sn = await Net.db.ref('saigon/rank').orderByChild('s').limitToLast(20).once('value'), v = sn.val() || {}; return Object.entries(v).map(([id, x]) => Object.assign({ id }, x)).sort((a, b) => b.s - a.s); };
