/**
 * WebSocket Connection Test Script
 * Tests Socket.IO connection to the backend
 * 
 * Usage: node test-websocket.js [backend-url] [token]
 * Example: node test-websocket.js https://leftover-be.ccdev.space your-jwt-token
 */

const { io } = require('socket.io-client');

// Get backend URL and token from command line or environment
const backendUrl = process.argv[2] || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const token = process.argv[3] || process.env.TEST_TOKEN || '';

console.log('🧪 WebSocket Connection Test');
console.log('============================');
console.log(`Backend URL: ${backendUrl}`);
console.log(`Token: ${token ? 'Provided (' + token.substring(0, 20) + '...)' : 'Not provided'}`);
console.log('');

if (!token) {
  console.warn('⚠️  Warning: No token provided. Connection may fail if authentication is required.');
  console.log('   You can provide a token as: node test-websocket.js <url> <token>');
  console.log('   Or set TEST_TOKEN environment variable\n');
}

// Clean up backend URL
const wsUrl = backendUrl.replace(/\/$/, '');

console.log('📡 Attempting to connect...\n');

// Create Socket.IO client
const socket = io(wsUrl, {
  path: '/socket.io/',
  auth: {
    token: token,
  },
  transports: ['polling', 'websocket'],
  reconnection: false, // Disable auto-reconnect for testing
  timeout: 10000,
  upgrade: true,
});

let connected = false;
let testResults = {
  connection: false,
  subscription: false,
  orderUpdate: false,
  offerUpdate: false,
  errors: [],
};

// Connection event
socket.on('connect', () => {
  connected = true;
  testResults.connection = true;
  const transport = socket.io.engine.transport.name;
  console.log('✅ Connected successfully!');
  console.log(`   Transport: ${transport}`);
  console.log(`   Socket ID: ${socket.id}\n`);
  
  // Test subscriptions
  console.log('📡 Testing subscriptions...');
  socket.emit('subscribe:orders');
  socket.emit('subscribe:offers');
  testResults.subscription = true;
  console.log('✅ Subscribed to orders and offers events\n');
  
  // Set timeout to close connection after testing
  setTimeout(() => {
    console.log('⏱️  Test complete. Closing connection...');
    socket.disconnect();
    printResults();
    process.exit(0);
  }, 5000); // Wait 5 seconds to receive any updates
});

// Disconnect event
socket.on('disconnect', (reason) => {
  console.log(`\n🔌 Disconnected: ${reason}`);
  if (!connected) {
    testResults.errors.push(`Connection failed: ${reason}`);
  }
  printResults();
  process.exit(connected ? 0 : 1);
});

// Connection error
socket.on('connect_error', (error) => {
  testResults.errors.push(error.message || 'Connection error');
  
  console.error('❌ Connection Error:');
  console.error(`   Message: ${error.message}`);
  console.error(`   Type: ${error.type}`);
  if (error.description) {
    console.error(`   Description: ${error.description}`);
  }
  
  // Check for specific error types
  if (error.message?.includes('CORS')) {
    console.error('\n⚠️  CORS Error Detected:');
    console.error('   - Check backend CORS configuration');
    console.error('   - Verify frontend origin is in allowed origins list');
  } else if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
    console.error('\n⚠️  502 Bad Gateway Error:');
    console.error('   - Backend server may be down');
    console.error('   - Check proxy/load balancer configuration');
    console.error('   - Verify backend is accessible');
  } else if (error.message?.includes('timeout')) {
    console.error('\n⚠️  Timeout Error:');
    console.error('   - Backend may be slow to respond');
    console.error('   - Check network connectivity');
  }
  
  printResults();
  process.exit(1);
});

// Test order update event
socket.on('order:update', (data) => {
  testResults.orderUpdate = true;
  console.log('📦 Order update received:');
  console.log(`   Type: ${data.type}`);
  console.log(`   Order ID: ${data.order?.id || 'N/A'}`);
  console.log(`   Status: ${data.order?.status || 'N/A'}\n`);
});

// Test offer update event
socket.on('offer:update', (data) => {
  testResults.offerUpdate = true;
  console.log('🛍️  Offer update received:');
  console.log(`   Type: ${data.type}`);
  console.log(`   Offer ID: ${data.offer?.id || 'N/A'}`);
  console.log(`   Title: ${data.offer?.title || 'N/A'}\n`);
});

// Transport upgrade
socket.io.engine.on('upgrade', () => {
  const transport = socket.io.engine.transport.name;
  console.log(`🔄 Transport upgraded to: ${transport}\n`);
});

// Timeout handler
setTimeout(() => {
  if (!connected) {
    console.error('\n⏱️  Connection timeout - no response from server');
    testResults.errors.push('Connection timeout');
    printResults();
    process.exit(1);
  }
}, 15000);

// Print test results
function printResults() {
  console.log('\n📊 Test Results');
  console.log('==============');
  console.log(`Connection: ${testResults.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Subscription: ${testResults.subscription ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Order Updates: ${testResults.orderUpdate ? '✅ PASS (received)' : '⚠️  No updates (may be normal)'}`);
  console.log(`Offer Updates: ${testResults.offerUpdate ? '✅ PASS (received)' : '⚠️  No updates (may be normal)'}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  const allPassed = testResults.connection && testResults.subscription;
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'PASS' : 'FAIL'}`);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  socket.disconnect();
  printResults();
  process.exit(1);
});

process.on('SIGTERM', () => {
  socket.disconnect();
  printResults();
  process.exit(1);
});

