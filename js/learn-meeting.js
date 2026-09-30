// Phân tích cuộc họp: ghi âm + nhận dạng giọng nói trực tiếp (hoặc nạp file), rồi tóm tắt / biên bản / việc cần làm bằng AI hoặc bộ phân tích offline.
(function () {
  const L = GV.learn, esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const mm = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const STOP = new Set(('và của là có cho không được này một những các trong khi với để đã sẽ thì mà cũng như khi nên rất nhưng hay vẫn đang bị từ ra vào lại còn tôi bạn anh chị em mình chúng ta họ nó thế vậy đó ạ dạ vâng rồi thôi nhé nha ờ à ừ ' +
    'the a an and or but of to in on at for with is are was were be been this that these those it its as by from we you they he she i our your their not do does did have has had will would can could should so if then than about there here what which who when where how just also').split(' '));
  const PAT = {
    action: /(cần|phải|sẽ|giao cho|nhờ|đề nghị|chịu trách nhiệm|hoàn thành|deadline|hạn chót|trước (ngày|thứ|cuối)|follow.?up|gửi|liên hệ|chuẩn bị|kiểm tra|cập nhật|need to|must|should|will |todo|action item|assign|by (monday|tuesday|wednesday|thursday|friday|end of)|please|してください|お願い|までに|必要|해야|부탁|까지|필요|需要|必须|请|截止|负责|完成)/i,
    decide: /(quyết định|thống nhất|chốt|đồng ý|chấp thuận|phê duyệt|decided|agreed|approved|conclude|go with|決定|合意|承認|결정|합의|승인|决定|同意|批准)/i,
    risk: /(rủi ro|vấn đề|khó khăn|chậm trễ|trễ|lỗi|thiếu|vướng|risk|issue|problem|delay|blocked|blocker|concern|リスク|問題|遅れ|위험|문제|지연|风险|问题|延迟)/i
  };
  const md = t => {
    const lines = t.split('\n'); let out = '', inList = false, inTbl = false;
    const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    for (const l of lines) {
      const tbl = /^\s*\|.*\|\s*$/.test(l);
      if (inTbl && !tbl) { out += '</table>'; inTbl = false; }
      if (inList && !/^\s*[-*•]\s+/.test(l)) { out += '</ul>'; inList = false; }
      if (tbl) { if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue; const cells = l.trim().slice(1, -1).split('|').map(c => inl(c.trim())); if (!inTbl) { out += '<table class="list">'; inTbl = true; out += '<tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr>'; } else out += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>'; }
      else if (/^#{1,4}\s/.test(l)) out += `<h4 style="margin:12px 0 4px">${inl(l.replace(/^#+\s*/, ''))}</h4>`;
      else if (/^\s*[-*•]\s+/.test(l)) { if (!inList) { out += '<ul style="margin:4px 0;padding-left:20px">'; inList = true; } out += `<li>${inl(l.replace(/^\s*[-*•]\s+/, ''))}</li>`; }
      else if (l.trim()) out += `<p style="margin:4px 0">${inl(l)}</p>`;
    }
    return out + (inTbl ? '</table>' : '') + (inList ? '</ul>' : '');
  };

  /* ---------- Bộ phân tích offline ---------- */
  function analyzeLocal(text, meta) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean), ent = [];
    lines.forEach(l => { const m = l.match(/^\[(\d+):(\d\d)\]\s*([^:：]{1,30})[:：]\s*(.*)$/); if (m) ent.push({ t: +m[1] * 60 + +m[2], sp: m[3].trim(), text: m[4] }); else { const m2 = l.match(/^([^:：\[]{1,24})[:：]\s*(.+)$/); ent.push(m2 ? { sp: m2[1].trim(), text: m2[2] } : { sp: '', text: l }); } });
    const words = s => (s.match(/[\p{L}\p{N}]+/gu) || []), all = ent.map(e => e.text).join(' ');
    const total = words(all).length, byS = {}; ent.forEach(e => { if (e.sp) byS[e.sp] = (byS[e.sp] || 0) + words(e.text).length; });
    const sents = all.split(/(?<=[.!?。！？])\s+|\n/).map(s => s.trim()).filter(s => s.length > 8);
    const freq = {}; words(all.toLowerCase()).forEach(w => { if (w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)) freq[w] = (freq[w] || 0) + 1; });
    const kw = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const score = s => words(s.toLowerCase()).reduce((a, w) => a + (freq[w] || 0), 0) / Math.sqrt(words(s).length + 1);
    const top = sents.map((s, i) => ({ s, i, sc: score(s) })).sort((a, b) => b.sc - a.sc).slice(0, 5).sort((a, b) => a.i - b.i).map(x => x.s);
    const pick = re => [...new Set(sents.filter(s => re.test(s)))].slice(0, 12);
    const dates = [...new Set(all.match(/\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b|\b\d{1,2}[:h]\d{2}\b|\b\d+([.,]\d+)?\s?(triệu|tỷ|nghìn|k|usd|vnd|đ|%|\$)/gi) || [])].slice(0, 12);
    const dur = ent.reduce((m, e) => Math.max(m, e.t || 0), 0) || meta.dur || 0;
    const li = a => a.length ? a.map(x => '- ' + x).join('\n') : '- (không phát hiện)';
    return `# Biên bản họp: ${meta.title || 'Cuộc họp'}\n**Ngày:** ${new Date().toLocaleDateString('vi-VN')}${dur ? ' · **Thời lượng:** ~' + mm(dur) : ''} · **Số từ:** ${total}\n\n## Tóm tắt nhanh (trích ý chính)\n${li(top)}\n\n## Từ khoá nổi bật\n${kw.length ? kw.map(([w, n]) => `**${w}** (${n})`).join(' · ') : '(chưa đủ dữ liệu)'}\n\n## Quyết định đã chốt\n${li(pick(PAT.decide))}\n\n## Việc cần làm / giao việc\n${li(pick(PAT.action))}\n\n## Vấn đề & rủi ro được nhắc\n${li(pick(PAT.risk))}\n\n## Câu hỏi còn bỏ ngỏ\n${li(sents.filter(s => /[?？]\s*$/.test(s)).slice(0, 10))}\n\n## Mốc thời gian / con số\n${dates.length ? dates.join(' · ') : '(không phát hiện)'}\n\n## Mức độ tham gia\n${Object.keys(byS).length ? Object.entries(byS).sort((a, b) => b[1] - a[1]).map(([s, n]) => `- **${s}**: ${n} từ (${Math.round(n / Math.max(1, Object.values(byS).reduce((a, b) => a + b, 0)) * 100)}%)`).join('\n') : '- Chưa gắn tên người nói (dùng nút chọn người nói khi ghi âm để thống kê).'}\n\n> Đây là phân tích tự động không dùng AI (trích câu theo từ khoá). Nhập khóa AI để có biên bản viết lại mạch lạc, bảng việc cần làm có người phụ trách và hạn.`;
  }

  GV.register({
    id: 'meeting', type: 'tool', cat: 'Học tập', name: 'Phân tích cuộc họp (ghi âm)', icon: '🎙️', desc: 'Ghi âm + ghi chép lời nói → tóm tắt, quyết định, việc cần làm.',
    mount(el) {
      let rec = null, mr = null, chunks = [], stream = null, sr = null, t0 = 0, tm = null, blob = null, audioURL = null, spk = 0, result = '', dead = false, elapsed = 0;
      el.innerHTML = `<div class="tool" style="max-width:800px">${L.ai.panelHTML()}
        <div class="row"><input class="ti" placeholder="Tên cuộc họp" style="flex:1;min-width:150px"><select class="lg">${['vi', 'en', 'ja', 'ko', 'zh'].map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('')}</select></div>
        <div class="row"><input class="pp" placeholder="Người tham gia, cách nhau dấu phẩy (vd: An, Bình, Chi)" style="flex:1;min-width:200px"></div>
        <div class="row"><button class="btn rc">● Bắt đầu ghi âm</button><span class="big tmr" style="font-size:1.6rem">0:00</span></div>
        <div class="row spk"></div>
        <div class="hint live" style="min-height:1.3em"></div>
        <label>Bản ghi lời nói (có thể sửa trực tiếp, hoặc dán/nạp file .txt .srt .vtt)</label>
        <textarea class="tx" style="min-height:170px" placeholder="Lời nói sẽ hiện ở đây khi ghi âm…"></textarea>
        <div class="row"><input type="file" class="fi" accept="audio/*,.txt,.srt,.vtt,.md,text/*"><span class="hint">Nạp file ghi âm hoặc bản ghi có sẵn</span></div>
        <div class="row au" hidden><audio class="pl" controls style="max-width:100%"></audio><button class="pbtn tsr">🧠 Chuyển file thành chữ bằng AI</button><button class="pbtn dla">⬇️ Tải âm thanh</button></div>
        <div class="row"><button class="btn ok an">📊 Phân tích cuộc họp</button><button class="pbtn sv">💾 Lưu</button></div>
        <div class="msg st"></div><div class="res-out box" hidden style="text-align:left"></div>
        <div class="row rx" hidden><button class="pbtn cpm">📋 Sao chép</button><button class="pbtn dlm">⬇️ Tải .md</button><button class="pbtn prt">🖨️ In</button></div>
        <details class="box his" style="text-align:left"><summary>📚 Các cuộc họp đã lưu</summary><div class="hl"></div></details>
        <div class="hint">Âm thanh ghi âm chỉ lưu trên máy bạn. Bản ghi chữ chỉ được gửi tới nhà cung cấp AI khi bạn bấm "Phân tích" và đã nhập khóa. Nhận dạng giọng nói trực tiếp dùng dịch vụ của trình duyệt (Chrome/Safari) và cần mạng.</div></div>`;
      L.ai.bindPanel(el, () => {});
      const st = m => { $(el, '.st').textContent = m || ''; };
      const names = () => { const n = $(el, '.pp').value.split(',').map(s => s.trim()).filter(Boolean); return n.length ? n : ['Người nói 1', 'Người nói 2']; };
      const drawSpk = () => { $(el, '.spk').innerHTML = '<span class="hint">Đang nói:</span>' + names().map((n, i) => `<button class="pbtn ${i === spk ? 'sel' : ''}" data-s="${i}">${esc(n)}</button>`).join(''); };
      $(el, '.pp').oninput = () => { spk = 0; drawSpk(); }; $(el, '.spk').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { spk = +b.dataset.s; drawSpk(); } }; drawSpk();
      const add = text => { const t = $(el, '.tx'); t.value += (t.value && !t.value.endsWith('\n') ? '\n' : '') + `[${mm((Date.now() - t0) / 1000)}] ${names()[spk] || ''}: ${text.trim()}\n`; t.scrollTop = t.scrollHeight; };

      /* --- ghi âm --- */
      async function start() {
        if (!navigator.mediaDevices || !window.MediaRecorder) { st('Trình duyệt chưa hỗ trợ ghi âm – hãy dán bản ghi hoặc nạp file.'); return; }
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { st('Không truy cập được micro: ' + e.message); return; }
        chunks = []; blob = null; const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(m => MediaRecorder.isTypeSupported(m));
        mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); mr.ondataavailable = e => e.data.size && chunks.push(e.data);
        mr.onstop = () => { blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); if (audioURL) URL.revokeObjectURL(audioURL); audioURL = URL.createObjectURL(blob); $(el, '.pl').src = audioURL; $(el, '.au').hidden = false; };
        mr.start(1000); t0 = Date.now(); rec = true; $(el, '.rc').textContent = '■ Dừng ghi âm'; $(el, '.rc').classList.add('bad');
        tm = setInterval(() => { elapsed = (Date.now() - t0) / 1000; $(el, '.tmr').textContent = mm(elapsed); }, 500);
        if (L.hasSTT()) sr = L.listen($(el, '.lg').value, { onText: (f, i) => { $(el, '.live').textContent = i ? '… ' + i : ''; if (f.trim()) add(f); }, onError: m => st(m + ' (vẫn đang ghi âm).') });
        else st('Trình duyệt chưa hỗ trợ nhận giọng nói trực tiếp → đang ghi âm; sau đó bấm "Chuyển file thành chữ bằng AI" (cần khóa Gemini/OpenAI) hoặc tự gõ.');
      }
      function stop() { rec = false; clearInterval(tm); try { sr && sr.stop(); } catch (e) {} sr = null; try { mr && mr.state !== 'inactive' && mr.stop(); } catch (e) {} if (stream) stream.getTracks().forEach(t => t.stop()); $(el, '.rc').textContent = '● Ghi âm tiếp'; $(el, '.rc').classList.remove('bad'); $(el, '.live').textContent = ''; }
      $(el, '.rc').onclick = () => rec ? stop() : start();
      $(el, '.dla').onclick = () => { if (!blob) return; const a = document.createElement('a'); a.href = audioURL; a.download = 'cuoc-hop.' + (blob.type.includes('mp4') ? 'm4a' : 'webm'); a.click(); };

      /* --- nạp file --- */
      $(el, '.fi').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        if (f.type.startsWith('audio/')) { blob = f; if (audioURL) URL.revokeObjectURL(audioURL); audioURL = URL.createObjectURL(f); $(el, '.pl').src = audioURL; $(el, '.au').hidden = false; st('Đã nạp file âm thanh. Bấm "Chuyển file thành chữ bằng AI" để lấy bản ghi (cần khóa Gemini/OpenAI).'); }
        else { let tx = await L.readFile(f); if (/\.(srt|vtt)$/i.test(f.name)) tx = tx.replace(/^WEBVTT.*$/m, '').replace(/^\d+\s*$/gm, '').replace(/(\d+:)?\d\d:\d\d[.,]\d+\s*-->.*$/gm, '').replace(/\n{2,}/g, '\n'); $(el, '.tx').value = tx.trim(); if (!$(el, '.ti').value) $(el, '.ti').value = f.name.replace(/\.[^.]+$/, ''); st('Đã nạp bản ghi (' + tx.length + ' ký tự).'); }
      };
      $(el, '.tsr').onclick = async () => {
        if (!blob) return; st('Đang chuyển âm thanh thành chữ…');
        try { const t = await L.ai.transcribe(blob, $(el, '.lg').value); $(el, '.tx').value += (($(el, '.tx').value ? '\n' : '') + t); st('✅ Đã chuyển thành chữ.'); } catch (e) { st('⚠️ ' + e.message); }
      };

      /* --- phân tích --- */
      async function analyze() {
        const text = $(el, '.tx').value.trim(); if (text.length < 20) { st('Bản ghi quá ngắn để phân tích.'); return; }
        const meta = { title: $(el, '.ti').value.trim(), dur: elapsed }; const out = $(el, '.res-out');
        out.hidden = false; st('');
        if (!L.ai.ready()) { result = analyzeLocal(text, meta); out.innerHTML = md(result); $(el, '.rx').hidden = false; return; }
        out.innerHTML = '<i>AI đang phân tích…</i>'; $(el, '.an').disabled = true;
        const sys = 'Bạn là thư ký họp chuyên nghiệp. Hãy viết biên bản bằng tiếng Việt, trung thực với nội dung bản ghi, KHÔNG bịa thông tin. Bản ghi có thể lỗi nhận dạng giọng nói: hãy suy luận hợp lý và đánh dấu (?) chỗ không chắc.\nĐịnh dạng Markdown gồm các mục:\n# Biên bản họp: <tên>\n## Tóm tắt (3–5 câu)\n## Nội dung thảo luận chính (gạch đầu dòng theo chủ đề)\n## Quyết định đã chốt\n## Việc cần làm (bảng Markdown: | Việc | Người phụ trách | Hạn | — nếu không rõ ghi "Chưa rõ")\n## Vấn đề & rủi ro\n## Câu hỏi còn bỏ ngỏ\n## Đánh giá buổi họp (mức độ tham gia của từng người, thời gian, đề xuất cải thiện)';
        try {
          result = await L.ai.chat([{ role: 'user', content: `Tên cuộc họp: ${meta.title || '(chưa đặt)'}\nNgôn ngữ bản ghi: ${L.LANGS[$(el, '.lg').value].name}\nNgười tham gia: ${names().join(', ')}\nThời lượng: ${elapsed ? mm(elapsed) : 'không rõ'}\n\nBẢN GHI:\n${text.slice(0, 150000)}` }], { system: sys, maxTokens: 12000 });
          out.innerHTML = md(result); $(el, '.rx').hidden = false;
        } catch (e) { out.innerHTML = `<span style="color:var(--bad)">⚠️ ${esc(e.message)}</span><hr>` + 'Đang dùng phân tích offline thay thế:' + md(analyzeLocal(text, meta)); result = analyzeLocal(text, meta); $(el, '.rx').hidden = false; }
        $(el, '.an').disabled = false;
      }
      $(el, '.an').onclick = analyze;
      $(el, '.cpm').onclick = async e => { try { await navigator.clipboard.writeText(result); e.target.textContent = 'Đã chép ✓'; setTimeout(() => e.target.textContent = '📋 Sao chép', 1200); } catch (x) {} };
      $(el, '.dlm').onclick = () => L.download((($(el, '.ti').value.trim() || 'bien-ban-hop')) + '.md', result);
      $(el, '.prt').onclick = () => { const w = window.open('', '_blank'); if (!w) return; w.document.write('<html><head><meta charset="utf-8"><title>Biên bản họp</title><style>body{font:15px/1.6 sans-serif;max-width:720px;margin:20px auto}table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px 8px}</style></head><body>' + md(result) + '</body></html>'); w.document.close(); w.print(); };

      /* --- lịch sử --- */
      const hist = () => GV.store.get('meetings', []);
      function drawHist() { const h = hist(); $(el, '.hl').innerHTML = h.length ? h.map((m, i) => `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 0"><span>${esc(m.title || 'Cuộc họp')} <span class="hint">${new Date(m.at).toLocaleString('vi-VN')}</span></span><span><button class="pbtn" data-o="${i}">Mở</button> <button class="pbtn" data-x="${i}">🗑</button></span></div>`).join('') : '<div class="hint">Chưa lưu cuộc họp nào.</div>'; }
      $(el, '.sv').onclick = () => { const tx = $(el, '.tx').value.trim(); if (!tx) return; const h = hist(); h.unshift({ title: $(el, '.ti').value.trim(), tx, result, at: Date.now() }); GV.store.set('meetings', h.slice(0, 20)); drawHist(); st('Đã lưu (chỉ lưu chữ, không lưu âm thanh).'); };
      $(el, '.hl').onclick = e => { const o = e.target.closest('[data-o]'), x = e.target.closest('[data-x]'); const h = hist(); if (o) { const m = h[+o.dataset.o]; $(el, '.ti').value = m.title; $(el, '.tx').value = m.tx; result = m.result || ''; const out = $(el, '.res-out'); out.hidden = !result; out.innerHTML = md(result); $(el, '.rx').hidden = !result; } else if (x) { h.splice(+x.dataset.x, 1); GV.store.set('meetings', h); drawHist(); } };
      drawHist();
      return () => { dead = true; if (rec) stop(); if (audioURL) URL.revokeObjectURL(audioURL); };
    }
  });
  GV.learn.analyzeMeetingLocal = analyzeLocal;
})();
