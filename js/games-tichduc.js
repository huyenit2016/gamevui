// Tích Đức Online: gõ mõ tích công đức, thăng cảnh giới, rút quẻ, nuôi cá, cửa hàng. Chỉ để giải trí/thư giãn, công đức là điểm ảo (không dính tiền).
// Đồ hoạ vẽ bằng canvas (không dùng ảnh bên ngoài); lịch âm tính tại chỗ (thuật toán Hồ Ngọc Đức, múi giờ +7).
(function () {
  const INT = Math.floor;
  /* ---------- Lịch âm ---------- */
  const jdn = (dd, mm, yy) => { const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3; return dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045; };
  function newMoon(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180; let J = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3; J += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3, P = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3, F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3, S = x => Math.sin(x * dr);
    const C = (0.1734 - 0.000393 * T) * S(M) + 0.0021 * S(2 * M) - 0.4068 * S(P) + 0.0161 * S(2 * P) - 0.0004 * S(3 * P) + 0.0104 * S(2 * F) - 0.0051 * S(M + P) - 0.0074 * S(M - P) + 0.0004 * S(2 * F + M) - 0.0004 * S(2 * F - M) - 0.0006 * S(2 * F + P) + 0.001 * S(2 * F - P) + 0.0005 * S(2 * P + M);
    const d = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2; return J + C - d;
  }
  function sunLong(j) { const T = (j - 2451545) / 36525, T2 = T * T, dr = Math.PI / 180, M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2, L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2; let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M); DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M); let L = (L0 + DL) * dr; L -= Math.PI * 2 * INT(L / (Math.PI * 2)); return L; }
  const sl = d => INT(sunLong(d - 0.5 - 7 / 24) / Math.PI * 6), nm = k => INT(newMoon(k) + 0.5 + 7 / 24);
  function m11(yy) { const k = INT((jdn(31, 12, yy) - 2415021) / 29.530588853); let n = nm(k); if (sl(n) >= 9) n = nm(k - 1); return n; }
  function leapOff(a11) { const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5); let last, i = 1, arc = sl(nm(k + i)); do { last = arc; i++; arc = sl(nm(k + i)); } while (arc !== last && i < 14); return i - 1; }
  function lunar(dd, mm, yy) {
    const dn = jdn(dd, mm, yy), k = INT((dn - 2415021.076998695) / 29.530588853); let ms = nm(k + 1); if (ms > dn) ms = nm(k);
    let a = m11(yy), b = a, ly; if (a >= ms) { ly = yy; a = m11(yy - 1); } else { ly = yy + 1; b = m11(yy + 1); }
    const diff = INT((ms - a) / 29); let lm = diff + 11, lp = 0; if (b - a > 365) { const lo = leapOff(a); if (diff >= lo) { lm = diff + 10; if (diff === lo) lp = 1; } }
    if (lm > 12) lm -= 12; if (lm >= 11 && diff < 4) ly--; return { d: dn - ms + 1, m: lm, y: ly, leap: lp, jd: dn };
  }
  const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'], CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  // ngày Hoàng đạo theo tháng âm (cặp tháng n, n+6)
  const HD = [[0, 1, 4, 5, 7, 10], [2, 3, 5, 8, 10, 1], [4, 5, 6, 9, 11, 2], [6, 7, 8, 11, 1, 4], [8, 9, 10, 1, 3, 6], [10, 11, 0, 3, 5, 8]];
  function today() {
    const n = new Date(), l = lunar(n.getDate(), n.getMonth() + 1, n.getFullYear()), chi = (l.jd + 1) % 12, hd = HD[(l.m - 1) % 6].includes(chi);
    return { l, name: CAN[(l.jd + 9) % 10] + ' ' + CHI[chi], hd, key: n.getFullYear() + '-' + (n.getMonth() + 1) + '-' + n.getDate(), special: l.d === 1 || l.d === 15, txt: (l.d <= 10 ? 'Mùng ' + l.d : 'Ngày ' + l.d) + ' tháng ' + l.m + (l.leap ? ' nhuận' : '') + ' (Âm)' };
  }

  /* ---------- Dữ liệu ---------- */
  const REALMS = [['Sơ tâm', 0], ['Định tâm', 100], ['Tĩnh tâm', 1000], ['Minh tâm', 5000], ['Từ bi', 20000], ['Trí tuệ', 60000], ['An nhiên', 150000], ['Viên mãn', 400000]];
  const realmOf = t => { let i = 0; REALMS.forEach((r, k) => { if (t >= r[1]) i = k; }); return i; };
  const SAY = ['Gõ một nhịp, lòng nhẹ một chút.', 'Thở chậm lại, nghe tiếng mõ.', 'Làm việc thiện không cần lớn, cần đều.', 'Lời nói dịu dàng là món quà miễn phí.', 'Biết đủ là giàu, biết dừng là thảnh thơi.', 'Hôm nay giúp ai một việc nhỏ nhé.', 'Tâm yên thì cảnh yên.', 'Cảm ơn một điều bạn đang có.'];
  const QUE = [['Thượng thượng', 'Gió thuận buồm xuôi. Việc đang dở sẽ có người giúp, cứ tiến bước nhưng đừng vội.'], ['Thượng cát', 'Một tin vui đến từ người thân hoặc bạn cũ. Giữ lòng tốt, phúc sẽ tự đến.'], ['Thượng cát', 'Việc học và làm có tiến triển. Kiên nhẫn thêm một chút nữa là chạm tới.'], ['Trung cát', 'Có chút lăn tăn nhưng không đáng lo. Nói thẳng với người trong cuộc sẽ nhẹ lòng.'], ['Trung cát', 'Tiền bạc ổn định, tránh mua sắm theo cảm xúc. Chia sẻ một phần cho người khó khăn.'], ['Trung bình', 'Ngày nên chậm lại. Ghi ra việc quan trọng nhất và làm xong nó trước.'], ['Trung bình', 'Đừng so sánh mình với người khác. Mỗi người một mùa nở hoa.'], ['Trung cát', 'Gặp việc khó đừng nản: cái khó hôm nay là kinh nghiệm của ngày mai.'], ['Thượng cát', 'Quý nhân xuất hiện dưới hình dạng một lời góp ý. Lắng nghe với tấm lòng cởi mở.'], ['Hạ cát', 'Hơi mệt mỏi, nên nghỉ ngơi và ngủ sớm. Sức khoẻ là gốc của mọi việc.'], ['Trung cát', 'Một mối quan hệ cần được hàn gắn. Lời xin lỗi chân thành có sức mạnh lạ lùng.'], ['Thượng cát', 'Gieo nhân lành, gặt quả ngọt. Điều bạn làm tử tế gần đây sắp được đền đáp.']];
  const SKINS = [{ n: 'Chùa đêm', c: ['#241408', '#0c0603'], g: '#ffd27a', cost: 0 }, { n: 'Chùa sen', c: ['#2b1220', '#0d0509'], g: '#ffb3c9', cost: 400 }, { n: 'Chùa trúc', c: ['#10241a', '#050c08'], g: '#bff0a8', cost: 900 }];
  const fmt = n => Math.floor(n).toLocaleString('vi-VN');

  GV.lunarCal = { lunar, today, CAN, CHI, QUE, HD };
  GV.register({
    id: 'tichduc', type: 'game', cat: 'Mô phỏng', name: 'Tích Đức Online', icon: '🪘', desc: 'Gõ mõ tích công đức, thăng cảnh giới, rút quẻ mỗi ngày, nuôi cá, ngắm lịch âm. Thư giãn, không dính tiền.',
    mount(el) {
      const D = { m: 0, tot: 0, taps: 0, top: 0, play: 0, name: '', mal: 1, inc: 0, fish: 0, skin: 0, own: [0], que: null, quet: '', bell: 0, music: false, ...GV.store.get('tichduc', {}) };
      const TD = today(), save = () => GV.store.set('tichduc', D);
      let dead = false, raf = 0, shake = 0, swing = 0, glow = 0, last = performance.now(), saveT = 0, tickT = 0, fishT = 0, incT = 0, modal = '', sayI = 0, vis = true;
      const floats = [], rings = [], smoke = [], sparks = [];
      const BG = new Image(); BG.src = 'img/bg-temple.webp'; // ảnh chính điện do chủ cung cấp; chưa tải xong/thiếu thì vẽ cảnh dự phòng bằng canvas
      el.innerHTML = `<style>
.td{position:relative;width:100%;max-width:880px;height:min(calc(100dvh - 215px),720px);min-height:480px;margin:0 auto;border-radius:18px;overflow:hidden;background:#0c0603;color:#f5e6c4;font-family:Georgia,"Times New Roman",serif;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.td canvas{position:absolute;inset:0;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;display:block;cursor:pointer}
.td .tdt{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:8px 12px;background:linear-gradient(#000c,#0000);z-index:3}
.td .tdt b{font-size:1.05rem;letter-spacing:.02em;flex:1;white-space:nowrap;color:#f3dca5}
.td .tdn{display:flex;gap:6px}.td .tdn button{width:50px;padding:4px 0 3px;border-radius:11px;border:1px solid #e8c36a88;background:linear-gradient(#5a3b78,#2f1e47);color:#f5e6c4;cursor:pointer;font:600 9.5px/1.15 inherit;display:flex;flex-direction:column;align-items:center;gap:1px;box-shadow:0 2px 8px #0008}
.td .tdn button i{font-style:normal;font-size:18px}.td .tdn button:hover{filter:brightness(1.2)}.td .tdn button.on{background:linear-gradient(#f2d98e,#c89a3a);color:#3a2404}
.td .tdd{position:absolute;top:56px;left:50%;transform:translateX(-50%);z-index:3;background:#1a120acc;border:1px solid #e8c36a55;border-radius:12px;padding:6px 18px;text-align:center;font-size:12px;backdrop-filter:blur(4px);white-space:nowrap}
.td .tdd b{display:block;font-size:13px;color:#ffe9b0}.td .tdd.sp{border-color:#ffd96a;box-shadow:0 0 14px #ffd96a55}
.td .tdbell{position:absolute;left:50%;transform:translateX(-50%);z-index:3;background:#1a120acc;border:1px solid #e8c36a77;color:#f5e6c4;border-radius:99px;padding:6px 16px;cursor:pointer;font:600 12.5px inherit}.td .tdbell[disabled]{opacity:.5;cursor:default}
.td .tdsay{position:absolute;left:50%;transform:translateX(-50%);z-index:3;font-size:12px;font-style:italic;color:#e8d3a0;opacity:.85;white-space:nowrap;text-shadow:0 1px 4px #000}
.td .tdp{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);width:min(350px,94%);z-index:3;background:linear-gradient(#2a1c0ee6,#150d06f2);border:1px solid #e8c36a66;border-radius:16px;padding:7px 16px 6px;text-align:center;box-shadow:0 8px 30px #000b}
.td .tdp small{display:block;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#a58c5c}.td .tdp .n{font-size:2.1rem;font-weight:700;line-height:1.05;color:#fff1c8;text-shadow:0 0 18px #ffcc5566}
.td .tdp .x{font-size:12px;color:#e8d3a0}.td .tdp .rl{font-size:1.25rem;font-weight:700;color:#f3dca5;margin:0 0 3px}
.td .tdp .bar{height:6px;border-radius:4px;background:#3a2a16;overflow:hidden}.td .tdp .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#e8b84a,#fff0b0)}
.td .tdp .pg{font-size:10px;color:#9d855a;margin:2px 0 4px}
.td .tdp .st{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #e8c36a33;padding-top:4px}.td .tdp .st b{display:block;font-size:.95rem;color:#fff1c8}.td .tdp .st span{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#8d7650}
.td .tdm{position:absolute;inset:0;z-index:5;background:#000b;display:none;align-items:center;justify-content:center;padding:14px}.td .tdm.on{display:flex}
.td .tdc{width:min(430px,100%);max-height:100%;overflow:auto;background:linear-gradient(#2a1c0e,#150d06);border:1px solid #e8c36a88;border-radius:18px;padding:16px 18px;box-shadow:0 10px 40px #000}
.td .tdc h3{margin:0 0 8px;font-size:1.2rem;color:#ffe9b0;display:flex;justify-content:space-between;align-items:center}.td .tdc h3 button{background:none;border:0;color:#e8c36a;font-size:20px;cursor:pointer}
.td .tdc p{margin:6px 0;line-height:1.5;font-size:14px;color:#ecdcb4}.td .tdc .hint{color:#a58c5c;font-size:12px}
.td .tdc .row2{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #e8c36a22}.td .tdc .row2 .ic{font-size:1.7rem}.td .tdc .row2 .tx{flex:1;min-width:0}.td .tdc .row2 .tx b{display:block;color:#fff1c8}.td .tdc .row2 .tx em{font-style:normal;font-size:12px;color:#a58c5c}
.td .tdb{background:linear-gradient(#f2d98e,#c89a3a);color:#3a2404;border:0;border-radius:10px;padding:7px 12px;font:700 13px inherit;cursor:pointer;white-space:nowrap}.td .tdb[disabled]{opacity:.4;cursor:default}.td .tdb.g{background:#3a2a16;color:#e8d3a0;border:1px solid #e8c36a55}
.td input{width:100%;background:#0c0603;color:#fff1c8;border:1px solid #e8c36a77;border-radius:10px;padding:8px 10px;font:inherit}
.td .que{border:1px dashed #e8c36a99;border-radius:14px;padding:14px;text-align:center;margin:10px 0}.td .que b{display:block;font-size:1.25rem;color:#ffe9b0;margin-bottom:4px}
.td .pond{width:100%!important;height:200px!important;border-radius:12px;background:#0d2a30;display:block}
/* máy tính: trò chơi phủ kín cả màn hình (trên thanh bên/đầu trang của site); điện thoại giữ khung trong trang */
.td .tdh{display:none}
@media(min-width:900px){.td{position:fixed;inset:0;z-index:70;width:auto;max-width:none;height:auto;min-height:0;margin:0;border-radius:0}.td .tdh{display:block;background:#1a120acc;border:1px solid #e8c36a77;color:#f5e6c4;border-radius:99px;padding:7px 16px;cursor:pointer;font:600 13px Georgia,serif}.td .tdt{padding:12px 22px}.td .tdt b{font-size:1.3rem}.td .tdn button{width:62px;padding:6px 0 5px;font-size:11px}.td .tdn button i{font-size:22px}.td .tdd{top:74px;padding:8px 26px}.td .tdd b{font-size:15px}.td .tdp{width:min(430px,92%);bottom:18px;padding:10px 20px 8px}.td .tdp .n{font-size:2.6rem}.td .tdp .rl{font-size:1.5rem}.td .tdbell{font-size:14px;padding:8px 20px}.td .tdsay{font-size:14px}}
@media(max-width:600px){.td{height:calc(100dvh - 190px);min-height:420px}.td .tdn{width:100%;justify-content:space-between}.td .tdn button{flex:1;width:auto;font-size:8.5px}.td .tdn button i{font-size:16px}.td .tdt b{display:none}.td .tdp .n{font-size:1.9rem}.td .tdp .rl{font-size:1.1rem}.td .tdp{padding:8px 12px 6px}.td .tdd{top:52px}}
</style><div class="td"><canvas></canvas>
<div class="tdt"><button class="tdh" title="Về trang chủ GameVui">‹ Trang chủ</button><b>🪘 Tích Đức Online</b><div class="tdn"><button data-m="me"><i>🙂</i>Tôi</button><button data-m="que"><i>🎋</i>Quẻ</button><button data-m="shop"><i>🛍️</i>Cửa hàng</button><button data-m="pond"><i>🐟</i>Hồ cá</button><button class="mu"><i>🎵</i>Nhạc</button><button data-m="help"><i>ℹ️</i>Trợ giúp</button></div></div>
<div class="tdd ${TD.special ? 'sp' : ''}"><b>${GV.esc(TD.txt)}</b>${GV.esc(TD.name)} · ${TD.hd ? 'Hoàng đạo (Tốt)' : 'Hắc đạo (Thường)'}${TD.special ? ' · ' + (TD.l.d === 1 ? 'Mùng một' : 'Rằm') + ' công đức ×2' : ''}</div>
<div class="tdsay"></div><button class="tdbell">🔔 Thỉnh chuông</button>
<div class="tdp"><small>Công đức</small><div class="n">0</div><div class="x"></div><small style="margin-top:2px">Cảnh giới hiện tại</small><div class="rl"></div><div class="bar"><i></i></div><div class="pg"></div>
<div class="st"><div><b class="s1">0</b><span>Lần gõ</span></div><div><b class="s2"></b><span>Đỉnh cao</span></div><div><b class="s3">0p</b><span>Tu tập</span></div></div></div>
<div class="tdm"><div class="tdc"></div></div></div>`;
      const $ = s => el.querySelector(s), root = $('.td'), cv = $('canvas'), ctx = cv.getContext('2d');
      // phủ kín màn hình (position:fixed) cần các khung cha không có transform (animation `rise` của .stage tạo ra transform)
      const anc = []; for (let n = el; n && n !== document.body; n = n.parentElement) { if (n.id !== 'app') { anc.push([n, n.style.animation, n.style.transform]); n.style.animation = 'none'; n.style.transform = 'none'; } }
      let W = 0, H = 0, DPR = 1;
      const fit = () => { DPR = Math.min(2, window.devicePixelRatio || 1); const r = root.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); place(); };
      const place = () => { const pH = $('.tdp').offsetHeight; $('.tdbell').style.bottom = (pH + 20) + 'px'; $('.tdsay').style.bottom = (pH + 56) + 'px'; };

      /* ---------- Âm thanh (WebAudio, không dùng tệp ngoài) ---------- */
      const AC = () => { try { return GV._ac || (GV._ac = new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { return null; } };
      function knock() { const a = AC(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(), o2 = a.createOscillator(), g2 = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + .09); g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o2.type = 'triangle'; o2.frequency.setValueAtTime(1300, t); o2.frequency.exponentialRampToValueAtTime(700, t + .03); g2.gain.setValueAtTime(.09, t); g2.gain.exponentialRampToValueAtTime(.001, t + .05); o.connect(g); g.connect(a.destination); o2.connect(g2); g2.connect(a.destination); o.start(t); o.stop(t + .2); o2.start(t); o2.stop(t + .06); }
      function bell() { const a = AC(); if (!a) return; const t = a.currentTime; [[440, .12], [880, .06], [1320, .035], [1768, .02]].forEach(([f, v]) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f * (1 + (Math.random() - .5) * .004); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0005, t + 3.2); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 3.3); }); }
      let pad = null;
      // Nhạc thiền: ưu tiên bài thật `audio/thien.mp3` (chủ tự đặt vào, loop); không có thì phát bản tự soạn bằng WebAudio:
      // giai điệu sáo chậm (~55 nhịp/phút) trên ngũ cung Rê trưởng, hợp âm nền Rê–Si thứ–Sol–La, bát hát + vang (reverb).
      let song = null, songChk = null;
      const NOTE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880]; // D4 E4 F#4 A4 B4 D5 E5 F#5 A5
      const PHRASE = [ // [chỉ số nốt (-1 = nghỉ), số phách]
        [[3, 2], [4, 1], [3, 1], [2, 2], [1, 2], [0, 4], [-1, 2]], [[2, 2], [3, 1], [2, 1], [1, 2], [0, 2], [1, 2], [2, 4], [-1, 2]],
        [[5, 3], [4, 1], [3, 2], [4, 2], [3, 2], [2, 4], [-1, 2]], [[3, 2], [2, 1], [1, 1], [0, 2], [1, 2], [0, 6], [-1, 2]]];
      const CHORD = [[73.42, 146.83, 185, 220, 329.63], [61.74, 123.47, 146.83, 185, 246.94], [98, 196, 246.94, 293.66, 392], [110, 220, 277.18, 329.63, 440]]; // D · Bm · G · A
      function synthSong(a) {
        const out = a.createGain(); out.gain.value = 0; out.connect(a.destination); out.gain.linearRampToValueAtTime(.9, a.currentTime + 3);
        const len = Math.floor(a.sampleRate * 3.6), ir = a.createBuffer(2, len, a.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
        const cvb = a.createConvolver(); cvb.buffer = ir; const wet = a.createGain(), dry = a.createGain(), bus = a.createGain(); wet.gain.value = .65; dry.gain.value = .65; cvb.connect(wet); wet.connect(out); dry.connect(out); bus.connect(dry); bus.connect(cvb);
        const timers = [], P = { out, timers, stop() { } }, BEAT = 1.1;
        const tone = (f, t, dur, type, vol, att, rel, vib) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f; if (vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .006, t + .6); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + rel + .1); } g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.setValueAtTime(vol, t + Math.max(att, dur - .1)); g.gain.linearRampToValueAtTime(0, t + dur + rel); o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + rel + .1); };
        const bowl = (f, t) => [[1, .12], [2.76, .05], [5.4, .02]].forEach(([m, v]) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f * m; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .04); g.gain.exponentialRampToValueAtTime(.0004, t + 7); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 7.2); });
        let ci = 0, pi = 0, ni = 0;
        const chord = () => { if (pad !== P) return; const t = a.currentTime, d = BEAT * 8; CHORD[ci % 4].forEach((f, k) => { tone(f, t, d, 'sine', .03 - k * .003, 3, 2.5, false); tone(f * 1.004, t, d, 'sine', .02, 3.5, 2.5, false); }); bowl(CHORD[ci % 4][0] * 4, t + .05); ci++; timers.push(setTimeout(chord, d * 1000)); };
        const melody = () => { if (pad !== P) return; const ph = PHRASE[pi % 4], [n, bt] = ph[ni]; const t = a.currentTime + .05, dur = bt * BEAT; if (n >= 0) { tone(NOTE[n], t, dur * .9, 'sine', .11, .22, 1.6, true); tone(NOTE[n] * 2, t, dur * .7, 'sine', .015, .3, 1.2, true); } ni++; if (ni >= ph.length) { ni = 0; pi++; } timers.push(setTimeout(melody, dur * 1000)); };
        pad = P; chord(); timers.push(setTimeout(melody, 4200));
        return P;
      }
      function music(on) {
        const a = AC(); if (!a) return;
        if (on && !pad && !song) {
          // thử bài thật trước
          const myChk = songChk = {}; fetch('audio/thien.mp3', { method: 'HEAD' }).then(r => { if (songChk !== myChk) return; if (r.ok) { song = new Audio('audio/thien.mp3'); song.loop = true; song.volume = .55; song.play().catch(() => {}); } else synthSong(a); }).catch(() => { if (songChk === myChk) synthSong(a); });
        } else if (!on) {
          songChk = null; if (song) { try { song.pause(); } catch (e) {} song = null; }
          if (pad) { const P = pad; pad = null; P.timers.forEach(clearTimeout); try { P.out.gain.cancelScheduledValues(a.currentTime); P.out.gain.setValueAtTime(P.out.gain.value, a.currentTime); P.out.gain.linearRampToValueAtTime(0, a.currentTime + 1.2); } catch (e) {} }
        }
      }

      /* ---------- Lõi trò chơi ---------- */
      const mul = () => (1 + D.mal) * (TD.special ? 2 : 1);
      const perSec = () => D.inc * .34 + D.fish * .1;
      function add(n, x, y, txt) { D.m += n; D.tot += n; const r = realmOf(D.tot); if (r > D.top) { D.top = r; toast('Thăng cảnh giới: ' + REALMS[r][0] + ' 🪷'); bell(); for (let i = 0; i < 40; i++) sparks.push({ x: W / 2, y: H * .4, vx: (Math.random() - .5) * 260, vy: -Math.random() * 240 - 40, l: 1.4 }); } if (txt !== false && x != null) floats.push({ x, y, t: txt || '+' + fmt(n), l: 1 }); }
      function toast(t) { GV.toast ? GV.toast(t, { type: 'success' }) : 0; }
      function tap(x, y) {
        if (modal || dead) return; D.taps++; swing = 1; shake = 1; glow = Math.min(1, glow + .35); knock(); add(mul(), x == null ? W / 2 : x, y == null ? H * .5 : y);
        rings.push({ r: 20, a: .6 }); if (D.taps % 12 === 0) sayI = (sayI + 1) % SAY.length, say(SAY[sayI]);
        if (navigator.vibrate && D.taps % 3 === 0) { try { navigator.vibrate(8); } catch (e) {} }
      }
      function say(t) { const s = $('.tdsay'); s.textContent = t; s.style.opacity = .9; }
      cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); try { if (D.music && !pad && !song) music(true); } catch (x) {} });
      const offKeys = GV.keys(e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) tap(); });
      $('.tdh').onclick = () => { location.hash = '#/'; };
      $('.tdbell').onclick = () => { const n = Date.now(); if (n - D.bell < 20000) return; D.bell = n; bell(); add(mul() * 8, W / 2, H * .55, '+' + fmt(mul() * 8) + ' 🔔'); sparks.push(...Array.from({ length: 16 }, () => ({ x: W / 2, y: H * .55, vx: (Math.random() - .5) * 160, vy: -Math.random() * 140, l: 1 }))); };

      /* ---------- Bảng thông tin ---------- */
      function hud() {
        const r = realmOf(D.tot), lo = REALMS[r][1], nx = REALMS[r + 1], pct = nx ? (D.tot - lo) / (nx[1] - lo) * 100 : 100;
        $('.tdp .n').textContent = fmt(D.m); $('.tdp .x').textContent = 'x' + mul() + ' mỗi nhịp' + (perSec() ? ' · +' + perSec().toFixed(1) + '/giây' : ''); $('.tdp .rl').textContent = REALMS[r][0];
        $('.tdp .bar i').style.width = pct + '%'; $('.tdp .pg').textContent = nx ? `${fmt(D.tot - lo)} / ${fmt(nx[1] - lo)} • ${nx[0]}` : 'Đã đạt cảnh giới cao nhất';
        $('.s1').textContent = fmt(D.taps); $('.s2').textContent = REALMS[D.top][0]; $('.s3').textContent = Math.floor(D.play / 60) + 'p';
        const b = $('.tdbell'), cd = 20000 - (Date.now() - D.bell); b.disabled = cd > 0; b.textContent = cd > 0 ? `🔔 Chờ ${Math.ceil(cd / 1000)}s` : '🔔 Thỉnh chuông';
        $$('[data-m]').forEach(x => x.classList.toggle('on', x.dataset.m === modal));
      }
      const $$ = s => [...el.querySelectorAll(s)];

      /* ---------- Cửa sổ chức năng ---------- */
      const mo = $('.tdm'), mc = $('.tdc');
      const open = k => { modal = k; mo.classList.add('on'); draw(k); hud(); }, close = () => { modal = ''; mo.classList.remove('on'); stopPond(); hud(); };
      mo.addEventListener('pointerdown', e => { if (e.target === mo) close(); });
      $$('[data-m]').forEach(b => b.onclick = () => modal === b.dataset.m ? close() : open(b.dataset.m));
      $('.mu').onclick = () => { D.music = !D.music; $('.mu').classList.toggle('on', D.music); music(D.music); save(); }; $('.mu').classList.toggle('on', D.music);
      const head = t => `<h3>${t}<button data-x>✕</button></h3>`;
      const costMal = () => Math.round(40 * Math.pow(1.7, D.mal - 1)), costInc = () => Math.round(120 * Math.pow(1.75, D.inc)), costFish = () => Math.round(90 * Math.pow(1.5, D.fish));
      function draw(k) {
        if (k === 'me') {
          mc.innerHTML = head('🙂 Tôi') + `<p class="hint">Tên hiển thị (chỉ lưu trên máy này)</p><input class="nm" maxlength="24" placeholder="Đạo hữu vô danh" value="${GV.esc(D.name)}"><p>Cảnh giới: <b>${REALMS[realmOf(D.tot)][0]}</b><br>Tổng công đức đã tích: <b>${fmt(D.tot)}</b><br>Số lần gõ: <b>${fmt(D.taps)}</b> · Thời gian tu tập: <b>${Math.floor(D.play / 60)} phút</b><br>Dùi mõ: cấp <b>${D.mal}</b> · Nén hương: cấp <b>${D.inc}</b> · Cá: <b>${D.fish}</b></p><p class="hint">Công đức chỉ là điểm ảo để thư giãn. Việc thiện thật là điều bạn làm ngoài đời 🙏</p><button class="tdb g rs">Đặt lại từ đầu</button>`;
          mc.querySelector('.nm').oninput = e => { D.name = e.target.value.trim(); save(); };
          mc.querySelector('.rs').onclick = () => { if (confirm('Xoá toàn bộ tiến trình Tích Đức?')) { Object.assign(D, { m: 0, tot: 0, taps: 0, top: 0, play: 0, mal: 1, inc: 0, fish: 0, skin: 0, own: [0], que: null, quet: '', bell: 0 }); save(); draw('me'); hud(); } };
        } else if (k === 'que') {
          const got = D.quet === TD.key && D.que != null, q = got ? QUE[D.que] : null;
          mc.innerHTML = head('🎋 Rút quẻ đầu ngày') + `<p>Mỗi ngày một quẻ để tham khảo cho vui, không phải lời tiên tri. Rút xong được thưởng <b>30 công đức</b>.</p><div class="que">${got ? `<b>${q[0]}</b>${GV.esc(q[1])}` : '🎋 Chưa rút quẻ hôm nay'}</div><button class="tdb dr" ${got ? 'disabled' : ''}>${got ? 'Đã rút hôm nay' : 'Rút quẻ'}</button><p class="hint">${TD.txt} · ngày ${TD.name} · ${TD.hd ? 'Hoàng đạo' : 'Hắc đạo'}</p>`;
          mc.querySelector('.dr').onclick = () => { D.que = GV.rnd(QUE.length); D.quet = TD.key; add(30, W / 2, H * .45); save(); draw('que'); hud(); };
        } else if (k === 'shop') {
          const row = (ic, n, d, lv, cost, id) => `<div class="row2"><span class="ic">${ic}</span><span class="tx"><b>${n}</b><em>${d}${lv != null ? ' · cấp ' + lv : ''}</em></span><button class="tdb" data-b="${id}" ${D.m < cost ? 'disabled' : ''}>${fmt(cost)}</button></div>`;
          mc.innerHTML = head('🛍️ Cửa hàng') + `<p class="hint">Công đức hiện có: <b>${fmt(D.m)}</b> (mua đồ không làm tụt cảnh giới)</p>` + row('🥢', 'Dùi mõ vàng', '+1 công đức mỗi nhịp gõ', D.mal, costMal(), 'mal') + row('🪔', 'Nén hương trầm', '+0,34 công đức mỗi giây, tự tích', D.inc, costInc(), 'inc')
            + SKINS.map((s, i) => `<div class="row2"><span class="ic">🏯</span><span class="tx"><b>Nền: ${s.n}</b><em>${D.own.includes(i) ? (D.skin === i ? 'Đang dùng' : 'Đã sở hữu') : 'Đổi màu không gian chùa'}</em></span><button class="tdb ${D.own.includes(i) ? 'g' : ''}" data-s="${i}" ${!D.own.includes(i) && D.m < s.cost ? 'disabled' : ''}>${D.own.includes(i) ? (D.skin === i ? '✓' : 'Dùng') : fmt(s.cost)}</button></div>`).join('');
          mc.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const id = b.dataset.b, c = id === 'mal' ? costMal() : costInc(); if (D.m < c) return; D.m -= c; D[id]++; knock(); save(); draw('shop'); hud(); });
          mc.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const i = +b.dataset.s, s = SKINS[i]; if (!D.own.includes(i)) { if (D.m < s.cost) return; D.m -= s.cost; D.own.push(i); } D.skin = i; save(); draw('shop'); hud(); });
        } else if (k === 'pond') {
          mc.innerHTML = head('🐟 Hồ cá') + `<canvas class="pond" width="400" height="200"></canvas><p class="hint">Mỗi chú cá tự tích +0,1 công đức/giây. Chạm vào hồ để rắc thức ăn.</p><div class="row2"><span class="ic">🐠</span><span class="tx"><b>Thả thêm cá (${D.fish}/8)</b><em>Cá chép càng nhiều hồ càng vui</em></span><button class="tdb" data-f ${D.fish >= 8 || D.m < costFish() ? 'disabled' : ''}>${D.fish >= 8 ? 'Đầy' : fmt(costFish())}</button></div>`;
          mc.querySelector('[data-f]').onclick = () => { if (D.fish >= 8 || D.m < costFish()) return; D.m -= costFish(); D.fish++; save(); draw('pond'); hud(); }; startPond(mc.querySelector('.pond'));
        } else if (k === 'help') {
          mc.innerHTML = head('ℹ️ Trợ giúp') + `<p><b>Cách chơi:</b> chạm vào màn hình (hoặc nhấn Space / Enter) để gõ mõ, mỗi nhịp tích công đức. Đủ công đức thì thăng cảnh giới.</p><p><b>Thỉnh chuông:</b> nhận thưởng lớn, hồi lại sau 20 giây.<br><b>Quẻ:</b> rút mỗi ngày một lần.<br><b>Cửa hàng:</b> nâng dùi mõ, thắp hương trầm (tự tích), đổi nền chùa.<br><b>Hồ cá:</b> nuôi cá tự tích công đức.<br><b>Mùng 1 và Rằm (âm lịch):</b> công đức nhân đôi.</p><p class="hint">Trò chơi chỉ để giải trí và thư giãn, công đức là điểm ảo, không đổi ra tiền hay vật phẩm thật. Dữ liệu lưu trên máy bạn. Âm thanh và hình ảnh đều tạo ra bằng mã nguồn.</p>`;
        }
        const x = mc.querySelector('[data-x]'); if (x) x.onclick = close;
      }

      /* ---------- Hồ cá ---------- */
      let pondRaf = 0, pond = null; const food = [];
      function stopPond() { cancelAnimationFrame(pondRaf); pondRaf = 0; pond = null; }
      function startPond(c) {
        const g = c.getContext('2d'), fs = Array.from({ length: Math.max(1, D.fish) }, (_, i) => ({ x: Math.random() * 400, y: 30 + Math.random() * 140, a: Math.random() * 6.28, s: .5 + Math.random() * .5, h: [14, 28, 200, 330, 0][i % 5], ph: Math.random() * 6 }));
        c.onpointerdown = e => { const r = c.getBoundingClientRect(); for (let i = 0; i < 5; i++) food.push({ x: (e.clientX - r.left) * 400 / r.width + (Math.random() - .5) * 20, y: (e.clientY - r.top) * 200 / r.height + (Math.random() - .5) * 20, l: 4 }); };
        pond = true; const f = t => { if (!pond) return; g.fillStyle = '#0d2a30'; g.fillRect(0, 0, 400, 200); for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(255,255,255,.04)'; g.beginPath(); g.arc(100 + i * 90, 100 + Math.sin(t / 900 + i) * 20, 40 + i * 10, 0, 6.28); g.stroke(); }
          food.forEach(p => { p.l -= .016; g.fillStyle = '#e8c36a'; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 6.28); g.fill(); }); for (let i = food.length - 1; i >= 0; i--) if (food[i].l <= 0) food.splice(i, 1);
          fs.forEach(k => { const tgt = food[0]; if (tgt) { const da = Math.atan2(tgt.y - k.y, tgt.x - k.x); let d = da - k.a; d = Math.atan2(Math.sin(d), Math.cos(d)); k.a += d * .06; if (Math.hypot(tgt.x - k.x, tgt.y - k.y) < 8) food.shift(); } else k.a += Math.sin(t / 900 + k.ph) * .02; k.x += Math.cos(k.a) * k.s * 1.1; k.y += Math.sin(k.a) * k.s * 1.1; if (k.x < 10 || k.x > 390) k.a = Math.PI - k.a; if (k.y < 10 || k.y > 190) k.a = -k.a; k.x = Math.max(5, Math.min(395, k.x)); k.y = Math.max(5, Math.min(195, k.y));
            g.save(); g.translate(k.x, k.y); g.rotate(k.a); const w = Math.sin(t / 120 + k.ph) * 4; g.fillStyle = `hsl(${k.h},85%,${k.h > 100 ? 55 : 58}%)`; g.beginPath(); g.ellipse(0, 0, 16, 7, 0, 0, 6.28); g.fill(); g.beginPath(); g.moveTo(-13, 0); g.lineTo(-24, -6 + w); g.lineTo(-24, 6 + w); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(9, -2.5, 1.7, 0, 6.28); g.fill(); g.restore(); });
          pondRaf = requestAnimationFrame(f); }; pondRaf = requestAnimationFrame(f);
      }

      /* ---------- Vẽ cảnh chùa ---------- */
      const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
      function scene(t, dt) {
        const sk = SKINS[D.skin] || SKINS[0], g = sk.g, pH = $('.tdp').offsetHeight, top = 96, sh = Math.max(200, H - pH - top - 24), u = Math.min(W / 520, sh / 470) , ox = W / 2 - 260 * u, oy = top + (sh - 470 * u) / 2;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, sk.c[0]); bg.addColorStop(1, sk.c[1]); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const photo = BG.complete && BG.naturalWidth > 0;
        let mu = u, mox = ox, moy = oy;
        if (photo) {
          const sc = Math.max(W / 1920, H / 1047, (pH + 95) / 420), iw = 1920 * sc, ih = 1047 * sc, ix = (W - iw) / 2, iy = Math.min(0, Math.max(H - ih, H - pH - 95 - 40 * sc - 585 * sc)); // dịch ảnh lên để mõ nằm trên bảng thông tin
          ctx.drawImage(BG, ix, iy, iw, ih); ctx.fillStyle = D.skin ? sk.c[0] + '99' : 'rgba(8,4,2,.5)'; ctx.fillRect(0, 0, W, H);
          const hr = 215 * sc * (1 + Math.sin(t / 900) * .03 + glow * .15), hg = ctx.createRadialGradient(ix + 960 * sc, iy + 345 * sc, 8, ix + 960 * sc, iy + 345 * sc, hr); hg.addColorStop(0, g + '88'); hg.addColorStop(.5, g + '33'); hg.addColorStop(1, g + '00'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(ix + 960 * sc, iy + 345 * sc, hr, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
          mu = sc * .94; mox = ix + 960 * sc - 260 * mu; moy = iy + 585 * sc - 300 * mu; ctx.save(); ctx.translate(mox, moy); ctx.scale(mu, mu);
        } else {
        // xà ngang + cột gỗ + câu đối
        const px = Math.min(W * .17, 150 * u + 30), pw = Math.max(34, 46 * u);
        [[W / 2 - 245 * u - pw / 2, 'LÒNG TỪ BI LAN TỎA'], [W / 2 + 245 * u - pw / 2, 'PHƯỚC ĐỨC VIÊN MÃN']].forEach(([x, txt], i) => {
          const gr = ctx.createLinearGradient(x, 0, x + pw, 0); gr.addColorStop(0, '#2b1709'); gr.addColorStop(.5, '#5a3414'); gr.addColorStop(1, '#2b1709'); ctx.fillStyle = gr; ctx.fillRect(x, 50, pw, H); ctx.fillStyle = g; ctx.globalAlpha = .88; ctx.font = `700 ${Math.max(11, 15 * u)}px Georgia,serif`; ctx.textAlign = 'center';
          const L = txt.replace(/ /g, '').split(''); const gap = Math.min(24 * u, (H - 190) / L.length); L.forEach((c2, k) => ctx.fillText(c2, x + pw / 2, 110 + k * gap)); ctx.globalAlpha = 1; });
        // cửa chấn song hai bên + đèn lồng
        ctx.strokeStyle = g + '22'; ctx.lineWidth = 2; const lx0 = W / 2 + 290 * u; for (let i = 0; i < 9; i++) { const dx = i * 16; ctx.beginPath(); ctx.moveTo(lx0 + dx, 120); ctx.lineTo(lx0 + dx, H * .78); ctx.stroke(); ctx.beginPath(); ctx.moveTo(W / 2 - 290 * u - dx, 120); ctx.lineTo(W / 2 - 290 * u - dx, H * .78); ctx.stroke(); }
        [[.1, 1], [.9, 2]].forEach(([fx, k]) => { const x = W * fx, y = 100 + Math.sin(t / 900 + k) * 4, lg = ctx.createRadialGradient(x, y, 2, x, y, 46); lg.addColorStop(0, '#ff5a3a88'); lg.addColorStop(1, '#ff5a3a00'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x, y, 46, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x, y - 20); ctx.stroke(); ctx.fillStyle = '#c0281f'; ctx.beginPath(); ctx.ellipse(x, y, 16, 20, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#e8c36a'; ctx.fillRect(x - 8, y - 22, 16, 4); ctx.fillRect(x - 8, y + 18, 16, 4); });
        ctx.save(); ctx.translate(ox, oy); ctx.scale(u, u);
        // quầng sáng sau tượng
        const pulse = 1 + Math.sin(t / 900) * .03 + glow * .12; const rg = ctx.createRadialGradient(260, 160, 10, 260, 160, 190 * pulse); rg.addColorStop(0, g + 'cc'); rg.addColorStop(.45, g + '44'); rg.addColorStop(1, g + '00'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(260, 160, 190 * pulse, 0, 6.28); ctx.fill();
        ctx.strokeStyle = g + '88'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(260, 150, 78 + i * 12, 0, 6.28); ctx.stroke(); }
        // đài sen
        ctx.fillStyle = '#7a4a14'; rr(120, 360, 280, 26, 10); ctx.fill(); for (let i = -4; i <= 4; i++) { ctx.fillStyle = i % 2 ? '#e9a1b8' : '#f7c6d3'; ctx.beginPath(); ctx.ellipse(260 + i * 30, 356, 22, 16, i * .08, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#b8667f'; ctx.stroke(); }
        // thân tượng
        const bodyG = ctx.createLinearGradient(0, 100, 0, 360); bodyG.addColorStop(0, '#f0c25a'); bodyG.addColorStop(1, '#a96f1c'); ctx.fillStyle = bodyG;
        ctx.beginPath(); ctx.moveTo(205, 195); ctx.quadraticCurveTo(190, 250, 140, 330); ctx.quadraticCurveTo(260, 365, 380, 330); ctx.quadraticCurveTo(330, 250, 315, 195); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#8a5612'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(230 + i * 20, 215); ctx.quadraticCurveTo(215 + i * 25, 280, 180 + i * 45, 335); ctx.stroke(); }
        ctx.fillStyle = '#e6b64c'; ctx.beginPath(); ctx.ellipse(260, 312, 66, 22, 0, 0, 6.28); ctx.fill(); // tay đặt trên gối
        ctx.fillStyle = '#f0c25a'; ctx.beginPath(); ctx.ellipse(260, 160, 44, 52, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#d9a43a'; ctx.beginPath(); ctx.ellipse(260, 118, 20, 14, 0, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#e6b64c'; ctx.beginPath(); ctx.ellipse(214, 168, 8, 24, .1, 0, 6.28); ctx.ellipse(306, 168, 8, 24, -.1, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#7a4a14'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(244, 160, 8, .15 * Math.PI, .85 * Math.PI); ctx.arc(276, 160, 8, .15 * Math.PI, .85 * Math.PI); ctx.moveTo(250, 186); ctx.quadraticCurveTo(260, 193, 270, 186); ctx.stroke(); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(260, 141, 3, 0, 6.28); ctx.fill();
        // nến + hương
        [[70, 1], [450, 2]].forEach(([x, k]) => { ctx.fillStyle = '#f4e8c8'; ctx.fillRect(x - 8, 330, 16, 60); ctx.fillStyle = '#6b3d14'; ctx.fillRect(x - 14, 388, 28, 8); const f = 1 + Math.sin(t / 130 + k * 3) * .15; const fg = ctx.createRadialGradient(x, 322, 1, x, 322, 40); fg.addColorStop(0, '#ffe08a99'); fg.addColorStop(1, '#ffa00000'); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, 322, 40, 0, 6.28); ctx.fill(); ctx.fillStyle = '#ffb340'; ctx.beginPath(); ctx.ellipse(x, 320, 5 * f, 11 * f, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.ellipse(x, 322, 2.4, 6, 0, 0, 6.28); ctx.fill(); });
        ctx.fillStyle = '#8a5a1e'; ctx.beginPath(); ctx.ellipse(440 - 60, 392, 26, 10, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#c0392b'; for (let i = -1; i <= 1; i++) ctx.fillRect(380 + i * 8 - 1, 360, 2, 32);
        }
        // hương khói
        if (Math.random() < .35) smoke.push({ x: (photo ? 276 : 380) + (Math.random() - .5) * 20, y: photo ? 481 : 360, vx: (Math.random() - .5) * 6, vy: -26 - Math.random() * 12, r: 3, a: .28 }); smoke.forEach(p => { p.x += p.vx * dt + Math.sin(t / 500 + p.y / 30) * .15; p.y += p.vy * dt; p.r += 6 * dt; p.a -= .09 * dt; ctx.fillStyle = `rgba(230,220,200,${Math.max(0, p.a)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }); for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].a <= 0) smoke.splice(i, 1);
        // mõ
        const sq = 1 - shake * .06, cx = 260, cy = 300 + shake * 3;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + shake * .03, sq); ctx.shadowColor = '#000a'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
        const mg = ctx.createRadialGradient(-20, -26, 8, 0, 0, 100); mg.addColorStop(0, '#c9936b'); mg.addColorStop(.6, '#8a5a38'); mg.addColorStop(1, '#5a3520'); ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(0, 0, 90, 62, 0, 0, 6.28); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#4a2a16'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -2, 62, 40, 0, 0, 6.28); ctx.stroke(); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-20, -4, 9, .1 * Math.PI, .9 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(20, -4, 9, .1 * Math.PI, .9 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 8, 14, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); ctx.restore();
        // dùi: xoay quanh đầu cán (tay cầm), đầu dùi vung xuống gõ vào mõ rồi nâng lên
        ctx.save(); ctx.translate(400, 390); const hit = swing > .8 ? (1 - swing) / .2 : swing / .8; ctx.rotate(.12 - hit * .74); ctx.fillStyle = '#9a6a42'; rr(-6, -150, 12, 150, 5); ctx.fill(); ctx.fillStyle = '#c28a58'; rr(-2, -146, 3, 140, 2); ctx.fill(); ctx.fillStyle = '#7d4d2a'; ctx.beginPath(); ctx.arc(0, -160, 22, 0, 6.28); ctx.fill(); ctx.fillStyle = '#b07a4a'; ctx.beginPath(); ctx.arc(-6, -167, 8, 0, 6.28); ctx.fill(); ctx.restore();
        rings.forEach(r => { r.r += 150 * dt; r.a -= .9 * dt; ctx.strokeStyle = `rgba(255,220,130,${Math.max(0, r.a)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(260, 300, r.r * 1.5, r.r, 0, 0, 6.28); ctx.stroke(); }); for (let i = rings.length - 1; i >= 0; i--) if (rings[i].a <= 0) rings.splice(i, 1);
        ctx.restore();
        // hạt sáng + chữ nổi (toạ độ màn hình)
        sparks.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.l -= dt; ctx.fillStyle = `rgba(255,224,130,${Math.max(0, s.l)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 2.4, 0, 6.28); ctx.fill(); }); for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].l <= 0) sparks.splice(i, 1);
        ctx.textAlign = 'center'; ctx.font = '700 22px Georgia,serif'; floats.forEach(f => { f.y -= 60 * dt; f.l -= dt * .9; ctx.globalAlpha = Math.max(0, f.l); ctx.fillStyle = '#000'; ctx.fillText(f.t, f.x + 1, f.y + 1); ctx.fillStyle = '#ffe9a0'; ctx.fillText(f.t, f.x, f.y); }); ctx.globalAlpha = 1; for (let i = floats.length - 1; i >= 0; i--) if (floats[i].l <= 0) floats.splice(i, 1);
        // tối viền
        const vg = ctx.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .3, W / 2, H * .45, Math.max(W, H) * .75); vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#000a'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      }
      function frame(now) {
        if (dead) return; const dt = Math.min(.05, (now - last) / 1000); last = now;
        swing = Math.max(0, swing - dt * 6); shake = Math.max(0, shake - dt * 7); glow = Math.max(0, glow - dt * .9);
        if (W) scene(now, dt);
        tickT += dt; if (tickT >= 1) { tickT -= 1; if (vis) D.play++; const ps = perSec(); if (ps) { incT += ps; const n = Math.floor(incT); if (n) { incT -= n; add(n, W / 2 + (Math.random() - .5) * 80, H * .38, '+' + n); } } hud(); }
        saveT += dt; if (saveT > 5) { saveT = 0; save(); }
        raf = requestAnimationFrame(frame);
      }
      const onVis = () => { vis = !document.hidden; }; document.addEventListener('visibilitychange', onVis);
      const ro = new ResizeObserver(fit); ro.observe(root); fit(); hud(); raf = requestAnimationFrame(frame);
      if (!D.name) say('Chạm vào mõ để bắt đầu tích đức 🙏'); else say('Chào ' + D.name + ', an yên nhé 🙏');
      GV.tdT = { D, tap, open, close, get modal() { return modal; }, lunar, today: TD, realmOf, REALMS };
      return () => { dead = true; anc.forEach(([n, a, t]) => { n.style.animation = a; n.style.transform = t; }); cancelAnimationFrame(raf); stopPond(); ro.disconnect(); offKeys(); document.removeEventListener('visibilitychange', onVis); music(false); save(); };
    }
  });
})();
