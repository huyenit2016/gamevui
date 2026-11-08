// Thế giới: bầu trời ngày/đêm, mặt đất, sông, đường phố, cây, đèn, quầy ăn, xe máy, người đi bộ, thuyền, vòng sáng chỉ điểm.
import * as THREE from 'three';
import { LM, FOOD, ROADS, RW } from './data.js';
import { COL, winMats, canvasTex, plain, addCircle, emojiMesh, collide as colCollide } from './util.js';
import { buildPlaces } from './places.js';
import { TOPS, PANTS, BAGS, SKINS } from './char.js';

const KEYS = [ // giờ, trời trên, chân trời, cường độ nắng, cường độ bán cầu, màu nắng
  [0, '#050b22', '#0f1a3c', 0, .24, '#9db4ff'], [5, '#0a1330', '#2b2f5a', 0, .26, '#9db4ff'], [6.3, '#3b5a9a', '#f2a56e', .5, .45, '#ffc58a'], [8, '#4a90d9', '#bfe0ff', 1, .62, '#fff2d6'],
  [12, '#3f86d6', '#cfe9ff', 1.15, .68, '#fff6e0'], [16.5, '#4a8ad0', '#ffe0b0', 1, .62, '#ffe0b0'], [18, '#2d3f7a', '#ff9a5a', .5, .45, '#ffa970'], [19.5, '#0f1838', '#3a3560', 0, .28, '#9db4ff'], [24, '#050b22', '#0f1a3c', 0, .24, '#9db4ff']
];
const C1 = new THREE.Color(), C2 = new THREE.Color();
const smooth = x => x * x * (3 - 2 * x);
let sd = 12345; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;

export function buildWorld(scene) {
  const W = { timeH: 9, hotspots: [], beacons: {} };
  const D = new THREE.Object3D();
  // ---------- ánh sáng + bầu trời ----------
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x6b7a55, .6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.1); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006; const sc = sun.shadow.camera; sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 10; sc.far = 420; scene.add(sun, sun.target);
  scene.fog = new THREE.Fog(0xcfe6ff, 150, 640);
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color('#4a90d9') }, hor: { value: new THREE.Color('#bfe0ff') } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top;uniform vec3 hor;varying vec3 vP;void main(){float h=clamp(vP.y,0.,1.);gl_FragColor=vec4(mix(hor,top,pow(h,.55)),1.);}' });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 16, 10), skyMat); sky.renderOrder = -10; scene.add(sky);
  const NC = 14, cloudIM = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false, transparent: true, opacity: .96 }), NC * 4), cl = [];
  for (let i = 0; i < NC; i++) cl.push({ x: R() * 1000 - 500, y: 130 + R() * 70, z: R() * 800 - 400, s: 18 + R() * 20, v: 1.5 + R() * 2 }); scene.add(cloudIM);
  W.setTime = h => {
    W.timeH = h; let a = KEYS[0], b = KEYS[1]; for (let i = 1; i < KEYS.length; i++) if (h <= KEYS[i][0]) { a = KEYS[i - 1]; b = KEYS[i]; break; }
    const t = smooth(Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0]))));
    skyMat.uniforms.top.value.copy(C1.set(a[1])).lerp(C2.set(b[1]), t); skyMat.uniforms.hor.value.copy(C1.set(a[2])).lerp(C2.set(b[2]), t);
    sun.intensity = a[3] + (b[3] - a[3]) * t; hemi.intensity = a[4] + (b[4] - a[4]) * t; sun.color.copy(C1.set(a[5])).lerp(C2.set(b[5]), t); hemi.color.copy(skyMat.uniforms.hor.value).lerp(C2.set('#ffffff'), .5);
    scene.fog.color.copy(skyMat.uniforms.hor.value);
    const ang = Math.min(Math.PI, Math.max(0, (h - 6) / 12 * Math.PI)); W.sunDir = new THREE.Vector3(Math.cos(ang) * .9, Math.max(Math.sin(ang), .18) * .9 + .1, .4).normalize();
    W.night = h < 5 ? 1 : h < 6.5 ? 1 - (h - 5) / 1.5 : h < 18 ? 0 : h < 19.5 ? (h - 18) / 1.5 : 1;
    for (const m of winMats) m.emissiveIntensity = W.night * .95; lampM.emissiveIntensity = W.night * 1.5; boatLight.emissiveIntensity = W.night * 1.2;
  };
  // ---------- mặt đất, sông ----------
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1300), plain('#7aa953')); grass.rotation.x = -Math.PI / 2; grass.position.set(60, 0, 40); grass.receiveShadow = true; scene.add(grass);
  const wt = canvasTex('water', 128, 128, g => { g.fillStyle = '#3b86a8'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); const y = i * 15 + 6; g.moveTo(0, y); for (let x = 0; x <= 128; x += 16) g.lineTo(x, y + Math.sin(x / 20 + i) * 3); g.stroke(); } });
  wt.repeat.set(10, 13); const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 520), new THREE.MeshPhongMaterial({ map: wt, shininess: 70, specular: 0x88aacc })); water.rotation.x = -Math.PI / 2; water.position.set(390, .06, 160); scene.add(water);
  const eb = new THREE.Mesh(new THREE.BoxGeometry(5, .9, 360), plain('#bdb7a8')); eb.position.set(183, .4, 80); eb.castShadow = eb.receiveShadow = true; scene.add(eb);
  const pier = new THREE.Mesh(new THREE.BoxGeometry(34, .5, 11), plain('#9a7b55')); pier.position.set(199, .18, 0); pier.receiveShadow = true; scene.add(pier);
  // ---------- đường + vỉa hè ----------
  const roadTex = len => { const t = canvasTex('road', 256, 64, g => { g.fillStyle = '#4b4e53'; g.fillRect(0, 0, 256, 64); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${R() < .5 ? 255 : 0},${R() < .5 ? 255 : 0},${R() < .5 ? 255 : 0},.05)`; g.fillRect(R() * 256, R() * 64, 2, 2); } g.fillStyle = '#e8d34a'; g.fillRect(0, 30, 128, 3); g.fillRect(0, 35, 128, 3); g.fillStyle = '#eee'; g.fillRect(0, 3, 256, 2); g.fillRect(0, 59, 256, 2); }).clone(); t.repeat.set(len / 28, 1); t.needsUpdate = true; return t; };
  const flat = (w, d, x, z, mat, ro, rotY = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = rotY; m.position.set(x, .05, z); m.renderOrder = ro; m.receiveShadow = true; scene.add(m); return m; };
  const swMat = new THREE.MeshLambertMaterial({ color: '#bdb7a9', depthWrite: false }), asph = new THREE.MeshLambertMaterial({ color: '#4b4e53', depthWrite: false });
  for (const [x1, z1, x2, z2] of ROADS) { const len = Math.hypot(x2 - x1, z2 - z1), horiz = z1 === z2, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    flat(horiz ? len + RW + 6 : RW + 10, horiz ? RW + 10 : len + RW + 6, cx, cz, swMat, 1);
    flat(len, RW, cx, cz, new THREE.MeshLambertMaterial({ map: roadTex(len), depthWrite: false }), 2, horiz ? 0 : Math.PI / 2); }
  for (const a of ROADS) for (const b of ROADS) if (a[1] === a[3] && b[0] === b[2] && b[0] >= a[0] && b[0] <= a[2] && a[1] >= b[1] && a[1] <= b[3]) flat(RW, RW, b[0], a[1], asph, 2.1); // ô giao lộ không vạch
  const tiles = canvasTex('tiles', 64, 64, g => { g.fillStyle = '#d3cbbb'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(120,110,95,.35)'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64); g.strokeRect(0, 0, 32, 32); g.strokeRect(32, 32, 32, 32); });
  const paving = (x0, x1, z0, z1) => { const t = tiles.clone(); t.repeat.set((x1 - x0) / 6, (z1 - z0) / 6); t.needsUpdate = true; flat(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2, new THREE.MeshLambertMaterial({ map: t, depthWrite: false }), 1.2); };
  paving(18, 163, -22, 22); paving(-148, -92, -80, -50); paving(-66, -10, 48, 72); paving(78, 134, 20, 46); paving(176, 284, -176, -124); paving(150, 168, 96, 140);
  // ---------- địa danh ----------
  buildPlaces(scene);
  // ---------- cây, đèn đường, ghế ----------
  const nearRoad = (x, z, pad) => { for (const [x1, z1, x2, z2] of ROADS) { const cx = Math.max(Math.min(x1, x2), Math.min(x, Math.max(x1, x2))), cz = Math.max(Math.min(z1, z2), Math.min(z, Math.max(z1, z2))); if (Math.hypot(x - cx, z - cz) < pad) return true; } return false; };
  const blocked = (x, z, pad) => { for (const b of COL.rects) if (x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad) return true; for (const c of COL.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true; for (const l of LM) if (Math.hypot(x - l.fx, z - l.fz) < 9) return true; if (x > 176 && z > -104) return true; return false; };
  const trees = [], lamps = [], benches = [];
  for (const [x1, z1, x2, z2] of ROADS) { const len = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / len, uz = (z2 - z1) / len, off = RW / 2 + 3.4;
    for (let s = 8; s < len - 6; s += 15) for (const side of [-1, 1]) { const x = x1 + ux * s - uz * off * side, z = z1 + uz * s + ux * off * side; if (!blocked(x, z, 3) && !(x > 150 && z > -20 && z < 20)) trees.push([x, z, .85 + R() * .5]); }
    for (let s = 14; s < len - 8; s += 30) { const side = (s / 30 | 0) % 2 ? -1 : 1, x = x1 + ux * s - uz * (off + 1.2) * side, z = z1 + uz * s + ux * (off + 1.2) * side; if (!blocked(x, z, 2)) lamps.push([x, z]); } }
  for (let x = 28; x < 162; x += 12) [-17, 17].forEach(z => { if (!blocked(x, z, 2.5)) trees.push([x, z, 1]); });
  for (let x = 30; x < 160; x += 22) [-20, 20].forEach(z => lamps.push([x, z])); for (let x = 36; x < 160; x += 26) [-11, 11].forEach(z => benches.push([x, z, z < 0 ? 0 : Math.PI]));
  for (const [x0, x1, z0, z1] of [[-148, -92, -80, -50], [-66, -10, 48, 72]]) { [[x0 + 3, z0 + 3], [x1 - 3, z0 + 3], [x0 + 3, z1 - 3], [x1 - 3, z1 - 3]].forEach(([x, z]) => trees.push([x, z, 1])); lamps.push([(x0 + x1) / 2 - 10, z1 - 2], [(x0 + x1) / 2 + 10, z1 - 2]); benches.push([(x0 + x1) / 2, z0 + 3, 0]); }
  for (let i = 0; i < 90; i++) { const x = -300 + R() * 620, z = -250 + R() * 500; if (!nearRoad(x, z, RW / 2 + 10) && !blocked(x, z, 8) && !(x > 150 && z > -110)) trees.push([x, z, 1 + R() * .8]); }
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.3, .42, 3, 6), plain('#6b4a2e'), trees.length), crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2, 0), new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), trees.length);
  trees.forEach(([x, z, s], i) => { D.rotation.set(0, R() * 6, 0); D.scale.setScalar(s); D.position.set(x, 1.5 * s, z); D.updateMatrix(); trunk.setMatrixAt(i, D.matrix); D.position.set(x, 4.3 * s, z); D.updateMatrix(); crown.setMatrixAt(i, D.matrix); crown.setColorAt(i, C1.setHSL(.27 + R() * .06, .5, .36 + R() * .1)); });
  trunk.castShadow = crown.castShadow = true; scene.add(trunk, crown); D.rotation.set(0, 0, 0); D.scale.setScalar(1);
  const lampM = new THREE.MeshLambertMaterial({ color: '#f4efd8', emissive: 0xffd78a, emissiveIntensity: 0 });
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .16, 6.5, 6), plain('#4a4a50'), lamps.length), head = new THREE.InstancedMesh(new THREE.SphereGeometry(.5, 8, 6), lampM, lamps.length);
  lamps.forEach(([x, z], i) => { D.position.set(x, 3.25, z); D.updateMatrix(); pole.setMatrixAt(i, D.matrix); D.position.set(x, 6.7, z); D.updateMatrix(); head.setMatrixAt(i, D.matrix); }); scene.add(pole, head);
  const bench = new THREE.InstancedMesh(new THREE.BoxGeometry(2, .55, .7), plain('#8d8f93'), benches.length); benches.forEach(([x, z, r], i) => { D.rotation.y = r; D.position.set(x, .35, z); D.updateMatrix(); bench.setMatrixAt(i, D.matrix); }); D.rotation.set(0, 0, 0); scene.add(bench);
  // ---------- quầy ăn đường phố ----------
  FOOD.forEach((f, i) => { const g = new THREE.Group(); g.position.set(f.x, 0, f.z); g.rotation.y = R() * 6;
    const t = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.3), plain('#d7b98a')); t.position.y = .55; t.castShadow = true; g.add(t);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 3.4, 5), plain('#777')); p.position.y = 1.7; g.add(p);
    const u = new THREE.Mesh(new THREE.ConeGeometry(2.3, .9, 8), plain(['#e4572e', '#2e86ab', '#f2c14e', '#6b8f71'][i % 4])); u.position.y = 3.6; u.castShadow = true; g.add(u);
    const e = emojiMesh(f.icon, .75, '#fff'); e.position.set(0, 1.9, .7); g.add(e); const e2 = e.clone(); e2.position.z = -.7; g.add(e2); scene.add(g); addCircle(f.x, f.z, 1.7); W.hotspots.push([f.x, f.z]); });
  // ---------- vòng sáng chỉ điểm (địa danh + quầy ăn) ----------
  const ringG = new THREE.RingGeometry(2.4, 3.2, 28).rotateX(-Math.PI / 2), beamG = new THREE.CylinderGeometry(1.2, 1.7, 26, 12, 1, true);
  const beacon = (id, x, z, big) => { const g = new THREE.Group(); g.position.set(x, 0, z); const rm = new THREE.MeshBasicMaterial({ color: '#ffcc33', transparent: true, opacity: .85, depthWrite: false }), bm = new THREE.MeshBasicMaterial({ color: '#ffcc33', transparent: true, opacity: .13, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const r = new THREE.Mesh(ringG, rm); r.position.y = .12; g.add(r); if (big) { const b = new THREE.Mesh(beamG, bm); b.position.y = 13; g.add(b); } g.scale.setScalar(big ? 1 : .55); scene.add(g); W.beacons[id] = { g, rm, bm, big }; };
  LM.forEach(l => { beacon(l.id, l.fx, l.fz, true); W.hotspots.push([l.fx, l.fz]); }); FOOD.forEach(f => beacon(f.id, f.x, f.z + 2.2, false));
  W.mark = (id, visited) => { const b = W.beacons[id]; if (!b) return; const c = visited ? '#44dd88' : (b.big ? '#ffcc33' : '#ff9a3a'); b.rm.color.set(c); b.bm.color.set(c); b.rm.opacity = visited ? .45 : .85; b.bm.opacity = visited ? .05 : .13; b.visited = visited; };
  FOOD.forEach(f => W.beacons[f.id].rm.color.set('#ff9a3a'));
  [[40, 0], [70, 14], [100, -10], [140, 8]].forEach(h => W.hotspots.push(h));
  // ---------- thuyền du lịch trên sông Sài Gòn ----------
  const boat = new THREE.Group(), boatLight = new THREE.MeshLambertMaterial({ color: '#fff3cf', emissive: 0xffd78a, emissiveIntensity: 0 });
  { const h = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.6, 15), plain('#f3efe5')); h.position.y = .7; boat.add(h); const c = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 9), plain('#e4572e')); c.position.set(0, 2.5, -1); boat.add(c); const rf = new THREE.Mesh(new THREE.BoxGeometry(3.8, .3, 9.6), plain('#ffffff')); rf.position.set(0, 3.7, -1); boat.add(rf);
    for (let i = 0; i < 6; i++) [-1.62, 1.62].forEach(x => { const w = new THREE.Mesh(new THREE.BoxGeometry(.1, 1, 1), boatLight); w.position.set(x, 2.6, -4.5 + i * 1.6); boat.add(w); }); boat.traverse(o => { if (o.isMesh) o.castShadow = true; }); boat.position.set(238, .2, 40); scene.add(boat); }
  let boatDir = 1;
  // ---------- xe máy ----------
  const NB = 46, bikeIM = new THREE.InstancedMesh(new THREE.BoxGeometry(.55, .8, 1.9), new THREE.MeshLambertMaterial({ color: '#ffffff' }), NB), riderIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.2, .24, .85, 6), new THREE.MeshLambertMaterial({ color: '#ffffff' }), NB), helmIM = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 8, 6), new THREE.MeshLambertMaterial({ color: '#ffffff' }), NB);
  const BCOL = ['#d8342a', '#2e6fb5', '#f2c14e', '#3a9a5a', '#f2f2f2', '#2b2b2b', '#e8863a']; const bikes = [];
  for (let i = 0; i < NB; i++) { const seg = ROADS[i % ROADS.length], len = Math.hypot(seg[2] - seg[0], seg[3] - seg[1]); bikes.push({ seg, len, s: R() * len, dir: i % 2 ? 1 : -1, v: 6 + R() * 5 }); bikeIM.setColorAt(i, C1.set(BCOL[i % 7])); riderIM.setColorAt(i, C1.set(TOPS[i % 6])); helmIM.setColorAt(i, C1.set(BCOL[(i + 3) % 7])); }
  bikeIM.castShadow = riderIM.castShadow = true; scene.add(bikeIM, riderIM, helmIM);
  // ---------- người đi bộ ----------
  const NP = 38, mk = (gm, n) => new THREE.InstancedMesh(gm, new THREE.MeshLambertMaterial({ color: '#ffffff' }), n);
  const pBody = mk(new THREE.BoxGeometry(.46, .62, .28), NP), pLeg = mk(new THREE.CylinderGeometry(.17, .14, .8, 6), NP), pHead = mk(new THREE.SphereGeometry(.19, 8, 6), NP), pPack = mk(new THREE.BoxGeometry(.36, .46, .2), NP); const peds = [];
  for (let i = 0; i < NP; i++) { const h = W.hotspots[i % W.hotspots.length]; peds.push({ x: h[0] + R() * 10 - 5, z: h[1] + R() * 10 - 5, tx: h[0], tz: h[1], v: 1.2 + R() * 1, yaw: 0, wait: R() * 3 }); pBody.setColorAt(i, C1.set(TOPS[i % 6])); pLeg.setColorAt(i, C1.set(PANTS[i % 5])); pHead.setColorAt(i, C1.set(SKINS[i % 4])); pPack.setColorAt(i, C1.set(BAGS[i % 5])); }
  pBody.castShadow = pLeg.castShadow = pHead.castShadow = pPack.castShadow = true; scene.add(pBody, pLeg, pHead, pPack);
  // ---------- va chạm + giới hạn bản đồ ----------
  W.collide = (p, r) => {
    colCollide(p, r);
    if (p.x > 181 && p.z > -100 && !(p.z > -5.4 && p.z < 5.4 && p.x < 214)) p.x = 181; if (p.x > 181 && p.z > -100) p.z = Math.max(-5.4, Math.min(5.4, p.z)); if (p.x > 214 && p.z > -100) p.x = 214;
    p.x = Math.max(-292, Math.min(300, p.x)); p.z = Math.max(-232, Math.min(240, p.z));
  };
  // ---------- cập nhật mỗi khung hình ----------
  W.setShadows = on => { sun.castShadow = on; };
  W.blockedAt = (x, z, pad) => { for (const b of COL.rects) if (x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad) return true; for (const c of COL.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true; return false; };
  W.update = (dt, t, cam, pp) => {
    sky.position.copy(cam); sun.target.position.set(pp.x, 0, pp.z); sun.position.set(pp.x, 0, pp.z).addScaledVector(W.sunDir || new THREE.Vector3(.5, 1, .3), 150);
    cl.forEach((c, i) => { c.x += c.v * dt; if (c.x > 520) c.x = -520; for (let k = 0; k < 4; k++) { D.position.set(c.x + (k - 1.5) * c.s * .8, c.y + (k % 2) * 3, c.z + (k % 3) * 6); D.scale.set(c.s * (1 - k * .1), c.s * .45, c.s * .7); D.updateMatrix(); cloudIM.setMatrixAt(i * 4 + k, D.matrix); } }); cloudIM.instanceMatrix.needsUpdate = true; D.scale.setScalar(1);
    wt.offset.x += dt * .008; wt.offset.y += dt * .003;
    boat.position.z += boatDir * 4 * dt; if (boat.position.z > 300) boatDir = -1; if (boat.position.z < -80) boatDir = 1; boat.rotation.y = boatDir > 0 ? 0 : Math.PI; boat.position.y = .2 + Math.sin(t * 1.3) * .08;
    for (let i = 0; i < NB; i++) { const b = bikes[i], [x1, z1, x2, z2] = b.seg; b.s += b.v * dt; if (b.s > b.len) b.s -= b.len; const ux = (x2 - x1) / b.len, uz = (z2 - z1) / b.len, al = b.dir > 0 ? b.s : b.len - b.s, off = b.dir * 3.3;
      const x = x1 + ux * al - uz * off, z = z1 + uz * al + ux * off; D.rotation.y = Math.atan2(ux * b.dir, uz * b.dir); D.position.set(x, .6, z); D.updateMatrix(); bikeIM.setMatrixAt(i, D.matrix); D.position.set(x, 1.45, z); D.updateMatrix(); riderIM.setMatrixAt(i, D.matrix); D.position.set(x, 2.05, z); D.updateMatrix(); helmIM.setMatrixAt(i, D.matrix); }
    D.rotation.set(0, 0, 0); bikeIM.instanceMatrix.needsUpdate = riderIM.instanceMatrix.needsUpdate = helmIM.instanceMatrix.needsUpdate = true;
    const tmp = { x: 0, z: 0 };
    for (let i = 0; i < NP; i++) { const p = peds[i];
      if (p.wait > 0) p.wait -= dt; else { const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz); if (d < 1.5) { const h = W.hotspots[Math.floor(R() * W.hotspots.length)]; p.tx = h[0] + R() * 14 - 7; p.tz = h[1] + R() * 14 - 7; p.wait = R() * 4; } else { tmp.x = p.x + dx / d * p.v * dt; tmp.z = p.z + dz / d * p.v * dt; W.collide(tmp, .4); p.x = tmp.x; p.z = tmp.z; const ty = Math.atan2(dx, dz); p.yaw += Math.atan2(Math.sin(ty - p.yaw), Math.cos(ty - p.yaw)) * Math.min(1, dt * 6); } }
      const w = p.wait > 0 ? 0 : 1, bob = Math.abs(Math.sin(t * p.v * 3.2 + i)) * .06 * w, sw = Math.sin(t * p.v * 3.2 + i) * .5 * w;
      D.rotation.set(0, p.yaw, 0); D.position.set(p.x, 1.25 + bob, p.z); D.updateMatrix(); pBody.setMatrixAt(i, D.matrix); D.position.set(p.x, 1.82 + bob, p.z); D.updateMatrix(); pHead.setMatrixAt(i, D.matrix);
      D.position.set(p.x - Math.sin(p.yaw) * .24, 1.3 + bob, p.z - Math.cos(p.yaw) * .24); D.updateMatrix(); pPack.setMatrixAt(i, D.matrix);
      D.rotation.set(sw, p.yaw, 0); D.position.set(p.x, .8 + bob, p.z); D.updateMatrix(); pLeg.setMatrixAt(i, D.matrix); }
    D.rotation.set(0, 0, 0); pBody.instanceMatrix.needsUpdate = pHead.instanceMatrix.needsUpdate = pPack.instanceMatrix.needsUpdate = pLeg.instanceMatrix.needsUpdate = true;
    for (const id in W.beacons) { const b = W.beacons[id], k = 1 + Math.sin(t * 2.4 + b.g.position.x) * .06; b.g.scale.setScalar((b.big ? 1 : .55) * k); }
  };
  W.setTime(9);
  return W;
}
