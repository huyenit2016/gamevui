// Character Lab · pipeline tài sản: nạp GLB/GLTF (Draco, Meshopt, KTX2/Basis), chuẩn hoá đơn vị,
// nâng cấp vật liệu sang MeshPhysicalMaterial (da có tán xạ dưới da xấp xỉ, mắt, răng, tóc, vải),
// dựng LOD theo tên mesh (_LOD0/_LOD1…) và lập báo cáo kiểm định chất lượng/hiệu năng.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ADDONS = new URL('../../vendor/three/addons/', import.meta.url).href;

export function makeLoader(renderer) {
  const draco = new DRACOLoader().setDecoderPath(ADDONS + 'libs/draco/');
  const ktx2 = new KTX2Loader().setTranscoderPath(ADDONS + 'libs/basis/').detectSupport(renderer);
  const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  loader.dispose = () => { draco.dispose(); ktx2.dispose(); };
  return loader;
}

export function loadGLTF(loader, src, onProgress) {
  return new Promise((res, rej) => {
    if (src instanceof ArrayBuffer) loader.parse(src, '', res, rej);
    else loader.load(src, res, e => onProgress && e.total && onProgress(e.loaded / e.total), rej);
  });
}

/* ---------- Chuẩn hoá: đơn vị (cm → m), chân chạm đất, tâm XZ ---------- */
export function normalize(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root, true), size = box.getSize(new THREE.Vector3());
  let s = 1, note = '', skinned = false; root.traverse(o => { if (o.isSkinnedMesh) skinned = true; });
  if (!skinned && size.y < 1.7 * Math.max(size.x, size.z)) { // chỉ có đầu/tượng bán thân (scan, facecap…)
    s = 0.28 / size.y; root.scale.multiplyScalar(s); root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(root, true), c = b.getCenter(new THREE.Vector3());
    root.position.x -= c.x; root.position.z -= c.z; root.position.y += 1.45 - b.min.y; root.updateMatrixWorld(true);
    return { height: 1.75, bust: true, scale: s, note: 'mô hình đầu/bán thân → đặt ở độ cao đầu người' };
  }
  if (size.y > 30) { s = 0.01; note = 'đơn vị cm → m'; }          // Character Creator / Maya / UE thường xuất theo cm
  else if (size.y > 3.2) { s = 1.8 / size.y; note = 'tỷ lệ lạ, ép về 1,8 m'; }
  else if (size.y < 0.4) { s = 1.8 / size.y; note = 'quá nhỏ, ép về 1,8 m'; }
  root.scale.multiplyScalar(s); root.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(root, true), c = b2.getCenter(new THREE.Vector3());
  root.position.x -= c.x; root.position.z -= c.z; root.position.y -= b2.min.y;
  root.updateMatrixWorld(true);
  return { height: +(b2.max.y - b2.min.y).toFixed(3), scale: s, note };
}

/* ---------- Phân loại vật liệu theo tên mesh/vật liệu ---------- */
const RX = {
  cornea: /cornea|eye.?occlusion|tearline|eye.?wet|eyemoisture/i,
  eye: /eye(?!brow|lash|lid)|iris|pupil|sclera/i,
  teeth: /teeth|tooth|tongue|gum/i,
  hair: /hair|brow|lash|beard|mustache|moustache|fuzz|peach/i,
  skin: /skin|head(?!phone|gear|set|band)|face(?!mask|guard)|neck|torso|ch\d\d_body|body_?skin|m_?body\b|mi_?(head|body)/i,
  cloth: /cloth|shirt|pant|jean|jacket|coat|shoe|boot|dress|skirt|sock|hood|vest|fabric|uniform|suit|glove|cap|hat/i,
};
export function classify(mesh, mat) {
  const n = (mat.name || '') + ' ' + (mesh.name || '');
  for (const k of ['cornea', 'eye', 'teeth', 'hair', 'cloth', 'skin']) if (RX[k].test(n)) return k;
  return 'other';
}

/* ---------- Tán xạ dưới da xấp xỉ: wrap lighting theo kênh màu + xuyên sáng (tai, mũi) ---------- */
let sssChunk = null;
function sssPatch(shader, mat) {
  if (!sssChunk) {
    const src = THREE.ShaderChunk.lights_physical_pars_fragment;
    const line = 'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );';
    if (!src.includes(line)) return false;
    sssChunk = 'uniform vec3 clSssColor; uniform vec3 clSssWrap; uniform float clSssTrans;\n' + src.replace(line, line + `
	#ifdef CL_SSS
		float clNL = dot( geometryNormal, directLight.direction );
		vec3 clW = clamp( ( vec3( clNL ) + clSssWrap ) / ( 1.0 + clSssWrap ), 0.0, 1.0 );
		reflectedLight.directDiffuse += max( clW - vec3( saturate( clNL ) ), 0.0 ) * clSssColor * directLight.color * BRDF_Lambert( material.diffuseColor );
		float clBack = pow( saturate( dot( geometryViewDir, - directLight.direction ) ), 6.0 ) * clSssTrans;
		reflectedLight.directDiffuse += clBack * clSssColor * directLight.color * material.diffuseColor;
	#endif`);
  }
  shader.uniforms.clSssColor = mat.userData.sss.color;
  shader.uniforms.clSssWrap = mat.userData.sss.wrap;
  shader.uniforms.clSssTrans = mat.userData.sss.trans;
  shader.defines = Object.assign(shader.defines || {}, { CL_SSS: '' });
  shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_pars_fragment>', sssChunk);
  return true;
}

function toPhysical(m) {
  if (m.isMeshPhysicalMaterial) return m;
  const p = new THREE.MeshPhysicalMaterial();
  if (m.isMeshStandardMaterial) { THREE.MeshStandardMaterial.prototype.copy.call(p, m); p.defines = { STANDARD: '', PHYSICAL: '' }; }
  else { for (const k of ['name', 'map', 'color', 'transparent', 'opacity', 'alphaTest', 'side', 'alphaMap', 'vertexColors', 'normalMap', 'normalScale']) if (m[k] !== undefined) p[k] = m[k]; }
  return p;
}

export const SKIN = { wrap: [0.55, 0.22, 0.12], color: [1.0, 0.38, 0.28], trans: 0.35 };

function makeMat(orig, kind, maxAniso, msaa) {
  const p = toPhysical(orig.clone());
  for (const t of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'clearcoatNormalMap']) if (p[t]) p[t].anisotropy = maxAniso;
  p.envMapIntensity = 1;
  if (kind === 'skin') {
    p.roughness = Math.min(Math.max(p.roughnessMap ? p.roughness : 0.55, 0.38), 0.75); p.metalness = 0;
    p.specularIntensity = 0.5; p.sheen = 0.15; p.sheenRoughness = 0.6; p.sheenColor = new THREE.Color(1, 0.85, 0.8);
    p.userData.sss = { color: { value: new THREE.Color().fromArray(SKIN.color) }, wrap: { value: new THREE.Vector3().fromArray(SKIN.wrap) }, trans: { value: SKIN.trans } };
    p.onBeforeCompile = sh => sssPatch(sh, p); p.customProgramCacheKey = () => 'cl-sss';
  } else if (kind === 'cornea') {
    p.transparent = true; p.opacity = Math.min(p.opacity, 0.35); p.roughness = 0.03; p.metalness = 0; p.clearcoat = 1; p.clearcoatRoughness = 0.02; p.ior = 1.376; p.depthWrite = false;
  } else if (kind === 'eye') {
    p.roughness = Math.min(p.roughness, 0.25); p.metalness = 0; p.clearcoat = 1; p.clearcoatRoughness = 0.03; p.ior = 1.376;
  } else if (kind === 'teeth') {
    p.roughness = 0.35; p.metalness = 0; p.clearcoat = 0.4; p.clearcoatRoughness = 0.2;
  } else if (kind === 'hair') {
    p.metalness = 0; p.roughness = Math.max(p.roughness, 0.45); p.anisotropy = 0.6; p.sheen = 0.3; p.sheenRoughness = 0.5; p.sheenColor = p.color.clone().multiplyScalar(0.8);
    p.side = THREE.DoubleSide; p.transparent = false; p.depthWrite = true;
    if (p.map || p.alphaMap) { if (msaa) { p.alphaToCoverage = true; p.alphaTest = Math.max(p.alphaTest, 0.25); } else p.alphaHash = true; }
  } else if (kind === 'cloth') {
    p.metalness = Math.min(p.metalness, 0.1); p.sheen = 0.6; p.sheenRoughness = 0.8; p.sheenColor = p.color.clone().multiplyScalar(0.6);
  }
  p.userData.kind = kind; p.userData.orig = orig; p.name = orig.name; p.needsUpdate = true;
  return p;
}

export function upgradeMaterials(root, renderer, { msaa = true } = {}) {
  const maxAniso = renderer.capabilities.getMaxAnisotropy(), stats = {}, cache = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const out = list.map(m => {
      if (cache.has(m.uuid)) return cache.get(m.uuid);
      const kind = classify(o, m), p = makeMat(m, kind, maxAniso, msaa);
      stats[kind] = (stats[kind] || 0) + 1; cache.set(m.uuid, p); return p;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
  });
  return stats;
}

// Gán lại loại vật liệu thủ công (khi tên vật liệu trong tệp không gợi ý được: "Material.002", "lambert5"…)
export function reassignKind(root, mat, kind, renderer, msaa) {
  const p = makeMat(mat.userData.orig || mat, kind, renderer.capabilities.getMaxAnisotropy(), msaa);
  root.traverse(o => { if (!o.isMesh) return; if (Array.isArray(o.material)) o.material = o.material.map(m => m === mat ? p : m); else if (o.material === mat) o.material = p; });
  mat.dispose(); return p;
}

export function listMaterials(root) { const m = new Map(); root.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(x => { if (!m.has(x.uuid)) m.set(x.uuid, { mat: x, meshes: [] }); m.get(x.uuid).meshes.push(o.name); }); }); return [...m.values()]; }

/* ---------- LOD theo tên: Body_LOD0, Body_LOD1… → THREE.LOD (giữ skinning) ---------- */
export function buildLODs(root, dists = [0, 6, 14, 28]) {
  const groups = new Map();
  root.traverse(o => { const m = /^(.*?)[_.-]?LOD(\d)$/i.exec(o.name); if (m && (o.isMesh || o.isGroup)) { const k = m[1]; if (!groups.has(k)) groups.set(k, []); groups.get(k).push({ o, l: +m[2] }); } });
  let n = 0, levels = 0;
  for (const [, arr] of groups) {
    if (arr.length < 2) continue; arr.sort((a, b) => a.l - b.l);
    const parent = arr[0].o.parent, lod = new THREE.LOD(); lod.name = 'LOD_' + arr[0].o.name;
    parent.add(lod); arr.forEach((e, i) => { parent.remove(e.o); lod.addLevel(e.o, dists[Math.min(i, dists.length - 1)]); });
    n++; levels = Math.max(levels, arr.length);
  }
  return { groups: n, levels };
}

/* ---------- Hướng mặt: so vị trí xương trái/phải (Mixamo LeftArm, CC4 CC_Base_L_Upperarm, UE upperarm_l) ---------- */
// Quay mặt về +Z thì bên trái nhân vật nằm ở +X. Trả về 1 (+Z), -1 (−Z) hoặc 0 (không xác định).
export function detectFacing(root) {
  root.updateMatrixWorld(true); const side = { l: [], r: [] };
  root.traverse(o => { if (!o.isBone) return; const k = boneKey(o.name); if (!/(arm|shoulder|clavicle|thigh|upleg)/.test(k)) return;
    const s = /^left|^l(?=upperarm|clavicle|thigh|arm)|l$/.test(k) && !/^right/.test(k) ? 'l' : /^right|^r(?=upperarm|clavicle|thigh|arm)|r$/.test(k) ? 'r' : null;
    if (s) side[s].push(o.getWorldPosition(new THREE.Vector3()).x); });
  if (!side.l.length || !side.r.length) return 0;
  const avg = a => a.reduce((s, v) => s + v, 0) / a.length, d = avg(side.l) - avg(side.r);
  return Math.abs(d) < 1e-4 ? 0 : d > 0 ? 1 : -1;
}

/* ---------- Đổi tên xương về dạng chuẩn để dùng chung hoạt ảnh (Mixamo, CC4, UE) ---------- */
export const boneKey = n => String(n).replace(/^mixamorig\d*[:_]?/i, '').replace(/^.*[|:]/, '').replace(/^(cc_base_|bip0?1[_ ]?|def[-_])/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function retargetClip(clip, root) {
  const map = new Map(); root.traverse(o => { if (o.isBone || o.type === 'Object3D' || o.isMesh) map.set(boneKey(o.name), o.name); });
  const tracks = [];
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf('.'), node = t.name.slice(0, dot), prop = t.name.slice(dot);
    const target = map.get(boneKey(node)); if (!target) continue;
    const nt = t.clone(); nt.name = target + prop; tracks.push(nt);
  }
  return tracks.length ? new THREE.AnimationClip(clip.name, clip.duration, tracks) : null;
}

/* ---------- Báo cáo kiểm định ---------- */
const ARKIT = ['browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight','cheekPuff','cheekSquintLeft','cheekSquintRight','eyeBlinkLeft','eyeBlinkRight','eyeLookDownLeft','eyeLookDownRight','eyeLookInLeft','eyeLookInRight','eyeLookOutLeft','eyeLookOutRight','eyeLookUpLeft','eyeLookUpRight','eyeSquintLeft','eyeSquintRight','eyeWideLeft','eyeWideRight','jawForward','jawLeft','jawOpen','jawRight','mouthClose','mouthDimpleLeft','mouthDimpleRight','mouthFrownLeft','mouthFrownRight','mouthFunnel','mouthLeft','mouthLowerDownLeft','mouthLowerDownRight','mouthPressLeft','mouthPressRight','mouthPucker','mouthRight','mouthRollLower','mouthRollUpper','mouthShrugLower','mouthShrugUpper','mouthSmileLeft','mouthSmileRight','mouthStretchLeft','mouthStretchRight','mouthUpperUpLeft','mouthUpperUpRight','noseSneerLeft','noseSneerRight','tongueOut'];
export const morphKey = n => String(n).replace(/^.*\./, '').replace(/(left|_l|\.l)$/i, 'L').replace(/(right|_r|\.r)$/i, 'R').toLowerCase().replace(/[^a-z0-9]/g, '');
export const ARKIT_KEYS = new Set(ARKIT.map(morphKey));
export { ARKIT };

function texInfo(t) {
  const img = t.image || {}, w = img.width || (t.mipmaps && t.mipmaps[0] && t.mipmaps[0].width) || 0, h = img.height || (t.mipmaps && t.mipmaps[0] && t.mipmaps[0].height) || 0;
  const comp = !!t.isCompressedTexture, bpp = comp ? 1 : 4; // nén GPU (BC7/ASTC/ETC2) ~8 bit/px, RGBA8 32 bit/px
  return { w, h, comp, mb: w * h * bpp * 1.33 / 1048576 };
}

export function analyze(root, gltf, extra = {}) {
  let tris = 0, meshes = 0, skinned = 0, prims = 0; const bones = new Set(), textures = new Map(), mats = new Map(), morphs = new Set(), kinds = {};
  root.traverse(o => {
    if (o.isLOD) return;
    if (!o.isMesh) return; if (o.parent && o.parent.isLOD && o.parent.levels[0].object !== o) return;
    meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    const ml = Array.isArray(o.material) ? o.material : [o.material]; prims += Math.max(1, g.groups.length || 1);
    if (o.isSkinnedMesh) { skinned++; o.skeleton.bones.forEach(b => bones.add(b.name)); }
    if (o.morphTargetDictionary) Object.keys(o.morphTargetDictionary).forEach(k => morphs.add(k));
    ml.forEach(m => { mats.set(m.uuid, m); kinds[m.userData.kind || 'other'] = 1; for (const k in m) { const v = m[k]; if (v && v.isTexture) textures.set(v.uuid, { t: v, slot: k, kind: m.userData.kind }); } });
  });
  const tx = [...textures.values()].map(e => Object.assign(texInfo(e.t), { slot: e.slot, kind: e.kind }));
  const vram = tx.reduce((s, t) => s + t.mb, 0), maxTex = tx.reduce((s, t) => Math.max(s, t.w, t.h), 0);
  const skinMap = tx.filter(t => t.kind === 'skin' && t.slot === 'map').reduce((s, t) => Math.max(s, t.w), 0);
  const arkit = [...morphs].filter(k => ARKIT_KEYS.has(morphKey(k))).length;
  const anims = (gltf.animations || []).map(a => a.name);
  const loco = extra.loco || {};
  const ext = (gltf.parser && gltf.parser.json.extensionsUsed) || [];
  const R = {
    tris: Math.round(tris), meshes, skinned, drawPrims: prims, bones: bones.size, materials: mats.size, kinds: Object.keys(kinds),
    textures: tx.length, texCompressed: tx.filter(t => t.comp).length, maxTex, skinMap, vramMB: +vram.toFixed(1),
    morphs: morphs.size, arkit, anims, loco, lods: extra.lods || { groups: 0, levels: 0 }, ext, height: extra.height,
  };
  const C = [];
  const chk = (id, name, ok, warn, val, tip) => C.push({ id, name, st: ok ? 'pass' : warn ? 'warn' : 'fail', val, tip });
  chk('tris', 'Số tam giác (LOD0)', R.tris <= 150000, R.tris <= 300000, R.tris.toLocaleString('vi-VN'), 'Nhân vật chính trên web: ≤150k (tối đa 300k).');
  chk('draws', 'Lượt vẽ (mesh × vật liệu)', R.drawPrims <= 30, R.drawPrims <= 60, R.drawPrims, 'Gộp vật liệu/atlas để ≤30.');
  chk('bones', 'Số xương', R.bones > 0 && R.bones <= 256, R.bones > 0, R.bones, 'Cần khung xương để có hoạt ảnh; ≤256 xương.');
  chk('ktx2', 'Nén texture GPU (KTX2)', R.textures > 0 && R.texCompressed === R.textures, R.textures === 0 || R.texCompressed > 0, `${R.texCompressed}/${R.textures}`, 'Dùng KTX2 (UASTC/ETC1S) để giảm VRAM.');
  chk('skin4k', 'Texture da', R.skinMap >= 4096, R.skinMap >= 2048, R.skinMap ? R.skinMap + ' px' : 'không có', 'Yêu cầu 4K cho da; tối thiểu 2K.');
  chk('vram', 'VRAM texture ước tính', R.vramMB <= 256, R.vramMB <= 512, R.vramMB + ' MB', '≤256 MB cho 1 nhân vật.');
  chk('face', 'Blendshape khuôn mặt (ARKit 52)', R.arkit >= 40, R.arkit > 0, `${R.arkit}/52`, 'Cần cho biểu cảm và nhép môi.');
  chk('anim', 'Hoạt ảnh di chuyển (idle/walk/run)', loco.idle && loco.walk && loco.run, loco.idle || loco.walk || loco.run || anims.length > 0, ['idle', 'walk', 'run'].filter(k => loco[k]).join(', ') || 'không có', 'Nạp thêm GLB hoạt ảnh nếu thiếu.');
  chk('lod', 'LOD', R.lods.levels >= 3, R.lods.levels >= 2, R.lods.levels ? R.lods.levels + ' mức' : 'không có', 'Đặt tên mesh _LOD0/_LOD1/_LOD2 (gltfpack -si).');
  chk('mats', 'Vật liệu nhận diện (da/mắt/tóc)', ['skin', 'eye', 'hair'].every(k => kinds[k] || (k === 'eye' && kinds.cornea)), kinds.skin, R.kinds.join(', '), 'Đặt tên vật liệu chứa skin/eye/hair… để áp shader đúng.');
  chk('height', 'Chiều cao', R.height >= 1.4 && R.height <= 2.1, R.height > 0.4, R.height + ' m', 'Tỷ lệ người thật 1,5–2 m.');
  R.checks = C;
  return R;
}
