/**
 * Mock AppleScript Executor for testing
 * Following t_wada's approach: Controllable test doubles
 */

import { AppleScriptExecutor } from '../../src/types';

export class MockAppleScriptExecutor implements AppleScriptExecutor {
  private responses: Map<string, string> = new Map();
  private errors: Map<string, Error> = new Map();
  private executionHistory: string[] = [];
  private defaultResponse: string = '';
  private shouldThrowError: boolean = false;
  private errorToThrow?: Error;

  /**
   * Set response for specific AppleScript
   */
  setResponse(script: string, response: string): void {
    this.responses.set(script, response);
  }

  /**
   * Set default response for any script
   */
  setDefaultResponse(response: string): void {
    this.defaultResponse = response;
  }

  /**
   * Set error for specific AppleScript
   */
  setError(script: string, error: Error): void {
    this.errors.set(script, error);
  }

  /**
   * Set error to throw for any script
   */
  setErrorToThrow(error: Error): void {
    this.errorToThrow = error;
    this.shouldThrowError = true;
  }

  /**
   * Clear all mock data
   */
  clear(): void {
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
  getExecutionHistory(): string[] {
    return [...this.executionHistory];
  }

  /**
   * Get the last executed script
   */
  getLastExecutedScript(): string | undefined {
    return this.executionHistory[this.executionHistory.length - 1];
  }

  /**
   * Verify if a specific script was executed
   */
  wasScriptExecuted(script: string): boolean {
    return this.executionHistory.includes(script);
  }

  /**
   * Mock implementation of execute method
   */
  async execute(script: string): Promise<string> {
    this.executionHistory.push(script);

    // Check if global error should be thrown
    if (this.shouldThrowError && this.errorToThrow) {
      throw this.errorToThrow;
    }

    // Check for specific error
    if (this.errors.has(script)) {
      const error = this.errors.get(script)!;
      throw error;
    }

    // Check for specific response
    if (this.responses.has(script)) {
      return this.responses.get(script)!;
    }

    // Return default response
    return this.defaultResponse;
  }
}

/**
 * Factory function to create mock with common responses
 */
export function createMockAppleScriptExecutor(): MockAppleScriptExecutor {
  const mock = new MockAppleScriptExecutor();

  // Set up common responses
  mock.setResponse(
    'tell application "Reminders" to get name of every list',
    '仕事, Family, 定期的, 買うもの, Study'
  );

  return mock;
}
