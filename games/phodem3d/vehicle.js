// Phố Đêm 3D · xe cộ: mô hình dựng bằng code (thân, cabin kính, bánh xe quay/đánh lái, đèn, còi cảnh sát),
// vật lý arcade (động cơ, phanh, ma sát ngang, phanh tay → drift, trọng tâm nghiêng) và va chạm xe-xe.
import * as THREE from 'three';
import { HALF } from './city.js';

export const TYPES = {
  hatch: { name: 'Xe nhỏ', len: 3.9, wid: 1.74, accel: 15, max: 36, rev: 9, brake: 34, steer: 0.62, grip: 7.5, cab: 0.55, mass: 1 },
  sedan: { name: 'Sedan', len: 4.6, wid: 1.84, accel: 14, max: 42, rev: 9, brake: 34, steer: 0.58, grip: 7, cab: 0.52, mass: 1.2 },
  sport: { name: 'Xe thể thao', len: 4.4, wid: 1.92, accel: 24, max: 56, rev: 10, brake: 42, steer: 0.55, grip: 9, cab: 0.42, mass: 1.1, low: true },
  van: { name: 'Xe tải nhỏ', len: 5.2, wid: 2.0, accel: 10, max: 31, rev: 8, brake: 28, steer: 0.5, grip: 6, cab: 1.0, mass: 1.8, van: true },
  taxi: { name: 'Taxi', len: 4.5, wid: 1.8, accel: 14, max: 40, rev: 9, brake: 34, steer: 0.58, grip: 7, cab: 0.52, mass: 1.15, taxi: true },
  police: { name: 'Xe cảnh sát', len: 4.7, wid: 1.9, accel: 20, max: 50, rev: 10, brake: 40, steer: 0.58, grip: 8.5, cab: 0.52, mass: 1.3, police: true },
};
const matCache = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.42, metalness: 0.12 }, o))); return matCache.get(k); };
export const lightMats = { head: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c8, emissiveIntensity: 0.3 }), tail: new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1010, emissiveIntensity: 0.4 }), brake: new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1010, emissiveIntensity: 0.4 }), red: new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false }), blue: new THREE.MeshBasicMaterial({ color: 0x2060ff, toneMapped: false }), off: new THREE.MeshStandardMaterial({ color: 0x151515 }) };
const glass = new THREE.MeshStandardMaterial({ color: 0x141b24, roughness: 0.12, metalness: 0.8 });
const dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.8, metalness: 0.2 });
const tyre = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.9 }), hub = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.9 });
const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16).rotateZ(Math.PI / 2), hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 10).rotateZ(Math.PI / 2);

function tapered(w, h, l, tx, tz, zs = 0) { const g = new THREE.BoxGeometry(w, h, l), p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * tx); p.setZ(i, p.getZ(i) * tz + zs); } g.computeVertexNormals(); return g; }
const add = (g, geo, m, x, y, z, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; g.add(o); return o; };

export function buildCar(type, color) {
  const T = TYPES[type], g = new THREE.Group(), body = mat(color), W = T.wid, L = T.len, ground = T.low ? 0.32 : 0.4;
  const bodyH = T.van ? 1.25 : 0.55;
  add(g, new THREE.BoxGeometry(W, bodyH, L), body, 0, ground + bodyH / 2 + 0.05, 0);
  const top = ground + bodyH + 0.05;
  if (T.van) { add(g, new THREE.BoxGeometry(W * 0.96, 0.7, L * 0.34), glass, 0, top + 0.35, L * 0.28); add(g, new THREE.BoxGeometry(W * 0.98, 0.9, L * 0.62), body, 0, top + 0.45, -L * 0.16); }
  else {
    const cabH = T.low ? 0.42 : 0.55; add(g, tapered(W * 0.94, cabH, L * 0.54, 0.8, 0.66, -L * 0.04), glass, 0, top + cabH / 2, -L * 0.04).position.y = top + cabH / 2;
    add(g, new THREE.BoxGeometry(W * 0.94 * 0.8, 0.06, L * 0.54 * 0.66), body, 0, top + cabH + 0.03, -L * 0.04);
    if (T.low) add(g, new THREE.BoxGeometry(W * 0.9, 0.06, 0.45), body, 0, top + 0.28, -L * 0.5 + 0.1); // cánh gió
  }
  add(g, new THREE.BoxGeometry(W * 1.02, 0.2, 0.25), dark, 0, ground + 0.22, L / 2 - 0.05); add(g, new THREE.BoxGeometry(W * 1.02, 0.2, 0.25), dark, 0, ground + 0.22, -L / 2 + 0.05);
  const hy = ground + 0.45; for (const s of [-1, 1]) { add(g, new THREE.BoxGeometry(0.36, 0.14, 0.06), lightMats.head, s * (W / 2 - 0.3), hy, L / 2 + 0.01, false); add(g, new THREE.BoxGeometry(0.34, 0.14, 0.06), lightMats.tail, s * (W / 2 - 0.3), hy, -L / 2 - 0.01, false); }
  g.userData.wheels = [];
  for (const [sx, sz, front] of [[-1, 1, 1], [1, 1, 1], [-1, -1, 0], [1, -1, 0]]) {
    const piv = new THREE.Group(); piv.position.set(sx * (W / 2 - 0.12), 0.34, sz * L * 0.31); const spin = new THREE.Group(); piv.add(spin);
    const t = new THREE.Mesh(wheelGeo, tyre); t.castShadow = true; spin.add(t); const h = new THREE.Mesh(hubGeo, hub); h.position.x = sx * 0.01; spin.add(h); g.add(piv); g.userData.wheels.push({ piv, spin, front });
  }
  if (T.police) {
    add(g, new THREE.BoxGeometry(W * 0.96, 0.08, L * 0.12), dark, 0, top + 0.7, -L * 0.04);
    g.userData.bar = [add(g, new THREE.BoxGeometry(0.5, 0.14, 0.2), lightMats.red, -0.35, top + 0.8, -L * 0.04, false), add(g, new THREE.BoxGeometry(0.5, 0.14, 0.2), lightMats.blue, 0.35, top + 0.8, -L * 0.04, false)];
    add(g, new THREE.BoxGeometry(W * 1.005, 0.2, L * 0.34), dark, 0, ground + 0.62, L * 0.0, false).scale.set(1, 1, 1);
  }
  if (T.taxi) add(g, new THREE.BoxGeometry(0.7, 0.2, 0.3), new THREE.MeshStandardMaterial({ color: 0xffd04a, emissive: 0xffa800, emissiveIntensity: 1 }), 0, top + 0.82, -L * 0.04);
  g.rotation.order = 'YXZ'; return g;
}

export class Vehicle {
  constructor(type, color) {
    this.type = type; this.T = TYPES[type]; this.mesh = buildCar(type, color); this.color = color;
    this.x = 0; this.z = 0; this.yaw = 0; this.vx = 0; this.vz = 0; this.yawRate = 0; this.steer = 0; this.wheelRot = 0; this.roll = 0; this.pitch = 0; this.vfPrev = 0;
    this.input = { thr: 0, brk: 0, str: 0, hand: 0 }; this.driver = null; this.ai = null; this.slip = 0; this.hp = 100; this.flash = 0;
    this.offs = [-this.T.len * 0.3, 0, this.T.len * 0.3]; this.r = this.T.wid * 0.5; this.light = 0;
  }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get vf() { return this.vx * Math.sin(this.yaw) + this.vz * Math.cos(this.yaw); }
  place(x, z, yaw) { this.x = x; this.z = z; this.yaw = yaw; this.vx = this.vz = this.yawRate = 0; this.sync(0); }
  step(dt, city) {
    const T = this.T, I = this.input; let s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    let vf = this.vx * s + this.vz * c, vl = this.vx * -c + this.vz * s; const vf0 = vf;
    if (I.thr > 0) { if (vf < -0.5) vf += T.brake * 0.8 * dt * I.thr; else vf += T.accel * I.thr * (1 - Math.min(1, Math.max(0, vf) / T.max) ** 2) * dt; }
    else if (I.thr < 0) { if (vf > 0.5) vf -= T.brake * 0.8 * dt * -I.thr; else if (vf > -T.rev) vf += T.accel * 0.6 * I.thr * dt; }
    if (I.brk > 0) { const d = Math.min(Math.abs(vf), T.brake * I.brk * dt); vf -= Math.sign(vf) * d; }
    vf -= vf * 0.07 * dt + Math.sign(vf) * Math.min(Math.abs(vf), 0.7 * dt);
    const hand = I.hand > 0; let grip = T.grip * (hand ? 0.2 : 1); grip *= 1 - 0.32 * Math.min(1, Math.abs(vf) / T.max) * Math.abs(this.steer / T.steer);
    this.slip = Math.min(1, Math.abs(vl) / 6); vl *= Math.exp(-grip * dt); if (hand) vf *= Math.exp(-0.7 * dt);
    const target = I.str * T.steer / (1 + Math.abs(vf) * 0.05); this.steer += (target - this.steer) * Math.min(1, dt * 9);
    const wb = T.len * 0.6, yr = -(vf / wb) * Math.tan(this.steer) * (hand ? 1.45 : 1);
    this.yawRate += (yr - this.yawRate) * Math.min(1, dt * 10); this.yaw += this.yawRate * dt;
    s = Math.sin(this.yaw); c = Math.cos(this.yaw); this.vx = s * vf + -c * vl; this.vz = c * vf + s * vl; this.x += this.vx * dt; this.z += this.vz * dt;
    let impact = 0;
    for (const o of this.offs) {
      const hit = city.push(this.x + s * o, this.z + c * o, this.r); if (!hit) continue;
      this.x += hit.px; this.z += hit.pz; const vn = this.vx * hit.nx + this.vz * hit.nz;
      if (vn < 0) { impact = Math.max(impact, -vn); this.vx -= 1.3 * vn * hit.nx; this.vz -= 1.3 * vn * hit.nz; this.vx *= 0.93; this.vz *= 0.93; this.yawRate *= 0.7; }
    }
    const lim = HALF + 40; if (Math.abs(this.x) > lim) { this.x = Math.sign(this.x) * lim; this.vx *= -0.3; } if (Math.abs(this.z) > lim) { this.z = Math.sign(this.z) * lim; this.vz *= -0.3; }
    this.accel = (vf - vf0) / Math.max(dt, 1e-3); this.sync(dt, vf); return impact;
  }
  sync(dt, vf = 0) {
    const m = this.mesh; m.position.set(this.x, 0, this.z); m.rotation.y = this.yaw;
    const k = Math.min(1, dt * 6); this.roll += (THREE.MathUtils.clamp(this.yawRate * vf * 0.0045, -0.08, 0.08) - this.roll) * k; this.pitch += (THREE.MathUtils.clamp(-(this.accel || 0) * 0.004, -0.05, 0.05) - this.pitch) * k;
    m.rotation.z = this.roll; m.rotation.x = this.pitch; this.wheelRot += vf * dt / 0.34;
    for (const w of m.userData.wheels) { w.spin.rotation.x = this.wheelRot; if (w.front) w.piv.rotation.y = -this.steer * 0.9; }
    if (m.userData.bar && this.siren) { this.flash += dt * 8; const a = Math.sin(this.flash) > 0; m.userData.bar[0].material = a ? lightMats.red : lightMats.off; m.userData.bar[1].material = a ? lightMats.off : lightMats.blue; } else if (m.userData.bar) { m.userData.bar[0].material = m.userData.bar[1].material = lightMats.off; }
  }
}

/* va chạm xe-xe: 3 hình tròn mỗi xe, xung lượng theo khối lượng. Trả về va chạm mạnh nhất (cho âm thanh/độ nóng). */
export function collideCars(list, onHit) {
  for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
    const A = list[a], B = list[b]; if (Math.abs(A.x - B.x) > 7 || Math.abs(A.z - B.z) > 7) continue;
    const sa = Math.sin(A.yaw), ca = Math.cos(A.yaw), sb = Math.sin(B.yaw), cb = Math.cos(B.yaw); let done = false;
    for (const oa of A.offs) { if (done) break; for (const ob of B.offs) {
      const ax = A.x + sa * oa, az = A.z + ca * oa, bx = B.x + sb * ob, bz = B.z + cb * ob, dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz), rr = A.r + B.r;
      if (d >= rr || d < 1e-6) continue; const nx = dx / d, nz = dz / d, pen = rr - d, ma = A.T.mass, mb = B.T.mass, tot = ma + mb;
      A.x -= nx * pen * mb / tot; A.z -= nz * pen * mb / tot; B.x += nx * pen * ma / tot; B.z += nz * pen * ma / tot;
      const rv = (B.vx - A.vx) * nx + (B.vz - A.vz) * nz; if (rv < 0) { const j = -(1.35) * rv / (1 / ma + 1 / mb); A.vx -= j * nx / ma; A.vz -= j * nz / ma; B.vx += j * nx / mb; B.vz += j * nz / mb; A.yawRate += (nz * 0.1) * -rv * 0.05; B.yawRate -= nz * 0.1 * -rv * 0.05; if (onHit) onHit(A, B, -rv); }
      done = true; break;
    } }
  }
}
