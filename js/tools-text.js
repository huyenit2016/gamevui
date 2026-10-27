// Tiện ích văn bản & lập trình: Đếm từ, Đổi kiểu chữ, JSON, Base64/URL, Mật khẩu, Lorem
(function () {
  const $ = (el, s) => el.querySelector(s);
  const copy = (t, btn) => { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); }); if (btn) { const o = btn.textContent; btn.textContent = 'Đã chép ✓'; setTimeout(() => btn.textContent = o, 1000); } };

  GV.register({
    id: 'wordcount', type: 'tool', cat: 'Văn bản', name: 'Đếm từ & ký tự', icon: '📝', desc: 'Đếm từ, ký tự, câu, thời gian đọc.',
    mount(el) {
      el.innerHTML = `<div class="tool"><textarea class="t" placeholder="Dán hoặc gõ văn bản vào đây…"></textarea><div class="res stat"></div></div>`;
      const t = $(el, '.t');
      function up() {
        const s = t.value, w = (s.trim().match(/\S+/g) || []).length;
        $(el, '.stat').innerHTML = `Từ: <b>${w}</b> · Ký tự: <b>${s.length}</b> · Không tính khoảng trắng: <b>${s.replace(/\s/g, '').length}</b><br>Câu: <b>${(s.match(/[.!?…]+(\s|$)/g) || []).length}</b> · Đoạn: <b>${s.split(/\n\s*\n/).filter(x => x.trim()).length}</b> · Thời gian đọc: <b>~${Math.max(w ? 1 : 0, Math.round(w / 200))} phút</b>`;
      }
      t.oninput = up; up();
    }
  });

  const deaccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  GV.register({
    id: 'textcase', type: 'tool', cat: 'Văn bản', name: 'Đổi kiểu chữ', icon: '🔤', desc: 'HOA, thường, Viết Hoa, bỏ dấu, slug…',
    mount(el) {
      el.innerHTML = `<div class="tool"><textarea class="t" placeholder="Nhập văn bản…"></textarea><div class="row">
      ${[['up', 'IN HOA'], ['low', 'in thường'], ['title', 'Viết Hoa Từng Từ'], ['sent', 'Chữ đầu câu'], ['noacc', 'Bỏ dấu tiếng Việt'], ['slug', 'slug-url'], ['camel', 'camelCase'], ['snake', 'snake_case'], ['rev', 'Đảo ngược'], ['dedupe', 'Xóa dòng trùng'], ['sort', 'Sắp xếp dòng']].map(([k, n]) => `<button class="btn ghost" data-k="${k}">${n}</button>`).join('')}</div>
      <button class="btn cp">Sao chép kết quả</button></div>`;
      const t = $(el, '.t');
      const words = s => deaccent(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const F = {
        up: s => s.toUpperCase(), low: s => s.toLowerCase(),
        title: s => s.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()),
        sent: s => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\S)/g, (m, a, b) => a + b.toUpperCase()),
        noacc: deaccent, slug: s => words(s).join('-'),
        camel: s => words(s).map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w).join(''), snake: s => words(s).join('_'),
        rev: s => [...s].reverse().join(''), dedupe: s => [...new Set(s.split('\n'))].join('\n'), sort: s => s.split('\n').sort((a, b) => a.localeCompare(b, 'vi')).join('\n')
      };
      el.onclick = e => { const k = e.target.dataset.k; if (k) t.value = F[k](t.value); };
      $(el, '.cp').onclick = e => copy(t.value, e.target);
    }
  });

  GV.register({
    id: 'json', type: 'tool', cat: 'Lập trình', name: 'JSON Formatter', icon: '{ }', desc: 'Định dạng, nén và kiểm tra JSON.',
    mount(el) {
      el.innerHTML = `<div class="tool" style="max-width:800px"><textarea class="t" placeholder='{"ten":"OmniHub"}' style="min-height:240px"></textarea><div class="row"><button class="btn" data-a="pretty">Làm đẹp</button><button class="btn ghost" data-a="min">Nén</button><button class="btn ghost" data-a="sort">Sắp xếp khóa</button><button class="btn ghost cp">Sao chép</button></div><p class="msg"></p></div>`;
      const t = $(el, '.t'), m = $(el, '.msg');
      const sortKeys = o => Array.isArray(o) ? o.map(sortKeys) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map(k => [k, sortKeys(o[k])])) : o;
      el.onclick = e => {
        const a = e.target.dataset.a; if (!a) return;
        try { let o = JSON.parse(t.value); if (a === 'sort') o = sortKeys(o); t.value = JSON.stringify(o, null, a === 'min' ? 0 : 2); m.style.color = 'var(--ok)'; m.textContent = '✓ JSON hợp lệ'; }
        catch (err) { m.style.color = 'var(--bad)'; m.textContent = '✗ ' + err.message; }
      };
      $(el, '.cp').onclick = e => copy(t.value, e.target);
    }
  });

  GV.register({
    id: 'encode', type: 'tool', cat: 'Lập trình', name: 'Base64 / URL', icon: '🔐', desc: 'Mã hóa & giải mã Base64, URL, HTML.',
    mount(el) {
      el.innerHTML = `<div class="tool"><textarea class="t" placeholder="Nhập văn bản…" style="min-height:120px"></textarea><div class="row">
      ${[['b64e', 'Base64 mã hóa'], ['b64d', 'Base64 giải mã'], ['ure', 'URL mã hóa'], ['urd', 'URL giải mã'], ['hte', 'HTML escape']].map(([k, n]) => `<button class="btn ghost" data-k="${k}">${n}</button>`).join('')}</div><textarea class="o" readonly placeholder="Kết quả" style="min-height:120px"></textarea><p class="msg"></p></div>`;
      const enc = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
      const dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), c => c.charCodeAt(0)));
      const F = { b64e: enc, b64d: dec, ure: encodeURIComponent, urd: decodeURIComponent, hte: GV.esc };
      el.onclick = e => {
        const k = e.target.dataset.k; if (!k) return;
        try { $(el, '.o').value = F[k]($(el, '.t').value); $(el, '.msg').textContent = ''; } catch (err) { $(el, '.o').value = ''; $(el, '.msg').textContent = 'Dữ liệu không hợp lệ.'; }
      };
    }
  });

  GV.register({
    id: 'password', type: 'tool', cat: 'Lập trình', name: 'Tạo mật khẩu', icon: '🔑', desc: 'Sinh mật khẩu ngẫu nhiên an toàn.',
    mount(el) {
      const L = (en, vi) => (GV.lang && GV.lang() === 'vi') ? vi : en, $ = q => el.querySelector(q);
      const S = { u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', l: 'abcdefghijklmnopqrstuvwxyz', n: '0123456789', s: '!@#$%^&*()-_=+[]{};:,.?' };
      const WORDS = [...new Set("an ban bay biet bong buom ca cam can cau cay chim chua cua cuoi dam dao den dep dinh doi dong dua gac gai gio gom hoa hop khe kem khoi lang len lieu lua mai may mua nam nen nui oc pho quat rang rong sao song suoi tao thu tre trua tuyet van vang vui xanh xe yen ao bep bien cho cot cuu da dau de duong em gan ghe ha hat hien hoc huong kho la lanh lon mat mau muoi nang nhan nha nuoc ong phao quan ruong sach sen tam tay tim tinh troi tuoi uom vuon xuan banh bun canh che chao com keo me nem sua trai".split(' '))]; // ~116 từ không dấu, dễ gõ
      el.innerHTML = (GV.omniCSS || '') + `<div class="om g"><div class="omc"><div class="omh"><i>🔑</i><div><h3>${L('Password Generator', 'Tạo mật khẩu')}</h3><p class="oms">${L('Secure random · nothing leaves your device', 'Ngẫu nhiên an toàn · không rời khỏi máy bạn')}</p></div></div>
<div class="pwm"><button data-md="pw" class="on">${L('Password', 'Mật khẩu')}</button><button data-md="pp">${L('Passphrase', 'Cụm từ')}</button><button data-md="pin">PIN</button></div>
<div class="ko"><input type="text" class="out" readonly aria-label="Generated" style="font-size:1.05rem"><button class="cp">${L('Copy', 'Chép')}</button></div>
<div class="ks"><i class="kb"></i></div><p class="hint msg" style="margin:6px 0 0"></p>
<div class="row" style="margin-top:14px;justify-content:space-between"><span class="hint ll">${L('Length', 'Độ dài')}: <b class="ln" style="color:#fff">16</b></span><input type="range" class="len" min="6" max="64" value="16" style="flex:1;max-width:260px;accent-color:#34d399"></div>
<div class="kopt opts"><label><input type="checkbox" data-c="u" checked>A–Z</label><label><input type="checkbox" data-c="l" checked>a–z</label><label><input type="checkbox" data-c="n" checked>0–9</label><label><input type="checkbox" data-c="s" checked>!@#$</label><label><input type="checkbox" class="nl">${L('No look-alikes (0 O l 1 I)', 'Bỏ ký tự dễ nhầm (0 O l 1 I)')}</label></div>
<div class="kopt ppo" hidden><label>${L('Separator', 'Ký tự nối')} <select class="sep" style="width:auto"><option value="-">-</option><option value=".">.</option><option value="_">_</option><option value=" ">${L('space', 'dấu cách')}</option></select></label><label><input type="checkbox" class="cap" checked>${L('Capitalize', 'Viết hoa chữ đầu')}</label><label><input type="checkbox" class="num" checked>${L('Add number', 'Thêm số')}</label></div>
<button class="omb em gen" style="width:100%">${L('Generate', 'Tạo mới')}</button>
<div class="hw" hidden><div class="row" style="justify-content:space-between;margin:16px 0 6px"><span class="hint">${L('Recent (this session only)', 'Gần đây (chỉ trong phiên này)')}</span></div><div class="hl"></div></div></div></div>
<style>.om .pwm{display:flex;gap:6px;margin-bottom:12px}.om .pwm button{flex:1;padding:8px;border-radius:12px;border:1px solid #334155;background:#0b1220;color:#cbd5e1;font-size:12px;font-weight:700}.om .pwm button.on{background:#10b9811f;border-color:#10b981;color:#34d399;box-shadow:0 0 14px #10b98133}
.om .hl{display:flex;flex-direction:column;gap:6px}.om .hl button{padding:8px 12px;border-radius:10px;border:1px solid #1e293b;background:#0b1220b3;color:#34d399;font:500 .8rem ui-monospace,Menlo,monospace;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.om .hl button:hover{border-color:#10b98166}</style>`;
      let md = 'pw', hist = [];
      const rnd = n => { const a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; let v; do { crypto.getRandomValues(a); v = a[0]; } while (v >= lim); return v % n; };
      const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
      function gen() {
        const len = +$('.len').value; let out = '', bits = 0;
        if (md === 'pw') {
          const nl = $('.nl').checked, sets = [...el.querySelectorAll('[data-c]')].filter(c => c.checked).map(c => S[c.dataset.c]).map(x => nl ? x.replace(/[0OIl1]/g, '') : x);
          if (!sets.length) { $('.out').value = ''; $('.msg').textContent = L('Pick at least one character type.', 'Hãy chọn ít nhất một loại ký tự.'); return; }
          const pool = sets.join(''), p = sets.map(x => x[rnd(x.length)]); while (p.length < len) p.push(pool[rnd(pool.length)]);
          out = shuffle(p).slice(0, len).join(''); bits = len * Math.log2(pool.length);
        } else if (md === 'pp') {
          const w = []; for (let i = 0; i < len; i++) { let x = WORDS[rnd(WORDS.length)]; if ($('.cap').checked) x = x[0].toUpperCase() + x.slice(1); w.push(x); }
          out = w.join($('.sep').value); bits = len * Math.log2(WORDS.length); if ($('.num').checked) { out += $('.sep').value + String(rnd(100)).padStart(2, '0'); bits += Math.log2(100); }
        } else { out = Array.from({ length: len }, () => rnd(10)).join(''); bits = len * Math.log2(10); }
        $('.out').value = out; hist.unshift(out); hist = hist.slice(0, 5); $('.hw').hidden = false; $('.hl').innerHTML = hist.map((h, i) => `<button data-hi="${i}" title="${L('Click to copy', 'Bấm để chép')}">${h.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</button>`).join('');
        bits = Math.round(bits); const lv = bits < 40 ? [L('Weak', 'Yếu'), '#f43f5e'] : bits < 70 ? [L('Fair', 'Trung bình'), '#f59e0b'] : bits < 100 ? [L('Strong', 'Mạnh'), '#34d399'] : [L('Excellent', 'Rất mạnh'), '#22d3ee'];
        $('.kb').style.width = Math.min(100, bits / 1.4) + '%'; $('.kb').style.background = lv[1]; $('.msg').textContent = `${lv[0]} · ~${bits} bits`;
      }
      function setMode(m) {
        md = m; el.querySelectorAll('.pwm button').forEach(b => b.classList.toggle('on', b.dataset.md === m)); $('.opts').hidden = m !== 'pw'; $('.ppo').hidden = m !== 'pp';
        const r = $('.len'); r.min = m === 'pw' ? 6 : m === 'pp' ? 3 : 4; r.max = m === 'pw' ? 64 : m === 'pp' ? 10 : 12; r.value = m === 'pw' ? 16 : m === 'pp' ? 5 : 6; $('.ln').textContent = r.value;
        $('.ll').firstChild.textContent = (m === 'pp' ? L('Words', 'Số từ') : L('Length', 'Độ dài')) + ': '; gen();
      }
      el.addEventListener('click', e => { const b = e.target.closest('[data-md]'); if (b) return setMode(b.dataset.md); const h = e.target.closest('[data-hi]'); if (h) { copy(hist[+h.dataset.hi], null); return; } });
      $('.len').oninput = e => { $('.ln').textContent = e.target.value; gen(); }; el.querySelectorAll('.kopt input,.kopt select').forEach(c => { c.onchange = gen; });
      $('.gen').onclick = gen; $('.cp').onclick = e => { if ($('.out').value) copy($('.out').value, e.target); }; gen();
      return GV.omniTilt ? GV.omniTilt(el) : undefined;
    }
  });

  GV.register({
    id: 'lorem', type: 'tool', cat: 'Văn bản', name: 'Văn bản mẫu', icon: '📄', desc: 'Sinh đoạn văn giả (Lorem ipsum) để thiết kế.',
    mount(el) {
      el.innerHTML = `<div class="tool"><div class="row"><label>Số đoạn: <input type="number" class="n" value="3" min="1" max="20" style="width:70px"></label><button class="btn gen">Tạo</button><button class="btn ghost cp">Sao chép</button></div><textarea class="t" readonly style="min-height:240px"></textarea></div>`;
      const W = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur'.split(' ');
      function gen() {
        const ps = []; for (let p = 0; p < Math.min(20, +$(el, '.n').value || 1); p++) {
          const s = []; for (let i = 0; i < 3 + GV.rnd(4); i++) { const w = Array.from({ length: 6 + GV.rnd(10) }, () => W[GV.rnd(W.length)]); w[0] = w[0][0].toUpperCase() + w[0].slice(1); s.push(w.join(' ') + '.'); } ps.push(s.join(' '));
        }
        $(el, '.t').value = ps.join('\n\n');
      }
      $(el, '.gen').onclick = gen; $(el, '.cp').onclick = e => copy($(el, '.t').value, e.target); gen();
    }
  });
})();
