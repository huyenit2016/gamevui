// Phiêu lưu Tiếng Anh 10 (id english10): biến bài trắc nghiệm thành game phiêu lưu có bản đồ, trùm cuối, tim/xu/sao và chứng chỉ hoàn thành.
// Thầy cô: chọn bộ đề có sẵn (js/eng10-data.js) hoặc dán/tải đề riêng → tạo link giao bài (đề nằm trong link, không cần máy chủ, học sinh không cần tài khoản).
// Đồ hoạ nhân vật/bối cảnh vẽ bằng SVG/CSS. Mã hoàn thành chỉ là chống gian lận cơ bản (băm nội dung + tên + điểm), không phải bảo mật.
(function () {
  const esc = GV.esc, SETS = () => GV.eng10.SETS;
  /* ---------- tiện ích ---------- */
  const h53 = (str, seed = 0) => { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed; for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return 4294967296 * (2097151 & h2) + (h1 >>> 0); };
  const code8 = (n, base) => { const s = Math.floor(n).toString(base).toUpperCase().padStart(8, '0').slice(-8); return s.slice(0, 4) + '-' + s.slice(4); };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtT = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const b64u = u8 => { let s = ''; u8.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = t => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  // câu hỏi nội bộ: {s: đề, r: đúng, w: [sai…], e: giải thích}
  const norm = a => ({ s: a[0], r: a[1], w: a.slice(2, 5).filter(Boolean), e: a[5] || '' });
  const libSet = s => ({ id: s.id, t: s.t, ic: s.ic, cat: s.cat, lv: s.lv, q: s.q.map(norm) });
  const advId = set => code8(h53(set.custom ? JSON.stringify(set.q.map(q => [q.s, q.r, q.w])) : 'lib:' + set.id), 36);
  const finCode = (aid, name, score, n) => code8(h53(aid + '|' + String(name).trim().toLowerCase() + '|' + score + '|' + n + '|gv-e10'), 16);
  async function encodeSet(set) {
    const json = JSON.stringify({ t: set.t, q: set.q.map(q => [q.s, q.r, q.w, q.e]) }), bytes = new TextEncoder().encode(json);
    if (window.CompressionStream) { const cs = new CompressionStream('deflate-raw'), w = cs.writable.getWriter(); w.write(bytes); w.close(); return 'z' + b64u(new Uint8Array(await new Response(cs.readable).arrayBuffer())); }
    return 'j' + b64u(bytes);
  }
  async function decodeSet(p) {
    let bytes = unb64u(p.slice(1));
    if (p[0] === 'z') { const ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter(); w.write(bytes); w.close(); bytes = new Uint8Array(await new Response(ds.readable).arrayBuffer()); }
    const o = JSON.parse(new TextDecoder().decode(bytes)); if (!o || !Array.isArray(o.q) || o.q.length > 60) throw new Error('bad');
    const q = o.q.map(x => ({ s: String(x[0]).slice(0, 300), r: String(x[1]).slice(0, 120), w: (x[2] || []).slice(0, 3).map(v => String(v).slice(0, 120)), e: String(x[3] || '').slice(0, 300) })).filter(x => x.s && x.r && x.w.length >= 1);
    if (!q.length) throw new Error('empty'); return { id: 'c' + h53(JSON.stringify(q)).toString(36), t: String(o.t || 'Bộ đề của thầy cô').slice(0, 80), ic: '✏️', cat: 'Đề riêng', lv: '', q, custom: true };
  }
  /* ---------- đọc đề do thầy cô nhập ---------- */
  const L = 'ABCD';
  function parseSet(text) {
    const errs = [], qs = []; text = String(text || '').replace(/^﻿/, '').trim(); if (!text) return { q: qs, errs: ['Chưa có nội dung.'] };
    const add = (s, opts, ans, e, no) => {
      s = String(s || '').trim(); opts = opts.map(x => String(x).trim()).filter(Boolean);
      if (!s) return; if (opts.length < 2 || opts.length > 4) { errs.push(`Câu ${no}: cần 2–4 đáp án (đang có ${opts.length}).`); return; }
      let ci = typeof ans === 'number' ? ans : (/^[A-Da-d]$/.test(String(ans).trim()) ? L.indexOf(String(ans).trim().toUpperCase()) : opts.findIndex(o => o.toLowerCase() === String(ans).trim().toLowerCase()));
      if (!(ci >= 0 && ci < opts.length)) { errs.push(`Câu ${no}: chưa có/không hợp lệ đáp án đúng.`); return; }
      if (s.length > 300 || opts.some(o => o.length > 120)) { errs.push(`Câu ${no}: quá dài (đề ≤ 300, đáp án ≤ 120 ký tự).`); return; }
      qs.push({ s, r: opts[ci], w: opts.filter((_, i) => i !== ci), e: String(e || '').trim().slice(0, 300) });
    };
    if (/^[\[{]/.test(text)) { // JSON
      try { let a = JSON.parse(text); if (!Array.isArray(a)) a = a.questions || a.q || []; a.forEach((o, i) => add(o.q || o.question || o.s, o.a || o.options || o.answers || [], o.c !== undefined ? o.c : (o.correct !== undefined ? o.correct : o.answer), o.e || o.explanation, i + 1)); } catch (e) { errs.push('JSON không hợp lệ.'); }
      return { q: qs, errs };
    }
    const lines = text.split(/\r?\n/).filter(l => l.trim()), tabs = lines.filter(l => /\t/.test(l)).length, commas = lines.filter(l => (l.match(/[,;]/g) || []).length >= 5 && !/^\s*[A-Da-d]\s*[).:]/.test(l)).length;
    if (tabs > lines.length / 2 || (commas > lines.length / 2 && !/^\s*(Q|Câu|\d+)\s*[:.)]/i.test(lines[0]))) { // CSV/TSV
      const delim = tabs > lines.length / 2 ? '\t' : (lines[0].split(';').length > lines[0].split(',').length ? ';' : ',');
      const split = l => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === delim && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
      let no = 0; lines.forEach((l, i) => { const c = split(l); if (i === 0 && /^(question|câu hỏi|cau hoi|đề|de)$/i.test((c[0] || '').trim())) return; no++; add(c[0], c.slice(1, 5), c[5], c[6], no); });
      return { q: qs, errs };
    }
    let cur = null, no = 0; const flush = () => { if (cur) { add(cur.s, cur.o, cur.a, cur.e, cur.no); cur = null; } };
    for (const raw of lines) {
      const l = raw.trim(); let m;
      if ((m = l.match(/^(?:ANS(?:WER)?|Đáp án|DA|ĐA|Key)\s*[:=\-]\s*\(?([A-Da-d])\)?/i))) { if (cur) cur.a = m[1]; continue; }
      if ((m = l.match(/^(?:Giải thích|Explain(?:ation)?|Tip|Gợi ý)\s*[:\-]\s*(.+)/i))) { if (cur) cur.e = m[1]; continue; }
      if ((m = l.match(/^\(?([A-Da-d])\s*[).:]\s*(.+)$/)) && cur) { let t = m[2].trim(), star = false; if (/\*$/.test(t)) { star = true; t = t.slice(0, -1).trim(); } if (/^\*/.test(t)) { star = true; t = t.slice(1).trim(); } cur.o.push(t); if (star) cur.a = cur.o.length - 1; continue; }
      if ((m = l.match(/^(?:Q(?:uestion)?\s*\d*|Câu\s*\d*|\d+)\s*[:.)]\s*(.+)$/i))) { flush(); cur = { s: m[1], o: [], a: undefined, e: '', no: ++no }; continue; }
      if (cur && !cur.o.length) cur.s += ' ' + l; else if (!cur) { cur = { s: l, o: [], a: undefined, e: '', no: ++no }; }
    }
    flush(); return { q: qs, errs };
  }
  const SAMPLE = 'Q: Yesterday, I ___ to school.\nA) walked\nB) walk\nC) walks\nD) walking\nANS: A\nGiải thích: "Yesterday" → quá khứ đơn.\n\nQ: She ___ English every day.\nA) study\nB) studies\nC) studying\nD) studied\nANS: B\n\nQ: My brother is taller ___ me.\nA) than\nB) that\nC) as\nD) then\nANS: A';

  /* ---------- hình vẽ: nhân vật, quái vật, bối cảnh ---------- */
  const SYMBOLS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="e10hero" viewBox="0 0 100 124"><path d="M72 88c18-4 22 8 18 18-3-9-10-11-20-8z" fill="#6fb35f"/><ellipse cx="50" cy="82" rx="27" ry="30" fill="#7cc36b"/><ellipse cx="50" cy="90" rx="16" ry="20" fill="#f6e9b4"/><ellipse cx="38" cy="113" rx="11" ry="6" fill="#8b5a2b"/><ellipse cx="62" cy="113" rx="11" ry="6" fill="#8b5a2b"/><ellipse cx="25" cy="84" rx="6" ry="10" fill="#6fb35f" transform="rotate(20 25 84)"/><ellipse cx="75" cy="84" rx="6" ry="10" fill="#6fb35f" transform="rotate(-20 75 84)"/><path d="M30 62q20 14 40 0l-3 8q-17 10-34 0z" fill="#ff8a3d"/><circle cx="50" cy="42" r="27" fill="#7cc36b"/><circle cx="31" cy="46" r="5" fill="#ff9aa8" opacity=".6"/><circle cx="69" cy="46" r="5" fill="#ff9aa8" opacity=".6"/><circle cx="41" cy="38" r="7" fill="#fff"/><circle cx="59" cy="38" r="7" fill="#fff"/><circle cx="43" cy="39" r="3.6" fill="#2a2140"/><circle cx="61" cy="39" r="3.6" fill="#2a2140"/><circle cx="44.2" cy="37.8" r="1.2" fill="#fff"/><circle cx="62.2" cy="37.8" r="1.2" fill="#fff"/><path d="M40 52q10 9 20 0" stroke="#2a2140" stroke-width="2.4" fill="none" stroke-linecap="round"/><g><circle cx="28" cy="20" r="5" fill="#ff7aa8"/><circle cx="38" cy="14" r="5" fill="#ffd34d"/><circle cx="50" cy="12" r="5" fill="#6bc7ff"/><circle cx="62" cy="14" r="5" fill="#b58cff"/><circle cx="72" cy="20" r="5" fill="#ff9a4d"/></g></symbol>
<symbol id="e10blob" viewBox="0 0 120 130"><path d="M40 26 34 8M80 26l6-18" stroke="#2a8d8a" stroke-width="3"/><circle cx="33" cy="7" r="6" fill="#40c9c0"/><circle cx="87" cy="7" r="6" fill="#40c9c0"/><ellipse cx="60" cy="78" rx="46" ry="48" fill="#f08a24"/><ellipse cx="60" cy="92" rx="26" ry="26" fill="#ffd27a"/><circle cx="30" cy="70" r="7" fill="#d9701a"/><circle cx="92" cy="86" r="8" fill="#d9701a"/><circle cx="84" cy="50" r="5" fill="#d9701a"/><circle cx="44" cy="52" r="12" fill="#fff"/><circle cx="72" cy="52" r="10" fill="#fff"/><circle cx="46" cy="54" r="5.5" fill="#2a2140"/><circle cx="74" cy="53" r="5" fill="#2a2140"/><path d="M48 72q12 10 24 0" stroke="#2a2140" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="124" rx="12" ry="6" fill="#d9701a"/><ellipse cx="82" cy="124" rx="12" ry="6" fill="#d9701a"/></symbol>
<symbol id="e10pud" viewBox="0 0 120 130"><circle cx="60" cy="14" r="9" fill="#e0262e"/><path d="M60 6q4-8 12-8" stroke="#3a7d2a" stroke-width="3" fill="none"/><path d="M22 52c4-18 20-24 38-24s34 6 38 24z" fill="#8a4a1c"/><path d="M18 56q10 14 22 4 8 14 20 4 12 10 22-4 12 6 20-4l-4 4z" fill="#8a4a1c"/><path d="M20 58h80l8 58q0 8-10 8H22q-10 0-10-8z" fill="#f5b83a"/><ellipse cx="44" cy="84" rx="6" ry="9" fill="#2a2140"/><ellipse cx="76" cy="84" rx="6" ry="9" fill="#2a2140"/><circle cx="45" cy="80" r="2" fill="#fff"/><circle cx="77" cy="80" r="2" fill="#fff"/><circle cx="32" cy="98" r="6" fill="#ff8a8a" opacity=".6"/><circle cx="88" cy="98" r="6" fill="#ff8a8a" opacity=".6"/><path d="M50 98q10 8 20 0" stroke="#2a2140" stroke-width="3" fill="none" stroke-linecap="round"/></symbol>
<symbol id="e10golem" viewBox="0 0 120 130"><path d="M22 40c0-14 16-22 38-22s38 8 38 22v70c0 10-10 16-38 16s-38-6-38-16z" fill="#8f9aa6"/><path d="M20 42c4-16 20-26 40-26s36 10 40 26c-10-8-20-6-26-2-6-6-16-6-24 0-8-6-18-6-30 2z" fill="#6aa84f"/><circle cx="30" cy="30" r="4" fill="#8bc86a"/><circle cx="88" cy="34" r="5" fill="#8bc86a"/><ellipse cx="46" cy="62" rx="11" ry="12" fill="#fff"/><ellipse cx="76" cy="62" rx="11" ry="12" fill="#fff"/><circle cx="48" cy="64" r="5.5" fill="#2a2140"/><circle cx="78" cy="64" r="5.5" fill="#2a2140"/><path d="M44 90q16 14 32 0" stroke="#2a2140" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="6" y="64" width="16" height="30" rx="8" fill="#7a8591"/><rect x="98" y="64" width="16" height="30" rx="8" fill="#7a8591"/><path d="M38 108l4 8M60 112v10M82 108l-4 8" stroke="#6b7580" stroke-width="3"/></symbol>
<symbol id="e10crown" viewBox="0 0 60 36"><path d="M4 32 2 8l14 12L30 2l14 18L58 8 56 32z" fill="#ffd34d" stroke="#d99a12" stroke-width="2"/><circle cx="30" cy="22" r="3.5" fill="#e0262e"/></symbol>
</defs></svg>`;
  const THEMES = [
    { n: 'Rừng khủng long', mini: ['e10golem', 'Đá Rêu Mossy'], fin: ['e10blob', 'Vua Thiên Thạch'], bg: () => `<svg class="bgs" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ecbe8"/><stop offset=".6" stop-color="#dcecd6"/><stop offset="1" stop-color="#b9d98a"/></linearGradient></defs><rect width="1600" height="900" fill="url(#sk1)"/><circle cx="1360" cy="100" r="58" fill="#fff6c9" opacity=".9"/><path d="M0 440 220 250 400 360 620 190 860 380 1060 220 1300 400 1600 260V620H0z" fill="#8aa9c7" opacity=".6"/><path d="M0 500 160 380 360 470 560 340 800 480 1020 360 1260 490 1600 380V700H0z" fill="#6f9a8a" opacity=".75"/><path d="M0 640Q300 540 600 620T1200 600 1600 560V900H0z" fill="#7fb45a"/><path d="M0 760Q400 690 800 740T1600 720V900H0z" fill="#5f9a48"/><g fill="#3f7a3a"><path d="M0 900V560q80 60 90 160 40-70 120-90-40 70-30 270z"/><path d="M1600 900V540q-80 60-90 160-40-70-120-90 40 70 30 270z"/></g><g><rect x="1180" y="470" width="14" height="110" fill="#6b4a2a"/><ellipse cx="1187" cy="470" rx="90" ry="30" fill="#4f8a3a"/><rect x="330" y="500" width="12" height="90" fill="#6b4a2a"/><ellipse cx="336" cy="500" rx="70" ry="24" fill="#4f8a3a"/></g></svg>` },
    { n: 'Vũ trụ kỳ diệu', mini: ['e10blob', 'Thiên thạch Blip'], fin: ['e10pud', 'Vua Pudding'], bg: () => `<svg class="bgs" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1b6b"/><stop offset=".55" stop-color="#6a45c9"/><stop offset="1" stop-color="#c58be8"/></linearGradient></defs><rect width="1600" height="900" fill="url(#sk2)"/>${Array.from({ length: 70 }, (_, i) => `<circle cx="${(i * 233) % 1600}" cy="${(i * 97) % 520}" r="${1 + (i % 3)}" fill="#fff" opacity="${0.4 + (i % 5) / 10}"/>`).join('')}<circle cx="1180" cy="170" r="110" fill="#ff9ad0" opacity=".85"/><ellipse cx="1180" cy="170" rx="190" ry="34" fill="none" stroke="#ffe0f0" stroke-width="8" opacity=".8" transform="rotate(-18 1180 170)"/><circle cx="360" cy="260" r="70" fill="#7fd7ff" opacity=".8"/><circle cx="700" cy="190" r="36" fill="#ffd27a"/><path d="M0 560q160-110 300-30t320-20 300 40 320-60 360 40V900H0z" fill="#4b2f9a" opacity=".9"/><path d="M0 700q200-90 420-20t400 10 360-50 420 30V900H0z" fill="#2f1d78"/><g fill="#9be0ff"><path d="M1400 900l30-170 40 170z"/><path d="M1490 900l20-120 30 120z"/><path d="M110 900l30-150 40 150z"/></g><g fill="#e6d4ff" opacity=".85"><rect x="1240" y="420" width="16" height="120"/><circle cx="1248" cy="410" r="26"/><rect x="1300" y="440" width="12" height="100"/></g></svg>` },
    { n: 'Xứ sở kẹo ngọt', mini: ['e10pud', 'Pudding Pop'], fin: ['e10golem', 'Vua Đá Rêu'], bg: () => `<svg class="bgs" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb27a"/><stop offset=".5" stop-color="#ffd9a8"/><stop offset="1" stop-color="#ffe9ee"/></linearGradient></defs><rect width="1600" height="900" fill="url(#sk3)"/><circle cx="800" cy="330" r="90" fill="#fff0a8" opacity=".9"/><path d="M0 470 240 300 480 420 760 260 1040 400 1320 280 1600 420V640H0z" fill="#e79a8c" opacity=".7"/><path d="M0 600q200-80 400-30t400-20 400 30 400-20V900H0z" fill="#f6c8b0"/><path d="M0 680q100 70 200 10t200 20 200-30 200 40 200-20 200 30 200-10V900H0z" fill="#7a3f1e"/><path d="M0 700q100 70 200 10t200 20 200-30 200 40 200-20 200 30 200-10V900H0z" fill="#f7b7c8"/><g><circle cx="260" cy="420" r="70" fill="#f6a3b8"/><rect x="190" y="420" width="140" height="80" fill="#e8c28a"/><circle cx="1260" cy="440" r="80" fill="#fff"/><rect x="1180" y="440" width="160" height="90" fill="#e8c28a"/><circle cx="1260" cy="370" r="16" fill="#e0262e"/><circle cx="260" cy="350" r="14" fill="#e0262e"/></g><g fill="#e0262e"><circle cx="90" cy="800" r="26"/><circle cx="1500" cy="780" r="30"/></g></svg>` }
  ];
  const heart = on => `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" fill="${on ? '#ff4f78' : '#d9c9d3'}" stroke="#fff" stroke-width="1.5"/></svg>`;
  const BADGES = [[0.9, 'Nhà thám hiểm xuất sắc', '🏆'], [0.7, 'Dũng sĩ phiêu lưu', '🥇'], [0.5, 'Nhà thám hiểm', '🥈'], [0, 'Tân binh dũng cảm', '🥉']];
  const badgeOf = r => BADGES.find(b => r >= b[0]);

  GV.register({
    id: 'english10', type: 'game', cat: 'Học tập', name: 'Phiêu lưu Tiếng Anh 10', icon: '🦖', desc: 'Biến bài trắc nghiệm Tiếng Anh lớp 10 thành game phiêu lưu: bản đồ, trùm cuối, tim-xu-sao và chứng chỉ. Thầy cô tạo đề riêng và gửi link giao bài.',
    mount(el) {
      const ST = Object.assign({ name: '', best: {}, my: [] }, GV.store.get('eng10', {})), save = () => GV.store.set('eng10', ST);
      let dead = false, timer = 0, G = null, tmo = []; const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); tmo.push(t); return t; };
      const anc = []; for (let n = el; n && n !== document.body; n = n.parentElement) { if (n.id !== 'app') { anc.push([n, n.style.animation, n.style.transform]); n.style.animation = 'none'; n.style.transform = 'none'; } }
      el.innerHTML = `<style>
.e10{position:fixed;inset:0;z-index:70;overflow:auto;background:#f6efe3;color:#2a2140;font-family:"Baloo 2","Nunito",system-ui,sans-serif;-webkit-font-smoothing:antialiased}.e10 *{box-sizing:border-box}
.e10 .btn{border:0;border-radius:14px;padding:10px 18px;font:700 1rem inherit;background:#7c4dff;color:#fff;cursor:pointer;box-shadow:0 4px 0 #5a35c4}.e10 .btn:active{transform:translateY(2px);box-shadow:0 2px 0 #5a35c4}.e10 .btn.w{background:#fff;color:#2a2140;box-shadow:0 4px 0 #d9d0e6;border:1px solid #e3d9ef}.e10 .btn.g{background:#2fb36b;box-shadow:0 4px 0 #1f8a50}.e10 .btn.o{background:#ff9a3d;box-shadow:0 4px 0 #d97a1c}.e10 .btn[disabled]{opacity:.5}
.e10 input,.e10 textarea,.e10 select{font:inherit;border:2px solid #e3d9ef;border-radius:12px;padding:8px 12px;background:#fff;color:#2a2140;width:100%}
.e10 .etop{display:flex;align-items:center;gap:10px;padding:12px 16px;flex-wrap:wrap}.e10 .etop h1{margin:0;font-size:1.6rem;flex:1;min-width:200px}.e10 .ex{color:#2a2140;width:42px;height:42px;border-radius:50%;border:0;background:#fff;box-shadow:0 2px 8px #0002;font-size:20px;cursor:pointer}
.e10 .hero{margin:0 16px;padding:22px;border-radius:24px;background:linear-gradient(135deg,#d9f2c8,#fde7b8);display:flex;gap:18px;align-items:center;flex-wrap:wrap}.e10 .hero svg{width:110px;height:132px}.e10 .hero h2{margin:0 0 4px;font-size:1.7rem}.e10 .hero p{margin:0 0 10px;max-width:560px}
.e10 .chips{display:flex;gap:8px;flex-wrap:wrap;margin:16px}.e10 .chips button{color:#2a2140;border:2px solid #e3d9ef;background:#fff;border-radius:99px;padding:5px 14px;font:700 .95rem inherit;cursor:pointer}.e10 .chips button.on{background:#7c4dff;color:#fff;border-color:#7c4dff}
.e10 .grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));padding:0 16px 40px}.e10 .set{color:#2a2140;background:#fff;border-radius:18px;padding:14px;box-shadow:0 4px 14px #5a35c41a;cursor:pointer;border:2px solid transparent;text-align:left;font:inherit;color:inherit}.e10 .set:hover{border-color:#7c4dff}.e10 .set .ic{font-size:2rem}.e10 .set b{display:block;line-height:1.2;margin:2px 0}.e10 .set small{color:#7d7391}.e10 .set .st{float:right;font-size:.9rem;color:#d98a00}
.e10 .scene{position:fixed;inset:0;overflow:hidden;background:#222}.e10 .bgs{position:absolute;inset:0;width:100%;height:100%}
.e10 .hud{position:absolute;top:10px;left:10px;right:10px;display:flex;align-items:flex-start;gap:8px;z-index:5;pointer-events:none}.e10 .hud>*{pointer-events:auto}.e10 .epill{background:#fffffff0;border-radius:99px;padding:5px 12px;box-shadow:0 3px 10px #0003;display:flex;align-items:center;gap:6px;font-weight:800}
.e10 .prog{position:absolute;left:50%;transform:translateX(-50%);top:10px;background:#fffffff0;border-radius:18px;padding:6px 14px 8px;box-shadow:0 3px 10px #0003;text-align:center;min-width:min(340px,50vw);max-width:60vw}.e10 .prog small{font-weight:700;font-size:.85rem}.e10 .seg{display:flex;gap:5px;margin-top:3px;align-items:center}.e10 .seg i{flex:1;height:9px;border-radius:6px;background:#e4dcf1}.e10 .seg i.ok{background:#2fb36b}.e10 .seg i.no{background:#ff6b6b}.e10 .seg i.cur{background:#ffc83d}.e10 .seg b{font-size:14px;line-height:1}
.e10 .map{position:absolute;left:0;right:0;bottom:0;height:62%}.e10 .map>svg{width:100%;height:100%}.e10 .nd{transition:transform .8s cubic-bezier(.5,.1,.3,1)}
.e10 .modal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;z-index:8;background:#0003}.e10 .modal.clear{background:none;pointer-events:none}.e10 .modal.clear>*{pointer-events:auto}
.e10 .qcard{background:#fff;border-radius:22px;padding:18px 20px;width:min(640px,100%);box-shadow:0 12px 40px #0005;border:4px solid #fff;outline:3px solid #d6cfe0;text-align:center;max-height:92vh;overflow:auto}.e10 .tag{display:inline-block;background:#ffc83d;border-radius:10px;padding:2px 14px;font-weight:800;font-size:.9rem;margin-bottom:6px}.e10 .stem{font-size:clamp(1.3rem,3.4vw,2rem);font-weight:800;line-height:1.25;margin:4px 0 14px}.e10 .stem u{display:inline-block;min-width:3.2em;border-bottom:3px solid #2a2140;text-decoration:none}
.e10 .ops{display:grid;grid-template-columns:1fr 1fr;gap:10px}.e10 .op{display:flex;align-items:center;gap:10px;border:0;border-radius:14px;padding:11px 14px;font:800 1.1rem inherit;cursor:pointer;text-align:left;color:#2a2140;box-shadow:0 4px 0 #0002}.e10 .op i{flex:0 0 30px;height:30px;border-radius:8px;display:grid;place-items:center;color:#fff;font-style:normal;font-size:.95rem}
.e10 .op:nth-child(1){background:#dff1ff}.e10 .op:nth-child(1) i{background:#2672c2}.e10 .op:nth-child(2){background:#dcf7e6}.e10 .op:nth-child(2) i{background:#1f8a50}.e10 .op:nth-child(3){background:#ffe9d9}.e10 .op:nth-child(3) i{background:#a8571b}.e10 .op:nth-child(4){background:#e8e2ff}.e10 .op:nth-child(4) i{background:#5238c9}
.e10 .op.good{background:#2fb36b!important;color:#fff}.e10 .op.bad{background:#ff6b6b!important;color:#fff;animation:e10sh .35s}.e10 .op.off{opacity:.3;pointer-events:none}.e10 .op[disabled]{pointer-events:none}@keyframes e10sh{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.e10 .tools{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}.e10 .tools button{color:#2a2140;border:2px solid #e3d9ef;background:#fff;border-radius:12px;padding:5px 12px;font:700 .9rem inherit;cursor:pointer}.e10 .fb{margin-top:10px;padding:8px 12px;border-radius:12px;font-weight:700;text-align:left}.e10 .fb.ok{background:#dcf7e6;color:#1a6b3e}.e10 .fb.no{background:#ffe3e3;color:#a02a2a}
.e10 .arena{position:absolute;inset:0}.e10 .fgt{position:absolute;bottom:34%;width:min(24vw,210px)}.e10 .fgt svg{width:100%;height:auto;display:block;filter:drop-shadow(0 8px 6px #0004);animation:e10bob 2s ease-in-out infinite}.e10 .fgt.l{left:18%}.e10 .fgt.r{right:18%}@keyframes e10bob{50%{transform:translateY(-8px)}}
.e10 .fgt.hit svg{animation:e10hit .5s}.e10 .fgt.atk{animation:e10atk .5s}@keyframes e10hit{20%{transform:translateX(14px) rotate(6deg);filter:brightness(2) drop-shadow(0 0 10px #fff)}60%{transform:translateX(-8px)}}@keyframes e10atk{40%{transform:translateX(26vw)}}.e10 .fgt.dead svg{animation:e10die 1s forwards}@keyframes e10die{to{transform:translateY(-90px) rotate(200deg) scale(.1);opacity:0}}
.e10 .crown{position:absolute;width:46%;left:27%;top:-18%}.e10 .nm{position:absolute;left:50%;transform:translateX(-50%);bottom:-34px;background:#fffffff0;border-radius:99px;padding:1px 12px;font-weight:800;font-size:.85rem;white-space:nowrap;box-shadow:0 2px 8px #0003}
.e10 .vs{position:absolute;left:50%;bottom:48%;transform:translateX(-50%);width:50px;height:50px;border-radius:50%;background:#ffc83d;border:3px solid #fff;display:grid;place-items:center;font-weight:900;box-shadow:0 3px 10px #0004}.e10 .bname{position:absolute;top:88px;left:50%;transform:translateX(-50%);text-align:center}.e10 .bname span{display:block;font-size:.75rem;letter-spacing:.12em;font-weight:800;background:#ffffffc0;border-radius:99px;padding:0 10px;margin:0 auto 2px;width:max-content}.e10 .bname b{background:#fffffff0;border-radius:12px;padding:2px 14px;font-size:1.5rem;box-shadow:0 3px 10px #0003}
.e10 .hp{position:absolute;right:6%;bottom:34%;background:#fffffff0;border-radius:12px;padding:6px 12px;box-shadow:0 3px 10px #0003;min-width:150px;font-weight:700;font-size:.85rem}.e10 .hp .bars{display:flex;gap:4px;margin-top:3px}.e10 .hp .bars i{flex:1;height:8px;border-radius:5px;background:#ff7aa8}.e10 .hp .bars i.gone{background:#e4dcf1}
.e10 .panel{position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:min(960px,100%);background:#fffffff2;border-radius:22px 22px 0 0;padding:14px 20px 16px;box-shadow:0 -6px 30px #0004;z-index:6;text-align:left}.e10 .panel .stem{text-align:left;margin:2px 0 10px;font-size:clamp(1.15rem,2.6vw,1.6rem)}.e10 .panel small{font-weight:800;letter-spacing:.08em;font-size:.72rem;color:#5a4f78}.e10 .panel .ops{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}.e10 .combo{background:#ffe9d9;border-radius:12px;padding:3px 12px;font-weight:800;font-size:.85rem;color:#c8571b}
.e10 .eres{max-width:820px;margin:0 auto;padding:16px 16px 60px;text-align:center;position:relative}.e10 .eres h2{font-size:2rem;margin:6px 0 0}.e10 .stats{background:#fff;border-radius:22px;padding:16px;box-shadow:0 6px 20px #5a35c41f;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.e10 .stats div{border-radius:14px;padding:8px 12px;text-align:left}.e10 .stats small{display:block;font-weight:800;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase}.e10 .stats b{font-size:1.7rem}.e10 .mono{font-family:ui-monospace,Menlo,monospace;background:#efe9ff;border-radius:8px;padding:1px 8px;font-weight:700}
.e10 .conf i{position:fixed;top:-20px;width:10px;height:16px;animation:e10c 3.2s linear infinite;z-index:1;pointer-events:none}@keyframes e10c{to{transform:translateY(110vh) rotate(720deg)}}
.e10 .box{max-width:760px;margin:0 auto;padding:6px 16px 50px}.e10 .tabs{display:flex;gap:6px;margin:8px 0 14px;flex-wrap:wrap}.e10 .tabs button{color:#2a2140;border:2px solid #e3d9ef;background:#fff;border-radius:12px;padding:7px 14px;font:700 .95rem inherit;cursor:pointer}.e10 .tabs button.on{background:#7c4dff;color:#fff;border-color:#7c4dff}.e10 .card{background:#fff;border-radius:18px;padding:16px;box-shadow:0 4px 14px #5a35c41a;margin-bottom:12px}.e10 label{display:block;font-weight:700;margin:8px 0 3px;color:#2a2140}.e10 .link{word-break:break-all;background:#efe9ff;border-radius:10px;padding:8px 10px;font:12px ui-monospace,monospace;margin:8px 0}.e10 .err{color:#c0392b;font-size:.9rem}.e10 .okk{color:#1f8a50;font-weight:700}
@media(max-width:700px){.e10 .ops{grid-template-columns:1fr}.e10 .panel .ops{grid-template-columns:1fr 1fr;gap:8px}.e10 .panel .op{padding:8px 10px;font-size:1rem}.e10 .panel .op i{flex-basis:26px;height:26px}.e10 .panel{max-height:56vh;overflow:auto;padding:10px 14px 12px}.e10 .panel .estem,.e10 .panel .stem{font-size:1.1rem;margin:2px 0 8px}.e10 .fgt{width:30vw;bottom:58%}.e10 .fgt.l{left:6%}.e10 .fgt.r{right:6%}.e10 .hp{right:3%;bottom:66%;min-width:110px;font-size:.75rem}.e10 .vs{bottom:66%;width:40px;height:40px}.e10 .prog{top:56px;max-width:92vw}.e10 .bname{top:126px}.e10 .bname b{font-size:1.2rem}.e10 .map{height:56%}.e10 .stats{grid-template-columns:1fr 1fr}.e10 .tools button{font-size:.8rem;padding:4px 8px}.e10 .fb{font-size:.85rem;padding:6px 10px}}
</style><div class="e10">${SYMBOLS}<div class="view"></div></div>`;
      const root = el.querySelector('.e10'), V = el.querySelector('.view'), $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
      const snd = k => { try { const A = GV._ac || (GV._ac = new (window.AudioContext || window.webkitAudioContext)()), t = A.currentTime, notes = { ok: [[660, 0], [880, .09]], no: [[200, 0], [150, .12]], win: [[523, 0], [659, .12], [784, .24], [1047, .36]], coin: [[1200, 0]] }[k]; notes.forEach(([f, d]) => { const o = A.createOscillator(), g = A.createGain(); o.type = k === 'no' ? 'sawtooth' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.001, t + d); g.gain.exponentialRampToValueAtTime(.12, t + d + .02); g.gain.exponentialRampToValueAtTime(.001, t + d + .22); o.connect(g); g.connect(A.destination); o.start(t + d); o.stop(t + d + .25); }); } catch (e) {} };
      const toast = m => GV.toast ? GV.toast(m, { type: 'info' }) : alert(m);
      const link = (kind, v) => location.href.replace(/#.*$/, '') + '#/game/english10/' + kind + '/' + v;

      /* ================= THƯ VIỆN ================= */
      let filter = 'Tất cả';
      function home() {
        clearInterval(timer); G = null; const cats = ['Tất cả', ...new Set(SETS().map(s => s.cat))]; if (ST.my.length) cats.push('Đề của tôi');
        const list = filter === 'Đề của tôi' ? ST.my : SETS().filter(s => filter === 'Tất cả' || s.cat === filter);
        V.innerHTML = `<div class="etop"><button class="ex" data-x title="Thoát về OmniHub">✕</button><h1>🦖 Phiêu lưu Tiếng Anh 10</h1><button class="btn w" data-t>👩‍🏫 Dành cho thầy cô</button></div>
          <div class="hero"><svg viewBox="0 0 100 124"><use href="#e10hero"/></svg><div><h2>Học tiếng Anh như đi phiêu lưu!</h2><p>Trả lời câu hỏi để vượt qua các chặng đường, đánh bại quái vật và nhận chứng chỉ hoàn thành. ${SETS().length} bộ đề (${SETS().reduce((a, s) => a + s.q.length, 0)} câu) bám chương trình Tiếng Anh 10.</p>
          <label style="margin:0 0 4px">Tên của con</label><div style="display:flex;gap:8px;flex-wrap:wrap;max-width:420px"><input id="nm" maxlength="24" placeholder="Ví dụ: An" value="${esc(ST.name)}" style="flex:1;min-width:150px"><button class="btn g" data-rand>🎲 Chơi ngẫu nhiên</button></div></div></div>
          <div class="chips">${cats.map(c => `<button class="${c === filter ? 'on' : ''}" data-f="${esc(c)}">${esc(c)}</button>`).join('')}</div>
          <div class="grid">${list.map(s => { const b = ST.best[s.id]; return `<button class="set" data-s="${esc(s.id)}"><span class="ic">${s.ic}</span>${b !== undefined ? `<span class="st">⭐ ${b}/${s.q.length}</span>` : ''}<b>${esc(s.t)}</b><small>${s.q.length} câu${s.lv ? ' · ' + s.lv : ''} · ${esc(s.cat)}</small></button>`; }).join('') || '<p style="padding:0 16px">Chưa có đề nào.</p>'}</div>`;
        $('[data-x]').onclick = () => { location.hash = '#/'; }; $('[data-t]').onclick = teacher;
        $$('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; home(); });
        const nm = $('#nm'); nm.oninput = () => { ST.name = nm.value.trim(); save(); };
        const find = id => SETS().find(s => s.id === id) || ST.my.find(s => s.id === id);
        $$('[data-s]').forEach(b => b.onclick = () => start(find(b.dataset.s)));
        $('[data-rand]').onclick = () => { const a = SETS(); start(a[Math.floor(Math.random() * a.length)]); };
      }
      const getSet = s => s.q && s.q[0] && s.q[0].s !== undefined ? s : libSet(s);

      /* ================= GIAO DIỆN THẦY CÔ ================= */
      function teacher(tab) {
        tab = typeof tab === 'string' ? tab : 'lib';
        V.innerHTML = `<div class="etop"><button class="ex" data-b title="Về thư viện">‹</button><h1>👩‍🏫 Dành cho thầy cô</h1></div><div class="box"><div class="tabs"><button data-tb="lib" class="${tab === 'lib' ? 'on' : ''}">Giao bài từ thư viện</button><button data-tb="mk" class="${tab === 'mk' ? 'on' : ''}">Tạo bộ đề riêng</button><button data-tb="vf" class="${tab === 'vf' ? 'on' : ''}">Kiểm tra mã hoàn thành</button></div><div id="tbody"></div></div>`;
        $('[data-b]').onclick = home; $$('[data-tb]').forEach(b => b.onclick = () => teacher(b.dataset.tb));
        const body = $('#tbody');
        if (tab === 'lib') {
          body.innerHTML = `<div class="card"><p>Chọn bộ đề, sao chép link gửi học sinh qua Zalo/Messenger. Học sinh mở link là chơi ngay, không cần tài khoản; chơi xong các em lưu chứng chỉ và gửi lại cho thầy cô.</p><label>Bộ đề</label><select id="ls">${SETS().map(s => `<option value="${s.id}">${esc(s.t)} (${s.q.length} câu)</option>`).join('')}</select><div class="link" id="lk"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn g" id="cp">📋 Sao chép link</button><button class="btn w" id="try">▶ Chơi thử</button><button class="btn w" id="rv">👁 Xem đề & đáp án</button></div><div id="rvb"></div></div>`;
          const upd = () => { $('#lk').textContent = link('s', $('#ls').value); }; upd(); $('#ls').onchange = upd;
          $('#cp').onclick = () => { navigator.clipboard.writeText($('#lk').textContent).then(() => toast('Đã sao chép link giao bài'), () => toast('Hãy chọn và sao chép link thủ công')); };
          $('#try').onclick = () => start(libSet(SETS().find(s => s.id === $('#ls').value)));
          $('#rv').onclick = () => { const s = SETS().find(x => x.id === $('#ls').value); $('#rvb').innerHTML = '<ol style="padding-left:20px;line-height:1.5">' + s.q.map(q => `<li>${esc(q[0])}<br><b style="color:#1f8a50">✔ ${esc(q[1])}</b> <small style="color:#7d7391">(${esc(q.slice(2, 5).join(' / '))})</small></li>`).join('') + '</ol>'; };
        } else if (tab === 'mk') {
          body.innerHTML = `<div class="card"><label>Tên bộ đề</label><input id="mt" maxlength="60" placeholder="Ví dụ: Kiểm tra 15 phút – Unit 3"><label>Nhập câu hỏi (dán vào đây) hoặc tải tệp .txt / .csv / .json</label><textarea id="mx" rows="12" placeholder="Q: Câu hỏi có ___ chỗ trống\nA) đáp án 1\nB) đáp án 2\nC) đáp án 3\nD) đáp án 4\nANS: B"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><input type="file" id="mf" accept=".txt,.csv,.tsv,.json" style="flex:1;min-width:200px"><button class="btn w" id="sm">Điền đề mẫu</button></div>
            <p style="font-size:.9rem;color:#7d7391;margin:4px 0">Định dạng: mỗi câu gồm dòng <b>Q:</b> (hoặc Câu 1:), các đáp án <b>A) B) C) D)</b> (2–4 đáp án), dòng <b>ANS: B</b>, có thể thêm dòng <b>Giải thích:</b>. Hoặc bảng CSV: câu hỏi, A, B, C, D, đáp án, giải thích. Tối đa 40 câu.</p><div id="pv"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn g" id="mk" disabled>🎮 Tạo game & lấy link</button><button class="btn w" id="pl" disabled>▶ Chơi thử</button></div><div id="out"></div></div>`;
          let cur = null; const chk = () => { const r = parseSet($('#mx').value); cur = r; const ok = r.q.length > 0; $('#pv').innerHTML = `<p class="${ok ? 'okk' : 'err'}">${ok ? `✔ Đọc được ${r.q.length} câu hỏi.` : 'Chưa đọc được câu hỏi nào.'}</p>` + (r.errs.length ? `<div class="err">${r.errs.slice(0, 6).map(esc).join('<br>')}${r.errs.length > 6 ? '<br>…' : ''}</div>` : ''); $('#mk').disabled = $('#pl').disabled = !ok || r.q.length > 40; if (r.q.length > 40) $('#pv').innerHTML += '<p class="err">Tối đa 40 câu mỗi bộ đề.</p>'; };
          $('#mx').oninput = chk; $('#sm').onclick = () => { $('#mx').value = SAMPLE; $('#mt').value = $('#mt').value || 'Đề mẫu'; chk(); };
          $('#mf').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#mx').value = r.result; if (!$('#mt').value) $('#mt').value = f.name.replace(/\.[^.]+$/, ''); chk(); }; r.readAsText(f, 'utf-8'); };
          const build = () => ({ id: 'c' + h53(JSON.stringify(cur.q)).toString(36), t: ($('#mt').value.trim() || 'Bộ đề của thầy cô').slice(0, 80), ic: '✏️', cat: 'Đề của tôi', lv: '', q: cur.q, custom: true });
          $('#pl').onclick = () => start(build());
          $('#mk').onclick = async () => { const set = build(), p = await encodeSet(set), url = link('c', p); ST.my = [set, ...ST.my.filter(x => x.id !== set.id)].slice(0, 20); save(); $('#out').innerHTML = `<p class="okk">✔ Đã tạo game "${esc(set.t)}" (${set.q.length} câu). Gửi link này cho học sinh:</p><div class="link">${esc(url)}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn g" id="cc">📋 Sao chép link</button></div><p style="font-size:.85rem;color:#7d7391">Link dài ${url.length} ký tự (đề nằm trong link). Nếu Zalo/Messenger cắt link, hãy giảm bớt số câu. Đề đã lưu trong mục "Đề của tôi" trên máy này.</p>`; $('#cc').onclick = () => navigator.clipboard.writeText(url).then(() => toast('Đã sao chép link'), () => toast('Hãy sao chép link thủ công')); };
        } else {
          body.innerHTML = `<div class="card"><p>Nhập thông tin trên chứng chỉ học sinh gửi để kiểm tra mã hoàn thành có khớp không.</p><label>Tên học sinh</label><input id="vn"><label>Mã bài (Adventure ID)</label><input id="va" placeholder="XXXX-XXXX"><div style="display:flex;gap:8px"><div style="flex:1"><label>Điểm</label><input id="vs" type="number" min="0"></div><div style="flex:1"><label>Số câu</label><input id="vq" type="number" min="1" value="10"></div></div><label>Mã hoàn thành</label><input id="vc" placeholder="XXXX-XXXX"><p><button class="btn g" id="vb">Kiểm tra</button></p><div id="vr"></div><p style="font-size:.85rem;color:#7d7391">Mã chỉ là cách chống gian lận cơ bản: học sinh am hiểu kỹ thuật vẫn có thể tự tính. Với bài quan trọng, hãy đối chiếu thêm.</p></div>`;
          $('#vb').onclick = () => { const exp = finCode($('#va').value.trim().toUpperCase(), $('#vn').value, +$('#vs').value, +$('#vq').value); const ok = exp === $('#vc').value.trim().toUpperCase(); $('#vr').innerHTML = ok ? '<p class="okk">✔ Mã khớp: kết quả hợp lệ.</p>' : '<p class="err">✘ Mã KHÔNG khớp (sai tên/điểm/mã bài hoặc kết quả bị chỉnh sửa).</p>'; };
        }
      }

      /* ================= CHƠI ================= */
      function plan(n) {
        const st = []; let k = n >= 8 ? 3 : n >= 5 ? 2 : 0, mid = n >= 7 ? 2 : 0, pathEnd = n - k;
        if (!k) return [{ t: 'path', a: 0, b: n }];
        const ms = mid ? Math.max(1, Math.floor((pathEnd - mid) / 2) + 0) : -1;
        if (mid && ms + mid <= pathEnd) { if (ms > 0) st.push({ t: 'path', a: 0, b: ms }); st.push({ t: 'boss', a: ms, b: ms + mid, fin: false }); if (ms + mid < pathEnd) st.push({ t: 'path', a: ms + mid, b: pathEnd }); } else st.push({ t: 'path', a: 0, b: pathEnd });
        st.push({ t: 'boss', a: pathEnd, b: n, fin: true }); return st;
      }
      function start(set) {
        set = getSet(set); if (!set || !set.q.length) return;
        if (!ST.name) { askName(() => start(set)); return; }
        const qs = shuffle(set.q).slice(0, 40).map(q => ({ s: q.s, r: q.r, e: q.e, o: shuffle([q.r, ...q.w]) }));
        const th = Math.abs(h53(set.id)) % 3;
        G = { set, qs, n: qs.length, i: 0, hearts: 3, coins: 0, stars: 0, correct: 0, combo: 0, monsters: 0, secs: 0, theme: th, stages: plan(qs.length), res: [], hint: false, busy: false, paused: false, aid: advId(set), hinted: new Set() };
        clearInterval(timer); timer = setInterval(() => { if (G && !G.paused && !G.busy && !dead) G.secs++; }, 1000);
        play();
      }
      function askName(then) {
        V.innerHTML = `<div class="etop"><button class="ex" data-b>‹</button><h1>Tên của con là gì?</h1></div><div class="box"><div class="card"><p>Tên sẽ được in trên chứng chỉ hoàn thành.</p><input id="an" maxlength="24" placeholder="Ví dụ: An" autofocus><p><button class="btn g" id="go">Bắt đầu phiêu lưu 🚀</button></p></div></div>`;
        $('[data-b]').onclick = home; const go = () => { const v = $('#an').value.trim(); if (!v) { $('#an').focus(); return; } ST.name = v; save(); then(); }; $('#go').onclick = go; $('#an').onkeydown = e => { if (e.key === 'Enter') go(); };
      }
      const stageOf = i => G.stages.find(s => i >= s.a && i < s.b);
      const win = () => G.n <= 12 ? [0, G.n] : (a => [a, a + 12])(Math.min(Math.max(0, G.i - 4), G.n - 12));
      function nodePos(k, n) { const x = 90 + (n === 1 ? 410 : k * (820 / (n - 1))); return [x, 210 + 55 * Math.sin(k * 1.05 + .4) - (k % 2 ? 8 : 0)]; }
      function hud() {
        const r = G.res, segs = Array.from({ length: G.n }, (_, i) => `<i class="${r[i] === 1 ? 'ok' : r[i] === 0 ? 'no' : i === G.i ? 'cur' : ''}"></i>`).join('');
        return `<div class="hud"><button class="ex" data-pause title="Tạm dừng">❚❚</button><div class="epill" id="hearts">${[0, 1, 2].map(i => heart(i < G.hearts)).join('')}</div><div class="prog"><small>${esc(THEMES[G.theme].n)} &nbsp; ${Math.min(G.i + 1, G.n)} / ${G.n}</small><div class="seg">${segs}<b>👑</b></div></div><div style="flex:1"></div><div class="epill" id="coins">🪙 ${G.coins}</div><div class="epill" id="stars">⭐ ${G.stars}</div></div>`;
      }
      function play() {
        if (!G || dead) return; const st = stageOf(G.i), th = THEMES[G.theme];
        if (st.t === 'path') {
          const [wa, wb] = win(), pts = Array.from({ length: wb - wa }, (_, k) => nodePos(k, wb - wa)), d = pts.map((p, k) => (k ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
          const bossIdx = new Set(G.stages.filter(s => s.t === 'boss').flatMap(s => Array.from({ length: s.b - s.a }, (_, k) => s.a + k)));
          const hp = pts[G.i - wa];
          V.innerHTML = `<div class="scene">${th.bg()}${hud()}<div class="map"><svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMax meet"><path d="${d}" fill="none" stroke="#e9d9c4" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/><path d="${d}" fill="none" stroke="#d3bda2" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 70" opacity=".8"/>
            ${pts.map((p, k) => `<g transform="translate(${p[0]} ${p[1]})"><ellipse cy="12" rx="38" ry="14" fill="#00000030"/><ellipse rx="36" ry="22" fill="${k + wa < G.i ? '#2fb36b' : k + wa === G.i ? '#f5b73a' : '#b2a6d6'}"/><ellipse cy="-5" rx="36" ry="22" fill="${k + wa < G.i ? '#57d28e' : k + wa === G.i ? '#ffd761' : '#cdc3ec'}"/><text y="${bossIdx.has(k + wa) ? 9 : 10}" text-anchor="middle" font-size="${bossIdx.has(k + wa) ? 28 : 26}" font-weight="900" fill="#fff" stroke="#00000033" stroke-width="1">${k + wa < G.i ? '✓' : bossIdx.has(k + wa) ? '👾' : k + wa + 1}</text></g>`).join('')}
            <g class="nd" id="hero" style="transform:translate(${hp[0] - 34}px,${hp[1] - 118}px)"><svg width="68" height="82" viewBox="0 0 100 124"><use href="#e10hero"/></svg></g></svg></div><div class="modal clear" id="md"></div></div>`;
          hookHud(); later(question, 450);
        } else {
          const bi = st.fin ? th.fin : th.mini;
          V.innerHTML = `<div class="scene">${th.bg()}${hud()}<div class="arena"><div class="bname"><span>${st.fin ? 'BOSS CUỐI' : 'MINI BOSS'}</span><b>${esc(bi[1])}</b></div><div class="fgt l" id="fh"><svg viewBox="0 0 100 124"><use href="#e10hero"/></svg><span class="nm">${esc(ST.name)}</span></div><div class="vs">VS</div><div class="fgt r" id="fb" style="${st.fin ? 'width:min(30vw,260px)' : ''}"><svg viewBox="0 0 120 130"><use href="#${bi[0]}"/></svg>${st.fin ? '<svg class="crown" viewBox="0 0 60 36"><use href="#e10crown"/></svg>' : ''}</div><div class="hp" id="hpb"></div></div><div class="panel" id="pn"></div></div>`;
          hookHud(); G.bossLeft = st.b - st.a; later(question, 400);
        }
      }
      function hookHud() {
        $('[data-pause]').onclick = pause;
      }
      function refreshHud() {
        const h = $('#hearts'); if (h) h.innerHTML = [0, 1, 2].map(i => heart(i < G.hearts)).join(''); const c = $('#coins'); if (c) c.textContent = '🪙 ' + G.coins; const s = $('#stars'); if (s) s.textContent = '⭐ ' + G.stars;
        const seg = $('.seg'); if (seg) seg.innerHTML = Array.from({ length: G.n }, (_, i) => `<i class="${G.res[i] === 1 ? 'ok' : G.res[i] === 0 ? 'no' : i === G.i ? 'cur' : ''}"></i>`).join('') + '<b>👑</b>';
        const pr = $('.prog small'); if (pr) pr.innerHTML = `${esc(THEMES[G.theme].n)} &nbsp; ${Math.min(G.i + 1, G.n)} / ${G.n}`;
      }
      function question() {
        if (!G || dead) return; const q = G.qs[G.i], st = stageOf(G.i), boss = st.t === 'boss'; G.busy = false; G.locked = false; if (boss) ['#fh', '#fb'].forEach(x => { const e = $(x); e && e.classList.remove('atk', 'hit'); });
        const stem = esc(q.s).replace(/_{2,}/g, '<u>&nbsp;</u>');
        const hp = $('#hpb'); if (hp) { const left = st.b - G.i; hp.innerHTML = `Số câu còn lại <span style="float:right;color:#d94a7c">${left} / ${st.b - st.a}</span><div class="bars">${Array.from({ length: st.b - st.a }, (_, k) => `<i class="${k < st.b - st.a - left ? 'gone' : ''}"></i>`).join('')}</div>`; }
        const html = `${boss ? `<small>CÒN ${st.b - G.i} CÂU ĐỂ MỞ ĐƯỜNG</small>` : `<span class="tag">🚩 Chặng ${G.i + 1} / ${G.n}</span>`}<div class="stem">${stem}</div><div class="ops">${q.o.map((o, i) => `<button class="op" data-i="${i}"><i>${L[i]}</i><span>${esc(o)}</span></button>`).join('')}</div><div class="tools"><button data-say>🔊 Đọc cho con nghe</button><button data-hint>💡 Gợi ý (−5 🪙)</button>${G.combo >= 2 ? `<span class="combo">🔥 Chuỗi ×${G.combo}</span>` : ''}</div><div id="fbk"></div>`;
        if (boss) $('#pn').innerHTML = html; else $('#md').innerHTML = `<div class="qcard">${html}</div>`;
        $$('.op').forEach(b => b.onclick = () => answer(+b.dataset.i)); $('[data-say]').onclick = () => say(q); $('[data-hint]').onclick = hint;
      }
      function say(q) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(q.s.replace(/_{2,}/g, 'blank') + '. ' + q.o.map((o, i) => L[i] + '. ' + o).join('. ')); u.lang = 'en-US'; u.rate = .85; speechSynthesis.speak(u); } catch (e) { toast('Trình duyệt chưa hỗ trợ đọc.'); } }
      function hint() {
        if (G.locked) return; const q = G.qs[G.i]; if (G.hinted.has(G.i)) return toast('Câu này đã dùng gợi ý rồi'); if (G.coins < 5) return toast('Cần 5 xu để xin gợi ý'); G.coins -= 5; G.hinted.add(G.i);
        const wrong = $$('.op').filter(b => q.o[+b.dataset.i] !== q.r); shuffle(wrong).slice(0, Math.min(2, wrong.length - 0)).forEach(b => b.classList.add('off')); refreshHud(); snd('coin');
      }
      function answer(i) {
        if (G.locked) return; G.locked = true; const q = G.qs[G.i], st = stageOf(G.i), boss = st.t === 'boss', right = q.o[i] === q.r; try { window.speechSynthesis.cancel(); } catch (e) {}
        $$('.op').forEach(b => { const v = q.o[+b.dataset.i]; if (v === q.r) b.classList.add('good'); else if (+b.dataset.i === i) b.classList.add('bad'); b.disabled = true; });
        G.res[G.i] = right ? 1 : 0;
        if (right) { G.correct++; G.combo++; const gain = 10 + Math.min(G.combo - 1, 5) * 2; G.coins += gain; if (!G.hinted.has(G.i)) G.stars++; snd('ok'); if (boss) { G.monsters++; $('#fh').classList.add('atk'); later(() => { const b = $('#fb'); b && b.classList.add('hit'); }, 220); } $('#fbk').innerHTML = `<div class="fb ok">✔ Chính xác! +${gain} 🪙${q.e ? ' · ' + esc(q.e) : ''}</div>`; }
        else { G.combo = 0; G.hearts--; snd('no'); if (boss) { const h = $('#fh'); h && h.classList.add('hit'); } $('#fbk').innerHTML = `<div class="fb no">✘ Đáp án đúng: <b>${esc(q.r)}</b>${q.e ? '<br>' + esc(q.e) : ''}</div>`; }
        refreshHud(); G.busy = true;
        const wait = right ? 1100 : 2600;
        later(() => { if (!G) return; if (G.hearts <= 0) return over(); G.busy = false; advance(); }, wait);
      }
      function advance() {
        if (!G) return; const w0 = win(); G.i++; const prevStage = stageOf(G.i - 1); if (G.i >= G.n) { if (prevStage.t === 'boss') { const b = $('#fb'); b && $('#fb').parentNode && b.classList.add('dead'); } return later(finish, prevStage.t === 'boss' ? 1100 : 300); }
        const st = stageOf(G.i);
        if (prevStage === st) { if (st.t === 'path') { const w1 = win(); if (w1[0] !== w0[0]) { later(play, 500); return; } const p = nodePos(G.i - w1[0], w1[1] - w1[0]), h = $('#hero'), md = $('#md'); if (md) md.innerHTML = ''; if (h) h.style.transform = `translate(${p[0] - 34}px,${p[1] - 118}px)`; refreshHud(); later(question, 900); } else { refreshHud(); question(); } }
        else { if (prevStage.t === 'boss') { const b = $('#fb'); b && b.classList.add('dead'); later(play, 1100); } else later(play, 300); }
      }
      function over() {
        clearInterval(timer); const md = document.createElement('div'); md.className = 'modal'; md.innerHTML = `<div class="qcard"><div style="font-size:3rem">💔</div><h2 style="margin:0">Hết tim rồi!</h2><p>Đừng lo, ai cũng cần luyện thêm. Con muốn làm gì?</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${G.coins >= 30 ? '<button class="btn o" data-rv>🪙 30 xu: hồi 1 tim</button>' : ''}<button class="btn g" data-rt>🔁 Chơi lại</button><button class="btn w" data-hm>Về thư viện</button></div></div>`; $('.scene').appendChild(md);
        const rv = md.querySelector('[data-rv]'); if (rv) rv.onclick = () => { G.coins -= 30; G.hearts = 1; md.remove(); refreshHud(); G.busy = false; timer = setInterval(() => { if (G && !G.paused && !G.busy && !dead) G.secs++; }, 1000); advance(); };
        md.querySelector('[data-rt]').onclick = () => start(G.set); md.querySelector('[data-hm]').onclick = home;
      }
      function pause() {
        if (!G || G.paused) return; G.paused = true; const md = document.createElement('div'); md.className = 'modal'; md.style.zIndex = 20; md.innerHTML = `<div class="qcard"><h2 style="margin:0 0 8px">Tạm dừng</h2><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn g" data-c>▶ Tiếp tục</button><button class="btn w" data-h>Bỏ dở, về thư viện</button></div></div>`; $('.scene').appendChild(md);
        md.querySelector('[data-c]').onclick = () => { G.paused = false; md.remove(); }; md.querySelector('[data-h]').onclick = home;
      }

      /* ================= KẾT QUẢ & CHỨNG CHỈ ================= */
      function finish() {
        if (!G) return; clearInterval(timer); const r = G.correct / G.n, bd = badgeOf(r), code = finCode(G.aid, ST.name, G.correct, G.n);
        ST.best[G.set.id] = Math.max(ST.best[G.set.id] || 0, G.correct); save(); snd('win');
        const info = { name: ST.name, title: G.set.t, score: G.correct, n: G.n, secs: G.secs, coins: G.coins, stars: G.stars, badge: bd[1], emoji: bd[2], aid: G.aid, code, date: new Date().toLocaleDateString('vi-VN') };
        const cols = ['#ff6b8a', '#ffd34d', '#5ad1a3', '#6bb7ff', '#b58cff'];
        V.innerHTML = `<div class="conf">${Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${cols[i % 5]};animation-delay:${(i % 9) * .3}s"></i>`).join('')}</div><div class="eres"><svg viewBox="0 0 300 220" width="min(360px,80%)" style="display:block;margin:0 auto"><path d="M40 190q110 36 220 0v-14q-110 34-220 0z" fill="#9bc86a"/><rect x="80" y="86" width="140" height="90" rx="6" fill="#efe3c4"/><path d="M70 86 150 34l80 52z" fill="#2f8f8a"/><rect x="40" y="90" width="42" height="86" rx="4" fill="#e6d8b4"/><path d="M34 90 61 40l27 50z" fill="#2f8f8a"/><rect x="218" y="90" width="42" height="86" rx="4" fill="#e6d8b4"/><path d="M212 90l27-50 27 50z" fill="#2f8f8a"/><path d="M150 34V10" stroke="#8a5a2b" stroke-width="3"/><path d="M150 10l30 8-30 8z" fill="#ff8a6b"/><path d="M130 176v-34q20-24 40 0v34z" fill="#8a5a2b"/><g transform="translate(112 118) scale(.75)"><use href="#e10hero" width="100" height="124"/></g></svg>
          <h2>${r >= .5 ? 'Chúc mừng, ' : 'Cố gắng lên, '}${esc(ST.name)}!</h2><p style="margin:0;color:#6a5f84">Con đã hoàn thành cuộc phiêu lưu <b>${esc(G.set.t)}</b></p>
          <div class="stats"><div style="background:#dcf7e6"><small>Điểm</small><b>${G.correct}/${G.n}</b></div><div style="background:#dff1ff"><small>Thời gian</small><b>${fmtT(G.secs)}</b></div><div style="background:#fff0c9"><small>Xu</small><b>${G.coins}</b></div><div style="background:#fff0c9"><small>Sao</small><b>${G.stars}</b></div><div style="background:#ffe0ec"><small>Quái vật đã hạ</small><b>${G.monsters}</b></div><div style="background:#e8e2ff;display:flex;flex-direction:column;align-items:center;text-align:center"><span style="font-size:2rem">${bd[2]}</span><small style="text-transform:none">${bd[1]}</small></div></div>
          <p style="font-size:.9rem">Mã bài <span class="mono">${G.aid}</span> &nbsp; Mã hoàn thành <span class="mono">${code}</span><br><small style="color:#7d7391">Thầy cô có thể kiểm tra các mã này.</small></p>
          <p><button class="btn" id="snd">📤 Gửi kết quả cho thầy cô</button></p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn g" id="dc">⬇ Tải chứng chỉ</button><button class="btn w" id="pr">🖨 In</button><button class="btn w" id="pa">↻ Chơi lại</button><button class="btn w" id="hm">‹ Về thư viện</button></div>
          <details style="margin:16px 0;text-align:left"><summary style="cursor:pointer;font-weight:700">Xem lại đáp án (${G.n} câu)</summary><ol style="line-height:1.5">${G.qs.map((q, i) => `<li>${esc(q.s)} → <b style="color:${G.res[i] ? '#1f8a50' : '#c0392b'}">${esc(q.r)}</b>${G.res[i] ? ' ✔' : ' ✘'}${q.e ? `<br><small style="color:#7d7391">${esc(q.e)}</small>` : ''}</li>`).join('')}</ol></details></div>`;
        $('#hm').onclick = home; $('#pa').onclick = () => start(G.set);
        $('#snd').onclick = () => { const t = `Em ${info.name} đã hoàn thành "${info.title}": ${info.score}/${info.n} điểm, thời gian ${fmtT(info.secs)}. Mã bài ${info.aid}, mã hoàn thành ${info.code}.`; if (navigator.share) navigator.share({ text: t }).catch(() => {}); else navigator.clipboard.writeText(t).then(() => toast('Đã sao chép kết quả, dán vào Zalo/Messenger gửi thầy cô'), () => prompt('Sao chép kết quả:', t)); };
        const cert = () => { const c = document.createElement('canvas'); drawCert(c, info); return c; };
        $('#dc').onclick = () => cert().toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'chung-chi-' + info.name.replace(/\s+/g, '-') + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); });
        $('#pr').onclick = () => { const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'; document.body.appendChild(f); const d = f.contentDocument; d.open(); d.write(`<html><body style="margin:0"><img src="${cert().toDataURL('image/png')}" style="width:100%"></body></html>`); d.close(); setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 3000); }, 500); };
      }
      function drawCert(c, i) {
        c.width = 1200; c.height = 850; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 1200, 850); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#f1e6ff'); g.fillStyle = gr; g.fillRect(0, 0, 1200, 850);
        g.strokeStyle = '#7c4dff'; g.lineWidth = 10; g.strokeRect(30, 30, 1140, 790); g.strokeStyle = '#ffc83d'; g.lineWidth = 3; g.strokeRect(48, 48, 1104, 754);
        g.textAlign = 'center'; g.fillStyle = '#2a2140'; g.font = '800 62px "Baloo 2",Georgia,serif'; g.fillText('CHỨNG CHỈ HOÀN THÀNH', 600, 150); g.font = '30px "Baloo 2",Georgia,serif'; g.fillStyle = '#6a5f84'; g.fillText('Phiêu lưu Tiếng Anh 10 · trao cho', 600, 215);
        g.fillStyle = '#7c4dff'; g.font = '800 88px "Baloo 2",Georgia,serif'; g.fillText(i.name, 600, 320); g.fillStyle = '#2a2140'; g.font = '34px "Baloo 2",Georgia,serif'; g.fillText('đã hoàn thành bộ đề', 600, 385); g.font = '800 42px "Baloo 2",Georgia,serif'; g.fillText(i.title.length > 46 ? i.title.slice(0, 45) + '…' : i.title, 600, 445);
        g.font = '800 70px "Baloo 2",Georgia,serif'; g.fillStyle = '#1f8a50'; g.fillText(`${i.score}/${i.n} điểm`, 600, 545); g.font = '32px "Baloo 2",Georgia,serif'; g.fillStyle = '#6a5f84'; g.fillText(`${i.emoji} ${i.badge} · thời gian ${fmtT(i.secs)} · ${i.stars} sao`, 600, 600);
        g.font = '28px ui-monospace,Menlo,monospace'; g.fillStyle = '#2a2140'; g.fillText(`Mã bài ${i.aid}   ·   Mã hoàn thành ${i.code}`, 600, 700); g.font = '24px "Baloo 2",Georgia,serif'; g.fillStyle = '#7d7391'; g.fillText(`Ngày ${i.date} · OmniHub`, 600, 755);
      }

      /* ================= KHỞI ĐỘNG (link giao bài) ================= */
      const m = location.hash.match(/\/english10\/(s|c)\/([^/?#]+)/);
      if (m && m[1] === 's') { const s = SETS().find(x => x.id === m[2]); s ? start(libSet(s)) : home(); }
      else if (m && m[1] === 'c') { V.innerHTML = '<div class="etop"><h1>Đang mở bài tập…</h1></div>'; decodeSet(decodeURIComponent(m[2])).then(s => { if (!dead) start(s); }).catch(() => { if (!dead) { home(); toast('Link bài tập không hợp lệ hoặc bị cắt ngắn. Nhờ thầy cô gửi lại link.'); } }); }
      else home();
      const onKey = e => { if (!G || G.locked || !$('.op') || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return; const k = L.indexOf(e.key.toUpperCase()); const n = k >= 0 ? k : ('1234'.indexOf(e.key)); if (n >= 0 && $$('.op')[n] && !$$('.op')[n].classList.contains('off')) answer(n); };
      window.addEventListener('keydown', onKey);
      GV.e10T = { parseSet, plan, advId, finCode, encodeSet, decodeSet, start, get G() { return G; }, ST };
      return () => { dead = true; window.removeEventListener('keydown', onKey); clearInterval(timer); tmo.forEach(clearTimeout); try { speechSynthesis.cancel(); } catch (e) {} anc.forEach(([n, a, t]) => { n.style.animation = a; n.style.transform = t; }); };
    }
  });
})();
