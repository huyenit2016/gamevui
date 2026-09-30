// Shared in-memory Firebase RTDB emulator for multi-page tests. Node holds the tree; pages talk to it via exposed functions.
const prune = v => { if (v === null || v === undefined) return undefined; if (Array.isArray(v)) { const a = v.map(prune); return a.every(x => x === undefined) ? undefined : a.map(x => x === undefined ? null : x); } if (typeof v === 'object') { const o = {}; for (const k in v) { const x = prune(v[k]); if (x !== undefined) o[k] = x; } return Object.keys(o).length ? o : undefined; } return v; };
const clone = v => v === undefined ? null : JSON.parse(JSON.stringify(v));
function makeHub() {
  const tree = {}, pages = new Set(), accounts = {}; let acctN = 0;
  const get = p => p.split('/').filter(Boolean).reduce((o, k) => o == null ? undefined : o[k], tree);
  const setAt = (p, v) => { const ks = p.split('/').filter(Boolean); let o = tree; for (let i = 0; i < ks.length - 1; i++) { if (typeof o[ks[i]] !== 'object' || o[ks[i]] === null) o[ks[i]] = {}; o = o[ks[i]]; } const last = ks[ks.length - 1]; const pv = prune(clone(v)); if (pv === undefined) delete o[last]; else o[last] = pv; };
  const notify = async () => { await Promise.all([...pages].map(pg => pg.evaluate(() => window.__fire && window.__fire()).catch(() => {}))); };
  async function attach(page, uid) {
    pages.add(page); const disc = [];
    let session = null;
    await page.exposeFunction('__hub', async (op, path, a, b) => {
      switch (op) {
        case 'auth': {
          if (path === 'session') return session;
          if (path === 'create') { if (accounts[a]) return { err: 'auth/email-already-in-use' }; const u = 'acct' + (++acctN); accounts[a] = { uid: u, pw: b }; session = { uid: u, email: a }; return session; }
          if (path === 'login') { const x = accounts[a]; if (!x || x.pw !== b) return { err: 'auth/invalid-credential' }; session = { uid: x.uid, email: a }; return session; }
          if (path === 'logout') { session = null; return {}; }
        }
        case 'get': return clone(get(path));
        case 'set': setAt(path, a); await notify(); return;
        case 'update': for (const k in a) setAt(path + '/' + k, a[k]); await notify(); return;
        case 'cas': { const cur = clone(get(path)); if (JSON.stringify(cur) !== JSON.stringify(a)) return { ok: false, cur }; setAt(path, b); await notify(); return { ok: true }; }
        case 'ondisc': disc.push([path, a]); return;
        case 'uid': return uid;
      }
    });
    await page.addInitScript(() => { window.__UID = null; });
    page.on('close', async () => { pages.delete(page); for (const [p, v] of disc) setAt(p, v === '__remove__' ? undefined : v); await notify(); });
  }
  return { tree, attach, get, notify };
}
module.exports = { makeHub };
