// Thư viện khoá học cộng đồng (Firebase) + bài giao + lưu kết quả học. Ai cũng xem/nhập được; giáo viên, CTV, admin được đăng.
(function () {
  const L = GV.learn, esc = GV.esc;
  const F = () => GV.fbInfo();
  L.library = {
    async list(lang) {
      const { db } = await F().fb(); const s = await db.ref('library/meta').once('value');
      return Object.entries(s.val() || {}).map(([id, m]) => Object.assign({ id }, m)).filter(m => !lang || m.lang === lang).sort((a, b) => (b.at || 0) - (a.at || 0));
    },
    async get(id) {
      const { db } = await F().fb(); const [m, d] = await Promise.all([db.ref('library/meta/' + id).once('value'), db.ref('library/data/' + id).once('value')]);
      if (!m.exists() || !d.exists()) throw new Error('Khoá học không còn trong thư viện.');
      return Object.assign({ id }, m.val(), { course: JSON.parse(d.val()) });
    },
    async publish(course, desc) {
      const A = GV.account; await A.init();
      if (!A.has('teacher', 'collab', 'admin')) throw new Error('Cần tài khoản Giáo viên / Cộng tác viên / Quản trị để đăng khoá học.');
      const { db } = await F().fb(), id = db.ref('library/meta').push().key, n = L.flat ? L.flat(course).length : 0;
      const data = JSON.stringify({ name: course.name, lang: course.lang, units: course.units });
      if (data.length > 290000) throw new Error('Khoá học quá lớn (tối đa ~290KB).');
      await db.ref('library/meta/' + id).set({ name: course.name, lang: course.lang, n, units: course.units.length, by: A.user.uid, byName: (A.profile && A.profile.name) || A.user.email, at: A.TS, desc: desc || '' });
      await db.ref('library/data/' + id).set(data); return id;
    },
    async remove(id) { const { db } = await F().fb(); await db.ref('library/data/' + id).remove(); await db.ref('library/meta/' + id).remove(); },
    async importToLocal(id) {
      const r = await this.get(id), c = Object.assign({}, r.course, { id: 'lib' + id, lib: id });
      const all = L.courses.custom().filter(x => x.id !== c.id); all.push(c); L.courses.saveAll(all); return c;
    },
    // bài được giao cho tài khoản đang đăng nhập
    async assigned() {
      const A = GV.account; await A.init(); if (!A.user) return [];
      const s = await A.db.ref('assign/' + A.user.uid).once('value');
      return Object.entries(s.val() || {}).map(([cid, m]) => Object.assign({ cid }, m));
    },
    // lưu kết quả kiểm tra của học sinh (nếu đã đăng nhập)
    async saveResult(course, ok, n) {
      const A = GV.account; if (!A.ready || !A.user) return;
      try { await A.db.ref('results/' + A.user.uid).push({ c: course, ok, n, at: A.TS }); } catch (e) { console.warn('result', e); }
    }
  };
})();
