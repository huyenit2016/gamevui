// Tiện ích cơ bản: Máy tính, Đổi đơn vị, Bấm giờ & Hẹn giờ, Pomodoro, Đồng hồ thế giới
(function () {
  /* ---------- CALCULATOR ---------- */
  GV.register({
    id: 'calc', type: 'tool', cat: 'Tính toán', name: 'Máy tính', icon: '🧮', desc: 'Máy tính cơ bản, hỗ trợ bàn phím.',
    mount(el) {
      const keys = ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', '.', '='];
      el.innerHTML = `<div class="tool" style="max-width:320px"><div class="res" style="text-align:right;min-height:80px"><div class="hint ex" style="min-height:1.4em"></div><div class="big out" style="text-align:right;font-size:2rem;overflow:hidden">0</div></div>
      <div class="bd" style="grid-template-columns:repeat(4,1fr)">${keys.map(k => `<button class="btn ${/[÷×−+=]/.test(k) ? '' : 'ghost'}" data-k="${k}" style="padding:14px 0;font-size:18px">${k}</button>`).join('')}</div></div>`;
      const out = el.querySelector('.out'), ex = el.querySelector('.ex');
      let a = null, op = null, cur = '0', fresh = false;
      const calc = (x, o, y) => o === '+' ? x + y : o === '−' ? x - y : o === '×' ? x * y : o === '÷' ? (y === 0 ? NaN : x / y) : y;
      const fmt = n => isNaN(n) ? 'Lỗi' : String(+n.toPrecision(12));
      function key(k) {
        if (/\d/.test(k)) { cur = (fresh || cur === '0') ? k : cur + k; fresh = false; }
        else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
        else if (k === 'C') { a = op = null; cur = '0'; ex.textContent = ''; }
        else if (k === '⌫') cur = cur.length > 1 ? cur.slice(0, -1) : '0';
        else if (k === '±') cur = cur.startsWith('-') ? cur.slice(1) : cur === '0' ? cur : '-' + cur;
        else if (k === '%') cur = fmt(parseFloat(cur) / 100);
        else if (k === '=') { if (op) { const r = calc(a, op, parseFloat(cur)); ex.textContent = `${fmt(a)} ${op} ${cur} =`; cur = fmt(r); a = op = null; fresh = true; } }
        else { if (op && !fresh) { a = calc(a, op, parseFloat(cur)); cur = fmt(a); } else a = parseFloat(cur); op = k; ex.textContent = `${fmt(a)} ${k}`; fresh = true; }
        out.textContent = cur;
      }
      el.onclick = e => { const k = e.target.dataset.k; if (k) key(k); };
      const off = GV.keys(e => {
        const m = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'C' }[e.key] || e.key;
        if (keys.includes(m)) key(m);
      }, false);
      return off;
    }
  });

  /* ---------- UNIT CONVERTER ---------- */
  const U = {
    'Độ dài': { 'mm': .001, 'cm': .01, 'm': 1, 'km': 1000, 'inch': .0254, 'foot': .3048, 'yard': .9144, 'dặm (mile)': 1609.344 },
    'Khối lượng': { 'mg': 1e-6, 'g': .001, 'kg': 1, 'tạ': 100, 'tấn': 1000, 'ounce': .0283495, 'pound': .453592, 'lượng (37.5g)': .0375 },
    'Diện tích': { 'm²': 1, 'km²': 1e6, 'ha': 1e4, 'sào Bắc Bộ (360m²)': 360, 'công (1000m²)': 1000, 'acre': 4046.856, 'foot²': .092903 },
    'Thể tích': { 'ml': .001, 'lít': 1, 'm³': 1000, 'gallon (US)': 3.78541, 'cup (US)': .236588 },
    'Tốc độ': { 'm/s': 1, 'km/h': 1 / 3.6, 'mph': .44704, 'hải lý/giờ': .514444 },
    'Dữ liệu': { 'bit': 1 / 8, 'byte': 1, 'KB': 1024, 'MB': 1048576, 'GB': 1073741824, 'TB': 1099511627776 },
    'Thời gian': { 'giây': 1, 'phút': 60, 'giờ': 3600, 'ngày': 86400, 'tuần': 604800, 'năm': 31557600 },
    'Nhiệt độ': null
  };
  GV.register({
    id: 'unit', type: 'tool', cat: 'Tính toán', name: 'Đổi đơn vị', icon: '📏', desc: 'Độ dài, khối lượng, nhiệt độ, dữ liệu…',
    mount(el) {
      el.innerHTML = `<div class="tool"><select class="ty">${Object.keys(U).map(k => `<option>${k}</option>`).join('')}</select>
      <div class="row"><input type="number" class="v" value="1" style="flex:1"><select class="f"></select></div><div class="row">⇅</div>
      <div class="row"><input class="r" readonly style="flex:1"><select class="t"></select></div></div>`;
      const $ = s => el.querySelector(s);
      const T = ['°C', '°F', 'K'];
      function fill() {
        const names = U[$('.ty').value] ? Object.keys(U[$('.ty').value]) : T;
        $('.f').innerHTML = $('.t').innerHTML = names.map(n => `<option>${n}</option>`).join(''); $('.t').selectedIndex = Math.min(1, names.length - 1); calc();
      }
      function calc() {
        const v = parseFloat($('.v').value), ty = $('.ty').value, f = $('.f').value, t = $('.t').value; let r;
        if (isNaN(v)) return $('.r').value = '';
        if (U[ty]) r = v * U[ty][f] / U[ty][t];
        else { const c = f === '°C' ? v : f === '°F' ? (v - 32) * 5 / 9 : v - 273.15; r = t === '°C' ? c : t === '°F' ? c * 9 / 5 + 32 : c + 273.15; }
        $('.r').value = +r.toPrecision(10);
      }
      $('.ty').onchange = fill; ['.v', '.f', '.t'].forEach(s => $(s).oninput = calc); fill();
    }
  });

  /* ---------- STOPWATCH / TIMER ---------- */
  const fmt = ms => { const t = Math.floor(ms / 10), cs = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };
  GV.register({
    id: 'stopwatch', type: 'tool', cat: 'Thời gian', name: 'Bấm giờ', icon: '⏱', desc: 'Bấm giờ có ghi vòng (lap).',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="big out" style="font-size:3.4rem">00:00.00</div><div class="row"><button class="btn go">Bắt đầu</button><button class="btn ghost lap">Vòng</button><button class="btn ghost rs">Đặt lại</button></div><table class="list laps"></table></div>`;
      let t0 = 0, acc = 0, run = false, raf, laps = [];
      const out = el.querySelector('.out');
      const cur = () => acc + (run ? performance.now() - t0 : 0);
      function loop() { out.textContent = fmt(cur()); raf = requestAnimationFrame(loop); }
      el.querySelector('.go').onclick = e => {
        if (run) { acc = cur(); run = false; cancelAnimationFrame(raf); out.textContent = fmt(acc); e.target.textContent = 'Tiếp tục'; }
        else { t0 = performance.now(); run = true; loop(); e.target.textContent = 'Dừng'; }
      };
      el.querySelector('.lap').onclick = () => { if (!run) return; laps.unshift(cur()); el.querySelector('.laps').innerHTML = laps.map((l, i) => `<tr><td>Vòng ${laps.length - i}</td><td>${fmt(l)}</td></tr>`).join(''); };
      el.querySelector('.rs').onclick = () => { cancelAnimationFrame(raf); run = false; acc = 0; laps = []; out.textContent = '00:00.00'; el.querySelector('.laps').innerHTML = ''; el.querySelector('.go').textContent = 'Bắt đầu'; };
      return () => cancelAnimationFrame(raf);
    }
  });

  GV.register({
    id: 'timer', type: 'tool', cat: 'Thời gian', name: 'Hẹn giờ', icon: '⏳', desc: 'Đếm ngược và báo chuông.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="big out" style="font-size:3.4rem">05:00</div>
      <div class="row"><input type="number" class="m" value="5" min="0" style="width:80px"> phút <input type="number" class="s" value="0" min="0" max="59" style="width:80px"> giây</div>
      <div class="row">${[1, 5, 10, 25].map(m => `<button class="btn ghost" data-m="${m}">${m}′</button>`).join('')}</div>
      <div class="row"><button class="btn go">Bắt đầu</button><button class="btn ghost rs">Đặt lại</button></div><p class="msg"></p></div>`;
      const $ = s => el.querySelector(s); let end, tm, left;
      const show = s => $('.out').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      const total = () => Math.max(0, (+$('.m').value || 0) * 60 + (+$('.s').value || 0));
      function stop() { clearInterval(tm); tm = null; $('.go').textContent = 'Bắt đầu'; }
      function tick() {
        left = Math.max(0, Math.round((end - Date.now()) / 1000)); show(left);
        if (!left) { stop(); $('.msg').textContent = '⏰ Hết giờ!'; [0, 300, 600].forEach(d => setTimeout(() => GV.beep(880, 200), d)); document.title = '⏰ Hết giờ!'; }
      }
      $('.go').onclick = () => {
        if (tm) { stop(); return; }
        $('.msg').textContent = ''; if (!left) left = total(); if (!left) return;
        end = Date.now() + left * 1000; tm = setInterval(tick, 250); tick(); $('.go').textContent = 'Tạm dừng';
      };
      $('.rs').onclick = () => { stop(); left = 0; show(total()); $('.msg').textContent = ''; };
      el.onclick = e => { const m = e.target.dataset.m; if (m) { $('.m').value = m; $('.s').value = 0; stop(); left = 0; show(total()); } };
      ['.m', '.s'].forEach(s => $(s).oninput = () => { stop(); left = 0; show(total()); });
      show(total());
      return () => clearInterval(tm);
    }
  });

  GV.register({
    id: 'pomodoro', type: 'tool', cat: 'Thời gian', name: 'Pomodoro', icon: '🍅', desc: 'Tập trung 25 phút, nghỉ 5 phút.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="hud" style="justify-content:center"><span class="mode">Tập trung</span><span>Hoàn thành: <b class="n">0</b></span></div><div class="big out" style="font-size:4rem">25:00</div>
      <div class="row"><button class="btn go">Bắt đầu</button><button class="btn ghost sk">Bỏ qua</button></div></div>`;
      const $ = s => el.querySelector(s); let focus = true, left = 1500, tm, n = 0;
      const show = () => $('.out').textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      function sw() { if (focus) { n++; $('.n').textContent = n; } focus = !focus; left = focus ? 1500 : (n % 4 ? 300 : 900); $('.mode').textContent = focus ? 'Tập trung' : 'Nghỉ ngơi'; show(); GV.beep(880, 300); }
      $('.go').onclick = e => {
        if (tm) { clearInterval(tm); tm = null; e.target.textContent = 'Tiếp tục'; return; }
        e.target.textContent = 'Tạm dừng'; tm = setInterval(() => { if (--left <= 0) sw(); else show(); }, 1000);
      };
      $('.sk').onclick = sw;
      return () => clearInterval(tm);
    }
  });

  /* ---------- CLOCK ---------- */
  GV.register({
    id: 'clock', type: 'tool', cat: 'Thời gian', name: 'Đồng hồ thế giới', icon: '🌍', desc: 'Giờ hiện tại ở nhiều thành phố.',
    mount(el) {
      const Z = [['Hà Nội / TP.HCM', 'Asia/Ho_Chi_Minh'], ['Tokyo', 'Asia/Tokyo'], ['Seoul', 'Asia/Seoul'], ['Bắc Kinh', 'Asia/Shanghai'], ['Singapore', 'Asia/Singapore'], ['Dubai', 'Asia/Dubai'], ['London', 'Europe/London'], ['Paris', 'Europe/Paris'], ['New York', 'America/New_York'], ['Los Angeles', 'America/Los_Angeles'], ['Sydney', 'Australia/Sydney']];
      el.innerHTML = `<div class="tool"><div class="big out" style="font-size:3rem"></div><div class="hint dt" style="font-size:16px"></div><table class="list"></table></div>`;
      const tb = el.querySelector('table');
      function tick() {
        const d = new Date();
        el.querySelector('.out').textContent = d.toLocaleTimeString('vi-VN');
        el.querySelector('.dt').textContent = d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        tb.innerHTML = Z.map(([n, z]) => `<tr><td>${n}</td><td>${d.toLocaleDateString('vi-VN', { timeZone: z, day: '2-digit', month: '2-digit' })}</td><td><b>${d.toLocaleTimeString('vi-VN', { timeZone: z, hour: '2-digit', minute: '2-digit' })}</b></td></tr>`).join('');
      }
      tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
    }
  });
})();
