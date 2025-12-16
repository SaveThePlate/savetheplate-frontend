#!/usr/bin/env node

/**
 * Google OAuth Endpoint Test Script
 * 
 * Tests the /auth/google endpoint before deploying to production.
 * 
 * Usage:
 *   node test-google-auth.js [backend-url]
 * 
 * Example:
 *   node test-google-auth.js https://leftover-be.ccdev.space
 *   node test-google-auth.js http://localhost:3001
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

// Get backend URL from command line or use default
const backendUrl = process.argv[2] || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://leftover-be.ccdev.space';
const url = new URL(`${backendUrl.replace(/\/$/, '')}/auth/google`);

logInfo(`Testing Google OAuth endpoint: ${url.toString()}`);
console.log('');

// Test results
const results = {
  connectivity: false,
  cors: false,
  method: false,
  errorHandling: false,
  contentType: false,
};

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          parsedBody = body;
        }
        
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: parsedBody,
          rawBody: body,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Test 1: Connectivity - Check if endpoint is reachable
 */
async function testConnectivity() {
  logInfo('Test 1: Checking endpoint connectivity...');
  
  try {
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'OPTIONS',
      timeout: 5000,
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 || response.statusCode === 204 || response.statusCode === 405) {
      logSuccess('Endpoint is reachable');
      results.connectivity = true;
      return true;
    } else {
      logWarning(`Endpoint responded with status ${response.statusCode}`);
      results.connectivity = true; // Still reachable, just different status
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Connection refused - backend may be down');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      logError('Connection timeout - backend may be slow or unreachable');
    } else if (error.code === 'ENOTFOUND') {
      logError(`DNS resolution failed - cannot find host: ${url.hostname}`);
    } else {
      logError(`Connection error: ${error.message}`);
    }
    results.connectivity = false;
    return false;
  }
}

/**
 * Test 2: CORS - Check if CORS headers are present
 */
async function testCORS() {
  logInfo('Test 2: Checking CORS configuration...');
  
  try {
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://leftover.ccdev.space',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
      timeout: 5000,
    };
    
    const response = await makeRequest(options);
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
    };
    
    if (corsHeaders['access-control-allow-origin']) {
      logSuccess('CORS headers present');
      log(`   Allow-Origin: ${corsHeaders['access-control-allow-origin']}`, 'dim');
      if (corsHeaders['access-control-allow-methods']) {
        log(`   Allow-Methods: ${corsHeaders['access-control-allow-methods']}`, 'dim');
      }
      results.cors = true;
      return true;
    } else {
      logWarning('CORS headers not found (may be configured differently)');
      logWarning('   This might cause issues if frontend and backend are on different domains');
      results.cors = false;
      return false;
    }
  } catch (error) {
    logWarning(`CORS check failed: ${error.message}`);
    results.cors = false;
    return false;
  }
}

/**
 * Test 3: Method - Check if POST method is accepted
 */
async function testMethod() {
  logInfo('Test 3: Checking POST method support...');
  
  try {
    const testData = JSON.stringify({
      credential: 'test-invalid-credential-for-testing-only',
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData),
        'Origin': 'https://leftover.ccdev.space',
      },
      timeout: 10000,
    };
    
    const response = await makeRequest(options, testData);
    
    // Check if Content-Type header is correct
    if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
      logSuccess('Content-Type header is correct (application/json)');
      results.contentType = true;
    } else {
      logWarning(`Content-Type: ${response.headers['content-type'] || 'not set'}`);
      results.contentType = false;
    }
    
    // POST method is accepted if we get a response (even if it's an error)
    if (response.statusCode !== 404 && response.statusCode !== 405) {
      logSuccess(`POST method is accepted (status: ${response.statusCode})`);
      results.method = true;
      return true;
    } else {
      logError(`POST method not accepted (status: ${response.statusCode})`);
      results.method = false;
      return false;
    }
  } catch (error) {
    logError(`Method test failed: ${error.message}`);
    results.method = false;
    return false;
  }
}

/**
 * Test 4: Error Handling - Check error response format
 */
async function testErrorHandling() {
  logInfo('Test 4: Checking error handling...');
  
  try {
    const testData = JSON.stringify({
      credential: 'invalid-google-credential-token-for-testing',
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData),
        'Origin': 'https://leftover.ccdev.space',
      },
      timeout: 10000,
    };
    
    const response = await makeRequest(options, testData);
    
    // Check response format
    if (typeof response.body === 'object') {
      logSuccess('Error response is valid JSON');
      
      // Check for common error fields
      if (response.body.message || response.body.error || response.body.statusCode) {
        logSuccess('Error response has expected structure');
        log(`   Status: ${response.statusCode}`, 'dim');
        if (response.body.message) {
          log(`   Message: ${response.body.message}`, 'dim');
        }
        results.errorHandling = true;
        return true;
      } else {
        logWarning('Error response structure may be non-standard');
        log(`   Response: ${JSON.stringify(response.body).substring(0, 100)}...`, 'dim');
        results.errorHandling = true; // Still valid, just different format
        return true;
      }
    } else {
      logWarning('Error response is not JSON');
      results.errorHandling = false;
      return false;
    }
  } catch (error) {
    logError(`Error handling test failed: ${error.message}`);
    results.errorHandling = false;
    return false;
  }
}

/**
 * Test 5: Missing credential - Check validation
 */
async function testValidation() {
  logInfo('Test 5: Checking request validation...');
  
  try {
    const testData = JSON.stringify({});
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData),
        'Origin': 'https://leftover.ccdev.space',
      },
      timeout: 10000,
    };
    
    const response = await makeRequest(options, testData);
    
    // Should return 400 Bad Request for missing credential
    if (response.statusCode === 400) {
      logSuccess('Validation working correctly (400 for missing credential)');
      return true;
    } else {
      logWarning(`Expected 400, got ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logWarning(`Validation test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('');
  log('='.repeat(60), 'blue');
  log('Google OAuth Endpoint Test Suite', 'blue');
  log('='.repeat(60), 'blue');
  console.log('');
  
  // Run tests sequentially
  await testConnectivity();
  console.log('');
  
  if (results.connectivity) {
    await testCORS();
    console.log('');
    
    await testMethod();
    console.log('');
    
    await testErrorHandling();
    console.log('');
    
    await testValidation();
    console.log('');
  } else {
    logError('Skipping remaining tests - endpoint is not reachable');
    console.log('');
  }
  
  // Summary
  log('='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  console.log('');
  
  const tests = [
    { name: 'Connectivity', result: results.connectivity },
    { name: 'CORS Configuration', result: results.cors },
    { name: 'POST Method Support', result: results.method },
    { name: 'Content-Type Header', result: results.contentType },
    { name: 'Error Handling', result: results.errorHandling },
  ];
  
  tests.forEach(({ name, result }) => {
    if (result) {
      logSuccess(`${name}: PASS`);
    } else {
      logError(`${name}: FAIL`);
    }
  });
  
  console.log('');
  
  const passed = tests.filter(t => t.result).length;
  const total = tests.length;
  
  if (passed === total) {
    logSuccess(`Overall: PASS (${passed}/${total} tests passed)`);
  } else {
    logWarning(`Overall: PARTIAL (${passed}/${total} tests passed)`);
  }
  
  console.log('');
  logInfo('Note: This test uses invalid credentials. For full testing,');
  logInfo('      you need to test with a real Google OAuth credential.');
  logInfo('      Use the sign-in page in your browser for complete testing.');
  console.log('');
}

// Run tests
runTests().catch((error) => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
