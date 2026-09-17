/* ============================================================
   本地预览服务器（零依赖）
   ------------------------------------------------------------
   运行： node preview.js      然后浏览器打开 http://127.0.0.1:8080

   为什么放在项目根目录、而不是 dist/ 里：
   dist/ 是构建产物，被 .gitignore 忽略。之前这个文件放在 dist/server.js，
   结果就是换一台电脑 clone 下来、跑完 build.js，这个文件并不存在 ——
   文档里让你 `node dist/server.js` 会直接报错。
   放在根目录它才会跟着仓库走，且只依赖 dist/ 这个目录（先构建再预览）。

   它会：① 静态文件按真实 MIME 返回；② 找不到的路径回退到 dist/404.html。
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml'
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

if (!fs.existsSync(ROOT)) {
  console.error('找不到 dist/ —— 先跑一次构建：node build.js');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);
  // 防目录穿越
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      fs.readFile(filePath, (e, data) => {
        if (e) return send(res, 500, 'Server Error');
        send(res, 200, data, MIME[ext] || 'application/octet-stream');
      });
      return;
    }
    // 资源文件不存在 -> 404；其余路径回退到 404.html
    if (path.extname(urlPath)) return send(res, 404, 'Not Found');
    fs.readFile(path.join(ROOT, '404.html'), (e, data) => {
      if (e) return send(res, 404, 'Not Found');
      send(res, 404, data, 'text/html; charset=utf-8');
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`预览已启动： http://127.0.0.1:${PORT}   （Ctrl+C 停止）`);
  console.log(`服务目录： ${ROOT}`);
});
