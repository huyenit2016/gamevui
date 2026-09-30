// Build khi deploy: nén + làm rối JS, nén CSS/HTML -> thư mục dist/ (mã gốc trong repo giữ nguyên, dễ đọc).
// Chạy: npm ci && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { minify } from 'terser';
import JavaScriptObfuscator from 'javascript-obfuscator';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';

const OUT = 'dist';
const KEEP_PLAIN = new Set(['js/firebase-config.js', 'js/ads-config.js']); // file cấu hình: chỉ nén, không làm rối (dễ sửa, không chứa logic)
fs.rmSync(OUT, { recursive: true, force: true });
const put = (rel, data) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
const stat = { js: [0, 0], css: [0, 0], html: [0, 0] };

for (const f of fs.readdirSync('js').filter(x => x.endsWith('.js'))) {
  const rel = 'js/' + f, src = fs.readFileSync(rel, 'utf8');
  let code = (await minify(src, { compress: { passes: 2 }, mangle: true, format: { comments: false } })).code;
  if (!KEEP_PLAIN.has(rel)) {
    code = JavaScriptObfuscator.obfuscate(code, {
      compact: true, target: 'browser',
      renameGlobals: false,            // các file dùng chung biến toàn cục (GV…) nên KHÔNG đổi tên
      identifierNamesGenerator: 'hexadecimal',
      stringArray: true, stringArrayThreshold: 0.75, stringArrayWrappersCount: 1, rotateStringArray: true, shuffleStringArray: true,
      transformObjectKeys: false,      // không đổi khoá object (khoá dữ liệu Firebase phải giữ nguyên)
      controlFlowFlattening: false, deadCodeInjection: false, selfDefending: false, debugProtection: false, disableConsoleOutput: false, // tránh làm chậm/vỡ code
      splitStrings: false, numbersToExpressions: false, simplify: true, unicodeEscapeSequence: false
    }).getObfuscatedCode();
  }
  put(rel, code); stat.js[0] += src.length; stat.js[1] += code.length;
}
for (const f of fs.readdirSync('css').filter(x => x.endsWith('.css'))) {
  const src = fs.readFileSync('css/' + f, 'utf8'), out = new CleanCSS({ level: 1 }).minify(src);
  if (out.errors.length) throw new Error(f + ': ' + out.errors.join(';'));
  put('css/' + f, out.styles); stat.css[0] += src.length; stat.css[1] += out.styles.length;
}
for (const f of fs.readdirSync('.').filter(x => x.endsWith('.html'))) {
  const src = fs.readFileSync(f, 'utf8');
  const out = await minifyHtml(src, { collapseWhitespace: true, conservativeCollapse: true, removeComments: true, minifyJS: true, minifyCSS: true });
  put(f, out); stat.html[0] += src.length; stat.html[1] += out.length;
}
for (const f of ['ads.txt', '.nojekyll', 'LICENSE']) if (fs.existsSync(f)) put(f, fs.readFileSync(f));
console.log('build OK ->', OUT, JSON.stringify(stat));
