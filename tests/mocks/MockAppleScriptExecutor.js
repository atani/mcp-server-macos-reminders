"use strict";
/**
 * Mock AppleScript Executor for testing
 * Following t_wada's approach: Controllable test doubles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAppleScriptExecutor = void 0;
exports.createMockAppleScriptExecutor = createMockAppleScriptExecutor;
class MockAppleScriptExecutor {
    responses = new Map();
    errors = new Map();
    executionHistory = [];
    defaultResponse = '';
    shouldThrowError = false;
    errorToThrow;
    /**
     * Set response for specific AppleScript
     */
    setResponse(script, response) {
        this.responses.set(script, response);
    }
    /**
     * Set default response for any script
     */
    setDefaultResponse(response) {
        this.defaultResponse = response;
    }
    /**
     * Set error for specific AppleScript
     */
    setError(script, error) {
        this.errors.set(script, error);
    }
    /**
     * Set error to throw for any script
     */
    setErrorToThrow(error) {
        this.errorToThrow = error;
        this.shouldThrowError = true;
    }
    /**
     * Clear all mock data
     */
    clear() {
        this.responses.clear();
        this.errors.clear();
        this.executionHistory = [];
        this.defaultResponse = '';
        this.shouldThrowError = false;
        this.errorToThrow = undefined;
    }
    /**
     * Get execution history for verification
     */
    getExecutionHistory() {
        return [...this.executionHistory];
    }
    /**
     * Get the last executed script
     */
    getLastExecutedScript() {
        return this.executionHistory[this.executionHistory.length - 1];
    }
    /**
     * Verify if a specific script was executed
     */
    wasScriptExecuted(script) {
        return this.executionHistory.includes(script);
    }
    /**
     * Mock implementation of execute method
     */
    async execute(script) {
        this.executionHistory.push(script);
        // Check if global error should be thrown
        if (this.shouldThrowError && this.errorToThrow) {
            throw this.errorToThrow;
        }
        // Check for specific error
        if (this.errors.has(script)) {
            const error = this.errors.get(script);
            throw error;
        }
        // Check for specific response
        if (this.responses.has(script)) {
            return this.responses.get(script);
        }
        // Return default response
        return this.defaultResponse;
    }
}
exports.MockAppleScriptExecutor = MockAppleScriptExecutor;
/**
 * Factory function to create mock with common responses
 */
function createMockAppleScriptExecutor() {
    const mock = new MockAppleScriptExecutor();
    // Set up common responses
    mock.setResponse('tell application "Reminders" to get name of every list', '仕事, Family, 定期的, 買うもの, Study');
    return mock;
}
//# sourceMappingURL=MockAppleScriptExecutor.js.map