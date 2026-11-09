// Quầy hàng dựng bằng code: 4 cấp (xe đẩy, lều mái sọc, quầy gỗ, tiệm nhỏ) + trang trí. Mặt trước hướng +z cục bộ.
import * as THREE from 'three';
import { box, cyl, hipRoof, gable, plain, canvasTex, signMesh, emojiMesh, bld } from '../saigon3d/util.js';
const stripe = (a, b) => canvasTex('str' + a + b, 128, 16, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 16, 0, 16, h); } });
const awning = (a, b) => { const t = stripe(a, b); return new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }); };
export function makeStall(tier, name, emoji, deco = {}) {
  const g = new THREE.Group(), WD = '#8a6238', AW = [['#e8433c', '#fff'], ['#2e86ab', '#fff'], ['#f2b632', '#fff'], ['#6b8f71', '#fff']][(name.length + tier) % 4];
  if (tier === 0) { // xe đẩy
    box(g, 2.6, 1, 1.5, 0, .55, 0, WD); box(g, 2.7, .12, 1.7, 0, 1.55, 0, '#d9c9a0'); [-1, 1].forEach(s => { const w = cyl(g, .45, .45, .15, s * 1.1, .45, .85, '#2a2a2a', 12); w.rotation.x = Math.PI / 2; });
    cyl(g, .06, .06, 2.6, 0, 1.6, -.4, '#555', 6); const um = new THREE.Mesh(new THREE.ConeGeometry(2.1, .9, 12, 1, true), awning(...AW)); um.position.set(0, 4.3, -.4); um.castShadow = true; g.add(um);
  } else if (tier === 1) { // lều
    [[-1.7, -1.1], [1.7, -1.1], [-1.7, 1.1], [1.7, 1.1]].forEach(([x, z]) => cyl(g, .07, .07, 2.9, x, 0, z, '#d8d8d8', 6)); const r = hipRoof(g, 4.2, 3.2, 1, '#fff', 0, 2.9, 0, 1); r.material = awning(...AW); box(g, 3.2, 1.1, 1, 0, 0, .4, WD); box(g, 3.4, .1, 1.2, 0, 1.1, .4, '#e2d2a8');
  } else if (tier === 2) { // quầy gỗ
    box(g, 4.4, 1.1, 1.6, 0, 0, .5, WD); box(g, 4.4, 2.6, .25, 0, 0, -1.1, '#6a4a2a'); [-2.1, 2.1].forEach(x => box(g, .2, 2.8, .2, x, 0, 1.2, '#5a3b24')); gable(g, 4.8, 3.2, 1, '#9a4a2a', 0, 2.8, .1, Math.PI / 2).scale.set(1, 1, 1);
    box(g, 4.6, .12, 1.8, 0, 1.1, .5, '#e2d2a8');
  } else { // tiệm nhỏ
    bld(g, 5.4, 3.6, 4, 0, 0, -.6, { base: '#f1e4c8', win: '#7a5a30', frame: '#fff', roof: '#9a4a2a', fh: 3.6, sp: 2.7, lit: 0 }); hipRoof(g, 5.4, 4, 1.8, '#9a4a2a', 0, 3.6, -.6); const a = new THREE.Mesh(new THREE.BoxGeometry(5.4, .12, 1.4), awning(...AW)); a.position.set(0, 2.9, 1.7); a.rotation.x = .25; g.add(a); box(g, 4.2, 1, .8, 0, 0, 1.5, WD);
  }
  const sg = signMesh(name, tier > 1 ? 3.6 : 2.6, .6, { bg: '#2f4a3a', fg: '#fff3c0', size: 40 }); sg.position.set(0, tier === 3 ? 4.6 : tier === 2 ? 3.9 : tier === 1 ? 3.6 : 5.2, tier === 3 ? 1.6 : .9); g.add(sg);
  if (emoji) { const e = emojiMesh(emoji, .45, '#fffbe8'); e.position.set(tier > 1 ? 2.5 : 1.8, 1.9, 1.05); e.userData.bubble = true; g.add(e); }
  if (deco.lan) [-1.4, 0, 1.4].forEach(x => { const l = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), new THREE.MeshLambertMaterial({ color: '#e8332c', emissive: '#a01510', emissiveIntensity: .6 })); l.position.set(x, tier === 0 ? 3.6 : 2.6, 1.2); g.add(l); });
  if (deco.hoa) [-1, 1].forEach(s => { cyl(g, .28, .2, .4, s * 2.2, 0, 1.4, '#b5652d', 8); [0, 1, 2].forEach(k => { const f = new THREE.Mesh(new THREE.SphereGeometry(.17, 6, 5), plain(['#ff6fa8', '#ffd23f', '#b57cff'][k])); f.position.set(s * 2.2 + (k - 1) * .16, .6 + k * .05, 1.4); g.add(f); }); });
  if (deco.ban) [-1.4, 1.4].forEach(x => { cyl(g, .5, .5, .06, x, .7, 2.9, '#e8dcc0', 10); cyl(g, .08, .08, .7, x, 0, 2.9, '#555', 6); [-.7, .7].forEach(s => cyl(g, .22, .22, .4, x + s, 0, 2.9, '#d84a3a', 8)); });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
