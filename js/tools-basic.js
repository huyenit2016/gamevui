// Tiện ích cơ bản: Máy tính, Đổi đơn vị, Bấm giờ & Hẹn giờ, Pomodoro, Đồng hồ thế giới
(function () {
  /* ---------- CALCULATOR ---------- */
  GV.register({
    id: 'calc', type: 'tool', cat: 'Tính toán', name: 'Máy tính', icon: '🧮', desc: 'Máy tính cơ bản, hỗ trợ bàn phím.',
    mount(el) {
      const L = (en, vi) => (GV.lang && GV.lang() === 'vi') ? vi : en, $ = s => el.querySelector(s);
      const keys = [['C', 'cl'], ['⌫', 'op'], ['%', 'op'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['±', 'op'], ['0'], ['.'], ['=', 'eq']];
      el.innerHTML = (GV.omniCSS || '') + `<div class="om c"><div class="omc"><div class="omh"><i>🧮</i><div><h3>${L('Calculator', 'Máy tính')}</h3><p class="oms">${L('Chain operations · keyboard supported · history', 'Tính nối tiếp · hỗ trợ bàn phím · lịch sử')}</p></div></div>
<div class="cd" aria-live="polite"><small class="ex"></small><b class="out">0</b></div>
<div class="ck" style="grid-template-columns:repeat(4,1fr)">${keys.map(([k, c]) => `<button data-k="${k}" class="${c || ''}">${k}</button>`).join('')}</div>
<div class="hw" hidden><div class="row" style="justify-content:space-between;margin:16px 0 6px"><span class="hint">${L('History', 'Lịch sử')}</span><button class="omb gh hc" style="padding:4px 10px;font-size:11px">${L('Clear', 'Xoá')}</button></div><div class="hl"></div></div></div></div>
<style>.om .ck .eq{grid-row:auto}.om .hl{display:flex;flex-direction:column;gap:6px;max-height:150px;overflow:auto}.om .hl button{display:flex;justify-content:space-between;gap:10px;padding:8px 12px;border-radius:10px;border:1px solid #1e293b;background:#0b1220b3;color:#cbd5e1;font:500 .8rem ui-monospace,Menlo,monospace;text-align:left}.om .hl button b{color:#22d3ee}.om .hl button:hover{border-color:#00f2fe55}</style>`;
      let a = null, op = null, cur = '0', fresh = false, hist = [];
      const calc = (x, o, y) => o === '+' ? x + y : o === '−' ? x - y : o === '×' ? x * y : o === '÷' ? (y === 0 ? NaN : x / y) : y;
      const fmt = n => isNaN(n) ? 'Lỗi' : String(+n.toPrecision(12));
      function drawHist() { $('.hw').hidden = !hist.length; $('.hl').innerHTML = hist.map((h, i) => `<button data-h="${i}"><span>${h.e}</span><b>${h.r}</b></button>`).join(''); }
      function key(k) {
        if (cur === 'Lỗi' && k !== 'C') { cur = '0'; a = op = null; fresh = false; }
        if (/\d/.test(k)) { cur = (fresh || cur === '0') ? k : cur + k; fresh = false; }
        else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
        else if (k === 'C') { a = op = null; cur = '0'; $('.ex').textContent = ''; fresh = false; }
        else if (k === '⌫') cur = fresh ? cur : cur.length > 1 ? cur.slice(0, -1) : '0';
        else if (k === '±') cur = cur.startsWith('-') ? cur.slice(1) : cur === '0' ? cur : '-' + cur;
        else if (k === '%') cur = fmt(parseFloat(cur) / 100);
        else if (k === '=') { if (op) { const r = calc(a, op, parseFloat(cur)), e = `${fmt(a)} ${op} ${cur}`; $('.ex').textContent = e + ' ='; cur = fmt(r); hist.unshift({ e, r: cur }); hist = hist.slice(0, 8); drawHist(); a = op = null; fresh = true; } }
        else { if (op && !fresh) { a = calc(a, op, parseFloat(cur)); cur = fmt(a); } else a = parseFloat(cur); op = k; $('.ex').textContent = `${fmt(a)} ${k}`; fresh = true; }
        $('.out').textContent = cur;
      }
      el.onclick = e => { const k = e.target.dataset.k; if (k) key(k); const h = e.target.closest('[data-h]'); if (h) { cur = hist[+h.dataset.h].r; fresh = true; $('.out').textContent = cur; } if (e.target.closest('.hc')) { hist = []; drawHist(); } };
      const off = GV.keys(e => {
        const m = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'C' }[e.key] || e.key;
        if (keys.some(x => x[0] === m)) key(m);
      }, false);
      const t = GV.omniTilt ? GV.omniTilt(el) : null;
      return () => { off(); if (t) t(); };
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
      const L = (en, vi) => (GV.lang && GV.lang() === 'vi') ? vi : en, $ = s => el.querySelector(s), T = ['°C', '°F', 'K'], ICON = { 'Độ dài': '📏', 'Khối lượng': '⚖️', 'Diện tích': '🗺️', 'Thể tích': '🧪', 'Tốc độ': '🚀', 'Dữ liệu': '💾', 'Thời gian': '⏱️', 'Nhiệt độ': '🌡️' };
      el.innerHTML = (GV.omniCSS || '') + `<div class="om g"><div class="omc"><div class="omh"><i>⇄</i><div><h3>${L('Unit Converter', 'Đổi đơn vị')}</h3><p class="oms">${L('Length, weight, temperature, data…', 'Độ dài, khối lượng, nhiệt độ, dữ liệu…')}</p></div></div>
<div class="uty">${Object.keys(U).map((k, i) => `<button type="button" data-ty="${k}" class="${i ? '' : 'on'}"><span>${ICON[k] || '•'}</span>${k}</button>`).join('')}</div>
<label class="ul">${L('Amount', 'Số lượng')}</label><div class="row"><input type="text" inputmode="decimal" class="v" value="1" style="flex:1" aria-label="Amount"><select class="f" style="width:44%"></select></div>
<div class="usw"><button type="button" class="sw" title="${L('Swap', 'Đảo chiều')}" aria-label="Swap">⇅</button></div>
<label class="ul">${L('Result', 'Kết quả')}</label><div class="row"><div class="ko" style="flex:1"><input type="text" class="r" readonly aria-label="Result"><button type="button" class="cp">${L('Copy', 'Chép')}</button></div><select class="t" style="width:44%"></select></div>
<p class="hint ux" style="margin:12px 0 0"></p></div></div>
<style>.om .uty{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.om .uty button{display:flex;gap:6px;align-items:center;padding:7px 12px;border-radius:99px;border:1px solid #334155;background:#0b1220;color:#cbd5e1;font-size:12px;font-weight:600}.om .uty button.on{background:#10b9811f;border-color:#10b981;color:#34d399;box-shadow:0 0 14px #10b98133}
.om .ul{display:block;font-size:.72rem;color:#94a3b8;margin:10px 0 5px}.om .usw{text-align:center;margin:6px 0 0}.om .usw button{width:38px;height:38px;border-radius:50%;border:1px solid #334155;background:#1e293b;color:#34d399;font-size:1.1rem;transition:transform .3s}.om .usw button:active{transform:rotate(180deg)}
.om .r{color:#fbbf24!important}</style>`;
      let ty = Object.keys(U)[0];
      const num = x => parseFloat(String(x).replace(',', '.'));
      function fill() {
        const names = U[ty] ? Object.keys(U[ty]) : T;
        $('.f').innerHTML = $('.t').innerHTML = names.map(n => `<option>${n}</option>`).join(''); $('.t').selectedIndex = Math.min(1, names.length - 1); calc();
      }
      function calc() {
        const v = num($('.v').value), f = $('.f').value, t = $('.t').value; let r;
        if (isNaN(v)) { $('.r').value = ''; $('.ux').textContent = ''; return; }
        if (U[ty]) r = v * U[ty][f] / U[ty][t];
        else { const c = f === '°C' ? v : f === '°F' ? (v - 32) * 5 / 9 : v - 273.15; r = t === '°C' ? c : t === '°F' ? c * 9 / 5 + 32 : c + 273.15; }
        const out = +r.toPrecision(10); $('.r').value = out.toLocaleString('en-US', { maximumFractionDigits: 10 });
        $('.ux').textContent = `${v} ${f} = ${out.toLocaleString('en-US', { maximumFractionDigits: 10 })} ${t}`;
      }
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-ty]'); if (b) { ty = b.dataset.ty; el.querySelectorAll('.uty button').forEach(x => x.classList.toggle('on', x === b)); fill(); return; }
        if (e.target.closest('.sw')) { const f = $('.f').selectedIndex; $('.f').selectedIndex = $('.t').selectedIndex; $('.t').selectedIndex = f; calc(); return; }
        const cp = e.target.closest('.cp'); if (cp && $('.r').value) { (navigator.clipboard ? navigator.clipboard.writeText($('.r').value) : Promise.reject()).catch(() => {}); const o = cp.textContent; cp.textContent = L('Copied ✓', 'Đã chép ✓'); setTimeout(() => { cp.textContent = o; }, 1200); }
      });
      ['.v', '.f', '.t'].forEach(s => { $(s).oninput = calc; $(s).onchange = calc; }); fill();
      return GV.omniTilt ? GV.omniTilt(el) : undefined;
    }
  });

  /* ---------- STOPWATCH / TIMER ---------- */
  const fmt = ms => { const t = Math.floor(ms / 10), cs = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };
  GV.register({
    id: 'stopwatch', type: 'tool', cat: 'Thời gian', name: 'Bấm giờ', icon: '⏱', desc: 'Bấm giờ có ghi vòng (lap).',
    mount(el) {
      const L = (en, vi) => (GV.lang && GV.lang() === 'vi') ? vi : en, $ = s => el.querySelector(s), p2 = n => String(n).padStart(2, '0');
      const F = ms => { const t = Math.floor(ms / 10), cs = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000) % 60, h = Math.floor(t / 360000); return (h ? p2(h) + ':' : '') + `${p2(m)}:${p2(s)}.${p2(cs)}`; };
      el.innerHTML = (GV.omniCSS || '') + `<div class="om c"><div class="omc"><div class="omh"><i>⏱️</i><div><h3>${L('Stopwatch', 'Đồng hồ bấm giờ')}</h3><p class="oms">${L('Space = start/stop · L = lap · R = reset', 'Space = chạy/dừng · L = ghi vòng · R = đặt lại')}</p></div></div>
<div class="swd"><b class="out" aria-live="off">00:00.00</b></div>
<div class="row" style="justify-content:center;margin:16px 0"><button class="omb go" style="min-width:120px">${L('Start', 'Bắt đầu')}</button><button class="omb gh lap" disabled>${L('Lap', 'Vòng')}</button><button class="omb gh rs">${L('Reset', 'Đặt lại')}</button></div>
<div class="lw" hidden><div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="hint">${L('Laps', 'Các vòng')}</span><button class="omb gh cpy" style="padding:5px 12px;font-size:12px">${L('Copy', 'Chép')}</button></div><div class="lt"><table><thead><tr><th>#</th><th>${L('Lap time', 'Thời gian vòng')}</th><th>${L('Total', 'Tổng')}</th></tr></thead><tbody class="laps"></tbody></table></div></div></div></div>
<style>.om .swd{padding:26px 10px;border-radius:20px;background:#020617;border:1px solid #1e293b;text-align:center;box-shadow:inset 0 0 40px #00f2fe14}.om .swd b{font:800 clamp(2.2rem,9vw,3.6rem) ui-monospace,Menlo,monospace;color:#22d3ee;letter-spacing:.04em;text-shadow:0 0 24px #00f2fe88;font-variant-numeric:tabular-nums}
.om .lt{max-height:260px;overflow:auto;border-radius:14px;border:1px solid #1e293b;background:#0b1220b3}.om .lt table{width:100%;border-collapse:collapse;font:500 .85rem ui-monospace,Menlo,monospace}.om .lt th{position:sticky;top:0;background:#0f172a;text-align:left;padding:8px 12px;font:600 .68rem var(--font);color:#94a3b8;letter-spacing:.06em;text-transform:uppercase}.om .lt td{padding:8px 12px;border-top:1px solid #1e293b}
.om .lt tr.best td:nth-child(2){color:#34d399}.om .lt tr.worst td:nth-child(2){color:#fb7185}.om .lt td:nth-child(3){color:#94a3b8}</style>`;
      let t0 = 0, acc = 0, run = false, raf = 0, laps = [], lastLap = 0;
      const cur = () => acc + (run ? performance.now() - t0 : 0);
      const loop = () => { $('.out').textContent = F(cur()); raf = requestAnimationFrame(loop); };
      function draw() {
        $('.lw').hidden = !laps.length; if (!laps.length) { $('.laps').innerHTML = ''; return; }
        const d = laps.map(l => l.d), mn = Math.min(...d), mx = Math.max(...d);
        $('.laps').innerHTML = laps.slice().reverse().map(l => `<tr class="${laps.length > 2 && l.d === mn ? 'best' : laps.length > 2 && l.d === mx ? 'worst' : ''}"><td>${l.n}</td><td>${F(l.d)}</td><td>${F(l.t)}</td></tr>`).join('');
      }
      function toggle() {
        if (run) { acc = cur(); run = false; cancelAnimationFrame(raf); $('.out').textContent = F(acc); $('.go').textContent = L('Resume', 'Tiếp tục'); $('.lap').disabled = true; }
        else { t0 = performance.now(); run = true; loop(); $('.go').textContent = L('Stop', 'Dừng'); $('.lap').disabled = false; }
      }
      function lap() { if (!run) return; const t = cur(); laps.push({ n: laps.length + 1, d: t - lastLap, t }); lastLap = t; draw(); }
      function reset() { cancelAnimationFrame(raf); run = false; acc = 0; laps = []; lastLap = 0; $('.out').textContent = F(0); $('.go').textContent = L('Start', 'Bắt đầu'); $('.lap').disabled = true; draw(); }
      $('.go').onclick = toggle; $('.lap').onclick = lap; $('.rs').onclick = reset;
      $('.cpy').onclick = e => { const tx = laps.map(l => `${l.n}\t${F(l.d)}\t${F(l.t)}`).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).catch(() => {}); const o = e.target.textContent; e.target.textContent = L('Copied ✓', 'Đã chép ✓'); setTimeout(() => { e.target.textContent = o; }, 1200); };
      const kd = e => { const t = e.target; if (e.ctrlKey || e.metaKey || e.altKey || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; if (e.key === ' ') { e.preventDefault(); if (t && t.tagName === 'BUTTON') t.blur(); toggle(); } else if (e.key === 'l' || e.key === 'L') lap(); else if (e.key === 'r' || e.key === 'R') reset(); };
      document.addEventListener('keydown', kd); const tl = GV.omniTilt ? GV.omniTilt(el) : null;
      return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); if (tl) tl(); };
    }
  });

  GV.register({
    id: 'timer', type: 'tool', cat: 'Thời gian', name: 'Hẹn giờ', icon: '⏳', desc: 'Đếm ngược và báo chuông.',
    mount(el) {
      const L = (en, vi) => (GV.lang && GV.lang() === 'vi') ? vi : en, $ = s => el.querySelector(s), p2 = n => String(n).padStart(2, '0'), R = 2 * Math.PI * 92;
      el.innerHTML = (GV.omniCSS || '') + `<div class="om g"><div class="omc"><div class="omh"><i>⏳</i><div><h3>${L('Countdown Timer', 'Hẹn giờ')}</h3><p class="oms">${L('Count down and ring when time is up', 'Đếm ngược và báo chuông khi hết giờ')}</p></div></div>
<div class="tr"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" fill="none" stroke="#1e293b" stroke-width="8"/><circle class="ta" cx="100" cy="100" r="92" fill="none" stroke="url(#tg)" stroke-width="8" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="${R}" stroke-dashoffset="0"/><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#00f2fe"/></linearGradient></defs></svg><div class="tt">05:00</div></div>
<div class="row tin" style="justify-content:center"><label><input type="number" class="h" value="0" min="0" max="99" inputmode="numeric"><small>${L('hours', 'giờ')}</small></label><b>:</b><label><input type="number" class="m" value="5" min="0" max="999" inputmode="numeric"><small>${L('min', 'phút')}</small></label><b>:</b><label><input type="number" class="s" value="0" min="0" max="59" inputmode="numeric"><small>${L('sec', 'giây')}</small></label></div>
<div class="row" style="justify-content:center;margin:12px 0">${[1, 5, 10, 15, 25, 45].map(m => `<button class="omb gh" data-m="${m}" style="padding:6px 12px;font-size:12px">${m}′</button>`).join('')}</div>
<div class="row" style="justify-content:center"><button class="omb em go" style="min-width:120px">${L('Start', 'Bắt đầu')}</button><button class="omb gh add">+1′</button><button class="omb gh rs">${L('Reset', 'Đặt lại')}</button></div><p class="msg tm" style="text-align:center;font-weight:700;color:#34d399;min-height:1.4em;margin:12px 0 0"></p></div></div>
<style>.om .tr{position:relative;width:min(240px,70vw);aspect-ratio:1;margin:4px auto 10px}.om .tr svg{width:100%;height:100%;filter:drop-shadow(0 0 14px #10b98166)}.om .ta{transition:stroke-dashoffset .25s linear}.om .tt{position:absolute;inset:0;display:grid;place-items:center;font:800 2.6rem ui-monospace,Menlo,monospace;color:#34d399;text-shadow:0 0 22px #10b98199;letter-spacing:.04em}
.om .tin label{display:flex;flex-direction:column;align-items:center;gap:3px}.om .tin input{width:76px;text-align:center;font:700 1.3rem ui-monospace,Menlo,monospace;padding:8px 4px}.om .tin small{font-size:.68rem;color:#94a3b8}.om .tin b{font-size:1.4rem;color:#475569;margin-bottom:16px}
.om .tr.done .tt{color:#fbbf24;text-shadow:0 0 22px #f59e0bbb;animation:tdn .6s ease-in-out infinite alternate}@keyframes tdn{to{transform:scale(1.08)}}</style>`;
      let end = 0, tmr = null, left = 0, total = 0, ring = null; const title0 = document.title;
      const fmt = s => (s >= 3600 ? p2(Math.floor(s / 3600)) + ':' : '') + `${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
      const input = () => Math.max(0, Math.floor((+$('.h').value || 0) * 3600 + (+$('.m').value || 0) * 60 + (+$('.s').value || 0)));
      const show = () => { $('.tt').textContent = fmt(left); $('.ta').style.strokeDashoffset = total ? R * (1 - left / total) : 0; document.title = tmr ? `${fmt(left)} · ${L('Timer', 'Hẹn giờ')}` : title0; };
      function stop() { clearInterval(tmr); tmr = null; $('.go').textContent = left && left < total ? L('Resume', 'Tiếp tục') : L('Start', 'Bắt đầu'); }
      function silence() { clearInterval(ring); ring = null; $('.tr').classList.remove('done'); }
      function sync() { stop(); silence(); left = total = input(); $('.msg').textContent = ''; $('.go').textContent = L('Start', 'Bắt đầu'); show(); }
      function tick() { left = Math.max(0, Math.round((end - Date.now()) / 1000)); show(); if (!left) { stop(); $('.go').textContent = L('Start', 'Bắt đầu'); $('.msg').textContent = L('⏰ Time is up!', '⏰ Hết giờ!'); $('.tr').classList.add('done'); document.title = '⏰ ' + L('Time is up!', 'Hết giờ!'); const ringIt = () => [0, 250, 500].forEach(d => setTimeout(() => GV.beep(880, 180), d)); ringIt(); let n = 0; ring = setInterval(() => { if (++n > 6) silence(); else ringIt(); }, 1500); } }
      function start() { silence(); if (!left) left = total = input(); if (!left) return; $('.msg').textContent = ''; end = Date.now() + left * 1000; tmr = setInterval(tick, 250); $('.go').textContent = L('Pause', 'Tạm dừng'); tick(); }
      $('.go').onclick = () => { if (tmr) { stop(); show(); } else { if (!left) sync(); start(); } };
      $('.rs').onclick = sync;
      $('.add').onclick = () => { silence(); if (tmr) { end += 60000; total += 60; tick(); } else { left += 60; total = Math.max(total, left); $('.msg').textContent = ''; show(); } };
      el.addEventListener('click', e => { const m = e.target.closest('[data-m]'); if (m) { $('.h').value = 0; $('.m').value = m.dataset.m; $('.s').value = 0; sync(); } });
      ['.h', '.m', '.s'].forEach(q => { $(q).oninput = sync; }); sync(); const t = GV.omniTilt ? GV.omniTilt(el) : null;
      return () => { clearInterval(tmr); silence(); document.title = title0; if (t) t(); };
    }
  });

  GV.register({
    id: 'pomodoro', type: 'tool', cat: 'Thời gian', name: 'Pomodoro', icon: '🍅', desc: 'Tập trung 25 phút, nghỉ 5 phút.',
    mount(el) {
      const L = (en, vi) => (GV.lang && GV.lang() === 'vi') ? vi : en, $ = s => el.querySelector(s);
      const M = { focus: [1500, L('Focus', 'Tập trung')], short: [300, L('Short break', 'Nghỉ ngắn')], long: [900, L('Long break', 'Nghỉ dài')] }, R = 2 * Math.PI * 92;
      const today = new Date().toISOString().slice(0, 10), sv = GV.store.get('pomo', {}); let done = sv.d === today ? sv.n || 0 : 0;
      el.innerHTML = (GV.omniCSS || '') + `<div class="om p"><div class="omc"><div class="omh"><i>⏱️</i><div><h3>Pomodoro Focus Timer</h3><p class="oms">${L('25 min focus · 5 min break · long break every 4th', '25 phút tập trung · nghỉ 5 phút · nghỉ dài mỗi lần thứ 4')}</p></div></div>
<div class="pm">${Object.keys(M).map((k, i) => `<button type="button" data-m="${k}" class="${i ? '' : 'on'}">${M[k][1]}</button>`).join('')}</div>
<div class="pr"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" fill="none" stroke="#1e293b" stroke-width="8"/><circle class="pa" cx="100" cy="100" r="92" fill="none" stroke="url(#pg)" stroke-width="8" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="${R}" stroke-dashoffset="0"/><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a855f7"/><stop offset="1" stop-color="#00f2fe"/></linearGradient></defs></svg><div class="pt" aria-live="off">25:00</div></div>
<div class="pd" aria-label="Sessions"></div><p class="hint pc" style="text-align:center;margin:6px 0 14px"></p>
<div class="row" style="justify-content:center"><button class="omb pu go" style="min-width:110px">${L('Start', 'Bắt đầu')}</button><button class="omb gh rs">${L('Reset', 'Đặt lại')}</button><button class="omb gh sk">${L('Skip', 'Bỏ qua')}</button></div></div></div>
<style>.om .pm{display:flex;gap:6px;justify-content:center;margin-bottom:10px}.om .pm button{padding:7px 14px;border-radius:99px;border:1px solid #334155;background:#0b1220;color:#cbd5e1;font-size:12px;font-weight:600}.om .pm button.on{background:#7928ca2e;border-color:#a855f7;color:#d8b4fe;box-shadow:0 0 14px #7928ca55}
.om .pr{position:relative;width:min(240px,70vw);aspect-ratio:1;margin:8px auto}.om .pr svg{width:100%;height:100%;filter:drop-shadow(0 0 14px #7928ca66)}.om .pa{transition:stroke-dashoffset 1s linear}
.om .pt{position:absolute;inset:0;display:grid;place-items:center;font:800 2.8rem ui-monospace,Menlo,monospace;color:#c084fc;letter-spacing:.06em;text-shadow:0 0 22px #a855f799}
.om .pd{display:flex;justify-content:center;gap:8px;margin-top:6px}.om .pd i{width:12px;height:12px;border-radius:50%;background:#1e293b;border:1px solid #334155}.om .pd i.on{background:#a855f7;border-color:#a855f7;box-shadow:0 0 10px #a855f7aa}</style>`;
      let mode = 'focus', total = M.focus[0], left = total, tm = null, endAt = 0; const title0 = document.title;
      const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      function show() {
        $('.pt').textContent = fmt(left); $('.pa').style.strokeDashoffset = R * (1 - left / total);
        $('.pd').innerHTML = [0, 1, 2, 3].map(i => `<i class="${i < done % 4 || (done && done % 4 === 0 && mode !== 'focus') ? 'on' : ''}"></i>`).join(''); $('.pc').textContent = L(`Completed today: ${done}`, `Hôm nay đã hoàn thành: ${done}`);
        document.title = tm ? `${fmt(left)} · ${M[mode][1]}` : title0;
      }
      function setMode(m) { stop(); mode = m; total = left = M[m][0]; el.querySelectorAll('.pm button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('.go').textContent = L('Start', 'Bắt đầu'); show(); }
      function stop() { if (tm) { clearInterval(tm); tm = null; } }
      function next(auto) { if (mode === 'focus') { done++; GV.store.set('pomo', { d: today, n: done }); } setMode(mode === 'focus' ? (done % 4 === 0 ? 'long' : 'short') : 'focus'); if (auto) { GV.beep(880, 300); start(); } }
      function start() { stop(); endAt = Date.now() + left * 1000; $('.go').textContent = L('Pause', 'Tạm dừng'); tm = setInterval(() => { left = Math.max(0, Math.round((endAt - Date.now()) / 1000)); if (left <= 0) { stop(); GV.beep(880, 300); next(false); } else show(); }, 250); show(); }
      $('.go').onclick = () => { if (tm) { stop(); $('.go').textContent = L('Resume', 'Tiếp tục'); show(); } else start(); };
      $('.rs').onclick = () => setMode(mode); $('.sk').onclick = () => next(false);
      el.querySelectorAll('.pm button').forEach(b => { b.onclick = () => setMode(b.dataset.m); }); show();
      const t = GV.omniTilt ? GV.omniTilt(el) : null;
      return () => { stop(); document.title = title0; if (t) t(); };
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
