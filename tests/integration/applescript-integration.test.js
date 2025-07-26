"use strict";
/**
 * AppleScript Integration Tests
 * Following t_wada's approach: Integration tests for external dependencies
 *
 * Note: These tests require macOS and appropriate permissions
 * They test the actual integration with AppleScript and Reminders app
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const power_assert_1 = __importDefault(require("power-assert"));
const executor_1 = require("../../src/applescript/executor");
const ReminderService_1 = require("../../src/services/ReminderService");
const types_1 = require("../../src/types");
describe('AppleScript Integration Tests', () => {
    let executor;
    let service;
    // Skip these tests in CI or non-macOS environments
    const isMacOS = process.platform === 'darwin';
    const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
    beforeAll(() => {
        if (!isMacOS) {
            console.log('Skipping AppleScript integration tests - not running on macOS');
            return;
        }
        if (!runIntegrationTests) {
            console.log('Skipping AppleScript integration tests - RUN_INTEGRATION_TESTS not set');
            return;
        }
        executor = new executor_1.AppleScriptExecutorImpl();
        service = new ReminderService_1.ReminderServiceImpl(executor);
    });
    // Helper function to skip tests when not on macOS or when integration tests are disabled
    function itOnMacOS(description, testFn) {
        if (isMacOS && runIntegrationTests) {
            it(description, testFn);
        }
        else {
            it.skip(description, testFn);
        }
    }
    describe('AppleScript Executor Integration', () => {
        itOnMacOS('should execute simple AppleScript successfully', async () => {
            // This is a safe script that doesn't modify anything
            const result = await executor.execute('return "Hello World"');
            (0, power_assert_1.default)(result === 'Hello World');
        });
        itOnMacOS('should handle AppleScript syntax errors', async () => {
            try {
                await executor.execute('invalid applescript syntax here');
                power_assert_1.default.fail('Expected error to be thrown');
            }
            catch (error) {
                const err = error;
                (0, power_assert_1.default)(err.code === types_1.ErrorCode.APPLESCRIPT_ERROR);
                (0, power_assert_1.default)(err.message.includes('AppleScript error'));
            }
        });
        itOnMacOS('should sanitize dangerous input', async () => {
            // Test that our sanitization prevents script injection
            const maliciousInput = 'return "safe"'; // This would be part of a larger malicious script
            const result = await executor.execute(`return "${maliciousInput}"`);
            // The result should contain the sanitized version, not execute additional scripts
            (0, power_assert_1.default)(result.includes('return \\"safe\\"'));
        });
    });
    describe('Reminders App Integration', () => {
        itOnMacOS('should get reminder lists from actual Reminders app', async () => {
            try {
                const result = await service.getReminderLists();
                // Basic validation - should return an array
                (0, power_assert_1.default)(Array.isArray(result.lists));
                (0, power_assert_1.default)(result.lists.length >= 0);
                // If lists exist, validate structure
                if (result.lists.length > 0) {
                    const firstList = result.lists[0];
                    (0, power_assert_1.default)(typeof firstList.name === 'string');
                    (0, power_assert_1.default)(firstList.name.length > 0);
                    (0, power_assert_1.default)(typeof firstList.id === 'string');
                }
                console.log(`Found ${result.lists.length} reminder lists`);
            }
            catch (error) {
                const err = error;
                if (err.code === types_1.ErrorCode.PERMISSION_DENIED) {
                    console.log('Permission denied - please grant Reminders access in System Preferences');
                    // Don't fail the test for permission issues in CI
                    return;
                }
                throw error;
            }
        });
        itOnMacOS('should handle permission denied error gracefully', async () => {
            // This test may pass if permissions are granted
            // We use a script that's more likely to trigger permission issues
            try {
                await executor.execute('tell application "Reminders" to get name of every list');
                // If this succeeds, permissions are granted
                console.log('Reminders access granted');
            }
            catch (error) {
                const err = error;
                if (err.code === types_1.ErrorCode.PERMISSION_DENIED) {
                    (0, power_assert_1.default)(err.message.includes('permission denied') ||
                        err.message.includes('not authorized'));
                    console.log('Permission denied error handled correctly');
                }
                else {
                    throw err; // Re-throw unexpected errors
                }
            }
        });
        itOnMacOS('should handle app not running scenario', async () => {
            // Try to quit Reminders app first (this might fail if app is not running)
            try {
                await executor.execute('tell application "Reminders" to quit');
                // Wait a moment for the app to quit
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch {
                // Ignore errors from quit command
            }
            // Now try to access reminders - this should auto-launch the app
            try {
                const result = await service.getReminderLists();
                // If successful, the app auto-launched
                (0, power_assert_1.default)(Array.isArray(result.lists));
                console.log('Reminders app auto-launched successfully');
            }
            catch (error) {
                const err = error;
                // Handle various possible errors
                if (err.code === types_1.ErrorCode.PERMISSION_DENIED) {
                    console.log('Permission denied during app launch test');
                    return;
                }
                throw err;
            }
        });
    });
    describe('End-to-End Reminder Operations', () => {
        const testListName = 'TestList_IntegrationTest';
        const testReminderName = 'Integration Test Reminder';
        // Note: These tests modify actual data - use with caution
        // They're disabled by default and require explicit opt-in
        itOnMacOS('should create, find, and delete test reminder (if TEST_REMINDER_CRUD=true)', async () => {
            if (process.env.TEST_REMINDER_CRUD !== 'true') {
                console.log('Skipping CRUD test - set TEST_REMINDER_CRUD=true to enable');
                return;
            }
            let testReminderCreated = false;
            try {
                // Create a test reminder
                const createResult = await service.createReminder({
                    list_name: testListName,
                    name: testReminderName,
                    notes: 'This is a test reminder created by integration tests'
                });
                if (createResult.success) {
                    testReminderCreated = true;
                    (0, power_assert_1.default)(createResult.reminder_id);
                    console.log('Test reminder created successfully');
                    // Try to find the reminder
                    const reminders = await service.getReminders({
                        list_name: testListName
                    });
                    const foundReminder = reminders.reminders.find(r => r.name === testReminderName);
                    (0, power_assert_1.default)(foundReminder !== undefined);
                    (0, power_assert_1.default)(foundReminder.notes?.includes('test reminder'));
                    console.log('Test reminder found successfully');
                    // Search for the reminder
                    const searchResult = await service.searchReminders({
                        query: 'Integration Test'
                    });
                    const searchedReminder = searchResult.reminders.find(r => r.name === testReminderName);
                    (0, power_assert_1.default)(searchedReminder !== undefined);
                    console.log('Test reminder found via search');
                }
                else {
                    console.log('Failed to create test reminder:', createResult.error);
                }
            }
            catch (error) {
                const err = error;
                if (err.code === types_1.ErrorCode.LIST_NOT_FOUND) {
                    console.log(`Test list "${testListName}" not found - please create it manually for full CRUD testing`);
                    return;
                }
                throw err;
            }
            finally {
                // Cleanup: Delete the test reminder if it was created
                if (testReminderCreated) {
                    try {
                        const deleteResult = await service.deleteReminder({
                            list_name: testListName,
                            reminder_name: testReminderName
                        });
                        if (deleteResult.success) {
                            console.log('Test reminder cleaned up successfully');
                        }
                        else {
                            console.log('Failed to cleanup test reminder:', deleteResult.error);
                        }
                    }
                    catch (cleanupError) {
                        const err = cleanupError;
                        console.log('Error during cleanup:', err.message);
                    }
                }
            }
        });
    });
    describe('Error Scenarios Integration', () => {
        itOnMacOS('should handle non-existent list gracefully', async () => {
            try {
                await service.getReminders({
                    list_name: 'NonExistentList_' + Date.now()
                });
                power_assert_1.default.fail('Expected error to be thrown');
            }
            catch (error) {
                const err = error;
                // Should get LIST_NOT_FOUND or similar error
                (0, power_assert_1.default)(err.code === types_1.ErrorCode.LIST_NOT_FOUND ||
                    err.code === types_1.ErrorCode.APPLESCRIPT_ERROR);
            }
        });
        itOnMacOS('should handle non-existent reminder gracefully', async () => {
            // Get first available list
            try {
                const lists = await service.getReminderLists();
                if (lists.lists.length === 0) {
                    console.log('No reminder lists available for testing');
                    return;
                }
                const firstList = lists.lists[0].name;
                const result = await service.completeReminder({
                    list_name: firstList,
                    reminder_name: 'NonExistentReminder_' + Date.now()
                });
                // Should return error, not throw
                (0, power_assert_1.default)(result.success === false);
                (0, power_assert_1.default)(result.error?.code === types_1.ErrorCode.REMINDER_NOT_FOUND ||
                    result.error?.code === types_1.ErrorCode.APPLESCRIPT_ERROR);
            }
            catch (error) {
                const err = error;
                if (err.code === types_1.ErrorCode.PERMISSION_DENIED) {
                    console.log('Permission denied for non-existent reminder test');
                    return;
                }
                throw err;
            }
        });
    });
});
/**
 * Integration Test Summary (t_wada's approach)
 *
 * These tests verify:
 * 1. Actual AppleScript execution
 * 2. Real Reminders app integration
 * 3. Permission handling
 * 4. Error scenarios with real system
 * 5. End-to-end workflows (optional)
 *
 * Test execution requirements:
 * - macOS environment
 * - RUN_INTEGRATION_TESTS=true environment variable
 * - Reminders app permissions granted
 * - TEST_REMINDER_CRUD=true for data-modifying tests
 *
 * These tests complement unit tests by verifying actual system integration
 * while unit tests verify logic in isolation.
 */ 
//# sourceMappingURL=applescript-integration.test.js.map