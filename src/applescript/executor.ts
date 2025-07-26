/**
 * AppleScript Executor Implementation
 * Following t_wada's approach: Testable design with clear interfaces
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { AppleScriptExecutor, ErrorCode } from '../types';

const execAsync = promisify(exec);

export class AppleScriptExecutorImpl implements AppleScriptExecutor {
  /**
   * Execute AppleScript command
   * @param script AppleScript to execute
   * @returns Script output
   * @throws Error if execution fails
   */
  async execute(script: string): Promise<string> {
    if (!script || script.trim() === '') {
      throw this.createError(ErrorCode.INVALID_PARAMETER, 'Script cannot be empty');
    }

    // For Japanese text and complex scripts, use temporary file approach
    const tempFileName = `applescript_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.scpt`;
    const tempFilePath = join(tmpdir(), tempFileName);

    try {
      // Write script to temporary file with UTF-8 encoding
      writeFileSync(tempFilePath, script, 'utf8');
      
      const { stdout, stderr } = await execAsync(`osascript "${tempFilePath}"`);

      if (stderr) {
        // Parse AppleScript specific errors
        const errorCode = this.parseErrorCode(stderr);
        throw this.createError(errorCode, `AppleScript error: ${stderr}`);
      }

      return stdout.trim();
    } catch (error) {
      const err = error as any;
      if (err.code && typeof err.code === 'string' && Object.values(ErrorCode).includes(err.code as ErrorCode)) {
        // Re-throw our custom errors
        throw err;
      }

      // Handle system-level errors
      if (err.message && err.message.includes('command not found')) {
        throw this.createError(
          ErrorCode.REMINDERS_APP_NOT_FOUND,
          'osascript command not found. This requires macOS.'
        );
      }

      // Parse stderr for AppleScript errors
      if (err.stderr || (err.message && err.message.includes('syntax error'))) {
        const errorMessage = err.stderr || err.message;
        const errorCode = this.parseErrorCode(errorMessage);
        throw this.createError(errorCode, `AppleScript error: ${errorMessage}`);
      }

      throw this.createError(
        ErrorCode.APPLESCRIPT_ERROR,
        `Failed to execute AppleScript: ${err.message || 'Unknown error'}`
      );
    } finally {
      // Clean up temporary file
      try {
        unlinkSync(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Sanitize AppleScript string to prevent injection
   * Following t_wada's security-first approach
   */
  private sanitizeScript(script: string): string {
    return script
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Parse AppleScript error messages to determine error codes
   */
  private parseErrorCode(stderr: string): ErrorCode {
    const lowerError = stderr.toLowerCase();

    if (lowerError.includes('permission denied') || lowerError.includes('not authorized')) {
      return ErrorCode.PERMISSION_DENIED;
    }

    if (lowerError.includes('application "reminders" is not running')) {
      return ErrorCode.REMINDERS_APP_NOT_FOUND;
    }

    if (lowerError.includes('list') && lowerError.includes("doesn't exist")) {
      return ErrorCode.LIST_NOT_FOUND;
    }

    if (lowerError.includes('reminder') && lowerError.includes("doesn't exist")) {
      return ErrorCode.REMINDER_NOT_FOUND;
    }

    return ErrorCode.APPLESCRIPT_ERROR;
  }

  /**
   * Create structured error object
   */
  private createError(code: ErrorCode, message: string): Error {
    const error = new Error(message) as any;
    error.code = code;
    return error;
  }
}

/**
 * Utility function to sanitize AppleScript strings (exported for testing)
 */
export function sanitizeAppleScriptString(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
