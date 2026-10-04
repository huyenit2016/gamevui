// Đồ hoạ chibi vẽ bằng code (Canvas 2D): nhân vật, cây trồng, ô đất. Dùng chung cho Làng Nông Vui.
// Quy ước: toạ độ (x,y) là điểm chân / đáy gốc; đơn vị ~px ở tỉ lệ 1.
(function () {
  const OUT = '#5a3a2e', TAU = Math.PI * 2;
  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const shade = (h, k) => { const c = hex(h).map(v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)))); return 'rgb(' + c.join(',') + ')'; };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const fs = (c, fill, lw) => { c.fillStyle = fill; c.fill(); c.lineWidth = lw || 2; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); };
  const ell = (c, x, y, rx, ry, fill, lw) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); if (fill) fs(c, fill, lw); };
  const shadow = (c, x, y, rx, ry) => { c.fillStyle = 'rgba(40,30,10,.25)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };

  /* ===== nhân vật ===== */
  // opt: { skin, hair, hcol, top, tcol, pants, hat, acc } là giá trị đã giải mã (màu / id)
  function char(c, x, y, o, t, walking, s, dir, act) {
    s = s || 1; const ph = walking ? t * 12 : 0, sw = walking ? Math.sin(ph) : 0, bob = walking ? Math.abs(Math.sin(ph)) * 2.5 : Math.sin(t * 2.2) * .8;
    const blink = (t % 3.6) > 3.45, sq = walking ? 1 + Math.sin(ph * 2) * .03 : 1 + Math.sin(t * 2.2) * .012;
    c.save(); c.translate(x, y); c.scale(s * (dir < 0 ? -1 : 1), s);
    shadow(c, 0, 0, 17, 5.5);
    const skin = o.skin, skinD = shade(skin, -.12), hc = o.hcol, tc = o.tcol, pc = o.pants;
    const B = -bob; // nâng cả người khi bước
    // ba lô sau lưng
    if (o.acc === 'acc_bag') { rr(c, -20, -38 + B, 12, 20, 5); fs(c, '#a1745a'); rr(c, -19, -30 + B, 10, 7, 3); fs(c, '#c79a7b', 1.5); }
    // tóc sau
    if (o.hair === 'hair_long') { rr(c, -22, -66 + B, 44, 44, 16); fs(c, hc); }
    if (o.hair === 'hair_bun') { ell(c, 0, -80 + B, 9, 9, hc); }
    // chân
    [-1, 1].forEach(k => { const lx = k * 6, a = sw * k * 4; rr(c, lx - 4.5 + a, -15, 9, 15 + Math.max(0, -a * .5), 4); fs(c, pc); ell(c, lx + a, -1.5, 6, 3.6, '#7b4a36', 1.6); });
    // tay (sau thân)
    const armY = -31 + B; [-1, 1].forEach(k => { const a = (act ? (k > 0 ? -2.2 + Math.sin(t * 16) * .5 : 0) : sw * k * .55); c.save(); c.translate(k * 12.5, armY); c.rotate(a); rr(c, -3.6, -2, 7.2, 13, 3.6); fs(c, o.top === 'top_dress' || o.top === 'top_tee' || o.top === 'top_overall' ? tc : tc, 1.8); ell(c, 0, 11, 3.8, 3.8, skin, 1.6); c.restore(); });
    // thân
    c.save(); c.translate(0, -15 + B); c.scale(1, sq);
    if (o.top === 'top_dress') { c.beginPath(); c.moveTo(-10, -19); c.lineTo(10, -19); c.quadraticCurveTo(15, 0, 17, 3); c.lineTo(-17, 3); c.quadraticCurveTo(-15, 0, -10, -19); c.closePath(); fs(c, tc); c.strokeStyle = shade(tc, -.18); c.lineWidth = 1.5; c.beginPath(); c.moveTo(-14, -3); c.quadraticCurveTo(0, 2, 14, -3); c.stroke(); }
    else { rr(c, -11.5, -19, 23, 20, 8); fs(c, tc); if (o.top === 'top_overall') { rr(c, -11.5, -9, 23, 10, 6); fs(c, pc); [-1, 1].forEach(k => { rr(c, k * 6 - 2, -19, 4.5, 11, 2); fs(c, pc, 1.6); }); ell(c, 0, -5, 2.4, 2.4, '#ffd54f', 1.2); } }
    if (o.acc === 'acc_scarf') { rr(c, -12, -22, 24, 7, 3.5); fs(c, '#e04a4a', 1.8); rr(c, 4, -17, 6, 14, 3); fs(c, '#e04a4a', 1.8); }
    c.restore();
    // đầu
    const hy = -54 + B;
    c.save(); c.translate(0, hy); c.scale(1, sq === 1 ? 1 : 2 - sq);
    ell(c, -21, 3, 3.6, 4.6, skin, 1.8); ell(c, 21, 3, 3.6, 4.6, skin, 1.8);   // tai
    ell(c, 0, 0, 21.5, 19.5, skin, 2.2);                                          // mặt
    // tóc trước
    const hi = shade(hc, .28);
    if (o.hair === 'hair_short' || o.hair === 'hair_bun') { c.beginPath(); c.moveTo(-22, 1); c.bezierCurveTo(-24, -24, 24, -24, 22, 1); c.bezierCurveTo(17, -9, 9, -12, 2, -9); c.bezierCurveTo(-4, -13, -15, -9, -22, 1); c.closePath(); fs(c, hc, 2); c.strokeStyle = hi; c.lineWidth = 2.2; c.beginPath(); c.arc(0, -4, 15, Math.PI * 1.15, Math.PI * 1.45); c.stroke(); }
    else if (o.hair === 'hair_long') { c.beginPath(); c.moveTo(-23, 6); c.bezierCurveTo(-26, -26, 26, -26, 23, 6); c.lineTo(18, 6); c.bezierCurveTo(15, -8, 4, -10, 0, -8); c.bezierCurveTo(-5, -10, -15, -8, -18, 6); c.closePath(); fs(c, hc, 2); c.strokeStyle = hi; c.lineWidth = 2.2; c.beginPath(); c.arc(0, -4, 15, Math.PI * 1.15, Math.PI * 1.45); c.stroke(); }
    else if (o.hair === 'hair_spiky') { c.beginPath(); c.moveTo(-22, 2); c.lineTo(-24, -12); c.lineTo(-15, -14); c.lineTo(-13, -27); c.lineTo(-5, -17); c.lineTo(1, -30); c.lineTo(7, -17); c.lineTo(15, -27); c.lineTo(15, -14); c.lineTo(24, -12); c.lineTo(22, 2); c.bezierCurveTo(16, -8, 8, -10, 0, -7); c.bezierCurveTo(-8, -10, -16, -8, -22, 2); c.closePath(); fs(c, hc, 2); }
    // mắt
    const ex = dir === 0 ? 0 : 1.5;
    [-1, 1].forEach(k => { const px = k * 8 + ex, py = 4;
      if (blink) { c.strokeStyle = OUT; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.arc(px, py, 4.2, .15, Math.PI - .15); c.stroke(); }
      else { ell(c, px, py, 4.6, 6, '#3b2a24', 0); ell(c, px, py + 1.2, 3.2, 3.4, '#6b4a3a', 0); c.fillStyle = '#fff'; c.beginPath(); c.arc(px - 1.6, py - 2, 1.8, 0, TAU); c.fill(); c.beginPath(); c.arc(px + 1.4, py + 2.2, .9, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(255,120,120,.5)'; c.beginPath(); c.ellipse(k * 13.5 + ex, 11, 4.2, 2.6, 0, 0, TAU); c.fill();
    });
    c.strokeStyle = '#8d3b3b'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); c.arc(ex, 10, 3.2, .25, Math.PI - .25); c.stroke();
    if (o.acc === 'acc_glass') { rr(c, -14 + ex, -1, 12, 9, 3.5); fs(c, '#263238', 1.6); rr(c, 2 + ex, -1, 12, 9, 3.5); fs(c, '#263238', 1.6); c.fillStyle = '#ffffff55'; c.fillRect(-12 + ex, 0, 4, 2); c.fillRect(4 + ex, 0, 4, 2); }
    if (o.acc === 'acc_flower') { [0, 1, 2, 3, 4].forEach(i => ell(c, 14 + Math.cos(i * 1.256) * 4.2, -14 + Math.sin(i * 1.256) * 4.2, 3, 3, '#fff', 1.2)); ell(c, 14, -14, 2.6, 2.6, '#ffca28', 1.2); }
    // mũ
    hat(c, o.hat, hc);
    c.restore();
    c.restore();
  }
  function hat(c, id) {
    if (id === 'hat_cap') { c.beginPath(); c.moveTo(-22, -3); c.bezierCurveTo(-24, -30, 24, -30, 22, -3); c.closePath(); fs(c, '#e53935'); rr(c, -6, -9, 32, 6, 3); fs(c, '#b71c1c', 1.8); ell(c, 0, -22, 2.4, 2.4, '#ffcdd2', 1.2); }
    else if (id === 'hat_straw') { ell(c, 0, -12, 32, 9, '#f2d27a'); c.beginPath(); c.moveTo(-15, -12); c.bezierCurveTo(-17, -34, 17, -34, 15, -12); c.closePath(); fs(c, '#f7dd91'); rr(c, -15.5, -19, 31, 5, 2); fs(c, '#e57373', 1.5); }
    else if (id === 'hat_top') { ell(c, 0, -14, 25, 6.5, '#37474f'); rr(c, -14, -42, 28, 30, 4); fs(c, '#455a64'); rr(c, -14, -21, 28, 6, 1); fs(c, '#c62828', 1.6); }
    else if (id === 'hat_crown') { c.beginPath(); c.moveTo(-15, -14); c.lineTo(-17, -32); c.lineTo(-8, -23); c.lineTo(0, -35); c.lineTo(8, -23); c.lineTo(17, -32); c.lineTo(15, -14); c.closePath(); fs(c, '#ffca28'); ell(c, 0, -20, 2.8, 2.8, '#e53935', 1.2); ell(c, -9, -19, 2, 2, '#42a5f5', 1); ell(c, 9, -19, 2, 2, '#66bb6a', 1); }
  }

  /* ===== ô đất ===== */
  // wet: đã tưới; w,h kích thước ô
  function soil(c, x, y, w, h, wet, hover, t) {
    const base = wet ? '#6a4128' : '#8a5a3c';
    c.save(); c.translate(x, y);
    rr(c, 0, 4, w, h, 12); c.fillStyle = '#5a3a28'; c.fill();                 // đáy 3D
    rr(c, 0, 0, w, h, 12); c.fillStyle = base; c.fill();
    c.lineWidth = 2.2; c.strokeStyle = hover ? '#fff59d' : '#4a2f20'; c.stroke();
    c.save(); rr(c, 0, 0, w, h, 12); c.clip();
    for (let r = 0; r < 3; r++) { const yy = 11 + r * (h - 14) / 3; c.fillStyle = shade(base, -.16); c.fillRect(4, yy, w - 8, 5); c.fillStyle = shade(base, .12); c.fillRect(4, yy - 2.5, w - 8, 2.5); }
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, 0, w, 6);
    if (wet) { c.fillStyle = 'rgba(60,120,200,.07)'; c.fillRect(0, 0, w, h); }
    c.restore(); c.restore();
  }

  /* ===== cây trồng ===== */
  const LEAF = '#5fbf5a', LEAFD = '#3f9a45';
  const SPEC = {
    carrot: { k: 'root', f: '#ff8f33', l: LEAF }, rice: { k: 'grain', f: '#e6c85a', l: '#8fcf5a' }, corn: { k: 'stalk', f: '#ffd740', l: '#6bbf55' },
    tomato: { k: 'vine', f: '#ef4b3b', l: LEAF, r: 5 }, melon: { k: 'vine', f: '#4caf50', l: LEAF, r: 9, st: '#2e7d32' }, pumpkin: { k: 'vine', f: '#ff9a2e', l: LEAF, r: 9 },
    berry: { k: 'bush', f: '#ee3d5c', l: LEAF }, sunflower: { k: 'flower', f: '#ffc928', l: LEAF },
    apple: { k: 'tree', f: '#ee3d3d', l: '#58b955' }, orange: { k: 'tree', f: '#ff9f1c', l: '#4fae55' }, mango: { k: 'tree', f: '#ffb84d', l: '#4fae55' }
  };
  const leaf = (c, x, y, ang, len, col) => { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * .5, -len * .45, len, 0); c.quadraticCurveTo(len * .5, len * .45, 0, 0); fs(c, col || LEAF, 1.6); c.restore(); };
  // stage: 0 hạt, 1 mầm, 2 lớn, 3 chín. sway: góc lắc
  function crop(c, id, stage, x, y, t, sway, s) {
    const sp = SPEC[id] || SPEC.carrot; s = s || 1; sway = sway || 0;
    c.save(); c.translate(x, y); c.scale(s, s);
    if (stage === 0) { c.beginPath(); c.ellipse(0, -3, 9, 5, 0, Math.PI, 0); fs(c, '#7a4e33', 1.8); c.fillStyle = '#d7b98e'; c.beginPath(); c.arc(-2, -5, 1.4, 0, TAU); c.arc(3, -4, 1.2, 0, TAU); c.fill(); c.restore(); return; }
    const grow = stage === 1 ? .55 : stage === 2 ? .8 : 1;
    c.rotate(sway * (sp.k === 'tree' ? .3 : 1));
    c.scale(grow, grow);
    if (sp.k === 'tree') {
      rr(c, -4, -22, 8, 22, 3); fs(c, '#8a5a3c');
      ell(c, 0, -34, 24, 20, sp.l); ell(c, -13, -26, 13, 11, shade(sp.l, .08)); ell(c, 13, -27, 13, 11, shade(sp.l, .08)); ell(c, -6, -42, 9, 6, shade(sp.l, .3), 0);
      if (stage >= 3) [[-12, -30], [10, -37], [3, -24], [16, -26], [-4, -42]].forEach(([fx, fy]) => { ell(c, fx, fy, 4.6, 4.6, sp.f, 1.5); c.fillStyle = '#ffffff99'; c.beginPath(); c.arc(fx - 1.4, fy - 1.4, 1.2, 0, TAU); c.fill(); });
    } else if (sp.k === 'root') {
      [-.9, -.3, .3, .9].forEach((a, i) => leaf(c, 0, -4, -Math.PI / 2 + a * .8, 18 + i % 2 * 4, i % 2 ? LEAFD : LEAF));
      if (stage >= 3) { c.beginPath(); c.moveTo(-6, -4); c.quadraticCurveTo(0, 14, 0, 14); c.quadraticCurveTo(0, 14, 6, -4); c.closePath(); fs(c, sp.f, 1.8); c.strokeStyle = '#d96d1c'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-3, 1); c.lineTo(0, 1); c.moveTo(1, 6); c.lineTo(4, 6); c.stroke(); }
    } else if (sp.k === 'grain') {
      for (let i = -2; i <= 2; i++) { c.strokeStyle = shade(sp.l, -.1); c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(i * 3, 0); c.quadraticCurveTo(i * 5, -16, i * 8 + sway * 6, -30 + Math.abs(i) * 3); c.stroke(); if (stage >= 3) { ell(c, i * 8 + sway * 6, -33 + Math.abs(i) * 3, 2.6, 5.5, sp.f, 1.2); } }
    } else if (sp.k === 'stalk') {
      c.strokeStyle = shade(sp.l, -.15); c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -34); c.stroke(); c.strokeStyle = sp.l; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -34); c.stroke();
      [-1, 1].forEach((k, i) => { leaf(c, 0, -10 - i * 8, k > 0 ? -.5 : Math.PI + .5, 22, LEAF); });
      if (stage >= 3) [-1, 1].forEach(k => { c.save(); c.translate(k * 6, -20); c.rotate(k * .3); rr(c, -4.5, -10, 9, 20, 4.5); fs(c, sp.f, 1.6); c.strokeStyle = '#ffb300'; c.lineWidth = 1; c.beginPath(); c.moveTo(-1.5, -7); c.lineTo(-1.5, 7); c.moveTo(1.5, -7); c.lineTo(1.5, 7); c.stroke(); c.restore(); });
    } else if (sp.k === 'vine') {
      [-1, 1].forEach(k => { leaf(c, 0, -3, k > 0 ? -.35 : Math.PI + .35, 22, LEAF); leaf(c, 0, -3, k > 0 ? -1 : Math.PI + 1, 16, LEAFD); });
      if (stage >= 3) { const r = sp.r + 4; ell(c, 0, -r + 2, r + 2, r, sp.f); if (sp.st) { c.strokeStyle = '#2e7d32'; c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5, -r * 2 + 2); c.quadraticCurveTo(i * 8, -r, i * 5, 2); c.stroke(); } } else if (id === 'pumpkin') { c.strokeStyle = '#d97706'; c.lineWidth = 1.5; [-5, 5].forEach(v => { c.beginPath(); c.moveTo(v, -r * 2 + 3); c.quadraticCurveTo(v * 1.5, -r, v, 1); c.stroke(); }); } rr(c, -1.5, -r * 2, 3, 5, 1.5); fs(c, '#4e8f3a', 1.2); c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(-r * .4, -r * 1.2, 2, 0, TAU); c.fill(); }
    } else if (sp.k === 'bush') {
      ell(c, 0, -10, 15, 11, LEAF); ell(c, -9, -7, 9, 7, shade(LEAF, .1), 1.6); ell(c, 9, -7, 9, 7, shade(LEAF, .1), 1.6);
      if (stage >= 3) [[-8, -9], [5, -13], [9, -5], [-2, -4]].forEach(([fx, fy]) => { c.beginPath(); c.moveTo(fx - 3.5, fy - 3); c.quadraticCurveTo(fx, fy + 6, fx, fy + 6); c.quadraticCurveTo(fx, fy + 6, fx + 3.5, fy - 3); c.quadraticCurveTo(fx, fy - 5, fx - 3.5, fy - 3); fs(c, sp.f, 1.4); });
    } else if (sp.k === 'flower') {
      c.strokeStyle = '#3f8a3f'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -34); c.stroke(); leaf(c, 0, -12, -.4, 16, LEAF); leaf(c, 0, -20, Math.PI + .4, 14, LEAF);
      if (stage >= 3) { for (let i = 0; i < 10; i++) { c.save(); c.translate(0, -38); c.rotate(i * TAU / 10 + sway); ell(c, 0, -10, 3.6, 7, sp.f, 1.2); c.restore(); } ell(c, 0, -38, 7, 7, '#7b4a2a', 1.6); } else ell(c, 0, -36, 5, 5, '#8bc34a', 1.5);
    }
    c.restore();
  }
  /* ===== cảnh vật ===== */
  function house(c, x, y, s, night) {
    c.save(); c.translate(x, y); c.scale(s || 1, s || 1); shadow(c, 0, 0, 34, 7);
    rr(c, -26, -34, 52, 34, 5); fs(c, '#f6e3c0'); c.strokeStyle = '#d9c39a'; c.lineWidth = 1.2; for (let i = -18; i < 26; i += 10) { c.beginPath(); c.moveTo(i, -33); c.lineTo(i, -1); c.stroke(); }
    rr(c, 14, -52, 8, 16, 2); fs(c, '#b86a52');                                                          // ống khói
    c.beginPath(); c.moveTo(-34, -32); c.lineTo(0, -62); c.lineTo(34, -32); c.closePath(); fs(c, '#d8574a'); c.strokeStyle = '#b13f35'; c.lineWidth = 1.4; for (let i = -22; i <= 22; i += 11) { c.beginPath(); c.moveTo(i * .9, -34 - (30 - Math.abs(i)) * .0); c.lineTo(i * .45, -50); c.stroke(); }
    rr(c, -7, -22, 14, 22, 4); fs(c, '#8a5a3c'); ell(c, 3, -11, 1.4, 1.4, '#ffd54f', 0);
    [-17, 17].forEach(k => { rr(c, k - 5, -27, 10, 10, 2); fs(c, night ? '#ffe082' : '#a9dcf5', 1.6); c.strokeStyle = OUT; c.lineWidth = 1.2; c.beginPath(); c.moveTo(k, -27); c.lineTo(k, -17); c.moveTo(k - 5, -22); c.lineTo(k + 5, -22); c.stroke(); });
    c.restore();
  }
  function bigTree(c, x, y, s, sway) {
    c.save(); c.translate(x, y); c.scale(s || 1, s || 1); shadow(c, 0, 0, 22, 6);
    rr(c, -6, -34, 12, 34, 4); fs(c, '#8a5a3c'); c.rotate(sway || 0);
    ell(c, 0, -52, 28, 24, '#4fae55'); ell(c, -16, -42, 15, 13, '#5cc062'); ell(c, 16, -43, 15, 13, '#5cc062'); ell(c, -6, -62, 11, 7, '#8fdc88', 0);
    c.restore();
  }
  function fence(c, x, y, w) {
    c.save(); c.translate(x, y); c.strokeStyle = OUT; c.lineWidth = 1.6;
    rr(c, 0, -13, w, 4, 2); c.fillStyle = '#d8b07a'; c.fill(); c.stroke(); rr(c, 0, -6, w, 4, 2); c.fill(); c.stroke();
    for (let i = 0; i <= w; i += 18) { rr(c, i - 2.5, -18, 5, 20, 2); c.fillStyle = '#c99a62'; c.fill(); c.stroke(); }
    c.restore();
  }
  function locked(c, x, y, w, h) { c.save(); rr(c, x, y, w, h, 12); c.fillStyle = 'rgba(30,60,20,.28)'; c.fill(); c.setLineDash([5, 4]); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke(); c.restore(); }

  /* ===== xe bus, đường, bến xe, khu vui chơi ===== */
  // xe bus xanh trắng kiểu hoạt hình; (x,y) = điểm giữa đáy xe, dài ~150·s
  function bus(c, x, y, s, t, dir, door) {
    s = s || 1; c.save(); c.translate(x, y); c.scale(s * (dir < 0 ? -1 : 1), s);
    shadow(c, 0, 2, 78, 7);
    const bob = Math.sin(t * 22) * .6; c.translate(0, bob);
    rr(c, -74, -62, 148, 52, 12); fs(c, '#f4f8ff', 2.2);                       // thân trắng
    c.save(); rr(c, -74, -62, 148, 52, 12); c.clip(); c.fillStyle = '#1e88e5'; c.beginPath(); c.moveTo(-76, -22); c.quadraticCurveTo(-10, -30, 76, -14); c.lineTo(76, -8); c.lineTo(-76, -8); c.closePath(); c.fill(); c.fillStyle = '#90caf9'; c.fillRect(-76, -26, 152, 3.5); c.restore();
    rr(c, -74, -62, 148, 52, 12); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
    rr(c, -40, -68, 62, 8, 4); fs(c, '#eceff1', 1.6);                           // điều hoà mái
    for (let i = 0; i < 5; i++) { const wx = -64 + i * 22 + (i > 2 ? 14 : 0); rr(c, wx, -56, 18, 22, 4); fs(c, '#7fd0f5', 1.6); c.fillStyle = '#ffffff66'; c.fillRect(wx + 3, -53, 4, 8); }
    rr(c, 44, -56, 26, 34, 5); fs(c, '#7fd0f5', 1.6);                           // kính chắn gió
    const dw = door ? 12 : 17; rr(c, 20, -56, dw, 46, 3); fs(c, door ? '#263238' : '#90a4ae', 1.6); // cửa
    ell(c, 72, -17, 3.4, 3.4, '#ffe082', 1.4); ell(c, -72, -17, 2.8, 2.8, '#ef5350', 1.2); // đèn
    [-46, 40].forEach(wx => { ell(c, wx, -9, 13, 13, '#37474f', 2); ell(c, wx, -9, 6, 6, '#cfd8dc', 1.2); c.save(); c.translate(wx, -9); c.rotate(t * 14); c.strokeStyle = '#78909c'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.moveTo(0, -5); c.lineTo(0, 5); c.stroke(); c.restore(); });
    c.restore();
  }
  // dải đường + vỉa hè ở đáy cảnh. y0 = mép trên của đường
  function road(c, W, y0, t, scroll) {
    c.fillStyle = '#cfae7a'; c.fillRect(0, y0 - 12, W, 12); c.fillStyle = '#e1c895'; c.fillRect(0, y0 - 12, W, 3);
    c.fillStyle = '#6b6f78'; c.fillRect(0, y0, W, 50); c.fillStyle = '#7b8089'; c.fillRect(0, y0, W, 5);
    c.fillStyle = '#f5f1d8'; const off = (scroll || 0) % 44; for (let x = -44 + off; x < W; x += 44) c.fillRect(x, y0 + 24, 24, 3.5);
    c.fillStyle = '#4e5259'; c.fillRect(0, y0 + 50, W, 3);
  }
  function busStop(c, x, y, t, label) {
    c.save(); c.translate(x, y); shadow(c, 0, 0, 20, 5);
    rr(c, -3, -54, 6, 54, 2); fs(c, '#78909c', 1.6);
    rr(c, -17, -74, 34, 24, 8); fs(c, '#1e88e5', 2); c.fillStyle = '#fff'; c.font = '800 11px "Baloo 2",Roboto,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BUS', 0, -61);
    rr(c, 10, -20, 30, 6, 3); fs(c, '#d8b07a', 1.4); rr(c, 13, -14, 4, 14, 1.5); fs(c, '#8a5a3c', 1.2); rr(c, 33, -14, 4, 14, 1.5); fs(c, '#8a5a3c', 1.2);
    if (label) { rr(c, -34, 6, 68, 16, 8); fs(c, '#fffaf0', 1.6); c.fillStyle = '#6b4a2a'; c.font = '800 10px "Baloo 2",Roboto,sans-serif'; c.fillText(label, 0, 14.5); }
    c.restore();
  }
  function lamp(c, x, y, night) {
    c.save(); c.translate(x, y); shadow(c, 0, 0, 9, 3); rr(c, -2, -64, 4, 64, 2); fs(c, '#90a4ae', 1.4); rr(c, -9, -70, 18, 7, 3.5); fs(c, '#cfd8dc', 1.4);
    if (night) { const g = c.createRadialGradient(0, -64, 1, 0, -64, 34); g.addColorStop(0, 'rgba(255,240,170,.7)'); g.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = g; c.fillRect(-36, -100, 72, 72); }
    c.restore();
  }
  function sign(c, x, y, text, locked) {
    c.font = '800 12px "Baloo 2",Roboto,sans-serif'; const w = Math.max(56, c.measureText(text).width + 22 + (locked ? 14 : 0));
    c.save(); c.translate(x, y); rr(c, -w / 2, -11, w, 22, 9); fs(c, '#fff3d6', 2); c.fillStyle = locked ? '#9a7a58' : '#6b4a2a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText((locked ? '🔒 ' : '') + text, 0, 1); c.restore();
  }
  function fountain(c, x, y, t) {
    c.save(); c.translate(x, y); shadow(c, 0, 4, 34, 8);
    ell(c, 0, 0, 32, 12, '#cfd8dc'); ell(c, 0, -2, 27, 9, '#4fc3f7', 1.6); rr(c, -5, -26, 10, 24, 4); fs(c, '#b0bec5', 1.6); ell(c, 0, -27, 12, 4.5, '#cfd8dc', 1.6);
    c.strokeStyle = 'rgba(190,235,255,.9)'; c.lineWidth = 2.2; c.lineCap = 'round';
    for (let k = -2; k <= 2; k++) { const a = k * .38, ph = (t * 1.4 + k * .3) % 1; c.beginPath(); c.moveTo(0, -29); c.quadraticCurveTo(k * 11, -52 + Math.abs(k) * 5, k * 22, -6); c.stroke(); }
    c.fillStyle = '#e3f6ff'; for (let k = 0; k < 6; k++) { const ph = (t * 1.2 + k / 6) % 1; c.beginPath(); c.arc(-20 + k * 8, -4 - Math.sin(ph * 3.14) * 6, 1.6, 0, TAU); c.fill(); }
    c.restore();
  }
  // các điểm vui chơi (x,y = chân công trình)
  function pond(c, x, y, t) {
    c.save(); c.translate(x, y); ell(c, 0, -8, 46, 24, '#ccb27a', 2); ell(c, 0, -9, 41, 20, '#3fb4f0', 0);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6; for (let k = 0; k < 3; k++) { const ph = (t * .5 + k / 3) % 1; c.beginPath(); c.ellipse(-8 + k * 10, -8 + (k % 2) * 4, 5 + ph * 12, 2 + ph * 5, 0, 0, TAU); c.globalAlpha = 1 - ph; c.stroke(); c.globalAlpha = 1; }
    c.save(); c.translate(10, -12 + Math.sin(t * 1.6) * 1.5); c.rotate(Math.sin(t * 1.2) * .05); c.beginPath(); c.moveTo(-16, 0); c.lineTo(16, 0); c.lineTo(11, 8); c.lineTo(-11, 8); c.closePath(); fs(c, '#c58a4a', 1.8); c.strokeStyle = OUT; c.lineWidth = 1.8; c.beginPath(); c.moveTo(2, 0); c.lineTo(2, -22); c.stroke(); c.fillStyle = '#ef5350'; c.fillRect(2, -22, 9, 6); c.restore();
    rr(c, -52, -20, 18, 6, 2); fs(c, '#d8b07a', 1.4); c.restore();
    c.font = '22px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎣', x - 38, y - 30);
  }
  function track(c, x, y, t) {
    c.save(); c.translate(x, y); shadow(c, 0, 2, 50, 8);
    ell(c, 0, -14, 48, 22, '#8d949c', 2); ell(c, 0, -14, 30, 11, '#7cc04f', 0); c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.setLineDash([5, 5]); c.beginPath(); c.ellipse(0, -14, 39, 16.5, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    const a = t * 1.6; c.save(); c.translate(Math.cos(a) * 39, -14 + Math.sin(a) * 16.5); rr(c, -7, -4, 14, 8, 3); fs(c, '#e53935', 1.4); c.restore();
    rr(c, -50, -42, 5, 40, 2); fs(c, '#eceff1', 1.4); rr(c, 45, -42, 5, 40, 2); fs(c, '#eceff1', 1.4); rr(c, -52, -50, 104, 12, 5); fs(c, '#fff', 1.6);
    for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#212121' : '#fff'; c.fillRect(-48 + i * 7.4, -48, 7.4, 4); c.fillStyle = i % 2 ? '#fff' : '#212121'; c.fillRect(-48 + i * 7.4, -44, 7.4, 4); }
    c.restore();
  }
  function tent(c, x, y, t) {
    c.save(); c.translate(x, y); shadow(c, 0, 2, 40, 7);
    rr(c, -30, -34, 60, 34, 4); fs(c, '#fff3d6', 2);
    c.beginPath(); c.moveTo(-40, -32); c.lineTo(0, -64); c.lineTo(40, -32); c.closePath(); fs(c, '#e53935', 2);
    for (let i = -1; i <= 1; i++) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(i * 14 - 6, -32); c.lineTo(i * 14, -61 + Math.abs(i) * 6); c.lineTo(i * 14 + 6, -32); c.closePath(); c.fill(); }
    rr(c, -9, -22, 18, 22, 4); fs(c, '#8a5a3c', 1.6);
    c.save(); c.translate(0, -76); c.rotate(Math.sin(t * 1.8) * .12); rr(c, -9, -9, 18, 18, 4); fs(c, '#fff', 1.8); c.fillStyle = '#212121'; [[-4, -4], [4, 4], [0, 0], [4, -4], [-4, 4]].forEach(([dx, dy]) => { c.beginPath(); c.arc(dx, dy, 1.5, 0, TAU); c.fill(); }); c.restore();
    c.restore();
  }
  function arcade(c, x, y, t) {
    c.save(); c.translate(x, y); shadow(c, 0, 2, 38, 7);
    rr(c, -34, -56, 68, 56, 8); fs(c, '#7e57c2', 2); rr(c, -26, -46, 52, 30, 6); fs(c, '#1b1b2f', 1.8);
    const hue = (t * 80) % 360; c.fillStyle = 'hsl(' + hue + ',90%,60%)'; c.font = '16px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['👾', '🕹️', '🎯'][Math.floor(t) % 3], 0, -31);
    ell(c, -12, -9, 4.5, 4.5, '#ef5350', 1.4); ell(c, 2, -9, 4.5, 4.5, '#ffd54f', 1.4); rr(c, 12, -13, 10, 8, 3); fs(c, '#42a5f5', 1.4);
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ffd54f' : '#ef5350'; c.beginPath(); c.arc(-30 + i * 12, -58, 2.4 + (Math.floor(t * 3) % 2 === i % 2 ? .8 : 0), 0, TAU); c.fill(); }
    c.restore();
  }
  function hamlet(c, x, y, t) {
    c.save(); c.translate(x, y); shadow(c, 0, 2, 50, 7);
    [[-26, 1, '#ffb74d'], [26, .8, '#81c784']].forEach(([dx, k, col]) => { c.save(); c.translate(dx, 0); c.scale(k, k); rr(c, -17, -28, 34, 28, 4); fs(c, '#fff3d6', 1.8); c.beginPath(); c.moveTo(-23, -26); c.lineTo(0, -48); c.lineTo(23, -26); c.closePath(); fs(c, col, 1.8); rr(c, -5, -17, 10, 17, 3); fs(c, '#8a5a3c', 1.4); c.restore(); });
    c.font = '18px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('👀', Math.sin(t * 2) * 3, -62); c.restore();
  }
  GV.chibi = { bus, road, busStop, lamp, sign, fountain, pond, track, tent, arcade, hamlet, house, bigTree, fence, locked, char, crop, soil, shade, rr, ell, fs, hat };
})();
