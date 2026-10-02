// Học piano: bàn phím 2 quãng tám (chuột/cảm ứng/bàn phím máy), nghe mẫu, tập từng nốt có gợi ý, chấm độ chính xác.
(function () {
  const $ = (r, s) => r.querySelector(s);
  const SOL = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'], LET = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const BLACK = [1, 3, 6, 8, 10], LO = 60, HI = 84;
  const S = (s) => s.split(' ').map(t => { const [n, b] = t.split(':'); return [+n, +(b || 1)]; });
  // bài hát đơn giản, ngoài bản quyền (dân gian / cổ điển)
  const SONGS = [
    { n: 'Twinkle Twinkle (Lấp lánh ngôi sao)', s: S('60 60 67 67 69 69 67:2 65 65 64 64 62 62 60:2 67 67 65 65 64 64 62:2 67 67 65 65 64 64 62:2 60 60 67 67 69 69 67:2 65 65 64 64 62 62 60:2') },
    { n: 'Mary Had a Little Lamb', s: S('64 62 60 62 64 64 64:2 62 62 62:2 64 67 67:2 64 62 60 62 64 64 64 64 62 62 64 62 60:3') },
    { n: 'Ode to Joy (Beethoven)', s: S('64 64 65 67 67 65 64 62 60 60 62 64 64:1.5 62:.5 62:2 64 64 65 67 67 65 64 62 60 60 62 64 62:1.5 60:.5 60:2') },
    { n: 'Jingle Bells (điệp khúc)', s: S('64 64 64:2 64 64 64:2 64 67 60:1.5 62:.5 64:4 65 65 65:1.5 65:.5 65 64 64 64:.5 64:.5 64 62 62 64 62:2 67:2') },
    { n: 'Happy Birthday', s: S('60:.75 60:.25 62 60 65 64:2 60:.75 60:.25 62 60 67 65:2 60:.75 60:.25 72 69 65 64 62 70:.75 70:.25 69 65 67 65:2') },
    { n: 'Für Elise (mở đầu)', s: S('76:.5 75:.5 76:.5 75:.5 76:.5 71:.5 74:.5 72:.5 69:1.5 60:.5 64:.5 69:.5 71:1.5 64:.5 68:.5 71:.5 72:1.5') }
  ];
  const KEYMAP = 'a w s e d f t g y h u j k o l p ; \''.split(' '); // phím máy tính → nốt từ Do giữa (60) lên
  const KM = {}; KEYMAP.forEach((k, i) => { KM[k] = 60 + i; });

  GV.register({
    id: 'piano', type: 'tool', cat: 'Học tập', name: 'Học chơi Piano', icon: '🎹', desc: 'Đàn piano trên màn hình: chơi tự do, nghe mẫu và tập từng nốt theo bài hát có gợi ý, chấm độ chính xác.',
    mount(el) {
      const st = Object.assign({ lab: 'sol', song: 0 }, GV.store.get('piano', {}));
      let ac = null, mode = 'free', si = 0, idx = 0, errs = 0, timers = [], dead = false;
      const WK = []; for (let m = LO; m <= HI; m++) if (!BLACK.includes(m % 12)) WK.push(m);
      const KW = 46, BW = 28;
      el.innerHTML = `<style>.pn .kb{position:relative;height:170px;margin:0 auto;touch-action:none;user-select:none;-webkit-user-select:none}.pn .sc{overflow-x:auto;width:100%;border-radius:14px;padding-bottom:4px;scrollbar-width:thin}.pn .wk,.pn .bk{position:absolute;top:0;border:1px solid #0006;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;font-size:11px;box-sizing:border-box;padding-bottom:6px;transition:background .08s}.pn .wk{height:170px;width:${KW}px;background:#fafafa;color:#555;border-radius:0 0 8px 8px}.pn .bk{height:104px;width:${BW}px;background:#222;color:#bbb;z-index:2;border-radius:0 0 6px 6px;font-size:9px}.pn .wk.on{background:#B39DDB}.pn .bk.on{background:#7E57C2}.pn .nx{box-shadow:inset 0 0 0 3px #66BB6A,0 0 12px #66BB6A}.pn .ok{background:#A5D6A7!important}.pn .bad{background:#EF9A9A!important}.pn .strip{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;min-height:34px}.pn .strip b{padding:3px 8px;border-radius:8px;background:var(--md-sc-high,#2b292d);font-size:14px}.pn .strip b.cu{background:var(--t-p);outline:2px solid var(--md-primary,#D0BCFF)}.pn .strip b.dn{opacity:.35}.pn .pg{height:6px;border-radius:4px;background:var(--line);width:100%;overflow:hidden}.pn .pg i{display:block;height:100%;background:var(--ok);width:0;transition:width .2s}.pn select{min-width:0}</style>
<div class="tool pn" style="max-width:720px;align-items:center"><div class="row"><select class="md"><option value="free">🎹 Chơi tự do</option><option value="learn">🎯 Tập theo bài (có gợi ý)</option><option value="listen">🔊 Nghe mẫu</option></select><select class="sg">${SONGS.map((x, i) => `<option value="${i}">${x.n}</option>`).join('')}</select><select class="lb"><option value="sol">Do Re Mi</option><option value="let">C D E</option><option value="none">Ẩn tên nốt</option></select></div>
<div class="strip"></div><div class="pg"><i></i></div><p class="msg" style="min-height:1.4em"></p>
<div class="sc"><div class="kb" style="width:${WK.length * KW}px"></div></div>
<p class="hint">Chạm/bấm phím đàn, hoặc dùng bàn phím máy: <b>A S D F G H J K L ; '</b> (phím trắng) và <b>W E T Y U O P</b> (phím đen). Ở chế độ “Tập theo bài”, nốt cần bấm sáng viền xanh.</p></div>`;
      const kb = $(el, '.kb'), strip = $(el, '.strip'), msg = t => $(el, '.msg').textContent = t || '';
      $(el, '.sg').value = st.song; $(el, '.lb').value = st.lab;
      const name = m => (st.lab === 'sol' ? SOL : LET)[m % 12] + (st.lab === 'none' ? '' : '');
      const keys = {};
      const build = () => {
        kb.innerHTML = ''; let wi = 0;
        for (let m = LO; m <= HI; m++) {
          const b = BLACK.includes(m % 12), d = document.createElement('div'); d.className = b ? 'bk' : 'wk'; d.dataset.m = m;
          d.style.left = (b ? wi * KW - BW / 2 : wi * KW) + 'px'; if (!b) wi++;
          d.textContent = st.lab === 'none' ? '' : (b && st.lab === 'sol' ? '' : name(m)); kb.appendChild(d); keys[m] = d;
        }
      };
      build();
      const ctx = () => { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
      function tone(m, dur) {
        const a = ctx(); if (!a) return; const t = a.currentTime, f = 440 * Math.pow(2, (m - 69) / 12), g = a.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + (dur || 1.2)); g.connect(a.destination);
        [['triangle', 1, 1], ['sine', 2, .25]].forEach(([ty, mul, vol]) => { const o = a.createOscillator(), gg = a.createGain(); o.type = ty; o.frequency.value = f * mul; gg.gain.value = vol; o.connect(gg); gg.connect(g); o.start(t); o.stop(t + (dur || 1.2) + .05); });
      }
      const flash = (m, cls, ms) => { const k = keys[m]; if (!k) return; k.classList.add(cls); setTimeout(() => k.classList.remove(cls), ms || 160); };
      const song = () => SONGS[si].s;
      function drawStrip() {
        if (mode === 'free') { strip.innerHTML = ''; $(el, '.pg i').style.width = '0'; return; }
        const s = song(); $(el, '.pg i').style.width = (idx / s.length * 100) + '%';
        const from = Math.max(0, idx - 2); strip.innerHTML = s.slice(from, from + 12).map(([m], k) => `<b class="${from + k < idx ? 'dn' : from + k === idx ? 'cu' : ''}">${(st.lab === 'let' ? LET : SOL)[m % 12]}</b>`).join('');
        keys_clear(); if (mode === 'learn' && idx < s.length) { const k = keys[s[idx][0]]; if (k) { k.classList.add('nx'); const sc = $(el, '.sc'); sc.scrollLeft = Math.max(0, k.offsetLeft - sc.clientWidth / 2); } }
      }
      const keys_clear = () => Object.values(keys).forEach(k => k.classList.remove('nx'));
      function stopListen() { timers.forEach(clearTimeout); timers = []; }
      function press(m) {
        tone(m); const k = keys[m]; if (k) k.classList.add('on');
        if (mode === 'learn') {
          const s = song(); if (idx >= s.length) return;
          if (m === s[idx][0]) { flash(m, 'ok', 220); idx++; if (idx >= s.length) { const acc = Math.round(s.length / (s.length + errs) * 100); msg(`🎉 Hoàn thành “${SONGS[si].n}”! Độ chính xác ${acc}% (${errs} lần bấm nhầm).`); GV.beep && GV.beep(880, 150); } else msg(''); drawStrip(); }
          else { errs++; flash(m, 'bad', 260); msg('Chưa đúng – nốt cần bấm đang sáng viền xanh.'); }
        }
      }
      const release = m => { const k = keys[m]; if (k) k.classList.remove('on'); };
      function startMode() {
        stopListen(); mode = $(el, '.md').value; si = +$(el, '.sg').value; st.song = si; GV.store.set('piano', st); idx = 0; errs = 0; msg(''); keys_clear(); drawStrip();
        $(el, '.sg').style.display = mode === 'free' ? 'none' : '';
        if (mode === 'learn') msg('Bấm đúng nốt đang sáng để đi tiếp.');
        if (mode === 'listen') {
          const beat = 520; let t = 300; song().forEach(([m, b], i) => { timers.push(setTimeout(() => { idx = i; tone(m, b * .5 + .6); const k = keys[m]; if (k) { k.classList.add('on'); setTimeout(() => k.classList.remove('on'), b * beat * .85); const sc = $(el, '.sc'); sc.scrollLeft = Math.max(0, k.offsetLeft - sc.clientWidth / 2); } drawStrip(); }, t)); t += b * beat; });
          timers.push(setTimeout(() => { idx = song().length; drawStrip(); msg('Đã phát xong. Chuyển sang “Tập theo bài” để thử nhé!'); }, t));
        }
      }
      $(el, '.md').onchange = startMode; $(el, '.sg').onchange = startMode;
      $(el, '.lb').onchange = e => { st.lab = e.target.value; GV.store.set('piano', st); build(); drawStrip(); };
      const down = new Set();
      kb.addEventListener('pointerdown', e => { const k = e.target.closest('[data-m]'); if (!k) return; e.preventDefault(); const m = +k.dataset.m; k.setPointerCapture && k.releasePointerCapture && 0; down.add(m); press(m); });
      const up = () => { down.forEach(release); down.clear(); };
      kb.addEventListener('pointerup', up); kb.addEventListener('pointerleave', up); kb.addEventListener('pointercancel', up);
      const kd = e => { if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return; const m = KM[e.key.toLowerCase()]; if (m) { e.preventDefault(); press(m); } };
      const ku = e => { const m = KM[e.key.toLowerCase()]; if (m) release(m); };
      addEventListener('keydown', kd); addEventListener('keyup', ku);
      startMode();
      GV.pianoT = { get idx() { return idx; }, get mode() { return mode; }, press };
      return () => { dead = true; stopListen(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); if (ac) { try { ac.close(); } catch (e) {} } };
    }
  });
})();
