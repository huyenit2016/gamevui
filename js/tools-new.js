// Tiện ích mới: Sổ chi tiêu, Theo dõi thói quen, Tính khoản vay & tiết kiệm, Máy đếm nhịp
(function () {
  const $ = (el, s) => el.querySelector(s), esc = GV.esc;
  const vnd = n => Math.round(n).toLocaleString('vi-VN') + ' ₫';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const css = `<style>.xt .it{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:12px;background:var(--md-sc-high,#2b292d);margin-bottom:6px}.xt .it small{color:var(--mut)}.xt .bar{height:8px;border-radius:9px;background:var(--md-sc-lowest,#0f0e11);overflow:hidden}.xt .bar i{display:block;height:100%;background:var(--md-primary,#D0BCFF)}.xt .x{border:0;background:none;color:var(--mut);cursor:pointer;font-size:18px;padding:4px 8px;border-radius:50%}.xt .x:hover{color:var(--bad)}.xt table{width:100%;font-size:13px}</style>`;

  /* ---------- SỔ CHI TIÊU ---------- */
  const CATS = ['Ăn uống', 'Đi lại', 'Nhà cửa', 'Mua sắm', 'Giải trí', 'Học tập', 'Sức khỏe', 'Khác'];
  GV.register({
    id: 'expense', type: 'tool', cat: 'Đời sống', name: 'Sổ chi tiêu', icon: '💰', desc: 'Ghi thu chi hằng ngày, xem tổng theo tháng và theo nhóm. Lưu ngay trên máy bạn.',
    mount(el) {
      el.innerHTML = css + `<div class="tool xt"><div class="row"><select class="ty"><option value="-1">Chi</option><option value="1">Thu</option></select><input class="am" type="number" min="0" inputmode="numeric" placeholder="Số tiền (₫)" style="width:150px"><select class="ct">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div><div class="row"><input class="nt" placeholder="Ghi chú (tuỳ chọn)" style="flex:1;min-width:160px"><input class="dt" type="date" value="${today()}"><button class="btn add">Thêm</button></div><div class="row"><label>Tháng <input class="mo" type="month" value="${today().slice(0, 7)}"></label></div><div class="res sm"></div><div class="by"></div><div class="ls"></div></div>`;
      let L = GV.store.get('expense', []);
      const save = () => GV.store.set('expense', L);
      function draw() {
        const m = $(el, '.mo').value, rows = L.filter(x => x.d.startsWith(m)).sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id);
        const inc = rows.filter(x => x.a > 0).reduce((s, x) => s + x.a, 0), out = -rows.filter(x => x.a < 0).reduce((s, x) => s + x.a, 0);
        $(el, '.sm').innerHTML = `Thu: <b style="color:var(--ok)">${vnd(inc)}</b> · Chi: <b style="color:var(--bad)">${vnd(out)}</b> · Còn lại: <b>${vnd(inc - out)}</b>`;
        const g = {}; rows.filter(x => x.a < 0).forEach(x => g[x.c] = (g[x.c] || 0) - x.a); const mx = Math.max(1, ...Object.values(g));
        $(el, '.by').innerHTML = Object.entries(g).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div style="margin:6px 0"><div class="row" style="justify-content:space-between;font-size:13px"><span>${esc(c)}</span><span>${vnd(v)} · ${Math.round(v / out * 100)}%</span></div><div class="bar"><i style="width:${v / mx * 100}%"></i></div></div>`).join('');
        $(el, '.ls').innerHTML = rows.map(x => `<div class="it"><span><b>${esc(x.c)}</b> ${x.n ? '· ' + esc(x.n) : ''}<br><small>${x.d.split('-').reverse().join('/')}</small></span><span style="display:flex;align-items:center;gap:4px"><b style="color:${x.a > 0 ? 'var(--ok)' : 'var(--fg)'}">${x.a > 0 ? '+' : '−'}${vnd(Math.abs(x.a))}</b><button class="x" data-id="${x.id}" aria-label="Xoá">✕</button></span></div>`).join('') || '<p class="hint">Chưa có khoản nào trong tháng này.</p>';
      }
      $(el, '.add').onclick = () => {
        const a = Math.abs(+$(el, '.am').value); if (!a) { $(el, '.am').focus(); return; }
        L.push({ id: Date.now(), a: a * +$(el, '.ty').value, c: $(el, '.ct').value, n: $(el, '.nt').value.trim().slice(0, 80), d: $(el, '.dt').value || today() });
        save(); $(el, '.am').value = ''; $(el, '.nt').value = ''; $(el, '.mo').value = ($(el, '.dt').value || today()).slice(0, 7); draw();
      };
      $(el, '.ls').onclick = e => { const b = e.target.closest('[data-id]'); if (b) { L = L.filter(x => x.id !== +b.dataset.id); save(); draw(); } };
      $(el, '.mo').onchange = draw; draw();
    }
  });

  /* ---------- THÓI QUEN ---------- */
  GV.register({
    id: 'habit', type: 'tool', cat: 'Đời sống', name: 'Theo dõi thói quen', icon: '✅', desc: 'Tạo thói quen tốt, tích mỗi ngày và giữ chuỗi ngày liên tiếp. Lưu trên máy bạn.',
    mount(el) {
      el.innerHTML = css + `<div class="tool xt"><div class="row"><input class="nm" placeholder="Thói quen mới (vd: Uống 2 lít nước)" style="flex:1;min-width:200px" maxlength="50"><button class="btn add">Thêm</button></div><div class="ls"></div><p class="hint">Chạm vào ô ngày hôm nay để tích. Chuỗi 🔥 tính số ngày liên tiếp tới hôm nay.</p></div>`;
      let H = GV.store.get('habits', []);
      const save = () => GV.store.set('habits', H), dstr = off => { const d = new Date(); d.setDate(d.getDate() - off); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
      const streak = h => { let n = 0, o = h.days.includes(dstr(0)) ? 0 : 1; while (h.days.includes(dstr(o))) { n++; o++; } return n; };
      function draw() {
        $(el, '.ls').innerHTML = H.map(h => `<div class="it" style="flex-direction:column;align-items:stretch"><div class="row" style="justify-content:space-between"><b>${esc(h.n)}</b><span><span title="Chuỗi ngày">🔥 ${streak(h)}</span><button class="x" data-del="${h.id}" aria-label="Xoá">✕</button></span></div><div class="row" style="justify-content:flex-start;gap:6px">${[6, 5, 4, 3, 2, 1, 0].map(o => { const d = dstr(o), on = h.days.includes(d); return `<button data-t="${h.id}" data-d="${d}" ${o ? 'disabled' : ''} title="${d.split('-').reverse().join('/')}" style="width:40px;height:40px;border-radius:12px;border:1px solid var(--line);background:${on ? 'var(--ok)' : 'transparent'};color:${on ? '#052e16' : 'var(--mut)'};font-weight:700;cursor:${o ? 'default' : 'pointer'};opacity:${o && !on ? .55 : 1}">${on ? '✓' : d.slice(8)}</button>`; }).join('')}</div></div>`).join('') || '<p class="hint">Chưa có thói quen nào – hãy thêm một thói quen nhỏ để bắt đầu.</p>';
      }
      $(el, '.add').onclick = () => { const n = $(el, '.nm').value.trim(); if (!n) return; H.push({ id: Date.now(), n, days: [] }); save(); $(el, '.nm').value = ''; draw(); };
      $(el, '.nm').onkeydown = e => { if (e.key === 'Enter') $(el, '.add').click(); };
      $(el, '.ls').onclick = e => {
        const del = e.target.closest('[data-del]'); if (del) { if (confirm('Xoá thói quen này?')) { H = H.filter(h => h.id !== +del.dataset.del); save(); draw(); } return; }
        const b = e.target.closest('[data-t]'); if (!b || b.disabled) return; const h = H.find(x => x.id === +b.dataset.t), d = b.dataset.d;
        h.days = h.days.includes(d) ? h.days.filter(x => x !== d) : [...h.days, d]; h.days = h.days.slice(-400); save(); draw(); if (h.days.includes(d)) GV.beep(700, 60);
      };
      draw();
    }
  });

  /* ---------- TÍNH KHOẢN VAY & TIẾT KIỆM ---------- */
  GV.register({
    id: 'loan', type: 'tool', cat: 'Tính toán', name: 'Tính vay & tiết kiệm', icon: '🏦', desc: 'Tính tiền trả hằng tháng khi vay (dư nợ giảm dần / gốc đều) và tiền lãi khi gửi tiết kiệm.',
    mount(el) {
      el.innerHTML = css + `<div class="tool xt" style="max-width:700px"><div class="row"><button class="btn m" data-m="loan">Vay vốn</button><button class="btn ghost m" data-m="save">Gửi tiết kiệm</button></div><div class="row"><label>Số tiền <input class="p" type="number" value="500000000" inputmode="numeric" style="width:170px"></label><label>Lãi suất %/năm <input class="r" type="number" value="9.5" step="0.1" style="width:100px"></label><label>Kỳ hạn (tháng) <input class="n" type="number" value="120" style="width:100px"></label></div><div class="row opt"><label>Cách trả <select class="k"><option value="ann">Gốc + lãi chia đều (annuity)</option><option value="lin">Gốc đều, lãi theo dư nợ giảm dần</option></select></label></div><div class="res out" style="line-height:1.8"></div><details class="det"><summary style="cursor:pointer;font-weight:600">Lịch trả nợ từng tháng</summary><div style="max-height:320px;overflow:auto"><table class="tb"></table></div></details></div>`;
      let mode = 'loan';
      function calc() {
        const P = Math.max(0, +$(el, '.p').value), r = Math.max(0, +$(el, '.r').value) / 100 / 12, n = Math.max(1, Math.min(600, Math.round(+$(el, '.n').value))), out = $(el, '.out'), tb = $(el, '.tb');
        if (mode === 'save') {
          const comp = P * Math.pow(1 + r, n), simple = P * (1 + r * n);
          out.innerHTML = `Gửi <b>${vnd(P)}</b> trong <b>${n}</b> tháng, lãi <b>${(r * 1200).toFixed(2)}%/năm</b><br>• Lãi đơn (nhận lãi cuối kỳ): <b>${vnd(simple)}</b> (lãi ${vnd(simple - P)})<br>• Lãi kép (nhập lãi vào gốc mỗi tháng): <b>${vnd(comp)}</b> (lãi ${vnd(comp - P)})`; tb.innerHTML = ''; return;
        }
        let rows = [], bal = P, tot = 0;
        if ($(el, '.k').value === 'ann') { const pm = r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n; for (let i = 1; i <= n; i++) { const it = bal * r, pr = pm - it; bal -= pr; tot += it; rows.push([i, pr, it, pm, Math.max(0, bal)]); } }
        else { const pr = P / n; for (let i = 1; i <= n; i++) { const it = bal * r; bal -= pr; tot += it; rows.push([i, pr, it, pr + it, Math.max(0, bal)]); } }
        out.innerHTML = `Vay <b>${vnd(P)}</b> trong <b>${n}</b> tháng, lãi <b>${(r * 1200).toFixed(2)}%/năm</b><br>• Tháng đầu trả: <b>${vnd(rows[0][3])}</b>${rows.length > 1 && rows[0][3] !== rows[rows.length - 1][3] ? ` (tháng cuối ${vnd(rows[rows.length - 1][3])})` : ' mỗi tháng'}<br>• Tổng tiền lãi: <b>${vnd(tot)}</b><br>• Tổng phải trả: <b>${vnd(P + tot)}</b>`;
        tb.innerHTML = '<tr><th>Tháng</th><th>Gốc</th><th>Lãi</th><th>Tổng</th><th>Dư nợ</th></tr>' + rows.map(x => `<tr><td>${x[0]}</td><td>${vnd(x[1])}</td><td>${vnd(x[2])}</td><td>${vnd(x[3])}</td><td>${vnd(x[4])}</td></tr>`).join('');
      }
      el.addEventListener('click', e => { const b = e.target.closest('.m'); if (!b) return; mode = b.dataset.m; el.querySelectorAll('.m').forEach(x => x.classList.toggle('ghost', x !== b)); $(el, '.opt').hidden = $(el, '.det').hidden = mode === 'save'; calc(); });
      el.addEventListener('input', calc); el.addEventListener('change', calc); calc();
    }
  });

  /* ---------- MÁY ĐẾM NHỊP ---------- */
  GV.register({
    id: 'metronome', type: 'tool', cat: 'Âm nhạc', name: 'Máy đếm nhịp', icon: '🎼', desc: 'Metronome chính xác: chỉnh BPM, số nhịp mỗi ô, nhấn nhịp mạnh, gõ tempo bằng tay.',
    mount(el) {
      el.innerHTML = css + `<div class="tool xt" style="max-width:480px;align-items:center"><div class="big bp" style="font-size:4rem">100</div><div class="hint">nhịp / phút (BPM) · <span class="tn">Andante</span></div><input class="sl" type="range" min="30" max="240" value="100" style="width:100%"><div class="row"><button class="btn ghost" data-b="-5">−5</button><button class="btn ghost" data-b="-1">−1</button><button class="btn ghost" data-b="1">+1</button><button class="btn ghost" data-b="5">+5</button></div><div class="row dots" style="gap:10px;min-height:34px"></div><div class="row"><label>Số nhịp / ô <select class="bt"><option>2</option><option>3</option><option selected>4</option><option>6</option></select></label><button class="btn tap ghost">Gõ nhịp (tap)</button></div><button class="btn go big" style="min-width:180px">▶ Bắt đầu</button></div>`;
      let bpm = 100, beats = 4, ctx = null, run = false, next = 0, idx = 0, timer = null, taps = [];
      const names = b => b < 60 ? 'Largo' : b < 76 ? 'Adagio' : b < 108 ? 'Andante' : b < 120 ? 'Moderato' : b < 156 ? 'Allegro' : b < 200 ? 'Vivace' : 'Presto';
      const dots = () => { $(el, '.dots').innerHTML = Array.from({ length: beats }, (_, i) => `<i style="width:${i ? 20 : 28}px;height:${i ? 20 : 28}px;border-radius:50%;background:var(--md-sc-highest,#444)" data-i="${i}"></i>`).join(''); };
      const setB = v => { bpm = Math.max(30, Math.min(240, Math.round(v))); $(el, '.bp').textContent = bpm; $(el, '.sl').value = bpm; $(el, '.tn').textContent = names(bpm); };
      function click(t, strong) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = strong ? 1500 : 1000; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(strong ? .6 : .35, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .06); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + .08); }
      function sched() {
        while (next < ctx.currentTime + .15) { const i = idx % beats, d = Math.max(0, (next - ctx.currentTime) * 1000); click(next, i === 0); setTimeout(() => { const ds = el.querySelectorAll('.dots i'); ds.forEach((x, k) => { x.style.background = k === i ? (i === 0 ? 'var(--md-primary,#D0BCFF)' : 'var(--acc2,#7FCFFF)') : 'var(--md-sc-highest,#444)'; x.style.transform = k === i ? 'scale(1.25)' : ''; }); }, d); next += 60 / bpm; idx++; }
      }
      function toggle() {
        if (run) { run = false; clearInterval(timer); $(el, '.go').textContent = '▶ Bắt đầu'; return; }
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); run = true; idx = 0; next = ctx.currentTime + .06; $(el, '.go').textContent = '⏹ Dừng'; sched(); timer = setInterval(sched, 25);
      }
      el.addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) setB(bpm + +b.dataset.b); });
      $(el, '.sl').oninput = e => setB(+e.target.value); $(el, '.bt').onchange = e => { beats = +e.target.value; idx = 0; dots(); };
      $(el, '.go').onclick = toggle;
      $(el, '.tap').onclick = () => { const n = performance.now(); taps = taps.filter(t => n - t < 2500); taps.push(n); if (taps.length > 1) setB(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1))); };
      dots(); setB(100);
      return () => { run = false; clearInterval(timer); if (ctx) try { ctx.close(); } catch (e) {} };
    }
  });
})();
