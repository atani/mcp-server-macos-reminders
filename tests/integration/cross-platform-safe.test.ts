/**
 * Cross-Platform Safe Integration Tests
 * Tests that can run on any platform without macOS-specific dependencies
 */

import assert from 'power-assert';
import { AppleScriptExecutorImpl } from '../../src/applescript/executor';
import { ReminderServiceImpl } from '../../src/services/ReminderService';
import { ErrorCode } from '../../src/types';

describe('Cross-Platform Integration Tests', () => {
  let executor: AppleScriptExecutorImpl;
  let service: ReminderServiceImpl;

  beforeAll(() => {
    executor = new AppleScriptExecutorImpl();
    service = new ReminderServiceImpl(executor);
  });

  describe('Error Handling (Platform Independent)', () => {
    it('should handle empty script input', async () => {
      try {
        await executor.execute('');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
        assert(err.message.includes('Script cannot be empty'));
      }
    });

    it('should handle whitespace-only script input', async () => {
      try {
        await executor.execute('   \n\t  ');
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
        assert(err.message.includes('Script cannot be empty'));
      }
    });

    it('should validate create reminder parameters', async () => {
      try {
        await service.createReminder({
          list_name: '',
          name: 'Test Reminder',
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
        assert(err.message.includes('List name cannot be empty'));
      }
    });

    it('should validate reminder name parameter', async () => {
      try {
        await service.createReminder({
          list_name: 'Test List',
          name: '',
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
        assert(err.message.includes('Reminder name cannot be empty'));
      }
    });

    it('should validate search query parameter', async () => {
      try {
        await service.searchReminders({
          query: '',
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
        assert(err.message.includes('Search query cannot be empty'));
      }
    });
  });

  describe('Script Sanitization (Platform Independent)', () => {
    it('should sanitize backslashes', () => {
      const input = 'path\\to\\file';
      const sanitized = executor['sanitizeScript'](input);
      assert(sanitized === 'path\\\\to\\\\file');
    });

    it('should sanitize single quotes', () => {
      const input = "It's a test";
      const sanitized = executor['sanitizeScript'](input);
      assert(sanitized === "It\\'s a test");
    });

    it('should sanitize newlines', () => {
      const input = 'line1\nline2\r\nline3';
      const sanitized = executor['sanitizeScript'](input);
      assert(sanitized === 'line1\\nline2\\r\\nline3');
    });

    it('should handle complex sanitization', () => {
      const input = "Complex\\path\\with'quotes\nand\rnewlines";
      const sanitized = executor['sanitizeScript'](input);
      assert(sanitized === "Complex\\\\path\\\\with\\'quotes\\nand\\rnewlines");
    });
  });

  describe('Service Parameter Validation (Platform Independent)', () => {
    it('should validate get reminders parameters', async () => {
      try {
        await service.getReminders({
          list_name: '   ',
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });

    it('should validate complete reminder parameters', async () => {
      try {
        await service.completeReminder({
          list_name: 'Test List',
          reminder_name: '',
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });

    it('should validate delete reminder parameters', async () => {
      try {
        await service.deleteReminder({
          list_name: '',
          reminder_name: 'Test Reminder',
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });

    it('should validate date format in create reminder', async () => {
      try {
        await service.createReminder({
          list_name: 'Test List',
          name: 'Test Reminder',
          due_date: 'invalid-date-format',
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_DATE_FORMAT);
      }
    });

    it('should validate priority parameter', async () => {
      try {
        await service.createReminder({
          list_name: 'Test List',
          name: 'Test Reminder',
          priority: 'invalid-priority' as any,
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });
  });

  describe('Non-macOS Platform Handling', () => {
    // These tests verify behavior on non-macOS platforms
    const originalPlatform = process.platform;

    it('should handle osascript command not found error', async () => {
      // This test will only fail appropriately on non-macOS systems
      if (process.platform !== 'darwin') {
        try {
          await executor.execute('return "test"');
          // If we reach here on non-macOS, osascript somehow exists
          console.log('osascript found on non-macOS platform');
        } catch (error) {
          const err = error as any;
          // Should get either command not found or reminders app not found
          assert(
            err.code === ErrorCode.REMINDERS_APP_NOT_FOUND || 
            err.code === ErrorCode.APPLESCRIPT_ERROR
          );
        }
      } else {
        // On macOS, mark as skipped
        console.log('Skipping non-macOS test on macOS platform');
      }
    });
  });
});

/**
 * Cross-Platform Test Design Principles
 * 
 * 1. Separation of Concerns:
 *    - Platform-specific tests in applescript-integration.test.ts
 *    - Platform-independent tests in this file
 * 
 * 2. Test Categories:
 *    - Input validation (works on all platforms)
 *    - String sanitization (pure functions)
 *    - Parameter validation (business logic)
 *    - Error handling (predictable responses)
 * 
 * 3. CI/CD Strategy:
 *    - These tests run on all platforms in CI
 *    - macOS-specific tests only run locally with explicit opt-in
 *    - No external dependencies or system calls
 * 
 * 4. Maintainability:
 *    - Tests that don't require actual AppleScript execution
 *    - Focus on the TypeScript/Node.js logic
 *    - Mock external dependencies when needed
 */