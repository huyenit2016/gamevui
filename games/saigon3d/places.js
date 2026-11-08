// Các địa danh Sài Gòn dựng low-poly bằng code (không dùng tài nguyên ngoài). Kích thước cách điệu, không theo tỷ lệ thật.
import * as THREE from 'three';
import { LM } from './data.js';
import { winMats, canvasTex, gridTex, bld, box, cyl, plain, gable, hipRoof, addRectG, addCircle, addRect, signMesh, clockMesh, flagMesh } from './util.js';
const L = id => LM.find(l => l.id === id);
const mesh = (g, gm, m, x, y, z) => { const me = new THREE.Mesh(gm, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };

export function buildPlaces(scene) {
  const place = (id, rot, fn) => { const lm = L(id), g = new THREE.Group(); g.position.set(lm.x, 0, lm.z); g.rotation.y = rot; fn(g, lm); scene.add(g); return g; };
  const tree = (g, x, z, s = 1) => { cyl(g, .35 * s, .45 * s, 3.2 * s, x, 0, z, '#6b4a2e', 6); mesh(g, new THREE.IcosahedronGeometry(2.1 * s, 0), plain('#5aa03c'), x, 4.4 * s, z); };
  const pole = (g, x, z, h, c = '#e8e8e8') => cyl(g, .25, .3, h, x, 0, z, c, 8);

  // ===== Chợ Bến Thành: mặt chính quay về hướng bắc, tháp đồng hồ ở cổng =====
  place('benthanh', Math.PI, g => {
    bld(g, 60, 11, 40, 0, 0, 0, { cw: 14, ch: 40, base: '#ecd9a0', win: '#58798a', frame: '#fff4d0', ix: .18, iy: .22, lit: .5, roof: '#b9a77a', sp: 4.3, fh: 5.5 });
    gable(g, 42, 64, 7.5, '#a85b3b', 0, 11, 0, Math.PI / 2);
    bld(g, 11, 22, 9, 0, 0, 19.5, { cw: 3, cd: 3, rows: 5, base: '#efdfae', win: '#58798a', frame: '#fff4d0', ix: .22, iy: .2, roof: '#a85b3b' });
    hipRoof(g, 12, 10, 6, '#8a4a30', 0, 22, 19.5); cyl(g, .15, .15, 3, 0, 28, 19.5, '#d9b24a', 6);
    box(g, 6, 7.5, .5, 0, 0, 24.1, '#3a2a22'); const ck = clockMesh(2.4); ck.position.set(0, 17, 24.05); g.add(ck);
    [-24, 24].forEach(sx => { bld(g, 8, 13, 6, sx, 0, 20.5, { cw: 2, cd: 2, rows: 2, base: '#efdfae', win: '#58798a', frame: '#fff4d0', ix: .22, iy: .2, roof: '#a85b3b' }); hipRoof(g, 9, 7, 4.5, '#8a4a30', sx, 13, 20.5); box(g, 4, 6, .5, sx, 0, 23.6, '#3a2a22'); });
    [-14, 14].forEach(sx => { const m = mesh(g, new THREE.BoxGeometry(8, .4, 5), plain(sx < 0 ? '#e05a47' : '#3b82c4'), sx, 3.6, 25.5); m.rotation.x = .25; }); // mái che quầy
    addRectG(g, -30, 30, -20, 25);
  });

  // ===== Nhà thờ Đức Bà: gạch đỏ, hai tháp chuông, tượng Đức Mẹ giữa quảng trường =====
  place('ducba', 0, g => {
    const br = { brick: true, base: '#b35a3a', win: '#2a2a36', frame: '#e8d5b0', arch: true, ix: .28, iy: .15, lit: .6, roof: '#9a4a30', sp: 4, fh: 4.5 };
    bld(g, 20, 17, 36, 0, 0, 0, Object.assign({ cw: 5, cd: 9, ch: 36 }, br)); gable(g, 21.5, 37.5, 6.5, '#8a3f2e', 0, 17, 0);
    [-1, 1].forEach(s => {
      bld(g, 8, 30, 8, s * 8.5, 0, 14, Object.assign({}, br, { cw: 2, cd: 2, rows: 6, ch: 36 })); hipRoof(g, 8.6, 8.6, 15, '#6a3023', s * 8.5, 30, 14, 1.0);
      box(g, .4, 3.4, .4, s * 8.5, 45, 14, '#d9b24a'); box(g, 1.8, .4, .4, s * 8.5, 46.6, 14, '#d9b24a');
    });
    bld(g, 9, 22, 4, 0, 0, 17.5, { brick: true, cw: 1, cd: 1, rows: 1, base: '#b35a3a', win: '#b35a3a', roof: '#9a4a30' });
    mesh(g, new THREE.CircleGeometry(2.3, 20), new THREE.MeshBasicMaterial({ color: '#e8d9b0' }), 0, 15, 19.55);
    mesh(g, new THREE.TorusGeometry(2.4, .25, 6, 20), plain('#7a4a30'), 0, 15, 19.55);
    box(g, 3.6, 6, .4, 0, 0, 19.55, '#2b2220');
    cyl(g, 1.7, 2, 1.8, 0, 0, 34, '#d8d2c4', 12); cyl(g, .9, .1, 4.2, 0, 1.8, 34, '#f4f1e8', 10); mesh(g, new THREE.SphereGeometry(.5, 8, 6), plain('#f4f1e8'), 0, 6.3, 34);
    addRectG(g, -14, 14, -18, 20); addCircle(g.position.x, g.position.z + 34, 2.4);
  });

  // ===== Bưu điện Thành phố: mặt tiền màu kem, cửa sổ vòm, đồng hồ; quay về phía nhà thờ =====
  place('buudien', Math.PI, g => {
    bld(g, 46, 13, 20, 0, 0, 0, { cw: 9, cd: 4, ch: 44, base: '#ead08c', win: '#2f5f4d', arch: true, frame: '#fff1c8', shutter: '#2f6b4f', ix: .2, iy: .14, lit: .5, roof: '#d8c070', sp: 5, fh: 6.5 });
    box(g, 47, 1, 21, 0, 13, 0, '#f3e7c3'); gable(g, 21, 47.5, 4.5, '#8a3f2e', 0, 14, 0, Math.PI / 2);
    const ck = clockMesh(2.1); ck.position.set(0, 11, 10.06); g.add(ck); box(g, 6, 6.4, .5, 0, 0, 10.1, '#3a2e22');
    addRectG(g, -23, 23, -10, 10);
  });

  // ===== Dinh Độc Lập: khối trắng có lam đứng, cột tiền sảnh, cột cờ, đài phun nước, hàng rào =====
  place('dinhdoclap', Math.PI / 2, g => {
    const o = { cw: 36, cd: 16, rows: 3, base: '#efede3', win: '#9ba3a7', ix: .12, iy: .12, lit: .4, roof: '#d9d6cb' };
    bld(g, 54, 12, 22, 0, 0, 0, o); bld(g, 38, 9, 16, 0, 12, -1, Object.assign({}, o, { cw: 26, cd: 12 })); box(g, 40, 1, 18, 0, 21, -1, '#cfcbbf');
    box(g, 32, 1, 9, 0, 12, 15, '#dcd8cc'); for (let i = 0; i < 9; i++) cyl(g, .5, .5, 12, -14 + i * 3.5, 0, 12.5, '#ece9df', 8);
    box(g, 32, 1, 7, 0, 0, 18.5, '#d5d0c4'); box(g, 9, .1, 28, 0, .05, 31, '#d9d3c6');
    cyl(g, .25, .3, 22, 0, 22, -1, '#cfcfcf', 6); const fl = flagMesh(9, 6); fl.position.set(4.7, 40, -1); fl.rotation.y = Math.PI / 2; g.add(fl);
    cyl(g, 5.4, 5.6, .9, 0, 0, 30, '#cfd0cc', 18); mesh(g, new THREE.CircleGeometry(5, 18), new THREE.MeshBasicMaterial({ color: '#6fb6dd' }), 0, .95, 30).rotation.x = -Math.PI / 2;
    const post = new THREE.InstancedMesh(new THREE.BoxGeometry(.4, 3, .4), plain('#2c2c30'), 40), D = new THREE.Object3D(); let k = 0;
    for (let i = -20; i <= 20; i++) { if (Math.abs(i) < 3) continue; D.position.set(i * 2, 1.5, 46); D.updateMatrix(); post.setMatrixAt(k++, D.matrix); } post.count = k; post.castShadow = true; g.add(post);
    box(g, 80, .25, .25, 0, 2.4, 46, '#2c2c30'); [-1, 1].forEach(s => { cyl(g, .6, .6, 4.5, s * 6.5, 0, 46, '#cfcbbf', 8); });
    [[-34, 20], [34, 20], [-34, 36], [34, 36], [-22, 40], [22, 40]].forEach(([x, z]) => tree(g, x, z, 1.1));
    addRectG(g, -27, 27, -11, 11);
  });

  // ===== Ủy ban nhân dân Thành phố (đầu phố đi bộ Nguyễn Huệ), chỉ để trang trí =====
  { const g = new THREE.Group(); g.position.set(-12, 0, 0); g.rotation.y = Math.PI / 2;
    bld(g, 44, 13, 18, 0, 0, 0, { cw: 10, cd: 4, ch: 40, rows: 3, base: '#efe3c0', win: '#425a6b', arch: true, frame: '#fff', ix: .2, iy: .14, lit: .5, roof: '#d6cba8', sp: 4.5 });
    bld(g, 10, 22, 9, 0, 0, 3, { cw: 3, cd: 3, rows: 5, base: '#efe3c0', win: '#425a6b', arch: true, frame: '#fff', roof: '#d6cba8' });
    hipRoof(g, 46, 20, 6, '#7c8289', 0, 13, 0); hipRoof(g, 11, 10, 7, '#7c8289', 0, 22, 3); const ck = clockMesh(2); ck.position.set(0, 18, 7.55); g.add(ck);
    scene.add(g); addRectG(g, -22, 22, -9, 9); }

  // ===== Phố đi bộ Nguyễn Huệ: cổng chào + đài phun nước =====
  { const g = new THREE.Group(); g.position.set(24, 0, 0);
    [-15, 15].forEach(z => cyl(g, .6, .6, 8, 0, 0, z, '#b3261e', 8)); const sg = signMesh('PHỐ ĐI BỘ NGUYỄN HUỆ', 30, 4, { size: 42 }); sg.position.set(0, 8.4, 0); sg.rotation.y = Math.PI / 2; g.add(sg); scene.add(g);
    const f = new THREE.Group(); f.position.set(70, 0, 0); cyl(f, 7, 7.4, 1, 0, 0, 0, '#cfd0cc', 24); mesh(f, new THREE.CircleGeometry(6.6, 24), new THREE.MeshBasicMaterial({ color: '#68b4de' }), 0, 1.02, 0).rotation.x = -Math.PI / 2;
    cyl(f, .6, 1.2, 3.5, 0, 1, 0, '#e8e8e4', 10); mesh(f, new THREE.ConeGeometry(.9, 2.2, 8), new THREE.MeshBasicMaterial({ color: '#cfeaf7' }), 0, 5.6, 0); scene.add(f); addCircle(70, 0, 7.6); }

  // ===== Tháp Bitexco: búp sen cách điệu, bãi đáp trực thăng nhô ra =====
  place('bitexco', 0, g => {
    bld(g, 40, 6, 34, 0, 0, 0, { cw: 10, cd: 8, rows: 1, base: '#d4dadd', win: '#6a8ea5', ix: .1, iy: .2, roof: '#c0c6c9', lit: .6 });
    const R = [[0, 0], [8, 15.4], [32, 14.5], [58, 12.5], [82, 9.5], [98, 5.5], [108, 0]], rad = y => { for (let i = 1; i < R.length; i++) if (y <= R[i][0]) { const a = R[i - 1], b = R[i], t = (y - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return 0; };
    const prof = []; for (let i = 0; i <= 28; i++) { const y = i * 108 / 28; prof.push(new THREE.Vector2(Math.max(.01, rad(y)), y + 6)); }
    const [map, emi] = gridTex(18, 28, { cw: 16, ch: 16, base: '#3f7fae', win: '#9fd2ee', ix: .1, iy: .12, lit: .5 });
    const m = new THREE.MeshLambertMaterial({ map, emissiveMap: emi, emissive: 0xffe2a8, emissiveIntensity: 0 }); winMats.push(m);
    mesh(g, new THREE.LatheGeometry(prof, 22), m, 0, 0, 0);
    box(g, 9, 1.4, 5, 12.5, 74, 0, '#9aa3a8'); cyl(g, 6.2, 6.2, .8, 16, 75.4, 0, '#cfd3d6', 20);
    const hp = canvasTex('helipad', 128, 128, c => { c.fillStyle = '#cfd3d6'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#d8342a'; c.lineWidth = 8; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.stroke(); c.fillStyle = '#fff'; c.font = '700 80px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 64, 68); });
    mesh(g, new THREE.CircleGeometry(6.1, 20), new THREE.MeshBasicMaterial({ map: hp }), 16, 76.25, 0).rotation.x = -Math.PI / 2;
    cyl(g, .2, .2, 16, 0, 114, 0, '#cfd3d6', 6);
    addRectG(g, -20, 20, -17, 17); addCircle(g.position.x, g.position.z, 15);
  });

  // ===== Landmark 81: tháp nhiều tầng thu nhỏ dần, đỉnh nhọn =====
  place('landmark81', 0, g => {
    bld(g, 64, 8, 52, 0, 0, 0, { cw: 14, cd: 12, rows: 2, base: '#cfd6da', win: '#6a8ea5', ix: .1, iy: .2, roof: '#c0c6c9' });
    let y = 8; [[26, 26, 60], [24, 24, 48], [20, 20, 42], [16, 16, 34], [12, 12, 26]].forEach(([w, d, h]) => { bld(g, w, h, d, 0, y, 0, { cw: Math.round(w / 1.7), cd: Math.round(d / 1.7), rows: Math.round(h / 3.4), cw0: 0, base: '#3b7fa8', win: '#a9dcef', ix: .08, iy: .14, lit: .5, roof: '#b9c4cb' }); y += h; });
    cyl(g, .3, .8, 28, 0, y, 0, '#dfe5e8', 8); mesh(g, new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff4a3a' }), 0, y + 29, 0);
    addRectG(g, -32, 32, -26, 26);
  });

  // ===== Chùa Bà Thiên Hậu: mái ngói nhiều tầng, vòng hương xoắn treo, đèn lồng đỏ =====
  place('chuaba', Math.PI / 2, g => {
    box(g, 44, .05, 38, 0, .03, 0, '#d8c9aa').renderOrder = 1.2;
    const wl = '#a83a2e'; box(g, 44, 3, .8, 0, 0, -18, wl); [-22, 22].forEach(x => box(g, .8, 3, 36, x, 0, 0, wl)); [-14, 14].forEach(x => box(g, 16, 3, .8, x, 0, 18, wl));
    [-6, 6].forEach(x => { cyl(g, .6, .6, 5, x, 0, 18, '#b3261e', 8); }); hipRoof(g, 16, 3, 2, '#c0652f', 0, 5, 18, 1.0);
    bld(g, 22, 8, 14, 0, 0, -4, { cw: 5, cd: 3, rows: 1, base: '#b83a2e', win: '#3a1e14', frame: '#e0b84a', ix: .15, iy: .2, roof: '#a03226', lit: .4 });
    hipRoof(g, 28, 19, 3.2, '#c0652f', 0, 8, -4, 1.0); box(g, 14, 4, 9, 0, 11.2, -4, '#b83a2e'); hipRoof(g, 19, 13, 5.5, '#c0652f', 0, 15.2, -4, 1.0); box(g, 8, .6, .8, 0, 20.4, -4, '#e0b84a');
    [[-14, -13.5], [14, -13.5], [-14, 5.5], [14, 5.5]].forEach(([x, z]) => { const c = mesh(g, new THREE.ConeGeometry(.55, 2.4, 6), plain('#c0652f'), x, 9.9, z); c.rotation.z = -Math.sign(x) * .5; });
    for (let i = 0; i < 7; i++) { const x = -9 + i * 3; cyl(g, .03, .03, 1.6, x, 8.4, 4.8, '#6b4a2e', 4); const c = mesh(g, new THREE.ConeGeometry(1.1, 2.2, 10, 1, true), plain('#c4552a', { side: THREE.DoubleSide }), x, 7.2, 4.8); c.rotation.x = Math.PI; }
    for (let i = 0; i < 9; i++) mesh(g, new THREE.SphereGeometry(.45, 8, 6), new THREE.MeshBasicMaterial({ color: '#e0382a' }), -12 + i * 3, 7.4, 6.4);
    cyl(g, 1.5, 1.8, 2.4, 0, 0, 11, '#7a5a2e', 10); cyl(g, .4, .5, 2, 0, 2.4, 11, '#7a5a2e', 8);
    addRectG(g, -11, 11, -11, 6); addRectG(g, -22, 22, -18.5, -17.5);
  });

  // ===== Bến Nhà Rồng: nhà trắng kiểu Pháp, mái ngói sẫm, hai con rồng trên nóc =====
  place('nharong', Math.PI / 2, g => {
    bld(g, 40, 11, 14, 0, 0, 0, { cw: 8, cd: 3, rows: 2, base: '#f2efe6', win: '#3d4f5c', arch: true, frame: '#d9d4c4', shutter: '#4a6a58', ix: .22, iy: .14, lit: .5, roof: '#4d3b36', sp: 5, fh: 5.5 });
    hipRoof(g, 41, 15, 6.5, '#4a3a36', 0, 11, 0, 1.04); box(g, 10, 6, 2, 0, 0, 7.6, '#e9e4d6'); box(g, 4, 5, .4, 0, 0, 8.7, '#3a2e22');
    [-8, 8].forEach(x => { mesh(g, new THREE.ConeGeometry(.7, 2.6, 6), plain('#d9b24a'), x, 17.4, 0); mesh(g, new THREE.SphereGeometry(.55, 6, 5), plain('#d9b24a'), x, 19, .4); });
    cyl(g, .2, .25, 16, 0, 0, 14, '#cfcfcf', 6); const fl = flagMesh(5, 3.4); fl.position.set(2.7, 14, 14); g.add(fl);
    addRectG(g, -20, 20, -7, 7);
  });
}
