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
      el.innerHTML = `<div class="tool" style="max-width:800px"><textarea class="t" placeholder='{"ten":"GameVui"}' style="min-height:240px"></textarea><div class="row"><button class="btn" data-a="pretty">Làm đẹp</button><button class="btn ghost" data-a="min">Nén</button><button class="btn ghost" data-a="sort">Sắp xếp khóa</button><button class="btn ghost cp">Sao chép</button></div><p class="msg"></p></div>`;
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
      el.innerHTML = `<div class="tool"><div class="res out big" style="font-size:1.4rem;font-family:monospace"></div>
      <label>Độ dài: <b class="ln">16</b></label><input type="range" class="len" min="6" max="64" value="16">
      <div class="row">${[['u', 'A-Z', 1], ['l', 'a-z', 1], ['n', '0-9', 1], ['s', '!@#$', 1]].map(([k, n, c]) => `<label><input type="checkbox" data-c="${k}" ${c ? 'checked' : ''}> ${n}</label>`).join('')}</div>
      <p class="msg"></p><div class="row"><button class="btn gen">Tạo mới</button><button class="btn ghost cp">Sao chép</button></div></div>`;
      const S = { u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', l: 'abcdefghijklmnopqrstuvwxyz', n: '0123456789', s: '!@#$%^&*()-_=+[]{};:,.?' };
      function gen() {
        const sets = [...el.querySelectorAll('[data-c]')].filter(c => c.checked).map(c => S[c.dataset.c]);
        if (!sets.length) { $(el, '.out').textContent = '—'; return; }
        const pool = sets.join(''), n = +$(el, '.len').value, r = new Uint32Array(n * 2); crypto.getRandomValues(r);
        const p = [...Array(n)].map((_, i) => i < sets.length ? sets[i][r[i] % sets[i].length] : pool[r[i] % pool.length]);
        for (let i = n - 1; i > 0; i--) { const j = r[n + i] % (i + 1);[p[i], p[j]] = [p[j], p[i]]; }
        $(el, '.out').textContent = p.join('');
        const bits = Math.log2(pool.length) * n; $(el, '.msg').textContent = 'Độ mạnh: ' + (bits < 40 ? '🔴 Yếu' : bits < 70 ? '🟡 Trung bình' : '🟢 Mạnh');
      }
      $(el, '.len').oninput = e => { $(el, '.ln').textContent = e.target.value; gen(); };
      el.querySelectorAll('[data-c]').forEach(c => c.onchange = gen);
      $(el, '.gen').onclick = gen; $(el, '.cp').onclick = e => copy($(el, '.out').textContent, e.target); gen();
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
