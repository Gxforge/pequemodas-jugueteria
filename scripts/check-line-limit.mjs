#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const MAX_LINES = 300;
const WARN_LINES = 250;
const ROOT_DIR = process.cwd();

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.vite',
  '.vercel',
  'playwright-report',
  'test-results'
]);

const CODE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.sql',
  '.sh',
  '.toml'
]);

function collectFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      collectFiles(fullPath, acc);
    } else if (CODE_EXTENSIONS.has(extname(entry).toLowerCase())) {
      acc.push(fullPath);
    }
  }
  return acc;
}

const files = collectFiles(ROOT_DIR);
const violations = [];
const warnings = [];

for (const filePath of files) {
  const content = readFileSync(filePath, 'utf8');
  const lineCount = content.length === 0 ? 0 : content.split(/\r?\n/).length;
  const relPath = relative(ROOT_DIR, filePath);

  if (lineCount > MAX_LINES) {
    violations.push({ relPath, lineCount });
  } else if (lineCount >= WARN_LINES) {
    warnings.push({ relPath, lineCount });
  }
}

console.log(
  `[check-line-limit] Analizados ${files.length} archivos de código (límite estricto: ${MAX_LINES} líneas).`
);

for (const w of warnings) {
  console.warn(`  [AVISO >=${WARN_LINES}] ${w.relPath}: ${w.lineCount} líneas`);
}

if (violations.length > 0) {
  console.error('\n[ERROR] Los siguientes archivos superan el límite de 300 líneas:');
  for (const v of violations) {
    console.error(`  - ${v.relPath}: ${v.lineCount} líneas`);
  }
  process.exit(1);
}

console.log('[OK] Todos los archivos cumplen la regla de modularidad (<= 300 líneas).');
