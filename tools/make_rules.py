#!/usr/bin/env python3
"""Sinh database.rules.json và chèn vào FIREBASE.md (mục 3). Chạy: python3 tools/make_rules.py"""
import json, re, pathlib
AUTH = "auth != null"
ADMIN = "root.child('admins').child(auth.uid).exists()"
def role(r): return f"root.child('users').child(auth.uid).child('role').val() === '{r}'"
COLLAB, TEACHER = role('collab'), role('teacher')
STAFF = f"({ADMIN} || {COLLAB} || {TEACHER})"
MOD = f"({ADMIN} || {COLLAB})"
TTL = 7200000  # 2 giờ

def stale_child(root, key): return f"(root.child('{root}').child({key}).child('at').isNumber() && root.child('{root}').child({key}).child('at').val() < now - {TTL})"
def stale_self(): return f"(data.child('at').isNumber() && data.child('at').val() < now - {TTL})"

# ---- game nhiều người (mprooms) ----
MH = "root.child('mprooms').child($room).child('host').val() === auth.uid"
MEM = "root.child('mprooms').child($room).child('players').child(auth.uid).exists()"
ST = stale_child('mplobby', '$room')
MDEL = f"{AUTH} && !newData.exists() && ({MH} || {MEM} || {ST} || {ADMIN})"
MDELI = f"!newData.exists() && ({MEM} || {ST} || {ADMIN})"

# ---- lớp học 1-1 (calls) ----
CH = "root.child('calls').child($code).child('host').val() === auth.uid"
CG = "root.child('calls').child($code).child('guest').val() === auth.uid"
CP = f"{AUTH} && ({CH} || {CG})"

rules = {"rules": {
  # dữ liệu phiên bản cũ: chỉ admin được xem/dọn
  "rooms": {".read": f"{AUTH} && {ADMIN}", ".write": f"{AUTH} && {ADMIN}"},
  "lobby": {".read": f"{AUTH} && {ADMIN}", ".write": f"{AUTH} && {ADMIN}"},

  "mprooms": {
    ".read": f"{AUTH} && {ADMIN}",
    "$room": {
      ".read": AUTH,
      ".validate": "$room.matches(/^[0-9]{4}$/)",
      ".write": MDEL,
      "host": {".write": f"{AUTH} && !data.exists() && newData.val() === auth.uid"},
      "meta": {".write": f"{AUTH} && (!data.exists() || {MH})"},
      "pub": {".write": f"{AUTH} && {MH}"},
      "bots": {".write": f"{AUTH} && {MH}"},
      "history": {".write": f"{AUTH} && {MH}"},
      "players": {"$uid": {".write": f"{AUTH} && (auth.uid === $uid || {MH})"}},
      "act": {".write": f"{AUTH} && {MH}", "$uid": {".write": f"{AUTH} && auth.uid === $uid"}},
      "chat": {".write": f"{AUTH} && {MH}", "$id": {".write": f"{AUTH} && !data.exists() && newData.child('uid').val() === auth.uid"}}
    }
  },
  "mpprivate": {"$room": {".write": f"{AUTH} && ({MH} || ({MDELI}))", "$uid": {".read": f"{AUTH} && auth.uid === $uid", ".write": f"{AUTH} && auth.uid === $uid && !newData.exists()"}}},
  "mpstate": {"$room": {".read": f"{AUTH} && {MH}", ".write": f"{AUTH} && ({MH} || ({MDELI}))"}},
  "mplobby": {".read": AUTH, ".indexOn": ["at"], "$code": {".write": f"{AUTH} && (root.child('mprooms').child($code).child('host').val() === auth.uid || {ADMIN} || (!newData.exists() && {stale_self()}))"}},

  "calls": {
    ".read": f"{AUTH} && {ADMIN}",
    "$code": {
      ".read": AUTH, ".validate": "$code.matches(/^[0-9]{4}$/)",
      ".write": f"{AUTH} && !newData.exists() && (data.child('host').val() === auth.uid || {ADMIN})",
      "host": {".write": f"{AUTH} && !data.exists() && newData.val() === auth.uid"},
      "hostName": {".write": f"{AUTH} && {CH}"}, "title": {".write": f"{AUTH} && {CH}"}, "lang": {".write": f"{AUTH} && {CH}"}, "createdAt": {".write": f"{AUTH} && {CH}"},
      "guest": {".write": f"{AUTH} && ((!data.exists() && newData.val() === auth.uid) || data.val() === auth.uid || {CH})"},
      "guestName": {".write": CP}, "offer": {".write": CP}, "answer": {".write": CP}, "ice": {".write": CP}, "boardclr": {".write": CP}, "cap": {".write": CP}, "notes": {".write": CP}, "board": {".write": CP}, "chat": {".write": CP}
    }
  },
  "calllobby": {".read": AUTH, ".indexOn": ["at"], "$code": {".write": f"{AUTH} && ({CH} || {ADMIN} || (!newData.exists() && {stale_self()}))"}},

  # ---- thống kê truy cập ----
  "stats": {
    ".read": AUTH,
    "total": {".write": f"{AUTH} && newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"},
    "unique": {".write": f"{AUTH} && newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"},
    "ips": {"$h": {".write": f"{AUTH} && $h.length === 16",
      "first": {".validate": "!data.exists() && newData.isNumber()"}, "last": {".validate": "newData.isNumber()"},
      "n": {".validate": "newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"}, "$other": {".validate": "false"}}}
  },

  # ---- CMS: cấu hình & thông báo (ai cũng đọc được, chỉ admin / CTV ghi) ----
  "config": {".read": AUTH, "site": {".write": f"{AUTH} && {ADMIN}"}, "announce": {".write": f"{AUTH} && {MOD}"}, "autoclean": {".write": f"{AUTH} && {ADMIN}"}},

  # ---- tài khoản & phân quyền ----
  "admins": {".read": f"{AUTH} && {ADMIN}", "$uid": {
    ".read": f"{AUTH} && auth.uid === $uid",
    ".write": f"{AUTH} && ({ADMIN} || ($uid === auth.uid && newData.child('k').isString() && newData.child('k').val() === root.child('setup').child('secret').val()))"}},
  "users": {".read": f"{AUTH} && {ADMIN}", "$uid": {
    ".read": f"{AUTH} && (auth.uid === $uid || {ADMIN})",
    ".write": f"{AUTH} && ({ADMIN} || (auth.uid === $uid && !data.exists() && newData.child('role').val() === 'student'))",
    "name": {".read": f"{AUTH} && {STAFF}", ".write": f"{AUTH} && (auth.uid === $uid || {ADMIN})"},
    "email": {".write": f"{AUTH} && (auth.uid === $uid || {ADMIN})"},
    "requested": {".write": f"{AUTH} && (auth.uid === $uid || {ADMIN})", ".validate": "newData.val() === 'teacher' || newData.val() === 'collab'"},
    "role": {".write": f"{AUTH} && {ADMIN}", ".validate": "newData.val() === 'student' || newData.val() === 'teacher' || newData.val() === 'collab'"}}},
  "userIndex": {".read": f"{AUTH} && {STAFF}", "$k": {".write": f"{AUTH} && ((!data.exists() && newData.val() === auth.uid && $k === auth.token.email.toLowerCase().replace('.', ',')) || {ADMIN})"}},

  # ---- thư viện khoá học / bài giao / kết quả ----
  "library": {
    "meta": {".read": AUTH, "$id": {
      ".write": f"{AUTH} && ({MOD} || ({TEACHER} && ((newData.exists() && newData.child('by').val() === auth.uid && (!data.exists() || data.child('by').val() === auth.uid)) || (!newData.exists() && data.child('by').val() === auth.uid))))",
      ".validate": "newData.hasChildren(['name', 'lang', 'by', 'at'])"}},
    "data": {"$id": {".read": AUTH,
      ".write": f"{AUTH} && ({MOD} || ({TEACHER} && root.child('library').child('meta').child($id).child('by').val() === auth.uid))",
      ".validate": "newData.isString() && newData.val().length < 300000"}}
  },
  "teacherStudents": {"$t": {".read": f"{AUTH} && ($t === auth.uid || {ADMIN})", ".write": f"{AUTH} && (($t === auth.uid && {TEACHER}) || {ADMIN})"}},
  "assign": {"$s": {".read": f"{AUTH} && ($s === auth.uid || {TEACHER} || {ADMIN})", "$c": {
    ".write": f"{AUTH} && ({ADMIN} || ({TEACHER} && ((newData.exists() && newData.child('by').val() === auth.uid) || (!newData.exists() && data.child('by').val() === auth.uid))))"}}},
  "results": {"$s": {".read": f"{AUTH} && ($s === auth.uid || {TEACHER} || {ADMIN})", ".write": f"{AUTH} && {ADMIN}", "$id": {
    ".write": f"{AUTH} && $s === auth.uid && !data.exists()", ".validate": "newData.hasChildren(['c', 'ok', 'n', 'at'])"}}}
}}

root = pathlib.Path(__file__).resolve().parent.parent
(root / 'database.rules.json').write_text(json.dumps(rules, indent=2, ensure_ascii=False) + "\n")
md = root / 'FIREBASE.md'; s = md.read_text()
block = "```json\n" + json.dumps(rules, indent=2, ensure_ascii=False) + "\n```"
s2 = re.sub(r"```json\n.*?\n```", lambda m: block, s, count=1, flags=re.S)
md.write_text(s2); print("ok:", len(json.dumps(rules)), "bytes")
