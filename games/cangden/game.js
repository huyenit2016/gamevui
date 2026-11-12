// Cảng Đen: game bắn súng góc nhìn thứ nhất 3D trong một bến cảng container đêm mưa. Toàn bộ hình ảnh/âm thanh tạo bằng code (Three.js + WebGL + Web Audio).
import * as THREE from 'three';
const $ = id => document.getElementById(id), clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, TAU = Math.PI * 2;
const isTouch = matchMedia('(pointer:coarse)').matches, Q = new URLSearchParams(location.search);
let sd = 7; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, rr = (a, b) => a + R() * (b - a);
const KEY = 'cangden_v1', cfg = Object.assign({ sens: 5, vol: 7, q: isTouch ? 'low' : 'high', best: 0 }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
if (Q.get('q')) cfg.q = Q.get('q'); const saveCfg = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };

/* ================= RENDERER ================= */
let renderer; try { renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: cfg.q !== 'high', powerPreference: 'high-performance' }); } catch (e) { $('err').style.display = 'grid'; $('load').remove(); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, cfg.q === 'high' ? 1.75 : 1.25)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.AgXToneMapping || THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = cfg.q !== 'low'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .1, 600); scene.add(camera);
scene.fog = new THREE.FogExp2(0x45403b, .0105);
let composer = null, grade = null;
async function setupComposer() {
  if (cfg.q !== 'high') { composer = null; return; }
  try { const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all(['postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js', 'postprocessing/UnrealBloomPass.js', 'postprocessing/OutputPass.js'].map(p => import('three/addons/' + p)));
    composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .55, .7, .82)); composer.addPass(new OutputPass());
    const { ShaderPass } = await import('three/addons/postprocessing/ShaderPass.js'); grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, t: { value: 0 } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform sampler2D tDiffuse;uniform float t;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.299,.587,.114));c=mix(c,vec3(l),.18);c+=vec3(-.012,.004,.02)*(1.-l);c*=mix(vec3(.94,.97,1.03),vec3(1.06,1.,.9),smoothstep(.25,.8,l));c=(c-.5)*1.06+.5;vec2 d=vUv-.5;c*=1.-dot(d,d)*.55;c+=(h(vUv*vec2(1920.,1080.)+t)-.5)*.035;gl_FragColor=vec4(c,1.);}' });
    composer.addPass(grade); composer.setSize(innerWidth, innerHeight);
  } catch (e) { composer = null; }
}
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); composer && composer.setSize(innerWidth, innerHeight); });

/* ================= BẦU TRỜI + ÁNH SÁNG ================= */
const skyU = { flash: { value: 0 }, t: { value: 0 } };
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU, vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `varying vec3 vP;uniform float flash;uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
void main(){vec3 d=normalize(vP);float y=max(d.y,0.);vec3 hor=vec3(.62,.38,.26),mid=vec3(.2,.2,.25),top=vec3(.06,.07,.1);
vec3 c=mix(hor,mid,smoothstep(0.,.18,y));c=mix(c,top,smoothstep(.15,.8,y));
vec2 uv=d.xz/(d.y+.25)*1.2+vec2(t*.01,0.);float cl=fbm(uv*1.6);c*=.55+cl*.9;c+=vec3(.9,.55,.35)*smoothstep(.5,.9,cl)*(1.-y)*.25;vec3 sd=normalize(vec3(1.,.06,-.25));float sg=max(dot(d,sd),0.);c+=vec3(1.,.5,.25)*(pow(sg,6.)*.55+pow(sg,40.)*.6)*(1.-cl*.5);c+=vec3(.6,.7,1.)*flash*(.4+cl);gl_FragColor=vec4(c,1.);}` });
const dome = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 14), skyMat); dome.renderOrder = -10; scene.add(dome);
{ const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(); es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 16, 10), skyMat.clone())); scene.environment = pm.fromScene(es, .04).texture; scene.environmentIntensity = .62; }
const hemi = new THREE.HemisphereLight(0x7f8fa8, 0x2a2420, .55); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xffc89a, 1.25); moon.position.set(-60, 40, 50); moon.castShadow = cfg.q !== 'low'; moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -.0004; { const c = moon.shadow.camera; c.left = c.bottom = -55; c.right = c.top = 55; c.near = 5; c.far = 220; } scene.add(moon, moon.target);

/* ================= TEXTURE QUY TRÌNH ================= */
function canvasTex(w, h, draw, rep = [1, 1], srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
const noise = (g, w, h, a, s = 1) => { const im = g.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) { const v = (R() - .5) * a; d[i] += v; d[i + 1] += v; d[i + 2] += v; } g.putImageData(im, 0, 0); };
// mặt đường ướt: map tối + roughnessMap có vũng nước (nhẵn như gương → phản chiếu bầu trời)
const puddles = []; for (let i = 0; i < 45; i++) puddles.push([R() * 1024, R() * 1024, rr(25, 110), rr(.5, 1)]);
const asphaltMap = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#2a2b2e'; g.fillRect(0, 0, w, h); noise(g, w, h, 34);
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1.5; for (let i = 0; i < 40; i++) { g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rr(-30, 30); y += rr(-30, 30); g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(205,190,120,.35)'; for (let i = 0; i < 4; i++) g.fillRect(i * 256 + 120, 0, 10, h * .62); g.fillStyle = 'rgba(190,190,180,.22)'; g.fillRect(0, 700, w, 8);
  for (const [x, y, r] of puddles) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(8,9,12,.75)'); gr.addColorStop(1, 'rgba(8,9,12,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }, [26, 26]);
const asphaltRough = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w, h); noise(g, w, h, 40); for (const [x, y, r, a] of puddles) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(70,70,70,${a})`); gr.addColorStop(.7, `rgba(70,70,70,${a * .7})`); gr.addColorStop(1, 'rgba(12,12,12,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }, [26, 26], false);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(272, 400), new THREE.MeshStandardMaterial({ map: asphaltMap, roughnessMap: asphaltRough, roughness: 1, metalness: .05, envMapIntensity: .8 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.position.set(-64, 0, -20); scene.add(ground);
{ const q = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 400), new THREE.MeshStandardMaterial({ color: '#4a4b4d', roughness: .95 })); q.position.set(72.6, -1.3, -20); q.receiveShadow = true; scene.add(q); }
const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: '#141c22', roughness: .18, metalness: .9, envMapIntensity: 1.2 })); water.rotation.x = -Math.PI / 2; water.position.set(500, -1.3, -20); scene.add(water);

/* ================= BẢN ĐỒ ================= */
const boxes = [], mat = {}; // vật cản {x0,x1,z0,z1,h}
const addBox = (x0, x1, z0, z1, h) => boxes.push({ x0, x1, z0, z1, h });
const sm = (c, r = .7, m = .2) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const NAMES = ['KESTREL', 'TAMARIND', 'BLUEHARBOR', 'OXBOW', 'MERIDIAN', 'HALCYON'], COLS = ['#8c2f2a', '#2c4f6e', '#3d6a4a', '#b5792a', '#5b5f66', '#6a3d5e'];
const cMats = COLS.map((c, i) => new THREE.MeshStandardMaterial({ roughness: .62, metalness: .35, map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 6) { g.fillStyle = (x / 6) % 2 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.07)'; g.fillRect(x, 0, 3, h); } noise(g, w, h, 30); g.fillStyle = 'rgba(70,40,20,.28)'; for (let k = 0; k < 30; k++) g.fillRect(R() * w, h * R(), rr(2, 10), rr(8, 40)); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = 'bold 24px sans-serif'; g.textAlign = 'center'; g.fillText(NAMES[i], w / 2, h * .55); g.font = '10px sans-serif'; g.fillText('CẢNG ĐEN · ' + (1000 + i * 137), w / 2, h * .72); }) }));
const cGeo = new THREE.BoxGeometry(1, 1, 1);
function container(x, z, along, stacks) { for (let s = 0; s < stacks; s++) { const L = 12, Wd = 2.5, H = 2.6, mt = cMats[(R() * cMats.length) | 0], m = new THREE.Mesh(cGeo, mt); m.scale.set(along ? L : Wd, H, along ? Wd : L); m.position.set(x, s * H + H / 2, z); m.castShadow = m.receiveShadow = true; scene.add(m); } const hx = along ? 6 : 1.25, hz = along ? 1.25 : 6; addBox(x - hx, x + hx, z - hz, z + hz, stacks * 2.6); }
const brandM = new THREE.MeshStandardMaterial({ roughness: .55, metalness: .45, map: canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#1f2c3a'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 14) { g.fillStyle = (x / 14) % 2 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.05)'; g.fillRect(x, 0, 7, h); } noise(g, w, h, 26);
  g.strokeStyle = 'rgba(190,205,215,.75)'; g.lineWidth = 8; g.beginPath(); g.arc(250, 120, 44, .5, TAU - .5); g.stroke(); g.fillStyle = 'rgba(190,205,215,.8)'; g.beginPath(); g.moveTo(250, 82); g.lineTo(272, 120); g.lineTo(250, 158); g.lineTo(228, 120); g.closePath(); g.fill();
  g.font = 'italic 900 78px "Arial Narrow", Impact, sans-serif'; g.textAlign = 'left'; g.fillText('SAO BIỂN LINE', 310, 140); g.font = '600 18px Arial, sans-serif'; g.fillText('B I Ể N   Đ Ô N G  ·  Á  –  Â U  ·  V Ậ N   T Ả I', 318, 176);
  g.fillStyle = 'rgba(90,45,25,.35)'; for (let k = 0; k < 60; k++) g.fillRect(R() * w, R() * h, rr(2, 6), rr(10, 60)); }) });
function brandBox(x, z, ry, stacks = 2) { for (let s = 0; s < stacks; s++) { const m = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 2.5), [cMats[1], cMats[1], cMats[1], cMats[1], brandM, brandM]); m.position.set(x, s * 2.6 + 1.3, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m); } const c = Math.abs(Math.cos(ry)) > .5, hx = c ? 6 : 1.25, hz = c ? 1.25 : 6; addBox(x - hx, x + hx, z - hz, z + hz, stacks * 2.6); }
brandBox(64, -18, 0, 3); brandBox(46, -1, 0, 3);
const OPEN = new Set(['5,3', '0,5', '1,2', '3,0', '5,4', '5,2', '4,2', '2,3']);
for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { if (OPEN.has(i + ',' + j)) continue; const cx = -55 + 22 * i, cz = -77 + 22 * j; if (R() < .18) continue; const al = R() < .5; for (let k = -1; k <= 1; k += 2) if (R() < .85) container(cx + (al ? rr(-3, 3) : k * 3.2), cz + (al ? k * 3.2 : rr(-3, 3)), al, 1 + ((R() * 3) | 0)); }
// tường bao (bê tông) + cần cẩu giàn
const wallM = sm('#55585c', .9, .05), hazT = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#d6a21c'; g.fillRect(0, 0, w, h); g.fillStyle = '#16171a'; for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 16, h); g.lineTo(i * 16 + 8, h); g.lineTo(i * 16 + 40, 0); g.lineTo(i * 16 + 32, 0); g.fill(); } }, [1, 3]);
function wall(x0, x1, z0, z1, h) { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), wallM); m.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; scene.add(m); addBox(x0, x1, z0, z1, h); }
wall(-71, -69, -94, 46, 3.2); wall(-71, 70, -95, -93, 3.2); wall(-71, 70, 45, 47, 3.2); wall(69.5, 71, -95, -41, 1.2); wall(69.5, 71, -25, 47, 1.2);
const steel = sm('#2a3340', .55, .7), hazM = new THREE.MeshStandardMaterial({ map: hazT, roughness: .6, metalness: .3 });
function crane(z) { const g = new THREE.Group(); const leg = (x, zz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(2, 40, 2), steel); m.position.set(x, 20, zz); m.castShadow = true; g.add(m); const b = new THREE.Mesh(new THREE.BoxGeometry(2.1, 4, 2.1), hazM); b.position.set(x, 2, zz); g.add(b); addBox(x - 1, x + 1, z + zz - 1, z + zz + 1, 40); };
  leg(60, -6); leg(60, 6); leg(76, -6); leg(76, 6); const beam = new THREE.Mesh(new THREE.BoxGeometry(46, 3, 4), steel); beam.position.set(66, 40, 0); g.add(beam); const arm = new THREE.Mesh(new THREE.BoxGeometry(70, 2.2, 3), steel); arm.position.set(90, 36, 0); g.add(arm);
  for (let k = 0; k < 6; k++) { const br = new THREE.Mesh(new THREE.BoxGeometry(.5, 40, .5), steel); br.position.set(60 + (k % 2) * 16, 20, -6 + (k % 3) * 6); br.rotation.z = .02 * (k - 3); g.add(br); }
  const spr = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 4), sm('#3a2f22', .8, .4)); spr.position.set(68, 24, 0); g.add(spr); [-5, 5].forEach(x => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 14, 4), sm('#111')); c.position.set(68 + x, 31, 0); g.add(c); });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.6, .3, .6), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); lamp.position.set(66, 38.2, 2.4); g.add(lamp); g.position.set(0, 0, z); scene.add(g); }
crane(-60); crane(-8);
/* ---------- cảnh xa: thành phố mờ bên kia vịnh, cần cẩu xa, đèn pha ---------- */
{ const sky = new THREE.MeshBasicMaterial({ color: '#3a3634', fog: true }), N = 90, im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), sky, N), D = new THREE.Object3D();
  for (let i = 0; i < N; i++) { const h = rr(5, 22) * (R() < .12 ? 2.2 : 1); D.position.set(rr(380, 430), h / 2 - 1, rr(-360, 260)); D.scale.set(rr(10, 24), h, rr(10, 24)); D.updateMatrix(); im.setMatrixAt(i, D.matrix); } scene.add(im);
  const far = sm('#25292e', .9, .3); for (let k = 0; k < 3; k++) { const g = new THREE.Group(), z = -160 + k * 70; [[0, -6], [0, 6], [14, -6], [14, 6]].forEach(([x, zz]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 34, 1.4), far); m.position.set(x, 17, zz); g.add(m); }); const a = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 2.5), far); a.position.set(20, 33, 0); g.add(a); g.position.set(250, 0, z); scene.add(g); } }
const floods = [], floodM = new THREE.MeshBasicMaterial({ color: '#fff6dc' });
function floodTower(x, z, h = 22) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, h, 6), steel); p.position.set(x, h / 2, z); p.castShadow = true; scene.add(p); addBox(x - .3, x + .3, z - .3, z + .3, h);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, .25, .25), steel); bar.position.set(x, h, z); scene.add(bar); for (let k = -1; k <= 1; k += 2) { const l = new THREE.Mesh(new THREE.BoxGeometry(.9, .55, .3), floodM); l.position.set(x + k * 1.1, h + .45, z); l.rotation.x = .5; scene.add(l); }
  const sp = new THREE.SpotLight(0xffe7c2, 900, 70, .55, .6, 1.6); sp.position.set(x, h, z); sp.target.position.set(x - 8, 0, z + 6); sp.castShadow = false; scene.add(sp, sp.target); floods.push(sp); }
floodTower(66, -27); floodTower(66, 18); floodTower(-30, -88, 18);
/* ---------- đạo cụ quanh chân cần cẩu (cảnh mở màn) ---------- */
// cầu thang xoắn bám chân cần cẩu
{ const g = new THREE.Group(), stM = sm('#3a4654', .5, .75), rail = sm('#6c7a86', .45, .8); for (let f = 0; f < 6; f++) { const y0 = f * 5, dir = f % 2 ? -1 : 1, fl = new THREE.Mesh(new THREE.BoxGeometry(1.2, .12, 6.4), stM); fl.position.set(0, y0 + 2.5, 0); fl.rotation.x = dir * .66; g.add(fl);
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.4, .12, 1.6), stM); pl.position.set(0, y0 + 5, dir * 3.6); g.add(pl); for (const s of [-.65, .65]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 6.6), rail); r.position.set(s, y0 + 3.4, 0); r.rotation.x = dir * .66; g.add(r); } }
  g.position.set(62.6, 0, -11); scene.add(g); }
// chồng dầm thép chữ I
{ const bm = sm('#3b3d40', .55, .8); for (let row = 0; row < 3; row++) for (let k = 0; k < 6 - row; k++) { const b = new THREE.Group(); [[0, .02, .28], [0, .3, .28], [0, .16, .03]].forEach(([x, y, w], i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(16, i === 2 ? .3 : .04, i === 2 ? .04 : .3), bm); m.position.y = y; b.add(m); }); b.position.set(48, row * .34, -24 + k * .34 + row * .17); b.rotation.y = .02; b.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(b); } addBox(40, 56, -24.2, -21.8, 1); }
// cuộn cáp có in chữ
const reelT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3d3a35'; g.fillRect(0, 0, w, h); noise(g, w, h, 26); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3; for (let r = 30; r < 128; r += 18) { g.beginPath(); g.arc(128, 128, r, 0, TAU); g.stroke(); } g.fillStyle = 'rgba(230,225,210,.55)'; g.font = 'bold 22px Arial Narrow, sans-serif'; g.textAlign = 'center'; g.save(); g.translate(128, 128); g.rotate(-.2); g.fillText('BẾN CẢNG ĐEN', 0, 8); g.restore(); });
function reel(x, z, r = 1.6, ry = 0) { const g = new THREE.Group(), side = new THREE.MeshStandardMaterial({ map: reelT, roughness: .8, metalness: .2 }), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .16, 28), side); [-.9, .9].forEach(zz => { const d = m.clone(); d.rotation.x = Math.PI / 2; d.position.z = zz; g.add(d); }); const core = new THREE.Mesh(new THREE.CylinderGeometry(r * .62, r * .62, 1.7, 20), sm('#1c1d1f', .5, .4)); core.rotation.x = Math.PI / 2; g.add(core); g.position.set(x, r, z); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(g); addBox(x - r, x + r, z - r, z + r, r * 2); }
reel(49, -36, 1.7, .5); reel(46, 6, 1.4, -.2); reel(-20, 30, 1.5, 1.1);
// pa-lét chồng, rào lưới, chốt gác
{ const pm = sm('#5a4733', .9, .02); for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, .16, 1.2), pm); m.position.set(57, .08 + k * .18, -16); m.rotation.y = rr(-.05, .05); m.castShadow = m.receiveShadow = true; scene.add(m); } addBox(56.3, 57.7, -16.6, -15.4, 1.3);
  const fm = new THREE.MeshStandardMaterial({ color: '#8a9096', roughness: .5, metalness: .8, transparent: true, opacity: .55, map: canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#ccc'; g.lineWidth = 2; for (let i = -64; i < 64; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); } }, [6, 1]), side: THREE.DoubleSide, depthWrite: false });
  const fe = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.2), fm); fe.position.set(66.5, 1.1, -38); scene.add(fe); addBox(60.5, 72.5, -38.1, -37.9, 2.2);
  const bo = new THREE.Mesh(new THREE.BoxGeometry(2, 2.6, 2), sm('#4b5258', .6, .4)); bo.position.set(63, 1.3, -24); bo.castShadow = true; scene.add(bo); const bw = new THREE.Mesh(new THREE.BoxGeometry(2.02, .6, 1.4), new THREE.MeshStandardMaterial({ color: '#2a2a20', emissive: '#ffcf7a', emissiveIntensity: 1.1 })); bw.position.set(63, 1.8, -24); scene.add(bw); addBox(62, 64, -25, -23, 2.6);
  const bl = new THREE.Mesh(new THREE.SphereGeometry(.35, 12, 8), sm('#c8ccd0', .3, .9)); bl.position.set(63, 3.2, -24); scene.add(bl); }

// cầu tàu + tàu cứu hộ
const jetty = new THREE.Mesh(new THREE.BoxGeometry(24, 1.3, 9), sm('#3b3128', .85, .05)); jetty.position.set(82, -.62, -33); jetty.receiveShadow = true; scene.add(jetty);
const BOAT = new THREE.Vector3(88, 0, -33), boat = new THREE.Group();
{ const sh = new THREE.Shape(); [[-3.4, -10], [3.4, -10], [3.4, 5], [0, 11], [-3.4, 5]].forEach(([x, z], i) => i ? sh.lineTo(x, z) : sh.moveTo(x, z)); const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false }).rotateX(-Math.PI / 2), sm('#a8321e', .5, .4)); hull.position.y = -1.2; boat.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.6, .2, 14), sm('#bcb8ae', .8)); deck.position.set(0, 1.1, -1); boat.add(deck); const cab = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 5), sm('#d8d4c8', .6, .1)); cab.position.set(0, 2.5, -3.5); boat.add(cab);
  const win = new THREE.Mesh(new THREE.BoxGeometry(4.05, .7, 3.6), new THREE.MeshStandardMaterial({ color: '#ffd89a', emissive: '#ffb54a', emissiveIntensity: 1.8 })); win.position.set(0, 3.1, -3.5); boat.add(win);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 6, 5), sm('#999')); mast.position.set(0, 6.5, -3.5); boat.add(mast); const lt = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), new THREE.MeshBasicMaterial({ color: '#4dff7a' })); lt.position.set(0, 9.6, -3.5); boat.add(lt); boat.userData.lt = lt; }
boat.position.copy(BOAT); boat.rotation.y = Math.PI / 2; scene.add(boat);
const extractRing = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 60, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#4dff7a', transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); extractRing.position.set(80, 30, -33); extractRing.visible = false; scene.add(extractRing);
// thùng phuy, pa-lét, đèn cột
const lights = [], lampM = new THREE.MeshBasicMaterial({ color: '#fff0c8' });
for (let i = 0; i < 9; i++) { const x = -55 + (i % 3) * 55 + rr(-4, 4), z = -80 + ((i / 3) | 0) * 55 + rr(-4, 4), p = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 12, 6), steel); p.position.set(x, 6, z); p.castShadow = true; scene.add(p); const h = new THREE.Mesh(new THREE.BoxGeometry(1.6, .3, .8), lampM); h.position.set(x, 12.2, z); scene.add(h); addBox(x - .2, x + .2, z - .2, z + .2, 12); if (i % 3 === 1) { const l = new THREE.PointLight(0xffd9a0, 90, 42, 1.6); l.position.set(x, 11, z); scene.add(l); lights.push(l); } }
{ const bm = sm('#2d4150', .5, .6); for (let i = 0; i < 40; i++) { let x, z, t = 0; do { x = rr(-65, 65); z = rr(-90, 40); t++; } while (t < 30 && boxes.some(b => x > b.x0 - 2 && x < b.x1 + 2 && z > b.z0 - 2 && z < b.z1 + 2)); const m = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .9, 10), bm); m.position.set(x, .45, z); m.castShadow = true; scene.add(m); addBox(x - .35, x + .35, z - .35, z + .35, .9); } }

/* ================= TRẠM ĐIỀU KHIỂN (RELAY) ================= */
const RELAYS = [[-33, -33], [11, -77], [55, 11]].map(([x, z], i) => { const g = new THREE.Group(), base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1), sm('#22282f', .5, .6)); base.position.y = .75; base.castShadow = true; g.add(base);
  const scr = new THREE.MeshStandardMaterial({ color: '#300', emissive: '#ff2a1a', emissiveIntensity: 2.2 }), sc = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .8), scr); sc.position.set(0, 1.0, .51); g.add(sc); const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 6, 0, TAU, 0, 1.2), sm('#c8ccd0', .4, .7)); dish.position.set(0, 3.2, 0); dish.rotation.x = -.7; g.add(dish); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 2.4, 6), steel); pole.position.y = 1.9; g.add(pole);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 70, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 35; g.add(beam);
  const lt = new THREE.PointLight(0xff2a1a, 28, 22, 1.7); lt.position.set(0, 2, 1.5); g.add(lt); g.position.set(x, 0, z); scene.add(g); addBox(x - .9, x + .9, z - .5, z + .5, 1.5);
  return { i, x, z, g, scr, beam, lt, cut: false, prog: 0 }; });

/* ================= MƯA ================= */
const RN = 2600, rg = new THREE.BufferGeometry(), rp = new Float32Array(RN * 6), rs = new Float32Array(RN * 2); for (let i = 0; i < RN; i++) { const x = rr(-30, 30), y = rr(0, 28), z = rr(-30, 30); rp.set([x, y, z, x, y, z], i * 6); rs[i * 2] = 0; rs[i * 2 + 1] = 1; }
rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('end', new THREE.BufferAttribute(rs, 1));
const rainU = { t: { value: 0 }, cam: { value: new THREE.Vector3() } };
const rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: rainU, vertexShader: `attribute float end;uniform float t;uniform vec3 cam;varying float a;void main(){vec3 p=position;float sp=26.+fract(p.x*7.13)*8.;p.y=mod(p.y-t*sp,28.);p.xz+=vec2(-.12,.05)*p.y*.3;p.y+=end*.9;vec3 w=p+vec3(cam.x-30.*0.,0.,cam.z);w.x=mod(w.x-cam.x+30.,60.)+cam.x-30.;w.z=mod(w.z-cam.z+30.,60.)+cam.z-30.;a=.35*(1.-end*.6);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`, fragmentShader: 'varying float a;void main(){gl_FragColor=vec4(.75,.82,.95,a);}' })); rain.frustumCulled = false; scene.add(rain);

/* ================= ÂM THANH (WebAudio) ================= */
const Snd = (() => {
  let ac, master, noiseB, droneG; const on = () => ac && cfg.vol > 0;
  const nb = () => noiseB || (noiseB = (() => { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })());
  const burst = (dur, f0, f1, vol, type = 'lowpass', q = 1) => { const s = ac.createBufferSource(); s.buffer = nb(); const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, ac.currentTime); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), ac.currentTime + dur); const g = ac.createGain(); g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + dur); s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(ac.currentTime + dur + .05); };
  const tone = (f, f2, dur, type = 'sine', vol = .2, d = 0) => { const t = ac.currentTime + d, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05); };
  return {
    start() { if (ac) { ac.resume && ac.resume(); return; } try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } master = ac.createGain(); master.gain.value = cfg.vol / 10; master.connect(ac.destination);
      const s = ac.createBufferSource(); s.buffer = nb(); s.loop = true; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; const g = ac.createGain(); g.gain.value = .07; s.connect(hp); hp.connect(g); g.connect(master); s.start();
      const s2 = ac.createBufferSource(); s2.buffer = nb(); s2.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; const g2 = ac.createGain(); g2.gain.value = .12; s2.connect(lp); lp.connect(g2); g2.connect(master); s2.start();
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 78; droneG = ac.createGain(); droneG.gain.value = 0; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; o.connect(f); f.connect(droneG); droneG.connect(master); o.start(); },
    vol() { if (ac) master.gain.value = cfg.vol / 10; },
    shot() { if (!on()) return; burst(.22, 3200, 300, .55); burst(.12, 900, 80, .6, 'lowpass'); tone(150, 45, .12, 'sine', .4); },
    ezap() { if (!on()) return; tone(900, 180, .16, 'square', .07); burst(.1, 3000, 800, .12, 'bandpass', 3); },
    hit() { if (!on()) return; tone(1400, 900, .05, 'triangle', .12); }, kill() { if (!on()) return; tone(900, 300, .25, 'sawtooth', .1); burst(.3, 1800, 200, .3); },
    hurt() { if (!on()) return; burst(.18, 500, 120, .55); tone(90, 50, .2, 'sine', .35); }, reload(p) { if (!on()) return; if (p === 0) { burst(.05, 4000, 1000, .3, 'bandpass', 4); tone(300, 200, .06, 'square', .08); } else { burst(.06, 3000, 800, .35, 'bandpass', 5); tone(500, 260, .05, 'square', .1); } },
    step() { if (!on()) return; burst(.08, 700, 200, .12, 'bandpass', 1.5); }, dry() { if (!on()) return; tone(400, 380, .03, 'square', .08); },
    beep(f) { if (!on()) return; tone(f, f * 1.01, .08, 'square', .06); }, done() { if (!on()) return; tone(520, 520, .15, 'triangle', .2); tone(780, 780, .2, 'triangle', .2, .12); tone(1040, 1040, .35, 'triangle', .2, .26); },
    thunder(delay) { if (!ac) return; setTimeout(() => { if (cfg.vol) { burst(2.6, 380, 40, .9); burst(1.6, 150, 30, .8); } }, delay); }, pick() { if (!on()) return; tone(700, 1100, .1, 'triangle', .14); },
    drone(near) { if (droneG) droneG.gain.setTargetAtTime(near * .09, ac.currentTime, .3); }
  };
})();

/* ================= NGƯỜI CHƠI ================= */
const P = { x: -60, y: 0, z: 36, vy: 0, yaw: -Math.PI / 2 - .6, pitch: 0, hp: 100, h: 1.7, ground: true, ads: false, crouch: false, mag: 30, res: 120, reload: 0, rt: 0, fire: 0, bob: 0, step: 0, recoil: 0, kick: 0, spread: 0 };
const MAG = 30, keys = {}, input = { fire: false, ads: false, jump: false, reload: false, cut: false, mx: 0, my: 0, jx: 0, jy: 0, sprint: false };
let state = 'menu', tNow = 0, kills = 0, shots = 0, hits = 0, startT = 0, dmgTaken = 0, relaysCut = 0, msgT = 0;
const msg = (t, ms = 2600) => { const m = $('msg'); m.textContent = t; m.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('on'), ms); };
// súng (viewmodel)
const gun = new THREE.Group(), gunM = sm('#1a1d21', .42, .7), gunD = sm('#0d0f12', .35, .85), gunP = sm('#24282e', .75, .1), gunT = sm('#3a3f36', .8, .1);
{ const add = (geo, m, x, y, z, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; gun.add(o); return o; }, B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  add(B(.072, .085, .32), gunM, 0, 0, -.06);                       // thân trên
  add(B(.066, .06, .22), gunM, 0, -.055, -.02);                    // thân dưới
  add(B(.08, .075, .3), gunT, 0, -.005, -.36);                     // ốp tay có ray
  for (let k = 0; k < 9; k++) add(B(.084, .012, .016), gunD, 0, .036, -.24 - k * .028); // ray trên ốp
  add(new THREE.CylinderGeometry(.016, .016, .2, 10).rotateX(Math.PI / 2), gunD, 0, .01, -.6);   // nòng
  add(new THREE.CylinderGeometry(.024, .022, .07, 8).rotateX(Math.PI / 2), gunD, 0, .01, -.72);  // bù giật
  add(B(.012, .05, .012), gunD, 0, .07, -.48);                     // đầu ngắm trước
  add(B(.07, .014, .3), gunD, 0, .05, -.1);                        // ray picatinny
  const sc = add(new THREE.CylinderGeometry(.03, .03, .1, 14).rotateX(Math.PI / 2), gunD, 0, .1, -.12); // ống red-dot
  add(B(.03, .03, .03), gunD, 0, .07, -.12);
  add(new THREE.RingGeometry(.018, .027, 16), sm('#2a2e33', .3, .9), 0, .1, -.069);
  add(B(.05, .17, .075), gunP, 0, -.13, -.13, .16);                // băng đạn
  add(B(.05, .07, .07), gunP, 0, -.22, -.12, .32);
  add(B(.048, .13, .055), gunP, 0, -.12, .07, .28);                // tay cầm
  add(B(.016, .04, .06), gunD, 0, -.085, -.02);                    // vòng cò
  add(B(.06, .05, .22), gunP, 0, -.01, .2);                        // báng
  add(B(.06, .12, .05), gunP, 0, -.04, .31);
  add(B(.004, .02, .05), sm('#9a8a6a', .5, .7), .037, .015, -.03); // cửa thoát vỏ đạn
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.004, 6, 4), new THREE.MeshBasicMaterial({ color: '#ff3a2a' })); dot.position.set(0, .1, -.14); gun.add(dot); }
const flashM = new THREE.Mesh(new THREE.PlaneGeometry(.25, .25), new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); flashM.position.set(0, .02, -.72); gun.add(flashM);
const flashL = new THREE.PointLight(0xffc27a, 0, 18, 2); flashL.position.set(0, 0, -.8); gun.add(flashL); camera.add(gun); gun.scale.setScalar(.85); gun.position.set(.2, -.2, -.38);
gun.traverse(o => { if (o.isMesh && o !== flashM) o.renderOrder = 2; });

/* ================= KẺ ĐỊCH ================= */
const enemies = [], eMat = { body: sm('#30343a', .45, .7), dark: sm('#14161a', .5, .6), red: new THREE.MeshStandardMaterial({ color: '#200', emissive: '#ff2a1a', emissiveIntensity: 3 }), warn: sm('#c89a1c', .6, .3) };
function makeDrone() { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 8), eMat.body); b.scale.y = .7; g.add(b); const eye = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), eMat.red); eye.position.set(0, 0, .38); g.add(eye); const rot = []; [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]].forEach(([x, z]) => { const a = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .35, 4), eMat.dark); a.position.set(x * .6, .05, z * .6); a.rotation.z = x * .5; g.add(a); const r = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .02, 10), new THREE.MeshBasicMaterial({ color: '#667', transparent: true, opacity: .35 })); r.position.set(x, .22, z); g.add(r); rot.push(r); }); g.userData.rot = rot; g.userData.eye = eye; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function makeWalker() { const g = new THREE.Group(), tor = new THREE.Mesh(new THREE.BoxGeometry(.8, 1, .5), eMat.body); tor.position.y = 1.35; g.add(tor); const hd = new THREE.Mesh(new THREE.BoxGeometry(.4, .34, .4), eMat.dark); hd.position.y = 2.07; g.add(hd); const eye = new THREE.Mesh(new THREE.BoxGeometry(.3, .07, .05), eMat.red); eye.position.set(0, 2.08, .21); g.add(eye); const stripe = new THREE.Mesh(new THREE.BoxGeometry(.82, .12, .52), eMat.warn); stripe.position.y = 1.0; g.add(stripe);
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .22, .9, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(.22, .9, .26), eMat.dark); m.position.y = -.45; l.add(m); g.add(l); return l; }); const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .55, 1.7, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(.18, .8, .2), eMat.body); m.position.y = -.4; a.add(m); g.add(a); return a; }); arms[1].rotation.x = -1.2;
  g.userData.legs = legs; g.userData.arms = arms; g.userData.eye = eye; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function inBox(x, z, pad = 0) { for (const b of boxes) if (x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad) return b; return null; }
function spawn(type, x, z, o = {}) { const d = type === 'drone', g = d ? makeDrone() : makeWalker(); const e = { type, g, x, z, y: d ? 4 : 0, hp: d ? 45 : 110, max: d ? 45 : 110, cd: rr(1, 2.2), side: R() < .5 ? -1 : 1, hurt: 0, alert: o.alert || false, ph: R() * 6, vx: 0, vz: 0, dead: false, r: d ? .55 : .5, burst: 0, guard: o.guard !== undefined ? o.guard : -1 }; g.position.set(x, e.y, z); scene.add(g); enemies.push(e); return e; }
function freeSpot(minD, cx = P.x, cz = P.z, maxD = 90) { for (let t = 0; t < 60; t++) { const x = rr(-64, 64), z = rr(-88, 40), d = Math.hypot(x - cx, z - cz); if (d > minD && d < maxD && !inBox(x, z, 1.2)) return [x, z]; } return [0, -10]; }
const pickups = [], pkM = { ammo: sm('#3a5a2a', .6, .3), med: sm('#c8c8c8', .5, .1) };
function drop(x, z, kind) { const m = new THREE.Mesh(new THREE.BoxGeometry(.5, .35, .35), kind === 'ammo' ? pkM.ammo : pkM.med); if (kind === 'med') { const c = new THREE.Mesh(new THREE.BoxGeometry(.3, .36, .1), new THREE.MeshBasicMaterial({ color: '#ff3a2a' })); m.add(c); } else { const c = new THREE.Mesh(new THREE.BoxGeometry(.4, .37, .06), new THREE.MeshBasicMaterial({ color: '#ffb23f' })); m.add(c); } m.position.set(x, .3, z); m.castShadow = true; scene.add(m); pickups.push({ m, kind, x, z, t: 0 }); }
function populate() {
  RELAYS.forEach((r, i) => { for (let k = 0; k < 2; k++) { const a = rr(0, TAU), d = rr(7, 12); let x = r.x + Math.cos(a) * d, z = r.z + Math.sin(a) * d; if (inBox(x, z, 1)) { x = r.x + 6; z = r.z + 6; } spawn('walker', x, z, { guard: i }); } const a = rr(0, TAU); spawn('drone', r.x + Math.cos(a) * 10, r.z + Math.sin(a) * 10, { guard: i }); });
  for (let i = 0; i < 3; i++) { const [x, z] = freeSpot(30); spawn('walker', x, z); } for (let i = 0; i < 2; i++) { const [x, z] = freeSpot(30); spawn('drone', x, z); }
  for (let i = 0; i < 5; i++) { const [x, z] = freeSpot(8, 0, -20, 200); drop(x, z, i < 3 ? 'ammo' : 'med'); }
}

/* ================= ĐẠN ĐỊCH, VỆT ĐẠN ================= */
const bolts = [], boltG = new THREE.SphereGeometry(.12, 6, 4), boltM = new THREE.MeshBasicMaterial({ color: '#ff5a3a' });
function ebolt(e, dmg = 8) { const ex = e.x, ey = e.y + (e.type === 'drone' ? 0 : 1.6), ez = e.z, tx = P.x + rr(-.5, .5), ty = P.y + P.h * .7 + rr(-.3, .3), tz = P.z + rr(-.5, .5), dx = tx - ex, dy = ty - ey, dz = tz - ez, l = Math.hypot(dx, dy, dz), sp = 30; const m = new THREE.Mesh(boltG, boltM); m.scale.set(1, 1, 3); m.position.set(ex, ey, ez); scene.add(m); bolts.push({ m, x: ex, y: ey, z: ez, vx: dx / l * sp, vy: dy / l * sp, vz: dz / l * sp, life: 3, dmg }); Snd.ezap(); }
const tracers = [], trM = new THREE.MeshBasicMaterial({ color: '#ffe0a8', transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false });
function tracer(a, b) { const l = a.distanceTo(b); if (l < 1) return; const m = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1, 4).rotateX(Math.PI / 2), trM.clone()); m.position.copy(a).lerp(b, .5); m.scale.set(1, 1, l); m.lookAt(b); scene.add(m); tracers.push({ m, t: .09 }); }
const sparks = []; function spark(p, n = 6, col = '#ffd29a') { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .04), new THREE.MeshBasicMaterial({ color: col })); m.position.copy(p); scene.add(m); sparks.push({ m, v: new THREE.Vector3(rr(-3, 3), rr(1, 4), rr(-3, 3)), t: rr(.25, .55) }); } }
// tia & va chạm
function rayBoxes(o, d, max) { let best = max; for (const b of boxes) { let t0 = 0, t1 = best; for (const [oo, dd, lo, hi] of [[o.x, d.x, b.x0, b.x1], [o.y, d.y, 0, b.h], [o.z, d.z, b.z0, b.z1]]) { if (Math.abs(dd) < 1e-8) { if (oo < lo || oo > hi) { t1 = -1; break; } } else { let a = (lo - oo) / dd, c = (hi - oo) / dd; if (a > c) { const t = a; a = c; c = t; } t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) break; } } if (t0 <= t1 && t1 > 0) best = Math.min(best, t0); } return best; }
function raySphere(o, d, c, r) { const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z, b = ox * d.x + oy * d.y + oz * d.z, cc = ox * ox + oy * oy + oz * oz - r * r, disc = b * b - cc; if (disc < 0) return -1; const t = -b - Math.sqrt(disc); return t > 0 ? t : -1; }
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), dirV = new THREE.Vector3(), orgV = new THREE.Vector3();
function eyePos(out) { return out.set(P.x, P.y + P.h - .1, P.z); }
function shoot() {
  eyePos(orgV); const sp = P.spread + (P.ads ? .003 : .012) + (P.crouch ? 0 : 0); camera.getWorldDirection(dirV); dirV.x += rr(-sp, sp); dirV.y += rr(-sp, sp); dirV.z += rr(-sp, sp); dirV.normalize();
  const wall = rayBoxes(orgV, dirV, 140); let best = wall, who = null, head = false;
  for (const e of enemies) { if (e.dead) continue; if (e.type === 'walker') { v1.set(e.x, e.y + 1.35, e.z); let t = raySphere(orgV, dirV, v1, .62); if (t > 0 && t < best) { best = t; who = e; head = false; } v2.set(e.x, e.y + 2.07, e.z); t = raySphere(orgV, dirV, v2, .24); if (t > 0 && t < best) { best = t; who = e; head = true; } } else { v1.set(e.x, e.y, e.z); const t = raySphere(orgV, dirV, v1, .6); if (t > 0 && t < best) { best = t; who = e; head = false; } } }
  const end = v1.copy(orgV).addScaledVector(dirV, best); const muz = new THREE.Vector3(); flashM.getWorldPosition(muz); tracer(muz, end.clone()); shots++;
  if (who) { hits++; const dmg = head ? 55 : 24; who.hp -= dmg; who.hurt = .15; who.alert = true; spark(end, 4, '#ff8a5a'); const k = who.hp <= 0; $('hit').className = 'on' + (k ? ' kill' : ''); setTimeout(() => $('hit').className = '', 110); Snd.hit(); if (k) killEnemy(who); }
  else if (best < 140) spark(end, 3);
  P.rt = 0; P.kick += .035; P.recoil = Math.min(1, P.recoil + .18); P.spread = Math.min(.03, P.spread + .004); flashM.material.opacity = 1; flashM.rotation.z = R() * 6; flashL.intensity = 40;
}
function killEnemy(e) { e.dead = true; kills++; Snd.kill(); spark(new THREE.Vector3(e.x, e.y + 1, e.z), 14, '#ff9a4a'); e.dt = 0; if (R() < .4) drop(e.x, e.z, R() < .65 ? 'ammo' : 'med'); }
function hurtP(d) { if (state !== 'play') return; P.hp -= d; dmgTaken += d; $('vig').style.opacity = clamp(1 - P.hp / 100, .25, 1); setTimeout(() => $('vig').style.opacity = clamp(.9 - P.hp / 100, 0, .9), 200); Snd.hurt(); if (P.hp <= 0) end(false); }

/* ================= VÒNG LẶP ================= */
function collide(o, r) { for (const b of boxes) { const cx = clamp(o.x, b.x0, b.x1), cz = clamp(o.z, b.z0, b.z1), dx = o.x - cx, dz = o.z - cz, d2 = dx * dx + dz * dz; if (d2 > r * r) continue; if (d2 > 1e-8) { const d = Math.sqrt(d2); o.x = cx + dx / d * r; o.z = cz + dz / d * r; } else { const l = o.x - b.x0, rt = b.x1 - o.x, t = o.z - b.z0, bt = b.z1 - o.z, m = Math.min(l, rt, t, bt); if (m === l) o.x = b.x0 - r; else if (m === rt) o.x = b.x1 + r; else if (m === t) o.z = b.z0 - r; else o.z = b.z1 + r; } } }
const bounds = o => { const jet = Math.abs(o.z + 33) < 4; o.x = clamp(o.x, -68, jet ? 91 : 69); o.z = clamp(o.z, -92, 44); };
let holdE = 0, nearRelay = null, gpPrev = {};
function updatePlayer(dt) {
  // tay cầm
  const gp = (navigator.getGamepads && [...navigator.getGamepads()].find(g => g)); if (gp) { const dz = v => Math.abs(v) < .15 ? 0 : v; input.jx = dz(gp.axes[0]); input.jy = dz(gp.axes[1]); input.mx += dz(gp.axes[2]) * 900 * dt; input.my += dz(gp.axes[3]) * 700 * dt; input.fire = input.fire || gp.buttons[7]?.value > .4 || false; if (gp.buttons[6]) input.ads = input.ads || gp.buttons[6].value > .4; if (gp.buttons[0]?.pressed && !gpPrev.a) input.jump = true; if (gp.buttons[2]?.pressed && !gpPrev.x) input.reload = true; input.cutGp = !!gp.buttons[1]?.pressed; gpPrev = { a: gp.buttons[0]?.pressed, x: gp.buttons[2]?.pressed }; }
  const sens = .0009 * (cfg.sens / 5) * (P.ads ? .55 : 1); P.yaw -= input.mx * sens; P.pitch = clamp(P.pitch - input.my * sens, -1.45, 1.45); input.mx = input.my = 0;
  const wantAds = (input.ads || keys.rmb) && !P.reload; P.ads = wantAds; document.body.classList.toggle('ads', P.ads);
  P.crouch = !!keys.c || input.crouchT; const th = P.crouch ? 1.05 : 1.7; P.h = lerp(P.h, th, Math.min(1, dt * 12));
  let ix = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + input.jx, iz = (keys.s ? 1 : 0) - (keys.w ? 1 : 0) + input.jy; const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
  const sprint = (keys.shift || input.sprint || l > .98 && gp) && !P.ads && !P.crouch && iz < 0, spd = (sprint ? 8.2 : P.crouch ? 2.5 : 5) * (P.ads ? .55 : 1), cs = Math.cos(P.yaw), sn = Math.sin(P.yaw);
  const tx = (ix * cs + iz * sn) * spd, tz = (-ix * sn + iz * cs) * spd; const acc = P.ground ? 14 : 3; P.vx = lerp(P.vx || 0, tx, Math.min(1, dt * acc)); P.vz = lerp(P.vz || 0, tz, Math.min(1, dt * acc));
  P.x += P.vx * dt; P.z += P.vz * dt; collide(P, .42); bounds(P);
  if ((keys[' '] || input.jump) && P.ground && !P.crouch) { P.vy = 6.3; P.ground = false; } input.jump = false; P.vy -= 20 * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; P.ground = true; }
  const sp2 = Math.hypot(P.vx, P.vz); if (P.ground && sp2 > 1) { P.bob += dt * sp2 * 1.5; P.step += dt * sp2; if (P.step > 2.3) { P.step = 0; Snd.step(); } }
  // nạp đạn
  if ((keys.r || input.reload) && !P.reload && P.mag < MAG && P.res > 0) { P.reload = 1.7; P.rp = 0; Snd.reload(0); } input.reload = false;
  if (P.reload > 0) { P.reload -= dt; if (P.rp === 0 && P.reload < .9) { P.rp = 1; Snd.reload(1); } if (P.reload <= 0) { const n = Math.min(MAG - P.mag, P.res); P.mag += n; P.res -= n; P.reload = 0; } }
  // bắn
  P.rt += dt; P.spread = Math.max(0, P.spread - dt * .02); const want = input.fire || keys.lmb;
  if (want && !P.reload && P.rt > .09) { if (P.mag > 0) { P.mag--; shoot(); if (P.mag === 0 && P.res > 0) msg('Hết đạn · bấm R để nạp', 1500); } else { P.rt = 0; Snd.dry(); if (P.res > 0) { P.reload = 1.7; P.rp = 0; Snd.reload(0); } } }
  P.kick = Math.max(0, P.kick - dt * .35); P.recoil = Math.max(0, P.recoil - dt * 3); flashM.material.opacity = Math.max(0, flashM.material.opacity - dt * 22); flashL.intensity = Math.max(0, flashL.intensity - dt * 400);
  // camera + súng
  const bobY = P.ground ? Math.sin(P.bob * 2) * .04 * Math.min(1, sp2 / 5) : 0; camera.position.set(P.x, P.y + P.h + bobY, P.z); camera.rotation.order = 'YXZ'; camera.rotation.set(P.pitch + P.kick, P.yaw, 0);
  camera.fov = lerp(camera.fov, P.ads ? 48 : 72, Math.min(1, dt * 12)); camera.updateProjectionMatrix();
  const ta = P.ads ? [0, -.135, -.34] : [.2, -.2 + (sprint ? -.04 : 0), -.38], sw = Math.sin(P.bob) * .006 * Math.min(1, sp2 / 5) * (P.ads ? .2 : 1); gun.position.x = lerp(gun.position.x, ta[0] + sw, Math.min(1, dt * 14)); gun.position.y = lerp(gun.position.y, ta[1] + Math.abs(Math.sin(P.bob)) * .005 * (P.ads ? 0 : 1) - (P.reload > 0 ? .08 : 0), Math.min(1, dt * 14)); gun.position.z = lerp(gun.position.z, ta[2] + P.recoil * .06, Math.min(1, dt * 20));
  gun.rotation.x = lerp(gun.rotation.x, P.recoil * .08 + (P.reload > 0 ? -.5 : 0) + (sprint ? .25 : 0), Math.min(1, dt * 12)); gun.rotation.y = lerp(gun.rotation.y, sprint ? -.35 : 0, Math.min(1, dt * 10));
  // trạm điều khiển
  nearRelay = null; for (const r of RELAYS) if (!r.cut && Math.hypot(P.x - r.x, P.z - r.z) < 3.4) nearRelay = r;
  const holding = (keys.e || input.cut || input.cutGp) && nearRelay; $('prog').style.display = nearRelay ? 'block' : 'none'; if (isTouch) $('bE').style.display = nearRelay ? 'grid' : 'none';
  if (nearRelay) { $('progT').innerHTML = holding ? 'Đang cắt kết nối…' : (isTouch ? 'Giữ nút <b style="color:var(--acc)">Cắt</b>' : 'Giữ <span class="kc">E</span> để cắt trạm'); if (holding) { nearRelay.prog += dt / 3.2; if (Math.floor(nearRelay.prog * 10) !== Math.floor((nearRelay.prog - dt / 3.2) * 10)) Snd.beep(300 + nearRelay.prog * 700); if (nearRelay.prog >= 1) cutRelay(nearRelay); } else nearRelay.prog = Math.max(0, nearRelay.prog - dt * .6); $('progB').style.width = (nearRelay.prog * 100) + '%'; }
  // nhặt đồ
  for (let i = pickups.length - 1; i >= 0; i--) { const p = pickups[i]; p.t += dt; p.m.rotation.y += dt * 1.5; p.m.position.y = .3 + Math.sin(p.t * 3) * .06; if (Math.hypot(p.x - P.x, p.z - P.z) < 1.3) { if (p.kind === 'ammo') { P.res = Math.min(240, P.res + 30); msg('+30 đạn', 1200); } else { if (P.hp >= 100) continue; P.hp = Math.min(100, P.hp + 30); msg('+30 máu', 1200); } Snd.pick(); scene.remove(p.m); pickups.splice(i, 1); } }
  // đích: lên tàu
  if (relaysCut >= 3 && Math.hypot(P.x - 82, P.z + 33) < 5) end(true);
}
function cutRelay(r) { r.cut = true; r.prog = 1; relaysCut++; r.scr.emissive.set('#2aff6a'); r.scr.color.set('#030'); r.beam.material.color.set('#2aff6a'); r.lt.color.set('#2aff6a'); Snd.done(); $('prog').style.display = 'none';
  if (relaysCut < 3) { msg(`Đã cắt trạm ${relaysCut}/3 · quân tiếp viện đang tới!`, 3200); for (let i = 0; i < 3; i++) { const [x, z] = freeSpot(32); spawn('walker', x, z, { alert: true }); } for (let i = 0; i < 2; i++) { const [x, z] = freeSpot(32); spawn('drone', x, z, { alert: true }); } }
  else { msg('Cả 3 trạm đã tắt! Chạy ra tàu ở cuối cầu tàu!', 4500); extractRing.visible = true; boat.userData.lt.material.color.set('#4dff7a'); for (let i = 0; i < 3; i++) { const [x, z] = freeSpot(25); spawn('walker', x, z, { alert: true }); } for (let i = 0; i < 3; i++) { const [x, z] = freeSpot(25); spawn('drone', x, z, { alert: true }); } } }
function updateEnemies(dt, t) {
  let nearD = 99;
  for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i], g = e.g;
    if (e.dead) { e.dt += dt; g.rotation.x = Math.min(1.4, e.dt * 3); g.position.y = e.type === 'drone' ? Math.max(.2, e.y - e.dt * e.dt * 9) : 0; if (e.dt > 4) { scene.remove(g); enemies.splice(i, 1); } continue; }
    const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz); nearD = Math.min(nearD, dist);
    const eyeY = e.type === 'drone' ? e.y : e.y + 1.6; v1.set(e.x, eyeY, e.z); dirV.set(P.x - e.x, P.y + P.h * .7 - eyeY, P.z - e.z); const dl = dirV.length(); dirV.divideScalar(dl); const los = dl < 70 && rayBoxes(v1, dirV, dl) >= dl - .5;
    if (!e.alert && ((los && dist < 28) || dist < 9 || e.hurt > 0)) e.alert = true;
    if (e.alert === false && e.guard >= 0) { const r = RELAYS[e.guard]; e.px = e.px ?? e.x; e.pz = e.pz ?? e.z; const a = t * .3 + e.ph; const tx = r.x + Math.cos(a) * 9, tz = r.z + Math.sin(a) * 9; const l = Math.hypot(tx - e.x, tz - e.z) || 1; e.x += (tx - e.x) / l * 1.6 * dt; e.z += (tz - e.z) / l * 1.6 * dt; g.rotation.y = Math.atan2(tx - e.x, tz - e.z); }
    else if (!e.alert) { e.pt = (e.pt || 0) - dt; if (e.pt <= 0) { e.pt = rr(3, 7); e.tx = rr(-60, 60); e.tz = rr(-85, 38); } const l = Math.hypot(e.tx - e.x, e.tz - e.z) || 1; e.x += (e.tx - e.x) / l * 1.4 * dt; e.z += (e.tz - e.z) / l * 1.4 * dt; g.rotation.y = Math.atan2(e.tx - e.x, e.tz - e.z); }
    else { const want = e.type === 'drone' ? 13 : 12, spd = e.type === 'drone' ? 5.5 : 3.4; let mx = 0, mz = 0; if (dist > want || !los) { mx = dx / dist; mz = dz / dist; } else if (dist < want * .6) { mx = -dx / dist; mz = -dz / dist; } const strafe = Math.sin(t * .8 + e.ph) * e.side * (los ? .7 : 0); const px = -dz / dist * strafe, pz = dx / dist * strafe; let vx = (mx + px) * spd, vz = (mz + pz) * spd; if (e.type === 'walker' && !los) { const c = Math.cos(e.side * .7), s = Math.sin(e.side * .7); const rx = vx * c - vz * s, rz = vx * s + vz * c; vx = rx; vz = rz; }
      e.x += vx * dt; e.z += vz * dt; g.rotation.y = lerp(g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 6));
      e.cd -= dt; if (e.cd <= 0 && los && dist < 40) { if (e.type === 'drone') { ebolt(e, 7); e.cd = rr(1.3, 2.2); } else { e.burst = 3; e.cd = rr(2, 3); } } if (e.burst > 0) { e.bt = (e.bt || 0) - dt; if (e.bt <= 0 && los) { ebolt(e, 6); e.burst--; e.bt = .13; } }
      if (e.type === 'walker' && dist < 1.8) { e.mt = (e.mt || 0) - dt; if (e.mt <= 0) { hurtP(14); e.mt = 1; } } }
    if (e.type === 'walker') { const before = { x: e.x, z: e.z }; collide(e, e.r); if (Math.hypot(before.x - e.x, before.z - e.z) > .02) e.side = e.side; bounds(e); } else { e.x = clamp(e.x, -69, 92); e.z = clamp(e.z, -93, 45); e.y = lerp(e.y, 3.6 + Math.sin(t * 1.4 + e.ph) * .6, Math.min(1, dt * 2)); }
    g.position.set(e.x, e.type === 'drone' ? e.y : 0, e.z);
    if (e.type === 'walker') { const sp = Math.min(1, Math.hypot(e.x - (e.lx ?? e.x), e.z - (e.lz ?? e.z)) / dt / 3); e.lx = e.x; e.lz = e.z; const s = Math.sin(t * 8 + e.ph) * .7 * sp; g.userData.legs[0].rotation.x = s; g.userData.legs[1].rotation.x = -s; g.userData.arms[0].rotation.x = -s * .6; }
    else for (const r of g.userData.rot) r.rotation.y = t * 40;
    g.userData.eye.material = e.hurt > 0 ? eMat.warn : eMat.red; e.hurt = Math.max(0, e.hurt - dt); }
  Snd.drone(clamp((40 - nearD) / 40, 0, 1) * (enemies.some(e => !e.dead && e.type === 'drone') ? 1 : 0));
}
function updateFx(dt, t) {
  for (let i = bolts.length - 1; i >= 0; i--) { const b = bolts[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.m.position.set(b.x, b.y, b.z); b.m.lookAt(b.x + b.vx, b.y + b.vy, b.z + b.vz); let dead = b.life <= 0 || b.y < 0; const bx = inBox(b.x, b.z); if (bx && b.y < bx.h) { dead = true; spark(b.m.position, 2, '#ff7a4a'); } if (!dead && Math.hypot(b.x - P.x, b.z - P.z) < .55 && b.y > P.y && b.y < P.y + P.h + .2) { dmgDir(b.x - b.vx, b.z - b.vz); hurtP(b.dmg); dead = true; } if (dead) { scene.remove(b.m); bolts.splice(i, 1); } }
  for (let i = tracers.length - 1; i >= 0; i--) { const k = tracers[i]; k.t -= dt; k.m.material.opacity = k.t * 9; if (k.t <= 0) { scene.remove(k.m); k.m.geometry.dispose(); k.m.material.dispose(); tracers.splice(i, 1); } }
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t -= dt; s.v.y -= 12 * dt; s.m.position.addScaledVector(s.v, dt); if (s.t <= 0) { scene.remove(s.m); s.m.geometry.dispose(); s.m.material.dispose(); sparks.splice(i, 1); } }
  for (const r of RELAYS) { if (!r.cut) { r.lt.intensity = 22 + Math.sin(t * 9 + r.i) * 8; r.scr.emissiveIntensity = 1.6 + Math.sin(t * 14 + r.i) * .8; } else r.scr.emissiveIntensity = 2; }
  lights.forEach((l, i) => l.intensity = 80 + Math.sin(t * 3 + i * 2) * 6 + (R() < .01 ? -40 : 0));
  boat.position.y = Math.sin(t * .9) * .08; boat.rotation.z = Math.sin(t * .7) * .012; extractRing.material.opacity = .16 + Math.sin(t * 3) * .06;
  // sét
  lt -= dt; if (lt <= 0) { lt = rr(16, 38); flashT = .5; Snd.thunder(700 + R() * 1500); } if (flashT > 0) { flashT -= dt; const f = Math.max(0, Math.sin(flashT * 40) * .5 + flashT) * 1.2; skyU.flash.value = f; hemi.intensity = .55 + f * 1.5; } else { skyU.flash.value = 0; hemi.intensity = .55; }
  skyU.t.value = t; rainU.t.value = t; rainU.cam.value.set(camera.position.x, 0, camera.position.z); water.position.y = -1.3 + Math.sin(t * .5) * .03;
  moon.position.set(P.x - 60, 40, P.z + 50); moon.target.position.set(P.x, 0, P.z); moon.target.updateMatrixWorld();
}
let lt = 6, flashT = 0;
let compBuilt = false;
function buildComp() { const c = $('comp'), L = { 0: 'B', 45: 'ĐB', 90: 'Đ', 135: 'ĐN', 180: 'N', 225: 'TN', 270: 'T', 315: 'TB' }; let h = ''; for (let d = -360; d <= 720; d += 15) { const k = ((d % 360) + 360) % 360; h += `<span data-d="${d}" class="${L[k] && k % 90 === 0 ? 'c' : ''}" style="left:${d * 3}px">${L[k] || (d % 45 === 0 ? k : '·')}</span>`; } c.innerHTML = h; compBuilt = true; }
function hud() {
  if (!compBuilt) buildComp();
  const am = $('ammo'); am.innerHTML = `${P.reload > 0 ? '··' : P.mag}<small> / ${P.res}</small>`; am.classList.toggle('empty', P.mag === 0);
  const mb = $('magbar'); if (mb._m !== P.mag + '|' + (P.reload > 0)) { mb._m = P.mag + '|' + (P.reload > 0); let h = ''; for (let i = 0; i < MAG; i++) h += `<i class="${i < P.mag && !(P.reload > 0) ? '' : 'off'}"></i>`; mb.innerHTML = h; }
  const hp = clamp(P.hp / 100, 0, 1), hb = $('hpb'), on = Math.ceil(hp * 10); if (hb._on !== on) { hb._on = on; [...hb.children].forEach((e, i) => e.classList.toggle('on', i < on)); hb.classList.toggle('low', hp < .3); } $('hpn').textContent = Math.max(0, Math.round(P.hp)); $('hpi').style.transform = `scaleX(${hp})`;
  $('objT').textContent = relaysCut < 3 ? `Cắt trạm điều khiển ${relaysCut}/3` : 'Chạy ra tàu cứu hộ!'; [...$('pips').children].forEach((e, i) => e.classList.toggle('on', i < relaysCut)); $('objS').textContent = `Hạ gục ${kills} · ${fmtT((tNow - startT) / 1000)} · ${relaysCut >= 3 ? 'điểm đón: cầu tàu' : 'trạm gần nhất được đánh dấu'}`;
  // la bàn: hướng nhìn (độ, 0 = bắc = -z)
  const head = ((-P.yaw * 180 / Math.PI) % 360 + 360) % 360, W2 = $('dir').clientWidth / 2; $('comp').style.transform = `translateX(${W2 - head * 3}px)`;
  const tg = relaysCut >= 3 ? { x: 82, z: -33 } : RELAYS.filter(r => !r.cut).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
  if (tg) { const brg = ((Math.atan2(tg.x - P.x, -(tg.z - P.z)) * 180 / Math.PI) + 360) % 360; let rel = brg - head; rel = ((rel + 540) % 360) - 180; $('tgt').style.left = clamp(W2 + rel * 3, 6, W2 * 2 - 6) + 'px'; $('dist').textContent = (relaysCut >= 3 ? 'Tàu · ' : 'Trạm · ') + Math.round(Math.hypot(tg.x - P.x, tg.z - P.z)) + ' m'; const a = Math.atan2(-(tg.x - P.x), -(tg.z - P.z)) - P.yaw; $('arrow').style.transform = `rotate(${(-a * 180 / Math.PI).toFixed(0)}deg)`; }
}
function dmgDir(sx, sz) { const a = Math.atan2(sx - P.x, sz - P.z) - P.yaw + Math.PI, k = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, el = $('dmg').children[k]; if (!el) return; el.style.transform = `rotate(${a}rad)`; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => el.style.opacity = 0, 450); }
const fmtT = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ================= TRẠNG THÁI ================= */
function reset() { for (const e of enemies) scene.remove(e.g); enemies.length = 0; for (const b of bolts) scene.remove(b.m); bolts.length = 0; for (const p of pickups) scene.remove(p.m); pickups.length = 0;
  RELAYS.forEach(r => { r.cut = false; r.prog = 0; r.scr.emissive.set('#ff2a1a'); r.scr.color.set('#300'); r.beam.material.color.set('#ff2a1a'); r.lt.color.set('#ff2a1a'); }); extractRing.visible = false; boat.userData.lt.material.color.set('#4dff7a');
  Object.assign(P, { x: -60, y: 0, z: 36, vy: 0, vx: 0, vz: 0, yaw: -Math.PI / 2 - .6, pitch: 0, hp: 100, h: 1.7, mag: MAG, res: 120, reload: 0, kick: 0, recoil: 0, spread: 0 }); kills = shots = hits = relaysCut = 0; dmgTaken = 0; sd = 99; populate(); $('vig').style.opacity = 0; }
function begin() { reset(); Snd.start(); state = 'play'; startT = tNow; document.body.classList.add('play'); document.body.classList.toggle('tch', isTouch); ['menu', 'pause', 'over'].forEach(i => $(i).classList.remove('on')); msg('Tìm 3 trạm điều khiển đỏ · cắt chúng rồi chạy ra tàu', 4200); lock(); }
function end(win) { if (state !== 'play') return; state = win ? 'win' : 'dead'; const sec = (tNow - startT) / 1000; if (win && (!cfg.best || sec < cfg.best)) { cfg.best = sec; saveCfg(); } document.body.classList.remove('play'); try { document.exitPointerLock(); } catch (e) {}
  $('oEye').textContent = win ? 'Nhiệm vụ hoàn thành · đã lên tàu' : 'Mất liên lạc · đơn vị bị hạ'; $('oT').textContent = win ? 'Thoát được!' : 'Thất bại'; $('oT').classList.toggle('win', win); $('stats').innerHTML = `<div>Thời gian<b>${fmtT(sec)}</b></div><div>Hạ gục<b>${kills}</b></div><div>Chính xác<b>${shots ? Math.round(hits / shots * 100) : 0}%</b></div><div>Trạm đã cắt<b>${relaysCut}/3</b></div>${win && cfg.best === sec ? '<div style="grid-column:1/-1;color:var(--acc)">Kỷ lục mới</div>' : ''}`; $('over').classList.add('on'); }
function pause() { if (state !== 'play') return; state = 'pause'; document.body.classList.remove('play'); $('pause').classList.add('on'); }
function resume() { state = 'play'; document.body.classList.add('play'); $('pause').classList.remove('on'); lock(); }
const lock = () => { if (!isTouch) try { const p = $('c').requestPointerLock(); p && p.catch && p.catch(() => {}); } catch (e) {} };
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && state === 'play' && !isTouch && !window.__noPause) pause(); });
$('bGo').onclick = begin; $('bAgain').onclick = begin; $('bRes').onclick = resume; $('bQuit').onclick = () => { state = 'menu'; $('pause').classList.remove('on'); $('menu').classList.add('on'); }; $('bMenu').onclick = () => { state = 'menu'; $('over').classList.remove('on'); $('menu').classList.add('on'); };
$('bSet').onclick = () => { $('pSet').classList.toggle('on'); $('pCtl').classList.remove('on'); $('bSet').classList.toggle('on', $('pSet').classList.contains('on')); $('bCtl').classList.remove('on'); }; $('bCtl').onclick = () => { $('pCtl').classList.toggle('on'); $('pSet').classList.remove('on'); $('bCtl').classList.toggle('on', $('pCtl').classList.contains('on')); $('bSet').classList.remove('on'); };
$('sSens').value = cfg.sens; $('sVol').value = cfg.vol; $('sQ').value = cfg.q; $('sSens').oninput = e => { cfg.sens = +e.target.value; saveCfg(); }; $('sVol').oninput = e => { cfg.vol = +e.target.value; saveCfg(); Snd.vol(); }; $('sQ').onchange = e => { cfg.q = e.target.value; saveCfg(); location.reload(); };
if (cfg.best) $('best').textContent = ' Kỷ lục: ' + fmtT(cfg.best) + '.';
$('bP').addEventListener('pointerdown', e => { e.preventDefault(); pause(); });
{ const tick = () => { const d = new Date(); $('clock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }; tick(); setInterval(tick, 20000); }
/* ================= ĐIỀU KHIỂN ================= */
const kmap = { ShiftLeft: 'shift', ShiftRight: 'shift', Space: ' ' };
addEventListener('keydown', e => { if (e.repeat) return; const k = kmap[e.code] || e.key.toLowerCase(); keys[k] = true; if (state === 'play' && ['w', 'a', 's', 'd', ' '].includes(k)) e.preventDefault(); if (k === 'escape' && state === 'play' && isTouch) pause(); });
addEventListener('keyup', e => { keys[kmap[e.code] || e.key.toLowerCase()] = false; });
addEventListener('mousemove', e => { if (state === 'play' && (document.pointerLockElement || drag)) { input.mx += e.movementX; input.my += e.movementY; } });
let drag = false;
$('c').addEventListener('mousedown', e => { if (state !== 'play') return; if (!document.pointerLockElement && !isTouch) { lock(); drag = false; } if (e.button === 0) keys.lmb = true; if (e.button === 2) keys.rmb = true; }); addEventListener('mouseup', e => { if (e.button === 0) keys.lmb = false; if (e.button === 2) keys.rmb = false; }); $('c').addEventListener('contextmenu', e => e.preventDefault());
// cảm ứng
const T = { joy: null, look: null }; const jo = $('joy');
if (isTouch) { const hold = (id, k) => { const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); input[k] = true; b.classList.add('on'); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, () => { if (k !== 'jump' && k !== 'reload') input[k] = false; b.classList.remove('on'); })); }; hold('bF', 'fire'); hold('bJ', 'jump'); hold('bR', 'reload'); hold('bE', 'cut');
  $('bA').addEventListener('pointerdown', e => { e.preventDefault(); input.ads = !input.ads; $('bA').classList.toggle('on', input.ads); }); $('bC').addEventListener('pointerdown', e => { e.preventDefault(); input.crouchT = !input.crouchT; $('bC').classList.toggle('on', input.crouchT); });
  const cv = $('c'); cv.addEventListener('pointerdown', e => { if (state !== 'play') return; if (e.clientX < innerWidth * .45 && T.joy === null) { T.joy = e.pointerId; T.x0 = e.clientX; T.y0 = e.clientY; jo.style.display = 'block'; jo.style.left = e.clientX + 'px'; jo.style.top = e.clientY + 'px'; } else if (T.look === null) { T.look = e.pointerId; T.lx = e.clientX; T.ly = e.clientY; } cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (e.pointerId === T.joy) { const dx = e.clientX - T.x0, dy = e.clientY - T.y0, l = Math.hypot(dx, dy), m = Math.min(l, 55); input.jx = l ? dx / l * m / 55 : 0; input.jy = l ? dy / l * m / 55 : 0; input.sprint = l > 60; jo.firstElementChild.style.transform = `translate(${input.jx * 34}px,${input.jy * 34}px)`; } else if (e.pointerId === T.look) { input.mx += (e.clientX - T.lx) * 2.2; input.my += (e.clientY - T.ly) * 2.2; T.lx = e.clientX; T.ly = e.clientY; } });
  const up = e => { if (e.pointerId === T.joy) { T.joy = null; input.jx = input.jy = 0; input.sprint = false; jo.style.display = 'none'; } if (e.pointerId === T.look) T.look = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); }
let last = performance.now(), frames = 0;
function loop(now) { requestAnimationFrame(loop); const dt = Math.min((now - last) / 1000, .05); last = now; tNow = now; frames++;
  if (state === 'play') { updatePlayer(dt); updateEnemies(dt, now / 1000); updateFx(dt, now / 1000); hud(); }
  else { const t = now / 1000; if (state === 'menu' || state === 'dead' || state === 'win') { camera.position.set(54 + Math.sin(t * .04) * .6, 1.75 + Math.sin(t * .3) * .02, -28.5); camera.rotation.order = 'YXZ'; camera.rotation.set(.16 + Math.sin(t * .05) * .015, -1.3 + Math.sin(t * .03) * .05, 0); camera.fov = 66; camera.updateProjectionMatrix(); moon.position.set(camera.position.x - 60, 40, camera.position.z + 50); moon.target.position.set(camera.position.x, 0, camera.position.z); moon.target.updateMatrixWorld(); gun.visible = false; updateFx(dt, t); } }
  if (state === 'play') gun.visible = true;
  if (grade) grade.uniforms.t.value = (now % 1000) / 10; composer ? composer.render() : renderer.render(scene, camera); }
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && !window.__noPause) pause(); });
await setupComposer(); $('load').remove();
requestAnimationFrame(loop);
window.PR = { P, enemies, RELAYS, boxes, pickups, scene, camera, renderer, cfg, state: () => ({ state, kills, shots, hits, relaysCut, frames, comp: !!composer, hp: P.hp, mag: P.mag, res: P.res }), begin, end, pause, resume, spawn, cutRelay, hurtP, shoot, freeSpot, Snd, input, keys, get stateName() { return state; } };
window.dispatchEvent(new Event('pr-ready'));
