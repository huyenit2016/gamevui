// Đàm thoại song ngữ: hai người nói hai ngôn ngữ, mỗi câu được dịch ngay (gõ hoặc nói), kèm sổ tay câu giao tiếp dùng offline.
(function () {
  const L = GV.learn, esc = GV.esc, $ = (r, s) => r.querySelector(s);
  // sổ tay: [tiếng Việt, en, ja, ko, zh]
  const BOOK = {
    '👋 Chào hỏi': [['Xin chào', 'Hello', 'こんにちは', '안녕하세요', '你好'], ['Cảm ơn rất nhiều', 'Thank you very much', 'どうもありがとうございます', '정말 감사합니다', '非常感谢'], ['Xin lỗi', "I'm sorry", 'すみません', '죄송합니다', '对不起'], ['Bạn tên là gì?', "What's your name?", 'お名前は何ですか？', '이름이 뭐예요?', '你叫什么名字？']],
    '🧭 Hỏi đường': [['Nhà vệ sinh ở đâu?', 'Where is the restroom?', 'お手洗いはどこですか？', '화장실이 어디예요?', '洗手间在哪里？'], ['Làm ơn chỉ đường đến ga tàu', 'Please show me the way to the train station', '駅までの道を教えてください', '기차역으로 가는 길을 알려 주세요', '请告诉我去火车站怎么走'], ['Đi bộ có xa không?', 'Is it far to walk?', '歩いて遠いですか？', '걸어서 멀어요?', '走路远吗？'], ['Tôi bị lạc đường', "I'm lost", '道に迷いました', '길을 잃었어요', '我迷路了']],
    '🍜 Nhà hàng': [['Cho tôi xem thực đơn', 'Could I see the menu, please?', 'メニューを見せてください', '메뉴판 좀 보여 주세요', '请给我看一下菜单'], ['Tôi không ăn cay được', "I can't eat spicy food", '辛いものは食べられません', '매운 음식은 못 먹어요', '我不能吃辣'], ['Tính tiền giúp tôi', 'Check, please', 'お会計をお願いします', '계산해 주세요', '请买单'], ['Món này bao nhiêu tiền?', 'How much is this dish?', 'この料理はいくらですか？', '이 음식은 얼마예요?', '这道菜多少钱？']],
    '🛍️ Mua sắm': [['Cái này giá bao nhiêu?', 'How much is this?', 'これはいくらですか？', '이거 얼마예요?', '这个多少钱？'], ['Có giảm giá được không?', 'Can you give me a discount?', '安くなりますか？', '좀 깎아 주실 수 있어요?', '可以便宜一点吗？'], ['Tôi chỉ xem thôi', "I'm just looking", '見ているだけです', '그냥 구경하는 거예요', '我只是看看'], ['Tôi có thể trả bằng thẻ không?', 'Can I pay by card?', 'カードで払えますか？', '카드로 결제할 수 있어요?', '可以刷卡吗？']],
    '🏨 Khách sạn': [['Tôi đã đặt phòng', 'I have a reservation', '予約しています', '예약했어요', '我已经预订了房间'], ['Cho tôi mật khẩu wifi', 'Could I have the Wi-Fi password?', 'Wi-Fiのパスワードを教えてください', '와이파이 비밀번호 좀 알려 주세요', '请告诉我无线网络密码'], ['Mấy giờ trả phòng?', 'What time is check-out?', 'チェックアウトは何時ですか？', '체크아웃은 몇 시예요?', '几点退房？'], ['Điều hòa không hoạt động', "The air conditioner isn't working", 'エアコンが動きません', '에어컨이 작동하지 않아요', '空调坏了']],
    '🚑 Khẩn cấp': [['Giúp tôi với!', 'Help me!', '助けて！', '도와주세요!', '救命！'], ['Gọi cấp cứu giúp tôi', 'Please call an ambulance', '救急車を呼んでください', '구급차를 불러 주세요', '请叫救护车'], ['Tôi bị đau ở đây', 'It hurts here', 'ここが痛いです', '여기가 아파요', '这里很痛'], ['Tôi cần bác sĩ', 'I need a doctor', '医者が必要です', '의사가 필요해요', '我需要医生']]
  };
  const COL = { vi: 0, en: 1, ja: 2, ko: 3, zh: 4 };

  GV.register({
    id: 'convo', type: 'tool', cat: 'Học tập', name: 'Đàm thoại song ngữ', icon: '💬', desc: 'Trò chuyện với người nước ngoài: gõ hoặc nói, mỗi câu được dịch và đọc to ngay. Có sổ tay câu giao tiếp dùng offline.',
    mount(el) {
      const st = Object.assign({ me: 'vi', them: 'en', who: 'me', speak: true }, GV.store.get('convo', {}));
      let log = GV.store.get('convo_log', []), ctl = null, dead = false, tab = 'chat';
      const opts = () => Object.keys(L.LANGS).map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('');
      el.innerHTML = `<style>.cv2 .lgx{width:100%;height:min(46dvh,380px);overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:8px;border-radius:14px;background:var(--md-sc-high,#2b292d);box-sizing:border-box}.cv2 .bb{max-width:84%;padding:8px 12px;border-radius:16px;text-align:left;cursor:pointer;line-height:1.35}.cv2 .bb.me{align-self:flex-end;background:var(--t-p)}.cv2 .bb.th{align-self:flex-start;background:var(--md-sc-highest,#36343b)}.cv2 .bb small{display:block;opacity:.65;font-size:12px}.cv2 .bb b{display:block;font-size:1.05rem}.cv2 .zm{position:fixed;inset:0;z-index:300;background:#000d;display:grid;place-items:center;padding:20px;text-align:center;font-size:clamp(1.6rem,7vw,3rem);font-weight:700;color:#fff;cursor:pointer}.cv2 select{min-width:0;flex:1}.cv2 .pb{width:100%;text-align:left;max-height:46dvh;overflow-y:auto}.cv2 .pb h4{margin:10px 0 4px}.cv2 .ph{display:block;width:100%;text-align:left;margin:4px 0;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--md-sc-high,#2b292d);color:var(--fg);font:inherit;cursor:pointer}.cv2 .ph small{display:block;opacity:.7}.cv2 .who button.on{background:var(--t-p);border-color:var(--t-pb);color:var(--t-pt)}</style>
<div class="tool cv2" style="max-width:600px">${L.ai.panelHTML()}
<div class="row" style="flex-wrap:nowrap"><select class="me">${opts()}</select><span>⇄</span><select class="th">${opts()}</select></div>
<div class="row"><button class="btn ghost t on" data-t="chat">💬 Hội thoại</button><button class="btn ghost t" data-t="book">📒 Sổ tay câu</button><label style="font-size:13px"><input type="checkbox" class="sp"> 🔊 Đọc bản dịch</label></div>
<div class="chat" style="width:100%;display:flex;flex-direction:column;gap:8px;align-items:center"><div class="lgx" aria-live="polite"></div>
<div class="row who"><button class="btn ghost on" data-w="me"></button><button class="btn ghost" data-w="th"></button></div>
<div class="row" style="flex-wrap:nowrap;width:100%"><input class="tx" style="flex:1;min-width:0" placeholder="Nhập câu…" maxlength="300"><button class="btn mic" title="Nói" aria-label="Nói">🎤</button><button class="btn go">Gửi</button></div>
<div class="hint live" style="min-height:1.3em"></div><div class="row"><button class="btn ghost cl">🗑 Xoá hội thoại</button><button class="btn ghost ex">⬇️ Tải .txt</button></div></div>
<div class="pb" hidden></div><p class="hint eng"></p></div>`;
      const sync = () => { GV.store.set('convo', st); $(el, '.eng').textContent = L.ai.ready() ? '🤖 Đang dùng AI để dịch.' : 'Đang dùng dịch miễn phí (MyMemory). Sổ tay câu hoạt động hoàn toàn offline.'; $(el, '.me').value = st.me; $(el, '.th').value = st.them; $(el, '.sp').checked = st.speak; const w = $(el, '.who'); w.children[0].textContent = `${L.LANGS[st.me].flag} Tôi nói`; w.children[1].textContent = `${L.LANGS[st.them].flag} Họ nói`; [...w.children].forEach(b => b.classList.toggle('on', (b.dataset.w === 'me') === (st.who === 'me'))); };
      L.ai.bindPanel(el, sync); sync();
      const save = () => GV.store.set('convo_log', log.slice(-60));
      const draw = () => { const lg = $(el, '.lgx'); lg.innerHTML = log.length ? log.map((m, i) => `<div class="bb ${m.w}" data-i="${i}"><small>${L.LANGS[m.f].flag} ${esc(m.s)}</small><b>${m.d == null ? '…' : esc(m.d)}</b></div>`).join('') : '<span class="hint" style="margin:auto">Chọn ai đang nói rồi gõ hoặc bấm 🎤. Chạm vào một câu để phóng to bản dịch cho người đối diện xem.</span>'; lg.scrollTop = lg.scrollHeight; };
      draw();
      async function say(text, who, pre) {
        text = text.trim(); if (!text) return; const f = who === 'me' ? st.me : st.them, t = who === 'me' ? st.them : st.me;
        const item = { s: text, f, t, w: who === 'me' ? 'me' : 'th', d: pre == null ? null : pre }; log.push(item); draw();
        if (pre == null) { try { item.d = f === t ? text : await L.translate(text, f, t); } catch (e) { item.d = '⚠️ ' + e.message; } }
        if (dead) return; draw(); save();
        if (st.speak && item.d && !item.d.startsWith('⚠️')) L.speak(item.d, t);
      }
      const send = () => { const i = $(el, '.tx'); const v = i.value; i.value = ''; say(v, st.who); };
      $(el, '.go').onclick = send; $(el, '.tx').onkeydown = e => { if (e.key === 'Enter') send(); };
      $(el, '.me').onchange = e => { st.me = e.target.value; sync(); renderBook(); }; $(el, '.th').onchange = e => { st.them = e.target.value; sync(); renderBook(); };
      $(el, '.sp').onchange = e => { st.speak = e.target.checked; sync(); };
      $(el, '.mic').onclick = () => {
        if (ctl) { ctl.stop(); ctl = null; return; } if (!L.hasSTT()) return $(el, '.live').textContent = 'Trình duyệt này chưa hỗ trợ nhận giọng nói – hãy gõ chữ nhé.';
        const who = st.who; $(el, '.mic').textContent = '⏹'; ctl = L.listen(who === 'me' ? st.me : st.them, { continuous: false, onText: (fin, it) => { $(el, '.live').textContent = it ? '… ' + it : ''; if (fin.trim()) { $(el, '.live').textContent = ''; say(fin, who); } }, onError: m => { $(el, '.live').textContent = m; }, onEnd: () => { ctl = null; $(el, '.mic').textContent = '🎤'; } });
      };
      const renderBook = () => {
        const c = COL[st.them], pb = $(el, '.pb');
        if (st.me !== 'vi' || !c) { pb.innerHTML = '<p class="hint">Sổ tay có sẵn câu tiếng Việt ⇄ Anh·Nhật·Hàn·Trung. Hãy chọn “Tôi” là Tiếng Việt và “Họ” là ngôn ngữ khác.</p>'; return; }
        pb.innerHTML = Object.keys(BOOK).map(k => `<h4>${k}</h4>` + BOOK[k].map((p, i) => `<button class="ph" data-k="${esc(k)}" data-i="${i}">${esc(p[0])}<small>${esc(p[c])}</small></button>`).join('')).join('');
      };
      renderBook();
      el.addEventListener('click', e => {
        const b = e.target.closest('button'), bb = e.target.closest('.bb'), bg = e.target.closest('.zm');
        if (bg) { bg.remove(); return; }
        if (bb) { const m = log[+bb.dataset.i]; if (m && m.d) { const d = document.createElement('div'); d.className = 'zm'; d.textContent = m.d; el.querySelector('.cv2').appendChild(d); } return; }
        if (!b) return;
        if (b.dataset.w) { st.who = b.dataset.w; sync(); }
        else if (b.dataset.t) { tab = b.dataset.t; el.querySelectorAll('.t').forEach(x => x.classList.toggle('on', x === b)); $(el, '.chat').hidden = tab !== 'chat'; $(el, '.pb').hidden = tab !== 'book'; }
        else if (b.classList.contains('ph')) { const p = BOOK[b.dataset.k][+b.dataset.i], c = COL[st.them]; st.who = 'me'; sync(); say(p[0], 'me', p[c]); if (st.speak === false) L.speak(p[c], st.them); $(el, '.t[data-t=chat]').click(); }
        else if (b.classList.contains('cl')) { log = []; save(); draw(); }
        else if (b.classList.contains('ex')) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([log.map(m => `${L.LANGS[m.f].name}: ${m.s}\n→ ${m.d}`).join('\n\n')], { type: 'text/plain;charset=utf-8' })); a.download = 'doan-thoai.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
      });
      return () => { dead = true; if (ctl) ctl.stop(); };
    }
  });
})();
