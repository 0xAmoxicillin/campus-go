#!/usr/bin/env node
/*
 * CampusGo 独立分发包 · 零依赖静态服务器（仅 Node 内置模块）。
 *
 * 职责：
 *   1) 托管 Vite 构建产物（apps/web/dist），未知路径 SPA 回退到 index.html；
 *   2) 把 /api、/docs、/docs-json、/health 反向代理到 NestJS server，
 *      这样前端构建时固定 VITE_API_BASE_URL=/api，浏览器只与 web 同源通信，
 *      无需 CORS 白名单、无需在前端硬编码 server 端口，端口可被 .env 覆盖。
 *
 * 用法（由 bin/campus-go 拉起，一般不直接调用）：
 *   CAMPUS_GO_API_UPSTREAM=http://127.0.0.1:3001 \
 *     node static-server.cjs <静态目录> <端口>
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || 'web/dist');
const port = parseInt(process.argv[3] || process.env.WEB_PORT || '5173', 10);
const upstream = (process.env.CAMPUS_GO_API_UPSTREAM || 'http://127.0.0.1:3001').replace(/\/$/, '');
const proxyPrefixes = ['/api', '/docs', '/health'];

if (!Number.isFinite(port) || port <= 0) {
  // eslint-disable-next-line no-console
  console.error('[web] 端口无效:', process.argv[3]);
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'index.html'))) {
  // eslint-disable-next-line no-console
  console.error('[web] 未找到 index.html，请先构建前端:', root);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function proxy(req, res) {
  let target;
  try {
    target = new URL(upstream + req.url);
  } catch {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad gateway (invalid upstream)');
  }

  const headers = { ...req.headers };
  // 交给 http.request 依据目标地址重新设置 Host，避免把浏览器侧的 Host 透传过去。
  delete headers.host;
  delete headers['accept-encoding'];

  const upstreamReq = http.request(
    target,
    { method: req.method, headers, timeout: 15000 },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstreamReq.on('timeout', () => upstreamReq.destroy(new Error('upstream timeout')));
  upstreamReq.on('error', (e) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Bad gateway: ${e.message}`);
    } else {
      res.destroy();
    }
  });
  req.pipe(upstreamReq);
}

function serveStatic(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad request');
  }
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  let filePath = path.resolve(root, '.' + urlPath);
  // 目录穿越防护：解析后的路径必须仍在 root 之内。
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    let target = filePath;
    if (err || !stat.isFile()) {
      // 前端路由（/login、/admin/... 等）一律回退到 SPA 入口。
      target = path.join(root, 'index.html');
    }
    fs.readFile(target, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  if (proxyPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return proxy(req, res);
  }
  return serveStatic(req, res);
});

server.on('error', (e) => {
  // eslint-disable-next-line no-console
  console.error('[web] 静态服务器启动失败:', e.message);
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[web] 静态托管已启动: http://localhost:${port}  (目录: ${root})`);
  // eslint-disable-next-line no-console
  console.log(`[web] API 反向代理: /api -> ${upstream}`);
});
