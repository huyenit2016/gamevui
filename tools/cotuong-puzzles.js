// Sinh bài tập cho app/tuluyencotuong/ bằng chính engine trong index.html.
// Chạy: node tools/cotuong-puzzles.js [seed]  → in JSON {easy:[...],mid:[...],hard:[...]} (mỗi thế {g,m}).
// Ràng buộc quân hợp lệ: Tướng/Sĩ trong cung, Sĩ/Tượng đúng điểm, Tốt đúng hàng/cột, số quân ≤ bộ cờ chuẩn.
// Đáp án kiểm theo đúng logic nhận nước đi của app: Dễ/Vừa = chiếu hết 1 nước; Khó = chiếu ép (forced2) rồi chiếu hết,
// không có chiếu hết 1 nước và nước đầu hợp lệ DUY NHẤT.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../app/tuluyencotuong/index.html'), 'utf8');
const a = src.indexOf('const COLS=9'), b = src.indexOf('/* ===== State');
const E = new Function('document', src.slice(a, b) + ';return {parse,allLegal,applyMove,inCheck,isMate,findK}')({ getElementById() {} });
const { allLegal, applyMove, inCheck, isMate } = E;
let seed = +process.argv[2] || 20261125;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const ri = n => Math.floor(rnd() * n), pick = a => a[ri(a.length)];
const A_PTS = s => s === 'b' ? [[3,0],[5,0],[4,1],[3,2],[5,2]] : [[3,9],[5,9],[4,8],[3,7],[5,7]];
const E_PTS = s => s === 'b' ? [[2,0],[6,0],[0,2],[4,2],[8,2],[2,4],[6,4]] : [[2,9],[6,9],[0,7],[4,7],[8,7],[2,5],[6,5]];
const PAL = s => { const o = []; for (let c = 3; c <= 5; c++) for (let r = (s === 'b' ? 0 : 7); r <= (s === 'b' ? 2 : 9); r++) o.push([c, r]); return o };
function pawnSq(s) { const o = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) { const own = s === 'r' ? r >= 5 : r <= 4; const back = s === 'r' ? r > 6 : r < 3; if (back) continue; if (own && c % 2) continue; o.push([c, r]) } return o }
function build(spec) { // spec: {b:{A,E,R,C,H,P}, r:{...}}
  const B = Array.from({ length: 10 }, () => Array(9).fill(null)); const put = (t, s, pts) => { for (let k = 0; k < 20; k++) { const p = pick(pts); if (!B[p[1]][p[0]]) { B[p[1]][p[0]] = { t, s }; return true } } return false };
  for (const s of ['b', 'r']) { if (!put('K', s, PAL(s))) return null; const sp = spec[s];
    for (const t of ['A', 'E']) for (let i = 0; i < (sp[t] || 0); i++) if (!put(t, s, t === 'A' ? A_PTS(s) : E_PTS(s))) return null;
    for (const t of ['R', 'C', 'H']) for (let i = 0; i < (sp[t] || 0); i++) { const all = []; for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) all.push([c, r]); if (!put(t, s, all)) return null }
    for (let i = 0; i < (sp.P || 0); i++) if (!put('P', s, pawnSq(s))) return null }
  return B }
const gStr = B => B.map(row => row.map(p => p ? (p.s === 'r' ? p.t : p.t.toLowerCase()) : '.').join(' ')).join('/');
const mates = B => allLegal(B, 'r').filter(m => isMate(applyMove(B, m[0], m[1], m[2], m[3]), 'b'));
function forced2(N) { const reps = allLegal(N, 'b'); if (!reps.length) return null; let best = null, bc = 1e9; for (const r of reps) { const c = mates(applyMove(N, r[0], r[1], r[2], r[3])).length; if (c === 0) return null; if (c < bc) { bc = c; best = r } } return best }
const cnt = B => B.flat().filter(Boolean).length;
const typeOf = (B, m) => B[m[1]][m[0]].t;
function gen(kind, need) {
  const out = [], seen = new Set(), used = {}; let tries = 0;
  while (out.length < need && tries++ < 400000) {
    const nb = { A: ri(3), E: ri(3), R: 0, C: 0, H: 0, P: 0 }, nr = { A: ri(2), E: ri(2), R: 0, C: 0, H: 0, P: 0 };
    const att = kind === 'easy' ? 2 + ri(2) : kind === 'mid' ? 4 + ri(2) : 3 + ri(3);
    for (let i = 0; i < att; i++) { const t = pick(['R', 'R', 'C', 'C', 'H', 'H', 'P']); const lim = t === 'P' ? 5 : 2; if (nr[t] < lim) nr[t]++ }
    const dec = kind === 'easy' ? ri(2) : kind === 'mid' ? 2 + ri(3) : 1 + ri(3);
    for (let i = 0; i < dec; i++) { const t = pick(['R', 'C', 'H', 'P', 'P']); const lim = t === 'P' ? 5 : 2; if (nb[t] < lim) nb[t]++ }
    const B = build({ b: nb, r: nr }); if (!B) continue;
    if (inCheck(B, 'r') || inCheck(B, 'b')) continue;
    const total = cnt(B); if (kind === 'easy' && total > 9) continue;
    const ms = mates(B); let sol = null;
    if (kind === 'easy') { if (ms.length !== 1) continue; sol = ms[0] }
    else if (kind === 'mid') { if (ms.length < 1 || ms.length > 2) continue; const chk = allLegal(B, 'r').filter(m => inCheck(applyMove(B, m[0], m[1], m[2], m[3]), 'b')).length; if (chk < 3) continue; sol = ms[0] }
    else { if (ms.length) continue; const acc = allLegal(B, 'r').filter(m => { const N = applyMove(B, m[0], m[1], m[2], m[3]); return inCheck(N, 'b') && forced2(N) }); if (acc.length !== 1) continue; sol = acc[0];
      // chọn thế mà nước đầu không phải nước ăn Tướng dễ đoán: yêu cầu có ≥ 2 nước chiếu khác để gây nhiễu
      const chk = allLegal(B, 'r').filter(m => inCheck(applyMove(B, m[0], m[1], m[2], m[3]), 'b')).length; if (chk < 3) continue }
    const g = gStr(B); if (seen.has(g)) continue; const t = typeOf(B, sol);
    if ((used[t] || 0) >= Math.ceil(need / 2)) continue; // đa dạng quân chiếu hết
    seen.add(g); used[t] = (used[t] || 0) + 1; out.push({ g, m: sol.slice() }) }
  return out }
const res = { easy: gen('easy', 4), mid: gen('mid', 4), hard: gen('hard', 3) };
console.log(JSON.stringify(res));
