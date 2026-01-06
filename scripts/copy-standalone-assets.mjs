import fs from 'fs';
import path from 'path';

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function rm(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

const root = process.cwd();
const nextDir = path.join(root, '.next');
const standaloneDir = path.join(nextDir, 'standalone');

if (!exists(standaloneDir)) {
  console.warn('[copy-standalone-assets] No .next/standalone directory found. Skipping.');
  process.exit(0);
}

const publicSrc = path.join(root, 'public');
const staticSrc = path.join(nextDir, 'static');

const publicDest = path.join(standaloneDir, 'public');
const staticDest = path.join(standaloneDir, '.next', 'static');

if (exists(publicSrc)) {
  rm(publicDest);
  copyDir(publicSrc, publicDest);
}

if (exists(staticSrc)) {
  rm(staticDest);
  copyDir(staticSrc, staticDest);
}

console.log('[copy-standalone-assets] Copied public/ and .next/static into .next/standalone/');


