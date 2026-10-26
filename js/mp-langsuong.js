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
      if (S.step === 'guard' && role === 'guard') return { t: 'guard', target: pick(al) };
      if (S.step === 'wolves' && role === 'wolf') return { t: 'bite', target: pick(al.filter(i => S.roles[i] !== 'wolf')) };
      if (S.step === 'seer' && role === 'seer') { const seen = (S.seerLog[id] || []).map(x => x.target); const t = pick(others.filter(i => !seen.includes(i))); return t ? { t: 'peek', target: t } : null; }
      if (S.step === 'witch' && role === 'witch') {
        if (S.victim && S.witch.heal && Math.random() < .55) return { t: 'witch', heal: true };
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

  /* ---------- hình chân dung (SVG tự vẽ, theo seed) ---------- */
  const SKIN = ['#f1c9a5', '#e0ac85', '#c98e64', '#a86f4c', '#f5d6bd'], HAIR = ['#2b1d14', '#4a2f1d', '#6b4a2b', '#1c1c22', '#8a6a3c', '#5a3a4a', '#c9c2b8'], CLOTH = ['#3d5a5b', '#5b4a3a', '#4a3d5b', '#2f4a3a', '#5b3a3a', '#3a4a5b'];
  function face(seed, st) {
    let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const s = SKIN[h % 5], hr = HAIR[(h >> 3) % 7], cl = CLOTH[(h >> 6) % 6], style = (h >> 9) % 3;
    const hair = style === 0 ? `<path d="M22 44c0-16 9-25 18-25s18 9 18 25c-3-9-9-13-18-13s-15 4-18 13z" fill="${hr}"/>`
      : style === 1 ? `<path d="M20 50c-1-20 8-31 20-31s21 11 20 31l-4-1c0-12-6-18-16-19-10 1-16 7-16 19z" fill="${hr}"/>`
        : `<path d="M24 40c1-13 8-20 16-20 9 0 15 7 16 20-5-5-10-7-16-7s-11 2-16 7z" fill="${hr}"/><path d="M22 34q18-20 36 0q-2-12-18-14q-16 2-18 14z" fill="${hr}" opacity=".8"/>`;
    return `<svg viewBox="0 0 80 80" class="lsface${st === 'dead' ? ' dead' : ''}" aria-hidden="true"><defs><radialGradient id="g${h}" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#2a4048"/><stop offset="1" stop-color="#0f1b22"/></radialGradient></defs>
<circle cx="40" cy="40" r="39" fill="url(#g${h})"/><path d="M14 80c2-15 12-22 26-22s24 7 26 22z" fill="${cl}"/><rect x="35" y="50" width="10" height="10" rx="4" fill="${s}"/><ellipse cx="40" cy="41" rx="14" ry="16" fill="${s}"/>${hair}
<circle cx="35" cy="42" r="1.6" fill="#2a1e18"/><circle cx="45" cy="42" r="1.6" fill="#2a1e18"/><path d="M36 50q4 2.5 8 0" stroke="#7a4a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`;
  }

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
@media(max-width:600px){.ls{padding:10px;border-radius:14px}.ls h3{font-size:1.25rem}.ls .lsst span{font-size:.62rem;padding:6px 2px}.ls .lsgr{grid-template-columns:repeat(4,1fr);gap:6px}.ls .lsp svg{width:48px;height:48px}.ls .lsp b{font-size:.76rem}.ls .lsscene .lsn{font-size:.98rem}}
@media(max-width:380px){.ls .lsgr{grid-template-columns:repeat(3,1fr)}}`;



  /* ---------- voice chat (WebRTC mesh, tín hiệu qua mprooms/<mã>/voice/<nhận>/<gửi>) ---------- */
  const ICE = () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }].concat(window.GV_TURN || []) });
  const VC = { on: false, stream: null, pcs: {}, auds: {}, muted: false, ref: null, me: null, off: null, seen: {}, level: 0, ac: null, forced: false };
  function vcSend(to, msg) { VC.ref.child(`voice/${to}/${VC.me}`).push(msg).catch(() => {}); }
  function vcPeer(id, initiator) {
    if (VC.pcs[id]) return VC.pcs[id];
    const pc = new RTCPeerConnection(ICE()); VC.pcs[id] = pc;
    VC.stream.getTracks().forEach(t => pc.addTrack(t, VC.stream));
    pc.onicecandidate = e => { if (e.candidate) vcSend(id, { t: 'ice', d: JSON.stringify(e.candidate) }); };
    pc.ontrack = e => { let a = VC.auds[id]; if (!a) { a = VC.auds[id] = new Audio(); a.autoplay = true; a.playsInline = true; } a.srcObject = e.streams[0]; a.play().catch(() => {}); };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) vcDrop(id); };
    if (initiator) pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => vcSend(id, { t: 'offer', d: JSON.stringify(pc.localDescription) })).catch(() => {});
    return pc;
  }
  function vcDrop(id) { const pc = VC.pcs[id]; if (pc) try { pc.close(); } catch (e) {} delete VC.pcs[id]; const a = VC.auds[id]; if (a) { a.srcObject = null; delete VC.auds[id]; } }
  async function vcInbox(snap) {
    const box = snap.val() || {};
    for (const from in box) for (const k in box[from] || {}) {
      if (VC.seen[k]) continue; VC.seen[k] = 1; const m = box[from][k]; VC.ref.child(`voice/${VC.me}/${from}/${k}`).remove().catch(() => {});
      try {
        if (m.t === 'offer') { vcDrop(from); const pc = vcPeer(from, false); await pc.setRemoteDescription(JSON.parse(m.d)); const an = await pc.createAnswer(); await pc.setLocalDescription(an); vcSend(from, { t: 'answer', d: JSON.stringify(pc.localDescription) }); }
        else if (m.t === 'answer' && VC.pcs[from]) await VC.pcs[from].setRemoteDescription(JSON.parse(m.d));
        else if (m.t === 'ice' && VC.pcs[from]) await VC.pcs[from].addIceCandidate(JSON.parse(m.d));
      } catch (e) { console.warn('voice', e); }
    }
  }
  async function vcJoin(L) {
    if (VC.on) return;
    if (!navigator.mediaDevices || !window.RTCPeerConnection) { L.toast('Trình duyệt không hỗ trợ voice chat.'); return; }
    try { VC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { L.toast('Không mở được micro: ' + (e.name === 'NotAllowedError' ? 'bạn chưa cho phép' : e.message)); return; }
    VC.on = true; VC.ref = L.roomRef; VC.me = L.me; VC.seen = {};
    const inbox = VC.ref.child('voice/' + VC.me); inbox.on('value', vcInbox); VC.off = () => inbox.off('value', vcInbox);
    VC.ref.child(`players/${VC.me}/vc`).set(true); VC.ref.child(`players/${VC.me}/vc`).onDisconnect().remove();
    try { const ac = VC.ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser(); an.fftSize = 256; ac.createMediaStreamSource(VC.stream).connect(an); const buf = new Uint8Array(an.frequencyBinCount);
      VC.lt = setInterval(() => { an.getByteFrequencyData(buf); VC.level = buf.reduce((a, b) => a + b, 0) / buf.length; const sp = VC.level > 18 && !VC.muted && !VC.forced; if (sp !== VC.sp) { VC.sp = sp; VC.ref.child(`players/${VC.me}/sp`).set(sp || null).catch(() => {}); } }, 300); } catch (e) {}
    vcApply(); L.toast('🎙 Đã vào voice chat');
  }
  function vcLeave() {
    if (!VC.on) return; VC.on = false; clearInterval(VC.lt); if (VC.off) VC.off(); Object.keys(VC.pcs).forEach(vcDrop);
    if (VC.stream) VC.stream.getTracks().forEach(t => t.stop()); VC.stream = null; if (VC.ac) VC.ac.close().catch(() => {}); VC.ac = null;
    if (VC.ref) { VC.ref.child(`players/${VC.me}/vc`).remove().catch(() => {}); VC.ref.child(`players/${VC.me}/sp`).remove().catch(() => {}); VC.ref.child(`voice/${VC.me}`).remove().catch(() => {}); }
  }
  const vcApply = () => { if (VC.stream) VC.stream.getAudioTracks().forEach(t => { t.enabled = !VC.muted && !VC.forced; }); };
  // mỗi lần phòng thay đổi: nối/ngắt với ai đang bật voice; người có id nhỏ hơn chủ động gọi
  function vcSync(L) {
    if (!VC.on) return;
    const peers = Object.entries(L.R.players || {}).filter(([id, p]) => id !== VC.me && p && p.vc && p.online !== false).map(([id]) => id);
    Object.keys(VC.pcs).filter(id => !peers.includes(id)).forEach(vcDrop);
    peers.forEach(id => { if (!VC.pcs[id] && VC.me < id) vcPeer(id, true); });
    // luật phòng: ban đêm tắt mic của mọi người; người đã chết chỉ được nghe
    const pub = L.pub || {}, playing = L.status === 'playing', dead = playing && pub.alive && pub.alive[VC.me] === false;
    const f = playing && (pub.phase === 'night' || dead); if (f !== VC.forced) { VC.forced = f; vcApply(); }
  }

  /* ---------- thông báo sự kiện vào chat (chỉ chủ phòng đăng, khoá idempotent) ---------- */
  const EV = { seats: null, logN: {} };
  function events(L) {
    if (!L.isHost) return;
    const chat = L.roomRef.child('chat'), say = (k, text) => chat.child(k).set({ uid: L.me, name: 'Hệ thống', sys: 1, text: text.slice(0, 200), at: Date.now() }).catch(() => {});
    const cur = Object.fromEntries(L.seats.filter(s => !s.bot).map(s => [s.id, s]));
    if (EV.seats && EV.code === L.code) {
      Object.values(cur).forEach(s => { if (!EV.seats[s.id]) say('sj_' + s.id.slice(0, 12) + '_' + (s.at || 0), `${s.name} đã tham gia phòng`); else if (EV.seats[s.id].online && !s.online) say('so_' + s.id.slice(0, 12) + '_' + Date.now(), `${s.name} mất kết nối`); });
      Object.keys(EV.seats).forEach(id => { if (!cur[id]) say('sl_' + id.slice(0, 12) + '_' + Date.now(), `${EV.seats[id].name} đã rời phòng`); });
    }
    EV.seats = cur; EV.code = L.code;
    const lg = (L.pub && L.pub.log) || []; EV.done = EV.done || new Set();
    // log công khai (30 dòng cuối) → chat; khoá theo nội dung nên tải lại trang cũng không đăng trùng
    if (L.status !== 'lobby') lg.forEach(t => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; const k = `se_${L.code}_${L.round}_${h.toString(36)}`; if (!EV.done.has(k)) { EV.done.add(k); say(k.replace('se_' + L.code + '_', 'se_'), t); } });
  }

  /* ---------- giao diện phòng chờ (máy chủ game) theo ảnh mẫu ---------- */
  const SCENE = `<svg class="lsr-bg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="lsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1a2b"/><stop offset="1" stop-color="#1b2c3a"/></linearGradient><radialGradient id="lsmo"><stop offset="0" stop-color="#f4f1e2"/><stop offset=".6" stop-color="#d9d6c4"/><stop offset="1" stop-color="#d9d6c400"/></radialGradient></defs>
<rect width="800" height="300" fill="url(#lsk)"/><circle cx="660" cy="60" r="46" fill="url(#lsmo)" opacity=".35"/><circle cx="660" cy="60" r="24" fill="#ecead8"/>
${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 53) % 130}" r="${i % 3 ? .7 : 1.2}" fill="#fff" opacity="${.3 + (i % 4) * .15}"/>`).join('')}
<path d="M0 190 L80 120 L150 170 L240 95 L330 165 L420 110 L520 175 L610 120 L700 170 L800 130 V300 H0Z" fill="#16222d"/>
<path d="M0 230 L40 200 L70 215 L110 180 L150 220 L200 195 L260 225 L320 200 L380 230 L450 205 L520 232 L590 200 L660 228 L730 205 L800 225 V300 H0Z" fill="#101a22"/>
<g fill="#0b1218">${[30, 95, 160, 610, 690, 760].map((x, i) => `<path d="M${x} 300 L${x + 14} ${190 + i % 3 * 12} L${x + 28} 300Z"/>`).join('')}<rect x="560" y="150" width="14" height="90"/><path d="M552 152 L567 108 L582 152Z"/>
<path d="M210 300V232l30-22 30 22v68z"/><path d="M300 300V240l22-16 22 16v60z"/><path d="M470 300V228l34-24 34 24v72z"/><path d="M380 300V246l18-13 18 13v54z"/></g>
<g fill="#f0b45a">${[[232, 250], [250, 250], [316, 258], [492, 246], [514, 246], [396, 262], [565, 175]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="9" opacity=".9"/>`).join('')}</g>
<rect class="lsfog" x="-200" y="215" width="1200" height="60" fill="#c9d6dc" opacity=".09"/><rect class="lsfog b" x="-200" y="245" width="1200" height="50" fill="#c9d6dc" opacity=".08"/></svg>`;
  const RCSS = `
.lsroom{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;align-items:start;text-align:left;color:#e6e8e4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
.lsroom .lsr-box{background:#0f1a24;border:1px solid #ffffff14;border-radius:14px}
.lsroom .lsr-head{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;padding:12px 16px}.lsroom .lsr-head h2{margin:0;font-size:1.25rem;color:#f1ece2}.lsroom .lsr-head .code{font:700 1.25rem system-ui;color:#f1ece2;letter-spacing:.04em}
.lsroom .lsr-cd{display:inline-flex;gap:6px;align-items:center;font-size:.85rem;color:#98a8ae}.lsroom .lsr-cd b{background:#16304a;border:1px solid #2f5d86;color:#8fc8ff;padding:2px 8px;border-radius:6px;letter-spacing:.08em}
.lsroom .lsr-sp{flex:1}.lsroom .lsr-pl{display:inline-flex;gap:6px;align-items:center;font-size:.86rem}.lsroom .lsr-st{background:#10b98122;color:#4ade80;border-radius:99px;padding:3px 10px;font-size:.8rem;font-weight:600}.lsroom .lsr-st.play{background:#dfbc7a22;color:#dfbc7a}
.lsroom .lsr-ib{width:38px;height:38px;border-radius:50%;border:1px solid #ffffff24;background:#132232;color:#cfe;cursor:pointer;font-size:1rem;display:inline-grid;place-items:center;padding:0}.lsroom .lsr-ib.rd{color:#f87171;border-color:#f8717155}
.lsroom .lsr-scene{position:relative;overflow:hidden;border-radius:14px;margin-top:12px;min-height:300px;padding:22px 12px 18px;text-align:center;border:1px solid #ffffff14}
.lsroom .lsr-bg{position:absolute;inset:0;width:100%;height:100%;z-index:0}.lsroom .lsr-scene>*:not(svg){position:relative;z-index:1}
.lsroom .lsfog{animation:lsfog 18s linear infinite}.lsroom .lsfog.b{animation-duration:26s;animation-direction:reverse}@keyframes lsfog{50%{transform:translateX(120px)}}
.lsroom .lsr-scene h3{margin:0;font:600 1.15rem system-ui;color:#f3efe6;text-shadow:0 2px 8px #000}.lsroom .lsr-scene p{margin:4px 0 14px;font-size:.86rem;color:#c8d2d6;text-shadow:0 1px 4px #000}
.lsroom .lsr-ppl{display:grid;grid-template-columns:repeat(4,minmax(0,120px));justify-content:center;gap:14px 18px}
.lsroom .lsr-pp{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}.lsroom .lsr-av{position:relative;width:74px;height:74px;border-radius:50%;padding:3px;background:linear-gradient(#6aa7d8,#3a5f86)}
.lsroom .lsr-av.h{background:linear-gradient(#f0d08a,#9e7944)}.lsroom .lsr-av svg{width:100%;height:100%;display:block;border-radius:50%}.lsroom .lsr-av .dot{position:absolute;right:3px;bottom:3px;width:13px;height:13px;border-radius:50%;background:#22c55e;border:2px solid #0f1a24}.lsroom .lsr-av .dot.off{background:#6b7280}
.lsroom .lsr-av .ok{position:absolute;left:-2px;bottom:0;background:#22c55e;color:#04140a;border-radius:50%;width:18px;height:18px;font-size:11px;display:grid;place-items:center;font-weight:900}
.lsroom .lsr-pp b{font-size:.88rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 4px #000}.lsroom .lsr-pp small{font-size:.74rem;color:#b9c4c8}.lsroom .lsr-pp small.h{color:#dfbc7a}
.lsroom .lsr-pp.empty .lsr-av{background:#ffffff10;border:1px dashed #ffffff40}.lsroom .lsr-pp.empty .lsr-av span{display:grid;place-items:center;height:100%;color:#ffffff55;font-size:1.4rem}
.lsroom .lobby{margin-top:12px}.lsroom .lsr-row{display:grid;grid-template-columns:1fr 1.5fr 1fr;gap:0}.lsroom .lsr-row>div{padding:14px 16px;border-right:1px solid #ffffff12}.lsroom .lsr-row>div:last-child{border:0}
.lsroom h4{margin:0 0 10px;font-size:.95rem;color:#f1ece2}.lsroom .lsr-kv{display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:.85rem}.lsroom .lsr-kv span{color:#98a8ae}.lsroom .lsr-kv b{text-align:right;font-weight:500;color:#e6e8e4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lsroom .lsr-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lsroom .lsr-rc{background:#132232;border:1px solid #ffffff14;border-radius:12px;padding:8px 4px;text-align:center}.lsroom .lsr-rc i{font-style:normal;font-size:1.6rem;display:block}
.lsroom .lsr-rc small{display:block;font-size:.76rem;color:#cfd6d4}.lsroom .lsr-rc .n{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:4px;font-weight:700}.lsroom .lsr-rc button{width:24px;height:24px;border-radius:50%;border:1px solid #ffffff30;background:#0f1a24;color:#e6e8e4;cursor:pointer;padding:0;line-height:1}
.lsroom .lsr-rc button:disabled{opacity:.3;cursor:default}.lsroom .lsr-note{font-size:.76rem;color:#98a8ae;margin-top:8px}.lsroom .lsr-warn{color:#fca5a5;font-size:.8rem;margin-top:6px}
.lsroom .lsr-mode{display:flex;gap:6px;margin-bottom:8px}.lsroom .lsr-mode button{flex:1;border-radius:8px;border:1px solid #ffffff24;background:none;color:#cfd6d4;padding:5px;font-size:.78rem;cursor:pointer}.lsroom .lsr-mode button.on{background:#dfbc7a22;border-color:#dfbc7a;color:#dfbc7a}
.lsroom .lsr-qa{display:flex;flex-direction:column;gap:8px}.lsroom .lsr-qa button{border-radius:8px;border:1px solid #2f4a66;background:#0f1d2b;color:#e6e8e4;padding:9px 10px;font-size:.86rem;cursor:pointer;font-weight:600}
.lsroom .lsr-qa .go{background:linear-gradient(#22a565,#15804c);border-color:#22c55e;font-size:1rem;padding:12px}.lsroom .lsr-qa .rdy{background:#15804c33;border-color:#22c55e;color:#86efac}.lsroom .lsr-qa .rdy.on{background:#22c55e;color:#04140a}
.lsroom .lsr-qa .out{color:#fca5a5;border-color:#7f1d1d}.lsroom .hostctl{display:flex;gap:6px;flex-wrap:wrap}.lsroom .hostctl button{flex:1;font-size:.76rem;padding:6px}
.lsroom .lsr-rb{display:flex;align-items:center;gap:14px;padding:14px 16px;margin-top:12px;flex-wrap:wrap}.lsroom .lsr-rb .bar{flex:1;min-width:120px;height:10px;background:#1f2d3a;border-radius:99px;overflow:hidden}.lsroom .lsr-rb .bar i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#4ade80)}
.lsroom .lsr-rb .avs{display:flex;gap:4px;flex-wrap:wrap}.lsroom .lsr-rb .avs span{position:relative;width:34px;height:34px}.lsroom .lsr-rb .avs svg{width:34px;height:34px;border-radius:50%}.lsroom .lsr-rb .avs span.no svg{opacity:.4;filter:grayscale(1)}.lsroom .lsr-rb .avs span.y:after{content:'✓';position:absolute;right:-2px;bottom:-2px;background:#22c55e;color:#04140a;border-radius:50%;width:14px;height:14px;font-size:9px;display:grid;place-items:center;font-weight:900}
.lsroom .lsr-rb .all{color:#4ade80;font-size:.8rem;border:1px solid #22c55e55;border-radius:8px;padding:5px 10px}
.lsroom .lsr-side{display:flex;flex-direction:column;gap:12px;position:sticky;top:8px}.lsroom .lsr-me{display:flex;gap:12px;align-items:center;padding:14px}.lsroom .lsr-me svg{width:58px;height:58px;border-radius:50%;border:2px solid #dfbc7a}.lsroom .lsr-me b{font-size:1.05rem}.lsroom .lsr-me small{display:block;color:#dfbc7a;font-size:.8rem}
.lsroom .lsr-tabs{display:flex;margin:10px 10px 0;border-bottom:1px solid #ffffff14}.lsroom .lsr-tabs button{flex:1;background:none;border:0;color:#98a8ae;padding:9px 4px;cursor:pointer;font-weight:600;border-radius:8px 8px 0 0}.lsroom .lsr-tabs button.on{background:#16304a;color:#f1ece2}
.lsroom .lsr-pane{padding:10px}.lsroom .lsr-pane[hidden]{display:none}.lsroom .chat .cl{max-height:420px;min-height:220px;overflow:auto;font-size:.88rem}.lsroom .lsr-msg{display:flex;gap:9px;padding:7px 2px}.lsroom .lsr-msg svg{width:34px;height:34px;border-radius:50%;flex:none}
.lsroom .lsr-msg b{color:#8fc8ff;font-weight:600}.lsroom .lsr-msg time{color:#6b7c86;font-size:.72rem;margin-left:6px}.lsroom .lsr-msg p{margin:2px 0 0;color:#e6e8e4;word-break:break-word}
.lsroom .lsr-in{display:flex;gap:6px;margin-top:8px}.lsroom .lsr-in input{flex:1;background:#0b141b;border:1px solid #ffffff24;border-radius:10px;color:#e6e8e4;padding:9px 10px;font-size:16px}.lsroom .lsr-in button{border-radius:10px;border:0;background:#16304a;color:#8fc8ff;padding:0 14px;cursor:pointer;font-size:1.1rem}
.lsroom .err{color:#fca5a5;min-height:1em;text-align:center;font-weight:600}.lsroom .hl{font-size:.84rem}.lsroom .hostend{margin-top:10px;text-align:center}
.lsroom .lsr-rl div{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #ffffff12;font-size:.82rem}.lsroom .lsr-rl i{font-style:normal;font-size:1.3rem}.lsroom .lsr-rl p{margin:2px 0 0;color:#b9c4c8}
.lsroom .lsr-pp small.y{color:#4ade80}.lsroom .lsr-pp small.off{color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;font-size:.66rem}.lsroom .lsr-pp .vcb{font-size:.7rem;opacity:.6}.lsroom .lsr-pp .vcb.sp{opacity:1;filter:drop-shadow(0 0 4px #4ade80)}
.lsroom .lsr-fire{position:relative;width:60px;height:46px;margin:6px auto 0}.lsroom .lsr-fire:before{content:'';position:absolute;left:-60px;right:-60px;bottom:-14px;height:60px;background:radial-gradient(closest-side,#f59e0b66,#f59e0b00);animation:lsglow 2s ease-in-out infinite}
.lsroom .lsr-fire i{position:absolute;bottom:4px;left:50%;width:22px;height:34px;margin-left:-11px;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 80%,#fff4c2,#fbbf24 40%,#f97316 70%,#f9731600);transform-origin:50% 100%;animation:lsfl2 .9s ease-in-out infinite alternate}
.lsroom .lsr-fire i:nth-child(2){width:16px;height:24px;margin-left:-20px;animation-delay:.2s}.lsroom .lsr-fire i:nth-child(3){width:16px;height:26px;margin-left:4px;animation-delay:.45s}.lsroom .lsr-fire:after{content:'';position:absolute;left:8px;right:8px;bottom:0;height:7px;border-radius:4px;background:#5b3a1e;box-shadow:0 -2px 0 #3b2612}
@keyframes lsfl2{to{transform:scaleY(1.18) skewX(4deg)}}@keyframes lsglow{50%{opacity:.6}}
.lsroom .lsr-vc,.lsroom .lsr-ctl{padding:12px}.lsroom .lsr-vc .vh{display:flex;justify-content:space-between;font-size:.9rem}.lsroom .lsr-vc .vst{color:#98a8ae;font-size:.78rem}.lsroom .lsr-vc .vl{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.lsroom .lsr-vc .vl span{display:flex;flex-direction:column;align-items:center;font-size:.7rem;width:48px}.lsroom .lsr-vc .vl svg{width:36px;height:36px;border-radius:50%;border:2px solid transparent}.lsroom .lsr-vc .vl span.sp svg{border-color:#4ade80;box-shadow:0 0 10px #4ade80}.lsroom .lsr-vc .vl em{font-style:normal;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lsroom .lsr-vc .vb{display:flex;gap:6px}.lsroom .lsr-vc button,.lsroom .lsr-ctl button{flex:1;border-radius:8px;border:1px solid #2f4a66;background:#0f1d2b;color:#e6e8e4;padding:8px;cursor:pointer;font-weight:600;font-size:.84rem}.lsroom .lsr-vc .vnote{font-size:.72rem;color:#6b7c86;margin-top:6px}
.lsroom .lsr-ctl .cinfo{font-size:.82rem;color:#cfd6d4;margin:6px 0 8px}.lsroom .lsr-ctl button{width:100%;border-color:#dfbc7a77;color:#dfbc7a}
.lsroom .lsr-msg.sys{background:#10b98114;border-radius:8px;padding:6px 8px}.lsroom .lsr-msg.sys b{color:#4ade80}.lsroom .lsr-msg .si{width:34px;text-align:center;font-size:1.2rem}
@media(max-width:980px){.lsroom{grid-template-columns:1fr}.lsroom .lsr-side{position:static}}
@media(max-width:700px){.lsroom .lsr-row{grid-template-columns:1fr}.lsroom .lsr-row>div{border-right:0;border-bottom:1px solid #ffffff12}.lsroom .lsr-ppl{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 6px}.lsroom .lsr-av{width:56px;height:56px}.lsroom .lsr-scene{min-height:0;padding:16px 8px}
.lsroom .lsr-head{padding:10px 12px}.lsroom .lsr-head .lsr-sp{display:none}.lsroom .lsr-me{padding:10px}}`;
  const RLIST = ['wolf', 'villager', 'seer', 'guard', 'witch', 'hunter'];
  const hm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function roomTpl({ code }) {
    return `<div class="mp lsroom"><div class="lsr-main">
<div class="lsr-box lsr-head"><h2>Phòng #<span class="code">${code}</span></h2><span class="lsr-cd">Mã phòng: <b>${code}</b><button class="lsr-ib lsr-copy" title="Sao chép mã phòng" style="width:28px;height:28px">⧉</button></span><span class="lsr-sp"></span>
<span class="lsr-pl">👥 <span class="lsr-cnt"></span></span><span class="lsr-st">● Đang chờ</span><button class="lsr-ib share" title="Chia sẻ link mời">🔗</button><button class="lsr-ib lsr-gear" title="Cấu hình vai">⚙</button><button class="lsr-ib rd leave" title="Rời phòng">⎋</button></div>
<div class="lsr-scene">${SCENE}<h3 class="lsr-ttl">Làng Sương đang chờ…</h3><p class="lsr-sub"></p><div class="lsr-ppl"></div><div class="lsr-fire" aria-hidden="true"><i></i><i></i><i></i></div></div>
<div class="seats" hidden></div><div class="err"></div><div class="game" hidden></div>
<div class="lobby" hidden><div class="lsr-box lsr-row">
 <div><h4>Thông tin phòng</h4><div class="lsr-kv"><span>🏷 Tên phòng</span><b class="rname"></b><span>🔑 Mã phòng</span><b style="color:#8fc8ff">${code}</b><span>👥 Số người</span><b class="lsr-cnt2"></b><span>⏱ Trạng thái</span><b class="lsr-st2">Đang chờ</b><span>🎮 Chế độ</span><b class="lsr-md"></b></div></div>
 <div class="lsr-cfg"><h4>Danh sách vai <span style="font-weight:400;color:#98a8ae">(ẩn với người chơi)</span></h4><div class="lsr-mode"></div><div class="lsr-roles"></div><div class="lsr-warn"></div><div class="lsr-note">Vai sẽ được chia ngẫu nhiên và bí mật khi bắt đầu. Người chơi không xem được vai của nhau.</div></div>
 <div><h4>Hành động nhanh</h4><div class="lsr-qa"><button class="go lsr-go">▶ Bắt đầu trò chơi</button><button class="rdy lsr-rdy">✋ Tôi đã sẵn sàng</button><button class="lsr-guide">📖 Xem hướng dẫn</button><button class="lsr-copy2">⧉ Sao chép link mời</button><button class="out lsr-out">⎋ Rời phòng</button>
 <div class="hostctl" hidden><button class="btn ghost addbot">🤖 + Bot</button><button class="btn ghost rmbot">🤖 − Bot</button><button class="btn bad closeroom">⛔ Đóng</button><button class="start" hidden></button></div></div><div class="msg wait" style="font-size:.8rem;color:#98a8ae;margin-top:6px"></div></div>
</div><div class="lsr-box lsr-rb"><b style="font-size:.92rem">Trạng thái sẵn sàng</b><div class="bar"><i></i></div><span class="lsr-rn"></span><div class="avs"></div><span class="all"></span></div></div>
<div class="hostend" hidden><button class="btn newg">🔄 Ván mới (về phòng chờ)</button></div></div>
<div class="lsr-side"><div class="lsr-box lsr-me"></div><div class="lsr-box lsr-vc"><div class="vh"><b>🎙 Voice chat</b><span class="vst"></span></div><div class="vl"></div><div class="vb"><button class="vjoin">🎧 Tham gia voice</button><button class="vmute" hidden>🎙 Tắt mic</button></div><div class="vnote">Ban đêm mic tự tắt; người đã chết chỉ được nghe.</div></div><div class="lsr-box lsr-ctl" hidden><b>🎛 Điều phối ván (chủ phòng)</b><div class="cinfo"></div><button class="vskip">⏭ Chuyển pha ngay</button></div><div class="lsr-box"><div class="lsr-tabs"><button data-st="chat" class="on">Chat</button><button data-st="hist">Lịch sử</button><button data-st="roles">Vai trò</button></div>
<div class="lsr-pane chat" data-sp="chat"><div class="cl"></div><div class="lsr-in"><input class="ci" maxlength="200" placeholder="Nhập tin nhắn…"><button class="cs" title="Gửi">➤</button></div></div>
<div class="lsr-pane hst" data-sp="hist" hidden><div class="hl hint">Chưa có ván nào.</div><div class="row hostclr" hidden style="margin-top:6px"><button class="btn ghost clh" style="padding:5px 12px">🗑 Xoá lịch sử</button></div></div>
<div class="lsr-pane" data-sp="roles" hidden><div class="lsr-rl">${RLIST.map(k => `<div><i>${ROLES[k].i}</i><div><b>${ROLES[k].n}</b><p>${ROLES[k].d}</p></div></div>`).join('')}</div></div></div></div></div>`;
  }
  let bound = null;
  function roomRender(el, L) {
    const $ = q => el.querySelector(q), st = L.status, sl = L.seats, n = sl.length, lobby = st === 'lobby';
    const raw = L.hostOpts.cfg || 'auto', auto = raw === 'auto', err = cfgError(raw, Math.max(n, 5)), cfg = auto ? Object.assign(autoCfg(Math.max(n, 5))) : (parseCfg(raw, Math.max(n, 5)) || (() => { try { return JSON.parse(raw); } catch (e) { return autoCfg(n); } })());
    const vill = Math.max(0, Math.max(n, 5) - SPECIAL.reduce((t, k) => t + (+cfg[k] || 0), 0));
    const ready = s => s.bot || s.id === L.host || s.ready, rc = sl.filter(ready).length;
    $('.lsr-cnt').textContent = `${n} / 16 người`; $('.lsr-cnt2').textContent = `${n} / 16`;
    const stTxt = lobby ? '● Đang chờ' : st === 'playing' ? '● Đang chơi' : '● Đã kết thúc';
    $('.lsr-st').textContent = stTxt; $('.lsr-st').classList.toggle('play', !lobby); $('.lsr-st2').textContent = stTxt.slice(2);
    $('.lsr-md').textContent = auto ? 'Tự động theo số người' : 'Tuỳ chỉnh vai';
    $('.lsr-scene').hidden = !lobby;
    $('.lsr-sub').textContent = n < 5 ? `Cần ít nhất 5 người (đang có ${n}). Mời thêm bạn hoặc thêm bot.` : rc === n ? 'Tất cả đã sẵn sàng. Chủ phòng có thể bắt đầu trò chơi.' : `Đang chờ ${n - rc} người sẵn sàng…`;
    const faceOf = s => s.bot ? face('bot' + s.name) : face(s.id);
    const cards = sl.map(s => `<div class="lsr-pp"><div class="lsr-av${s.id === L.host ? ' h' : ''}">${faceOf(s)}<span class="dot${s.online ? '' : ' off'}"></span>${ready(s) && s.id !== L.host ? '<span class="ok">✓</span>' : ''}</div><b>${s.id === L.host ? '👑 ' : s.bot ? '🤖 ' : ''}${L.esc(s.name)}${s.id === L.me ? ' (bạn)' : ''}</b><small class="${s.id === L.host ? 'h' : !s.online ? 'off' : ready(s) ? 'y' : ''}">${!s.online ? 'Mất kết nối' : s.id === L.host ? 'Chủ phòng' : s.bot ? 'Bot' : ready(s) ? 'Sẵn sàng!' : 'Chưa sẵn sàng'}</small>${(L.R.players[s.id] || {}).vc ? `<small class="vcb${(L.R.players[s.id] || {}).sp ? ' sp' : ''}">🎙</small>` : ''}</div>`);
    const empty = Math.max(0, 8 - n); for (let i = 0; i < empty; i++) cards.push('<div class="lsr-pp empty"><div class="lsr-av"><span>+</span></div><b style="opacity:.5">Trống</b><small>Mời bạn</small></div>');
    $('.lsr-ppl').innerHTML = cards.join('');
    // cấu hình vai
    $('.lsr-mode').innerHTML = `<button data-m="auto" class="${auto ? 'on' : ''}" ${L.isHost ? '' : 'disabled'}>Tự động</button><button data-m="custom" class="${auto ? '' : 'on'}" ${L.isHost ? '' : 'disabled'}>Tuỳ chỉnh</button>`;
    const edit = L.isHost && !auto, mx = { wolf: 6, seer: 1, guard: 1, witch: 1, hunter: 1 };
    $('.lsr-roles').innerHTML = RLIST.map(k => { const v = k === 'villager' ? vill : +cfg[k] || 0; return `<div class="lsr-rc"><i>${ROLES[k].i}</i><small>${ROLES[k].n}</small><div class="n">${edit && k !== 'villager' ? `<button data-r="${k}" data-d="-1" ${v <= (k === 'wolf' ? 1 : 0) ? 'disabled' : ''}>−</button>` : ''}<span>${v}</span>${edit && k !== 'villager' ? `<button data-r="${k}" data-d="1" ${v >= mx[k] ? 'disabled' : ''}>+</button>` : ''}</div></div>`; }).join('');
    $('.lsr-warn').textContent = err || (n < 5 ? 'Số vai tính cho tối thiểu 5 người.' : '');
    // hành động
    $('.lsr-go').hidden = !L.isHost; $('.lsr-rdy').hidden = L.isHost; const meS = sl.find(s => s.id === L.me) || {};
    $('.lsr-rdy').classList.toggle('on', !!meS.ready); $('.lsr-rdy').textContent = meS.ready ? '✓ Đã sẵn sàng (bấm để huỷ)' : '✋ Tôi đã sẵn sàng';
    $('.lsr-go').disabled = n < 5 || !!err;
    $('.lsr-rb .bar i').style.width = (n ? rc / n * 100 : 0) + '%'; $('.lsr-rn').textContent = `${rc}/${n}`;
    $('.lsr-rb .avs').innerHTML = sl.map(s => `<span class="${ready(s) ? 'y' : 'no'}" title="${L.esc(s.name)}">${faceOf(s)}</span>`).join('');
    $('.lsr-rb .all').textContent = n && rc === n ? '✓ Tất cả đã sẵn sàng!' : `Còn ${n - rc} người chưa sẵn sàng`;
    const meSeat = sl.find(s => s.id === L.me);
    $('.lsr-me').innerHTML = `${face(L.me)}<div><b>${L.esc(meSeat ? meSeat.name : '')}</b>${L.isHost ? ' 👑' : ''}<small>${L.isHost ? 'Chủ phòng' : 'Người chơi'}</small></div>`;
    events(L); vcSync(L);
    const vp = sl.filter(s => (L.R.players[s.id] || {}).vc);
    $('.lsr-vc .vst').textContent = VC.on ? (VC.forced ? '🌙 mic bị khoá' : VC.muted ? 'mic đang tắt' : 'đang nói được') : `${vp.length} người đang trong voice`;
    $('.lsr-vc .vl').innerHTML = vp.map(s => `<span class="${(L.R.players[s.id] || {}).sp ? 'sp' : ''}" title="${L.esc(s.name)}">${face(s.id)}<em>${L.esc(s.name)}</em></span>`).join('') || '<span class="vnote">Chưa ai bật voice.</span>';
    $('.lsr-vc .vjoin').textContent = VC.on ? '📴 Rời voice' : '🎧 Tham gia voice'; $('.lsr-vc .vmute').hidden = !VC.on; $('.lsr-vc .vmute').textContent = VC.muted ? '🔇 Bật mic' : '🎙 Tắt mic'; $('.lsr-vc .vmute').disabled = VC.forced;
    const pb = L.pub || {}; $('.lsr-ctl').hidden = !(L.isHost && L.status === 'playing' && !pb.over);
    if (!$('.lsr-ctl').hidden) { const ph = { role: 'Nhận vai', night: 'Đêm ' + pb.day + (pb.step ? ' · ' + ({ guard: 'Bảo vệ', wolves: 'Ma Sói', seer: 'Tiên tri', witch: 'Phù thủy' })[pb.step] : ''), dawn: 'Bình minh', day: 'Hội đồng', vote: 'Bỏ phiếu', verdict: 'Phán quyết', hunter: 'Thợ săn' }[pb.phase] || ''; $('.lsr-ctl .cinfo').innerHTML = `Pha hiện tại: <b>${ph}</b> · còn sống ${Object.values(pb.alive || {}).filter(Boolean).length}/${(pb.order || []).length}`; }
    if (bound === el) return; bound = el;
    const copy = async (t, b) => { try { await navigator.clipboard.writeText(t); L.toast('Đã sao chép ✓'); } catch (e) { prompt('Sao chép:', t); } };
    const cur = () => roomRender.L;
    el.addEventListener('click', e => {
      const L2 = cur(), t = e.target.closest('button'); if (!t) return;
      if (t.classList.contains('lsr-copy')) return copy(L2.code);
      if (t.classList.contains('lsr-copy2')) return copy(L2.inviteUrl);
      if (t.classList.contains('lsr-out')) return el.querySelector('.leave').click();
      if (t.classList.contains('vjoin')) { VC.on ? vcLeave() : vcJoin(L2).then(() => roomRender(el, cur())); return roomRender(el, L2); }
      if (t.classList.contains('vmute')) { VC.muted = !VC.muted; vcApply(); return roomRender(el, L2); }
      if (t.classList.contains('vskip') && L2.isHost) { L2.roomRef.child('act/' + L2.me).set({ n: Date.now(), a: { t: 'skip' } }); return; }
      if (t.classList.contains('lsr-gear')) { el.querySelector('.lsr-cfg').scrollIntoView({ behavior: 'smooth', block: 'center' }); if (!L2.isHost) L2.toast('Chỉ chủ phòng chỉnh được vai.'); return; }
      if (t.classList.contains('lsr-guide')) { el.querySelector('[data-st=roles]').click(); el.querySelector('.lsr-side').scrollIntoView({ behavior: 'smooth' }); return; }
      if (t.classList.contains('lsr-rdy')) { const m = L2.seats.find(s => s.id === L2.me) || {}; return L2.setReady(!m.ready); }
      if (t.dataset.st) { el.querySelectorAll('.lsr-tabs button').forEach(b => b.classList.toggle('on', b === t)); el.querySelectorAll('.lsr-pane').forEach(p => { p.hidden = p.dataset.sp !== t.dataset.st; }); return; }
      if (t.dataset.m && L2.isHost) { const N = Math.max(L2.seats.length, 5); return L2.setOpt('cfg', t.dataset.m === 'auto' ? 'auto' : JSON.stringify(autoCfg(N))); }
      if (t.dataset.r && L2.isHost) { let c = {}; try { c = JSON.parse(L2.hostOpts.cfg); } catch (er) { c = autoCfg(Math.max(L2.seats.length, 5)); } c[t.dataset.r] = Math.max(0, (+c[t.dataset.r] || 0) + +t.dataset.d); return L2.setOpt('cfg', JSON.stringify(c)); }
      if (t.classList.contains('lsr-go') && L2.isHost) {
        const sl2 = L2.seats, notR = sl2.filter(s => !(s.bot || s.id === L2.host || s.ready));
        if (notR.length && !confirm(`Còn ${notR.length} người chưa sẵn sàng (${notR.map(s => s.name).join(', ')}). Vẫn bắt đầu?`)) return;
        L2.start();
      }
    });
  }
  function roomCleanup() { vcLeave(); EV.seats = null; bound = null; }
  function roomRenderWrap(el, L) { roomRender.L = L; if (bound && !document.body.contains(bound)) bound = null; roomRender(el, L); }
  const chatItem = (m, esc) => m.sys ? `<div class="lsr-msg sys"><span class="si">📣</span><div><b>Hệ thống</b><time>${hm(m.at)}</time><p>${esc(m.text)}</p></div></div>` : `<div class="lsr-msg">${face(m.uid)}<div><b>${esc(m.name)}</b><time>${hm(m.at)}</time><p>${esc(m.text)}</p></div></div>`;

  const NOTE = ['', '🐺', '✅', '❓']; // ghi chú cá nhân trên thẻ (lưu trên máy)

  GV.mp.define({
    id: 'langsuong', name: 'Ma Sói · Lời Nguyền Làng Sương', icon: '🌫️', min: 5, max: 16, css: CSS + RCSS, roomTpl, roomRender: roomRenderWrap, roomCleanup, chatItem,
    desc: 'Ma Sói online nhiều người theo phong cách truyện: nhận vai, đêm sương, bình minh, hội đồng làng, bỏ phiếu. 6 vai, 5–16 người, thiếu người có bot.',
    init(seats, api) {
      const hs = seats.find(x => x.id === api.host) || {}, now = Date.now(), roles = rolesFor(seats.length, api, (hs.opts || {}).cfg), v = api.rnd(VILLAGES.length), jobs = api.shuffle(JOBS.slice());
      const S = { order: seats.map(s => s.id), names: Object.fromEntries(seats.map(s => [s.id, s.name])), jobs: {}, roles: {}, alive: {}, dead: [], day: 1, log: [], over: null,
        phase: 'role', step: null, deadline: now + T.role, seen: {}, acted: {}, wolfVotes: {}, victim: null, saved: false, poisoned: null, guardPick: null,
        witch: { heal: 1, poison: 1 }, seerLog: {}, votes: {}, voted: {}, ready: {}, hunter: null, news: [], verdict: null, village: v, wchat: [] };
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
        if (S.step === 'guard' && role === 'guard' && a.t === 'guard') { if (a.target && !ok(a.target)) return 'Mục tiêu không hợp lệ.'; S.guardPick = a.target || null; S.acted[id] = 1; nextStep(S, now); return; }
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
          if (a.heal) { if (!S.witch.heal || !S.victim) return 'Không thể dùng thuốc cứu.'; S.saved = true; S.witch.heal = 0; }
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
      return { phase: S.phase, step: S.phase === 'night' ? S.step : null, day: S.day, deadline: S.deadline, order: S.order, names: S.names, jobs: S.jobs, alive: S.alive, dead: S.dead,
        log: S.log.slice(-30), village: S.village, news: S.phase === 'dawn' || S.phase === 'hunter' ? S.news : null, verdict: S.phase === 'verdict' ? S.verdict : null,
        votes: S.phase === 'vote' || S.phase === 'verdict' ? S.votes : null, voted: S.phase === 'vote' ? Object.keys(S.voted).length : 0, ready: S.phase === 'day' ? Object.keys(S.ready).length : 0,
        seen: S.phase === 'role' ? Object.keys(S.seen).length : 0, hunter: S.hunter ? S.hunter.id : null, over: S.over, turn: null };
    },
    priv(S, id) {
      const role = S.roles[id], p = { role, alive: !!S.alive[id], act: null };
      if (role === 'wolf') { p.allies = S.order.filter(i => S.roles[i] === 'wolf' && i !== id); p.wchat = S.wchat.slice(-20); if (S.phase === 'night' && S.step === 'wolves') p.picks = S.wolfVotes; }
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
      else if (p.phase === 'dawn' || p.phase === 'hunter') { em = '🌅'; const nw = p.news || []; nar = nw.length ? nw.map(d => `${nm(d.id)} đã ${deadHow[d.how] || 'chết'}. Họ là ${ROLES[d.role].n}.`).join(' ') : 'Sương tan. Đêm qua không ai mất mạng.'; meta = p.phase === 'hunter' ? `🏹 ${nm(p.hunter)} là Thợ săn – đang giương cung…${dl}` : `Ngày ${p.day}${dl}`; }
      else if (p.phase === 'day') { em = '🏛️'; nar = 'Dân làng tụ về quảng trường. Ai đang nói dối?'; meta = `Thảo luận ở Chat · sẵn sàng ${p.ready}/${al.length}${dl}`; }
      else if (p.phase === 'vote') { em = '🗳️'; nar = 'Mỗi người một lá phiếu. Chọn người đáng nghi nhất.'; meta = `Đã bỏ phiếu ${p.voted}/${al.length}${dl}`; }
      else if (p.phase === 'verdict') { em = '⚖️'; const v = p.verdict || {}; nar = v.id ? `Với ${v.n} phiếu, ${nm(v.id)} bị đưa lên giàn treo. Họ là ${ROLES[v.role].n}.` : v.tie ? 'Phiếu chia đôi. Làng chưa thể quyết định.' : 'Không ai bị buộc tội hôm nay.'; meta = dl.replace(' · ', ''); }
      // hành động của tôi
      let act = '', can = () => false;
      const sel = id => `${ui.sel === id ? 'sel' : ''}`;
      switch (me.act) {
        case 'seen': act = `<b>Bạn là ${R.i} ${R.n}</b><p style="margin:6px 0;font-size:.86rem">${R.d}</p>${me.allies && me.allies.length ? `<p class="lsdie">Đồng bọn: ${me.allies.map(nm).join(', ')}</p>` : ''}<button class="lsbtn" data-a="seen">Tôi đã nhớ vai</button>`; break;
        case 'guard': act = '<b>Che chở ai đêm nay?</b><div class="lsm">Chạm vào một thẻ (có thể chọn bản thân)</div><button class="lsbtn alt" data-a="guard-none">Không bảo vệ ai</button>'; can = i => true; break;
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
        const roleTxt = dd ? `<span class="lsdie">${ROLES[dd.role].i} ${ROLES[dd.role].n} · ${deadHow[dd.how] || ''}</span>` : p.over ? `${ROLES[p.over.roles[i]].i} ${ROLES[p.over.roles[i]].n}` : c.esc((p.jobs || {})[i] || '');
        return `<div class="lsp${dd ? ' isdead' : ''}${ck ? ' can' : ''}${isAlly ? ' ally' : ''} ${sel(i)}" data-pid="${i}">${vc[i] ? `<span class="lsvc">${vc[i]}</span>` : ''}${tag ? `<span class="lstag">${tag}</span>` : ''}${face(i, dd ? 'dead' : '')}${notes[i] ? `<span class="lsnote">${NOTE[notes[i]]}</span>` : ''}<b>${nm(i)}</b><small>${roleTxt}</small></div>`;
      }).join('');
      const tabs = [['board', 'Bàn chơi'], ['me', 'Vai của tôi'], ['book', 'Sổ tay'], ['rules', 'Luật']].map(([k, t]) => `<button data-tab="${k}" class="${ui.tab === k ? 'on' : ''}">${t}</button>`).join('');
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
      } else if (ui.tab === 'book') {
        body = `<div class="lslog">${(p.log || []).slice().reverse().map(l => `<div>${c.esc(l)}</div>`).join('')}</div>`;
      } else {
        body = `<div class="lsrl">${Object.values(ROLES).map(r => `<div><span>${r.i}</span><div><b>${r.n}</b> <span class="lsm">(${r.team === 'wolf' ? 'phe Sói' : 'phe Dân'})</span><p>${r.d}</p></div></div>`).join('')}</div>
<p class="lsm">Dân làng thắng khi loại hết Sói. Sói thắng khi số Sói còn sống bằng hoặc nhiều hơn số người còn lại. Người chết lộ vai. Phiếu hoà thì không ai bị treo.</p>`;
      }
      box.innerHTML = `<div class="ls"><div class="lsh"><div><div class="lsk">Lời nguyền · ván ${c.round}</div><h3>${c.esc(V[0])}</h3><p class="lsq">${c.esc(V[1])}</p></div>
<div class="lsc"><div><b>${al.length}</b><small>Còn sống</small></div><div class="d"><b>${String(dead.length).padStart(2, '0')}</b><small>Đã chết</small></div></div></div>
<div class="lsst">${stepper}</div><div class="lstb">${tabs}</div>${body}</div>`;
      const wi = box.querySelector('.lswi');
      if (wi) { if (ui.wtext) wi.value = ui.wtext; wi.oninput = () => { ui.wtext = wi.value; }; wi.onkeydown = e => { if (e.key === 'Enter' && wi.value.trim()) { c.send({ t: 'wchat', text: wi.value.trim() }); ui.wtext = ''; wi.value = ''; } }; if (ui.wfocus) { wi.focus(); } wi.onfocus = () => { ui.wfocus = 1; }; wi.onblur = () => { ui.wfocus = 0; }; }
      const setNote = id => { const n = GV.store.get('ls_notes_' + c.code + '_' + c.round, {}); n[id] = ((n[id] || 0) + 1) % NOTE.length; GV.store.set('ls_notes_' + c.code + '_' + c.round, n); this_render(); };
      const this_render = () => { const def = GV.mp.defs.langsuong; def.render(box, c); };
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
  GV.lsT = { ROLES, rolesFor, VILLAGES, face, parseCfg, autoCfg, cfgError, VC };
})();
