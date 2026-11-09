// Thế giới Quảng trường Lâm Viên (cách điệu): nền lát đá, bông hoa dã quỳ khổng lồ, vòng tròn bạc, quả cầu xanh, đài phun nước,
// bậc thang, biệt thự trắng mái đỏ, rừng thông, luống hoa, quầy NPC, khinh khí cầu, đám đông.
import * as THREE from 'three';
import { COL, plain, box, cyl, bld, hipRoof, canvasTex, signMesh, emojiMesh, addRect, addCircle, collide } from '../saigon3d/util.js';
import { LAND, NPC_STALLS, MARKET, BOUNDS, PLOTS } from './data.js';
import { makeStall } from './stall.js';

let sd = 4242; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
export function buildWorld(scene) {
  const W = { beacons: {}, balloons: [], stalls: {} };
  const D = new THREE.Object3D(), C = new THREE.Color();
  // ---------- trời + ánh sáng ----------
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x6f8a55, .75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.15); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0008; const sc = sun.shadow.camera; sc.left = -48; sc.right = 48; sc.top = 48; sc.bottom = -48; sc.near = 10; sc.far = 260; scene.add(sun, sun.target);
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color('#4f93dc') }, hor: { value: new THREE.Color('#cfe6fb') } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top;uniform vec3 hor;varying vec3 vP;void main(){float h=clamp(vP.y,0.,1.);gl_FragColor=vec4(mix(hor,top,pow(h,.55)),1.);}' });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 16, 10), skyMat); sky.renderOrder = -10; scene.add(sky);
  scene.fog = new THREE.Fog(0xcfe6fb, 160, 700);
  const clouds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff', fog: false, transparent: true, opacity: .95 }), 60), cl = [];
  for (let i = 0; i < 15; i++) cl.push({ x: R() * 1000 - 500, y: 120 + R() * 60, z: -R() * 450 + 60, s: 18 + R() * 18, v: 1 + R() * 2 }); scene.add(clouds);
  const WX = { sun: ['#4f93dc', '#cfe6fb', 1.15, 160, 700], mist: ['#8fa6b8', '#dfe6ea', .7, 35, 260], rain: ['#6f8296', '#b7c3cc', .55, 55, 330] };
  W.setWeather = id => { const w = WX[id] || WX.sun; skyMat.uniforms.top.value.set(w[0]); skyMat.uniforms.hor.value.set(w[1]); scene.fog.color.set(w[1]); sun.intensity = w[2]; scene.fog.near = w[3]; scene.fog.far = w[4]; hemi.intensity = .55 + w[2] * .2; };
  // ---------- mặt đất ----------
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1400), plain('#6fa04c')); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
  const slab = canvasTex('slab', 256, 256, (g, w, h) => { g.fillStyle = '#c9c2b6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = ['#cfc8bc', '#c2baad', '#d3ccc0'][(i * 3 + j * 5) % 3]; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } });
  slab.repeat.set(30, 24); const plaza = new THREE.Mesh(new THREE.PlaneGeometry(190, 152), new THREE.MeshLambertMaterial({ map: slab })); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, .02, 14); plaza.receiveShadow = true; scene.add(plaza);
  const stepsT = canvasTex('steps', 256, 128, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#8e8a85' : '#a7a29b'; g.fillRect(0, i * 16, w, 16); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, i * 16 + 13, w, 3); } });
  const steps = new THREE.Mesh(new THREE.PlaneGeometry(56, 16), new THREE.MeshLambertMaterial({ map: stepsT })); steps.rotation.x = -Math.PI / 2; steps.position.set(0, .05, 11); scene.add(steps);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 190), plain('#4a4d52')); road.rotation.x = -Math.PI / 2; road.position.set(105, .03, 14); scene.add(road);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(.4, 190), plain('#e8e2c0')); lane.rotation.x = -Math.PI / 2; lane.position.set(105, .04, 14); scene.add(lane);
  // ---------- núi xa ----------
  const hills = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshLambertMaterial({ color: '#6f8aa8' }), 26);
  for (let i = 0; i < 26; i++) { const a = -Math.PI * .95 + i / 25 * Math.PI * .9, r = 420 + R() * 60, h = 70 + R() * 90; D.position.set(Math.sin(a) * r + 20, h / 2 - 5, -Math.cos(a) * r * .9 - 40); D.rotation.set(0, R() * 3, 0); D.scale.set(h * 1.9, h, h * 1.9); D.updateMatrix(); hills.setMatrixAt(i, D.matrix); } scene.add(hills);
  // ---------- công trình biểu tượng ----------
  const L = Object.fromEntries(LAND.map(l => [l.id, l]));
  { // hoa dã quỳ: mái vòm vàng có múi + mắt kính xanh
    const l = L.dome, g = new THREE.Group(); g.position.set(l.x, 0, l.z); scene.add(g);
    const petal = canvasTex('petal', 512, 128, (c, w, h) => { for (let i = 0; i < 12; i++) { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f6c433'); gr.addColorStop(1, '#d99a14'); c.fillStyle = gr; c.fillRect(i * w / 12, 0, w / 12, h); c.fillStyle = 'rgba(120,70,0,.5)'; c.fillRect(i * w / 12, 0, 3, h); } });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(14, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .62, 1), new THREE.MeshLambertMaterial({ map: petal })); dome.castShadow = dome.receiveShadow = true; g.add(dome);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(4.6, 28), new THREE.MeshBasicMaterial({ color: '#35c8e8' })); eye.rotation.x = -Math.PI / 2; eye.position.y = 8.5; g.add(eye);
    cyl(g, 15.2, 15.2, 1.2, 0, 0, 0, '#2e4a5a', 36); const fl = cyl(g, 17, 17, .4, 0, 0, 0, '#d84a6a', 36); fl.material = plain('#5aa23c'); addCircle(l.x, l.z, 15.5);
  }
  { // vòng tròn bạc
    const l = L.ring, ring = new THREE.Mesh(new THREE.TorusGeometry(11, .9, 14, 48), new THREE.MeshPhongMaterial({ color: '#d7dde3', shininess: 90, specular: '#ffffff' })); ring.position.set(l.x, 12.2, l.z); ring.castShadow = true; scene.add(ring);
    const inner = ring.clone(); inner.scale.set(.93, .93, .5); inner.rotation.y = .5; scene.add(inner); inner.position.copy(ring.position); box(scene, 5, .8, 2.4, l.x, 0, l.z, '#8a8f95'); addCircle(l.x - 10, l.z, 1.4); addCircle(l.x + 10, l.z, 1.4);
  }
  { // quả cầu xanh sọc
    const l = L.ball, t = canvasTex('ballT', 256, 64, (c, w, h) => { for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#1f7a3a' : '#7cc24a'; c.fillRect(0, i * h / 10, w, h / 10 + 1); } });
    t.repeat.set(1, 1); const m = new THREE.Mesh(new THREE.SphereGeometry(9.2, 32, 20), new THREE.MeshLambertMaterial({ map: t })); m.position.set(l.x, 9.4, l.z); m.castShadow = true; scene.add(m);
    cyl(scene, 6, 7, .8, l.x, 0, l.z, '#9a9a92', 20); addCircle(l.x, l.z, 8.8);
  }
  { // đài phun nước
    const l = L.fount; cyl(scene, 8.2, 8.2, .6, l.x, 0, l.z, '#d8d2c6', 36); const wt = new THREE.Mesh(new THREE.CircleGeometry(7.4, 32), new THREE.MeshLambertMaterial({ color: '#3aa3d8', emissive: '#12506e' })); wt.rotation.x = -Math.PI / 2; wt.position.set(l.x, .62, l.z); scene.add(wt);
    W.jets = []; for (let i = 0; i < 7; i++) { const a = i / 6 * 6.283, rr = i ? 3.4 : 0, j = new THREE.Mesh(new THREE.CylinderGeometry(.12, .3, 1, 6), new THREE.MeshBasicMaterial({ color: '#dff6ff', transparent: true, opacity: .7 })); j.position.set(l.x + Math.cos(a) * rr, 1.2, l.z + Math.sin(a) * rr); j.userData.ph = i; scene.add(j); W.jets.push(j); } addCircle(l.x, l.z, 8.5);
  }
  // ---------- biệt thự trắng mái đỏ quanh quảng trường ----------
  const villa = (x, z, w, h, d, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); bld(g, w, h, d, 0, 0, 0, { base: R() < .3 ? '#cfe3d4' : '#f5f2ea', win: '#5a7fa0', frame: '#fff', roof: '#b04a35', fh: 3.4, sp: 4.4, lit: 0, shutter: '#6a8f7a' }); hipRoof(g, w, d, 3.2 + R() * 1.4, '#b8462f', 0, h, 0); const c = Math.cos(ry), s = Math.sin(ry), hx = Math.abs(w * c) + Math.abs(d * s), hz = Math.abs(w * s) + Math.abs(d * c); addRect(x - hx / 2, x + hx / 2, z - hz / 2, z + hz / 2); };
  for (let i = 0; i < 13; i++) villa(-90 + i * 15 + R() * 3, -70 - R() * 7, 11 + R() * 4, 8 + R() * 5, 10 + R() * 3, R() * .2 - .1);
  for (let i = 0; i < 6; i++) { villa(-112 - R() * 8, -50 + i * 22, 12, 8 + R() * 4, 11, Math.PI / 2 + R() * .15); }
  for (let i = 0; i < 4; i++) villa(126, -40 + i * 28, 12, 9 + R() * 5, 12, -Math.PI / 2);
  // ---------- rừng thông ----------
  const PN = 330, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.25, .35, 3, 6), plain('#5a3b24'), PN), cones = [0, 1, 2].map(k => new THREE.InstancedMesh(new THREE.ConeGeometry(2.6 - k * .6, 3.4, 8), plain(['#2c6a3a', '#337a42', '#3d8a4c'][k]), PN)); let pi = 0;
  const pine = (x, z, s) => { if (pi >= PN) return; D.rotation.set(0, R() * 6, 0); D.scale.set(s, s, s); D.position.set(x, 1.5 * s, z); D.updateMatrix(); trunk.setMatrixAt(pi, D.matrix); cones.forEach((c, k) => { D.position.set(x, (3.2 + k * 2.3) * s, z); D.updateMatrix(); c.setMatrixAt(pi, D.matrix); }); pi++; };
  for (let i = 0; i < 240; i++) { const x = (R() - .5) * 360, z = -50 - R() * 130; if (z > -62 && Math.abs(x) < 100) continue; pine(x, z, .9 + R() * .9); }
  for (let i = 0; i < 40; i++) { const x = i < 20 ? -100 - R() * 10 : 96 + R() * 8, z = -60 + R() * 150; pine(x, z, 1 + R() * .7); addCircle(x, z, .6); }
  for (let i = 0; i < 24; i++) { const x = -90 + R() * 180, z = -52 + (R() < .5 ? 0 : 1) * 2 + R() * 3; pine(x, z, 1 + R() * .5); addCircle(x, z, .7); }
  [trunk, ...cones].forEach(m => { m.count = pi; m.castShadow = true; scene.add(m); });
  // ---------- luống hoa + đèn + ghế ----------
  const FP = [[-50, -2], [-34, 6], [-8, -4], [14, 8], [36, -2], [58, 6], [-70, 6], [78, 8], [-64, -12], [70, -14], [-82, 40], [84, 44]];
  const FN = FP.length * 40, fl = new THREE.InstancedMesh(new THREE.SphereGeometry(.28, 6, 5), new THREE.MeshLambertMaterial({ color: '#fff' }), FN); let fi = 0; const FC = ['#ff6fa8', '#ffd23f', '#ff7a3c', '#b57cff', '#ffffff', '#ff4d5e'];
  FP.forEach(([x, z]) => { const w = 7 + R() * 3, d = 4 + R() * 2; box(scene, w, .5, d, x, 0, z, '#9a948a'); box(scene, w - .6, .55, d - .6, x, 0, z, '#4f8c3a'); addRect(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
    for (let k = 0; k < 40; k++) { D.position.set(x + (R() - .5) * (w - 1), .75 + R() * .2, z + (R() - .5) * (d - 1)); D.rotation.set(0, 0, 0); D.scale.setScalar(1); D.updateMatrix(); fl.setMatrixAt(fi, D.matrix); fl.setColorAt(fi, C.set(FC[(R() * FC.length) | 0])); fi++; } });
  fl.instanceColor.needsUpdate = true; scene.add(fl);
  const lampM = new THREE.MeshLambertMaterial({ color: '#fff3c0', emissive: '#ffe08a', emissiveIntensity: .3 });
  for (let i = 0; i < 16; i++) { const x = -84 + i * 11.5, z = 4 + (i % 2) * 28; cyl(scene, .12, .16, 4.2, x, 0, z, '#2b2f33', 6); const b = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), lampM); b.position.set(x, 4.4, z); scene.add(b); addCircle(x, z, .3); }
  for (let i = 0; i < 10; i++) { const x = -62 + i * 13.5, z = 29 + (i % 3) * .4; box(scene, 2, .5, .6, x, .4, z, '#7a5a3a'); addRect(x - 1, x + 1, z - .3, z + .3); }
  // ---------- quầy NPC + chợ đầu mối ----------
  NPC_STALLS.forEach((s, i) => { const st = makeStall(i % 4 === 2 ? 2 : i % 2, s.n, s.ic, { lan: 1, hoa: i % 2 }); st.position.set(s.x, 0, s.z); st.rotation.y = Math.PI; scene.add(st); addRect(s.x - 2.4, s.x + 2.4, s.z - 1.6, s.z + 1.6); });
  { const m = new THREE.Group(); m.position.set(MARKET.x, 0, MARKET.z); scene.add(m); box(m, 9, .9, 3, 0, 0, 0, '#8a6a44'); box(m, 9, .2, 3.4, 0, 3.2, 0, '#e6c04a'); [-4.2, 4.2].forEach(x => cyl(m, .12, .12, 3.3, x, 0, 1.3, '#6a4a2a', 6));
    [['🍠', -3], ['🍓', -1], ['☕', 1], ['🥛', 3]].forEach(([e, x]) => { const s = emojiMesh(e, .55, '#fff5d6'); s.position.set(x, 1.5, 1.6); m.add(s); }); const sg = signMesh(MARKET.n, 7, 1.1, { bg: '#2f6b3a', fg: '#fff3c0', size: 52 }); sg.position.set(0, 4.2, 1.4); m.add(sg); addRect(MARKET.x - 4.6, MARKET.x + 4.6, MARKET.z - 1.7, MARKET.z + 1.7); }
  // ---------- ô quầy của người chơi (nền gạch + mũi tên) ----------
  PLOTS.forEach((p, i) => { const t = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshLambertMaterial({ color: '#b9b2a2' })); t.rotation.x = -Math.PI / 2; t.position.set(p.x, .04, p.z); scene.add(t); });
  // ---------- vòng sáng chỉ điểm ----------
  const ringG = new THREE.RingGeometry(2.4, 3.2, 28).rotateX(-Math.PI / 2);
  W.mark = (id, x, z, on = true, col = '#ffd23f') => { let b = W.beacons[id]; if (!b) { b = W.beacons[id] = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .8, depthWrite: false })); b.position.set(x, .12, z); scene.add(b); } b.visible = on; };
  // ---------- khinh khí cầu ----------
  [[-60, 70, -80, '#e8433c'], [30, 90, -120, '#f2b632']].forEach(([x, y, z, c], i) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(7, 14, 12).scale(1, 1.2, 1), new THREE.MeshLambertMaterial({ color: c })); g.add(m); const st = new THREE.Mesh(new THREE.SphereGeometry(7.05, 14, 12, 0, 1.2).scale(1, 1.2, 1), plain('#fff')); g.add(st); const bk = box(g, 2, 1.4, 2, 0, -12, 0, '#8a6a44'); g.position.set(x, y, z); scene.add(g); W.balloons.push({ g, y, ph: i * 2 }); });
  // ---------- đám đông đi dạo (chi phí thấp, dựng bằng InstancedMesh) ----------
  const NP = 40, body = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .2, 1, 6), new THREE.MeshLambertMaterial({ color: '#fff' }), NP), head = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 8, 6), new THREE.MeshLambertMaterial({ color: '#f0c9a4' }), NP), crowd = [];
  const SH = ['#e4572e', '#2e86ab', '#f2c14e', '#6b8f71', '#8e5ea2', '#ffffff', '#222a38', '#d1495b'];
  for (let i = 0; i < NP; i++) { crowd.push({ x: (R() - .5) * 140, z: -20 + R() * 55, tx: 0, tz: 0, sp: .8 + R() * .9, ph: R() * 6 }); crowd[i].tx = crowd[i].x; crowd[i].tz = crowd[i].z; body.setColorAt(i, C.set(SH[i % SH.length])); } body.instanceColor.needsUpdate = true; scene.add(body, head);
  W.update = (dt, t, focus) => {
    cl.forEach((c, i) => { c.x += c.v * dt; if (c.x > 520) c.x = -520; for (let k = 0; k < 4; k++) { D.position.set(c.x + (k - 1.5) * c.s * .7, c.y + (k % 2) * 4, c.z); D.scale.set(c.s * .8, c.s * .35, c.s * .6); D.rotation.set(0, 0, 0); D.updateMatrix(); clouds.setMatrixAt(i * 4 + k, D.matrix); } }); clouds.count = cl.length * 4; clouds.instanceMatrix.needsUpdate = true;
    W.jets.forEach(j => { const h = 2.2 + Math.sin(t * 2 + j.userData.ph) * .8 + (j.userData.ph ? 0 : 2.2); j.scale.set(1, h, 1); j.position.y = .6 + h / 2; });
    W.balloons.forEach(b => { b.g.position.y = b.y + Math.sin(t * .4 + b.ph) * 2; b.g.rotation.y = t * .05 + b.ph; });
    for (const k in W.beacons) { const b = W.beacons[k]; if (b.visible) { const s = 1 + Math.sin(t * 3) * .08; b.scale.set(s, 1, s); } }
    crowd.forEach((p, i) => { const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz); if (d < .6) { p.tx = (R() - .5) * 150; p.tz = -22 + R() * 70; if (Math.hypot(p.tx - 22, p.tz + 8) < 9) p.tx += 14; } else { p.x += dx / d * p.sp * dt; p.z += dz / d * p.sp * dt; }
      const bob = Math.abs(Math.sin(t * 6 + p.ph)) * .04; D.rotation.set(0, Math.atan2(dx, dz), 0); D.scale.set(1, 1, 1); D.position.set(p.x, .55 + bob, p.z); D.updateMatrix(); body.setMatrixAt(i, D.matrix); D.position.y = 1.32 + bob; D.updateMatrix(); head.setMatrixAt(i, D.matrix); }); body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
    if (focus) { sun.position.set(focus.x + 40, 90, focus.z + 30); sun.target.position.set(focus.x, 0, focus.z); sun.target.updateMatrixWorld(); }
  };
  W.setShadows = on => { sun.castShadow = on; };
  W.blockedAt = (x, z, r) => { for (const b of COL.rects) if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return true; return false; };
  W.collide = p => { collide(p, .45); p.x = Math.min(BOUNDS.x1, Math.max(BOUNDS.x0, p.x)); p.z = Math.min(BOUNDS.z1, Math.max(BOUNDS.z0, p.z)); };
  W.setWeather("sun"); sun.position.set(40, 90, 30); return W;
}
