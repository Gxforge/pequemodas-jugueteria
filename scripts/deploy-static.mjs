#!/usr/bin/env node
/* global fetch, Buffer, setTimeout */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const API = 'https://api.vercel.com';
const TOKENS_FILE = '/home/user/uploads/tokens.txt';
const STORE_VERSION = '/home/user/pequemodas-jugueteria/apps/storefront/public/version.json';
const ADMIN_VERSION = '/home/user/pequemodas-jugueteria/apps/admin/public/version.json';
const VERSION = JSON.parse(readFileSync(STORE_VERSION, 'utf8')).version;
if (VERSION !== JSON.parse(readFileSync(ADMIN_VERSION, 'utf8')).version) {
  throw new Error('Las versiones de Storefront y Admin no coinciden.');
}

function readToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const found = readFileSync(TOKENS_FILE, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('vcp_'));
  if (!found) throw new Error('Define VERCEL_TOKEN o coloca el token vcp_ en el archivo de credenciales.');
  return found;
}

const token = readToken();
const HEADERS = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function api(path, method = 'GET', body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    const msg = typeof json === 'object' && json !== null
      ? (json.error?.message ?? JSON.stringify(json))
      : String(json);
    throw new Error(`${method} ${path} -> HTTP ${res.status}: ${msg.slice(0, 900)}`);
  }
  return json;
}

// Conserva SIEMPRE la ruta relativa desde la raíz de dist (assets/..., brand/...).
function collectFiles(dir, root = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full, root));
    } else if (entry.isFile()) {
      const file = posix.normalize(relative(root, full).replace(/\\/g, '/'));
      out.push({ file, data: readFileSync(full).toString('base64'), encoding: 'base64' });
    }
  }
  return out;
}

const VERCEL_JSON = Buffer.from(JSON.stringify({
  version: 2,
  framework: null,
  headers: [
    { source: '/version.json', headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }] },
    { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }] },
    { source: '/manifest.webmanifest', headers: [
      { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
      { key: 'Cache-Control', value: 'no-cache, must-revalidate, max-age=0' }
    ] },
    { source: '/apple-touch-icon.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' }] },
    { source: '/icons/apple-touch-icon.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' }] },
    { source: '/index.html', headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate, max-age=0' }] },
    { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
    ] }
  ],
  rewrites: [{ source: '/(.*)', destination: '/index.html' }]
}, null, 2)).toString('base64');

const DEPLOY_SETTINGS = {
  framework: null,
  rootDirectory: null,
  buildCommand: null,
  installCommand: null,
  outputDirectory: null
};
const CLEAR_PROJECT = { ...DEPLOY_SETTINGS, ssoProtection: null };

const PROJECTS = [
  {
    label: 'Tienda Pública',
    name: 'pequemodas',
    projectId: 'prj_A6KZQBrIogGJnuQ397A0Ekdu5vyj',
    dist: '/home/user/pequemodas-jugueteria/apps/storefront/dist',
    aliases: ['pequemodas.vercel.app', 'pequemodas-junmoxia41s-projects.vercel.app']
  },
  {
    label: 'Panel Admin',
    name: 'pequemodas-admin',
    projectId: 'prj_aJWPzms9RNAcm67A85rJoO0IYkC2',
    dist: '/home/user/pequemodas-jugueteria/apps/admin/dist',
    aliases: ['pequemodas-admin.vercel.app', 'pequemodas-admin-junmoxia41s-projects.vercel.app']
  }
];

function restorePayload(original) {
  return {
    framework: original.framework ?? null,
    rootDirectory: original.rootDirectory ?? null,
    buildCommand: original.buildCommand ?? null,
    installCommand: original.installCommand ?? null,
    outputDirectory: original.outputDirectory ?? null,
    ssoProtection: original.ssoProtection ?? null
  };
}

async function waitReady(id) {
  for (let i = 0; i < 90; i += 1) {
    const dep = await api(`/v13/deployments/${id}`);
    const state = dep.readyState ?? dep.state;
    if (state === 'READY') return dep;
    if (state === 'ERROR' || state === 'CANCELED') throw new Error(`Deployment ${id} ${state}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Timeout esperando ${id}`);
}

async function verifyHost(host, assets) {
  let lastError = '';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const base = `https://${host}`;
      const versionRes = await fetch(`${base}/version.json?t=${Date.now()}`, { cache: 'no-store' });
      const versionJson = await versionRes.json().catch(() => ({}));
      if (!versionRes.ok || versionJson.version !== VERSION) {
        throw new Error(`version ${versionRes.status} ${JSON.stringify(versionJson)}`);
      }
      const swRes = await fetch(`${base}/sw.js?t=${Date.now()}`, { cache: 'no-store' });
      const swCache = swRes.headers.get('cache-control') || '';
      if (!swRes.ok || !swCache.includes('no-store')) {
        throw new Error(`sw.js ${swRes.status} ${swCache}`);
      }
      for (const asset of assets) {
        const res = await fetch(`${base}/${asset}?t=${Date.now()}`, { cache: 'no-store' });
        const ct = res.headers.get('content-type') || '';
        const body = (await res.text()).trim();
        if (!res.ok || body.startsWith('<!doctype') || !/javascript|css/i.test(ct)) {
          throw new Error(`${asset} ${res.status} ${ct} ${body.slice(0, 40)}`);
        }
      }
      const spa = await fetch(`${base}/catalogo`, { cache: 'no-store' });
      const spaBody = await spa.text();
      if (!spa.ok || !spaBody.includes('<div id="root"')) {
        throw new Error(`SPA fallback ${spa.status}`);
      }
      const iphoneHeaders = {
        'cache-control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
      };
      const iconRes = await fetch(`${base}/icons/apple-touch-icon.png?t=${Date.now()}`, { headers: iphoneHeaders });
      const iconType = iconRes.headers.get('content-type') || '';
      const iconHead = Buffer.from(await iconRes.arrayBuffer()).subarray(0, 8).toString('hex');
      if (!iconRes.ok || !/image\/png/i.test(iconType) || iconHead !== '89504e470d0a1a0a') {
        throw new Error(`Icono Apple ${iconRes.status} ${iconType}`);
      }
      const manifestRes = await fetch(`${base}/manifest.webmanifest?t=${Date.now()}`, { headers: iphoneHeaders });
      const manifestJson = await manifestRes.json().catch(() => null);
      if (!manifestRes.ok || manifestJson?.display !== 'standalone') {
        throw new Error(`Manifest iOS ${manifestRes.status}`);
      }
      const iosHtmlRes = await fetch(`${base}/?t=${Date.now()}`, { headers: iphoneHeaders });
      const iosHtml = await iosHtmlRes.text();
      if (!iosHtmlRes.ok || !iosHtml.includes('apple-mobile-web-app-capable')) {
        throw new Error(`Meta etiquetas iOS ${iosHtmlRes.status}`);
      }
      return {
        version: versionJson.version,
        versionCache: versionRes.headers.get('cache-control'),
        swCache,
        assetCount: assets.length,
        spa: spa.status,
        iosIcon: iconRes.status,
        iosManifest: manifestRes.status
      };
    } catch (err) {
      lastError = String(err);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error(`${host} no pasó la verificación: ${lastError}`);
}

const results = [];
for (const project of PROJECTS) {
  const original = await api(`/v9/projects/${project.projectId}`);
  const restore = restorePayload(original);
  let cleared = false;
  try {
    await api(`/v9/projects/${project.projectId}`, 'PATCH', CLEAR_PROJECT);
    cleared = true;
    const files = collectFiles(project.dist);
    const assets = files
      .filter((file) => file.file.startsWith('assets/') && /\.(js|css)$/.test(file.file))
      .map((file) => file.file)
      .slice(0, 4);
    if (assets.length < 2) throw new Error(`${project.label}: faltan assets anidados en dist`);
    files.push({ file: 'vercel.json', data: VERCEL_JSON, encoding: 'base64' });

    const created = await api('/v13/deployments?forceNew=1&skipAutoDetectionConfirmation=1', 'POST', {
      name: project.name,
      project: project.projectId,
      files,
      projectSettings: DEPLOY_SETTINGS,
      meta: { version: VERSION, release: 'static-deploy-correct-asset-paths' }
    });
    const id = created.id;
    console.log(`DEPLOY ${project.label} ${id} ${created.readyState ?? 'QUEUED'}`);
    const ready = await waitReady(id);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const previewCheck = await verifyHost(ready.url, assets);
    console.log(`PREVIEW_OK ${project.label}`, JSON.stringify(previewCheck));

    for (const alias of project.aliases) {
      try {
        await api(`/v2/deployments/${id}/aliases`, 'POST', { alias });
        console.log(`ALIAS ${alias}`);
      } catch (err) {
        if (!String(err).includes('409')) throw err;
        console.log(`ALIAS ${alias} ya asignado`);
      }
    }
    const liveCheck = await verifyHost(project.aliases[0], assets);
    const result = { label: project.label, id, url: ready.url, aliases: project.aliases, check: liveCheck };
    results.push(result);
    console.log(`LIVE_OK ${project.label}`, JSON.stringify(liveCheck));
  } finally {
    if (cleared) {
      await api(`/v9/projects/${project.projectId}`, 'PATCH', restore);
      console.log(`RESTORE ${project.label} settings`);
    }
  }
}

writeFileSync('/tmp/pequemodas-deploy-result.json', JSON.stringify(results, null, 2));
console.log('DONE', JSON.stringify(results.map((r) => ({ label: r.label, id: r.id })), null, 2));
