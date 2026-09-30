// Minimal Firebase Realtime Database rules simulator (subset used by GameVui).
String.prototype.matches = function (re) { return re.test(String(this)); };
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const pathOf = p => p.split('/').filter(Boolean);
const getAt = (t, segs) => segs.reduce((o, k) => o == null || typeof o !== 'object' ? undefined : o[k], t);
function setAt(t, segs, v) { if (!segs.length) return v; const out = clone(t) || {}; let o = out; for (let i = 0; i < segs.length - 1; i++) { if (typeof o[segs[i]] !== 'object' || o[segs[i]] === null) o[segs[i]] = {}; o = o[segs[i]]; } if (v === undefined || v === null) delete o[segs[segs.length - 1]]; else o[segs[segs.length - 1]] = clone(v); return out; }
class Snap {
  constructor(v) { this.v = v === null ? undefined : v; }
  child(p) { return new Snap(getAt(this.v, pathOf(String(p)))); }
  val() { return this.v; }
  exists() { return this.v !== undefined && this.v !== null; }
  hasChild(p) { return this.child(p).exists(); }
  hasChildren(ks) { return this.v && typeof this.v === 'object' && (ks ? ks.every(k => this.v[k] !== undefined) : Object.keys(this.v).length > 0); }
  isString() { return typeof this.v === 'string'; } isNumber() { return typeof this.v === 'number'; } isBoolean() { return typeof this.v === 'boolean'; }
}
function evalRule(expr, ctx) {
  const js = expr.replace(/\$([A-Za-z_]\w*)/g, '__v.$1').replace(/\.replace\(/g, '.replaceAll(');
  try { return !!new Function('data', 'newData', 'root', 'auth', 'now', '__v', `return (${js});`)(ctx.data, ctx.newData, ctx.root, ctx.auth, ctx.now, ctx.vars); }
  catch (e) { return false; }
}
function match(node, key) { if (node[key] !== undefined && typeof node[key] === 'object' && !key.startsWith('.')) return [key, node[key], null]; for (const k of Object.keys(node)) if (k.startsWith('$')) return [k, node[k], k.slice(1)]; return null; }
function makeCtx(tree, newTree, segs, vars, auth, now) { return { data: new Snap(getAt(tree, segs)), newData: new Snap(getAt(newTree, segs)), root: new Snap(tree), auth, now, vars: Object.assign({}, vars) }; }
function check(rules, tree, op, path, value, auth, now = Date.now()) {
  const segs = pathOf(path), newTree = op === 'write' ? setAt(tree, segs, value) : tree;
  let node = rules.rules, vars = {}, ok = false, why = 'no rule grants ' + op;
  const chain = [[node, [], {}]];
  for (let i = 0; i < segs.length; i++) { const m = node && match(node, segs[i]); if (!m) { node = null; break; } node = m[1]; if (m[2]) vars[m[2]] = segs[i]; chain.push([node, segs.slice(0, i + 1), Object.assign({}, vars)]); }
  for (const [n, sg, vs] of chain) { const e = n && n['.' + op]; if (e && evalRule(e, makeCtx(tree, newTree, sg, vs, auth, now))) { ok = true; why = `granted at /${sg.join('/')}`; break; } }
  if (!ok) return { ok, why };
  if (op === 'write') { // .validate on written node and descendants
    const vd = (n, sg, vs) => {
      const nd = getAt(newTree, sg);
      if (n['.validate'] && nd !== undefined && !evalRule(n['.validate'], makeCtx(tree, newTree, sg, vs, auth, now))) return '/' + sg.join('/');
      if (nd && typeof nd === 'object') for (const k of Object.keys(nd)) { const m = match(n, k); if (m) { const v2 = Object.assign({}, vs); if (m[2]) v2[m[2]] = k; const r = vd(m[1], sg.concat(k), v2); if (r) return r; } }
      return null;
    };
    const tgt = chain[chain.length - 1]; if (tgt && tgt[0]) { const bad = vd(tgt[0], tgt[1], tgt[2]); if (bad) return { ok: false, why: 'validate failed at ' + bad }; }
  }
  return { ok, why };
}
module.exports = { check, setAt };
