// Tiện ích đời sống: Việc cần làm, Ghi chú, Màu sắc, Vòng quay, Xúc xắc, BMI, Tuổi/ngày, Phần trăm
(function () {
  const $ = (el, s) => el.querySelector(s);

  GV.register({
    id: 'todo', type: 'tool', cat: 'Đời sống', name: 'Việc cần làm', icon: '✅', desc: 'Danh sách công việc, lưu ngay trên trình duyệt.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="row"><input class="in" placeholder="Thêm việc mới…" style="flex:1"><button class="btn add">Thêm</button></div><div class="list"></div><div class="row"><span class="hint cnt"></span><button class="btn ghost clr">Xóa việc đã xong</button></div></div>`;
      let items = GV.store.get('todo', []);
      function draw() {
        GV.store.set('todo', items);
        $(el, '.list').innerHTML = items.map((t, i) => `<div class="row" style="justify-content:flex-start;padding:8px;border-bottom:1px solid #ffffff14"><input type="checkbox" data-c="${i}" ${t.d ? 'checked' : ''}><span style="flex:1;${t.d ? 'text-decoration:line-through;opacity:.5' : ''}">${GV.esc(t.t)}</span><button class="btn ghost" data-x="${i}">✕</button></div>`).join('') || '<p class="hint">Chưa có việc nào 🎉</p>';
        $(el, '.cnt').textContent = `${items.filter(t => !t.d).length} việc còn lại`;
      }
      function add() { const v = $(el, '.in').value.trim(); if (v) { items.push({ t: v, d: false }); $(el, '.in').value = ''; draw(); } }
      $(el, '.add').onclick = add; $(el, '.in').onkeydown = e => e.key === 'Enter' && add();
      $(el, '.clr').onclick = () => { items = items.filter(t => !t.d); draw(); };
      $(el, '.list').onclick = e => {
        if (e.target.dataset.x !== undefined) { items.splice(+e.target.dataset.x, 1); draw(); }
        else if (e.target.dataset.c !== undefined) { items[+e.target.dataset.c].d = e.target.checked; draw(); }
      };
      draw();
    }
  });

  GV.register({
    id: 'notes', type: 'tool', cat: 'Đời sống', name: 'Ghi chú nhanh', icon: '🗒', desc: 'Sổ tay tự động lưu.',
    mount(el) {
      el.innerHTML = `<div class="tool" style="max-width:800px"><textarea class="t" style="min-height:320px" placeholder="Viết gì đó… (tự động lưu)"></textarea><div class="row"><span class="hint st"></span><button class="btn ghost dl">Tải về .txt</button></div></div>`;
      const t = $(el, '.t'); t.value = GV.store.get('notes', '');
      t.oninput = () => { GV.store.set('notes', t.value); $(el, '.st').textContent = 'Đã lưu ' + new Date().toLocaleTimeString('vi-VN'); };
      $(el, '.dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t.value], { type: 'text/plain' })); a.download = 'ghi-chu.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
    }
  });

  GV.register({
    id: 'color', type: 'tool', cat: 'Thiết kế', name: 'Bảng màu', icon: '🎨', desc: 'Chọn màu, đổi HEX / RGB / HSL.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="row"><input type="color" class="pk" value="#6c8cff" style="width:90px;height:60px;padding:2px"><div class="res sw" style="flex:1;height:60px;display:flex;align-items:center;justify-content:center;font-weight:700"></div></div>
      <div class="col" style="max-width:none"><label>HEX <input class="hx" style="width:100%"></label><label>RGB <input class="rg" style="width:100%"></label><label>HSL <input class="hs" style="width:100%"></label></div>
      <label>Bảng phối màu (bấm để chép mã)</label><div class="row pal"></div></div>`;
      const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2; let h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; } return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]; };
      const hsl2hex = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
      function set(h) {
        const rgb = hex2rgb(h), hsl = rgb2hsl(rgb);
        $(el, '.pk').value = h; $(el, '.hx').value = h; $(el, '.rg').value = `rgb(${rgb})`; $(el, '.hs').value = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
        const sw = $(el, '.sw'); sw.style.background = h; sw.style.color = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 140 ? '#000' : '#fff'; sw.textContent = h.toUpperCase();
        $(el, '.pal').innerHTML = [0, 30, 150, 180, 210, 330].map(d => hsl2hex((hsl[0] + d) % 360, hsl[1], hsl[2])).map(c => `<button class="btn" data-c="${c}" style="background:${c};width:80px;height:50px;font-size:11px;text-shadow:0 0 3px #000">${c}</button>`).join('');
      }
      $(el, '.pk').oninput = e => set(e.target.value);
      $(el, '.hx').onchange = e => { const v = e.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(v)) set(v.toLowerCase()); };
      el.onclick = e => { const c = e.target.dataset.c; if (c) { set(c); try { navigator.clipboard.writeText(c); } catch (x) {} } };
      set('#6c8cff');
    }
  });

  GV.register({
    id: 'wheel', type: 'tool', cat: 'Đời sống', name: 'Vòng quay may mắn', icon: '🎡', desc: 'Nhập danh sách và quay để chọn ngẫu nhiên.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="row" style="align-items:flex-start"><canvas class="cv" width="320" height="320" style="background:none"></canvas><textarea class="t" style="min-height:220px;flex:1;min-width:140px" placeholder="Mỗi dòng một lựa chọn"></textarea></div><div class="row"><button class="btn go">🎲 Quay!</button></div><p class="msg big" style="font-size:1.6rem"></p></div>`;
      const cv = $(el, 'canvas'), c = cv.getContext('2d'), t = $(el, '.t');
      t.value = GV.store.get('wheel', 'Phở\nBún chả\nCơm tấm\nBánh mì\nMì Quảng');
      const COL = ['#6c8cff', '#ff6cab', '#3ddc97', '#ffd166', '#b388ff', '#ff9f43', '#4dd0e1', '#ff5c6c'];
      let ang = 0, spinning = false, raf;
      const list = () => t.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 40);
      function draw() {
        const L = list(), n = L.length || 1, a = 2 * Math.PI / n;
        c.clearRect(0, 0, 320, 320); c.save(); c.translate(160, 160); c.rotate(ang);
        for (let i = 0; i < n; i++) {
          c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 150, i * a, (i + 1) * a); c.fillStyle = COL[i % COL.length]; c.fill();
          c.save(); c.rotate(i * a + a / 2); c.fillStyle = '#000'; c.font = 'bold 14px sans-serif'; c.textAlign = 'right'; c.fillText((L[i] || '').slice(0, 16), 140, 5); c.restore();
        }
        c.restore(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(310, 160); c.lineTo(285, 148); c.lineTo(285, 172); c.fill();
      }
      t.oninput = () => { GV.store.set('wheel', t.value); draw(); };
      $(el, '.go').onclick = () => {
        const L = list(); if (spinning || L.length < 2) return; spinning = true; $(el, '.msg').textContent = '';
        const target = ang + 2 * Math.PI * (5 + Math.random() * 3), start = ang, t0 = performance.now(), dur = 4000;
        (function f(now) {
          const p = Math.min(1, (now - t0) / dur); ang = start + (target - start) * (1 - Math.pow(1 - p, 3)); draw();
          if (p < 1) raf = requestAnimationFrame(f);
          else { spinning = false; const a = 2 * Math.PI / L.length, idx = Math.floor((((-ang) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / a); $(el, '.msg').textContent = '🎉 ' + L[idx]; GV.beep(660, 200); }
        })(t0);
      };
      draw();
      return () => cancelAnimationFrame(raf);
    }
  });

  GV.register({
    id: 'dice', type: 'tool', cat: 'Đời sống', name: 'Xúc xắc & tung đồng xu', icon: '🎲', desc: 'Tung xúc xắc, đồng xu, số ngẫu nhiên.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="row"><label>Số xúc xắc <select class="n">${[1, 2, 3, 4, 5, 6].map(n => `<option>${n}</option>`).join('')}</select></label><button class="btn d">🎲 Tung</button><button class="btn ghost c">🪙 Tung đồng xu</button></div>
      <div class="big res out" style="font-size:3rem;min-height:80px">🎲</div><p class="msg"></p>
      <div class="row"><input type="number" class="a" value="1" style="width:90px"> → <input type="number" class="b" value="100" style="width:90px"><button class="btn ghost r">Số ngẫu nhiên</button></div></div>`;
      const F = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      $(el, '.d').onclick = () => { const r = Array.from({ length: +$(el, '.n').value }, () => GV.rnd(6)); $(el, '.out').textContent = r.map(x => F[x]).join(' '); $(el, '.msg').textContent = 'Tổng: ' + r.reduce((a, b) => a + b + 1, 0); };
      $(el, '.c').onclick = () => { const h = GV.rnd(2); $(el, '.out').textContent = h ? '🪙' : '⭕'; $(el, '.msg').textContent = h ? 'Mặt sấp' : 'Mặt ngửa'; };
      $(el, '.r').onclick = () => { let a = +$(el, '.a').value, b = +$(el, '.b').value; if (a > b) [a, b] = [b, a]; $(el, '.out').textContent = a + GV.rnd(b - a + 1); $(el, '.msg').textContent = `Trong khoảng ${a} – ${b}`; };
    }
  });

  GV.register({
    id: 'bmi', type: 'tool', cat: 'Sức khỏe', name: 'Tính BMI', icon: '⚖️', desc: 'Chỉ số khối cơ thể và cân nặng lý tưởng.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="row"><label>Chiều cao (cm) <input type="number" class="h" value="165" style="width:110px"></label><label>Cân nặng (kg) <input type="number" class="w" value="60" style="width:110px"></label></div><button class="btn go">Tính</button><div class="res out" style="text-align:center"></div></div>`;
      function go() {
        const h = +$(el, '.h').value / 100, w = +$(el, '.w').value; if (!(h > 0 && w > 0)) return;
        const b = w / (h * h), [t, c] = b < 18.5 ? ['Thiếu cân', '#4dd0e1'] : b < 23 ? ['Bình thường', '#3ddc97'] : b < 25 ? ['Thừa cân', '#ffd166'] : b < 30 ? ['Tiền béo phì', '#ff9f43'] : ['Béo phì', '#ff5c6c'];
        $(el, '.out').innerHTML = `<div class="big" style="color:${c}">${b.toFixed(1)}</div><b>${t}</b> (theo chuẩn châu Á – Thái Bình Dương)<br><span class="hint">Cân nặng phù hợp: ${(18.5 * h * h).toFixed(1)} – ${(22.9 * h * h).toFixed(1)} kg</span>`;
      }
      $(el, '.go').onclick = go; go();
    }
  });

  GV.register({
    id: 'date', type: 'tool', cat: 'Thời gian', name: 'Tính ngày & tuổi', icon: '📅', desc: 'Khoảng cách giữa hai ngày, tính tuổi, cộng trừ ngày.',
    mount(el) {
      const today = new Date().toISOString().slice(0, 10);
      el.innerHTML = `<div class="tool"><div class="row"><label>Từ ngày <input type="date" class="a" value="2000-01-01"></label><label>Đến ngày <input type="date" class="b" value="${today}"></label></div><div class="res out"></div>
      <hr style="width:100%;border-color:#ffffff14"><div class="row"><label>Ngày <input type="date" class="c" value="${today}"></label><label>Cộng/trừ <input type="number" class="n" value="30" style="width:90px"> ngày</label></div><div class="res out2"></div></div>`;
      const fmt = d => d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      function up() {
        const a = new Date($(el, '.a').value), b = new Date($(el, '.b').value);
        if (isNaN(a) || isNaN(b)) { $(el, '.out').textContent = ''; } else {
          const [s, e] = a <= b ? [a, b] : [b, a]; let y = e.getFullYear() - s.getFullYear(), m = e.getMonth() - s.getMonth(), d = e.getDate() - s.getDate();
          if (d < 0) { m--; d += new Date(e.getFullYear(), e.getMonth(), 0).getDate(); } if (m < 0) { y--; m += 12; }
          const days = Math.round((e - s) / 864e5);
          $(el, '.out').innerHTML = `<b>${y}</b> năm <b>${m}</b> tháng <b>${d}</b> ngày<br>Tổng: <b>${days}</b> ngày (~${Math.floor(days / 7)} tuần ${days % 7} ngày)`;
        }
        const c = new Date($(el, '.c').value); if (!isNaN(c)) { c.setDate(c.getDate() + (+$(el, '.n').value || 0)); $(el, '.out2').innerHTML = 'Kết quả: <b>' + fmt(c) + '</b>'; }
      }
      el.querySelectorAll('input').forEach(i => i.oninput = up); up();
    }
  });

  GV.register({
    id: 'percent', type: 'tool', cat: 'Tính toán', name: 'Tính phần trăm', icon: '％', desc: 'Giảm giá, tăng giảm %, tiền tip.',
    mount(el) {
      el.innerHTML = `<div class="tool">
      <div class="res">X% của Y: <input type="number" class="a1" value="15" style="width:80px">% của <input type="number" class="b1" value="200" style="width:110px"> = <b class="r1"></b></div>
      <div class="res">X là bao nhiêu % của Y: <input type="number" class="a2" value="30" style="width:90px"> / <input type="number" class="b2" value="120" style="width:90px"> = <b class="r2"></b></div>
      <div class="res">Thay đổi từ <input type="number" class="a3" value="80" style="width:90px"> lên <input type="number" class="b3" value="100" style="width:90px"> = <b class="r3"></b></div>
      <div class="res">Giá <input type="number" class="a4" value="500000" style="width:120px"> giảm <input type="number" class="b4" value="20" style="width:70px">% → còn <b class="r4"></b></div></div>`;
      const n = (s) => +$(el, s).value, f = x => isFinite(x) ? (+x.toFixed(2)).toLocaleString('vi-VN') : '—';
      function up() {
        $(el, '.r1').textContent = f(n('.a1') * n('.b1') / 100);
        $(el, '.r2').textContent = f(n('.a2') / n('.b2') * 100) + '%';
        const ch = (n('.b3') - n('.a3')) / n('.a3') * 100; $(el, '.r3').textContent = (ch > 0 ? '+' : '') + f(ch) + '%';
        $(el, '.r4').textContent = f(n('.a4') * (1 - n('.b4') / 100));
      }
      el.querySelectorAll('input').forEach(i => i.oninput = up); up();
    }
  });
})();
