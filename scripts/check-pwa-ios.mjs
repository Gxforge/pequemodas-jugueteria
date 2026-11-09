#!/usr/bin/env node
/* global fetch */
import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LIVE = process.argv.includes('--live');
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const APPS = [
  {
    label: 'Tienda Pública',
    dir: 'apps/storefront',
    url: process.env.STOREFRONT_URL || 'https://pequemodas.vercel.app'
  },
  {
    label: 'Panel Admin',
    dir: 'apps/admin',
    url: process.env.ADMIN_URL || 'https://pequemodas-admin.vercel.app'
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkAppleIcon(bytes, where) {
  assert(
    bytes.length > 26 && bytes.subarray(0, 8).equals(PNG_SIGNATURE),
    `${where}: no es un PNG real (posible index.html disfrazado)`
  );
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  assert(width === 180 && height === 180, `${where}: mide ${width}x${height}, se requiere 180x180`);
  assert(colorType === 2, `${where}: el icono debe ser RGB opaco sin canal alfa`);
}

function expectedVersion() {
  const source = readFileSync(join(ROOT, 'packages/config/src/constants.ts'), 'utf8');
  const match = source.match(/version:\s*'([^']+)'/);
  assert(match, 'No se pudo leer APP_RELEASE.version');
  return match[1];
}

function checkManifest(manifest, label) {
  assert(manifest.display === 'standalone', `${label}: manifest.display debe ser standalone`);
  assert(manifest.start_url === '/', `${label}: start_url debe ser / para Safari en iOS`);
  assert(manifest.scope === '/', `${label}: scope debe ser /`);
  assert(typeof manifest.name === 'string' && manifest.name.length > 0, `${label}: falta name`);
  const sizes = (manifest.icons || []).map((icon) => icon.sizes);
  for (const size of ['180x180', '192x192', '512x512']) {
    assert(sizes.includes(size), `${label}: falta el icono ${size} en el manifest`);
  }
  assert(
    (manifest.icons || []).some((icon) => icon.purpose === 'maskable'),
    `${label}: falta el icono maskable para Android`
  );
}

function checkStatic(app) {
  const dist = join(ROOT, app.dir, 'dist');
  assert(existsSync(join(dist, 'index.html')), `${app.label}: ejecuta pnpm build antes de validar`);

  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const requiredTags = [
    ['name="apple-mobile-web-app-capable" content="yes"', 'apple-mobile-web-app-capable'],
    ['name="mobile-web-app-capable" content="yes"', 'mobile-web-app-capable'],
    ['name="apple-mobile-web-app-title"', 'apple-mobile-web-app-title'],
    ['name="apple-mobile-web-app-status-bar-style"', 'apple-mobile-web-app-status-bar-style'],
    ['sizes="180x180"', 'enlace apple-touch-icon de 180x180'],
    ['href="/icons/apple-touch-icon.png"', 'ruta del icono Apple'],
    ['rel="manifest" href="/manifest.webmanifest"', 'enlace al manifest'],
    ['viewport-fit=cover', 'viewport-fit=cover para la muesca del iPhone']
  ];
  for (const [needle, name] of requiredTags) {
    assert(html.includes(needle), `${app.label}: falta ${name} en index.html`);
  }
  assert(!/user-scalable\s*=\s*no/i.test(html), `${app.label}: no bloquees el zoom en iOS`);

  const manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8'));
  checkManifest(manifest, app.label);
  for (const icon of manifest.icons || []) {
    const path = join(dist, icon.src.replace(/^\//, ''));
    assert(existsSync(path), `${app.label}: el manifest apunta a ${icon.src} que no existe`);
  }

  checkAppleIcon(readFileSync(join(dist, 'icons/apple-touch-icon.png')), `${app.label} /icons`);
  checkAppleIcon(readFileSync(join(dist, 'apple-touch-icon.png')), `${app.label} raíz`);

  const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
  assert(sw.includes('/icons/apple-touch-icon.png'), `${app.label}: el Service Worker no precarga el icono Apple`);
  assert(sw.includes('isUsableAsset'), `${app.label}: el Service Worker debe rechazar HTML como JS/CSS`);

  const version = JSON.parse(readFileSync(join(dist, 'version.json'), 'utf8')).version;
  assert(version === expectedVersion(), `${app.label}: version.json (${version}) no coincide con APP_RELEASE`);

  const platform = readFileSync(join(ROOT, 'packages/utils/src/pwa-platform.ts'), 'utf8');
  assert(platform.includes('Añadir a pantalla de inicio'), 'Falta la guía manual para iPhone');
  assert(platform.includes('Compartir'), 'La guía para iPhone debe mencionar Compartir');
  const guide = readFileSync(join(ROOT, 'packages/ui/src/IosInstallGuide.tsx'), 'utf8');
  assert(guide.includes('IosInstallSteps'), 'Falta el componente visible de la guía iPhone');

  console.log(`STATIC_OK ${app.label}: etiquetas Apple, manifest, icono 180x180, SW y v${version}`);
  return version;
}

async function fetchLive(base, path, label) {
  const res = await fetch(`${base}${path}${path.includes('?') ? '&' : '?'}t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'User-Agent': IPHONE_UA, Accept: '*/*' }
  });
  assert(res.ok, `${label}: ${path} devolvió HTTP ${res.status}`);
  return res;
}

async function checkLive(app, version) {
  const base = app.url.replace(/\/$/, '');
  const htmlRes = await fetchLive(base, '/', app.label);
  assert(/text\/html/i.test(htmlRes.headers.get('content-type') || ''), `${app.label}: / no devuelve HTML`);
  const html = await htmlRes.text();
  assert(html.includes('apple-mobile-web-app-capable'), `${app.label}: producción sin meta etiqueta Apple`);
  assert(html.includes('/icons/apple-touch-icon.png'), `${app.label}: producción sin enlace al icono Apple`);

  const manifestRes = await fetchLive(base, '/manifest.webmanifest', app.label);
  assert(
    /manifest\+json|application\/json/i.test(manifestRes.headers.get('content-type') || ''),
    `${app.label}: /manifest.webmanifest tiene content-type incorrecto`
  );
  checkManifest(await manifestRes.json(), `${app.label} en vivo`);

  for (const path of ['/icons/apple-touch-icon.png', '/apple-touch-icon.png']) {
    const iconRes = await fetchLive(base, path, app.label);
    assert(/image\/png/i.test(iconRes.headers.get('content-type') || ''), `${app.label}: ${path} no es image/png`);
    checkAppleIcon(Buffer.from(await iconRes.arrayBuffer()), `${app.label} ${path}`);
  }

  const swRes = await fetchLive(base, '/sw.js', app.label);
  assert(
    /javascript/i.test(swRes.headers.get('content-type') || ''),
    `${app.label}: /sw.js no devuelve application/javascript`
  );
  assert(!(await swRes.text()).trim().startsWith('<!doctype'), `${app.label}: /sw.js devuelve HTML`);

  const versionRes = await fetchLive(base, '/version.json', app.label);
  const liveVersion = (await versionRes.json()).version;
  assert(liveVersion === version, `${app.label}: producción tiene v${liveVersion}, se esperaba v${version}`);

  const assetMatch = html.match(/src="\/(assets\/[^"']+\.js)"/);
  assert(assetMatch, `${app.label}: no se encontró un bundle JS en el HTML`);
  const assetRes = await fetchLive(base, `/${assetMatch[1]}`, app.label);
  assert(
    /javascript/i.test(assetRes.headers.get('content-type') || ''),
    `${app.label}: ${assetMatch[1]} no devuelve application/javascript`
  );
  assert(!(await assetRes.text()).trim().startsWith('<!doctype'), `${app.label}: ${assetMatch[1]} devuelve HTML`);

  const spaRes = await fetchLive(base, '/catalogo', app.label);
  assert((await spaRes.text()).includes('<div id="root"'), `${app.label}: fallback SPA roto`);

  console.log(`LIVE_OK ${app.label}: iPhone Safari UA, v${version}, manifest/icono/SW/assets correctos en ${base}`);
}

const versions = APPS.map(checkStatic);
console.log(`STATIC_IOS_OK ${APPS.length} aplicaciones, versión ${versions[0]}`);
if (LIVE) {
  for (let i = 0; i < APPS.length; i += 1) {
    await checkLive(APPS[i], versions[i]);
  }
  console.log('LIVE_IOS_OK Tienda y Panel verificados con agente de iPhone');
} else {
  console.log('Usa --live para verificar también las URLs de producción.');
}
