#!/usr/bin/env node

/**
 * Facebook OAuth Endpoint Test Script
 * 
 * Tests the /auth/facebook endpoint before deploying to production.
 * 
 * Usage:
 *   node test-facebook-auth.js [backend-url] [facebook-access-token]
 * 
 * Example:
 *   node test-facebook-auth.js https://leftover-be.ccdev.space EAABsbCS1iHgBO...
 *   node test-facebook-auth.js http://localhost:3001 YOUR_FACEBOOK_TOKEN
 * 
 * Note: To get a Facebook access token for testing:
 * 1. Go to https://developers.facebook.com/tools/explorer/
 * 2. Select your app (Save The Plate - 4736031473289936)
 * 3. Click "Generate Access Token"
 * 4. Grant email and public_profile permissions
 * 5. Copy the token and use it in this script
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Get backend URL and token from command line or use defaults
const backendUrl = process.argv[2] || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://leftover-be.ccdev.space';
const facebookToken = process.argv[3] || process.env.FACEBOOK_ACCESS_TOKEN;

if (!facebookToken) {
  logError('Facebook access token is required!');
  console.log('');
  logInfo('Usage: node test-facebook-auth.js [backend-url] [facebook-access-token]');
  logInfo('Or set FACEBOOK_ACCESS_TOKEN environment variable');
  console.log('');
  logWarning('To get a Facebook access token:');
  logWarning('1. Go to https://developers.facebook.com/tools/explorer/');
  logWarning('2. Select your app (Save The Plate - 4736031473289936)');
  logWarning('3. Click "Generate Access Token"');
  logWarning('4. Grant email and public_profile permissions');
  logWarning('5. Copy the token');
  process.exit(1);
}

const url = new URL(`${backendUrl.replace(/\/$/, '')}/auth/facebook`);

logInfo(`Testing Facebook OAuth endpoint: ${url.toString()}`);
logInfo(`Using token: ${facebookToken.substring(0, 20)}...`);
console.log('');

// Prepare request data
const postData = JSON.stringify({
  accessToken: facebookToken,
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

// Determine which HTTP module to use
const httpModule = url.protocol === 'https:' ? https : http;

// Make the request
const req = httpModule.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('');
    logInfo(`Response Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('');

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200 || res.statusCode === 201) {
        logSuccess('Facebook authentication successful!');
        console.log('');
        logInfo('Response Data:');
        console.log(JSON.stringify(response, null, 2));
        console.log('');

        // Validate response structure
        const checks = {
          'Has accessToken': !!response.accessToken,
          'Has refreshToken': !!response.refreshToken,
          'Has user data': !!response.user,
          'Has role': !!response.role,
          'Has redirectTo': !!response.redirectTo,
        };

        console.log('Response Validation:');
        Object.entries(checks).forEach(([check, passed]) => {
          if (passed) {
            logSuccess(`  ${check}`);
          } else {
            logError(`  ${check}`);
          }
        });
        console.log('');

        if (response.user) {
          logInfo('User Information:');
          console.log(`  ID: ${response.user.id}`);
          console.log(`  Email: ${response.user.email}`);
          console.log(`  Role: ${response.user.role}`);
          console.log('');
        }

        if (response.needsOnboarding) {
          logWarning('User needs onboarding');
        } else {
          logSuccess('User is fully set up');
        }

        logSuccess('Overall: PASS');
      } else {
        logError(`Authentication failed: ${res.statusCode}`);
        console.log('');
        logError('Error Response:');
        console.log(JSON.stringify(response, null, 2));
        console.log('');

        if (response.error) {
          logError(`Error: ${response.error}`);
        }

        if (res.statusCode === 401) {
          logWarning('Possible issues:');
          logWarning('  - Facebook access token is invalid or expired');
          logWarning('  - Token does not belong to your app');
          logWarning('  - Email permission not granted');
        } else if (res.statusCode === 500) {
          logWarning('Possible issues:');
          logWarning('  - FACEBOOK_APP_ID not configured in backend');
          logWarning('  - FACEBOOK_APP_SECRET not configured in backend');
          logWarning('  - Backend server error');
        }

        logError('Overall: FAIL');
        process.exit(1);
      }
    } catch (error) {
      logError('Failed to parse response as JSON');
      logError(`Raw response: ${data}`);
      logError('Overall: FAIL');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('');
  logError(`Request Error: ${error.message}`);
  console.log('');

  if (error.code === 'ENOTFOUND') {
    logWarning('DNS Error:');
    logWarning('  - Check if the backend URL is correct');
    logWarning('  - Verify network connectivity');
  } else if (error.code === 'ECONNREFUSED') {
    logWarning('Connection Refused:');
    logWarning('  - Backend server may be down');
    logWarning('  - Check if backend is running on the specified URL');
  } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    logWarning('SSL Certificate Error:');
    logWarning('  - Backend SSL certificate may be invalid');
  }

  logError('Overall: FAIL');
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  console.log('');
  logError('Request timeout - no response from server');
  logWarning('  - Backend may be slow to respond');
  logWarning('  - Check network connectivity');
  logError('Overall: FAIL');
  process.exit(1);
});

// Set timeout
req.setTimeout(10000); // 10 seconds

// Send the request
req.write(postData);
req.end();

