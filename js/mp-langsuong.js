// Ma Sói · Lời Nguyền Làng Sương – bản online nhiều người (5–16 người, có bot), chạy trên khung phòng GV.mp (Firebase).
// Chủ phòng là quản trò tự động. Pha: nhận vai → đêm (bảo vệ → sói → tiên tri → phù thủy) → bình minh → hội đồng → bỏ phiếu → phán quyết (→ thợ săn).
(function () {
  const ROLES = {
    villager: { n: 'Dân làng', team: 'village', i: '🧑‍🌾', d: 'Không có năng lực ban đêm. Lắng nghe, suy luận và bỏ phiếu để tìm ra hết Ma Sói.' },
    wolf: { n: 'Ma Sói', team: 'wolf', i: '🐺', d: 'Biết đồng bọn. Mỗi đêm cả đàn chọn một người để cắn. Ban ngày che giấu thân phận, dẫn dắt cuộc bỏ phiếu.' },
    seer: { n: 'Tiên tri', team: 'village', i: '🔮', d: 'Mỗi đêm soi một người còn sống, biết người đó có phải Sói không. Chỉ mình bạn biết kết quả.' },
    guard: { n: 'Bảo vệ', team: 'village', i: '🛡️', d: 'Mỗi đêm che chở một người (kể cả bản thân) khỏi vết cắn của Sói. Không chặn được thuốc độc hay phát bắn.' },
    witch: { n: 'Phù thủy', team: 'village', i: '🧪', d: 'Có 1 thuốc cứu và 1 thuốc độc cho cả ván, biết ai bị Sói cắn. Mỗi đêm dùng tối đa một thuốc.' },
    hunter: { n: 'Thợ săn', team: 'village', i: '🏹', d: 'Khi chết vì Sói cắn hoặc bị treo cổ, được bắn mang theo một người. Chết vì thuốc độc thì không bắn được.' }
  };
  const JOBS = ['Người giữ rừng', 'Thợ làm bánh', 'Người bán hoa', 'Thợ rèn', 'Người hái thuốc', 'Người chăn cừu', 'Thợ may', 'Người đưa thư', 'Chủ quán trọ', 'Người làm vườn', 'Thợ mộc', 'Người gác cầu', 'Người chèo đò', 'Thầy đồ', 'Người kéo chuông', 'Bà mụ'];
  const VILLAGES = [
    ['Làng Sương', 'Đừng tin mọi lời thì thầm.', 'Sương dâng kín cây cầu đá. Trong quán trọ, một chiếc ghế còn ấm nhưng người ngồi đã biến mất. Chuông làng gọi mọi người về quảng trường.'],
    ['Thung Lũng Trăng', 'Dưới cùng một vầng trăng, ai đang giấu nanh?', 'Đã ba đêm đàn cừu không chịu về chuồng. Trên cửa đình hằn vết móng vuốt. Già làng khoá cổng trước khi mặt trời lặn.'],
    ['Bến Tro Tàn', 'Tro đã nguội. Bí mật thì chưa.', 'Cối xay cũ đứng im từ mùa đông. Có người thấy bóng đen sau khung cửa. Dân làng quây quanh đống lửa, đếm lại từng gương mặt quen.'],
    ['Đồi Chuông', 'Chuông ngân một tiếng, làng vắng một người.', 'Người giữ tháp nhặt được chiếc áo rách ở bìa rừng, không ai nhận là của mình. Chuông chiều vang lên, mọi cánh cửa đều đóng.'],
    ['Hồ Tĩnh Lặng', 'Mặt hồ không kể hết những gì nó thấy.', 'Một con thuyền không người trôi dạt vào bờ lúc rạng sáng. Trên mạn thuyền là dấu tay ướt. Cả làng im lặng nhìn nhau.']
  ];
  const T = { role: 15000, step: 30000, dummy: 3500, dawn: 7000, day: 120000, vote: 60000, verdict: 6000, hunter: 25000 };
  const STEPS = ['guard', 'wolves', 'seer', 'witch'], STEP_ROLE = { guard: 'guard', seer: 'seer', witch: 'witch' };
  const log = (S, t) => { S.log.push(t); if (S.log.length > 60) S.log.shift(); };
  const alive = S => S.order.filter(i => S.alive[i]);
  const has = (S, r) => alive(S).some(i => S.roles[i] === r);
  const SPECIAL = ['wolf', 'seer', 'guard', 'witch', 'hunter'];
  function autoCfg(n) { return { wolf: n <= 6 ? 1 : n <= 9 ? 2 : n <= 12 ? 3 : 4, seer: 1, guard: 1, hunter: n >= 6 ? 1 : 0, witch: n >= 7 ? 1 : 0 }; }
  // cấu hình chủ phòng: chuỗi JSON {wolf,seer,guard,witch,hunter}; Dân làng = phần còn lại. Không hợp lệ → null
  function parseCfg(raw, n) {
    let c = null; try { c = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return null; }
    if (!c || typeof c !== 'object') return null;
    const o = {}; SPECIAL.forEach(k => { o[k] = Math.max(0, Math.min(k === 'wolf' ? 6 : 1, Math.floor(+c[k] || 0))); });
    const sp = SPECIAL.reduce((t, k) => t + o[k], 0);
    if (o.wolf < 1 || sp > n || o.wolf * 2 >= n) return null; o.villager = n - sp; return o;
  }
  function cfgError(raw, n) {
    if (!raw || raw === 'auto') return '';
    const c = parseCfg(raw, n); if (c) return '';
    let o = {}; try { o = JSON.parse(raw); } catch (e) {}
    const w = +o.wolf || 0, sp = SPECIAL.reduce((t, k) => t + (+o[k] || 0), 0);
    return w < 1 ? 'Cần ít nhất 1 Ma Sói.' : w * 2 >= n ? 'Số Ma Sói phải ít hơn một nửa số người.' : sp > n ? 'Số vai đặc biệt nhiều hơn số người.' : 'Cấu hình chưa hợp lệ.';
  }
  function rolesFor(n, api, raw) {
    const c = (raw && raw !== 'auto' && parseCfg(raw, n)) || Object.assign(autoCfg(n), {}), r = [];
    SPECIAL.forEach(k => { for (let i = 0; i < c[k]; i++) r.push(k); });
    while (r.length < n) r.push('villager'); return api.shuffle(r.slice(0, n));
  }

  /* ---------- luật ---------- */
  function startStep(S, step, now) {
    S.phase = 'night'; S.step = step; S.acted = {};
    const need = step === 'wolves' || has(S, STEP_ROLE[step]);
    S.deadline = now + (need ? T.step : T.dummy); // vẫn chờ một chút khi vai đã chết để không lộ ai còn sống
  }
  function nextStep(S, now) { const i = STEPS.indexOf(S.step); i + 1 < STEPS.length ? startStep(S, STEPS[i + 1], now) : dawn(S, now); }
  function resolveWolves(S, api) {
    const c = {}; Object.values(S.wolfVotes).forEach(t => { c[t] = (c[t] || 0) + 1; });
    const mx = Math.max(0, ...Object.values(c)), top = Object.keys(c).filter(k => c[k] === mx);
    S.victim = top.length ? top[api.rnd(top.length)] : null;
  }
  function kill(S, id, how) { if (!S.alive[id]) return false; S.alive[id] = false; S.dead.push({ id, role: S.roles[id], how, day: S.day }); return true; }
  function checkWin(S) {
    const w = alive(S).filter(i => S.roles[i] === 'wolf').length, o = alive(S).length - w;
    if (w === 0) S.over = { winner: 'village' }; else if (w >= o) S.over = { winner: 'wolf' };
    if (!S.over) return false;
    S.over.roles = S.roles; S.phase = 'end'; S.deadline = null;
    log(S, S.over.winner === 'village' ? '🔥 Ngọn lửa làng vẫn cháy – Dân làng chiến thắng!' : '🌑 Màn sương nuốt trọn ngôi làng – Ma Sói chiến thắng!'); return true;
  }
  function dawn(S, now) {
    const died = [];
    if (S.victim && S.guardPick !== S.victim && !S.saved) died.push([S.victim, 'bite']);
    if (S.poisoned && !died.some(d => d[0] === S.poisoned)) died.push([S.poisoned, 'poison']);
    died.forEach(([id, how]) => kill(S, id, how));
    S.news = died.map(([id, how]) => ({ id, role: S.roles[id], how }));
    log(S, `☀️ Bình minh ngày ${S.day}: ` + (died.length ? died.map(([id]) => S.names[id] + ' (' + ROLES[S.roles[id]].n + ')').join(', ') + ' đã không qua khỏi đêm qua.' : 'không ai chết, sương tan dần.'));
    const h = died.find(([id, how]) => S.roles[id] === 'hunter' && how !== 'poison');
    S.victim = S.poisoned = S.guardPick = null; S.saved = false; S.wolfVotes = {};
    S.phase = 'dawn'; S.deadline = now + T.dawn; S.after = h ? { hunter: h[0], next: 'day' } : { next: 'day' };
  }
  function afterDawn(S, now) {
    if (checkWin(S)) return;
    const a = S.after || {}; S.after = null;
    if (a.hunter) { S.phase = 'hunter'; S.hunter = { id: a.hunter, next: a.next }; S.deadline = now + T.hunter; return; }
    a.next === 'night' ? startNight(S, now) : startDay(S, now);
  }
  function startDay(S, now) { S.phase = 'day'; S.ready = {}; S.deadline = now + T.day; log(S, `🏛️ Hội đồng làng ngày ${S.day} bắt đầu.`); }
  function startVote(S, now) { S.phase = 'vote'; S.votes = {}; S.voted = {}; S.deadline = now + T.vote; log(S, '🗳️ Bỏ phiếu treo cổ.'); }
  function startNight(S, now) { S.day++; S.votes = {}; S.voted = {}; log(S, `🌙 Đêm ${S.day} buông xuống.`); startStep(S, 'guard', now); }
  function tally(S, now) {
    const c = {}; Object.values(S.votes).forEach(t => { if (t) c[t] = (c[t] || 0) + 1; });
    const mx = Math.max(0, ...Object.values(c)), top = Object.keys(c).filter(k => c[k] === mx);
    let hunter = null;
    if (mx > 0 && top.length === 1) {
      const id = top[0]; kill(S, id, 'hang'); S.verdict = { id, n: mx, role: S.roles[id] };
      log(S, `⚖️ Làng treo cổ ${S.names[id]} với ${mx} phiếu – là ${ROLES[S.roles[id]].n}.`); if (S.roles[id] === 'hunter') hunter = id;
    } else { S.verdict = { id: null, tie: top.length > 1 }; log(S, top.length > 1 ? '⚖️ Phiếu hoà – không ai bị treo cổ.' : '⚖️ Không ai nhận phiếu – làng tha cho mọi người.'); }
    S.phase = 'verdict'; S.deadline = now + T.verdict; S.after = hunter ? { hunter, next: 'night' } : { next: 'night' };
  }

  /* ---------- bot ---------- */
  function bot(S, id, api) {
    if (S.over) return null;
    const pick = a => a.length ? a[api.rnd(a.length)] : null;
    if (S.phase === 'role') return S.seen[id] ? null : { t: 'seen' };
    if (S.phase === 'hunter' && S.hunter && S.hunter.id === id) return { t: 'shoot', target: pick(alive(S).filter(i => i !== id && (S.roles[id] !== 'wolf'))) };
    if (!S.alive[id]) return null;
    const role = S.roles[id], al = alive(S), others = al.filter(i => i !== id);
    if (S.phase === 'night') {
      if (S.acted[id]) return null;
      if (S.step === 'guard' && role === 'guard') return { t: 'guard', target: pick(S.rules.norep ? al.filter(i => i !== S.lastGuard) : al) };
      if (S.step === 'wolves' && role === 'wolf') return { t: 'bite', target: pick(al.filter(i => S.roles[i] !== 'wolf')) };
      if (S.step === 'seer' && role === 'seer') { const seen = (S.seerLog[id] || []).map(x => x.target); const t = pick(others.filter(i => !seen.includes(i))); return t ? { t: 'peek', target: t } : null; }
      if (S.step === 'witch' && role === 'witch') {
        if (S.victim && S.witch.heal && (S.rules.selfsave || S.victim !== id) && Math.random() < .55) return { t: 'witch', heal: true };
        if (S.witch.poison && Math.random() < .12) return { t: 'witch', poison: pick(others) };
        return { t: 'witch' };
      }
      return null;
    }
    if (S.phase === 'day') return S.ready[id] ? null : { t: 'ready' };
    if (S.phase === 'vote') {
      if (S.voted[id]) return null;
      if (role === 'seer') { const w = (S.seerLog[id] || []).find(x => x.wolf && S.alive[x.target]); if (w) return { t: 'vote', target: w.target }; }
      // bot nghiêng theo đa số đang có để ván không quá loạn
      const c = {}; Object.values(S.votes).forEach(t => { if (t && t !== id) c[t] = (c[t] || 0) + 1; });
      const lead = Object.keys(c).sort((a, b) => c[b] - c[a])[0];
      let pool = role === 'wolf' ? others.filter(i => S.roles[i] !== 'wolf') : others;
      if (lead && pool.includes(lead) && Math.random() < .6) return { t: 'vote', target: lead };
      return { t: 'vote', target: pick(pool) };
    }
    return null;
  }

  const face = GV.mpShell.face;

  const CSS = `
.ls{--bg:#0b141b;--pn:#111e27;--pn2:#162630;--ln:#ffffff14;--tx:#e6e8e4;--mu:#98a8ae;--gd:#dfbc7a;--gd2:#9e7944;--te:#88c8b7;--rd:#ec9290;--sf:Georgia,'Times New Roman',serif;
  background:radial-gradient(120% 80% at 50% 0,#14252e,var(--bg));color:var(--tx);border-radius:18px;padding:14px;text-align:left;border:1px solid var(--ln)}
.ls .lsh{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ls .lsk{font:700 .68rem/1.4 system-ui;letter-spacing:.18em;color:var(--gd);text-transform:uppercase}
.ls h3{font:400 1.55rem/1.15 var(--sf);margin:2px 0 2px;color:#f1ece2}.ls .lsq{font:italic 1rem var(--sf);color:var(--mu);margin:0}
.ls .lsc{display:flex;gap:14px;text-align:center}.ls .lsc b{display:block;font:400 1.5rem var(--sf);color:var(--te)}.ls .lsc .d b{color:var(--rd)}.ls .lsc small{font-size:.7rem;color:var(--mu)}
.ls .lsst{display:grid;grid-template-columns:repeat(5,1fr);margin:12px 0;border:1px solid var(--ln);border-radius:12px;overflow:hidden;background:#0d1820}
.ls .lsst span{padding:7px 4px;font-size:.72rem;color:var(--mu);text-align:center;border-right:1px solid var(--ln)}.ls .lsst span:last-child{border:0}.ls .lsst span.on{color:var(--gd);background:#dfbc7a1a;font-weight:700}
.ls .lstb{display:flex;gap:4px;border-bottom:1px solid var(--ln);margin-bottom:10px;overflow-x:auto}.ls .lstb button{background:none;border:0;color:var(--mu);padding:8px 10px;font:600 .85rem system-ui;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap}.ls .lstb button.on{color:var(--gd);border-color:var(--gd)}
.ls .lsscene{background:linear-gradient(#162630cc,#0f1b22ee);border:1px solid var(--ln);border-radius:16px;padding:14px;text-align:center;position:relative;overflow:hidden}
.ls .lsscene.night{background:linear-gradient(#0b1424,#0a1018);}.ls .lsscene .em{font-size:2rem;animation:lsfl 2.4s ease-in-out infinite}@keyframes lsfl{50%{transform:translateY(-3px) scale(1.06)}}
.ls .lsscene .lsn{font:italic 1.08rem/1.45 var(--sf);color:#efe8da;margin:6px 0}.ls .lsm{font-size:.78rem;color:var(--mu)}.ls .lstime{color:var(--gd);font-weight:700}
.ls .lsact{margin:10px 0;padding:10px;border:1px solid #dfbc7a55;border-radius:14px;background:#dfbc7a12;text-align:center}.ls .lsact b{font:400 1.08rem var(--sf);color:var(--gd)}
.ls .lsbtn{background:var(--gd);color:#1b1408;border:0;border-radius:10px;padding:9px 14px;font:700 .9rem system-ui;cursor:pointer;margin:4px}.ls .lsbtn.alt{background:transparent;color:var(--tx);border:1px solid var(--ln)}.ls .lsbtn:disabled{opacity:.4}
.ls .lsgr{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));min-width:0;gap:8px;margin-top:10px}
.ls .lsp{min-width:0;position:relative;background:#132129;border:1px solid var(--ln);border-radius:14px;padding:6px 6px 8px;text-align:center;cursor:default;transition:transform .15s,border-color .15s}
.ls .lsp.can{cursor:pointer;border-color:#dfbc7a66}.ls .lsp.can:hover{transform:translateY(-2px);border-color:var(--gd)}.ls .lsp.sel{border-color:var(--gd);box-shadow:0 0 0 2px #dfbc7a55}
.ls .lsp.isdead{opacity:.55}.ls .lsp.ally{border-color:#ec929088}.ls .lsp svg{width:62px;height:62px;display:block;margin:2px auto}.ls .lsface.dead{filter:grayscale(1) brightness(.6)}
.ls .lsp b{display:block;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ls .lsp small{display:block;font-size:.66rem;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ls .lstag{position:absolute;top:4px;right:6px;font:800 .58rem system-ui;letter-spacing:.08em;color:var(--gd)}.ls .lsvc{position:absolute;top:4px;left:5px;background:var(--rd);color:#250c0c;border-radius:99px;font:800 .68rem system-ui;padding:1px 6px}
.ls .lsnote{position:absolute;bottom:36px;right:6px;font-size:.9rem}.ls .lsdie{font-size:.66rem;color:var(--rd)}
.ls .lsrole{display:flex;gap:12px;align-items:center;background:#132129;border:1px solid #dfbc7a44;border-radius:16px;padding:12px}.ls .lsrole .ri{font-size:2.6rem}.ls .lsrole h4{margin:0;font:400 1.3rem var(--sf);color:var(--gd)}.ls .lsrole p{margin:4px 0 0;font-size:.86rem;color:#cfd6d4}
.ls .lslog{font-size:.84rem;line-height:1.55;color:#cfd6d4;max-height:320px;overflow:auto}.ls .lslog div{border-bottom:1px solid var(--ln);padding:4px 0}
.ls .lswc{margin-top:8px;text-align:left}.ls .lswc .cl{max-height:110px;overflow:auto;font-size:.82rem;background:#0d1820;border-radius:10px;padding:6px}.ls .lswc input{width:100%;margin-top:4px;font-size:16px}
.ls .lsrl div{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--ln)}.ls .lsrl span{font-size:1.5rem}.ls .lsrl p{margin:2px 0 0;font-size:.82rem;color:#cfd6d4}
.ls .lsend{text-align:center;padding:12px;border-radius:14px;margin:8px 0;font:400 1.3rem var(--sf)}.ls .lsend.v{background:#88c8b722;color:var(--te)}.ls .lsend.w{background:#ec929022;color:var(--rd)}
/* ---- giao diện theo bản VIP: thanh tên + thanh biểu tượng bên trái + cảnh trăng/làng ---- */
.ls{padding:0;overflow:hidden;background:radial-gradient(120% 70% at 70% 0,#16303a,var(--bg) 70%)}
.ls .lstop{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--ln);background:#0a1319cc}
.ls .lsbrand{display:flex;gap:10px;align-items:center}.ls .lsbrand b{display:block;font:400 1.15rem var(--sf);letter-spacing:.14em;color:#f1ece2}.ls .lsbrand small{display:block;font:600 .6rem system-ui;letter-spacing:.2em;color:var(--mu)}
.ls .lssync{font:.74rem system-ui;color:var(--mu)}.ls .lssync .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--te);margin-right:5px}
.ls .lsapp{display:grid;grid-template-columns:84px minmax(0,1fr)}.ls .lsmain{padding:14px 16px;min-width:0}
.ls .lstb{flex-direction:column;gap:6px;border:0;border-right:1px solid var(--ln);margin:0;padding:12px 8px;background:#0a1319aa;overflow:visible}
.ls .lstb button{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;border-radius:12px;padding:10px 2px;font:500 .68rem system-ui;color:var(--mu);border-bottom:0}
.ls .lstb button i{display:grid;place-items:center;font-style:normal}.ls .lstb button.on{background:#dfbc7a1a;color:var(--gd)}.ls .lstb button:hover{color:var(--gd)}
.ls .lsk{letter-spacing:.2em}.ls h3{font-size:2rem}
.ls .lsscene{min-height:210px;background:radial-gradient(circle at 82% 26%,#e8e4bf 0 26px,#cfcaa0 27px 28px,transparent 29px),linear-gradient(#18323d,#0e1c24 70%);display:flex;flex-direction:column;justify-content:center;align-items:flex-start;text-align:left;padding:22px 24px;border-radius:18px}
.ls .lsscene:after{content:"";position:absolute;left:0;right:0;bottom:0;height:70px;background:linear-gradient(#0b141b00,#0b141b),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 70' preserveAspectRatio='none'%3E%3Cpath fill='%23101c24' d='M0 70V48l30-14 30 14v-8l25-16 25 16v10l30-20 30 20v8l25-12 25 12v12l30-22 30 22v-6l30-14 30 14v28z'/%3E%3C/svg%3E") center bottom/100% 100% no-repeat;pointer-events:none}
.ls .lsscene.night{background:radial-gradient(circle at 82% 26%,#d9dcc8 0 24px,#aeb3a6 25px 26px,transparent 27px),linear-gradient(#0a1424,#070d14)}
.ls .lsscene .em{font-size:2.2rem}.ls .lsscene .lsn{font:italic 1.35rem/1.4 var(--sf);max-width:30em}.ls .lsscene>*{position:relative;z-index:1}
.ls .lsbtn{border-radius:8px;padding:11px 20px;font-size:.95rem}
@media(max-width:700px){.ls .lsapp{grid-template-columns:1fr}.ls .lstb{flex-direction:row;border:0;border-bottom:1px solid var(--ln);padding:6px;overflow-x:auto;gap:2px}.ls .lstb button{flex:1 0 auto;flex-direction:row;gap:6px;padding:8px 10px;font-size:.76rem}.ls .lstb button i svg{width:18px;height:18px}.ls .lsmain{padding:10px}.ls h3{font-size:1.4rem}.ls .lsscene{min-height:170px;padding:16px}.ls .lsscene .lsn{font-size:1.1rem}.ls .lstop{padding:10px 12px}.ls .lssync{display:none}}
@media(max-width:600px){.ls{border-radius:14px}.ls h3{font-size:1.25rem}.ls .lsst span{font-size:.62rem;padding:6px 2px}.ls .lsgr{grid-template-columns:repeat(4,1fr);gap:6px}.ls .lsp svg{width:48px;height:48px}.ls .lsp b{font-size:.76rem}.ls .lsscene .lsn{font-size:.98rem}}
@media(max-width:380px){.ls .lsgr{grid-template-columns:repeat(3,1fr)}}`;



  /* ---------- trang đầu + phòng chờ: dùng khung chung GV.mpShell ---------- */
  const RLIST = ['wolf', 'villager', 'seer', 'guard', 'witch', 'hunter'];
  const cfgOf = L => { const n = Math.max(L.seats.length, 5), raw = L.hostOpts.cfg || 'auto', auto = raw === 'auto';
    const c = auto ? autoCfg(n) : (parseCfg(raw, n) || (() => { try { return JSON.parse(raw); } catch (e) { return autoCfg(n); } })());
    return { n, raw, auto, c, vill: Math.max(0, n - SPECIAL.reduce((t, k) => t + (+c[k] || 0), 0)) }; };
  const SH = GV.mpShell.make({
    opts: [{ k: 'reveal', label: 'Lộ vai người chết:', values: ['Có', 'Không'], def: 'Có' }, { k: 'norep', label: 'Bảo vệ không chọn 1 người 2 đêm liền:', values: ['Có', 'Không'], def: 'Có' }, { k: 'selfsave', label: 'Phù thủy được tự cứu mình:', values: ['Có', 'Không'], def: 'Có' }],
    min: 5, max: 16, fire: true, skip: true, logEvents: true, scene: GV.mpShell.scenes.village, mascot: GV.mpShell.mascots.wolf,
    waitTitle: 'Làng Sương đang chờ…', kicker: 'Một ngôi làng · Hai phe · Vô vàn bí mật', h1: 'Đêm xuống.<br>Ai còn là người?', em: 'Lời Nguyền Làng Sương',
    lead: 'Giữa những gương mặt quen là một lời nói dối. Tụ họp bạn bè, nhận vai bí mật, trò chuyện bằng giọng nói qua từng đêm sương – và tìm ra Ma Sói trước khi quá muộn.',
    feats: ['👥 5–16 người online', '🎭 6 vai bí mật', '🎙 Voice chat trong phòng', '🤖 Thiếu người có bot'], formTitle: 'Thắp đèn, mở phòng', roomPh: 'Ví dụ: Làng Sương tối thứ 7', cta: '▶ Bước vào màn đêm',
    steps: [['🏕️', 'Tụ họp', 'Chủ phòng tạo phòng, gửi mã hoặc link mời. Mọi người bấm sẵn sàng.'], ['📜', 'Nhận vai', 'Máy chủ chia vai ngẫu nhiên, bí mật – chỉ bạn biết mình là ai.'], ['🌙', 'Màn đêm', 'Sói chọn con mồi, Tiên tri soi, Bảo vệ che chở, Phù thủy dùng thuốc.'], ['⚖️', 'Hội đồng', 'Ban ngày tranh luận, bỏ phiếu treo cổ kẻ đáng ngờ nhất.']],
    cfgTitle: 'Danh sách vai <span style="font-weight:400;color:#98a8ae">(ẩn với người chơi)</span>', cfgNote: 'Vai sẽ được chia ngẫu nhiên và bí mật khi bắt đầu. Người chơi không xem được vai của nhau.',
    voiceNote: 'Ban đêm mic tự tắt; người đã chết chỉ được nghe.', guideTab: 'Vai trò', guide: RLIST.map(k => [ROLES[k].i, ROLES[k].n, ROLES[k].d]),
    voiceLock: L => { const pub = L.pub || {}; return L.status === 'playing' && !pub.over && (pub.phase === 'night' || (pub.alive && pub.alive[L.me] === false)); },
    ctl: pb => { const ph = { role: 'Nhận vai', night: 'Đêm ' + pb.day + (pb.step ? ' · ' + ({ guard: 'Bảo vệ', wolves: 'Ma Sói', seer: 'Tiên tri', witch: 'Phù thủy' })[pb.step] : ''), dawn: 'Bình minh', day: 'Hội đồng', vote: 'Bỏ phiếu', verdict: 'Phán quyết', hunter: 'Thợ săn' }[pb.phase] || ''; return `Pha hiện tại: <b>${ph}</b> · còn sống ${Object.values(pb.alive || {}).filter(Boolean).length}/${(pb.order || []).length}`; },
    cfg: {
      err: L => cfgError(L.hostOpts.cfg || 'auto', Math.max(L.seats.length, 5)),
      mode: L => (L.hostOpts.cfg || 'auto') === 'auto' ? 'Tự động theo số người' : 'Tuỳ chỉnh vai',
      render(el, L, $) {
        const { auto, c, vill } = cfgOf(L), edit = L.isHost && !auto, mx = { wolf: 6, seer: 1, guard: 1, witch: 1, hunter: 1 };
        $('.lsr-mode').innerHTML = `<button data-m="auto" class="${auto ? 'on' : ''}" ${L.isHost ? '' : 'disabled'}>Tự động</button><button data-m="custom" class="${auto ? '' : 'on'}" ${L.isHost ? '' : 'disabled'}>Tuỳ chỉnh</button>`;
        $('.lsr-roles').innerHTML = RLIST.map(k => { const v = k === 'villager' ? vill : +c[k] || 0; return `<div class="lsr-rc"><i>${ROLES[k].i}</i><small>${ROLES[k].n}</small><div class="n">${edit && k !== 'villager' ? `<button data-r="${k}" data-d="-1" ${v <= (k === 'wolf' ? 1 : 0) ? 'disabled' : ''}>−</button>` : ''}<span>${v}</span>${edit && k !== 'villager' ? `<button data-r="${k}" data-d="1" ${v >= mx[k] ? 'disabled' : ''}>+</button>` : ''}</div></div>`; }).join('');
      },
      click(t, L) {
        if (t.dataset.m && L.isHost) { L.setOpt('cfg', t.dataset.m === 'auto' ? 'auto' : JSON.stringify(autoCfg(Math.max(L.seats.length, 5)))); return true; }
        if (t.dataset.r && L.isHost) { let c = {}; try { c = JSON.parse(L.hostOpts.cfg); } catch (er) { c = autoCfg(Math.max(L.seats.length, 5)); } c[t.dataset.r] = Math.max(0, (+c[t.dataset.r] || 0) + +t.dataset.d); L.setOpt('cfg', JSON.stringify(c)); return true; }
        return false;
      }
    }
  });

  // ---- thống kê & thành tích (lưu trên máy, theo bản VIP): ghi 1 lần/ván khi ván kết thúc ----
  const ACH = [['first', '🌙', 'Người qua sương', 'Hoàn thành ván đầu tiên.'], ['victory', '🔥', 'Ánh lửa đầu tiên', 'Thắng một ván bất kỳ.'], ['both', '🐺', 'Hai mặt trăng', 'Thắng với cả phe Dân và phe Sói.'],
    ['survivor', '🕯️', 'Ngọn nến cuối', 'Thắng và còn sống trong 3 ván.'], ['streak', '⭐', 'Lời nguyền tan vỡ', 'Thắng 3 ván liên tiếp.'], ['roles', '🃏', 'Sáu số phận', 'Hoàn thành ván với đủ 6 vai.'], ['crowd', '👥', 'Làng đông vui', 'Chơi một ván có từ 8 người trở lên.']];
  const freshSt = () => ({ played: 0, won: 0, wolfWins: 0, villageWins: 0, survivedWins: 0, streak: 0, bestStreak: 0, roleGames: {}, roleWins: {}, unlocked: [], big: 0, hist: [] });
  function recordGame(c, p, me) {
    if (!p.over || !me.role) return; const key = 'ls_rec_' + c.code + '_' + c.round; if (GV.store.get(key, 0)) return; GV.store.set(key, 1);
    const st = Object.assign(freshSt(), GV.store.get('ls_stats', {})), wolf = ROLES[me.role].team === 'wolf', won = (p.over.winner === 'wolf') === wolf;
    st.played++; st.roleGames[me.role] = (st.roleGames[me.role] || 0) + 1;
    if (won) { st.won++; st.roleWins[me.role] = (st.roleWins[me.role] || 0) + 1; wolf ? st.wolfWins++ : st.villageWins++; if (me.alive) st.survivedWins++; st.streak++; } else st.streak = 0;
    st.bestStreak = Math.max(st.bestStreak, st.streak); if (p.order.length >= 8) st.big++;
    const cond = { first: st.played >= 1, victory: st.won >= 1, both: st.wolfWins > 0 && st.villageWins > 0, survivor: st.survivedWins >= 3, streak: st.bestStreak >= 3, roles: Object.keys(st.roleGames).length >= 6, crowd: st.big >= 1 };
    ACH.forEach(a => { if (cond[a[0]] && !st.unlocked.includes(a[0])) { st.unlocked.push(a[0]); if (GV.toast) GV.toast('Mở thành tích: ' + a[2]); } });
    st.hist = [{ at: Date.now(), role: me.role, won, n: p.order.length, day: p.day, village: p.village }].concat(st.hist || []).slice(0, 8);
    GV.store.set('ls_stats', st);
  }
  const NOTE = ['', '🐺', '✅', '❓']; // ghi chú cá nhân trên thẻ (lưu trên máy)

  GV.mp.define({
    id: 'masoi', name: 'Ma Sói · Lời Nguyền Làng Sương', icon: '🌫️', min: 5, max: 16, css: CSS + SH.css, entryTpl: SH.entryTpl, lobbyItem: SH.lobbyItem, roomTpl: SH.roomTpl, roomRender: SH.roomRender, roomCleanup: SH.roomCleanup, chatItem: SH.chatItem,
    desc: 'Ma Sói online nhiều người theo phong cách truyện: nhận vai, đêm sương, bình minh, hội đồng làng, bỏ phiếu. 6 vai, 5–16 người, thiếu người có bot.',
    init(seats, api) {
      const hs = seats.find(x => x.id === api.host) || {}, now = Date.now(), roles = rolesFor(seats.length, api, (hs.opts || {}).cfg), v = api.rnd(VILLAGES.length), jobs = api.shuffle(JOBS.slice());
      const S = { order: seats.map(s => s.id), names: Object.fromEntries(seats.map(s => [s.id, s.name])), jobs: {}, roles: {}, alive: {}, dead: [], day: 1, log: [], over: null,
        phase: 'role', step: null, deadline: now + T.role, seen: {}, acted: {}, wolfVotes: {}, victim: null, saved: false, poisoned: null, guardPick: null,
        witch: { heal: 1, poison: 1 }, rules: { reveal: (hs.opts || {}).reveal !== 'Không', norep: (hs.opts || {}).norep !== 'Không', selfsave: (hs.opts || {}).selfsave !== 'Không' }, lastGuard: null, seerLog: {}, votes: {}, voted: {}, ready: {}, hunter: null, news: [], verdict: null, village: v, wchat: [] };
      S.order.forEach((id, i) => { S.roles[id] = roles[i]; S.alive[id] = true; S.jobs[id] = jobs[i % jobs.length]; });
      log(S, `📜 ${VILLAGES[v][0]}: ${roles.filter(r => r === 'wolf').length} Ma Sói đang ẩn mình giữa ${seats.length} người.`);
      return S;
    },
    reduce(S, id, a, api) {
      if (S.over) return 'Ván đã kết thúc.';
      const now = Date.now(), role = S.roles[id], ok = t => t && S.alive[t];
      if (a.t === 'skip') { if (id !== api.host) return 'Chỉ chủ phòng điều phối được.'; if (S.deadline) S.deadline = now; return; } // chủ phòng chuyển pha ngay
      if (S.phase === 'role') { if (a.t === 'seen') { S.seen[id] = 1; if (S.order.every(i => S.seen[i])) startStep(S, 'guard', now); } return; }
      if (S.phase === 'hunter') {
        if (!S.hunter || S.hunter.id !== id || a.t !== 'shoot') return 'Đang chờ Thợ săn.';
        if (a.target) { if (!ok(a.target) || a.target === id) return 'Mục tiêu không hợp lệ.'; kill(S, a.target, 'shot'); S.news = [{ id: a.target, role: S.roles[a.target], how: 'shot' }]; log(S, `🏹 Thợ săn ${S.names[id]} bắn ${S.names[a.target]} – là ${ROLES[S.roles[a.target]].n}.`); }
        else log(S, `🏹 Thợ săn ${S.names[id]} hạ cung, không bắn ai.`);
        const nx = S.hunter.next; S.hunter = null; if (checkWin(S)) return; nx === 'night' ? startNight(S, now) : startDay(S, now); return;
      }
      if (!S.alive[id]) return 'Bạn đã chết, hãy dõi theo ván chơi.';
      if (a.t === 'wchat') { if (role !== 'wolf' || S.phase !== 'night') return 'Chỉ Sói nói chuyện được trong đêm.'; const tx = String(a.text || '').trim().slice(0, 120); if (tx) { S.wchat.push({ id, tx }); if (S.wchat.length > 30) S.wchat.shift(); } return; }
      if (S.phase === 'night') {
        if (S.acted[id]) return 'Bạn đã hành động đêm nay.';
        if (S.step === 'guard' && role === 'guard' && a.t === 'guard') { if (a.target && !ok(a.target)) return 'Mục tiêu không hợp lệ.'; if (a.target && S.rules.norep && a.target === S.lastGuard) return 'Không bảo vệ cùng một người hai đêm liên tiếp.'; S.guardPick = a.target || null; S.lastGuard = S.guardPick; S.acted[id] = 1; nextStep(S, now); return; }
        if (S.step === 'wolves' && role === 'wolf' && a.t === 'bite') {
          if (!ok(a.target) || S.roles[a.target] === 'wolf') return 'Hãy chọn một người không phải Sói.';
          S.wolfVotes[id] = a.target; S.acted[id] = 1;
          if (alive(S).filter(i => S.roles[i] === 'wolf').every(i => S.wolfVotes[i])) { resolveWolves(S, api); nextStep(S, now); }
          return;
        }
        if (S.step === 'seer' && role === 'seer' && a.t === 'peek') {
          if (!ok(a.target) || a.target === id) return 'Hãy chọn một người khác còn sống.';
          (S.seerLog[id] = S.seerLog[id] || []).push({ target: a.target, wolf: S.roles[a.target] === 'wolf', day: S.day }); S.acted[id] = 1; S.deadline = Math.min(S.deadline, now + 5000); return;
        }
        if (S.step === 'witch' && role === 'witch' && a.t === 'witch') {
          if (a.heal && a.poison) return 'Mỗi đêm chỉ dùng một thuốc.';
          if (a.heal) { if (!S.witch.heal || !S.victim) return 'Không thể dùng thuốc cứu.'; if (S.victim === id && !S.rules.selfsave) return 'Luật phòng: Phù thủy không được tự cứu mình.'; S.saved = true; S.witch.heal = 0; }
          if (a.poison) { if (!S.witch.poison || !ok(a.poison) || a.poison === id) return 'Không thể dùng thuốc độc.'; S.poisoned = a.poison; S.witch.poison = 0; }
          S.acted[id] = 1; nextStep(S, now); return;
        }
        return 'Chưa đến lượt của bạn.';
      }
      if (S.phase === 'day') { if (a.t === 'ready') { S.ready[id] = 1; return; } return 'Hội đồng đang thảo luận.'; }
      if (S.phase === 'vote') {
        if (a.t !== 'vote') return;
        if (a.target && (!ok(a.target) || a.target === id)) return 'Phiếu không hợp lệ.';
        S.votes[id] = a.target || null; S.voted[id] = 1; return;
      }
      return 'Hãy chờ một chút.';
    },
    tick(S, now) {
      if (S.over || !S.deadline) return false;
      const al = alive(S);
      if (S.phase === 'day' && al.every(i => S.ready[i])) { startVote(S, now); return true; }
      if (S.phase === 'vote' && al.every(i => S.voted[i])) { tally(S, now); return true; }
      if (now < S.deadline) return false;
      if (S.phase === 'role') startStep(S, 'guard', now);
      else if (S.phase === 'night') { if (S.step === 'wolves') resolveWolves(S, { rnd: n => Math.floor(Math.random() * n) }); nextStep(S, now); }
      else if (S.phase === 'dawn' || S.phase === 'verdict') afterDawn(S, now);
      else if (S.phase === 'day') startVote(S, now);
      else if (S.phase === 'vote') tally(S, now);
      else if (S.phase === 'hunter') { log(S, '🏹 Thợ săn không kịp bắn.'); const nx = S.hunter.next; S.hunter = null; if (!checkWin(S)) nx === 'night' ? startNight(S, now) : startDay(S, now); }
      return true;
    },
    bot,
    pub(S) {
      return { phase: S.phase, step: S.phase === 'night' ? S.step : null, day: S.day, deadline: S.deadline, order: S.order, names: S.names, jobs: S.jobs, alive: S.alive, dead: S.rules.reveal || S.over ? S.dead : S.dead.map(d => ({ id: d.id, role: null, how: d.how, day: d.day })), rules: S.rules,
        log: S.log.slice(-30), village: S.village, news: S.phase === 'dawn' || S.phase === 'hunter' ? (S.rules.reveal ? S.news : S.news.map(d => Object.assign({}, d, { role: null }))) : null, verdict: S.phase === 'verdict' ? S.verdict : null,
        votes: S.phase === 'vote' || S.phase === 'verdict' ? S.votes : null, voted: S.phase === 'vote' ? Object.keys(S.voted).length : 0, ready: S.phase === 'day' ? Object.keys(S.ready).length : 0,
        seen: S.phase === 'role' ? Object.keys(S.seen).length : 0, hunter: S.hunter ? S.hunter.id : null, over: S.over, turn: null };
    },
    priv(S, id) {
      const role = S.roles[id], p = { role, alive: !!S.alive[id], act: null };
      if (role === 'wolf') { p.allies = S.order.filter(i => S.roles[i] === 'wolf' && i !== id); p.wchat = S.wchat.slice(-20); if (S.phase === 'night' && S.step === 'wolves') p.picks = S.wolfVotes; }
      if (role === 'guard') p.lastGuard = S.rules.norep ? S.lastGuard : null;
      if (role === 'seer') p.seer = S.seerLog[id] || [];
      if (role === 'witch') p.potions = S.witch;
      if (S.over) return p;
      if (S.phase === 'role' && !S.seen[id]) p.act = 'seen';
      if (S.phase === 'hunter' && S.hunter && S.hunter.id === id) p.act = 'shoot';
      if (!S.alive[id]) return p;
      if (S.phase === 'night' && !S.acted[id]) {
        if (S.step === 'guard' && role === 'guard') p.act = 'guard';
        if (S.step === 'wolves' && role === 'wolf') p.act = 'bite';
        if (S.step === 'seer' && role === 'seer') p.act = 'peek';
        if (S.step === 'witch' && role === 'witch') { p.act = 'witch'; p.victim = S.witch.heal ? S.victim : null; }
      }
      if (S.phase === 'day' && !S.ready[id]) p.act = 'ready';
      if (S.phase === 'vote' && !S.voted[id]) p.act = 'vote';
      return p;
    },
    summary(S) { return { title: S.over.winner === 'village' ? '🔥 Dân làng thắng' : '🐺 Ma Sói thắng', lines: S.order.map(i => `${S.names[i]}: ${ROLES[S.roles[i]].i} ${ROLES[S.roles[i]].n}${S.alive[i] ? '' : ' (đã chết)'}`) }; },
    render(box, c) {
      const p = c.pub, me = c.priv || {}, ui = c.ui, al = p.order.filter(i => (p.alive || {})[i]), dead = p.dead || [], V = VILLAGES[p.village || 0];
      const nm = i => c.esc((p.names || {})[i] || c.names[i] || '?'), R = me.role ? ROLES[me.role] : null;
      ui.tab = ui.tab || 'board'; if (ui.lastAct !== me.act) { ui.sel = null; ui.lastAct = me.act; }
      recordGame(c, p, me);
      const notes = GV.store.get('ls_notes_' + c.code + '_' + c.round, {});
      const dl = p.deadline ? ` · <span class="lstime" data-dl="${p.deadline}"></span>` : '';
      const stepIdx = { role: 0, night: 1, dawn: 2, hunter: 2, day: 3, vote: 4, verdict: 4, end: 4 }[p.phase];
      const stepper = ['Nhận vai', 'Đêm ' + p.day, 'Bình minh', 'Hội đồng', 'Bỏ phiếu'].map((t, i) => `<span class="${i === stepIdx && !p.over ? 'on' : ''}">${t}</span>`).join('');
      const deadHow = { bite: 'bị Sói cắn', poison: 'trúng độc', hang: 'bị treo cổ', shot: 'bị bắn' };
      // lời dẫn từng pha
      let em = '🔥', nar = '', meta = '', night = false;
      const STEP_TXT = { guard: 'Người Bảo vệ thức giấc, lặng lẽ chọn người để che chở…', wolves: 'Tiếng hú vọng từ rừng. Bầy Sói đang chọn con mồi…', seer: 'Tiên tri nhìn vào quả cầu, tìm kiếm sự thật…', witch: 'Phù thủy mở hòm thuốc dưới ánh trăng…' };
      if (p.over) { em = p.over.winner === 'village' ? '🔥' : '🌑'; nar = p.over.winner === 'village' ? 'Bình minh trở lại. Lời nguyền đã tan.' : 'Sương đặc quánh. Không còn ai thắp đèn nữa.'; }
      else if (p.phase === 'role') { em = '📜'; nar = V[2]; meta = `Đã xem vai: ${p.seen}/${p.order.length}${dl}`; }
      else if (p.phase === 'night') { em = '🌙'; night = true; nar = STEP_TXT[p.step] || 'Cả làng chìm trong giấc ngủ…'; meta = `Đêm ${p.day}${dl}`; }
      else if (p.phase === 'dawn' || p.phase === 'hunter') { em = '🌅'; const nw = p.news || []; nar = nw.length ? nw.map(d => `${nm(d.id)} đã ${deadHow[d.how] || 'chết'}. ${d.role ? 'Họ là ' + ROLES[d.role].n + '.' : 'Vai của họ được giữ kín.'}`).join(' ') : 'Sương tan. Đêm qua không ai mất mạng.'; meta = p.phase === 'hunter' ? `🏹 ${nm(p.hunter)} là Thợ săn – đang giương cung…${dl}` : `Ngày ${p.day}${dl}`; }
      else if (p.phase === 'day') { em = '🏛️'; nar = 'Dân làng tụ về quảng trường. Ai đang nói dối?'; meta = `Thảo luận ở Chat · sẵn sàng ${p.ready}/${al.length}${dl}`; }
      else if (p.phase === 'vote') { em = '🗳️'; nar = 'Mỗi người một lá phiếu. Chọn người đáng nghi nhất.'; meta = `Đã bỏ phiếu ${p.voted}/${al.length}${dl}`; }
      else if (p.phase === 'verdict') { em = '⚖️'; const v = p.verdict || {}; nar = v.id ? `Với ${v.n} phiếu, ${nm(v.id)} bị đưa lên giàn treo. Họ là ${ROLES[v.role].n}.` : v.tie ? 'Phiếu chia đôi. Làng chưa thể quyết định.' : 'Không ai bị buộc tội hôm nay.'; meta = dl.replace(' · ', ''); }
      // hành động của tôi
      let act = '', can = () => false;
      const sel = id => `${ui.sel === id ? 'sel' : ''}`;
      switch (me.act) {
        case 'seen': act = `<b>Bạn là ${R.i} ${R.n}</b><p style="margin:6px 0;font-size:.86rem">${R.d}</p>${me.allies && me.allies.length ? `<p class="lsdie">Đồng bọn: ${me.allies.map(nm).join(', ')}</p>` : ''}<button class="lsbtn" data-a="seen">Tôi đã nhớ vai</button>`; break;
        case 'guard': act = `<b>Che chở ai đêm nay?</b><div class="lsm">Chạm vào một thẻ (có thể chọn bản thân)${me.lastGuard ? ' · không chọn <b>' + nm(me.lastGuard) + '</b> hai đêm liền' : ''}</div><button class="lsbtn alt" data-a="guard-none">Không bảo vệ ai</button>`; can = i => i !== me.lastGuard; break;
        case 'bite': act = `<b>Cắn ai đêm nay?</b>${Object.keys(me.picks || {}).length ? `<div class="lsm">Bầy đã chọn: ${Object.entries(me.picks).map(([k, v]) => nm(k) + ' → ' + nm(v)).join(', ')}</div>` : '<div class="lsm">Chạm vào thẻ con mồi</div>'}`; can = i => i !== c.me && !(me.allies || []).includes(i); break;
        case 'peek': act = '<b>Soi ai đêm nay?</b><div class="lsm">Chạm vào một thẻ</div>'; can = i => i !== c.me; break;
        case 'witch': act = `<b>Hòm thuốc của Phù thủy</b><div style="margin:4px 0">${me.victim ? `Đêm nay <b>${nm(me.victim)}</b> bị Sói cắn.` : 'Bạn không thấy nạn nhân nào (hoặc đã hết thuốc cứu).'}</div>${me.victim ? '<button class="lsbtn" data-a="heal">💧 Dùng thuốc cứu</button>' : ''}<button class="lsbtn alt" data-a="witch-skip">Không dùng thuốc</button>${me.potions && me.potions.poison ? '<div class="lsm">…hoặc chạm vào một thẻ để dùng ☠️ thuốc độc</div>' : ''}`; can = i => me.potions && me.potions.poison && i !== c.me; break;
        case 'ready': act = '<b>Hội đồng làng</b><div class="lsm">Trao đổi ở khung Chat bên dưới, rồi báo sẵn sàng.</div><button class="lsbtn" data-a="ready">Sẵn sàng bỏ phiếu</button>'; break;
        case 'vote': act = '<b>Bỏ phiếu treo cổ</b><div class="lsm">Chạm vào thẻ người bạn nghi ngờ</div><button class="lsbtn alt" data-a="vote-skip">Bỏ phiếu trắng</button>'; can = i => i !== c.me; break;
        case 'shoot': act = '<b>🏹 Bạn là Thợ săn – bắn một người trước khi gục ngã</b><div class="lsm">Chạm vào một thẻ</div><button class="lsbtn alt" data-a="shoot-none">Không bắn</button>'; can = i => i !== c.me; break;
      }
      if (!act && !p.over && me.alive !== false && night) act = '<div class="lsm">😴 Nhắm mắt lại… chờ trời sáng.</div>';
      if (!act && me.alive === false && !p.over) act = '<div class="lsm">👻 Bạn đã chết. Hãy dõi theo, đừng tiết lộ gì trong Chat nhé.</div>';
      // đếm phiếu
      const vc = {}; Object.values(p.votes || {}).forEach(t => { if (t) vc[t] = (vc[t] || 0) + 1; });
      const seerMap = Object.fromEntries((me.seer || []).map(x => [x.target, x.wolf]));
      const cards = p.order.map(i => {
        const dd = dead.find(d => d.id === i), isMe = i === c.me, isAlly = (me.allies || []).includes(i), ck = !dd && can(i);
        const tag = isMe ? 'BẠN' : isAlly ? 'SÓI' : seerMap[i] === true ? '🐺 SÓI' : seerMap[i] === false ? '✓ NGƯỜI' : '';
        const roleTxt = dd ? `<span class="lsdie">${dd.role ? ROLES[dd.role].i + ' ' + ROLES[dd.role].n : '❔ Giấu vai'} · ${deadHow[dd.how] || ''}</span>` : p.over ? `${ROLES[p.over.roles[i]].i} ${ROLES[p.over.roles[i]].n}` : c.esc((p.jobs || {})[i] || '');
        return `<div class="lsp${dd ? ' isdead' : ''}${ck ? ' can' : ''}${isAlly ? ' ally' : ''} ${sel(i)}" data-pid="${i}">${vc[i] ? `<span class="lsvc">${vc[i]}</span>` : ''}${tag ? `<span class="lstag">${tag}</span>` : ''}${face(i, dd ? 'dead' : '')}${notes[i] ? `<span class="lsnote">${NOTE[notes[i]]}</span>` : ''}<b>${nm(i)}</b><small>${roleTxt}</small></div>`;
      }).join('');
      const TI = { board: 'moon', me: 'user', book: 'layout', stats: 'trend', rules: 'info' }, tabs = [['board', 'Bàn chơi'], ['me', 'Vai của tôi'], ['book', 'Sổ tay'], ['stats', 'Thành tích'], ['rules', 'Luật']].map(([k, t]) => `<button data-tab="${k}" class="${ui.tab === k ? 'on' : ''}"><i>${GV.ic ? GV.ic(TI[k], 22) : ''}</i><span>${t}</span></button>`).join('');
      let body = '';
      if (ui.tab === 'board') {
        body = `<div class="lsscene${night ? ' night' : ''}"><div class="em">${em}</div><div class="lsn">“${c.esc(nar)}”</div><div class="lsm">${meta}</div></div>
${p.over ? `<div class="lsend ${p.over.winner === 'village' ? 'v' : 'w'}">${p.over.winner === 'village' ? '🔥 Dân làng chiến thắng' : '🐺 Ma Sói chiến thắng'}</div>` : ''}
${act ? `<div class="lsact">${act}</div>` : ''}
${me.role === 'wolf' && p.phase === 'night' && me.alive ? `<div class="lswc"><div class="lsm">🐺 Thì thầm cùng bầy (chỉ Sói thấy)</div><div class="cl">${(me.wchat || []).map(m => `<div><b>${nm(m.id)}:</b> ${c.esc(m.tx)}</div>`).join('') || '<span class="lsm">Chưa có lời nào.</span>'}</div><input class="lswi" maxlength="120" placeholder="Nhắn cho bầy… (Enter để gửi)"></div>` : ''}
<div class="lsgr">${cards}</div><div class="lsm" style="margin-top:6px">Giữ lâu/nhấn đúp vào thẻ để ghi chú riêng: 🐺 nghi Sói · ✅ tin tưởng · ❓ chưa rõ (chỉ bạn thấy).</div>`;
      } else if (ui.tab === 'me') {
        body = R ? `<div class="lsrole"><div class="ri">${R.i}</div><div><h4>${R.n}${me.alive === false ? ' · đã chết' : ''}</h4><p>${R.d}</p><p class="lsm">Phe: ${R.team === 'wolf' ? 'Ma Sói' : 'Dân làng'}</p></div></div>
${me.allies && me.allies.length ? `<p>🐺 Đồng bọn: <b>${me.allies.map(nm).join(', ')}</b></p>` : ''}
${me.seer ? `<p>🔮 Kết quả soi: ${me.seer.length ? me.seer.map(x => `${nm(x.target)} (đêm ${x.day}) = ${x.wolf ? '<b style="color:var(--rd)">SÓI</b>' : '<b style="color:var(--te)">không phải Sói</b>'}`).join(' · ') : 'chưa soi ai.'}</p>` : ''}
${me.potions ? `<p>🧪 Thuốc còn lại: cứu ${me.potions.heal ? '✔' : '✘'} · độc ${me.potions.poison ? '✔' : '✘'}</p>` : ''}` : '<p class="lsm">Chưa có vai.</p>';
      } else if (ui.tab === 'stats') {
        const st = Object.assign(freshSt(), GV.store.get('ls_stats', {})), pc = st.played ? Math.round(st.won / st.played * 100) : 0;
        body = `<div class="lsrole"><div class="ri">📊</div><div><h4>Thống kê của bạn</h4><p>Đã chơi <b>${st.played}</b> ván · thắng <b>${st.won}</b> (${pc}%) · chuỗi thắng tốt nhất <b>${st.bestStreak}</b></p><p class="lsm">Phe Dân thắng ${st.villageWins} · phe Sói thắng ${st.wolfWins} · còn sống khi thắng ${st.survivedWins}. Dữ liệu chỉ lưu trên máy này.</p></div></div>
<div class="lsm" style="margin:8px 0 4px">Theo vai</div><div>${Object.keys(ROLES).map(r => `<span class="lsm" style="display:inline-block;margin:2px 10px 2px 0">${ROLES[r].i} ${ROLES[r].n}: ${st.roleWins[r] || 0}/${st.roleGames[r] || 0}</span>`).join('')}</div>
<div class="lsm" style="margin:10px 0 4px">Thành tích (${st.unlocked.length}/${ACH.length})</div><div>${ACH.map(a => `<div class="lsm" style="padding:6px 0;opacity:${st.unlocked.includes(a[0]) ? 1 : .45}">${a[1]} <b>${c.esc(a[2])}</b> – ${c.esc(a[3])}</div>`).join('')}</div>
<div class="lsm" style="margin:10px 0 4px">Ván gần đây</div><div>${(st.hist || []).map(h => `<div class="lsm" style="padding:3px 0">${h.won ? '🏆' : '💀'} ${ROLES[h.role] ? ROLES[h.role].i + ' ' + ROLES[h.role].n : h.role} · ${h.n} người · ${h.day} ngày · ${new Date(h.at).toLocaleDateString('vi-VN')}</div>`).join('') || '<span class="lsm">Chưa có ván nào.</span>'}</div>`;
      } else if (ui.tab === 'book') {
        body = `<div class="lslog">${(p.log || []).slice().reverse().map(l => `<div>${c.esc(l)}</div>`).join('')}</div>`;
      } else {
        body = `<div class="lsrl">${Object.values(ROLES).map(r => `<div><span>${r.i}</span><div><b>${r.n}</b> <span class="lsm">(${r.team === 'wolf' ? 'phe Sói' : 'phe Dân'})</span><p>${r.d}</p></div></div>`).join('')}</div>
<p class="lsm">Dân làng thắng khi loại hết Sói. Sói thắng khi số Sói còn sống bằng hoặc nhiều hơn số người còn lại. Người chết lộ vai. Phiếu hoà thì không ai bị treo.</p>`;
      }
      box.innerHTML = `<div class="ls"><div class="lstop"><div class="lsbrand"><svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="#dfbc7a" stroke-width="1.5" stroke-linecap="round"><circle cx="16" cy="16" r="13"/><path d="M9 12l3 3M23 12l-3 3M11 21c3 2 7 2 10 0M12 8l-2-4M20 8l2-4"/></svg><div><b>MA SÓI</b><small>LỜI NGUYỀN LÀNG SƯƠNG</small></div></div><div class="lssync"><span class="dot"></span> Đồng bộ phòng · ván ${c.round}</div></div>
<div class="lsapp"><div class="lstb">${tabs}</div><div class="lsmain"><div class="lsh"><div><div class="lsk">Một ngôi làng. Hai phe. Vô vàn bí mật.</div><h3>${c.esc(V[0])}</h3><p class="lsq">${c.esc(V[1])}</p></div>
<div class="lsc"><div><b>${al.length}</b><small>Còn sống</small></div><div class="d"><b>${String(dead.length).padStart(2, '0')}</b><small>Đã chết</small></div></div></div>
<div class="lsst">${stepper}</div>${body}</div></div></div>`;
      const wi = box.querySelector('.lswi');
      if (wi) { if (ui.wtext) wi.value = ui.wtext; wi.oninput = () => { ui.wtext = wi.value; }; wi.onkeydown = e => { if (e.key === 'Enter' && wi.value.trim()) { c.send({ t: 'wchat', text: wi.value.trim() }); ui.wtext = ''; wi.value = ''; } }; if (ui.wfocus) { wi.focus(); } wi.onfocus = () => { ui.wfocus = 1; }; wi.onblur = () => { ui.wfocus = 0; }; }
      const setNote = id => { const n = GV.store.get('ls_notes_' + c.code + '_' + c.round, {}); n[id] = ((n[id] || 0) + 1) % NOTE.length; GV.store.set('ls_notes_' + c.code + '_' + c.round, n); this_render(); };
      const this_render = () => { const def = GV.mp.defs.masoi; def.render(box, c); };
      let pressT = null, longFired = false;
      box.onpointerdown = e => { const pc = e.target.closest('.lsp'); if (!pc) return; longFired = false; clearTimeout(pressT); pressT = setTimeout(() => { longFired = true; setNote(pc.dataset.pid); }, 550); };
      box.onpointerup = box.onpointerleave = () => clearTimeout(pressT);
      box.ondblclick = e => { const pc = e.target.closest('.lsp'); if (pc) setNote(pc.dataset.pid); };
      box.onclick = e => {
        const tb = e.target.closest('[data-tab]'); if (tb) { ui.tab = tb.dataset.tab; return this_render(); }
        const a = e.target.closest('[data-a]'), pc = e.target.closest('.lsp.can');
        if (pc && !longFired && me.act) {
          const id = pc.dataset.pid; ui.sel = id;
          const m = { guard: { t: 'guard', target: id }, bite: { t: 'bite', target: id }, peek: { t: 'peek', target: id }, witch: { t: 'witch', poison: id }, vote: { t: 'vote', target: id }, shoot: { t: 'shoot', target: id } }[me.act];
          if (m && (me.act !== 'witch' || confirm('Dùng thuốc độc lên ' + ((p.names || {})[id] || '') + '?'))) c.send(m);
          return this_render();
        }
        if (!a) return;
        const k = a.dataset.a, M = { seen: { t: 'seen' }, 'guard-none': { t: 'guard', target: null }, heal: { t: 'witch', heal: true }, 'witch-skip': { t: 'witch' }, ready: { t: 'ready' }, 'vote-skip': { t: 'vote', target: null }, 'shoot-none': { t: 'shoot', target: null } };
        if (M[k]) c.send(M[k]);
      };
    }
  });
  // ---- Khung toàn trang theo bản VIP: ẩn khung OmniHub, thanh biểu tượng bên trái + thanh tên phía trên ----
  (function vipShell() {
    const it = GV.items.find(x => x.id === 'masoi'); if (!it) return; const orig = it.mount, esc = GV.esc;
    const css = `<style>
body.mpvip .top,body.mpvip .rail,body.mpvip .bnav,body.mpvip .fab,body.mpvip footer,body.mpvip .vbar,body.mpvip .ad,body.mpvip #thead{display:none!important}
body.mpvip main,body.mpvip footer{margin:0!important;width:100%!important;padding:0!important}
body.mpvip{background:#0b141b!important}body.mpvip .stage{padding:0!important;border:0!important;background:none!important;box-shadow:none!important;backdrop-filter:none!important;border-radius:0!important}
.vpa{position:fixed;inset:0;z-index:50;display:grid;grid-template-columns:76px minmax(0,1fr);background:#0b141b;color:#e6e8e4}
.vpa .vr{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px;border-right:1px solid #ffffff12;background:#0a1319}
.vpa .vr .lg{margin-bottom:10px}.vpa .vr button{width:64px;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;border-radius:12px;padding:9px 2px;background:none;color:#98a8ae;font:500 .68rem system-ui;cursor:pointer}
.vpa .vr button.on,.vpa .vr button:hover{background:#dfbc7a1a;color:#dfbc7a}.vpa .vr .sp{flex:1}
.vpa .vm{display:flex;flex-direction:column;min-width:0;height:100%}.vpa .vt{display:flex;justify-content:space-between;align-items:center;padding:14px 28px;border-bottom:1px solid #ffffff12;background:#0a1319cc}
.vpa .vt b{display:block;font:400 1.35rem Georgia,serif;letter-spacing:.14em;color:#f1ece2}.vpa .vt small{display:block;font:500 .72rem system-ui;letter-spacing:.2em;color:#98a8ae;margin-top:4px}.vpa .vt .sy{font:.8rem system-ui;color:#88c8b7}
.vpa .vc{flex:1;overflow:auto;padding:18px 24px 40px}.vpa .vc .lse{min-height:calc(100dvh - 130px)}
.vpa .vp{position:absolute;inset:0;background:#0b141bf2;z-index:5;overflow:auto;padding:26px 28px;display:none}.vpa .vp.on{display:block}.vpa .vp h2{font:400 2rem Georgia,serif;margin:0 0 12px;color:#f1ece2}
.vpa .vp .x{position:absolute;top:14px;right:18px;border:1px solid #ffffff22;background:none;color:#e6e8e4;border-radius:10px;padding:6px 12px;cursor:pointer}
.vpa .vp .rr{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #ffffff12}.vpa .vp .rr i{font-size:1.7rem;font-style:normal}.vpa .vp .rr p{margin:2px 0 0;color:#cfd6d4;font-size:.88rem}
.vpa .ls .lstop{display:none}.vpa .lse h1{font-size:clamp(2.6rem,6vw,5rem)}.vpa .lse .k{letter-spacing:.24em}
@media(max-width:700px){.vpa{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.vpa .vr{flex-direction:row;overflow-x:auto;border:0;border-bottom:1px solid #ffffff12;padding:6px;gap:2px;order:-1}.vpa .vr .lg,.vpa .vr .sp{display:none}.vpa .vr button{flex:1 0 auto;width:auto;flex-direction:row;gap:6px;padding:8px 12px}.vpa .vt{padding:10px 14px}.vpa .vt b{font-size:1.05rem}.vpa .vc{padding:10px 10px 30px}.vpa .vp{padding:18px 14px}}
</style>`;
    const ic = n => GV.ic ? GV.ic(n, 22) : '';
    it.mount = function (el) {
      document.body.classList.add('mpvip'); el.innerHTML = '';
      const root = document.createElement('div'); root.className = 'vpa';
      root.innerHTML = css + `<div class="vr"><div class="lg"><svg viewBox="0 0 32 32" width="34" height="34" fill="none" stroke="#dfbc7a" stroke-width="1.5" stroke-linecap="round"><circle cx="16" cy="16" r="13"/><path d="M9 12l3 3M23 12l-3 3M11 21c3 2 7 2 10 0M12 8l-2-4M20 8l2-4"/></svg></div>
<button data-p="" class="on">${ic('home')}<span>Phòng</span></button><button data-p="stats">${ic('trend')}<span>Thống kê</span></button><button data-p="rules">${ic('info')}<span>Luật chơi</span></button><div class="sp"></div><button data-p="exit">${ic('back')}<span>OmniHub</span></button></div>
<div class="vm"><div class="vt"><div><b>MA SÓI</b><small>LỜI NGUYỀN LÀNG SƯƠNG</small></div><div class="sy">● Đồng bộ phòng</div></div><div class="vc"></div></div><div class="vp"><button class="x">Đóng ✕</button><div class="vb"></div></div>`;
      el.appendChild(root);
      const host = root.querySelector('.vc'), panel = root.querySelector('.vp'), pb = root.querySelector('.vb');
      const rulesH = () => '<h2>Luật chơi</h2>' + Object.values(ROLES).map(r => `<div class="rr"><i>${r.i}</i><div><b>${r.n}</b> <span style="color:#98a8ae;font-size:.8rem">(${r.team === 'wolf' ? 'phe Sói' : 'phe Dân'})</span><p>${esc(r.d)}</p></div></div>`).join('');
      const statsH = () => { const st = Object.assign(freshSt(), GV.store.get('ls_stats', {})), pc = st.played ? Math.round(st.won / st.played * 100) : 0;
        return `<h2>Thống kê của bạn</h2><p>Đã chơi <b>${st.played}</b> ván · thắng <b>${st.won}</b> (${pc}%) · chuỗi thắng tốt nhất <b>${st.bestStreak}</b></p><p style="color:#98a8ae">Phe Dân thắng ${st.villageWins} · phe Sói thắng ${st.wolfWins}. Dữ liệu chỉ lưu trên máy này.</p><h3 style="font:400 1.2rem Georgia,serif;margin-top:14px">Thành tích (${st.unlocked.length}/${ACH.length})</h3>` + ACH.map(a => `<div style="padding:6px 0;opacity:${st.unlocked.includes(a[0]) ? 1 : .45}">${a[1]} <b>${esc(a[2])}</b> – ${esc(a[3])}</div>`).join(''); };
      root.querySelector('.vr').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; const k = b.dataset.p;
        if (k === 'exit') { location.hash = '#/'; return; }
        root.querySelectorAll('.vr button').forEach(x => x.classList.toggle('on', x === b));
        if (!k) { panel.classList.remove('on'); return; } pb.innerHTML = k === 'rules' ? rulesH() : statsH(); panel.classList.add('on'); });
      root.querySelector('.x').onclick = () => { panel.classList.remove('on'); root.querySelectorAll('.vr button').forEach((x, i) => x.classList.toggle('on', i === 0)); };
      const off = orig(host);
      return () => { document.body.classList.remove('mpvip'); if (typeof off === 'function') off(); };
    };
  })();
  GV.lsT = { ROLES, rolesFor, VILLAGES, face, parseCfg, autoCfg, cfgError, VC: GV.mpShell.VC };
})();
