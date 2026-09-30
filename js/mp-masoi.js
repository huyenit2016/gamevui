// Ma sói online (5–12 người, có bot). Chủ phòng là quản trò tự động: chia vai, điều phối đêm/ngày/bỏ phiếu.
(function () {
  const RN = { wolf: 'Ma sói', villager: 'Dân làng', seer: 'Tiên tri', guard: 'Bảo vệ', hunter: 'Thợ săn', witch: 'Phù thủy' };
  const RI = { wolf: '🐺', villager: '🧑‍🌾', seer: '🔮', guard: '🛡️', hunter: '🏹', witch: '🧙‍♀️' };
  const T = { step: 30000, hunter: 30000, day: 90000, vote: 45000, dummy: 4000 };
  const log = (S, t) => { S.log.push(t); if (S.log.length > 40) S.log.shift(); };
  const alive = S => S.order.filter(i => S.alive[i]);
  const rolesOf = (n, api) => {
    const w = n <= 5 ? 1 : n <= 8 ? 2 : n <= 11 ? 3 : 4, r = Array(w).fill('wolf');
    r.push('seer', 'guard'); if (n >= 7) r.push('hunter'); if (n >= 8) r.push('witch');
    while (r.length < n) r.push('villager'); return api.shuffle(r);
  };
  const STEPS = ['guard', 'wolves', 'seer', 'witch'];
  const stepRole = { guard: 'guard', seer: 'seer', witch: 'witch' };
  const hasRole = (S, role) => alive(S).some(i => S.roles[i] === role);

  function startStep(S, step, now) {
    S.phase = 'night'; S.step = step; S.acted = {};
    const need = step === 'wolves' ? true : hasRole(S, stepRole[step]);
    S.dummy = !need; S.deadline = now + (need ? T.step : T.dummy);
  }
  function nextStep(S, now) {
    const i = STEPS.indexOf(S.step);
    if (i + 1 < STEPS.length) startStep(S, STEPS[i + 1], now); else dawn(S, now);
  }
  function resolveWolves(S, api) {
    const cnt = {}; Object.values(S.wolfVotes).forEach(t => cnt[t] = (cnt[t] || 0) + 1);
    const mx = Math.max(0, ...Object.values(cnt)); const top = Object.keys(cnt).filter(k => cnt[k] === mx);
    S.victim = top.length ? top[api.rnd(top.length)] : null;
  }
  function kill(S, id, why) { if (!S.alive[id]) return; S.alive[id] = false; S.deadList.push({ id, role: S.roles[id] }); log(S, `💀 ${S.names[id]} ${why} – là ${RN[S.roles[id]]}.`); }
  function checkWin(S) {
    const w = alive(S).filter(i => S.roles[i] === 'wolf').length, o = alive(S).length - w;
    if (w === 0) S.over = { winner: 'village' }; else if (w >= o) S.over = { winner: 'wolf' };
    if (S.over) { S.over.roles = S.roles; S.phase = 'end'; S.deadline = null; log(S, S.over.winner === 'village' ? '🎉 Dân làng thắng!' : '🐺 Ma sói thắng!'); return true; }
    return false;
  }
  function dawn(S, now) {
    const died = [];
    if (S.victim && S.guardPick !== S.victim && !S.saved) died.push(S.victim);
    if (S.poisoned && !died.includes(S.poisoned)) died.push(S.poisoned);
    S.guardLast = S.guardPick || null;
    log(S, `☀️ Trời sáng (ngày ${S.day}).`);
    if (!died.length) log(S, 'Đêm qua không ai chết.');
    died.forEach(id => kill(S, id, 'đã chết trong đêm'));
    S.victim = S.poisoned = S.guardPick = null; S.saved = false; S.wolfVotes = {};
    const hunter = died.find(id => S.roles[id] === 'hunter');
    if (checkWin(S)) return;
    if (hunter) { S.phase = 'hunter'; S.hunter = { id: hunter, next: 'day' }; S.deadline = now + T.hunter; return; }
    startDay(S, now);
  }
  function startDay(S, now) { S.phase = 'day'; S.ready = {}; S.deadline = now + T.day; }
  function startNight(S, now) { S.day++; S.votes = {}; startStep(S, 'guard', now); log(S, `🌙 Đêm ${S.day} buông xuống…`); }
  function tally(S, api, now) {
    const cnt = {}; Object.values(S.votes).forEach(t => { if (t) cnt[t] = (cnt[t] || 0) + 1; });
    const mx = Math.max(0, ...Object.values(cnt)), top = Object.keys(cnt).filter(k => cnt[k] === mx);
    let hunter = null;
    if (mx > 0 && top.length === 1) { const id = top[0]; log(S, `⚖️ Dân làng treo cổ ${S.names[id]} (${mx} phiếu).`); kill(S, id, 'bị treo cổ'); if (S.roles[id] === 'hunter') hunter = id; }
    else log(S, '⚖️ Không đạt đa số – không ai bị treo cổ.');
    if (checkWin(S)) return;
    if (hunter) { S.phase = 'hunter'; S.hunter = { id: hunter, next: 'night' }; S.deadline = now + T.hunter; return; }
    startNight(S, now);
  }
  function afterHunter(S, now) { const nx = S.hunter.next; S.hunter = null; if (checkWin(S)) return; nx === 'day' ? startDay(S, now) : startNight(S, now); }

  GV.mp.define({
    id: 'masoi', name: 'Ma sói online', icon: '🐺', desc: 'Trò chơi suy luận: sói cắn đêm, dân làng bỏ phiếu ban ngày. 5–12 người (có bot).', min: 5, max: 12,
    css: `.ms .role{font-size:1.4rem;font-weight:800;text-align:center}.ms .tgt{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}
      .ms .night{background:#0b1030;color:#cfd6ff;border-radius:12px;padding:10px;text-align:center}.ms .day{background:#fff6d6;color:#3a2f00;border-radius:12px;padding:10px;text-align:center}
      .ms .dead{text-decoration:line-through;opacity:.6}.ms .votes{font-size:12px;color:var(--mut)}`,
    init(seats, api) {
      const now = Date.now(), roles = rolesOf(seats.length, api);
      const S = { order: seats.map(s => s.id), names: Object.fromEntries(seats.map(s => [s.id, s.name])), roles: {}, alive: {}, deadList: [], day: 1, log: [], over: null, phase: 'night', step: 'guard',
        wolfVotes: {}, victim: null, saved: false, poisoned: null, guardPick: null, guardLast: null, witch: { heal: 1, poison: 1 }, seerLog: {}, votes: {}, ready: {}, acted: {}, hunter: null };
      S.order.forEach((id, i) => { S.roles[id] = roles[i]; S.alive[id] = true; });
      log(S, `🌙 Đêm 1 buông xuống… Có ${roles.filter(r => r === 'wolf').length} ma sói trong làng.`);
      startStep(S, 'guard', now); return S;
    },
    reduce(S, id, a, api) {
      if (S.over) return 'Ván đã kết thúc.';
      if (!S.alive[id]) return 'Bạn đã chết.';
      const now = Date.now(), role = S.roles[id], ok = t => t && S.alive[t];
      if (S.phase === 'night') {
        if (S.acted[id]) return 'Bạn đã hành động rồi.';
        if (S.step === 'guard' && role === 'guard' && a.t === 'guard') {
          if (a.target && !ok(a.target)) return 'Mục tiêu không hợp lệ.'; if (a.target && a.target === S.guardLast) return 'Không được bảo vệ cùng một người 2 đêm liền.';
          S.guardPick = a.target || null; S.acted[id] = 1; nextStep(S, now); return;
        }
        if (S.step === 'wolves' && role === 'wolf' && a.t === 'wolf') {
          if (!ok(a.target) || S.roles[a.target] === 'wolf') return 'Hãy chọn một người (không phải sói).';
          S.wolfVotes[id] = a.target; S.acted[id] = 1;
          if (alive(S).filter(i => S.roles[i] === 'wolf').every(i => S.wolfVotes[i])) { resolveWolves(S, api); nextStep(S, now); }
          return;
        }
        if (S.step === 'seer' && role === 'seer' && a.t === 'seer') {
          if (!ok(a.target) || a.target === id) return 'Hãy chọn người khác còn sống.';
          (S.seerLog[id] = S.seerLog[id] || []).push({ target: a.target, wolf: S.roles[a.target] === 'wolf' }); S.acted[id] = 1; S.seerShown = now; S.deadline = Math.min(S.deadline, now + 5000); return;
        }
        if (S.step === 'witch' && role === 'witch' && a.t === 'witch') {
          if (a.heal) { if (!S.witch.heal || !S.victim) return 'Không thể cứu.'; S.saved = true; S.witch.heal = 0; }
          if (a.poison) { if (!S.witch.poison || !ok(a.poison) || a.poison === id) return 'Không thể dùng thuốc độc.'; S.poisoned = a.poison; S.witch.poison = 0; }
          S.acted[id] = 1; nextStep(S, now); return;
        }
        return 'Chưa phải lượt của bạn.';
      }
      if (S.phase === 'day') {
        if (a.t === 'ready') { S.ready[id] = 1; return; }
        return 'Đang thảo luận ban ngày.';
      }
      if (S.phase === 'vote') {
        if (a.t !== 'vote') return;
        if (a.target && (!ok(a.target) || a.target === id)) return 'Phiếu không hợp lệ.';
        S.votes[id] = a.target || 'skip'; if (S.votes[id] === 'skip') S.votes[id] = null; S.voted = S.voted || {}; S.voted[id] = 1; return;
      }
      if (S.phase === 'hunter') {
        if (S.hunter && S.hunter.id === id && a.t === 'shoot') {
          if (a.target) { if (!ok(a.target) || a.target === id) return 'Mục tiêu không hợp lệ.'; kill(S, a.target, 'bị thợ săn bắn'); }
          afterHunter(S, now); return;
        }
        return 'Đang chờ thợ săn.';
      }
    },
    tick(S, now, api) {
      if (S.over || !S.deadline) return false;
      let ch = false;
      if (S.phase === 'day' && alive(S).length && alive(S).every(i => S.ready[i])) { S.phase = 'vote'; S.votes = {}; S.voted = {}; S.deadline = now + T.vote; log(S, '🗳️ Bắt đầu bỏ phiếu!'); return true; }
      if (S.phase === 'vote' && alive(S).every(i => S.voted && S.voted[i])) { tally(S, api, now); return true; }
      if (now < S.deadline) return false;
      if (S.phase === 'night') {
        if (S.step === 'wolves') resolveWolves(S, api);
        nextStep(S, now); ch = true;
      } else if (S.phase === 'day') { S.phase = 'vote'; S.votes = {}; S.voted = {}; S.deadline = now + T.vote; log(S, '🗳️ Hết giờ thảo luận – bỏ phiếu!'); ch = true; }
      else if (S.phase === 'vote') { tally(S, api, now); ch = true; }
      else if (S.phase === 'hunter') { afterHunter(S, now); ch = true; }
      return ch;
    },
    bot(S, id, api) {
      if (S.over || !S.alive[id]) return null;
      const role = S.roles[id], al = alive(S), others = al.filter(i => i !== id), pick = a => a[api.rnd(a.length)];
      if (S.phase === 'night') {
        if (S.acted[id]) return null;
        if (S.step === 'guard' && role === 'guard') return { t: 'guard', target: pick(al.filter(i => i !== S.guardLast)) };
        if (S.step === 'wolves' && role === 'wolf') return { t: 'wolf', target: pick(al.filter(i => S.roles[i] !== 'wolf')) };
        if (S.step === 'seer' && role === 'seer') { const seen = (S.seerLog[id] || []).map(x => x.target); const c = others.filter(i => !seen.includes(i)); return c.length ? { t: 'seer', target: pick(c) } : null; }
        if (S.step === 'witch' && role === 'witch') return { t: 'witch', heal: !!(S.victim && S.witch.heal && Math.random() < .6), poison: S.witch.poison && Math.random() < .15 ? pick(others) : null };
        return null;
      }
      if (S.phase === 'day') return S.ready[id] ? null : { t: 'ready' };
      if (S.phase === 'vote') {
        if (S.voted && S.voted[id]) return null;
        let c = others; if (role === 'wolf') c = others.filter(i => S.roles[i] !== 'wolf');
        if (role === 'seer') { const w = (S.seerLog[id] || []).find(x => x.wolf && S.alive[x.target]); if (w) return { t: 'vote', target: w.target }; }
        return { t: 'vote', target: pick(c) };
      }
      if (S.phase === 'hunter' && S.hunter && S.hunter.id === id) return { t: 'shoot', target: pick(others) };
      return null;
    },
    pub(S) {
      const over = S.over;
      return { phase: S.phase, day: S.day, deadline: S.deadline, order: S.order, names: S.names, alive: S.alive, dead: S.deadList, log: S.log.slice(-14),
        votes: S.phase === 'vote' ? S.votes : null, voted: S.voted || null, ready: S.phase === 'day' ? Object.keys(S.ready).length : 0, over, turn: null };
    },
    priv(S, id) {
      const role = S.roles[id], p = { role, alive: !!S.alive[id], act: null };
      if (role === 'wolf') p.allies = S.order.filter(i => S.roles[i] === 'wolf' && i !== id);
      if (role === 'seer') p.seer = S.seerLog[id] || [];
      if (S.alive[id] && !S.over) {
        if (S.phase === 'night' && !S.acted[id]) {
          if (S.step === 'guard' && role === 'guard') { p.act = 'guard'; p.last = S.guardLast; }
          if (S.step === 'wolves' && role === 'wolf') { p.act = 'wolf'; p.picks = S.wolfVotes; }
          if (S.step === 'seer' && role === 'seer') p.act = 'seer';
          if (S.step === 'witch' && role === 'witch') { p.act = 'witch'; p.victim = S.witch.heal ? S.victim : null; p.potions = S.witch; }
        }
        if (S.phase === 'day' && !S.ready[id]) p.act = 'ready';
        if (S.phase === 'vote' && !(S.voted && S.voted[id])) p.act = 'vote';
        if (S.phase === 'hunter' && S.hunter && S.hunter.id === id) p.act = 'shoot';
      }
      return p;
    },
    render(box, c) {
      const p = c.pub, me = c.priv, n = c.names, al = p.order.filter(i => p.alive[i]), night = p.phase === 'night';
      const nm = i => GV.esc(n[i] || p.names[i] || '?');
      const targets = (list, cls = 'pbtn') => `<div class="tgt">${list.map(i => `<button class="${cls}" data-t="${i}">${nm(i)}</button>`).join('')}</div>`;
      const role = me.role ? `<div class="role">${RI[me.role]} Bạn là <b>${RN[me.role]}</b>${me.alive === false ? ' (đã chết 💀)' : ''}</div>` : '';
      const ally = me.allies && me.allies.length ? `<div class="hint" style="text-align:center">Đồng bọn: ${me.allies.map(nm).join(', ')}</div>` : '';
      let action = '';
      switch (me.act) {
        case 'guard': action = `<b>Bảo vệ ai đêm nay?</b>${me.last ? `<div class="hint">(Không chọn lại ${nm(me.last)})</div>` : ''}${targets(al.filter(i => i !== me.last))}<button class="pbtn" data-a="guard-none">Không bảo vệ ai</button>`; break;
        case 'wolf': action = `<b>Cắn ai đêm nay?</b>${targets(al.filter(i => !(me.allies || []).includes(i) && i !== c.me))}${Object.keys(me.picks || {}).length ? `<div class="hint">Sói đã chọn: ${Object.entries(me.picks).map(([k, v]) => nm(k) + ' → ' + nm(v)).join(', ')}</div>` : ''}`; break;
        case 'seer': action = `<b>Soi ai đêm nay?</b>${targets(al.filter(i => i !== c.me))}`; break;
        case 'witch': action = `<b>Phù thủy</b><div>${me.victim ? `Đêm nay <b>${nm(me.victim)}</b> bị sói cắn.` : 'Không có nạn nhân / đã hết thuốc cứu.'}</div><div class="row">${me.victim ? '<button class="pbtn" data-a="heal">💊 Cứu</button>' : ''}<button class="pbtn" data-a="witch-skip">Bỏ qua</button></div>${me.potions && me.potions.poison ? `<div class="hint">Hoặc đầu độc:</div>${targets(al.filter(i => i !== c.me))}` : ''}`; break;
        case 'ready': action = '<button class="pbtn sel" data-a="ready">✅ Tôi đã thảo luận xong – sẵn sàng bỏ phiếu</button>'; break;
        case 'vote': action = `<b>Bỏ phiếu treo cổ ai?</b>${targets(al.filter(i => i !== c.me))}<button class="pbtn" data-a="vote-skip">Không bỏ phiếu ai</button>`; break;
        case 'shoot': action = `<b>Thợ săn! Bắn ai trước khi chết?</b>${targets(al.filter(i => i !== c.me))}<button class="pbtn" data-a="shoot-none">Không bắn</button>`; break;
      }
      let banner;
      if (p.over) banner = `<div class="${p.over.winner === 'village' ? 'day' : 'night'}"><b>${p.over.winner === 'village' ? '🎉 DÂN LÀNG THẮNG!' : '🐺 MA SÓI THẮNG!'}</b></div>`;
      else if (night) banner = `<div class="night">🌙 <b>Đêm ${p.day}</b> – mọi người nhắm mắt${p.deadline ? ` · <span data-dl="${p.deadline}"></span>` : ''}</div>`;
      else banner = `<div class="day">${p.phase === 'day' ? '☀️ Thảo luận' : p.phase === 'vote' ? '🗳️ Bỏ phiếu' : '🏹 Thợ săn hành động'} · ngày ${p.day}${p.deadline ? ` · <span data-dl="${p.deadline}"></span>` : ''}${p.phase === 'day' ? ` · sẵn sàng: ${p.ready}/${al.length}` : ''}</div>`;
      const votes = p.votes ? `<div class="votes">${Object.entries(p.votes).filter(([, v]) => v).map(([k, v]) => nm(k) + '→' + nm(v)).join(' · ') || 'Chưa có phiếu nào'}</div>` : '';
      const deadInfo = p.dead.map(d => `<span class="seat dead">${nm(d.id)} (${RN[d.role]})</span>`).join(' ');
      box.innerHTML = `<div class="ms">${banner}${role}${ally}
        <div class="row" style="margin:6px 0">${al.map(i => `<span class="seat">${nm(i)}</span>`).join(' ')}</div>
        ${deadInfo ? `<div class="row">${deadInfo}</div>` : ''}
        ${me.act ? `<div class="box" style="margin:8px 0;text-align:center">${action}</div>` : (!p.over && me.alive !== false && night ? '<div class="hint" style="text-align:center">😴 Hãy nhắm mắt chờ trời sáng…</div>' : '')}
        ${me.seer && me.seer.length ? `<div class="box">🔮 Kết quả soi: ${me.seer.map(x => nm(x.target) + (x.wolf ? ' = 🐺 SÓI' : ' = không phải sói')).join(' · ')}</div>` : ''}
        ${votes}
        ${p.over ? `<div class="box">Vai trò: ${p.order.map(i => nm(i) + ' ' + RI[p.over.roles[i]] + RN[p.over.roles[i]]).join(' · ')}</div>` : ''}
        <div class="lgbox">${p.log.slice().reverse().map(l => GV.esc(l)).join('<br>')}</div></div>`;
      box.onclick = e => {
        const t = e.target.closest('[data-t]'), a = e.target.closest('[data-a]');
        const act = me.act; if (!act) return;
        if (t) { const id = t.dataset.t; return c.send(act === 'witch' ? { t: 'witch', poison: id } : { t: act === 'guard' ? 'guard' : act, target: id }); }
        if (!a) return;
        const k = a.dataset.a;
        if (k === 'guard-none') c.send({ t: 'guard', target: null });
        else if (k === 'heal') c.send({ t: 'witch', heal: true });
        else if (k === 'witch-skip') c.send({ t: 'witch' });
        else if (k === 'ready') c.send({ t: 'ready' });
        else if (k === 'vote-skip') c.send({ t: 'vote', target: null });
        else if (k === 'shoot-none') c.send({ t: 'shoot', target: null });
      };
    }
  });
})();
