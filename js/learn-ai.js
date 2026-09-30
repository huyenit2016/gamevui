// Gia sư AI 1-1: trò chuyện, sửa lỗi, nhập vai bằng Claude / OpenAI / Gemini (khóa của chính bạn). Không có khóa: bot ôn từ vựng offline.
(function () {
  const L = GV.learn, esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const LEVELS = { A1: 'Mới bắt đầu (A1)', A2: 'Sơ cấp (A2)', B1: 'Trung cấp (B1–B2)', C1: 'Nâng cao (C1)' };
  const MODES = {
    free: 'Hội thoại tự do',
    role_cafe: 'Nhập vai: gọi đồ ở quán cà phê', role_hotel: 'Nhập vai: nhận phòng khách sạn', role_interview: 'Nhập vai: phỏng vấn xin việc', role_shop: 'Nhập vai: mua sắm & trả giá', role_doctor: 'Nhập vai: đi khám bệnh',
    grammar: 'Hỏi đáp ngữ pháp', fix: 'Sửa câu / bài viết của tôi', vocab: 'Luyện từ vựng theo chủ đề'
  };
  const MODE_TXT = {
    free: 'Trò chuyện tự nhiên về đời sống hằng ngày; bắt đầu bằng lời chào và một câu hỏi làm quen.',
    role_cafe: 'Nhập vai nhân viên quán cà phê; học viên là khách. Bắt đầu bằng câu chào khách.', role_hotel: 'Nhập vai lễ tân khách sạn; học viên là khách nhận phòng. Bắt đầu bằng câu chào.',
    role_interview: 'Nhập vai nhà tuyển dụng phỏng vấn học viên cho một vị trí văn phòng. Hỏi từng câu một.', role_shop: 'Nhập vai người bán hàng ở chợ/cửa hàng; học viên mua đồ và trả giá.', role_doctor: 'Nhập vai bác sĩ hỏi bệnh; học viên mô tả triệu chứng.',
    grammar: 'Học viên sẽ hỏi về ngữ pháp/từ vựng (có thể bằng tiếng Việt). Giải thích rõ ràng bằng tiếng Việt, kèm 2–3 ví dụ bằng ngôn ngữ đích có dịch.',
    fix: 'Học viên sẽ gửi câu hoặc đoạn văn. Hãy sửa lỗi, giải thích từng lỗi bằng tiếng Việt và đưa bản đã chỉnh sửa tự nhiên hơn.',
    vocab: 'Dạy 5 từ vựng theo chủ đề học viên chọn (hỏi chủ đề trước), kèm ví dụ, rồi hỏi kiểm tra nhanh từng từ.'
  };
  const systemFor = (lang, level, mode) => {
    const N = L.LANGS[lang].name, rd = { ja: 'romaji', ko: 'romanization', zh: 'pinyin' }[lang];
    return `Bạn là gia sư ${N} kèm 1-1, thân thiện, kiên nhẫn và khích lệ. Học viên là người Việt, trình độ ${LEVELS[level]}.\nChế độ hiện tại: ${MODE_TXT[mode]}\nQuy tắc:\n- Trả lời chủ yếu bằng ${N} ở mức phù hợp trình độ (từ đơn giản, câu ngắn), tối đa 3–4 câu, và kết thúc bằng MỘT câu hỏi để học viên trả lời tiếp (trừ chế độ hỏi đáp ngữ pháp / sửa bài).\n${rd ? `- Với mọi câu ${N}, ghi thêm cách đọc (${rd}) trong ngoặc ngay sau câu.\n` : ''}- Nếu học viên viết sai, thêm một dòng "✏️ Sửa:" nêu câu đúng và giải thích ngắn gọn bằng tiếng Việt.\n- Cuối mỗi lượt thêm dòng "🌐 Dịch:" (dịch phần lời thoại của bạn sang tiếng Việt) và "💡 Từ mới:" (1–3 từ kèm nghĩa).\n- Nếu học viên nhắn bằng tiếng Việt để hỏi, hãy trả lời bằng tiếng Việt và đưa ví dụ bằng ${N}.\n- Không dùng Markdown phức tạp; có thể dùng **in đậm** cho từ khoá.`;
  };
  const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  // phần đọc to: bỏ dòng sửa/dịch/từ mới và cách đọc trong ngoặc
  const speakable = t => t.split('\n').filter(l => !/^\s*(✏️|🌐|💡)/.test(l)).join(' ').replace(/\*\*/g, '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  GV.register({
    id: 'aitutor', type: 'tool', cat: 'Học tập', name: 'Gia sư AI 1-1', icon: '🤖', desc: 'Trò chuyện, nhập vai, sửa lỗi với gia sư AI Anh · Nhật · Hàn · Trung.',
    mount(el) {
      let lang = GV.store.get('ai_lang', 'en'), level = GV.store.get('ai_level', 'A2'), mode = 'free', hist = [], busy = false, mic = null, off = null;
      el.innerHTML = `<div class="tool" style="max-width:760px">${L.ai.panelHTML()}
        <div class="row"><select class="lg">${['en', 'ja', 'ko', 'zh'].map(k => `<option value="${k}" ${k === lang ? 'selected' : ''}>${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('')}</select>
          <select class="lv">${Object.entries(LEVELS).map(([k, n]) => `<option value="${k}" ${k === level ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <select class="md">${Object.entries(MODES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></div>
        <div class="stat hint"></div>
        <div class="chat" style="background:var(--inp);border:1px solid var(--line);border-radius:14px;padding:10px;height:min(52vh,460px);overflow-y:auto;text-align:left"></div>
        <div class="row"><input class="in" placeholder="Nhập tin nhắn…" style="flex:1;min-width:150px" autocomplete="off"><button class="pbtn mic" title="Nói">🎤</button><button class="btn send">Gửi</button></div>
        <div class="row"><label><input type="checkbox" class="auto" checked> 🔊 Tự đọc câu trả lời</label><button class="pbtn nw">🔄 Cuộc trò chuyện mới</button></div></div>`;
      const chat = $(el, '.chat'), input = $(el, '.in');
      const bubble = (who, html, raw) => {
        const d = document.createElement('div'); d.style.cssText = `margin:6px 0;display:flex;${who === 'me' ? 'justify-content:flex-end' : ''}`;
        d.innerHTML = `<div style="max-width:88%;padding:8px 12px;border-radius:14px;background:${who === 'me' ? 'var(--acc)' : 'var(--card2)'};color:${who === 'me' ? '#fff' : 'var(--fg)'};font-size:15px;line-height:1.5">${html}${who === 'bot' && raw ? '<div style="margin-top:4px"><a href="#" class="sp" style="text-decoration:none">🔊 Nghe</a></div>' : ''}</div>`;
        if (raw) { const a = d.querySelector('.sp'); if (a) a.onclick = e => { e.preventDefault(); L.unlock(); L.speak(speakable(raw), lang); }; }
        chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d;
      };
      const status = () => { $(el, '.stat').textContent = L.ai.ready() ? `Đang dùng ${L.ai.cfg().provider} · ${L.ai.model()}` : 'Chưa nhập khóa AI → đang ở chế độ ôn từ vựng offline (nhập khóa ở mục Cài đặt AI để có gia sư thật).'; };
      L.ai.bindPanel(el, () => { status(); reset(); });

      /* --- chế độ offline: bot ôn từ --- */
      let q = null;
      const pool = () => L.courses.byLang(lang).flatMap(c => c.units.flatMap(u => u.items));
      function nextQ() {
        const p = pool(); const it = p[GV.rnd(p.length)], rev = Math.random() < .4; q = { it, rev };
        const t = rev ? `Từ tiếng Việt "${it.m}" trong ${L.LANGS[lang].name} là gì?` : `Từ "${it.t}"${it.r ? ' (' + it.r + ')' : ''} nghĩa là gì?`;
        bubble('bot', fmt(t), rev ? '' : it.t); if (!rev && $(el, '.auto').checked) L.speak(it.t, lang);
      }
      function offlineReply(text) {
        if (!q) return nextQ();
        const a = L.norm(text), want = L.norm(q.rev ? q.it.t : q.it.m), alt = q.rev && q.it.r ? L.norm(q.it.r) : '';
        if (/^(boqua|skip|bo qua|goiy)$/.test(a)) { bubble('bot', fmt(`Đáp án: **${q.rev ? q.it.t : q.it.m}**${q.it.r ? ' (' + q.it.r + ')' : ''}`)); return nextQ(); }
        const good = a && (a === want || a === alt || (a.length >= 3 && (want.includes(a) || a.includes(want)) && want.length >= 3));
        bubble('bot', fmt(good ? `✅ Chính xác! **${q.it.t}** ${q.it.r ? '(' + q.it.r + ') ' : ''}= ${q.it.m}` : `❌ Chưa đúng. Đáp án: **${q.rev ? q.it.t : q.it.m}**${q.it.r ? ' (' + q.it.r + ')' : ''}`), q.it.t);
        if ($(el, '.auto').checked) L.speak(q.it.t, lang); setTimeout(nextQ, 600);
      }

      /* --- AI thật --- */
      async function ask(text) {
        hist.push({ role: 'user', content: text }); busy = true; $(el, '.send').disabled = true;
        const wait = bubble('bot', '<i>Gia sư đang soạn…</i>');
        try {
          const reply = await L.ai.chat(hist.slice(-20), { system: systemFor(lang, level, mode) });
          wait.remove(); hist.push({ role: 'assistant', content: reply }); bubble('bot', fmt(reply), reply);
          if ($(el, '.auto').checked) { L.unlock(); L.speak(speakable(reply), lang); }
        } catch (e) { wait.remove(); hist.pop(); bubble('bot', `<span style="color:var(--bad)">⚠️ ${esc(e.message)}</span>`); }
        busy = false; $(el, '.send').disabled = false; input.focus();
      }
      function send(text) {
        text = (text != null ? text : input.value).trim(); if (!text || busy) return; input.value = '';
        bubble('me', esc(text)); L.ai.ready() ? ask(text) : offlineReply(text);
      }
      function reset() {
        chat.innerHTML = ''; hist = []; q = null; status();
        if (L.ai.ready()) { bubble('bot', '<i>Đang bắt đầu buổi học…</i>').remove(); ask(mode === 'fix' ? 'Xin chào! Tôi muốn bạn sửa bài viết của tôi.' : mode === 'grammar' ? 'Xin chào! Tôi muốn hỏi về ngữ pháp.' : 'Xin chào! Hãy bắt đầu buổi học.'); }
        else { bubble('bot', fmt(`Chào bạn! Mình sẽ giúp bạn ôn từ vựng ${L.LANGS[lang].name}. Trả lời nhé – gõ "bỏ qua" để xem đáp án.`)); nextQ(); }
      }
      $(el, '.lg').onchange = e => { lang = e.target.value; GV.store.set('ai_lang', lang); reset(); };
      $(el, '.lv').onchange = e => { level = e.target.value; GV.store.set('ai_level', level); reset(); };
      $(el, '.md').onchange = e => { mode = e.target.value; reset(); };
      $(el, '.send').onclick = () => send(); input.onkeydown = e => { if (e.key === 'Enter') send(); };
      $(el, '.nw').onclick = reset;
      $(el, '.mic').onclick = () => {
        L.unlock();
        if (mic) { mic.stop(); mic = null; return; }
        if (!L.hasSTT()) return bubble('bot', '<span style="color:var(--bad)">Trình duyệt này chưa hỗ trợ nhận giọng nói (hãy dùng Chrome / Safari mới).</span>');
        $(el, '.mic').textContent = '⏹'; let got = '';
        mic = L.listen(lang, { continuous: false, onText: (f, i) => { if (f) got += f; input.value = got || i; }, onEnd: () => { mic = null; $(el, '.mic').textContent = '🎤'; if (got.trim()) send(got); }, onError: m => bubble('bot', `<span style="color:var(--bad)">${esc(m)}</span>`) });
      };
      off = () => { try { mic && mic.stop(); speechSynthesis.cancel(); } catch (e) {} };
      reset();
      return off;
    }
  });
})();
