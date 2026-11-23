// VIBEVERSE chat relay — chạy: npm i ws && node server.js
// Mở game bằng: vibeverse.html?ws=ws://localhost:8080&room=neon-arena
// Triển khai thật: đặt sau HTTPS/WSS (nginx, Caddy, Cloudflare...) và dùng ?ws=wss://domain
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT, maxPayload: 2048 });
const rooms = new Map();
const TYPES = new Set(['chat', 'hello', 'ping', 'bye']);
const str = (v, n) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').slice(0, n);

function leave(ws) {
  const set = rooms.get(ws.room);
  if (set) { set.delete(ws); if (!set.size) rooms.delete(ws.room); }
  ws.room = null;
}

wss.on('connection', (ws) => {
  ws.room = null; ws.alive = true; ws.hits = []; ws.on('pong', () => (ws.alive = true));
  ws.on('message', (raw) => {
    const now = Date.now();
    ws.hits = ws.hits.filter((t) => now - t < 5000);
    if (ws.hits.push(now) > 15) return;            // rate limit: 15 msgs / 5s
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    if (m.t === 'join') {
      leave(ws); ws.room = str(m.room || 'lobby', 40) || 'lobby';
      if (!rooms.has(ws.room)) rooms.set(ws.room, new Set());
      rooms.get(ws.room).add(ws); return;
    }
    if (!ws.room || !TYPES.has(m.t)) return;
    const out = JSON.stringify({
      t: m.t, id: str(m.id, 64), from: str(m.from, 64), name: str(m.name, 16),
      outfit: Number(m.outfit) | 0, text: m.t === 'chat' ? str(m.text, 140) : undefined, ts: now,
    });
    for (const c of rooms.get(ws.room)) if (c !== ws && c.readyState === 1) c.send(out);
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => {});
});

setInterval(() => {                                   // dọn kết nối chết
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
}, 30000);
console.log('VIBEVERSE relay listening on ws://localhost:' + PORT);
