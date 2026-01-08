import fs from 'fs';
import path from 'path';

/**
 * Verify that locale files are properly synchronized and valid
 */

const root = process.cwd();
const localesSrc = path.join(root, 'locales');
const localesDest = path.join(root, 'public', 'locales');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    log(`✗ ${label} does not exist: ${filePath}`, 'red');
    return false;
  }
  log(`✓ ${label} exists`, 'green');
  return true;
}

function checkFileSync(srcPath, destPath, filename) {
  if (!fs.existsSync(srcPath) || !fs.existsSync(destPath)) {
    log(`✗ Cannot compare ${filename} - files missing`, 'red');
    return false;
  }

  const srcContent = fs.readFileSync(srcPath, 'utf-8');
  const destContent = fs.readFileSync(destPath, 'utf-8');

  if (srcContent !== destContent) {
    log(`✗ ${filename} is out of sync between /locales and /public/locales`, 'red');
    log(`  Run: npm run prebuild to sync`, 'yellow');
    return false;
  }

  log(`✓ ${filename} is in sync`, 'green');
  return true;
}

function validateJSON(filePath, label) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    
    if (typeof parsed !== 'object' || parsed === null) {
      log(`✗ ${label} is not a valid JSON object`, 'red');
      return false;
    }

    const keys = Object.keys(parsed);
    log(`✓ ${label} is valid JSON (${keys.length} top-level keys)`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${label} has invalid JSON: ${error.message}`, 'red');
    return false;
  }
}

function compareTranslationKeys(enPath, frPath) {
  try {
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const frContent = JSON.parse(fs.readFileSync(frPath, 'utf-8'));

    function getKeys(obj, prefix = '') {
      let keys = [];
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys = keys.concat(getKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const enKeys = getKeys(enContent);
    const frKeys = getKeys(frContent);

    const enOnly = enKeys.filter(k => !frKeys.includes(k));
    const frOnly = frKeys.filter(k => !enKeys.includes(k));

    if (enOnly.length > 0 || frOnly.length > 0) {
      log(`⚠ Translation key mismatch:`, 'yellow');
      if (enOnly.length > 0) {
        log(`  - English has ${enOnly.length} keys not in French`, 'yellow');
        if (enOnly.length <= 10) {
          enOnly.forEach(k => log(`    • ${k}`, 'yellow'));
        }
      }
      if (frOnly.length > 0) {
        log(`  - French has ${frOnly.length} keys not in English`, 'yellow');
        if (frOnly.length <= 10) {
          frOnly.forEach(k => log(`    • ${k}`, 'yellow'));
        }
      }
      return false;
    }

    log(`✓ Translation keys match (${enKeys.length} keys)`, 'green');
    return true;
  } catch (error) {
    log(`✗ Failed to compare translation keys: ${error.message}`, 'red');
    return false;
  }
}

// Run verification
log('\n=== Locale Files Verification ===\n', 'blue');

let allPassed = true;

// Check source files exist
log('Checking source locale files...', 'blue');
allPassed = checkFileExists(path.join(localesSrc, 'en.json'), 'Source en.json') && allPassed;
allPassed = checkFileExists(path.join(localesSrc, 'fr.json'), 'Source fr.json') && allPassed;

// Check public files exist
log('\nChecking public locale files...', 'blue');
allPassed = checkFileExists(path.join(localesDest, 'en.json'), 'Public en.json') && allPassed;
allPassed = checkFileExists(path.join(localesDest, 'fr.json'), 'Public fr.json') && allPassed;

// Validate JSON
log('\nValidating JSON syntax...', 'blue');
allPassed = validateJSON(path.join(localesSrc, 'en.json'), 'Source en.json') && allPassed;
allPassed = validateJSON(path.join(localesSrc, 'fr.json'), 'Source fr.json') && allPassed;

// Check sync status
log('\nChecking file synchronization...', 'blue');
allPassed = checkFileSync(
  path.join(localesSrc, 'en.json'),
  path.join(localesDest, 'en.json'),
  'en.json'
) && allPassed;
allPassed = checkFileSync(
  path.join(localesSrc, 'fr.json'),
  path.join(localesDest, 'fr.json'),
  'fr.json'
) && allPassed;

// Compare translation keys
log('\nComparing translation keys...', 'blue');
allPassed = compareTranslationKeys(
  path.join(localesSrc, 'en.json'),
  path.join(localesSrc, 'fr.json')
) && allPassed;

// Final result
log('\n=== Verification Complete ===\n', 'blue');
if (allPassed) {
  log('✓ All checks passed!', 'green');
  process.exit(0);
} else {
  log('✗ Some checks failed. Please review the issues above.', 'red');
  process.exit(1);
}

