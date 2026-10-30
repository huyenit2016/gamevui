#!/usr/bin/env node
// Cầu nối: nghe quà tặng trong phòng TikTok LIVE của bạn → đẩy cho trang "Đi Chùa Online" hiện tên + avatar + lời nguyện lành.
//   Cách 1 (đơn giản, chạy cùng máy phát live): SSE tại http://localhost:8787/events – điền địa chỉ này vào CMS → Chùa Online → "Địa chỉ relay".
//   Cách 2 (đẩy lên Firebase để mọi trang cùng thấy): đặt FIREBASE_DB_URL + FIREBASE_SECRET.
// Biến môi trường: TIKTOK_USER (bắt buộc, không cần @) · PORT (8787) · ALLOW_ORIGIN (* hoặc https://huyenit2016.github.io)
//                  FIREBASE_DB_URL (https://<project>-default-rtdb.firebaseio.com) · FIREBASE_SECRET (database secret hoặc token admin)
//                  TIKTOK_SESSION_ID (tuỳ chọn, giảm bị giới hạn khi kết nối) · DICHUA_NO_CONNECT=1 (chỉ chạy máy chủ SSE, dùng khi thử)
'use strict';
const http = require('http');
const PORT = +process.env.PORT || 8787, ORIGIN = process.env.ALLOW_ORIGIN || '*', USER = (process.env.TIKTOK_USER || '').replace(/^@/, '');
const clients = new Set(); let lastEvents = [];

// Chuẩn hoá một sự kiện quà của tiktok-live-connector → { u, id, av, g, n, d, at }
function normalizeGift(d) {
  if (!d) return null;
  const streakable = d.giftType === 1, n = Math.max(1, +d.repeatCount || 1);
  if (streakable && d.repeatEnd === false) return null; // quà liên tiếp: chỉ báo khi kết thúc chuỗi (tránh trùng)
  const av = String(d.profilePictureUrl || (d.userDetails && d.userDetails.profilePictureUrls && d.userDetails.profilePictureUrls[0]) || '');
  return { u: String(d.nickname || d.uniqueId || 'Phật tử').slice(0, 40), id: String(d.uniqueId || '').slice(0, 40), av: /^https:\/\//.test(av) ? av : '', g: String(d.giftName || 'quà').slice(0, 40), n, d: Math.max(0, (+d.diamondCount || 0) * n), at: Date.now() };
}
function broadcast(ev) {
  lastEvents.push(ev); lastEvents = lastEvents.slice(-20);
  const line = 'data: ' + JSON.stringify({ type: 'gift', ...ev }) + '\n\n';
  clients.forEach(res => { try { res.write(line); } catch (e) {} });
  if (process.env.FIREBASE_DB_URL && process.env.FIREBASE_SECRET) {
    fetch(`${process.env.FIREBASE_DB_URL.replace(/\/$/, '')}/dichua/gifts.json?auth=${encodeURIComponent(process.env.FIREBASE_SECRET)}`, { method: 'POST', body: JSON.stringify(ev) })
      .then(r => { if (!r.ok) console.error('Firebase từ chối:', r.status); }).catch(e => console.error('Lỗi đẩy Firebase:', e.message));
  }
  console.log(`🎁 ${ev.u} tặng ${ev.n} × ${ev.g} (${ev.d} 💎)`);
}
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN); res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url.split('?')[0] === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': kết nối\n\n'); clients.add(res); const ka = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 25000);
    req.on('close', () => { clients.delete(res); clearInterval(ka); }); return;
  }
  if (req.url.split('?')[0] === '/test' && req.method === 'POST') { broadcast({ u: 'Phật tử thử nghiệm', id: 'test', av: '', g: 'Hoa hồng', n: 3, d: 3, at: Date.now() }); res.writeHead(200); return res.end('ok'); }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Đi Chùa Online relay đang chạy. SSE: /events · thử: POST /test\n');
});
function start() {
  server.listen(PORT, () => console.log(`SSE: http://localhost:${PORT}/events`));
  if (process.env.DICHUA_NO_CONNECT === '1') return;
  if (!USER) { console.error('Thiếu TIKTOK_USER (tên kênh đang LIVE, không cần @).'); process.exit(1); }
  let lib; try { lib = require('tiktok-live-connector'); } catch (e) { console.error('Chưa cài thư viện: chạy "npm install" trong thư mục này.'); process.exit(1); }
  const Conn = lib.WebcastPushConnection || lib.TikTokLiveConnection, opts = process.env.TIKTOK_SESSION_ID ? { sessionId: process.env.TIKTOK_SESSION_ID } : {};
  const connect = () => { const c = new Conn(USER, opts); c.connect().then(s => console.log('Đã nối phòng LIVE của @' + USER + (s && s.roomId ? ' (room ' + s.roomId + ')' : ''))).catch(e => { console.error('Chưa nối được (kênh có đang LIVE không?):', e.message || e); setTimeout(connect, 15000); });
    c.on('gift', d => { const ev = normalizeGift(d); if (ev) broadcast(ev); });
    c.on('disconnected', () => { console.log('Mất kết nối, thử lại sau 10 giây…'); setTimeout(connect, 10000); }); c.on('streamEnd', () => console.log('Phiên LIVE đã kết thúc.')); };
  connect();
}
if (require.main === module) start();
module.exports = { normalizeGift, broadcast, server, start };
