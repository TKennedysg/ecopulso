// Construye dist/: copia la web y el núcleo, e inyecta versión, commit y fecha.
import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const commit = (process.env.GITHUB_SHA || 'local').slice(0, 7);
const fecha = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
const html = (await readFile('web/index.html', 'utf8'))
  .replaceAll('{{VERSION}}', pkg.version).replaceAll('{{COMMIT}}', commit).replaceAll('{{FECHA}}', fecha);
await writeFile('dist/index.html', html);
await copyFile('src/core.js', 'dist/core.js');
await copyFile('data/lecturas_ejemplo.csv', 'dist/lecturas_ejemplo.csv');
await copyFile('data/lecturas_lab_nuevo.csv', 'dist/lecturas_lab_nuevo.csv');
await writeFile('dist/version.json', JSON.stringify({ version: pkg.version, commit, construido: fecha }, null, 2));
console.log(`dist/ construido · v${pkg.version} · ${commit}`);
