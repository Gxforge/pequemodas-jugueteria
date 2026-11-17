#!/usr/bin/env node
/* global fetch */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LIVE = process.argv.includes('--live');
const ADS_SRC = 'https://studiolexair.ddns.net/ads.js';
const PATCH_SRC = '/ads-cors-patch.js';
const ADS_HOST = 'https://studiolexair.ddns.net';
const FEED_HOST = 'https://ywrspyrplgwxkwdboaiz.supabase.co';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

const APPS = [
  {
    label: 'Tienda Pública',
    dir: 'apps/storefront',
    url: process.env.STOREFRONT_URL || 'https://pequemodas.vercel.app',
    expectsScript: true
  },
  {
    label: 'Panel Admin',
    dir: 'apps/admin',
    url: process.env.ADMIN_URL || 'https://pequemodas-admin.vercel.app',
    expectsScript: false
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function scriptTags(html) {
  return [...html.matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
}

function findBySrc(html, src) {
  return scriptTags(html).filter((tag) => tag.includes(`src="${src}"`));
}

function checkCsp(value, label) {
  if (!value) return;
  assert(
    value.includes(ADS_HOST),
    `${label}: la CSP debe permitir ${ADS_HOST} en script-src, img-src y media-src`
  );
  assert(
    value.includes(FEED_HOST),
    `${label}: la CSP debe permitir ${FEED_HOST} en connect-src, img-src y media-src`
  );
  assert(
    value.includes("'self'"),
    `${label}: la CSP debe permitir scripts propios ('self') para ads-cors-patch.js`
  );
}

function readVercelCsp(app) {
  const config = JSON.parse(readFileSync(join(ROOT, app.dir, 'vercel.json'), 'utf8'));
  return (config.headers || [])
    .flatMap((entry) => entry.headers || [])
    .filter((header) => /content-security-policy/i.test(header.key))
    .map((header) => header.value)
    .join(' ');
}

function checkHtml(html, label, expectsScript) {
  const adsTags = findBySrc(html, ADS_SRC);
  const patchTags = findBySrc(html, PATCH_SRC);
  assert(
    expectsScript ? adsTags.length === 1 : adsTags.length === 0,
    `${label}: etiquetas de ads.js: ${adsTags.length}`
  );
  assert(
    expectsScript ? patchTags.length === 1 : patchTags.length === 0,
    `${label}: etiquetas de ads-cors-patch.js: ${patchTags.length}`
  );
  if (expectsScript) {
    const adsTag = adsTags[0];
    assert(adsTag.includes('data-project="pequemodas"'), `${label}: falta data-project`);
    assert(/\sdefer(?:\s|>)/i.test(adsTag), `${label}: ads.js debe llevar defer`);
    assert(
      adsTag.includes('crossorigin="anonymous"'),
      `${label}: ads.js requiere crossorigin por la cabecera CORP del servidor`
    );
    assert(/\sdefer(?:\s|>)/i.test(patchTags[0]), `${label}: el shim CORS debe llevar defer`);
  }
  assert(
    !/http-equiv=["']Content-Security-Policy/i.test(html),
    `${label}: una meta CSP no auditada podría bloquear los anuncios`
  );
  assert(
    !/SUPABASE_SERVICE_ROLE_KEY|vcp_|sb_secret_/i.test(html),
    `${label}: posible secreto privado en el HTML público`
  );
  return { adsTags: adsTags.length, patchTags: patchTags.length };
}

function checkStatic(app) {
  const dist = join(ROOT, app.dir, 'dist');
  const htmlPath = join(dist, 'index.html');
  assert(existsSync(htmlPath), `${app.label}: ejecuta pnpm build antes de validar`);

  const html = readFileSync(htmlPath, 'utf8');
  const counts = checkHtml(html, app.label, app.expectsScript);
  if (app.expectsScript) {
    const patchPath = join(dist, 'ads-cors-patch.js');
    assert(existsSync(patchPath), `${app.label}: falta ads-cors-patch.js en dist`);
    const patch = readFileSync(patchPath, 'utf8');
    assert(patch.includes('studiolexair.ddns.net'), `${app.label}: el shim no apunta al host de anuncios`);
    assert(patch.includes('crossOrigin'), `${app.label}: el shim no activa CORS`);
  }

  const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
  assert(sw.includes('studiolexair.ddns.net'), `${app.label}: el SW no excluye ads.js`);
  assert(
    sw.includes('ywrspyrplgwxkwdboaiz.supabase.co'),
    `${app.label}: el SW no excluye ads-feed`
  );
  assert(
    /NETWORK_ONLY_AD_HOSTS|network-only ads/i.test(sw),
    `${app.label}: falta la regla Network-Only explícita para anuncios`
  );

  checkCsp(readVercelCsp(app), `${app.label} vercel.json`);
  const deploy = readFileSync(join(ROOT, 'scripts/deploy-static.mjs'), 'utf8');
  if (/key:\s*['"]Content-Security-Policy['"]/i.test(deploy)) {
    assert(deploy.includes(ADS_HOST), 'deploy-static.mjs: CSP sin host de ads.js');
    assert(deploy.includes(FEED_HOST), 'deploy-static.mjs: CSP sin host de ads-feed');
    assert(deploy.includes("'self'"), "deploy-static.mjs: CSP sin 'self' para el shim");
  }

  console.log(
    `STATIC_ADS_OK ${app.label}: ads.js ${counts.adsTags}, shim ${counts.patchTags}, SW Network-Only, CSP auditada y cero secretos`
  );
}

async function checkLive(app) {
  const base = app.url.replace(/\/$/, '');
  const res = await fetch(`${base}/?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'User-Agent': IPHONE_UA, Accept: 'text/html' }
  });
  assert(res.ok, `${app.label}: / devolvió HTTP ${res.status}`);
  const html = await res.text();
  const counts = checkHtml(html, `${app.label} en vivo`, app.expectsScript);
  checkCsp(res.headers.get('content-security-policy'), `${app.label} en vivo`);
  if (app.expectsScript) {
    const patchRes = await fetch(`${base}${PATCH_SRC}?t=${Date.now()}`, { cache: 'no-store' });
    assert(
      patchRes.ok && /javascript/i.test(patchRes.headers.get('content-type') || ''),
      `${app.label}: ${PATCH_SRC} no responde como JavaScript`
    );
  }
  console.log(
    `LIVE_ADS_OK ${app.label}: ${base} sin bloqueo CSP, ads.js ${counts.adsTags} y shim ${counts.patchTags}`
  );
}

APPS.forEach(checkStatic);
console.log('STATIC_ADS_OK 2 aplicaciones, slug "pequemodas" y compatibilidad CORP');
if (LIVE) {
  for (const app of APPS) await checkLive(app);
  console.log('LIVE_ADS_OK Tienda y Panel verificados con agente de iPhone');
} else {
  console.log('Usa --live para verificar también las URLs de producción.');
}
