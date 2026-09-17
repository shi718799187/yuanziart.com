/* ============================================================
   构建脚本
   ------------------------------------------------------------
   把 content/site-data.js 的内容注入 templates/*.html，
   生成纯静态 HTML 到 dist/。

   运行：  node build.js        （或双击 build.bat）
   产物：  dist/  ← 部署这个目录
   ------------------------------------------------------------
   模板语法
     {{path.to.value}}              取值
     {{#each arr}} ... {{/each}}    循环（循环内用 item.xxx、index）
     {{#if path}} ... {{/if}}       条件
     {{> partial}}                  引用 templates/_partials/partial.html
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TPL = path.join(ROOT, 'templates');
const PART = path.join(TPL, '_partials');
const DIST = path.join(ROOT, 'dist');

const data = require('./content/site-data.js');

/* ---------- 取值：支持 a.b.c ---------- */
function get(obj, p) {
  return String(p).split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

/* ---------- 变量替换 ---------- */
function applyVars(t, ctx) {
  return t.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
    const v = get(ctx, k);
    return v === undefined || v === null ? '' : String(v);
  });
}

/* ---------- 块解析（支持嵌套 each / if） ---------- */
const BLOCK_RE = /\{\{#(each|if)\s+([\w.]+)\}\}/g;
function renderBlocks(t, ctx) {
  BLOCK_RE.lastIndex = 0;
  let m;
  while ((m = BLOCK_RE.exec(t)) !== null) {
    const type = m[1], key = m[2];
    const openStart = m.index;
    const openEnd = openStart + m[0].length;

    // 找配对的结束标签（同类块计数）
    const token = /\{\{#(?:each|if)\s+[\w.]+\}\}|\{\{\/(?:each|if)\}\}/g;
    token.lastIndex = openEnd;
    let depth = 1, closeStart = -1, closeEnd = -1, n;
    while ((n = token.exec(t)) !== null) {
      if (n[0].charAt(2) === '#') depth++;
      else if (--depth === 0) { closeStart = n.index; closeEnd = n.index + n[0].length; break; }
    }
    if (closeStart < 0) break;

    const body = t.slice(openEnd, closeStart);
    let out;
    if (type === 'if') {
      out = get(ctx, key) ? applyVars(renderBlocks(body, ctx), ctx) : '';
    } else {
      const arr = get(ctx, key) || [];
      out = arr.map((it, i) => {
        const c2 = Object.assign({}, ctx, { item: it, index: i });
        return applyVars(renderBlocks(body, c2), c2);
      }).join('');
    }
    t = t.slice(0, openStart) + out + t.slice(closeEnd);
    BLOCK_RE.lastIndex = openStart + out.length;
  }
  return t;
}

/* ---------- 主渲染 ---------- */
function render(t, ctx) {
  // 1. 展开 partial
  t = t.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (m, name) => {
    const f = path.join(PART, name + '.html');
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  });
  // 2. 块 -> 3. 变量
  return applyVars(renderBlocks(t, ctx), ctx);
}

/* ---------- 输出 ---------- */
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function copyDir(src, dst) {
  ensureDir(dst);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

const PAGES = [
  { file: 'index.html',     key: 'home',      src: 'home' },
  { file: 'portfolio.html', key: 'portfolio', src: 'portfolio' },
  { file: 'courses.html',   key: 'courses',   src: 'course' },
  { file: 'about.html',     key: 'about',     src: 'about' }
];

/* ---------- 页面在 URL 上的位置 ----------
   与 Cloudflare 静态资源的默认 HTML 处理保持一致：
   它会把 /about.html 307 规范化成 /about（去掉扩展名）。
   所以 canonical / og:url / sitemap 都要用无扩展名形式，
   否则它们指向的是一个"会跳转"的地址，和实际地址对不上。
   首页指向根目录。 */
function urlPath(file) {
  return file === 'index.html' ? '' : file.replace(/\.html$/, '');
}

/* ---------- 结构化数据（JSON-LD） ----------
   统一用 JSON.stringify 生成，而不是在 HTML 模板里手写 JSON ——
   这样文案里出现引号 / 换行也不会把 JSON 写坏。
   只有填了 site.domain 才输出绝对 URL。 */
function ldFor(p) {
  const base = (data.site.domain || '').replace(/\/+$/, '');
  const seo = data[p.src].seo;
  /* 首页指向根目录，其余指向无扩展名路径 */
  const pageUrl = base ? base + '/' + urlPath(p.file) : '';

  const person = {
    '@type': 'Person',
    name: data.site.name,
    alternateName: data.site.nameEn,
    jobTitle: '插画师',
    description: seo.desc,
    email: data.contact.email,
    knowsAbout: ['儿童插画', '插画教学', '数字绘画']
  };
  if (pageUrl) person.url = pageUrl;

  const graph = [person];

  if (p.key === 'home') {
    const siteLd = {
      '@type': 'WebSite',
      name: data.site.name + ' · 插画师',
      description: seo.desc,
      inLanguage: data.site.locale
    };
    if (base) siteLd.url = base + '/';
    graph.push(siteLd);
  }

  if (p.key === 'courses') {
    const courseLd = {
      '@type': 'Course',
      /* 课程名直接取自内容源，避免和页面上写的不一致 */
      name: data.course.head.title.map(t => t.text).join(''),
      description: seo.desc,
      inLanguage: data.site.locale,
      provider: { '@type': 'Person', name: data.site.name }
    };
    if (pageUrl) courseLd.url = pageUrl;
    graph.push(courseLd);
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/* ---------- 先清掉上一次的产物 ----------
   以前不清，导致删掉的图片 / 页面会一直留在 dist 里继续被部署。
   现在 dist/ 里的一切都是构建生成的 —— 本地预览服务器已经挪到根目录的
   preview.js，不再往 dist/ 里塞手工文件，所以这里可以清得干净。 */
const GENERATED = [
  'index.html', 'portfolio.html', 'courses.html', 'about.html', '404.html',
  'robots.txt', 'sitemap.xml'
];
if (fs.existsSync(DIST)) {
  for (const f of GENERATED) {
    const p = path.join(DIST, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  const assetsDir = path.join(DIST, 'assets');
  if (fs.existsSync(assetsDir)) fs.rmSync(assetsDir, { recursive: true, force: true });
  /* 实验页目录同样是产物：源目录删掉了就得一起清掉，不留陈年副本 */
  const labDir = path.join(DIST, 'lab');
  if (fs.existsSync(labDir)) fs.rmSync(labDir, { recursive: true, force: true });
}

/* ---------- 胶片长廊的卡位 ----------
   长廊是首尾相接的循环带，卡位太少就转不起来（两侧看不到"下一张"）。
   原作就是 9 个卡位放 4 张肖像，所以这里也按"整轮循环"补到至少 9 张。
   补的是同一批作品的循环引用，不是假作品 —— 作品变多以后会自动变干净。 */

/* 读图片真实像素尺寸，写进长廊卡片的 <img width height> ——
   长廊的卡是"图片自己撑开高度"，有了宽高，浏览器在图片到达之前
   就能按正确比例占位 —— 否则首屏会先看到一叠细线再撑开。
   两种格式各读各的文件头：
     PNG  —— IHDR 的宽高各 4 字节大端，位于第 16 / 20 字节
     JPEG —— 扫到 SOF 段，高度在 +5、宽度在 +7（各 2 字节大端） */
function pngSize(file) {
  try {
    const buf = fs.readFileSync(file);
    if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch (e) { return null; }
}

function jpgSize(file) {
  try {
    const buf = fs.readFileSync(file);
    if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      /* 带尺寸的是 SOF0~SOF15（0xC0-0xCF），排除 DHT(0xC4) / JPG(0xC8) / DAC(0xCC) */
      if (marker >= 0xc0 && marker <= 0xcf &&
          marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      /* 没有长度字段的标记（填充 / 重启 / EOI），只占 2 字节 */
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  } catch (e) { return null; }
}

/* 作品图是双格式：WebP 是主资源（<picture><source>），JPEG 是回退图。
   比例以 JPEG 为准 —— 两者是同一张图缩放来的，比例一致。 */
function imgSize(base) {
  return jpgSize(base + '.jpg') || pngSize(base + '.png');
}

const FILMSTRIP_MIN = 9;
function filmstripDeck(list) {
  if (!list.length) return [];
  const count = Math.ceil(FILMSTRIP_MIN / list.length) * list.length;
  return Array.from({ length: count }, (_, i) => {
    const work = list[i % list.length];
    const size = imgSize(path.join(ROOT, work.img)) || {};
    return Object.assign({}, work, {
      w: size.w || '',
      h: size.h || '',
      loading: i === 0 ? 'eager' : 'lazy'
    });
  });
}

ensureDir(DIST);

for (const p of PAGES) {
  const tplPath = path.join(TPL, p.file);
  let tpl = fs.readFileSync(tplPath, 'utf8');

  const nav = data.nav.map(n => Object.assign({}, n, { active: n.key === p.key }));
  const featured = data.works.filter(w => w.featured);
  // 首项默认选中 / 首图不用懒加载（利于首屏速度）
  const filters = data.portfolio.filters.map((f, i) => Object.assign({}, f, { active: i === 0 }));
  const stack = data.home.hero.stack.map((s, i) => Object.assign({}, s, { loading: i === 0 ? 'eager' : 'lazy' }));
  const featuredWorks = featured.map((w, i) => Object.assign({}, w, { loading: i === 0 ? 'eager' : 'lazy' }));

  const ctx = Object.assign({}, data, {
    pageKey: p.key,
    pageFile: p.file,
    pageUrlPath: urlPath(p.file),
    ldJson: ldFor(p),
    nav: nav,
    filters: filters,
    stack: stack,
    featuredWorks: featuredWorks,
    /* 首页精选长廊的卡位（补到循环长度，见 filmstripDeck） */
    filmstrip: filmstripDeck(featuredWorks),
    seo: data[p.src].seo,
    year: new Date().getFullYear()
  });

  const html = render(tpl, ctx);
  fs.writeFileSync(path.join(DIST, p.file), html, 'utf8');
  console.log('  ✓ ' + p.file);
}

/* 复制静态资源 */
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
console.log('  ✓ assets/');

/* 实验页（lab/）也带进 dist —— 这样线上就能直接看效果，不必再开本地服务器。
   整页 noindex 且不进入任何导航；不想发布时删掉 lab/ 目录，这段会自己跳过。 */
const LAB = path.join(ROOT, 'lab');
if (fs.existsSync(LAB)) {
  copyDir(LAB, path.join(DIST, 'lab'));
  console.log('  ✓ lab/（实验页 · noindex）');
}

/* robots.txt —— 始终生成（无域名时只放行全站） */
const robotsBase = (data.site.domain || '').replace(/\/+$/, '');
const robotsTxt = robotsBase
  ? `User-agent: *\nAllow: /\nSitemap: ${robotsBase}/sitemap.xml\n`
  : `User-agent: *\nAllow: /\n`;
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt, 'utf8');
console.log('  ✓ robots.txt');

/* sitemap.xml —— 需配置 site.domain 才生成绝对地址（搜索引擎要求绝对 URL） */
if (data.site.domain) {
  /* 首页指向根目录 —— 必须和 canonical 写的一致。
     若写成 /index.html，canonical 说的是 /，两处对不上，搜索引擎得额外判断一次，
     还有被当成两个页面的风险。 */
  const urls = PAGES.map(p =>
    `  <url><loc>${robotsBase}/${urlPath(p.file)}</loc></url>`).join('\n');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
  console.log('  ✓ sitemap.xml');
} else {
  console.log('  · 未填 site.domain，跳过 sitemap.xml（上线前在 content/site-data.js 填 domain 后重建即自动生成）');
}

/* 404 */
if (fs.existsSync(path.join(TPL, '404.html'))) {
  const ctx = Object.assign({}, data, {
    pageKey: '', pageFile: '404.html', pageUrlPath: urlPath('404.html'),
    ldJson: ldFor({ file: '404.html', key: 'notfound', src: 'home' }),
    nav: data.nav, featuredWorks: [], seo: data.home.seo, year: new Date().getFullYear()
  });
  fs.writeFileSync(path.join(DIST, '404.html'), render(fs.readFileSync(path.join(TPL, '404.html'), 'utf8'), ctx), 'utf8');
  console.log('  ✓ 404.html');
}

console.log('\n构建完成 -> dist/');
