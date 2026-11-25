// Phố Đêm 3D · âm thanh tạo bằng WebAudio: tiếng động cơ theo vòng tua, rít lốp, va chạm, còi xe, còi hú cảnh sát, radio (3 đài tự phát nhạc).
export const STATIONS = ['Tắt radio', 'Neon FM', 'Chill Lofi', 'Phố Đêm Rock'];
export class Sound {
  constructor() { this.ctx = null; this.on = true; this.station = 1; this.step = 0; this.seq = null; }
  init() {
    if (this.ctx) { this.ctx.state === 'suspended' && this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const a = this.ctx = new C(); this.master = a.createGain(); this.master.gain.value = 0.55; this.master.connect(a.destination);
    const mk = (type, f) => { const o = a.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; };
    this.e1 = mk('sawtooth', 50); this.e2 = mk('square', 25); this.eF = a.createBiquadFilter(); this.eF.type = 'lowpass'; this.eF.frequency.value = 500; this.eG = a.createGain(); this.eG.gain.value = 0;
    this.e1.connect(this.eF); this.e2.connect(this.eF); this.eF.connect(this.eG); this.eG.connect(this.master);
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noise = buf;
    const src = a.createBufferSource(); src.buffer = buf; src.loop = true; this.sF = a.createBiquadFilter(); this.sF.type = 'bandpass'; this.sF.frequency.value = 1800; this.sF.Q.value = 3; this.sG = a.createGain(); this.sG.gain.value = 0; src.connect(this.sF); this.sF.connect(this.sG); this.sG.connect(this.master); src.start();
    this.si = mk('sawtooth', 800); this.siG = a.createGain(); this.siG.gain.value = 0; this.si.connect(this.siG); this.siG.connect(this.master);
    this.hn = mk('square', 392); this.hn2 = mk('square', 494); this.hG = a.createGain(); this.hG.gain.value = 0; this.hn.connect(this.hG); this.hn2.connect(this.hG); this.hG.connect(this.master);
    this.rG = a.createGain(); this.rG.gain.value = 0.22; this.rG.connect(this.master); this.timer = setInterval(() => this.tick(), 190); this.setStation(this.station);
  }
  setEngine(active, speedRatio, thr) { if (!this.ctx) return; const t = this.ctx.currentTime; const rpm = 40 + speedRatio * 150 + thr * 25 + (speedRatio > 0.3 ? 20 * Math.abs(Math.sin(speedRatio * 14)) : 0); this.e1.frequency.setTargetAtTime(rpm, t, 0.05); this.e2.frequency.setTargetAtTime(rpm * 0.5, t, 0.05); this.eF.frequency.setTargetAtTime(350 + speedRatio * 900 + thr * 400, t, 0.08); this.eG.gain.setTargetAtTime(active && this.on ? 0.05 + thr * 0.05 + speedRatio * 0.03 : 0, t, 0.08); }
  screech(level) { if (this.ctx) this.sG.gain.setTargetAtTime(this.on ? Math.min(0.14, level * 0.14) : 0, this.ctx.currentTime, 0.05); }
  crash(strength) { if (!this.ctx || !this.on) return; const a = this.ctx, t = a.currentTime, s = a.createBufferSource(); s.buffer = this.noise; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600 + strength * 120; const g = a.createGain(); g.gain.setValueAtTime(Math.min(0.5, 0.08 + strength * 0.03), t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + 0.4); }
  siren(vol, t) { if (!this.ctx) return; this.si.frequency.setTargetAtTime(750 + 330 * Math.sin(t * 7), this.ctx.currentTime, 0.02); this.siG.gain.setTargetAtTime(this.on ? Math.min(0.06, vol * 0.06) : 0, this.ctx.currentTime, 0.1); }
  horn(on) { if (this.ctx) this.hG.gain.setTargetAtTime(on && this.on ? 0.07 : 0, this.ctx.currentTime, 0.02); }
  chime(f = 660) { if (!this.ctx || !this.on) return; const a = this.ctx, t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.setValueAtTime(f * 1.5, t + 0.1); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.55); }
  setStation(i) {
    this.station = i; this.step = 0; const m = 220, n = f => m * Math.pow(2, f / 12);
    this.seq = [null, { bpm: 108, bass: [0, 0, 3, 3, 5, 5, 3, 7], arp: [0, 7, 12, 7, 3, 10, 15, 10], bt: 'sawtooth', at: 'square', root: -12 }, { bpm: 76, bass: [0, 0, -2, -2, -4, -4, -5, -5], arp: [7, 12, 14, 12, 10, 14, 15, 12], bt: 'triangle', at: 'sine', root: -5 }, { bpm: 128, bass: [0, 0, 0, 3, 0, 0, 5, 3], arp: [12, 12, 15, 12, 17, 15, 12, 10], bt: 'sawtooth', at: 'sawtooth', root: -17 }][i] || null;
    this.n = n; this.rG.gain.value = i && this.on ? 0.2 : 0;
  }
  note(f, d, type, g) { const a = this.ctx, t = a.currentTime, o = a.createOscillator(), v = a.createGain(), fl = a.createBiquadFilter(); o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 1800; v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0005, t + d); o.connect(fl); fl.connect(v); v.connect(this.rG); o.start(t); o.stop(t + d + 0.02); }
  tick() {
    if (!this.ctx || !this.seq || !this.on) return; const S = this.seq, beat = 60 / S.bpm; if (this.nextT === undefined || this.ctx.currentTime > this.nextT + 1) this.nextT = this.ctx.currentTime;
    while (this.nextT < this.ctx.currentTime + 0.25) { const k = this.step++, i = k % 8, bar = Math.floor(k / 8) % 4, sh = [0, 3, 5, 2][bar]; const dt = this.nextT - this.ctx.currentTime;
      setTimeout(() => { if (!this.ctx || this.seq !== S) return; this.note(this.n(S.root + S.bass[i] + sh), beat * 0.9, S.bt, 0.22); if (i % 2 === 0 || S.bpm > 100) this.note(this.n(S.root + 24 + S.arp[i] + sh), beat * 0.5, S.at, 0.07); }, Math.max(0, dt * 1000)); this.nextT += beat / 2; }
  }
  toggle() { this.on = !this.on; if (this.ctx) { this.master.gain.value = this.on ? 0.55 : 0; } return this.on; }
}
