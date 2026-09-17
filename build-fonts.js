/* ============================================================
   自托管字体构建
   ------------------------------------------------------------
   为什么不用 Google Fonts 的在线链接：
   站内字体是 Noto Sans SC / Noto Serif SC / Ma Shan Zheng，都是 CJK 字体。
   Google 把它们切成上百个 unicode-range 分片，在线引用意味着
   首屏要发几十个请求，且 fonts.googleapis.com 在大陆访问不稳定 ——
   用真实用户看到的往往是苹方 / 雅黑的回落版，和设计稿不是一套字。

   做法：把全站**实际会渲染的字符**统计出来（不含 CSS/JS 注释），
   交给 Google Fonts 的 text= 子集接口，每个字重换回一个 woff2，
   存到 assets/fonts/，并生成 assets/css/fonts.css。

   运行： node build-fonts.js
   什么时候要重跑：改了 content/site-data.js 的文案、或新增了页面/字符之后。
   （漏掉的字不会变成方块，只是退回系统字体，所以忘了跑也不会坏。）

   产物： assets/fonts/*.woff2 + assets/css/fonts.css
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_FONT = path.join(ROOT, 'assets', 'fonts');
const OUT_CSS = path.join(ROOT, 'assets', 'css', 'fonts.css');

/* 需要哪些字族、哪些字重 —— 与 templates/_partials/head.html 里原来的 Google 请求一一对应 */
const FAMILIES = [
  { family: 'Noto Sans SC',  slug: 'noto-sans-sc',  weights: [400, 700, 900] },
  { family: 'Noto Serif SC', slug: 'noto-serif-sc', weights: [400, 500] },
  { family: 'Ma Shan Zheng', slug: 'ma-shan-zheng', weights: [400] },
  { family: 'Space Mono',    slug: 'space-mono',    weights: [400] }
];

/* 现代浏览器 UA —— 不带这个，Google 只会回 ttf，体积大好几倍 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/* ---------- 1. 统计实际渲染用到的字符 ---------- */
function collectChars() {
  const set = new Set();
  const add = (t) => { for (const c of t) if (c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127) set.add(c); };

  /* 可打印 ASCII 全集固定纳入。
     一是不贵（7 个字重加起来也就几 KB），二是能一劳永逸挡掉
     「某个 ASCII 字符只在运行期出现、静态扫描漏了」这类问题 ——
     拉丁字母在系统字体里虽然都有，但混排时字重/字宽对不上会露馅。 */
  for (let i = 32; i <= 126; i++) set.add(String.fromCharCode(i));

  const walk = (dir, fn) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p, fn); else fn(p);
    }
  };

  /* 构建产物里的真实文本：剥掉 script / style / 注释，保留属性值（aria-label、alt 也算）。
     必须先把 &times; 这类实体还原成真字符，否则统计到的是 "&times;" 这七个 ASCII，
     真正要显示的 × 反而漏掉了。 */
  walk(path.join(ROOT, 'dist'), (p) => {
    if (!/\.html$/.test(p)) return;
    add(fs.readFileSync(p, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/&times;/g, '×').replace(/&nbsp;/g, '\u00a0')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
  });

  /* 所有 JS 里会进 DOM 的文案。早期版本只扫了 main.js / filmstrip.js，
     漏掉了 planes.js 动态写的 title / aria-label（"点击让星星绕标题转一圈"）。 */
  walk(path.join(ROOT, 'assets', 'js'), (p) => {
    if (!/\.js$/.test(p)) return;
    const src = fs.readFileSync(p, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/.*$/gm, ' ');
    (src.match(/'[^'\\]*'|"[^"\\]*"|`[^`\\]*`/g) || []).forEach(add);
  });

  /* 常见中日韩标点兜底：这些字符在实际文案里随时可能冒出来，漏一个就是一个方框 */
  add('，。！？；：、“”‘’（）《》〈〉【】〔〕—…·～￥％＋－×÷＝《》「」『』');
  return [...set].sort().join('');
}

/* ---------- 2. 抓取 ---------- */
async function fetchWeight(family, weight, text) {
  const url = 'https://fonts.googleapis.com/css2?family=' +
    encodeURIComponent(family).replace(/%20/g, '+') +
    ':wght@' + weight + '&text=' + encodeURIComponent(text) + '&display=swap';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${family} ${weight}: CSS ${res.status}`);
  const css = await res.text();
  /* 注意：子集接口返回的地址是 fonts.gstatic.com/l/font?kit=…&skey=…&v=…，
     不以 .woff2 结尾，所以只能认 format('woff2')，不能认扩展名 */
  const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/);
  if (!m) throw new Error(`${family} ${weight}: 没解析到 woff2（可能 text= 太长被截断）`);
  const bin = await (await fetch(m[1], { headers: { 'User-Agent': UA } })).arrayBuffer();
  return Buffer.from(bin);
}

/* ---------- 3. 主流程 ---------- */
(async () => {
  const text = collectChars();
  console.log(`统计到 ${text.length} 个字符（其中非 ASCII ${[...text].filter((c) => c.charCodeAt(0) > 127).length} 个）`);
  fs.mkdirSync(OUT_FONT, { recursive: true });
  /* --dump-chars：把字符集导出到临时目录，供覆盖率校验脚本比对（不写进仓库） */
  if (process.argv.includes('--dump-chars')) {
    fs.writeFileSync(path.join(require('os').tmpdir(), 'charset.txt'), text, 'utf8');
    console.log('  字符集已导出到 ' + path.join(require('os').tmpdir(), 'charset.txt'));
  }

  const faces = [];
  for (const f of FAMILIES) {
    for (const w of f.weights) {
      const buf = await fetchWeight(f.family, w, text);
      const file = `${f.slug}-${w}.woff2`;
      fs.writeFileSync(path.join(OUT_FONT, file), buf);
      faces.push({ family: f.family, weight: w, file, kb: (buf.length / 1024).toFixed(1) });
      console.log(`  ✓ ${file}  ${(buf.length / 1024).toFixed(1)} KB`);
    }
  }

  const css = `/* ============================================================
   自托管字体 —— 由 build-fonts.js 生成，请勿手改
   ------------------------------------------------------------
   每个文件都是只含本站实际用字的子集（text= 子集），
   所以体积远小于完整字族，也不需要发几十个 unicode-range 分片请求。
   改了文案后重跑： node build-fonts.js
   ============================================================ */
${faces.map((f) => `@font-face{
  font-family:'${f.family}';
  font-style:normal;
  font-weight:${f.weight};
  font-display:swap;
  src:url('../fonts/${f.file}') format('woff2');
}`).join('\n')}
`;
  fs.writeFileSync(OUT_CSS, css, 'utf8');
  const total = faces.reduce((s, f) => s + +f.kb, 0);
  console.log(`\n生成 assets/css/fonts.css，共 ${faces.length} 个字体文件 / ${total.toFixed(1)} KB`);
})().catch((e) => { console.error('失败：', e.message); process.exit(1); });
