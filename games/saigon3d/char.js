// Nhân vật du khách dựng bằng code (low-poly, nhìn từ sau lưng như ảnh mẫu): ba lô, mũ, tóc, màu da/áo/quần tuỳ chỉnh.
// Hình học và vật liệu dùng chung giữa mọi nhân vật nên đông người chơi vẫn nhẹ.
import * as THREE from 'three';
export const SKINS = ['#f6d6b8', '#efc39a', '#d6a173', '#a8724a'];
export const TOPS = ['#ffffff', '#e4572e', '#2e86ab', '#f2c14e', '#6b8f71', '#8e5ea2'];
export const PANTS = ['#2f3a4a', '#c9b48f', '#5a6b7c', '#3a3a3a', '#a8714a'];
export const BAGS = ['#1f3a5f', '#e8a0a0', '#2b2b2b', '#6b8f71', '#c0392b'];
export const HAIRC = ['#1c1410', '#4a2f1e', '#8a5a2b'];
export const HATS = ['Không đội', 'Mũ lưỡi trai', 'Nón lá', 'Mũ tai bèo'];
export const HAIRS = ['Tóc ngắn', 'Đuôi ngựa', 'Tóc dài', 'Hai bím'];
export const DEF = { skin: 1, top: 0, pants: 0, hat: 1, bag: 0, hair: 0, hairC: 0 };
const KEYS = ['skin', 'top', 'pants', 'hat', 'bag', 'hair', 'hairC'], MAXV = [SKINS.length, TOPS.length, PANTS.length, HATS.length, BAGS.length, HAIRS.length, HAIRC.length];
export const encodeAv = av => KEYS.map(k => av[k] | 0).join(',');
export function decodeAv(s) { // nhận dữ liệu từ người khác: kẹp về khoảng hợp lệ
  const o = Object.assign({}, DEF); String(s || '').split(',').slice(0, KEYS.length).forEach((v, i) => { const n = parseInt(v, 10); o[KEYS[i]] = Number.isFinite(n) ? Math.min(MAXV[i] - 1, Math.max(0, n)) : DEF[KEYS[i]]; }); return o;
}
export const randomAv = () => { const o = {}; KEYS.forEach((k, i) => o[k] = Math.floor(Math.random() * MAXV[i])); return o; };

const MC = {}, GC = {};
const mat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return MC[k] || (MC[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c, flatShading: true }, o))); };
const geo = (k, f) => GC[k] || (GC[k] = f());

export function makeTraveler(avIn) {
  const av = Object.assign({}, DEF, avIn), g = new THREE.Group(), rig = {};
  const add = (par, gm, m, x, y, z) => { const me = new THREE.Mesh(gm, m); me.position.set(x, y, z); me.castShadow = true; par.add(me); return me; };
  const skin = mat(SKINS[av.skin]), top = mat(TOPS[av.top]), pants = mat(PANTS[av.pants]), bag = mat(BAGS[av.bag]), hairM = mat(HAIRC[av.hairC], { side: THREE.DoubleSide }), shoe = mat('#ececec'), dark = mat('#1c1410');
  const hips = new THREE.Group(); hips.position.y = .9; g.add(hips); rig.hips = hips;
  const leg = s => { const L = new THREE.Group(); L.position.set(s * .12, 0, 0); hips.add(L); add(L, geo('leg', () => new THREE.CylinderGeometry(.095, .08, .78, 7).translate(0, -.39, 0)), pants, 0, 0, 0); add(L, geo('shoe', () => new THREE.BoxGeometry(.15, .09, .26)), shoe, 0, -.83, .04); return L; };
  rig.L = leg(-1); rig.R = leg(1);
  const tor = new THREE.Group(); hips.add(tor); rig.tor = tor;
  add(tor, geo('torso', () => new THREE.BoxGeometry(.5, .62, .28)), top, 0, .34, 0);
  const arm = s => { const A = new THREE.Group(); A.position.set(s * .33, .6, 0); tor.add(A); add(A, geo('arm', () => new THREE.CylinderGeometry(.07, .06, .56, 6).translate(0, -.28, 0)), top, 0, 0, 0); add(A, geo('hand', () => new THREE.SphereGeometry(.065, 6, 5)), skin, 0, -.58, 0); return A; };
  rig.aL = arm(-1); rig.aR = arm(1);
  rig.phone = add(rig.aR, geo('phone', () => new THREE.BoxGeometry(.07, .13, .015)), dark, 0, -.6, .07); rig.phone.visible = false;
  const hd = new THREE.Group(); hd.position.set(0, .74, 0); tor.add(hd); rig.hd = hd;
  add(hd, geo('neck', () => new THREE.CylinderGeometry(.06, .07, .12, 6)), skin, 0, -.02, 0);
  add(hd, geo('head', () => new THREE.SphereGeometry(.19, 12, 10)), skin, 0, .17, 0);
  [-1, 1].forEach(s => add(hd, geo('eye', () => new THREE.SphereGeometry(.022, 6, 5)), dark, s * .075, .19, .175));
  add(hd, geo('smile', () => new THREE.TorusGeometry(.04, .008, 4, 8, Math.PI).rotateZ(Math.PI)), dark, 0, .115, .178);
  // tóc
  add(hd, geo('hairCap', () => new THREE.SphereGeometry(.205, 12, 8, 0, Math.PI * 2, 0, Math.PI * .56)), hairM, 0, .18, -.015);
  if (av.hair === 0) add(hd, geo('hBack', () => new THREE.SphereGeometry(.16, 8, 6).scale(1.1, .85, .8)), hairM, 0, .13, -.09);
  if (av.hair === 1) { add(hd, geo('hBun', () => new THREE.SphereGeometry(.085, 8, 6)), hairM, 0, .34, -.17); add(hd, geo('hTail', () => new THREE.CylinderGeometry(.045, .02, .34, 6).translate(0, -.17, 0)), hairM, 0, .27, -.2); }
  if (av.hair === 2) add(hd, geo('hLong', () => new THREE.BoxGeometry(.4, .52, .1)), hairM, 0, -.04, -.15);
  if (av.hair === 3) [-1, 1].forEach(s => { add(hd, geo('hBraid', () => new THREE.CylinderGeometry(.04, .03, .46, 6).translate(0, -.23, 0)), hairM, s * .14, .08, -.13); add(hd, geo('hBraidEnd', () => new THREE.SphereGeometry(.035, 6, 5)), mat('#e4572e'), s * .14, -.38, -.13); });
  // mũ
  if (av.hat === 1) { const hm = mat(BAGS[av.bag], { side: THREE.DoubleSide }); add(hd, geo('capDome', () => new THREE.SphereGeometry(.21, 12, 8, 0, Math.PI * 2, 0, Math.PI * .5)), hm, 0, .22, 0); add(hd, geo('capBrim', () => new THREE.CylinderGeometry(.2, .2, .02, 12, 1, false, -Math.PI / 2, Math.PI)), hm, 0, .225, .03); }
  if (av.hat === 2) add(hd, geo('conical', () => new THREE.ConeGeometry(.46, .24, 16, 1, true)), mat('#e6d3a1', { side: THREE.DoubleSide }), 0, .35, 0);
  if (av.hat === 3) { const hm = mat('#d8c9a0'); add(hd, geo('bkTop', () => new THREE.CylinderGeometry(.2, .21, .12, 12)), hm, 0, .3, 0); add(hd, geo('bkBrim', () => new THREE.CylinderGeometry(.34, .34, .02, 14)), hm, 0, .25, 0); }
  // ba lô trên lưng (thấy rõ khi nhìn từ phía sau)
  add(tor, geo('pack', () => new THREE.BoxGeometry(.4, .5, .2)), bag, 0, .36, -.24);
  add(tor, geo('packTop', () => new THREE.BoxGeometry(.3, .16, .12)), bag, 0, .22, -.36);
  g.scale.setScalar(.92); g.userData.rig = rig; return { g, rig, anim: new Anim(rig) };
}

// Hoạt hoạ: đi bộ + các cảm xúc (cử chỉ). update trả về độ nhấp nhô để nơi gọi cần thì dùng.
export class Anim {
  constructor(rig) { this.r = rig; this.v = { aLx: 0, aLz: .06, aRx: 0, aRz: -.06, hd: 0, bob: 0 }; this.ph = Math.random() * 6; }
  update(dt, t, speed, emote) {
    const r = this.r, v = this.v, w = Math.min(1, speed / 4), k = 1 - Math.exp(-dt * 10);
    this.ph += dt * (5.5 + speed * 1.1); const sw = Math.sin(this.ph) * .75 * w;
    r.L.rotation.x = sw; r.R.rotation.x = -sw;
    let T = { aLx: -sw * .8, aLz: .06, aRx: sw * .8, aRz: -.06, hd: 0, bob: Math.abs(Math.sin(this.ph)) * .045 * w };
    if (emote === 'wave') T = { aLx: 0, aLz: .06, aRx: -2.85, aRz: -.3, hd: .05, bob: 0 };
    else if (emote === 'cheer') T = { aLx: -2.9, aLz: .32, aRx: -2.9, aRz: -.32, hd: -.15, bob: Math.abs(Math.sin(t * 6)) * .12 };
    else if (emote === 'point') T = { aLx: 0, aLz: .06, aRx: -1.55, aRz: -.05, hd: 0, bob: 0 };
    else if (emote === 'selfie') T = { aLx: 0, aLz: .06, aRx: -1.4, aRz: -.28, hd: -.1, bob: 0 };
    for (const key in T) v[key] += (T[key] - v[key]) * k;
    r.aL.rotation.set(v.aLx, 0, v.aLz); r.aR.rotation.set(v.aRx, 0, v.aRz + (emote === 'wave' ? Math.sin(t * 9) * .35 : 0)); r.hd.rotation.x = v.hd;
    r.hips.position.y = .9 + v.bob; r.phone.visible = emote === 'selfie'; return v.bob;
  }
}
