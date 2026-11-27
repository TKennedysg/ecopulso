// Servidor local de EcoPulso (entorno reproducible sin nube).
// Sirve la versión construida (dist/) y dos rutas de API.
// El token de administración se lee de la variable de entorno ECOPULSO_ADMIN_TOKEN;
// nunca se escribe en el código ni en los registros.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.csv': 'text/csv', '.css': 'text/css' };

async function version() {
  try { return JSON.parse(await readFile(join(RAIZ, 'version.json'), 'utf8')); } catch { return { version: 'desconocida' }; }
}

export function crearServidor() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const log = (code) => console.log(`${new Date().toISOString()} ${req.method} ${url.pathname} ${code}`);

    if (url.pathname === '/api/health') {
      const body = JSON.stringify({ status: 'ok', ...(await version()) });
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(body);
      return log(200);
    }
    if (url.pathname === '/api/admin/info') {
      const esperado = process.env.ECOPULSO_ADMIN_TOKEN;
      if (!esperado) { res.writeHead(503).end('{"error":"token de administración no configurado"}'); return log(503); }
      if (req.headers.authorization !== `Bearer ${esperado}`) { res.writeHead(401).end('{"error":"no autorizado"}'); return log(401); }
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ admin: true, ...(await version()) }));
      return log(200);
    }

    const ruta = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    try {
      const data = await readFile(join(RAIZ, ruta));
      res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' }).end(data);
      log(200);
    } catch {
      res.writeHead(404).end('No encontrado');
      log(404);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const puerto = Number(process.env.PORT || 8080);
  crearServidor().listen(puerto, () => console.log(`EcoPulso escuchando en http://localhost:${puerto}`));
}
