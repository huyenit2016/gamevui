// Tích đức – trang tu tập (id accumulating-merit): giao diện sáng kiểu thư pháp/sen. Gõ mõ, cảnh giới 9 bậc, chuỗi tinh tấn, lịch âm, thiệp hồi hướng (tạo ảnh PNG), vườn tâm, gieo quẻ.
// Chỉ giải trí, công đức là điểm ảo, dữ liệu lưu trên máy (gv_merit). Đồ hoạ vẽ bằng SVG/canvas, không dùng ảnh ngoài. Cần games-tichduc.js (lịch âm, lời quẻ).
(function () {
  const esc = GV.esc, fmt = n => Math.floor(n).toLocaleString('vi-VN');
  const REALMS = [['Khởi tâm', 0], ['Kiên trì', 200], ['Tĩnh tâm', 1000], ['Từ bi', 2000], ['Trí tuệ', 5000], ['Giác ngộ', 12000], ['An lạc', 30000], ['Hỷ xả', 70000], ['Viên mãn', 150000]];
  const realmOf = t => { let i = 0; REALMS.forEach((r, k) => { if (t >= r[1]) i = k; }); return i; };
  const QUOTES = ['An trú trong hiện tại, gieo lành từ hôm nay.', 'Mỗi nhịp gõ, một niềm an.', 'Một việc thiện nhỏ, một ngày nhẹ lòng.', 'Biết đủ là giàu, biết dừng là thảnh thơi.', 'Lời nói dịu dàng là món quà không tốn tiền.'];
  const WISH = ['Nguyện vạn sự bình an.', 'Nguyện cho gia đình khoẻ mạnh, hạnh phúc.', 'Nguyện mọi chúng sinh bớt khổ, thêm vui.', 'Nguyện tâm luôn an, trí luôn sáng.', 'Nguyện người thương gặp nhiều may mắn.', 'Nguyện công đức này hồi hướng đến khắp muôn loài.'];
  const HOURS = ['Tý (23h - 1h)', 'Sửu (1h - 3h)', 'Dần (3h - 5h)', 'Mão (5h - 7h)', 'Thìn (7h - 9h)', 'Tị (9h - 11h)', 'Ngọ (11h - 13h)', 'Mùi (13h - 15h)', 'Thân (15h - 17h)', 'Dậu (17h - 19h)', 'Tuất (19h - 21h)', 'Hợi (21h - 23h)'];
  const HHD = [[0, 1, 3, 6, 8, 9], [2, 3, 5, 8, 10, 11], [0, 1, 4, 5, 7, 10], [0, 2, 3, 6, 7, 9], [2, 4, 5, 8, 9, 11], [1, 4, 6, 7, 10, 11]]; // theo chi của ngày (Tý/Ngọ, Sửu/Mùi, Dần/Thân, Mão/Dậu, Thìn/Tuất, Tị/Hợi)
  const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dkey = d => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  const lotus = (w, o = 1, c1 = '#fdeef0', c2 = '#e8a9b6') => `<svg width="${w}" viewBox="-80 -80 160 100" style="opacity:${o}" aria-hidden="true"><ellipse cx="-34" cy="2" rx="40" ry="9" fill="#9bb89a" opacity=".6"/><ellipse cx="34" cy="2" rx="40" ry="9" fill="#8fae90" opacity=".6"/>${[-62, -38, 38, 62, -14, 14, 0].map((a, i) => `<g transform="rotate(${a})"><path d="M0 0C-17 -20 -12 -56 0 -${i > 3 ? 70 : 62}C12 -56 17 -20 0 0Z" fill="${i > 3 ? '#fff5f6' : c1}" stroke="${c2}" stroke-width="1.2"/></g>`).join('')}</svg>`;
  const FISH = `<svg viewBox="0 0 340 270" class="mr-fishsvg" aria-hidden="true"><defs><linearGradient id="mrb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8b27a"/><stop offset=".55" stop-color="#b9763a"/><stop offset="1" stop-color="#7a4520"/></linearGradient><linearGradient id="mrc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b8f6a"/><stop offset="1" stop-color="#2f5a47"/></linearGradient><radialGradient id="mrg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>
<circle cx="190" cy="120" r="125" fill="url(#mrg)" class="mr-glow"/>
<ellipse cx="170" cy="222" rx="132" ry="38" fill="url(#mrc)"/><ellipse cx="170" cy="212" rx="118" ry="30" fill="#4a7a5c"/><path d="M60 214c40 14 180 14 220 0" stroke="#d9c17a" stroke-width="2" fill="none" opacity=".7"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${72 + i * 24} 206q10 10 0 20" stroke="#d9c17a" stroke-width="1.6" fill="none" opacity=".55"/>`).join('')}
<g class="mr-body"><path d="M62 150C48 82 118 30 196 44C256 56 276 112 250 152C222 194 106 206 62 150Z" fill="url(#mrb)" stroke="#6b3b18" stroke-width="2"/><path d="M92 88C118 60 170 52 206 62" stroke="#f6d3a2" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/><path d="M214 92L262 104" stroke="#2a150a" stroke-width="12" stroke-linecap="round"/><g transform="translate(150 128)">${[-50, -25, 0, 25, 50].map(a => `<path d="M0 0C-7 -9 -5 -22 0 -28C5 -22 7 -9 0 0Z" fill="none" stroke="#7a4520" stroke-width="2" transform="rotate(${a})"/>`).join('')}</g></g>
<g class="mr-mallet"><path d="M96 244L252 196" stroke="#8a5328" stroke-width="13" stroke-linecap="round"/><path d="M96 244L252 196" stroke="#c78a52" stroke-width="4" stroke-linecap="round" transform="translate(0 -3)"/><circle cx="90" cy="246" r="15" fill="#6b3b18"/></g></svg>`;
  const mountain = `<svg class="mr-mtn" viewBox="0 0 1200 380" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="mrm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c8b5" stop-opacity=".55"/><stop offset="1" stop-color="#f6efe0" stop-opacity="0"/></linearGradient></defs><circle cx="1010" cy="70" r="38" fill="#f1cf8c" opacity=".55"/><path d="M0 250C80 170 150 150 230 205C300 120 360 130 430 230L430 380L0 380Z" fill="url(#mrm)"/><path d="M780 260C860 180 900 170 960 220C1010 150 1070 160 1200 250L1200 380L780 380Z" fill="url(#mrm)" opacity=".8"/><g fill="#9bae9c" opacity=".45"><rect x="1040" y="105" width="12" height="70"/><path d="M1020 175h52l-8 10h-36zM1026 150h40l-6 9h-28zM1030 128h32l-5 8h-22zM1046 90l-8 20h24z"/></g></svg>`;

  GV.register({
    id: 'accumulating-merit', type: 'tool', cat: 'Đời sống', name: 'Tích đức – Tu tập mỗi ngày', icon: '🪷', desc: 'Gõ mõ tích công đức, thăng 9 cảnh giới, chuỗi tinh tấn, lịch âm & giờ hoàng đạo, tạo thiệp hồi hướng, vườn tâm, gieo quẻ. Thư giãn, không dính tiền.',
    mount(el) {
      const C = GV.lunarCal; if (!C) { el.innerHTML = '<p class="hint">Thiếu mô-đun lịch âm (games-tichduc.js).</p>'; return () => {}; }
      const D = { tot: 0, taps: 0, days: {}, streak: 0, longest: 0, last: '', que: null, water: '', name: '', ...GV.store.get('merit', {}) };
      const now = new Date(), TD = C.today(), key = dkey(now);
      const save = () => GV.store.set('merit', D); let view = 'home', dead = false, saveT = 0, bump = 0;
      const yesterday = () => { const y = new Date(now); y.setDate(y.getDate() - 1); return dkey(y); };
      if (D.last && D.last !== key && D.last !== yesterday()) D.streak = 0; // mất chuỗi nếu bỏ qua một ngày
      const lyr = TD.l.y, lyName = C.CAN[(lyr + 6) % 10] + ' ' + C.CHI[(lyr + 8) % 12];
      const hours = HHD[((TD.l.jd + 1) % 12) % 6].map(i => HOURS[i]).join(', ');
      const per = () => (TD.special ? 2 : 1) + (D.streak >= 7 ? 1 : 0);
      el.innerHTML = `<style>
.mr{--g:#17503f;--g2:#2b7a5f;--cr:#fbf6ea;--ink:#2a3a33;--mut:#6f7f76;--ln:#e6dcc4;position:relative;width:100%;max-width:1180px;margin:0 auto;border-radius:20px;overflow:hidden;background:linear-gradient(#f8f1e1,#f3ead6);color:var(--ink);font-family:Georgia,"Times New Roman",serif;padding-bottom:6px}
.mr *{box-sizing:border-box}.mr .mr-mtn{position:absolute;top:0;left:0;width:100%;height:340px;pointer-events:none}
.mr .mr-lt{position:absolute;pointer-events:none}.mr .mr-lt.l{left:-30px;top:200px}.mr .mr-lt.r{right:-40px;top:230px;transform:scaleX(-1)}
.mr nav{position:relative;display:flex;align-items:center;gap:6px;padding:8px 20px;border-bottom:1px solid #0001;background:#fbf6eacc;backdrop-filter:blur(6px);flex-wrap:wrap}
.mr nav .lg{display:flex;align-items:center;gap:8px;font-size:1.3rem;letter-spacing:.04em;color:var(--g);margin-right:auto;white-space:nowrap}
.mr nav button{background:none;border:0;border-bottom:3px solid transparent;color:var(--ink);font:600 14px Georgia,serif;padding:10px 12px;cursor:pointer;display:flex;gap:6px;align-items:center}.mr nav button.on{color:var(--g);border-color:var(--g)}
.mr .mrh{position:relative;text-align:center;padding:26px 16px 14px}.mr h1{margin:0;font-size:clamp(1.9rem,5.2vw,3.4rem);font-style:italic;color:var(--g);font-weight:700;letter-spacing:-.01em}.mr .mrh p{margin:6px 0 0;color:var(--mut);font-size:clamp(.95rem,2vw,1.15rem)}
.mr .mrg{position:relative;display:grid;grid-template-columns:1.6fr 1fr;gap:16px;padding:12px 22px}.mr .mrg3{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:6px 22px 14px}
.mr .cd{background:#fffdf7e8;border:1px solid var(--ln);border-radius:16px;box-shadow:0 4px 18px #7a6a3a14;padding:16px 18px;position:relative}
.mr .main{display:grid;grid-template-columns:minmax(120px,.5fr) 1.5fr;align-items:center;gap:10px;min-height:290px;overflow:hidden;cursor:pointer}
.mr .main .tx{font-style:italic;color:#6a766e;font-size:14px;line-height:1.8}.mr .main .tx svg{display:block;margin-bottom:12px}
.mr .fz{position:relative}.mr .fishsvg{width:100%;max-height:260px;display:block}.mr .tap{position:absolute;right:4%;bottom:6%;background:linear-gradient(#1f6a52,#134536);color:#fff;border:0;border-radius:99px;padding:14px 26px;font:600 1.1rem Georgia,serif;cursor:pointer;box-shadow:0 8px 22px #17503f66,0 0 0 4px #fff8;display:flex;gap:8px;align-items:center}.mr .tap:active{transform:scale(.97)}
.mr .mr-glow{transform-origin:190px 120px;animation:mrg 4s ease-in-out infinite}@keyframes mrg{50%{transform:scale(1.08);opacity:.8}}
.mr .mr-mallet{transform-origin:96px 244px}.mr .hit .mr-mallet{animation:mrm .22s ease}.mr .hit .mr-body{animation:mrb .22s ease}
@keyframes mrm{40%{transform:rotate(-14deg)}}@keyframes mrb{40%{transform:translateY(5px) scale(1.015,.97)}}.mr .mr-body{transform-origin:160px 180px}
.mr .stats{display:flex;flex-direction:column;gap:12px}.mr .stat{display:flex;gap:14px;align-items:center;cursor:pointer}.mr .stat .mric{width:58px;height:58px;border-radius:50%;background:#e1ecde;display:grid;place-items:center;font-size:1.7rem;flex:0 0 auto}
.mr .stat small{color:var(--mut);font-size:14px}.mr .stat b{display:block;font-size:1.75rem;color:#1f2f28;line-height:1.15}.mr .stat .mrbar{height:7px;border-radius:5px;background:#e8e2cf;margin:6px 0 4px;overflow:hidden}.mr .stat .mrbar i{display:block;height:100%;background:var(--g2);border-radius:5px}.mr .stat .pg{font-size:13px;color:var(--mut)}.mr .stat>.mrgo{margin-left:auto;color:#7a8a80;font-size:1.3rem}.mr .stat .tx{flex:1}
.mr h3{margin:0 0 10px;font-size:1.25rem;display:flex;align-items:center;gap:8px;color:#1f2f28}.mr h3 a,.mr h3 button{margin-left:auto;font:13px Georgia,serif;color:var(--g);background:none;border:0;cursor:pointer;text-decoration:underline}
.mr .cal{display:grid;grid-template-columns:1.1fr 1fr;gap:12px;align-items:center}.mr .cal .d b{display:block;font-size:2rem;color:#1f2f28;margin:2px 0}.mr .cal .d span{font-size:14px;color:var(--mut)}
.mr .good{background:#f5ecd6;border-radius:50%;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:14px;font-size:12.5px;color:#5c6a62;max-width:170px;margin:0 auto}.mr .good b{font-size:1.1rem;color:#1f2f28;margin:4px 0}
.mr .hr{margin-top:12px;padding-top:10px;border-top:1px solid var(--ln);font-size:13px;color:#566359;display:flex;gap:8px;align-items:flex-start}
.mr .card-pv{display:grid;grid-template-columns:1fr;gap:6px;text-align:center}.mr .card-pv p{margin:0 0 6px;color:var(--mut);font-size:14px}.mr .cta{background:linear-gradient(#1f6a52,#134536);color:#fff;border:0;border-radius:99px;padding:11px 18px;font:600 15px Georgia,serif;cursor:pointer;width:100%}
.mr .miles{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 6px;text-align:center}.mr .ms{font-size:12.5px;color:#4a5a52;position:relative}.mr .ms i{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;margin:0 auto 4px;background:#e4e7dc;color:#7b8a82;font-style:normal;font-size:1.1rem}.mr .ms.done i{background:#1f5c47;color:#fff}.mr .ms.cur i{background:#fff;border:3px solid #d9a85a;color:#b9822e}
.mr .quote{position:relative;margin:4px 22px 0;padding:18px 10px;text-align:center;font-style:italic;font-size:1.15rem;color:#2b3b34;border-radius:14px;background:linear-gradient(90deg,#e9eedf,#fdf8ea,#e9eedf)}
.mr footer{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 24px 8px;font-size:12px;color:#6f7f76}
.mr .mrp{position:relative;padding:18px 22px 14px}.mr .mrp .cd{margin-bottom:14px}.mr .mrp h2{margin:0 0 10px;color:var(--g);font-size:1.5rem}
.mr .btn2{background:linear-gradient(#1f6a52,#134536);color:#fff;border:0;border-radius:10px;padding:10px 16px;font:600 14px Georgia,serif;cursor:pointer}.mr .btn2[disabled]{opacity:.45;cursor:default}
.mr input,.mr select{width:100%;border:1px solid #d9cda8;background:#fffdf7;border-radius:10px;padding:9px 11px;font:15px Georgia,serif;color:var(--ink)}
.mr .garden{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:10px}.mr .garden div{aspect-ratio:1;border-radius:14px;background:#eef2e4;display:grid;place-items:center;font-size:2rem}.mr .garden .em{opacity:.35;filter:grayscale(1);font-size:1.2rem}
.mr .chart{display:flex;gap:8px;align-items:flex-end;height:150px;padding-top:10px}.mr .chart div{flex:1;text-align:center;font-size:11px;color:var(--mut);display:flex;flex-direction:column;justify-content:flex-end;height:100%}.mr .chart i{display:block;background:linear-gradient(var(--g2),var(--g));border-radius:6px 6px 0 0;min-height:3px}
.mr .modal{position:fixed;inset:0;background:#0008;z-index:60;display:none;align-items:center;justify-content:center;padding:14px}.mr .modal.on{display:flex}.mr .mbox{background:#fffdf7;border-radius:18px;padding:18px;width:min(460px,100%);max-height:94vh;overflow:auto}.mr .mbox canvas{width:100%!important;height:auto!important;max-width:100%!important;max-height:none!important;border-radius:10px;border:1px solid var(--ln);margin:8px 0}
.mr .ft{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:50;font:700 22px Georgia,serif;color:#1f5c47;pointer-events:none;animation:mrf .9s ease-out forwards}@keyframes mrf{to{transform:translate(-50%,-70px);opacity:0}}
@media(max-width:860px){.mr .mrg{grid-template-columns:1fr;padding:10px 14px}.mr .mrg3{grid-template-columns:1fr;padding:4px 14px 12px}.mr .main{grid-template-columns:1fr;text-align:center}.mr .main .tx{display:none}.mr nav{padding:6px 8px;gap:0}.mr nav .lg{width:100%;font-size:1.1rem;padding:4px 8px}.mr nav button{padding:8px 8px;font-size:12.5px}.mr .tap{position:static;margin:6px auto 0}.mr .cal{grid-template-columns:1fr}.mr .quote{margin:4px 14px 0;font-size:1rem}}
</style><div class="mr"><div class="mr-bg">${mountain}</div><div class="mr-lt l">${lotus(260, .55)}</div><div class="mr-lt r">${lotus(240, .5)}</div>
<nav><span class="lg">${lotus(38, 1, '#fff3d6', '#c9962f')} TÍCH ĐỨC ONLINE</span><button data-v="home">🏠 Tu tập</button><button data-v="garden">🌿 Vườn tâm</button><button data-v="que">🎋 Gieo quẻ</button><button data-v="rank">🏆 Bảng xếp hạng</button><button data-v="about">ℹ️ Giới thiệu</button></nav>
<div class="mrb"></div>
<div class="quote"><span class="qt"></span></div><footer><span>${lotus(26, .9, '#fff3d6', '#c9962f')} TÍCH ĐỨC ONLINE · Lan tỏa yêu thương · Kiến tạo bình an</span><span>♡ Vì một cuộc sống tốt đẹp hơn</span></footer>
<div class="modal"><div class="mbox"></div></div></div>`;
      const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)], body = $('.mrb'), modal = $('.modal'), mb = $('.mbox');
      $('.qt').textContent = '“ ' + QUOTES[now.getDate() % QUOTES.length] + ' ”';

      /* ---- lõi ---- */
      const AC = () => { try { return GV._ac || (GV._ac = new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { return null; } };
      function knock() { const a = AC(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(250, t + .09); g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .2); }
      function add(n) {
        const was = realmOf(D.tot); D.tot += n; D.days[key] = (D.days[key] || 0) + n;
        if (D.last !== key) { D.streak = D.last === yesterday() ? D.streak + 1 : 1; D.longest = Math.max(D.longest, D.streak); D.last = key; Object.keys(D.days).sort().slice(0, -30).forEach(k => delete D.days[k]); }
        const now2 = realmOf(D.tot); if (now2 > was) GV.toast('Thăng cảnh giới: ' + REALMS[now2][0] + ' 🪷', { type: 'success' });
      }
      function tap(e) {
        if (dead) return; D.taps++; add(per()); knock(); const f = $('.fz'); if (f) { f.classList.remove('hit'); void f.offsetWidth; f.classList.add('hit'); }
        const s = document.createElement('div'); s.className = 'ft'; s.textContent = '+' + per(); const r = (e && e.clientX != null) ? e : null; if (r) { s.style.left = r.clientX + 'px'; s.style.bottom = 'auto'; s.style.top = (r.clientY - 20) + 'px'; } el.querySelector('.mr').appendChild(s); setTimeout(() => s.remove(), 900); refreshStats(); save();
        if (navigator.vibrate && D.taps % 4 === 0) { try { navigator.vibrate(8); } catch (x) {} }
      }
      function refreshStats() {
        const r = realmOf(D.tot), nx = REALMS[r + 1], lo = REALMS[r][1], pct = nx ? (D.tot - lo) / (nx[1] - lo) * 100 : 100;
        const set = (s, v) => { const x = $(s); if (x) x.textContent = v; }; set('.v-m', fmt(D.tot)); set('.v-r', REALMS[r][0]); set('.v-pg', nx ? `${fmt(D.tot)} / ${fmt(nx[1])}` : 'Cảnh giới cao nhất'); set('.v-s', D.streak + ' ngày'); const b = $('.mrbar i'); if (b) b.style.width = pct + '%';
        const ms = $$('.ms'); ms.forEach((m, i) => { m.className = 'ms ' + (i < r ? 'done' : i === r ? 'cur' : ''); m.querySelector('i').textContent = i < r ? '✓' : i === r ? '🪷' : '🔒'; });
      }

      /* ---- các màn ---- */
      const stat = (ic, lab, val, extra, cls, go) => `<div class="cd stat" data-mv="${go}"><span class="mric">${ic}</span><span class="tx"><small>${lab}</small><b class="${cls}">${val}</b>${extra || ''}</span><span class="mrgo">›</span></div>`;
      function home() {
        const r = realmOf(D.tot), nx = REALMS[r + 1], lo = REALMS[r][1];
        body.innerHTML = `<div class="mrh"><h1>Mỗi nhịp gõ, một niềm an.</h1><p>Dành vài phút để trở về với sự bình yên bên trong.</p></div>
<div class="mrg"><div class="cd main"><div class="tx">${lotus(46, .8)}Gõ mõ<br>là gieo duyên<br>lành, tích đức<br>cho chính mình<br>và mọi người.</div><div class="fz">${FISH}<button class="tap">👆 Gõ mõ tích đức</button></div></div>
<div class="stats">${stat('🪷', 'Công đức', fmt(D.tot), '', 'v-m', 'garden')}${stat('🧘', 'Cảnh giới', REALMS[r][0], `<div class="mrbar"><i style="width:${nx ? (D.tot - lo) / (nx[1] - lo) * 100 : 100}%"></i></div><div class="pg v-pg">${nx ? fmt(D.tot) + ' / ' + fmt(nx[1]) : 'Cảnh giới cao nhất'}</div>`, 'v-r', 'rank')}${stat('🔥', 'Chuỗi tinh tấn', D.streak + ' ngày', '', 'v-s', 'rank')}</div></div>
<div class="mrg3"><div class="cd"><h3>📅 Lịch âm hôm nay <button data-v="que">Xem chi tiết ›</button></h3><div class="cal"><div class="d"><span>${WD[now.getDay()]}</span><b>${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}</b><span>Âm lịch: ${TD.l.d} tháng ${TD.l.m}${TD.l.leap ? ' nhuận' : ''} năm ${lyName}</span></div><div class="good"><span>🌙</span><b>${TD.hd ? 'Ngày tốt' : 'Ngày thường'}</b>${TD.hd ? 'Tu tập, làm việc thiện, phúc lộc tăng.' : 'Giữ lòng bình thản, làm việc nhỏ cho thật tốt.'}${TD.special ? '<br>Công đức hôm nay ×2' : ''}</div></div><div class="hr">🌿 <span>Giờ hoàng đạo: ${esc(hours)}<br><small>Ngày ${esc(TD.name)}</small></span></div></div>
<div class="cd"><h3>💌 Thiệp hồi hướng <button class="mk">Tạo thiệp</button></h3><div class="card-pv"><p>Gửi lời cầu nguyện, hồi hướng công đức đến người thân, bạn bè và tất cả chúng sinh.</p><div style="display:grid;place-items:center">${lotus(210, 1)}</div><button class="cta mk">💌 Tạo thiệp</button></div></div>
<div class="cd"><h3>⛰️ Hành trình tu tập <span style="margin-left:auto;font:13px Georgia,serif;color:var(--mut)">${r + 1}/9</span></h3><p class="hint" style="margin:-4px 0 10px;font-size:12.5px;color:var(--mut)">Hoàn thành các mốc để nâng cao cảnh giới</p><div class="miles">${REALMS.map((x, i) => `<div class="ms ${i < r ? 'done' : i === r ? 'cur' : ''}"><i>${i < r ? '✓' : i === r ? '🪷' : '🔒'}</i>${i + 1}. ${x[0]}</div>`).join('')}</div></div></div>`;
        $$('.mk').forEach(b => b.onclick = e => { e.stopPropagation(); card(); });
        const m = $('.main'); m.onclick = tap; $('.tap').onclick = e => { e.stopPropagation(); tap(e); };
        $$('[data-mv]').forEach(b => b.onclick = () => go(b.dataset.mv)); $$('.cd [data-v]').forEach(b => b.onclick = () => go(b.dataset.v));
      }
      const GARDEN = ['🌱', '🌿', '🌸', '🪷', '🎋', '🌳', '🌼', '🍀'];
      function garden() {
        const n = Math.min(24, Math.floor(D.tot / 100)), can = D.water !== key;
        body.innerHTML = `<div class="mrp"><div class="cd"><h2>🌿 Vườn tâm</h2><p>Mỗi 100 công đức, vườn nở thêm một cây. Hiện có <b>${n}</b>/24 cây.</p><div class="garden">${Array.from({ length: 24 }, (_, i) => i < n ? `<div>${GARDEN[i % GARDEN.length]}</div>` : '<div class="em">🌰</div>').join('')}</div><p style="margin-top:12px"><button class="btn2 wt" ${can ? '' : 'disabled'}>💧 ${can ? 'Tưới vườn hôm nay (+15 công đức)' : 'Hôm nay đã tưới vườn'}</button></p></div></div>`;
        $('.wt').onclick = () => { D.water = key; add(15); save(); garden(); };
      }
      function que() {
        const got = D.que && D.que.k === key, q = got ? C.QUE[D.que.i] : null;
        body.innerHTML = `<div class="mrp"><div class="cd"><h2>🎋 Gieo quẻ</h2><p>Mỗi ngày gieo một quẻ để tham khảo cho vui, không phải lời tiên tri. Gieo xong được <b>+20 công đức</b>.</p><div style="border:1px dashed #c9b27a;border-radius:14px;padding:18px;text-align:center;margin:10px 0;font-size:1.05rem">${got ? `<b style="display:block;font-size:1.3rem;color:var(--g);margin-bottom:6px">${esc(q[0])}</b>${esc(q[1])}` : 'Chưa gieo quẻ hôm nay'}</div><button class="btn2 gq" ${got ? 'disabled' : ''}>${got ? 'Đã gieo hôm nay' : '🎋 Gieo quẻ'}</button></div>
<div class="cd"><h3>📅 ${esc(TD.txt)} · ngày ${esc(TD.name)}</h3><p>${TD.hd ? 'Ngày Hoàng đạo: hợp tu tập, làm việc thiện.' : 'Ngày Hắc đạo: không cần lo, cứ sống chậm và tử tế.'}<br>Giờ hoàng đạo: ${esc(hours)}</p></div></div>`;
        $('.gq').onclick = () => { D.que = { k: key, i: GV.rnd(C.QUE.length) }; add(20); save(); que(); };
      }
      function rank() {
        const ks = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - 6 + i); return [dkey(d), d]; }), vals = ks.map(([k]) => D.days[k] || 0), mx = Math.max(1, ...vals), best = Math.max(0, ...Object.values(D.days));
        body.innerHTML = `<div class="mrp"><div class="cd"><h2>🏆 Thành tích của bạn</h2><p class="hint" style="color:var(--mut)">Bảng xếp hạng toàn cầu chưa có. Đây là thành tích riêng của bạn, lưu trên máy này.</p><div class="chart">${vals.map((v, i) => `<div><span>${v ? fmt(v) : ''}</span><i style="height:${Math.max(3, v / mx * 100)}%"></i>${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][ks[i][1].getDay()]}</div>`).join('')}</div></div>
<div class="cd"><p>Tổng công đức: <b>${fmt(D.tot)}</b> · Cảnh giới: <b>${REALMS[realmOf(D.tot)][0]}</b><br>Số lần gõ: <b>${fmt(D.taps)}</b> · Ngày tích nhiều nhất: <b>${fmt(best)}</b><br>Chuỗi hiện tại: <b>${D.streak} ngày</b> · Chuỗi dài nhất: <b>${Math.max(D.longest, D.streak)} ngày</b></p><p class="hint" style="color:var(--mut);font-size:13px">Chuỗi 7 ngày liên tiếp: mỗi nhịp gõ được thêm +1 công đức.</p><button class="btn2 rs" style="background:#8a6a4a">Đặt lại tiến trình</button></div></div>`;
        $('.rs').onclick = () => { if (confirm('Xoá toàn bộ tiến trình Tích đức?')) { Object.assign(D, { tot: 0, taps: 0, days: {}, streak: 0, longest: 0, last: '', que: null, water: '' }); save(); rank(); } };
      }
      function about() {
        body.innerHTML = `<div class="mrp"><div class="cd"><h2>ℹ️ Giới thiệu</h2><p>Tích đức là nơi dành vài phút mỗi ngày để chậm lại: gõ mõ, hít thở, nhắc mình làm một việc tốt nhỏ.</p><p><b>Cách chơi:</b> chạm vào mõ hoặc nút "Gõ mõ tích đức". Đủ công đức thì thăng 9 cảnh giới. Mỗi ngày gõ ít nhất một lần để giữ chuỗi tinh tấn; mùng 1 và Rằm (âm lịch) công đức nhân đôi.</p><p><b>Thiệp hồi hướng:</b> viết lời nguyện và tải ảnh thiệp để gửi người thân.</p><p class="hint" style="color:var(--mut);font-size:13px">Công đức chỉ là điểm ảo để thư giãn, không đổi ra tiền hay vật phẩm. Việc thiện thật là điều bạn làm ngoài đời 🙏 Dữ liệu lưu trên máy bạn. Lịch âm tự tính tại chỗ, giờ hoàng đạo chỉ mang tính tham khảo.</p></div></div>`;
      }
      const V = { home, garden, que, rank, about };
      function go(v) { view = V[v] ? v : 'home'; V[view](); $$('nav [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === view)); el.querySelector('.mr').scrollIntoView({ block: 'start' }); }
      $$('nav [data-v]').forEach(b => b.onclick = () => go(b.dataset.v));

      /* ---- thiệp hồi hướng (canvas → PNG) ---- */
      function card() {
        mb.innerHTML = `<h3 style="margin:0 0 8px;color:var(--g)">💌 Tạo thiệp hồi hướng</h3><label>Gửi tới</label><input class="to" maxlength="30" placeholder="Người thân, bạn bè, tất cả chúng sinh…" value="${esc(D.name)}"><label style="display:block;margin-top:8px">Lời nguyện</label><select class="ws">${WISH.map((w, i) => `<option value="${i}">${esc(w)}</option>`).join('')}<option value="-1">Tự viết…</option></select><input class="wx" maxlength="120" placeholder="Lời nguyện của bạn" style="margin-top:6px;display:none"><canvas width="640" height="800"></canvas><div style="display:flex;gap:8px"><button class="btn2 dl" style="flex:1">⬇ Tải ảnh thiệp</button><button class="btn2 cl" style="background:#8a6a4a">Đóng</button></div>`;
        modal.classList.add('on'); const cv = mb.querySelector('canvas'), g = cv.getContext('2d');
        const draw = () => {
          const to = mb.querySelector('.to').value.trim(), wi = +mb.querySelector('.ws').value, txt = wi >= 0 ? WISH[wi] : (mb.querySelector('.wx').value.trim() || 'Nguyện vạn sự bình an.'); mb.querySelector('.wx').style.display = wi < 0 ? '' : 'none';
          const gr = g.createLinearGradient(0, 0, 0, 800); gr.addColorStop(0, '#fdf6e3'); gr.addColorStop(1, '#f1e4c4'); g.fillStyle = gr; g.fillRect(0, 0, 640, 800);
          g.strokeStyle = '#17503f'; g.lineWidth = 6; g.strokeRect(24, 24, 592, 752); g.lineWidth = 2; g.strokeRect(38, 38, 564, 724);
          g.save(); g.translate(320, 330); [-62, -38, 38, 62, -14, 14, 0].forEach((a, i) => { g.save(); g.rotate(a * Math.PI / 180); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-34, -40, -24, -112, 0, -(i > 3 ? 140 : 124)); g.bezierCurveTo(24, -112, 34, -40, 0, 0); g.fillStyle = i > 3 ? '#fff5f6' : '#fdeef0'; g.fill(); g.strokeStyle = '#e0a0b0'; g.lineWidth = 2; g.stroke(); g.restore(); }); g.restore();
          g.textAlign = 'center'; g.fillStyle = '#17503f'; g.font = 'italic 700 46px Georgia,serif'; g.fillText('Thiệp hồi hướng', 320, 130);
          g.fillStyle = '#4a5a52'; g.font = 'italic 22px Georgia,serif'; g.fillText(to ? 'Gửi tới ' + to : 'Gửi tới tất cả chúng sinh', 320, 190);
          g.fillStyle = '#2a3a33'; g.font = 'italic 32px Georgia,serif'; const words = txt.split(' '); let line = '', y = 530; const lines = []; words.forEach(w => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > 480 && line) { lines.push(line); line = w; } else line = t; }); lines.push(line); lines.forEach((l, i) => g.fillText(l, 320, y + i * 44));
          g.fillStyle = '#6f7f76'; g.font = '16px Georgia,serif'; g.fillText('Tích Đức Online · ' + now.toLocaleDateString('vi-VN'), 320, 720);
        };
        draw(); mb.querySelectorAll('input,select').forEach(x => x.oninput = draw); mb.querySelector('.cl').onclick = () => modal.classList.remove('on');
        mb.querySelector('.dl').onclick = () => { cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'thiep-hoi-huong.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }); D.name = mb.querySelector('.to').value.trim(); save(); };
      }
      modal.addEventListener('pointerdown', e => { if (e.target === modal) modal.classList.remove('on'); });
      const offKeys = GV.keys(e => { if (view === 'home' && !modal.classList.contains('on') && (e.key === ' ' || e.key === 'Enter') && !/BUTTON/.test(e.target.tagName)) tap(); });
      const tm = setInterval(() => { saveT++; if (saveT % 4 === 0) save(); }, 1000);
      go('home'); refreshStats();
      GV.mrT = { D, tap, go, card, realmOf, REALMS, get view() { return view; } };
      return () => { dead = true; clearInterval(tm); offKeys(); save(); };
    }
  });
})();
