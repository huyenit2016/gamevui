(() => {
  const L = []; let seq = 0, uidP = null;
  const snapOf = (v, key) => ({ val: () => v === undefined ? null : JSON.parse(JSON.stringify(v)), exists: () => v != null, key });
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  window.__fire = async () => {
    for (const l of L.slice()) {
      const v = await window.__hub('get', l.p);
      if (l.type === 'value') { if (!l.init || !eq(l.last, v)) { l.init = true; l.last = v; l.cb(snapOf(v)); } }
      else if (l.type === 'child_added') { for (const k of Object.keys(v || {})) if (!l.seen.has(k)) { l.seen.add(k); l.cb(snapOf(v[k], k)); } }
    }
  };
  const ref = (p = '') => {
    const R = {
      key: p.split('/').pop(), child: c => ref(p + '/' + c),
      set: async v => { await window.__hub('set', p, v); }, update: async o => { await window.__hub('update', p, o); }, remove: async () => { await window.__hub('set', p, null); },
      push: v => { const k = 'k' + Date.now().toString(36) + (seq++).toString(36).padStart(4, '0'); const r = ref(p + '/' + k); r.set(v); return r; },
      once: async () => snapOf(await window.__hub('get', p)),
      transaction: async fn => { for (let i = 0; i < 8; i++) { const cur = await window.__hub('get', p); const nv = fn(cur === undefined ? null : cur); if (nv === undefined) return { committed: false }; const r = await window.__hub('cas', p, cur, nv); if (r.ok) return { committed: true }; } return { committed: false }; },
      on: (type, cb) => { const l = { p, type, cb, seen: new Set(), last: undefined, init: false }; L.push(l); (async () => { const v = await window.__hub('get', p); if (type === 'value') { l.init = true; l.last = v; cb(snapOf(v)); } else { for (const k of Object.keys(v || {})) { l.seen.add(k); cb(snapOf(v[k], k)); } } })(); },
      off: (type, cb) => { const i = L.findIndex(l => l.cb === cb || l.w === cb); if (i >= 0) L.splice(i, 1); },
      onDisconnect: () => ({ set: v => window.__hub('ondisc', p, v === null ? '__remove__' : v), remove: () => window.__hub('ondisc', p, '__remove__') }),
      limitToLast: n => ({ once: async () => { const all = (await window.__hub('get', p)) || {}, o = {}; Object.keys(all).sort().slice(-n).forEach(c => o[c] = all[c]); return snapOf(Object.keys(o).length ? o : null); } }),
      orderByChild: k => ({
        startAt: v => ({ on: (t, cb) => { const w = snap => { const all = snap.val() || {}, o = {}; for (const c in all) if ((all[c] || {})[k] >= v) o[c] = all[c]; cb(snapOf(Object.keys(o).length ? o : null)); }; cb.__w = w; R.on('value', w); }, off: (t, cb) => R.off('value', cb.__w) }),
        endAt: v => ({ limitToFirst: n => ({ once: async () => { const all = (await window.__hub('get', p)) || {}, o = {}; Object.keys(all).filter(c => (all[c] || {})[k] <= v).slice(0, n).forEach(c => o[c] = all[c]); return snapOf(Object.keys(o).length ? o : null); } }) })
      })
    };
    return R;
  };
  const db = () => ({ ref }); db.ServerValue = { TIMESTAMP: Date.now() };
  let cur = null; const authObj = {
    get currentUser() { return cur; },
    onAuthStateChanged(cb) { (async () => { const s = await window.__hub('auth', 'session'); if (s) cur = { uid: s.uid, email: s.email, isAnonymous: false }; cb(cur); })(); return () => {}; },
    signInAnonymously: async () => { cur = { uid: await window.__hub('uid'), isAnonymous: true }; return { user: cur }; },
    createUserWithEmailAndPassword: async (e, p) => { const r = await window.__hub('auth', 'create', e, p); if (r.err) throw { code: r.err }; cur = { uid: r.uid, email: e, isAnonymous: false }; return { user: cur }; },
    signInWithEmailAndPassword: async (e, p) => { const r = await window.__hub('auth', 'login', e, p); if (r.err) throw { code: r.err }; cur = { uid: r.uid, email: e, isAnonymous: false }; return { user: cur }; },
    signOut: async () => { await window.__hub('auth', 'logout'); cur = null; }, sendPasswordResetEmail: async () => {}
  };
  window.firebase = { apps: [], initializeApp() { this.apps.push(1); }, auth: () => authObj, database: db };
})();
