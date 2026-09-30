(() => {
  const tree = {}; const ls = [];
  const get = (p) => p.split('/').filter(Boolean).reduce((o, k) => o == null ? undefined : o[k], tree);
  const prune = v => { if (v === null || v === undefined) return undefined; if (Array.isArray(v)) { const a = v.map(prune); return a.every(x => x === undefined) ? undefined : a.map(x => x === undefined ? null : x); } if (typeof v === 'object') { const o = {}; for (const k in v) { const x = prune(v[k]); if (x !== undefined) o[k] = x; } return Object.keys(o).length ? o : undefined; } return v; };
  const clone = v => v === undefined ? null : JSON.parse(JSON.stringify(v));
  const setAt = (p, v) => {
    const ks = p.split('/').filter(Boolean); let o = tree;
    for (let i = 0; i < ks.length - 1; i++) { if (typeof o[ks[i]] !== 'object' || o[ks[i]] === null) o[ks[i]] = {}; o = o[ks[i]]; }
    const last = ks[ks.length - 1];
    if (v === null || v === undefined) delete o[last]; else { const pv = prune(clone(v)); if (pv === undefined) delete o[last]; else o[last] = pv; }
  };
  const fire = () => Promise.resolve().then(() => ls.forEach(l => l.cb({ val: () => clone(get(l.p)), exists: () => get(l.p) != null })));
  const ref = (p = '') => ({
    child: c => ref(p + '/' + c),
    set: async v => { setAt(p, v); fire(); },
    update: async o => { for (const k in o) setAt(p + '/' + k, o[k]); fire(); },
    remove: async () => { setAt(p, null); fire(); },
    transaction: async fn => { const r = fn(get(p) === undefined ? null : clone(get(p))); if (r === undefined) return { committed: false }; setAt(p, r); fire(); return { committed: true }; },
    once: async () => ({ val: () => clone(get(p)), exists: () => get(p) != null }),
    on: (e, cb) => { ls.push({ p, cb }); fire(); }, off: (e, cb) => { const i = ls.findIndex(l => l.cb === cb); if (i >= 0) ls.splice(i, 1); },
    orderByChild: k => ({ endAt: v => ({ limitToFirst: n => ({ once: async () => { const all = clone(get(p)) || {}; const o = {}; Object.keys(all).filter(c => (all[c] || {})[k] <= v).slice(0, n).forEach(c => o[c] = all[c]); return { val: () => Object.keys(o).length ? o : null }; } }) }), startAt: v => ({ on: (e, cb) => { const w = snap => { const all = clone(get(p)) || {}; const o = {}; for (const c in all) if ((all[c] || {})[k] >= v) o[c] = all[c]; cb({ val: () => Object.keys(o).length ? o : null }); }; cb.__w = w; ls.push({ p, cb: w }); fire(); }, off: (e, cb) => { const i = ls.findIndex(l => l.cb === cb.__w); if (i >= 0) ls.splice(i, 1); } }) }),
    onDisconnect: () => ({ set: () => {}, remove: () => {} })
  });
  const db = () => ({ ref }); db.ServerValue = { TIMESTAMP: Date.now() };
  window.__tree = tree; window.__ref = ref;
  window.firebase = { apps: [], initializeApp() { this.apps.push(1); }, auth: () => ({ signInAnonymously: async () => {}, currentUser: { uid: 'me' } }), database: db };
})();
