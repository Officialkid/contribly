/**
 * Jest Test Setup
 * Runs before all tests to ensure proper environment configuration
 */

// Ensure we're using the test database
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL environment variable is required for integration tests. ' +
    'Please set it in your .env.test file.'
  );
}

// Override DATABASE_URL with TEST_DATABASE_URL for tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASSWORD = 'test-password';

console.log('🧪 Test environment configured');
console.log(`   Database: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
