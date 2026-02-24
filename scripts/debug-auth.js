#!/usr/bin/env node

/**
 * Authentication System Debugger
 * 
 * Tests the complete auth flow and identifies where issues occur.
 * 
 * Usage:
 *   node scripts/debug-auth.js
 *   
 * Or with specific credentials:
 *   node scripts/debug-auth.js test@example.com TestPass123!
 */

import https from 'https';
import http from 'http';

const API_URL = process.env.API_URL || 'https://contribly-api.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://contribly-web.onrender.com';

const TEST_EMAIL = process.argv[2] || 'test@example.com';
const TEST_PASSWORD = process.argv[3] || 'TestPass123!';

console.log('🧪 Contribly Auth System Debugger\n');
console.log('Configuration:');
console.log(`  API URL: ${API_URL}`);
console.log(`  Frontend URL: ${FRONTEND_URL}`);
console.log(`  Test Email: ${TEST_EMAIL}`);
console.log('');

// Helper to make HTTP requests
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL,
        ...options.headers,
      },
    };

    const req = lib.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Check API Health
  console.log('Test 1: API Health Check');
  console.log('─'.repeat(50));
  try {
    const res = await request(`${API_URL}/api/health`);
    if (res.status === 200) {
      console.log('✅ PASS - API is responding');
      console.log(`   Status: ${res.data?.status}`);
      console.log(`   Environment: ${res.data?.environment}`);
      results.passed++;
    } else {
      console.log(`❌ FAIL - API returned ${res.status}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Could not reach API: ${error.message}`);
    results.failed++;
  }
  console.log('');

  // Test 2: Check CORS Configuration
  console.log('Test 2: CORS Configuration');
  console.log('─'.repeat(50));
  try {
    const res = await request(`${API_URL}/api/health`);
    const corsOrigin = res.headers['access-control-allow-origin'];
    const corsCredentials = res.headers['access-control-allow-credentials'];
    
    if (corsOrigin) {
      console.log(`✅ PASS - CORS headers present`);
      console.log(`   Allow-Origin: ${corsOrigin}`);
      console.log(`   Allow-Credentials: ${corsCredentials}`);
      
      if (corsCredentials === 'true') {
        results.passed++;
      } else {
        console.log(`⚠️  WARNING - credentials not explicitly allowed`);
        results.warnings++;
      }
    } else {
      console.log(`❌ FAIL - No CORS headers`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
  }
  console.log('');

  // Test 3: Debug Endpoint (without auth)
  console.log('Test 3: Debug Endpoint (No Auth)');
  console.log('─'.repeat(50));
  try {
    const res = await request(`${API_URL}/api/debug/auth`);
    if (res.status === 200) {
      console.log('✅ PASS - Debug endpoint accessible');
      console.log(`   Has token cookie: ${res.data?.hasTokenCookie}`);
      console.log(`   Has auth header: ${res.data?.hasAuthHeader}`);
      console.log(`   Environment: ${res.data?.environment}`);
      results.passed++;
    } else {
      console.log(`❌ FAIL - Debug endpoint returned ${res.status}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
  }
  console.log('');

  // Test 4: Login Attempt
  console.log('Test 4: Login Flow');
  console.log('─'.repeat(50));
  let authToken = null;
  try {
    const res = await request(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    
    if (res.status === 200 && res.data?.success) {
      console.log('✅ PASS - Login successful');
      console.log(`   User: ${res.data?.user?.email}`);
      
      // Check for Set-Cookie header
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        console.log('✅ PASS - Set-Cookie header present');
        console.log(`   Cookie: ${setCookie[0]?.substring(0, 50)}...`);
        
        // Parse the token from cookie
        const tokenMatch = setCookie[0]?.match(/token=([^;]+)/);
        if (tokenMatch) {
          authToken = tokenMatch[1];
          console.log(`   Token captured: ${authToken.substring(0, 20)}...`);
        }
        
        // Check cookie attributes
        const hasHttpOnly = setCookie[0]?.includes('HttpOnly');
        const hasSecure = setCookie[0]?.includes('Secure');
        const hasSameSite = setCookie[0]?.includes('SameSite');
        
        console.log(`   Attributes:`);
        console.log(`     HttpOnly: ${hasHttpOnly ? '✅' : '❌'}`);
        console.log(`     Secure: ${hasSecure ? '✅' : '⚠️ '}`);
        console.log(`     SameSite: ${hasSameSite ? setCookie[0].match(/SameSite=(\w+)/)?.[1] : '❌'}`);
        
        results.passed++;
      } else {
        console.log('⚠️  WARNING - No Set-Cookie header (using token from response body?)');
        authToken = res.data?.token;
        results.warnings++;
      }
    } else if (res.status === 401) {
      console.log('⚠️  INFO - Invalid credentials (create test user first)');
      console.log(`   Run: POST ${API_URL}/api/auth/register`);
      results.warnings++;
    } else {
      console.log(`❌ FAIL - Login failed: ${res.data?.error || 'Unknown error'}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`);
    results.failed++;
  }
  console.log('');

  // Test 5: GET /me with token (if we got one)
  if (authToken) {
    console.log('Test 5: GET /api/auth/me (with cookie)');
    console.log('─'.repeat(50));
    try {
      const res = await request(`${API_URL}/api/auth/me`, {
        headers: {
          'Cookie': `token=${authToken}`,
        },
      });
      
      if (res.status === 200 && res.data?.success) {
        console.log('✅ PASS - /me endpoint successful with cookie');
        console.log(`   User ID: ${res.data?.user?.id}`);
        console.log(`   Email: ${res.data?.user?.email}`);
        results.passed++;
      } else {
        console.log(`❌ FAIL - /me returned ${res.status}: ${res.data?.error}`);
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL - ${error.message}`);
      results.failed++;
    }
    console.log('');

    console.log('Test 6: GET /api/auth/me (with Authorization header)');
    console.log('─'.repeat(50));
    try {
      const res = await request(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (res.status === 200 && res.data?.success) {
        console.log('✅ PASS - /me endpoint successful with Authorization header');
        console.log(`   User ID: ${res.data?.user?.id}`);
        results.passed++;
      } else {
        console.log(`❌ FAIL - /me returned ${res.status}: ${res.data?.error}`);
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL - ${error.message}`);
      results.failed++;
    }
    console.log('');
  } else {
    console.log('⏭️  Skipping /me tests (no auth token available)\n');
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('Test Summary');
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log('');

  if (results.failed === 0 && results.warnings === 0) {
    console.log('🎉 All tests passed! Auth system is working correctly.');
  } else if (results.failed > 0) {
    console.log('🚨 Some tests failed. Review the output above for details.');
    console.log('\n💡 Common fixes:');
    console.log('  1. Ensure API is deployed and running');
    console.log('  2. Check FRONTEND_URL environment variable on Render');
    console.log('  3. Verify JWT_SECRET is set on Render');
    console.log('  4. Check cookie SameSite/Secure attributes in production');
  } else {
    console.log('⚠️  Tests passed with warnings. Review output for potential issues.');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
