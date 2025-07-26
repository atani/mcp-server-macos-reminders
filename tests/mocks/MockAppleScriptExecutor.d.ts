/**
 * Mock AppleScript Executor for testing
 * Following t_wada's approach: Controllable test doubles
 */
import { AppleScriptExecutor } from '../../src/types';
export declare class MockAppleScriptExecutor implements AppleScriptExecutor {
  private responses;
  private errors;
  private executionHistory;
  private defaultResponse;
  private shouldThrowError;
  private errorToThrow?;
  /**
   * Set response for specific AppleScript
   */
  setResponse(script: string, response: string): void;
  /**
   * Set default response for any script
   */
  setDefaultResponse(response: string): void;
  /**
   * Set error for specific AppleScript
   */
  setError(script: string, error: Error): void;
  /**
   * Set error to throw for any script
   */
  setErrorToThrow(error: Error): void;
  /**
   * Clear all mock data
   */
  clear(): void;
  /**
   * Get execution history for verification
   */
  getExecutionHistory(): string[];
  /**
   * Get the last executed script
   */
  getLastExecutedScript(): string | undefined;
  /**
   * Verify if a specific script was executed
   */
  wasScriptExecuted(script: string): boolean;
  /**
   * Mock implementation of execute method
   */
  execute(script: string): Promise<string>;
}
/**
 * Factory function to create mock with common responses
 */
export declare function createMockAppleScriptExecutor(): MockAppleScriptExecutor;
//# sourceMappingURL=MockAppleScriptExecutor.d.ts.map
