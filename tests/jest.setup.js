/**
 * Jest Environment Setup
 * Following t_wada's approach: Environment configuration for tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Configure integration test behavior
// Set RUN_INTEGRATION_TESTS=true to enable integration tests
if (!process.env.RUN_INTEGRATION_TESTS) {
  process.env.RUN_INTEGRATION_TESTS = 'false';
}

// Set TEST_REMINDER_CRUD=true to enable tests that modify actual data
if (!process.env.TEST_REMINDER_CRUD) {
  process.env.TEST_REMINDER_CRUD = 'false';
}

// Increase timeout for integration tests
if (process.env.TEST_TYPE === 'integration') {
  jest.setTimeout(30000);
} else {
  jest.setTimeout(10000);
}

// Mock console methods for cleaner test output (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(), // Mock console.log
    debug: jest.fn(), // Mock console.debug
    info: jest.fn(), // Mock console.info
    warn: console.warn, // Keep warnings
    error: console.error, // Keep errors
  };
}