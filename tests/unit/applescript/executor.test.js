"use strict";
/**
 * AppleScript Executor Unit Tests
 * Following t_wada's TDD approach with power-assert
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const power_assert_1 = __importDefault(require("power-assert"));
const executor_1 = require("../../../src/applescript/executor");
const types_1 = require("../../../src/types");
describe('AppleScriptExecutor', () => {
    let executor;
    beforeEach(() => {
        executor = new executor_1.AppleScriptExecutorImpl();
    });
    describe('constructor', () => {
        it('should create instance successfully', () => {
            (0, power_assert_1.default)(executor instanceof executor_1.AppleScriptExecutorImpl);
        });
    });
    describe('execute', () => {
        // Test List (t_wada's approach)
        // 1. 正常なスクリプトを実行できる
        // 2. 空のスクリプトでエラーを投げる
        // 3. 権限エラーを適切にハンドリングする
        // 4. AppleScriptエラーを適切にハンドリングする
        it('should throw error for empty script', async () => {
            // Red phase: Write failing test first
            try {
                await executor.execute('');
                power_assert_1.default.fail('Expected error to be thrown');
            }
            catch (error) {
                const err = error;
                (0, power_assert_1.default)(err.code === types_1.ErrorCode.INVALID_PARAMETER);
                (0, power_assert_1.default)(err.message.includes('Script cannot be empty'));
            }
        });
        it('should throw error for whitespace-only script', async () => {
            try {
                await executor.execute('   \n\t  ');
                power_assert_1.default.fail('Expected error to be thrown');
            }
            catch (error) {
                const err = error;
                (0, power_assert_1.default)(err.code === types_1.ErrorCode.INVALID_PARAMETER);
                (0, power_assert_1.default)(err.message.includes('Script cannot be empty'));
            }
        });
        // Note: Integration tests will cover actual AppleScript execution
        // Unit tests focus on the logic and error handling
    });
    describe('sanitizeScript (via sanitizeAppleScriptString)', () => {
        it('should escape single quotes', () => {
            const input = "tell application 'Reminders'";
            const expected = "tell application \\'Reminders\\'";
            const result = (0, executor_1.sanitizeAppleScriptString)(input);
            (0, power_assert_1.default)(result === expected);
        });
        it('should escape double quotes', () => {
            const input = 'set name to "My Reminder"';
            const expected = 'set name to \\"My Reminder\\"';
            const result = (0, executor_1.sanitizeAppleScriptString)(input);
            (0, power_assert_1.default)(result === expected);
        });
        it('should escape backslashes', () => {
            const input = 'set path to "\\Users\\test"';
            const expected = 'set path to \\"\\\\Users\\\\test\\"';
            const result = (0, executor_1.sanitizeAppleScriptString)(input);
            (0, power_assert_1.default)(result === expected);
        });
        it('should escape newlines', () => {
            const input = 'line1\nline2';
            const expected = 'line1\\nline2';
            const result = (0, executor_1.sanitizeAppleScriptString)(input);
            (0, power_assert_1.default)(result === expected);
        });
        it('should escape carriage returns', () => {
            const input = 'line1\rline2';
            const expected = 'line1\\rline2';
            const result = (0, executor_1.sanitizeAppleScriptString)(input);
            (0, power_assert_1.default)(result === expected);
        });
        it('should handle complex input with multiple special characters', () => {
            const input = 'tell app "Reminders"\\n\\tset reminder to "Test task"\\rend tell';
            const expected = 'tell app \\"Reminders\\"\\\\n\\\\tset reminder to \\"Test task\\"\\\\rend tell';
            const result = (0, executor_1.sanitizeAppleScriptString)(input);
            (0, power_assert_1.default)(result === expected);
        });
        it('should handle empty string', () => {
            const input = '';
            const expected = '';
            const result = (0, executor_1.sanitizeAppleScriptString)(input);
            (0, power_assert_1.default)(result === expected);
        });
    });
    describe('parseErrorCode', () => {
        // These tests verify the private parseErrorCode method through execute()
        // Following t_wada's approach: Test behavior, not implementation details
        // Note: Since parseErrorCode is private, we'll test it through integration tests
        // or consider making it protected for testability if needed
    });
});
/**
 * Test List for AppleScriptExecutor (t_wada's approach)
 *
 * Unit Tests (Current):
 * ✅ should create instance successfully
 * ✅ should throw error for empty script
 * ✅ should throw error for whitespace-only script
 * ✅ should escape single quotes in sanitization
 * ✅ should escape double quotes in sanitization
 * ✅ should escape backslashes in sanitization
 * ✅ should escape newlines in sanitization
 * ✅ should escape carriage returns in sanitization
 * ✅ should handle complex input with multiple special characters
 * ✅ should handle empty string in sanitization
 *
 * Integration Tests (To be implemented):
 * ⭕ should execute valid AppleScript and return output
 * ⭕ should handle permission denied error correctly
 * ⭕ should handle app not running error correctly
 * ⭕ should handle list not found error correctly
 * ⭕ should handle reminder not found error correctly
 * ⭕ should handle system command not found error
 * ⭕ should handle general AppleScript execution errors
 */ 
//# sourceMappingURL=executor.test.js.map