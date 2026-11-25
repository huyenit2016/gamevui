// Phố Đêm 3D · thực thể: người (mô hình khối có hoạt ảnh đi bộ), nhân vật chính, người đi bộ NPC theo vỉa hè,
// tài xế AI đi theo làn đường (lái bên phải), cảnh sát truy đuổi bằng tìm đường trên lưới.
import * as THREE from 'three';
import { N, CELL, BLK, HALF, LANES, roadC, blockMin } from './city.js';

const mats = new Map(); const M = c => { if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })); return mats.get(c); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const boxGeo = (w, h, d, y = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, y, 0); return g; };
const G = { leg: boxGeo(0.2, 0.82, 0.22, -0.41), arm: boxGeo(0.14, 0.6, 0.16, -0.28), torso: boxGeo(0.5, 0.66, 0.28), head: boxGeo(0.23, 0.26, 0.24), hair: boxGeo(0.25, 0.1, 0.26), shoe: boxGeo(0.22, 0.1, 0.32, 0) };

export function makeHuman({ skin = 0xe0ac86, shirt = 0x2a6fdb, pants = 0x2b2f3a, hair = 0x2a1d14 } = {}) {
  const g = new THREE.Group(), add = (geo, c, x, y, z, parent = g) => { const m = new THREE.Mesh(geo, M(c)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const lp = new THREE.Group(); lp.position.set(s * 0.12, 0.85, 0); add(G.leg, pants, 0, 0, 0, lp); add(G.shoe, 0x15151a, 0, -0.8, 0.05, lp); g.add(lp); legs.push(lp);
    const ap = new THREE.Group(); ap.position.set(s * 0.33, 1.5, 0); add(G.arm, shirt, 0, 0, 0, ap); add(boxGeo(0.12, 0.12, 0.13, -0.62), skin, 0, 0, 0, ap); g.add(ap); arms.push(ap);
  }
  add(G.torso, shirt, 0, 1.19, 0); add(G.head, skin, 0, 1.68, 0); add(G.hair, hair, 0, 1.84, -0.01);
  g.userData = { legs, arms, phase: Math.random() * 6 }; return g;
}
export function animHuman(g, speed, dt) {
  const u = g.userData; u.phase += dt * (2 + speed * 1.7); const amp = Math.min(1, speed / 3.2), s = Math.sin(u.phase);
  u.legs[0].rotation.x = s * 0.85 * amp; u.legs[1].rotation.x = -s * 0.85 * amp; u.arms[0].rotation.x = -s * 0.7 * amp; u.arms[1].rotation.x = s * 0.7 * amp;
}
const SKINS = [0xf1c9a5, 0xe0ac86, 0xc68a60, 0x8d5a3b, 0x5e3a28], SHIRTS = [0x2a6fdb, 0xd04a4a, 0x39a36b, 0xe3b53c, 0x8e5bd4, 0xe8e8e8, 0x222831, 0xff7a3d], PANTS = [0x2b2f3a, 0x3c3226, 0x4a5568, 0x1e2a44, 0x5a4a3a], HAIRS = [0x2a1d14, 0x111111, 0x6b4a2a, 0xb8a064, 0x8a8a8a];
const pick = a => a[Math.random() * a.length | 0];
export const randomHuman = () => makeHuman({ skin: pick(SKINS), shirt: pick(SHIRTS), pants: pick(PANTS), hair: pick(HAIRS) });

/* ------------------------------ nhân vật chính ------------------------------ */
export class Player {
  constructor() { this.mesh = makeHuman({ skin: 0xe0ac86, shirt: 0xe8453c, pants: 0x1f2937, hair: 0x15110d }); this.x = 0; this.z = 0; this.y = 0; this.vy = 0; this.yaw = 0; this.vx = 0; this.vz = 0; this.speed = 0; this.vehicle = null; this.grounded = true; }
  teleport(x, z) { this.x = x; this.z = z; this.vx = this.vz = 0; this.y = 0; this.vy = 0; }
  update(dt, inp, camYaw, city) {
    const f = [-Math.sin(camYaw), -Math.cos(camYaw)], r = [Math.cos(camYaw), -Math.sin(camYaw)];
    let dx = f[0] * inp.mz + r[0] * inp.mx, dz = f[1] * inp.mz + r[1] * inp.mx; const m = Math.hypot(dx, dz); if (m > 1) { dx /= m; dz /= m; }
    const sp = inp.run ? 6.4 : 3.5, k = Math.min(1, dt * 10); this.vx += (dx * sp - this.vx) * k; this.vz += (dz * sp - this.vz) * k;
    if (inp.jump && this.grounded) { this.vy = 5.4; this.grounded = false; }
    this.vy -= 15 * dt; this.y += this.vy * dt; if (this.y <= 0) { this.y = 0; this.vy = 0; this.grounded = true; }
    this.x += this.vx * dt; this.z += this.vz * dt;
    const hit = city.push(this.x, this.z, 0.4); if (hit) { this.x += hit.px; this.z += hit.pz; }
    this.x = clamp(this.x, -HALF - 30, HALF + 30); this.z = clamp(this.z, -HALF - 30, HALF + 30);
    this.speed = Math.hypot(this.vx, this.vz); if (this.speed > 0.4) this.yaw += wrap(Math.atan2(this.vx, this.vz) - this.yaw) * Math.min(1, dt * 12);
    this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw; animHuman(this.mesh, this.grounded ? this.speed : 1, dt);
  }
}

/* ------------------------------ người đi bộ NPC ------------------------------ */
export class Ped {
  constructor() { this.mesh = randomHuman(); this.state = 'walk'; this.t = 0; this.respawn(null); }
  perim(s) { const e = BLK - 3.2, x0 = blockMin(this.bi) + 1.6, z0 = blockMin(this.bj) + 1.6, x1 = x0 + e, z1 = z0 + e; s = ((s % (4 * e)) + 4 * e) % (4 * e); const seg = Math.floor(s / e), u = s - seg * e;
    return seg === 0 ? [x0 + u, z0, 1, 0] : seg === 1 ? [x1, z0 + u, 0, 1] : seg === 2 ? [x1 - u, z1, -1, 0] : [x0, z1 - u, 0, -1]; }
  respawn(from) {
    for (let k = 0; k < 20; k++) { this.bi = Math.random() * N | 0; this.bj = Math.random() * N | 0; this.s = Math.random() * 4 * (BLK - 3.2); const p = this.perim(this.s); if (!from || Math.hypot(p[0] - from.x, p[1] - from.z) > 45) break; }
    this.dir = Math.random() < 0.5 ? -1 : 1; this.speed = 1.1 + Math.random() * 0.8; this.state = 'walk'; this.t = 0; this.mesh.rotation.x = 0; this.mesh.visible = true; this.pos(0);
  }
  pos(dt) { const p = this.perim(this.s); this.x = p[0]; this.z = p[1]; this.y = 0; this.mesh.position.set(p[0], 0, p[1]); this.mesh.rotation.y = Math.atan2(p[2] * this.dir, p[3] * this.dir); }
  update(dt, vehicles, player, onHit) {
    if (this.state === 'walk') {
      this.s += this.dir * this.speed * dt; this.pos(dt); animHuman(this.mesh, this.speed, dt);
      for (const v of vehicles) { const sp = v.speed; if (sp < 2.5 || Math.abs(v.x - this.x) > 6 || Math.abs(v.z - this.z) > 6) continue; const sn = Math.sin(v.yaw), cs = Math.cos(v.yaw);
        for (const o of v.offs) if (Math.hypot(v.x + sn * o - this.x, v.z + cs * o - this.z) < v.r + 0.4) { this.state = 'fly'; this.t = 0; this.fx = v.vx * 0.55; this.fz = v.vz * 0.55; this.vy = 3.2 + Math.min(3, sp * 0.15); onHit && onHit(v, this); return; } }
    } else {
      this.t += dt; this.vy -= 12 * dt; this.y = Math.max(0, this.y + this.vy * dt); this.x += this.fx * dt * (this.y > 0 ? 1 : 0.2); this.z += this.fz * dt * (this.y > 0 ? 1 : 0.2); this.fx *= 0.97; this.fz *= 0.97;
      this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.x = -Math.min(1.45, this.t * 4);
      if (this.t > 2.2) this.mesh.visible = false; if (this.t > 3.2) this.respawn(player);
    }
  }
}

/* ------------------------------ tài xế AI (dân thường) ------------------------------ */
function edge(a, b, off) { const ax = roadC(a[0]), az = roadC(a[1]), bx = roadC(b[0]), bz = roadC(b[1]), len = Math.hypot(bx - ax, bz - az), d = [(bx - ax) / len, (bz - az) / len], r = [-d[1], d[0]];
  return { a, b, off, d, len, A: [ax + r[0] * off, az + r[1] * off] }; }
export function snapEdge(v, city) {
  const i = Math.max(0, Math.min(N, Math.round((v.x + HALF) / CELL))), j = Math.max(0, Math.min(N, Math.round((v.z + HALF) / CELL))), dxr = Math.abs(v.x - roadC(i)), dzr = Math.abs(v.z - roadC(j)), s = Math.sin(v.yaw), c = Math.cos(v.yaw); let a, b;
  if (dxr < dzr) { const jf = (v.z + HALF) / CELL; if (c >= 0) { const j0 = Math.min(N - 1, Math.floor(jf)); a = [i, j0]; b = [i, j0 + 1]; } else { const j0 = Math.max(1, Math.ceil(jf)); a = [i, j0]; b = [i, j0 - 1]; } }
  else { const if_ = (v.x + HALF) / CELL; if (s >= 0) { const i0 = Math.min(N - 1, Math.floor(if_)); a = [i0, j]; b = [i0 + 1, j]; } else { const i0 = Math.max(1, Math.ceil(if_)); a = [i0, j]; b = [i0 - 1, j]; } }
  v.ai = v.ai || {}; v.ai.e = edge(a, b, LANES[Math.random() * 2 | 0]); v.ai.n = null;
}
function pickNext(ai, city) {
  const e = ai.e, opts = city.neighbors(e.b[0], e.b[1]).filter(n => !(n[0] === e.a[0] && n[1] === e.a[1])); const n = opts.length ? opts[Math.random() * opts.length | 0] : e.a;
  const d2 = [Math.sign(roadC(n[0]) - roadC(e.b[0])), Math.sign(roadC(n[1]) - roadC(e.b[1]))], cross = e.d[0] * d2[1] - e.d[1] * d2[0]; // >0 rẽ phải? (hệ x-z) kiểm bằng right vector
  const dotR = d2[0] * -e.d[1] + d2[1] * e.d[0]; // thành phần theo "phải" của hướng cũ
  ai.n = edge(e.b, n, dotR > 0.5 ? LANES[1] : dotR < -0.5 ? LANES[0] : LANES[Math.random() * 2 | 0]);
}
export function driveAI(v, dt, city, vehicles) {
  const ai = v.ai; if (!ai || !ai.e) return snapEdge(v, city); const I = v.input;
  let e = ai.e, t = (v.x - e.A[0]) * e.d[0] + (v.z - e.A[1]) * e.d[1]; const lerr = (v.x - e.A[0]) * -e.d[1] + (v.z - e.A[1]) * e.d[0];
  if (Math.abs(lerr) > 16 || t < -20) { snapEdge(v, city); e = ai.e; t = (v.x - e.A[0]) * e.d[0] + (v.z - e.A[1]) * e.d[1]; }
  const look = 7 + v.speed * 0.45; if (!ai.n && t > e.len - look - 14) pickNext(ai, city);
  if (t >= e.len && ai.n) { ai.e = ai.n; ai.n = null; e = ai.e; t = (v.x - e.A[0]) * e.d[0] + (v.z - e.A[1]) * e.d[1]; }
  const tt = t + look; let tx, tz; if (tt <= e.len || !ai.n) { tx = e.A[0] + e.d[0] * tt; tz = e.A[1] + e.d[1] * tt; } else { const rem = tt - e.len; tx = ai.n.A[0] + ai.n.d[0] * rem; tz = ai.n.A[1] + ai.n.d[1] * rem; }
  const err = wrap(Math.atan2(tx - v.x, tz - v.z) - v.yaw); let want = ai.speed || 10;
  const toNode = e.len - t; if (toNode < 24 && ai.n) { const turn = Math.abs(e.d[0] * ai.n.d[0] + e.d[1] * ai.n.d[1]); if (turn < 0.5) want = Math.min(want, 5.5); } else if (toNode < 16) want = Math.min(want, 8);
  const s = Math.sin(v.yaw), c = Math.cos(v.yaw), vf = v.vf;
  for (const o of vehicles) { if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; if (Math.abs(dx) > 22 || Math.abs(dz) > 22) continue; const fwd = dx * s + dz * c; if (fwd < 0 || fwd > 20) continue; const lat = Math.abs(dx * -c + dz * s); if (lat > 2.6) continue; want = Math.min(want, Math.max(0, (fwd - 5.5) * 0.9)); }
  I.str = clamp(-err * 1.9, -1, 1); const de = want - vf; I.thr = clamp(de * 0.35, -1, 1) > 0 ? clamp(de * 0.35, 0, 1) : 0; I.brk = de < -1 ? clamp(-de * 0.18, 0, 1) : 0; I.hand = 0;
  if (v.speed < 0.7 && want > 3) { ai.stuck = (ai.stuck || 0) + dt; if (ai.stuck > 3) { ai.rev = 1.2; ai.stuck = 0; } } else ai.stuck = 0;
  if (ai.rev > 0) { ai.rev -= dt; I.thr = -0.8; I.brk = 0; I.str = -I.str; }
}

/* ------------------------------ cảnh sát ------------------------------ */
export function policeAI(v, dt, city, target, mode = 'chase') {
  const ai = v.ai || (v.ai = { t: 0, path: null, stuck: 0 }), I = v.input; ai.t -= dt;
  const dist = Math.hypot(target.x - v.x, target.z - v.z);
  if (ai.t <= 0) { ai.t = 0.4; const direct = dist < 70 && city.lineClear(v.x, v.z, target.x, target.z); if (direct) ai.tg = [target.x, target.z]; else { const path = city.route(city.nearestNode(v.x, v.z), city.nearestNode(target.x, target.z)); let k = 0; if (path.length > 1) { const p0 = city.node(...path[0]); if (Math.hypot(p0[0] - v.x, p0[1] - v.z) < 16 || ((p0[0] - v.x) * Math.sin(v.yaw) + (p0[1] - v.z) * Math.cos(v.yaw)) < 0) k = 1; } ai.tg = city.node(...path[Math.min(k, path.length - 1)]); } }
  const tg = ai.tg || [target.x, target.z], err = wrap(Math.atan2(tg[0] - v.x, tg[1] - v.z) - v.yaw), vf = v.vf;
  let want = clamp(44 - Math.abs(err) * 28, 9, 44); if (dist < 14) want = Math.min(want, 12); if (mode === 'hold' && dist < 9) want = 0;
  I.str = clamp(-err * 2.2, -1, 1); const de = want - vf; I.thr = de > 0 ? clamp(de * 0.4, 0, 1) : 0; I.brk = de < -2 ? clamp(-de * 0.12, 0, 1) : 0; I.hand = Math.abs(err) > 1.3 && vf > 14 ? 1 : 0;
  if (v.speed < 1 && want > 3) { ai.stuck += dt; if (ai.stuck > 1.2) { ai.rev = 1; ai.stuck = 0; } } else ai.stuck = 0;
  if (ai.rev > 0) { ai.rev -= dt; I.thr = -1; I.brk = 0; I.str = -I.str; I.hand = 0; }
}
