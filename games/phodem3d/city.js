// Phố Đêm 3D · thành phố sinh bằng thuật toán (cố định theo hạt giống): lưới 8×8 khối, đường 4 làn, toà nhà gộp mesh theo khối,
// va chạm AABB/hình tròn theo ô, đèn đường + cây (InstancedMesh), bản đồ nhỏ và các hàm tìm đường cho AI.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const N = 8, CELL = 76, ROAD = 14, BLK = CELL - ROAD, HALF = N * CELL / 2;
export const roadC = i => i * CELL - HALF;          // toạ độ tim đường thứ i (0..N)
export const blockMin = i => roadC(i) + ROAD / 2;   // mép khối thứ i (0..N-1)
export const LANES = [1.75, 5.25];
export const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const col = h => new THREE.Color(h);

function facadeTextures(aniso) {
  const W = 512, H = 512, bays = 4, floors = 8, r = mulberry(7);
  const m = document.createElement('canvas'), e = document.createElement('canvas'); m.width = e.width = W; m.height = e.height = H;
  const a = m.getContext('2d'), b = e.getContext('2d');
  a.fillStyle = '#e6e2da'; a.fillRect(0, 0, W, H); b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
  const cw = W / bays, ch = H / floors;
  for (let f = 0; f < floors; f++) for (let k = 0; k < bays; k++) {
    const x = k * cw + cw * 0.16, y = f * ch + ch * 0.2, w = cw * 0.68, h = ch * 0.56;
    a.fillStyle = '#b9b4aa'; a.fillRect(x - 3, y - 3, w + 6, h + 6);
    const g = a.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#41546b'); g.addColorStop(1, '#1d2733'); a.fillStyle = g; a.fillRect(x, y, w, h);
    a.fillStyle = 'rgba(255,255,255,.08)'; a.fillRect(x, y, w * 0.4, h);
    if (r() < 0.42) { b.fillStyle = r() < 0.75 ? '#ffd8a0' : '#bfe3ff'; b.globalAlpha = 0.6 + r() * 0.4; b.fillRect(x, y, w, h); b.globalAlpha = 1; }
  }
  const mk = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; return t; };
  return { map: mk(m), emissive: mk(e) };
}

function roadTexture(aniso) {
  const S = 1024, p = S / CELL, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#6a6e76'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) { const v = 96 + Math.random() * 26 | 0; x.fillStyle = `rgba(${v},${v},${v + 2},.35)`; x.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
  const R = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X * p, Y * p, w * p, h * p); };
  const HR = ROAD / 2;
  // vạch giữa (vàng đôi) + vạch làn (trắng đứt) theo 2 trục; tim đường nằm ở mép ô
  for (const [X0, Y0, vert] of [[0, 0, true], [0, 0, false]]) {
    for (const E of [0, CELL]) for (const s of [-0.22, 0.12]) { // vàng đôi
      if (vert) R(E + s, 12, 0.1, CELL - 24, '#d9b02a'); else R(12, E + s, CELL - 24, 0.1, '#d9b02a'); }
    for (const E of [0, CELL]) for (const o of [-3.5, 3.5]) for (let t = 12; t < CELL - 12; t += 4) { // trắng đứt
      if (vert) R(E + o - 0.06, t, 0.12, 2, '#dcdcdc'); else R(t, E + o - 0.06, 2, 0.12, '#dcdcdc'); }
  }
  // vạch qua đường (zebra) ở 4 nhánh mỗi giao lộ
  for (const cx of [0, CELL]) for (const cy of [0, CELL]) for (const k of [-6.5, -5.5, -4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5]) {
    for (const s of [-1, 1]) { R(cx + k - 0.25, cy + s * 9.75 - 1.25, 0.5, 2.5, '#d8d8d4'); R(cx + s * 9.75 - 1.25, cy + k - 0.25, 2.5, 0.5, '#d8d8d4'); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(N, N); t.anisotropy = aniso; return t;
}

export class City {
  constructor(opts = {}) {
    this.group = new THREE.Group(); this.cells = Array.from({ length: N * N }, () => []); this.rand = mulberry(20261126);
    this.parks = []; this.lampPos = []; this.mats = {}; this.opts = opts; this.build();
  }
  /* ---------- sinh thành phố ---------- */
  build() {
    const R = this.rand, aniso = this.opts.aniso || 4, G = this.group;
    const ft = facadeTextures(aniso);
    const facade = this.mats.facade = new THREE.MeshStandardMaterial({ map: ft.map, emissiveMap: ft.emissive, emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true, roughness: 0.82, metalness: 0.05 });
    // mặt đường + nền xanh ngoài thành phố
    const road = new THREE.Mesh(new THREE.PlaneGeometry(N * CELL, N * CELL), new THREE.MeshStandardMaterial({ map: roadTexture(aniso), roughness: 0.9, metalness: 0 }));
    road.rotation.x = -Math.PI / 2; road.receiveShadow = true; G.add(road);
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ color: 0x2c4a2a, roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.06; G.add(grass);

    const slabs = [], blds = [], palette = ['#d3cdc2', '#bdb5a6', '#aab6c0', '#dccfb8', '#a4acb2', '#c29a84', '#939fab', '#cdbfa6', '#8795a1', '#e0d8c8'];
    const addBld = (w, h, d, cx, cz, y0, color, hasCol = true) => {
      const g = new THREE.BoxGeometry(w, h, d); g.translate(cx, y0 + h / 2, cz); const uv = g.attributes.uv, ou = R(), c = col(color), n = g.attributes.position.count, cols = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { const face = k >> 2; if (face === 2 || face === 3) uv.setXY(k, 0.004, 0.004); else { const su = (face < 2 ? d : w) / 24, sv = h / 27; uv.setXY(k, uv.getX(k) * su + ou, uv.getY(k) * sv); } cols[k * 3] = c.r; cols[k * 3 + 1] = c.g; cols[k * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); return g;
    };
    const slabGeos = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x0 = blockMin(i), z0 = blockMin(j), cx = x0 + BLK / 2, cz = z0 + BLK / 2, d = Math.hypot(i - (N - 1) / 2, j - (N - 1) / 2), cell = this.cells[j * N + i];
      const plaza = i === 3 && j === 3, park = !plaza && !(d < 1.6) && R() < 0.1;
      const kind = plaza ? 'plaza' : park ? 'park' : d < 2.7 && R() < 0.6 ? 'tower' : d > 3.7 ? 'low' : 'mid';
      // bệ khối (vỉa hè)
      const sg = new THREE.BoxGeometry(BLK, 0.22, BLK); sg.translate(cx, 0.11, cz); const sc = col(plaza ? '#a8a49a' : park ? '#3f6b3a' : '#8c8e91'), sn = sg.attributes.position.count, sca = new Float32Array(sn * 3);
      for (let k = 0; k < sn; k++) { sca[k * 3] = sc.r; sca[k * 3 + 1] = sc.g; sca[k * 3 + 2] = sc.b; } sg.setAttribute('color', new THREE.BufferAttribute(sca, 3)); slabGeos.push(sg);
      if (plaza) { this.buildPlaza(cx, cz, cell); this.plaza = { x: cx, z: cz }; continue; }
      if (park) { this.parks.push({ x: cx, z: cz }); for (let k = 0; k < 26; k++) { const tx = cx + (R() - 0.5) * (BLK - 8), tz = cz + (R() - 0.5) * (BLK - 8); this.addTree(tx, tz, cell); } continue; }
      const inner = BLK - 7;
      if (kind === 'tower') {
        const w = inner * (0.62 + R() * 0.2), dd = inner * (0.62 + R() * 0.2), h = 70 + R() * 90, c = palette[R() * palette.length | 0];
        blds.push(addBld(w, h, dd, cx, cz, 0.22, c)); blds.push(addBld(w * 0.6, 14, dd * 0.6, cx, cz, h + 0.22, c));
        cell.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - dd / 2, z1: cz + dd / 2, h });
      } else {
        const lot = (inner - 5) / 2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const w = lot * (0.72 + R() * 0.28), dd = lot * (0.72 + R() * 0.28), h = kind === 'mid' ? 16 + R() * 40 : 6 + R() * 12, lx = cx + sx * (lot / 2 + 2.5) + (R() - 0.5) * 2, lz = cz + sz * (lot / 2 + 2.5) + (R() - 0.5) * 2, c = palette[R() * palette.length | 0];
          blds.push(addBld(w, h, dd, lx, lz, 0.22, c));
          if (R() < 0.7) blds.push(addBld(w * 0.35, 2.2, dd * 0.35, lx + (R() - 0.5) * w * 0.3, lz + (R() - 0.5) * dd * 0.3, h + 0.22, '#7c8087'));
          cell.push({ x0: lx - w / 2, x1: lx + w / 2, z0: lz - dd / 2, z1: lz + dd / 2, h });
        }
      }
      // cây hàng phố + đèn đường dọc 4 mép khối
      for (let s = 0; s < 4; s++) for (let k = 0; k < 3; k++) {
        const t = -BLK / 2 + 9 + k * (BLK - 18) / 2, inset = BLK / 2 - 1.2;
        const px = s === 0 ? cx + t : s === 1 ? cx + inset : s === 2 ? cx - t : cx - inset, pz = s === 0 ? cz - inset : s === 1 ? cz + t : s === 2 ? cz + inset : cz - t;
        if (k === 1) this.addTree(px + (s === 1 ? -1 : s === 3 ? 1 : 0), pz + (s === 0 ? 1 : s === 2 ? -1 : 0), cell); else { this.lampPos.push([px, pz, Math.atan2(px - cx, pz - cz)]); cell.push({ x: px, z: pz, r: 0.3 }); }
      }
    }
    const slab = new THREE.Mesh(mergeGeometries(slabGeos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); slab.receiveShadow = true; G.add(slab);
    const bm = new THREE.Mesh(mergeGeometries(blds), facade); bm.castShadow = true; bm.receiveShadow = true; G.add(bm);
    this.buildLamps(); this.buildTrees(); this.buildMinimap();
  }
  buildPlaza(cx, cz, cell) {
    const G = this.group, ring = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.4, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.8 })); ring.position.set(cx, 0.5, cz); ring.castShadow = ring.receiveShadow = true; G.add(ring);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x2a6f98, roughness: 0.15, metalness: 0.4, emissive: 0x0a3550, emissiveIntensity: 0.5 })); water.position.set(cx, 0.62, cz); G.add(water);
    cell.push({ x: cx, z: cz, r: 7.4 });
    const tw = new THREE.Mesh(new THREE.BoxGeometry(4.5, 120, 4.5), new THREE.MeshStandardMaterial({ color: 0x2b3340, roughness: 0.4, metalness: 0.6 })); tw.position.set(cx + 16, 60.2, cz + 16); tw.castShadow = true; G.add(tw);
    cell.push({ x0: cx + 16 - 2.4, x1: cx + 16 + 2.4, z0: cz + 16 - 2.4, z1: cz + 16 + 2.4, h: 120 });
    this.neon = []; for (let k = 0; k < 6; k++) { const m = new THREE.MeshBasicMaterial({ color: k % 2 ? 0x00e5ff : 0xff3df2, toneMapped: false }); const r = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.7, 5.2), m); r.position.set(cx + 16, 40 + k * 15, cz + 16); G.add(r); this.neon.push(m); }
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; this.addTree(cx + Math.cos(a) * 19, cz + Math.sin(a) * 19, cell); }
  }
  addTree(x, z, cell) { (this.trees || (this.trees = [])).push([x, z, 0.8 + this.rand() * 0.7, this.rand()]); cell.push({ x, z, r: 0.45 }); }
  buildLamps() {
    const n = this.lampPos.length, pole = new THREE.CylinderGeometry(0.07, 0.1, 7, 6); pole.translate(0, 3.5, 0);
    const arm = new THREE.BoxGeometry(0.08, 0.08, 1.4); arm.translate(0, 7, 0.6);
    const poleM = new THREE.InstancedMesh(mergeGeometries([pole, arm]), new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.6, metalness: 0.5 }), n);
    const head = new THREE.BoxGeometry(0.4, 0.12, 0.7); head.translate(0, 6.94, 1.2);
    const headMat = this.mats.lamp = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffc27a, emissiveIntensity: 0.1 });
    const headM = new THREE.InstancedMesh(head, headMat, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
    this.lampPos.forEach(([x, z, yaw], k) => { e.set(0, yaw, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(x, 0.2, z), q, s); poleM.setMatrixAt(k, m); headM.setMatrixAt(k, m); });
    poleM.castShadow = false; this.group.add(poleM, headM);
    // vệt sáng dưới đèn (cộng sáng, chỉ hiện ban đêm)
    const rc = document.createElement('canvas'); rc.width = rc.height = 128; const rx = rc.getContext('2d'), gr = rx.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, 'rgba(255,196,120,.9)'); gr.addColorStop(0.5, 'rgba(255,170,90,.28)'); gr.addColorStop(1, 'rgba(255,150,70,0)'); rx.fillStyle = gr; rx.fillRect(0, 0, 128, 128);
    const poolMat = this.mats.pool = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(rc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false, toneMapped: false });
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(13, 13).rotateX(-Math.PI / 2), poolMat, n); pools.renderOrder = 2;
    this.lampPos.forEach(([x, z, yaw], k) => { m.compose(new THREE.Vector3(x + Math.sin(yaw) * 1.5, 0.26, z + Math.cos(yaw) * 1.5), q.identity(), s); pools.setMatrixAt(k, m); }); this.group.add(pools);
  }
  buildTrees() {
    const T = this.trees || [], n = T.length, trunk = new THREE.CylinderGeometry(0.18, 0.26, 2.2, 6); trunk.translate(0, 1.1, 0);
    const crown = new THREE.IcosahedronGeometry(1.7, 1); crown.translate(0, 3.6, 0);
    const tm = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x5b4330, roughness: 1 }), n), cm = new THREE.InstancedMesh(crown, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), n);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    T.forEach(([x, z, s, v], k) => { m.compose(new THREE.Vector3(x, 0.2, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); tm.setMatrixAt(k, m); cm.setMatrixAt(k, m); c.setHSL(0.25 + v * 0.08, 0.45, 0.22 + v * 0.1); cm.setColorAt(k, c); });
    cm.castShadow = true; tm.castShadow = true; this.group.add(tm, cm);
  }
  buildMinimap() {
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), k = S / (N * CELL);
    x.fillStyle = '#1b2430'; x.fillRect(0, 0, S, S);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { x.fillStyle = this.parks.some(p => Math.abs(p.x - (blockMin(i) + BLK / 2)) < 1 && Math.abs(p.z - (blockMin(j) + BLK / 2)) < 1) ? '#2d5a34' : '#3b4757'; x.fillRect((blockMin(i) + HALF) * k, (blockMin(j) + HALF) * k, BLK * k, BLK * k); }
    this.mini = c;
  }
  /* ---------- va chạm ---------- */
  cellAt(x, z) { const i = Math.floor((x + HALF) / CELL), j = Math.floor((z + HALF) / CELL); return i < 0 || j < 0 || i >= N || j >= N ? null : this.cells[j * N + i]; }
  // đẩy hình tròn (x,z,r) ra khỏi vật cản. Trả về null hoặc {px,pz,nx,nz}
  push(x, z, r) {
    let px = 0, pz = 0, nx = 0, nz = 0, best = 0, hit = false;
    const i0 = Math.max(0, Math.floor((x - r + HALF) / CELL)), i1 = Math.min(N - 1, Math.floor((x + r + HALF) / CELL)), j0 = Math.max(0, Math.floor((z - r + HALF) / CELL)), j1 = Math.min(N - 1, Math.floor((z + r + HALF) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) for (const c of this.cells[j * N + i]) {
      const X = x + px, Z = z + pz; let dx, dz, d, pen, ax, az;
      if (c.r !== undefined) { dx = X - c.x; dz = Z - c.z; d = Math.hypot(dx, dz); if (d >= r + c.r) continue; pen = r + c.r - d; if (d < 1e-6) { ax = 1; az = 0; } else { ax = dx / d; az = dz / d; } }
      else {
        const qx = Math.max(c.x0, Math.min(X, c.x1)), qz = Math.max(c.z0, Math.min(Z, c.z1)); dx = X - qx; dz = Z - qz; const d2 = dx * dx + dz * dz; if (d2 >= r * r) continue;
        if (d2 > 1e-8) { d = Math.sqrt(d2); pen = r - d; ax = dx / d; az = dz / d; }
        else { const a = X - c.x0, b = c.x1 - X, cc = Z - c.z0, e = c.z1 - Z, m = Math.min(a, b, cc, e); if (m === a) { ax = -1; az = 0; pen = a + r; } else if (m === b) { ax = 1; az = 0; pen = b + r; } else if (m === cc) { ax = 0; az = -1; pen = cc + r; } else { ax = 0; az = 1; pen = e + r; } }
      }
      px += ax * pen; pz += az * pen; hit = true; if (pen > best) { best = pen; nx = ax; nz = az; }
    }
    return hit ? { px, pz, nx, nz, pen: best } : null;
  }
  solidAt(x, z, y = 0) { const cell = this.cellAt(x, z); if (!cell) return false; for (const c of cell) { if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r) return true; } else if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && y < c.h) return true; } return false; }
  lineClear(x0, z0, x1, z1) { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 3); for (let k = 1; k < n; k++) { const t = k / n; if (this.solidAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 2)) return false; } return true; }
  /* ---------- đồ thị đường cho AI ---------- */
  node(i, j) { return [roadC(i), roadC(j)]; }
  nearestNode(x, z) { return [Math.max(0, Math.min(N, Math.round((x + HALF) / CELL))), Math.max(0, Math.min(N, Math.round((z + HALF) / CELL)))]; }
  neighbors(i, j) { const o = []; if (i > 0) o.push([i - 1, j]); if (i < N) o.push([i + 1, j]); if (j > 0) o.push([i, j - 1]); if (j < N) o.push([i, j + 1]); return o; }
  route(a, b) { // BFS trên lưới (N+1)²
    const key = (i, j) => j * (N + 1) + i, prev = new Map([[key(...a), null]]), q = [a];
    while (q.length) { const cur = q.shift(); if (cur[0] === b[0] && cur[1] === b[1]) break; for (const nb of this.neighbors(...cur)) { const k = key(...nb); if (!prev.has(k)) { prev.set(k, cur); q.push(nb); } } }
    const out = []; let c = b; while (c) { out.push(c); c = prev.get(key(...c)); } return out.reverse();
  }
  randomRoadPoint(minD = 0, from = null, maxD = 1e9) { // điểm ngẫu nhiên trên làn đường
    for (let t = 0; t < 40; t++) {
      const vert = this.rand() < 0.5, k = Math.floor(this.rand() * (N + 1)), s = (this.rand() * N * CELL) - HALF, off = (this.rand() < 0.5 ? -1 : 1) * LANES[this.rand() * 2 | 0];
      const x = vert ? roadC(k) + off : s, z = vert ? s : roadC(k) + off;
      if (Math.abs(((vert ? s : s) + HALF) % CELL) < 11 || Math.abs(((vert ? s : s) + HALF) % CELL - CELL) < 11) continue; // tránh giao lộ
      const d = from ? Math.hypot(x - from.x, z - from.z) : 1e9; if (from && (d < minD || d > maxD)) continue;
      return { x, z, vert, yaw: vert ? (off > 0 ? Math.PI : 0) : (off > 0 ? Math.PI / 2 : -Math.PI / 2), k }; // lái bên phải: +z dùng làn x<tim, +x dùng làn z>tim
    }
    return null;
  }
  update(night, t) { // đêm → bật đèn
    this.mats.facade.emissiveIntensity = night * 1.1; this.mats.lamp.emissiveIntensity = 0.15 + night * 3.2; this.mats.pool.opacity = Math.min(0.55, night * 0.6);
    if (this.neon) this.neon.forEach((m, k) => { m.color.setHSL(k % 2 ? 0.52 : 0.85, 1, 0.45 + 0.1 * Math.sin(t * 2 + k)); });
  }
}
