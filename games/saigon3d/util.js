// Tiện ích dựng hình dùng chung: texture mặt tiền (cửa sổ + mặt nạ phát sáng ban đêm), mái, biển hiệu, va chạm.
import * as THREE from 'three';
export const COL = { rects: [], circles: [] };   // vật cản cho người chơi / người đi bộ
export const winMats = [];                       // vật liệu có cửa sổ: độ sáng theo ban đêm
const TC = {};
export function canvasTex(key, w, h, draw) {
  if (TC[key]) return TC[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (TC[key] = t);
}
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

// Lưới cửa sổ: trả về [bản màu, mặt nạ phát sáng]. o: base, win, frame, shutter, arch, brick, ix, iy, lit, cw, ch
export function gridTex(cols, rows, o = {}) {
  const key = 'g' + cols + 'x' + rows + JSON.stringify(o), pw = o.pw || 40, W = Math.min(1024, cols * pw), H = Math.min(1024, rows * (o.ph || pw)), ix = o.ix ?? .2, iy = o.iy ?? .2;
  const cell = (g, i, j, f) => { const cwp = W / cols, chp = H / rows; f(g, i * cwp + cwp * ix, j * chp + chp * iy, cwp * (1 - 2 * ix), chp * (1 - 2 * iy), cwp); };
  const path = (g, x, y, w, h) => { g.beginPath(); if (o.arch) { g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); } else g.rect(x, y, w, h); g.closePath(); };
  const map = canvasTex(key, W, H, g => {
    g.fillStyle = o.base || '#ddd'; g.fillRect(0, 0, W, H);
    if (o.brick) { g.strokeStyle = 'rgba(70,25,12,.55)'; g.lineWidth = 1; for (let y = 0; y < H; y += 7) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (y / 7 % 2) * 6; x < W; x += 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 7); g.stroke(); } } }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) cell(g, i, j, (g, x, y, w, h, cwp) => {
      if (o.shutter) { g.fillStyle = o.shutter; g.fillRect(x - w * .27, y, w * .24, h); g.fillRect(x + w * 1.03, y, w * .24, h); }
      path(g, x, y, w, h); g.fillStyle = o.win || '#456'; g.fill(); if (o.frame) { g.strokeStyle = o.frame; g.lineWidth = Math.max(1.5, cwp * .07); g.stroke(); }
    });
  });
  const emi = canvasTex(key + 'e', W, H, g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const r = rng(hashS(key + 'e'));
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) cell(g, i, j, (g, x, y, w, h) => { if (r() < (o.lit ?? .55)) { path(g, x, y, w, h); g.fillStyle = '#ffd596'; g.fill(); } });
  });
  return [map, emi];
}
export function faceMat(cols, rows, o) { const [map, emissiveMap] = gridTex(cols, rows, o); const m = new THREE.MeshLambertMaterial({ map, emissiveMap, emissive: 0xffe2a8, emissiveIntensity: 0 }); winMats.push(m); return m; }
export function bldMats(w, h, d, o) {
  const sp = o.sp || 6, rows = o.rows || Math.max(1, Math.round(h / (o.fh || 4.5)));
  const mx = faceMat(o.cd || Math.max(1, Math.round(d / sp)), rows, o), mz = faceMat(o.cw || Math.max(1, Math.round(w / sp)), rows, o), roof = new THREE.MeshLambertMaterial({ color: o.roof || '#c9c4b8' });
  return [mx, mx, roof, roof, mz, mz];
}
const PM = {};
export const plain = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return PM[k] || (PM[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o))); };
const mesh = (parent, geom, m, x, y, z) => { const me = new THREE.Mesh(geom, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };
export function bld(parent, w, h, d, x, y, z, o) { return mesh(parent, new THREE.BoxGeometry(w, h, d), bldMats(w, h, d, o), x, y + h / 2, z); }
export function box(parent, w, h, d, x, y, z, c) { return mesh(parent, new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? plain(c) : c, x, y + h / 2, z); }
export function cyl(parent, rt, rb, h, x, y, z, c, seg = 10) { return mesh(parent, new THREE.CylinderGeometry(rt, rb, h, seg), typeof c === 'string' ? plain(c) : c, x, y + h / 2, z); }
// mái chữ A: w = bề ngang chân mái, d = chiều dài, rotY = π/2 để sống mái chạy theo trục x
export function gable(parent, w, d, h, c, x, y, z, rotY = 0) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const gm = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); gm.translate(0, 0, -d / 2);
  const me = mesh(parent, gm, plain(c), x, y, z); me.rotation.y = rotY; return me;
}
// mái chóp bốn mái (chữ nhật)
const HIP = new THREE.ConeGeometry(1, 1, 4, 1).rotateY(Math.PI / 4);
export function hipRoof(parent, w, d, h, c, x, y, z, ov = 1.06) { const me = mesh(parent, HIP, plain(c), x, y + h / 2, z); me.scale.set(w / 2 * Math.SQRT2 * ov, h, d / 2 * Math.SQRT2 * ov); return me; }

export function signMesh(text, w, h, o = {}) {
  const key = 'sg' + text + (o.bg || '') + (o.fg || ''), pw = 512, ph = Math.round(512 * h / w);
  const t = canvasTex(key, pw, ph, (g) => { g.fillStyle = o.bg || '#b3261e'; g.fillRect(0, 0, pw, ph); g.strokeStyle = o.fg || '#ffe9a8'; g.lineWidth = 8; g.strokeRect(10, 10, pw - 20, ph - 20); g.fillStyle = o.fg || '#ffe9a8'; g.font = `700 ${o.size || 56}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, pw / 2, ph / 2); });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
}
export function emojiMesh(emoji, s, bg) {
  const t = canvasTex('em' + emoji + bg, 128, 128, g => { g.fillStyle = bg || '#fff'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.font = '78px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 64, 70); });
  return new THREE.Mesh(new THREE.CircleGeometry(s, 20), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
}
export function clockMesh(r) {
  const t = canvasTex('clock', 128, 128, g => { g.fillStyle = '#f7f3e3'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 6; g.stroke(); g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.lineWidth = 3; g.beginPath(); g.moveTo(64 + Math.sin(a) * 50, 64 - Math.cos(a) * 50); g.lineTo(64 + Math.sin(a) * 56, 64 - Math.cos(a) * 56); g.stroke(); } g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 - 20, 64 - 24); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + 30, 64 - 30); g.stroke(); });
  return new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ map: t }));
}
export function flagMesh(w, h) {
  const t = canvasTex('flag', 192, 128, g => { g.fillStyle = '#da251d'; g.fillRect(0, 0, 192, 128); g.fillStyle = '#ffde00'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 22 : 52; g.lineTo(96 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.closePath(); g.fill(); });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
}

// ---- va chạm ----
export const addRect = (x0, x1, z0, z1) => COL.rects.push({ x0, x1, z0, z1 });
export const addCircle = (x, z, r) => COL.circles.push({ x, z, r });
// hình chữ nhật cục bộ của nhóm đã xoay theo bội số 90° → hình chữ nhật thế giới
export function addRectG(g, lx0, lx1, lz0, lz1) {
  const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y), xs = [], zs = [];
  for (const lx of [lx0, lx1]) for (const lz of [lz0, lz1]) { xs.push(g.position.x + lx * c + lz * s); zs.push(g.position.z - lx * s + lz * c); }
  addRect(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs));
}
export function collide(p, r) {
  for (const b of COL.rects) {
    const cx = Math.max(b.x0, Math.min(p.x, b.x1)), cz = Math.max(b.z0, Math.min(p.z, b.z1)), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 > r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
    else { const l = p.x - b.x0, rr = b.x1 - p.x, t = p.z - b.z0, bt = b.z1 - p.z, m = Math.min(l, rr, t, bt); if (m === l) p.x = b.x0 - r; else if (m === rr) p.x = b.x1 + r; else if (m === t) p.z = b.z0 - r; else p.z = b.z1 + r; }
  }
  for (const c of COL.circles) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-5) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } }
}
