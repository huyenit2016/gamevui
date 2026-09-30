// Lớp học 1-1 online: video/âm thanh WebRTC giữa giáo viên và học viên (tín hiệu qua Firebase), kèm chat, bảng trắng, ghi chú chung, phụ đề trực tiếp.
(function () {
  const L = GV.learn, esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const ICE = () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }].concat(window.GV_TURN || []) });
  const COLORS = ['#111111', '#e5484d', '#3b82f6', '#2fb36b', '#f2b700'];

  GV.register({
    id: 'classroom', type: 'tool', cat: 'Học tập', name: 'Lớp học 1-1 online', icon: '🎓', desc: 'Giáo viên mở lớp, học viên vào học: video call, chat, bảng trắng, ghi chú chung.',
    mount(el) {
      const F = GV.fbInfo();
      let dead = false, cleanups = [], listOff = null;
      const addClean = f => cleanups.push(f);
      const hashCode = () => (location.hash.match(/classroom\/(\d{4})/) || [])[1] || '';

      function entry(err) {
        if (dead) return; if (listOff) listOff(), listOff = null;
        if (!F.cfg()) { el.innerHTML = '<p class="msg">Chưa cấu hình Firebase – xem FIREBASE.md.</p>'; return; }
        el.innerHTML = `<div class="tool" style="max-width:520px"><div class="big">🎓 Lớp học 1-1</div>
          <label>Tên của bạn <input class="nm" maxlength="20" style="width:100%" value="${esc(GV.store.get('lo_name', ''))}"></label>
          <div class="box" style="text-align:left"><b>👩‍🏫 Tôi là giáo viên – mở lớp</b>
            <input class="tt" placeholder="Chủ đề buổi học (vd: Giao tiếp tiếng Anh cơ bản)" style="width:100%;margin:6px 0"><div class="row" style="justify-content:flex-start"><select class="lg">${['en', 'ja', 'ko', 'zh', 'vi'].map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('')}</select><button class="btn mk">Mở lớp</button></div></div>
          <div class="box" style="text-align:left"><b>🧑‍🎓 Tôi là học viên – vào học</b><div class="rl hint" style="margin:6px 0">Đang tải danh sách lớp…</div>
            <div class="row" style="justify-content:flex-start"><input class="cd" inputmode="numeric" maxlength="4" placeholder="Mã lớp 4 số" style="width:130px;text-align:center" value="${hashCode()}"><button class="btn ghost jn">Vào lớp</button></div></div>
          <p class="msg">${err ? esc(err) : ''}</p>
          <p class="hint">Video đi trực tiếp giữa hai máy (WebRTC); máy chủ chỉ giúp hai bên tìm thấy nhau. Một số mạng 4G/công ty chặn kết nối trực tiếp – khi đó cần máy chủ TURN (xem FIREBASE.md).</p></div>`;
        const name = () => { const n = $(el, '.nm').value.trim(); if (!n) { $(el, '.msg').textContent = 'Nhập tên của bạn trước nhé.'; return null; } GV.store.set('lo_name', n); return n; };
        const busy = t => { $(el, '.msg').textContent = t; el.querySelectorAll('button').forEach(b => b.disabled = !!t); };
        const go = async fn => { try { await fn(); } catch (e) { entry(e.name === 'NotAllowedError' ? 'Bạn chưa cho phép dùng camera/micro.' : F.explain(e)); } };
        $(el, '.mk').onclick = () => { const n = name(); if (!n) return; busy('Đang mở lớp…'); go(() => create(n, $(el, '.tt').value.trim() || 'Buổi học 1-1', $(el, '.lg').value)); };
        $(el, '.jn').onclick = () => { const n = name(), c = $(el, '.cd').value.trim(); if (!n) return; if (!/^\d{4}$/.test(c)) { $(el, '.msg').textContent = 'Mã lớp gồm 4 chữ số.'; return; } busy('Đang vào lớp…'); go(() => join(c, n)); };
        $(el, '.rl').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; const n = name(); if (!n) return; busy('Đang vào lớp…'); go(() => join(b.dataset.c, n)); };
        F.fb().then(({ db }) => {
          if (dead) return;
          db.ref('calllobby').orderByChild('at').endAt(Date.now() - 2 * 3600e3).limitToFirst(10).once('value').then(s => { const up = {}; Object.keys(s.val() || {}).forEach(c => { up['calls/' + c] = null; up['calllobby/' + c] = null; }); if (Object.keys(up).length) db.ref().update(up).catch(() => {}); }).catch(() => {});
          const q = db.ref('calllobby').orderByChild('at').startAt(Date.now() - 2 * 3600e3), cb = snap => {
            const box = $(el, '.rl'); if (!box) return; const rows = Object.entries(snap.val() || {}).filter(([, r]) => r && !r.busy).sort((a, b) => b[1].at - a[1].at);
            box.innerHTML = rows.length ? rows.map(([c, r]) => `<div class="row" style="justify-content:space-between;text-align:left;border-top:1px solid var(--line);padding:4px 0"><span><b>${esc(r.title || 'Buổi học')}</b><br><span class="hint">${L.LANGS[r.lang] ? L.LANGS[r.lang].flag : ''} GV ${esc(r.hostName || '')} · #${c}</span></span><button class="btn ghost" data-c="${c}" style="padding:6px 12px">Vào học</button></div>`).join('') : 'Chưa có lớp nào đang mở.';
          };
          q.on('value', cb); listOff = () => q.off('value', cb);
        }).catch(() => { const b = $(el, '.rl'); if (b) b.textContent = 'Không tải được danh sách lớp.'; });
      }

      async function create(name, title, lang) {
        const { db, uid, TS } = await F.fb();
        for (let i = 0; i < 12; i++) {
          const code = String(1000 + GV.rnd(9000)), ref = db.ref('calls/' + code);
          const r = await F.timeout(ref.child('host').transaction(c => c === null ? uid : undefined));
          if (r.committed) {
            await F.timeout(ref.update({ hostName: name, title, lang, createdAt: TS }));
            ref.onDisconnect().remove(); db.ref('calllobby/' + code).onDisconnect().remove();
            await F.timeout(db.ref('calllobby/' + code).set({ title, hostName: name, lang, at: TS, busy: false }));
            return classroom(db, uid, TS, code, 'h', name, { title, lang });
          }
        }
        throw new Error('Không mở được lớp, thử lại.');
      }
      async function join(code, name) {
        const { db, uid, TS } = await F.fb(), ref = db.ref('calls/' + code);
        const snap = await F.timeout(ref.once('value')), m = snap.val();
        if (!m || !m.host) throw new Error('Không tìm thấy lớp ' + code);
        const tr = await F.timeout(ref.child('guest').transaction(c => c === null || c === uid ? uid : undefined));
        if (!tr.committed) throw new Error('Lớp này đã có học viên.');
        await ref.child('guestName').set(name); ref.child('guest').onDisconnect().set(null);
        return classroom(db, uid, TS, code, 'g', name, { title: m.title, lang: m.lang });
      }

      /* ---------- Phòng học ---------- */
      async function classroom(db, uid, TS, code, side, name, meta) {
        history.replaceState(null, '', '#/tool/classroom/' + code);
        const ref = db.ref('calls/' + code), other = side === 'h' ? 'g' : 'h', isT = side === 'h';
        let local = null, pc = null, pend = [], offered = false, answered = false, sharing = null, sender = {}, cap = null, t0 = 0, tmr = null, lastClr, penUp = true;
        el.innerHTML = `<style>.cr video{width:100%;background:#000;border-radius:12px;display:block}.cr .pip{position:absolute;right:8px;bottom:8px;width:28%;max-width:160px;border:2px solid #fff}.cr .cap{position:absolute;left:8px;right:8px;bottom:8px;text-align:center;color:#fff;background:#000a;border-radius:8px;padding:4px 8px;font-size:15px;display:none}.cr .wb{width:100%;background:#fff;border-radius:10px;touch-action:none;cursor:crosshair;border:1px solid var(--line)}.cr .pane{display:none}.cr .pane.on{display:block}</style>
          <div class="cr tool" style="max-width:900px">
            <div class="row" style="justify-content:space-between"><span><b>${esc(meta.title || 'Buổi học')}</b> <span class="hint">${L.LANGS[meta.lang] ? L.LANGS[meta.lang].flag : ''} · mã lớp <b style="letter-spacing:.15em;color:var(--acc)">${code}</b></span></span><span class="hint st">Đang chuẩn bị…</span><span class="hint tmr"></span></div>
            <div style="position:relative"><video class="rv" autoplay playsinline></video><video class="lv pip" autoplay playsinline muted></video><div class="cap"></div></div>
            <div class="row"><button class="pbtn mic">🎤 Micro</button><button class="pbtn cam">📷 Camera</button><button class="pbtn scr">🖥️ Chia sẻ màn hình</button><button class="pbtn cc">💬 Phụ đề</button><button class="pbtn share">🔗 Mời</button><button class="btn bad end">${isT ? 'Kết thúc lớp' : 'Rời lớp'}</button></div>
            <div class="row ccopt" hidden><label>Tôi nói <select class="capl">${Object.keys(L.LANGS).map(k => `<option value="${k}" ${k === (isT ? meta.lang : 'vi') ? 'selected' : ''}>${L.LANGS[k].name}</option>`).join('')}</select></label><label><input type="checkbox" class="ctr"> Dịch phụ đề của đối phương sang tiếng Việt</label></div>
            <div class="row tabs2"><button class="pbtn sel" data-t="chat">💬 Chat</button><button class="pbtn" data-t="wb">🖍️ Bảng trắng</button><button class="pbtn" data-t="notes">📝 Ghi chú chung</button></div>
            <div class="pane on" data-p="chat"><div class="cl" style="height:160px;overflow:auto;background:var(--inp);border:1px solid var(--line);border-radius:10px;padding:6px;text-align:left;font-size:14px"></div><div class="row" style="margin-top:6px"><input class="ci" maxlength="300" placeholder="Nhập tin nhắn…" style="flex:1"><button class="btn cs" style="padding:6px 14px">Gửi</button></div></div>
            <div class="pane" data-p="wb"><div class="row wbt">${COLORS.map(c => `<button class="pbtn" data-c="${c}" style="background:${c};width:30px;height:30px;padding:0"></button>`).join('')}<button class="pbtn" data-c="#ffffff">🧽 Tẩy</button><button class="pbtn wbx">🗑 Xoá bảng</button></div><canvas class="wb" width="800" height="450"></canvas></div>
            <div class="pane" data-p="notes"><textarea class="nt" style="min-height:200px" placeholder="Ghi chú chung – cả hai cùng thấy và cùng sửa (từ vựng, sửa lỗi, bài tập…)"></textarea></div>
          </div>`;
        const q = s => $(el, s);
        const setSt = t => { const s = q('.st'); if (s) s.textContent = t; };

        /* --- media --- */
        try { local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: { width: { ideal: 640 }, height: { ideal: 480 } } }); }
        catch (e) { try { local = await navigator.mediaDevices.getUserMedia({ audio: true }); setSt('Không có camera – chỉ dùng âm thanh.'); } catch (e2) { throw e2; } }
        q('.lv').srcObject = local;
        addClean(() => { local && local.getTracks().forEach(t => t.stop()); });

        /* --- kết nối ngang hàng --- */
        const flush = async () => { for (const c of pend.splice(0)) { try { await pc.addIceCandidate(c); } catch (e) {} } };
        function newPC() {
          if (pc) try { pc.close(); } catch (e) {} pend = []; pc = new RTCPeerConnection(ICE()); sender = {};
          local.getTracks().forEach(t => { sender[t.kind] = pc.addTrack(t, local); });
          pc.ontrack = e => { q('.rv').srcObject = e.streams[0]; q('.rv').play && q('.rv').play().catch(() => {}); };
          pc.onicecandidate = e => { if (e.candidate) ref.child('ice/' + side).push(JSON.parse(JSON.stringify(e.candidate))); };
          pc.onconnectionstatechange = () => { const s = pc.connectionState; setSt(s === 'connected' ? '✅ Đã kết nối' : s === 'connecting' ? 'Đang kết nối…' : s === 'failed' ? '❌ Kết nối thất bại (mạng chặn kết nối trực tiếp – cần TURN)' : s === 'disconnected' ? 'Mất kết nối…' : ''); if (s === 'connected' && !t0) { t0 = Date.now(); tmr = setInterval(() => { const x = (Date.now() - t0) / 1000; q('.tmr').textContent = Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0'); }, 1000); } };
        }
        addClean(() => { try { pc && pc.close(); } catch (e) {} clearInterval(tmr); });
        const otherIce = ref.child('ice/' + other), onIce = s => { const c = s.val(); if (!c) return; if (pc && pc.remoteDescription) pc.addIceCandidate(c).catch(() => {}); else pend.push(c); };
        otherIce.on('child_added', onIce); addClean(() => otherIce.off('child_added', onIce));

        if (isT) { // giáo viên: khi có học viên thì tạo offer
          const onGuest = async s => {
            const g = s.val();
            if (g && !offered) {
              offered = true; setSt('Học viên đã vào – đang kết nối…'); db.ref('calllobby/' + code + '/busy').set(true).catch(() => {});
              await ref.update({ offer: null, answer: null, ice: null }); newPC();
              const off = await pc.createOffer(); await pc.setLocalDescription(off); await ref.child('offer').set({ type: off.type, sdp: off.sdp });
            } else if (!g && offered) { offered = false; setSt('Học viên đã rời lớp – đang chờ học viên mới…'); q('.rv').srcObject = null; try { pc && pc.close(); } catch (e) {} clearInterval(tmr); t0 = 0; db.ref('calllobby/' + code + '/busy').set(false).catch(() => {}); }
          };
          ref.child('guest').on('value', onGuest); addClean(() => ref.child('guest').off('value', onGuest));
          const onAns = async s => { const a = s.val(); if (a && pc && pc.signalingState === 'have-local-offer') { await pc.setRemoteDescription(a); flush(); } };
          ref.child('answer').on('value', onAns); addClean(() => ref.child('answer').off('value', onAns));
          setSt('Đang chờ học viên… (gửi mã lớp ' + code + ')');
        } else {
          const onOff = async s => {
            const o = s.val(); if (!o || answered) return; answered = true; newPC();
            await pc.setRemoteDescription(o); flush(); const ans = await pc.createAnswer(); await pc.setLocalDescription(ans); await ref.child('answer').set({ type: ans.type, sdp: ans.sdp });
          };
          ref.child('offer').on('value', onOff); addClean(() => ref.child('offer').off('value', onOff)); setSt('Đang chờ giáo viên kết nối…');
          // giáo viên kết thúc lớp → thoát
          const onHost = s => { if (!s.exists() && !dead) { cleanupAll(); entry('Giáo viên đã kết thúc lớp.'); } };
          ref.child('host').on('value', onHost); addClean(() => ref.child('host').off('value', onHost));
        }

        /* --- điều khiển --- */
        q('.mic').onclick = e => { const t = local.getAudioTracks()[0]; if (!t) return; t.enabled = !t.enabled; e.target.textContent = t.enabled ? '🎤 Micro' : '🔇 Đã tắt mic'; };
        q('.cam').onclick = e => { const t = local.getVideoTracks()[0]; if (!t) return; t.enabled = !t.enabled; e.target.textContent = t.enabled ? '📷 Camera' : '🚫 Đã tắt cam'; };
        q('.scr').onclick = async e => {
          if (sharing) { sharing.getTracks().forEach(t => t.stop()); return; }
          if (!navigator.mediaDevices.getDisplayMedia) { setSt('Thiết bị này không hỗ trợ chia sẻ màn hình.'); return; }
          try { sharing = await navigator.mediaDevices.getDisplayMedia({ video: true }); } catch (x) { return; }
          const tr = sharing.getVideoTracks()[0]; if (sender.video) await sender.video.replaceTrack(tr); q('.lv').srcObject = sharing; e.target.textContent = '⏹ Dừng chia sẻ';
          tr.onended = async () => { if (sender.video && local.getVideoTracks()[0]) await sender.video.replaceTrack(local.getVideoTracks()[0]); q('.lv').srcObject = local; sharing = null; e.target.textContent = '🖥️ Chia sẻ màn hình'; };
        };
        q('.share').onclick = async e => { const url = location.origin + location.pathname + '#/tool/classroom/' + code; try { if (navigator.share) await navigator.share({ title: meta.title, url }); else { await navigator.clipboard.writeText(url); e.target.textContent = 'Đã chép ✓'; } } catch (x) {} };
        async function leave() {
          cleanupAll();
          try { if (isT) { await ref.remove(); await db.ref('calllobby/' + code).remove(); } else { await ref.update({ guest: null, guestName: null, answer: null }); } } catch (e) {}
          history.replaceState(null, '', '#/tool/classroom'); entry();
        }
        q('.end').onclick = () => { if (confirm(isT ? 'Kết thúc lớp học?' : 'Rời lớp học?')) leave(); };
        function cleanupAll() { cleanups.splice(0).forEach(f => { try { f(); } catch (e) {} }); if (cap) { cap.stop(); cap = null; } }

        /* --- tab --- */
        q('.tabs2').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; el.querySelectorAll('.tabs2 .pbtn').forEach(x => x.classList.toggle('sel', x === b)); el.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === b.dataset.t)); };

        /* --- chat --- */
        const chatRef = ref.child('chat'), onChat = s => { const m = s.val(); if (!m) return; const d = document.createElement('div'); d.innerHTML = `<b style="color:${m.u === uid ? 'var(--acc)' : 'var(--ok)'}">${esc(m.n)}:</b> ${esc(m.t)}`; q('.cl').appendChild(d); q('.cl').scrollTop = 1e6; };
        chatRef.on('child_added', onChat); addClean(() => chatRef.off('child_added', onChat));
        const sendChat = () => { const t = q('.ci').value.trim(); if (!t) return; q('.ci').value = ''; chatRef.push({ u: uid, n: name, t: t.slice(0, 300), at: Date.now() }); };
        q('.cs').onclick = sendChat; q('.ci').onkeydown = e => { if (e.key === 'Enter') sendChat(); };

        /* --- ghi chú chung --- */
        let nt = null; const noteRef = ref.child('notes'), onNote = s => { const v = s.val(); if (v && v.u !== uid && document.activeElement !== q('.nt')) q('.nt').value = v.v || ''; };
        noteRef.on('value', onNote); addClean(() => noteRef.off('value', onNote));
        q('.nt').oninput = () => { clearTimeout(nt); nt = setTimeout(() => noteRef.set({ u: uid, v: q('.nt').value.slice(0, 5000) }), 500); };

        /* --- bảng trắng --- */
        const cv = q('.wb'), cx = cv.getContext('2d'); let color = '#111111', W = cv.width, H = cv.height, pts = [], flushT = null;
        const seg = (c, w, p) => { cx.strokeStyle = c; cx.lineWidth = w; cx.lineCap = cx.lineJoin = 'round'; cx.beginPath(); p.forEach(([x, y], i) => i ? cx.lineTo(x * W, y * H) : cx.moveTo(x * W, y * H)); if (p.length === 1) cx.lineTo(p[0][0] * W + .1, p[0][1] * H); cx.stroke(); };
        const boardRef = ref.child('board'), onStroke = s => { const d = s.val(); if (d && d.u !== uid) seg(d.c, d.w, d.p); };
        boardRef.on('child_added', onStroke); addClean(() => boardRef.off('child_added', onStroke));
        const clrRef = ref.child('boardclr'), onClr = s => { const v = s.val(); if (lastClr !== undefined && v !== lastClr) { cx.clearRect(0, 0, W, H); } lastClr = v; };
        clrRef.on('value', onClr); addClean(() => clrRef.off('value', onClr));
        const pos = e => { const r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
        const pushPts = () => { if (pts.length) { const w = color === '#ffffff' ? 18 : 3; boardRef.push({ u: uid, c: color, w, p: pts.map(p => [+p[0].toFixed(4), +p[1].toFixed(4)]) }); pts = pts.slice(-1); } };
        cv.onpointerdown = e => { penUp = false; cv.setPointerCapture(e.pointerId); const p = pos(e); pts = [p]; seg(color, color === '#ffffff' ? 18 : 3, [p]); flushT = setInterval(pushPts, 80); };
        cv.onpointermove = e => { if (penUp) return; const p = pos(e), l = pts[pts.length - 1]; seg(color, color === '#ffffff' ? 18 : 3, [l, p]); pts.push(p); };
        const up = () => { if (penUp) return; penUp = true; clearInterval(flushT); if (pts.length === 1) pts.push(pts[0]); pushPts(); pts = []; };
        cv.onpointerup = up; cv.onpointercancel = up;
        q('.wbt').onclick = e => { const c = e.target.closest('[data-c]'); if (c) color = c.dataset.c; if (e.target.closest('.wbx')) { cx.clearRect(0, 0, W, H); boardRef.remove(); clrRef.set(Date.now()); } };

        /* --- phụ đề trực tiếp --- */
        const capEl = q('.cap'), showCap = t => { capEl.textContent = t; capEl.style.display = t ? 'block' : 'none'; clearTimeout(capEl._t); capEl._t = setTimeout(() => { capEl.style.display = 'none'; }, 6000); };
        const capRef = ref.child('cap/' + other), onCap = async s => { const c = s.val(); if (!c || !c.t) return; let t = c.t; if (q('.ctr').checked && c.l && c.l !== 'vi') { try { t = c.t + '\n' + await L.translate(c.t, c.l, 'vi'); } catch (e) {} } showCap(t); };
        capRef.on('value', onCap); addClean(() => capRef.off('value', onCap));
        q('.cc').onclick = e => {
          q('.ccopt').hidden = false;
          if (cap) { cap.stop(); cap = null; e.target.classList.remove('sel'); return; }
          if (!L.hasSTT()) { setSt('Trình duyệt chưa hỗ trợ nhận giọng nói cho phụ đề.'); return; }
          e.target.classList.add('sel'); const l = q('.capl').value;
          cap = L.listen(l, { onText: (f, i) => { if (f.trim()) ref.child('cap/' + side).set({ t: f.trim(), l, at: Date.now() }); } });
        };
        addClean(() => { clearInterval(flushT); });
      }
      entry();
      return () => { dead = true; if (listOff) listOff(); const c = cleanups.splice(0); c.forEach(f => { try { f(); } catch (e) {} }); try { speechSynthesis.cancel(); } catch (e) {} };
    }
  });
})();
