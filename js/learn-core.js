// Lõi dùng chung cho nhóm "Học tập": ngôn ngữ, đọc (TTS), nhận giọng nói (STT), AI, dịch, CSV.
(function () {
  const LANGS = {
    vi: { name: 'Tiếng Việt', flag: '🇻🇳', bcp: 'vi-VN', mm: 'vi' },
    en: { name: 'Tiếng Anh', flag: '🇬🇧', bcp: 'en-US', mm: 'en' },
    ja: { name: 'Tiếng Nhật', flag: '🇯🇵', bcp: 'ja-JP', mm: 'ja' },
    ko: { name: 'Tiếng Hàn', flag: '🇰🇷', bcp: 'ko-KR', mm: 'ko' },
    zh: { name: 'Tiếng Trung', flag: '🇨🇳', bcp: 'zh-CN', mm: 'zh-CN' }
  };
  const L = GV.learn = { LANGS };
  const esc = GV.esc;

  /* ---------- Đọc to (TTS) ---------- */
  L.unlock = () => { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} };
  L.speak = (text, lang, rate = .9) => {
    if (!window.speechSynthesis || !LANGS[lang] || !text) return false;
    try {
      const u = new SpeechSynthesisUtterance(String(text)); u.lang = LANGS[lang].bcp; u.rate = rate;
      const v = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
      if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  };
  L.speakAsync = (text, lang, rate = .95) => new Promise(ok => {
    if (!window.speechSynthesis || !LANGS[lang] || !text) return ok();
    try {
      const u = new SpeechSynthesisUtterance(String(text)); u.lang = LANGS[lang].bcp; u.rate = rate;
      const v = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang)); if (v) u.voice = v;
      u.onend = u.onerror = () => ok(); speechSynthesis.cancel(); speechSynthesis.speak(u); setTimeout(ok, 15000);
    } catch (e) { ok(); }
  });
  L.hasSTT = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  /* ---------- Nhận giọng nói (STT) ---------- */
  // opts: { onText(finalText, interimText), onEnd(), onError(msg), continuous }
  L.listen = (lang, opts = {}) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return null;
    let on = true, r = null;
    const start = () => {
      r = new SR(); r.lang = LANGS[lang].bcp; r.continuous = opts.continuous !== false; r.interimResults = true;
      r.onresult = e => { let fin = '', it = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; e.results[i].isFinal ? fin += t : it += t; } opts.onText && opts.onText(fin, it); };
      r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { on = false; opts.onError && opts.onError('Trình duyệt chưa được cấp quyền micro.'); } else if (e.error === 'network') opts.onError && opts.onError('Nhận giọng nói cần kết nối mạng.'); };
      r.onend = () => { if (on && opts.continuous !== false) { try { start(); } catch (e) {} } else { on = false; opts.onEnd && opts.onEnd(); } };
      try { r.start(); } catch (e) {}
    };
    start();
    return { stop() { on = false; try { r.stop(); } catch (e) {} opts.onEnd && opts.onEnd(); } };
  };

  /* ---------- AI (người dùng tự nhập khóa, lưu trên máy) ---------- */
  const DEF_MODEL = { claude: 'claude-opus-5-5', openai: 'gpt-4o-mini', gemini: 'gemini-2.0-flash' };
  L.ai = {
    cfg() { return Object.assign({ provider: 'claude', key: '', models: {} }, GV.store.get('ai', {})); },
    save(c) { GV.store.set('ai', c); },
    model(c = this.cfg()) { return (c.models || {})[c.provider] || DEF_MODEL[c.provider]; },
    ready() { return !!this.cfg().key; },
    async chat(messages, { system = '', maxTokens = 8000 } = {}) {
      const c = this.cfg(); if (!c.key) throw new Error('Chưa nhập khóa AI (bấm "⚙️ Cài đặt AI").');
      const model = this.model(c);
      let res, data;
      if (c.provider === 'claude') {
        const body = { model, max_tokens: maxTokens, messages };
        if (system) body.system = system;
        if (/^claude-(opus-5|sonnet-5|fable)/.test(model)) body.output_config = { effort: 'low' }; // hội thoại cần nhanh
        res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify(body) });
        data = await res.json(); if (!res.ok) throw new Error((data.error && data.error.message) || 'Lỗi Claude API ' + res.status);
        if (data.stop_reason === 'refusal') throw new Error('AI từ chối trả lời yêu cầu này.');
        return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
      }
      if (c.provider === 'openai') {
        res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key }, body: JSON.stringify({ model, messages: (system ? [{ role: 'system', content: system }] : []).concat(messages) }) });
        data = await res.json(); if (!res.ok) throw new Error((data.error && data.error.message) || 'Lỗi OpenAI API ' + res.status);
        return (data.choices[0].message.content || '').trim();
      }
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(c.key)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ systemInstruction: system ? { parts: [{ text: system }] } : undefined, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) }) });
      data = await res.json(); if (!res.ok) throw new Error((data.error && data.error.message) || 'Lỗi Gemini API ' + res.status);
      return ((data.candidates && data.candidates[0].content.parts) || []).map(p => p.text || '').join('').trim();
    },
    // Chuyển file âm thanh thành chữ (Gemini hoặc OpenAI Whisper). lang = mã ngôn ngữ của GV.learn.LANGS
    async transcribe(blob, lang) {
      const c = this.cfg(); if (!c.key) throw new Error('Cần nhập khóa Gemini hoặc OpenAI để chuyển file ghi âm thành chữ.');
      if (c.provider === 'openai') {
        const fd = new FormData(); fd.append('file', blob, 'audio.' + ((blob.type.split('/')[1] || 'webm').split(';')[0])); fd.append('model', 'whisper-1'); fd.append('language', lang === 'zh' ? 'zh' : lang);
        const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { authorization: 'Bearer ' + c.key }, body: fd });
        const d = await r.json(); if (!r.ok) throw new Error((d.error && d.error.message) || 'Lỗi Whisper ' + r.status); return d.text;
      }
      if (c.provider === 'gemini') {
        if (blob.size > 18e6) throw new Error('File quá lớn (tối đa ~18MB).');
        const b64 = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.onerror = no; fr.readAsDataURL(blob); });
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model(c))}:generateContent?key=${encodeURIComponent(c.key)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: (blob.type || 'audio/webm').split(';')[0], data: b64 } }, { text: `Hãy chép lại chính xác lời nói trong file âm thanh này (ngôn ngữ: ${LANGS[lang].name}). Chỉ trả về nội dung chép lại, không thêm lời bình.` }] }] }) });
        const d = await r.json(); if (!r.ok) throw new Error((d.error && d.error.message) || 'Lỗi Gemini ' + r.status);
        return ((d.candidates && d.candidates[0].content.parts) || []).map(p => p.text || '').join('').trim();
      }
      throw new Error('Claude chưa hỗ trợ âm thanh – hãy chọn Gemini hoặc OpenAI trong cài đặt AI để chuyển giọng nói thành chữ.');
    },
    // Khung cài đặt AI dùng chung
    panelHTML() {
      const c = this.cfg(), P = { claude: 'Claude (Anthropic)', openai: 'OpenAI (ChatGPT)', gemini: 'Google Gemini' };
      return `<details class="aicfg box" ${c.key ? '' : 'open'} style="text-align:left"><summary>⚙️ Cài đặt AI ${c.key ? '<span class="hint">(đã có khóa – ' + P[c.provider] + ')</span>' : '<span class="hint">(chưa có khóa)</span>'}</summary>
        <div class="col" style="max-width:none;margin-top:8px"><label>Nhà cung cấp <select class="ai-p">${Object.keys(P).map(k => `<option value="${k}" ${k === c.provider ? 'selected' : ''}>${P[k]}</option>`).join('')}</select></label>
        <label>Khóa API <input class="ai-k" type="password" placeholder="Dán khóa API của bạn" value="${esc(c.key)}" style="width:100%" autocomplete="off"></label>
        <label>Model <input class="ai-m" value="${esc(this.model(c))}" style="width:100%"></label>
        <div class="hint">Khóa chỉ lưu trong trình duyệt của bạn (không gửi lên máy chủ của GameVui) và chỉ dùng để gọi thẳng tới nhà cung cấp AI. Nên dùng khóa có giới hạn chi phí. Chi phí do tài khoản của bạn chi trả.</div>
        <div class="row" style="justify-content:flex-start"><button class="btn ai-s" style="padding:6px 14px">Lưu</button><button class="btn ghost ai-x" style="padding:6px 14px">Xoá khóa</button></div></div></details>`;
    },
    bindPanel(root, onSave) {
      const q = s => root.querySelector(s); if (!q('.ai-p')) return;
      q('.ai-p').onchange = () => { const c = this.cfg(); q('.ai-m').value = (c.models || {})[q('.ai-p').value] || DEF_MODEL[q('.ai-p').value]; };
      q('.ai-s').onclick = () => { const c = this.cfg(); c.provider = q('.ai-p').value; c.key = q('.ai-k').value.trim(); c.models = Object.assign({}, c.models, { [c.provider]: q('.ai-m').value.trim() || DEF_MODEL[c.provider] }); this.save(c); onSave && onSave(); };
      q('.ai-x').onclick = () => { const c = this.cfg(); c.key = ''; this.save(c); q('.ai-k').value = ''; onSave && onSave(); };
    }
  };

  /* ---------- Dịch văn bản ---------- */
  // Dịch miễn phí bằng MyMemory; nếu đã có khóa AI và opts.ai !== false thì dùng AI cho chất lượng tốt hơn.
  L.translate = async (text, from, to, opts = {}) => {
    text = String(text || '').trim(); if (!text || from === to) return text;
    if (opts.ai !== false && L.ai.ready()) {
      try { return await L.ai.chat([{ role: 'user', content: text }], { maxTokens: 2000, system: `Bạn là máy dịch. Dịch đoạn người dùng gửi từ ${LANGS[from].name} sang ${LANGS[to].name}. Chỉ trả về bản dịch, không giải thích, không thêm dấu ngoặc kép.` }); } catch (e) { /* rơi về dịch miễn phí */ }
    }
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text.slice(0, 480)) + '&langpair=' + LANGS[from].mm + '|' + LANGS[to].mm);
    const d = await r.json();
    if (d.responseStatus && +d.responseStatus !== 200) throw new Error(d.responseDetails || 'Dịch miễn phí tạm hết lượt – hãy nhập khóa AI.');
    return (d.responseData && d.responseData.translatedText) || '';
  };

  /* ---------- CSV / tệp ---------- */
  L.parseCSV = (text) => {
    text = text.replace(/^﻿/, ''); const first = text.split(/\r?\n/)[0] || '';
    const delim = [',', ';', '\t', '|'].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === delim) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
  };
  L.csvEsc = v => /[",\n;]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  L.download = (name, text, type = 'text/plain;charset=utf-8') => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  L.readFile = f => new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.onerror = no; fr.readAsText(f, 'utf-8'); });
})();
