import fs from 'fs';
import path from 'path';

/**
 * Sync locale files from /locales to /public/locales
 * This ensures translation files are accessible via both dynamic import and fetch
 */

const root = process.cwd();
const localesSrc = path.join(root, 'locales');
const localesDest = path.join(root, 'public', 'locales');

function syncLocaleFile(filename) {
  const src = path.join(localesSrc, filename);
  const dest = path.join(localesDest, filename);
  
  if (!fs.existsSync(src)) {
    console.warn(`[sync-locales] Source file not found: ${filename}`);
    return;
  }
  
  try {
    // Ensure destination directory exists
    fs.mkdirSync(localesDest, { recursive: true });
    
    // Copy file
    fs.copyFileSync(src, dest);
    console.log(`[sync-locales] Synced ${filename}`);
  } catch (error) {
    console.error(`[sync-locales] Failed to sync ${filename}:`, error.message);
    process.exit(1);
  }
}

// Sync all locale files
const localeFiles = ['en.json', 'fr.json'];

console.log('[sync-locales] Starting locale synchronization...');

localeFiles.forEach(syncLocaleFile);

console.log('[sync-locales] Locale synchronization complete!');

