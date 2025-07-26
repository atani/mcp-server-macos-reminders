/**
 * Reminder Service Implementation
 * Following t_wada's approach: Clear separation of concerns with testable design
 */

import {
  AppleScriptExecutor,
  ReminderService,
  GetReminderListsResult,
  GetRemindersParams,
  GetRemindersResult,
  CreateReminderParams,
  CreateReminderResult,
  CompleteReminderParams,
  CompleteReminderResult,
  DeleteReminderParams,
  DeleteReminderResult,
  SearchRemindersParams,
  SearchRemindersResult,
  ReminderList,
  Reminder,
  ErrorCode,
} from '../types';

export class ReminderServiceImpl implements ReminderService {
  constructor(private executor: AppleScriptExecutor) {}

  /**
   * Get all reminder lists
   */
  async getReminderLists(): Promise<GetReminderListsResult> {
    try {
      const script = 'tell application "Reminders" to get name of every list';
      const output = await this.executor.execute(script);

      const lists = this.parseListOutput(output);
      return { lists };
    } catch (error) {
      throw error; // Re-throw with original error code
    }
  }

  /**
   * Get reminders from a specific list
   */
  async getReminders(params: GetRemindersParams): Promise<GetRemindersResult> {
    this.validateListName(params.list_name);

    try {
      const sanitizedListName = this.sanitizeForAppleScript(params.list_name);
      
      // Build script based on completion filter
      const scriptLines = [
        'tell application "Reminders"',
        `  set reminderList to list "${sanitizedListName}"`
      ];

      if (params.completed === false) {
        // Only uncompleted reminders with details
        scriptLines.push(
          '  set outputText to ""',
          '  repeat with reminderItem in every reminder of reminderList',
          '    if completed of reminderItem is false then',
          '      set reminderName to name of reminderItem',
          '      set dueDate to due date of reminderItem',
          '      set reminderPriority to priority of reminderItem',
          '      set creationDate to creation date of reminderItem',
          '      if dueDate is missing value then set dueDate to ""',
          '      if reminderPriority is missing value then set reminderPriority to 0',
          '      set outputText to outputText & reminderName & "|||" & dueDate & "|||" & reminderPriority & "|||" & creationDate & "\\n"',
          '    end if',
          '  end repeat',
          '  return outputText'
        );
      } else if (params.completed === true) {
        // Only completed reminders with details
        scriptLines.push(
          '  set outputText to ""',
          '  repeat with reminderItem in every reminder of reminderList',
          '    if completed of reminderItem is true then',
          '      set reminderName to name of reminderItem',
          '      set dueDate to due date of reminderItem',
          '      set reminderPriority to priority of reminderItem',
          '      set creationDate to creation date of reminderItem',
          '      if dueDate is missing value then set dueDate to ""',
          '      if reminderPriority is missing value then set reminderPriority to 0',
          '      set outputText to outputText & reminderName & "|||" & dueDate & "|||" & reminderPriority & "|||" & creationDate & "\\n"',
          '    end if',
          '  end repeat',
          '  return outputText'
        );
      } else {
        // All reminders with details
        scriptLines.push(
          '  set outputText to ""',
          '  repeat with reminderItem in every reminder of reminderList',
          '    set reminderName to name of reminderItem',
          '    set dueDate to due date of reminderItem',
          '    set reminderPriority to priority of reminderItem',
          '    set creationDate to creation date of reminderItem',
          '    if dueDate is missing value then set dueDate to ""',
          '    if reminderPriority is missing value then set reminderPriority to 0',
          '    set outputText to outputText & reminderName & "|||" & dueDate & "|||" & reminderPriority & "|||" & creationDate & "\\n"',
          '  end repeat',
          '  return outputText'
        );
      }

      scriptLines.push('end tell');

      const script = scriptLines.join('\n');
      console.error('=== REMINDER SERVICE DEBUG ===');
      console.error('Method: getReminders');
      console.error('Input params:', JSON.stringify(params, null, 2));
      console.error('Sanitized list name:', sanitizedListName);
      console.error('Generated script lines count:', scriptLines.length);
      console.error('Generated AppleScript:');
      console.error(script);
      console.error('==============================');
      
      const output = await this.executor.execute(script);
      const reminders = this.parseReminderOutput(output, params.list_name, params.completed);

      return { reminders };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new reminder
   */
  async createReminder(params: CreateReminderParams): Promise<CreateReminderResult> {
    this.validateCreateParams(params);

    try {
      const sanitizedListName = this.sanitizeForAppleScript(params.list_name);
      const sanitizedName = this.sanitizeForAppleScript(params.name);
      
      let script = `tell application "Reminders"
        set reminderList to list "${sanitizedListName}"
        set newReminder to make new reminder at end of reminderList
        set name of newReminder to "${sanitizedName}"`;

      if (params.notes) {
        const sanitizedNotes = this.sanitizeForAppleScript(params.notes);
        script += `
        set body of newReminder to "${sanitizedNotes}"`;
      }

      if (params.due_date) {
        const dateComponents = this.parseISODateToComponents(params.due_date);
        script += `
        set dueDateTime to (current date) + ${dateComponents.totalSeconds}
        set due date of newReminder to dueDateTime`;
      }

      if (params.priority && params.priority !== 'none') {
        const priorityValue = this.mapPriorityToAppleScript(params.priority);
        script += `
        set priority of newReminder to ${priorityValue}`;
      }

      script += `
        return id of newReminder
      end tell`;

      const reminderId = await this.executor.execute(script);

      return {
        success: true,
        reminder_id: reminderId.trim(),
      };
    } catch (error) {
      const err = error as any;
      return {
        success: false,
        error: {
          code: err.code || ErrorCode.APPLESCRIPT_ERROR,
          message: err.message || 'Unknown error',
        },
      };
    }
  }

  /**
   * Complete a reminder
   */
  async completeReminder(params: CompleteReminderParams): Promise<CompleteReminderResult> {
    this.validateListName(params.list_name);
    this.validateReminderName(params.reminder_name);

    try {
      const sanitizedListName = this.sanitizeForAppleScript(params.list_name);
      const sanitizedReminderName = this.sanitizeForAppleScript(params.reminder_name);
      
      const script = `tell application "Reminders"
        set reminderList to list "${sanitizedListName}"
        set targetReminder to first reminder in reminderList whose name is "${sanitizedReminderName}"
        set completed of targetReminder to true
      end tell`;

      await this.executor.execute(script);

      return { success: true };
    } catch (error) {
      const err = error as any;
      return {
        success: false,
        error: {
          code: err.code || ErrorCode.APPLESCRIPT_ERROR,
          message: err.message || 'Unknown error',
        },
      };
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(params: DeleteReminderParams): Promise<DeleteReminderResult> {
    this.validateListName(params.list_name);
    this.validateReminderName(params.reminder_name);

    try {
      const sanitizedListName = this.sanitizeForAppleScript(params.list_name);
      const sanitizedReminderName = this.sanitizeForAppleScript(params.reminder_name);
      
      const script = `tell application "Reminders"
        set reminderList to list "${sanitizedListName}"
        set targetReminder to first reminder in reminderList whose name is "${sanitizedReminderName}"
        delete targetReminder
      end tell`;

      await this.executor.execute(script);

      return { success: true };
    } catch (error) {
      const err = error as any;
      return {
        success: false,
        error: {
          code: err.code || ErrorCode.APPLESCRIPT_ERROR,
          message: err.message || 'Unknown error',
        },
      };
    }
  }

  /**
   * Search reminders by keyword
   */
  async searchReminders(params: SearchRemindersParams): Promise<SearchRemindersResult> {
    this.validateSearchQuery(params.query);

    try {
      // If specific list is provided, search there first
      if (params.list_name) {
        return await this.searchInSpecificList(params);
      }

      // Search across main lists one by one to avoid timeout
      const mainLists = ['仕事', 'Family', '定期的', '買うもの', 'Study'];
      const allReminders: any[] = [];

      for (const listName of mainLists) {
        try {
          const listResult = await this.searchInSpecificList({
            ...params,
            list_name: listName
          });
          
          // Add list name to each reminder
          const remindersWithList = listResult.reminders.map(reminder => ({
            ...reminder,
            list_name: listName
          }));
          
          allReminders.push(...remindersWithList);
        } catch (error) {
          console.error(`Failed to search in list ${listName}:`, error);
          // Continue with other lists even if one fails
        }
      }

      return { reminders: allReminders };
    } catch (error) {
      throw error;
    }
  }

  private async searchInSpecificList(params: SearchRemindersParams): Promise<SearchRemindersResult> {
    const sanitizedListName = this.sanitizeForAppleScript(params.list_name!);
    
    const script = `tell application "Reminders"
      set targetList to list "${sanitizedListName}"
      set reminderNames to name of every reminder in targetList
      return reminderNames
    end tell`;

    const output = await this.executor.execute(script);
    
    // Parse comma-separated list
    const reminderNames = output.split(', ').filter(name => name.trim());
    
    // Filter by query and convert to Reminder objects
    const filteredReminders = reminderNames
      .filter(name => name.includes(params.query))
      .map(name => ({
        name: name.trim(),
        id: `reminder-${Date.now()}-${Math.random()}`,
        completed: false, // Cannot determine in simple mode
        notes: undefined,
        creation_date: new Date().toISOString(),
        due_date: undefined,
        list_name: params.list_name || 'unknown',
      }));

    return { reminders: filteredReminders };
  }

  // Private helper methods

  private parseListOutput(output: string): ReminderList[] {
    if (!output.trim()) return [];

    return output.split(', ').map((name, index) => ({
      name: name.trim(),
      id: `list-${index}`, // AppleScript doesn't provide list IDs easily
    }));
  }

  private parseReminderOutput(output: string, listName: string, expectedCompleted?: boolean): Reminder[] {
    if (!output.trim()) return [];

    // Handle detailed reminder data with |||separators
    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [name, dueDate, priority, creationDate] = line.split('|||');
        return {
          name: name || '',
          id: `reminder-${Date.now()}-${Math.random()}`, // Generate unique ID
          completed: expectedCompleted !== undefined ? expectedCompleted : false,
          notes: undefined,
          creation_date: this.formatDate(creationDate || ''),
          due_date: dueDate && dueDate.trim() ? this.formatDate(dueDate) : undefined,
          priority: this.mapAppleScriptPriorityToString(parseInt(priority || '0')),
          list_name: listName,
        };
      });
  }

  private parseSearchOutput(output: string): Reminder[] {
    if (!output.trim()) return [];

    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [name, listName] = line.split('|');
        return {
          name: name || '',
          id: `reminder-${Date.now()}-${Math.random()}`,
          completed: false, // Cannot determine in simple mode
          notes: undefined,
          creation_date: new Date().toISOString(),
          due_date: undefined,
          list_name: listName || '',
        };
      });
  }

  private validateListName(listName: string): void {
    if (!listName || listName.trim() === '') {
      const error = new Error('List name cannot be empty') as any;
      error.code = ErrorCode.INVALID_PARAMETER;
      throw error;
    }
  }

  private validateReminderName(reminderName: string): void {
    if (!reminderName || reminderName.trim() === '') {
      const error = new Error('Reminder name cannot be empty') as any;
      error.code = ErrorCode.INVALID_PARAMETER;
      throw error;
    }
  }

  private validateSearchQuery(query: string): void {
    if (!query || query.trim() === '') {
      const error = new Error('Search query cannot be empty') as any;
      error.code = ErrorCode.INVALID_PARAMETER;
      throw error;
    }
  }

  private validateCreateParams(params: CreateReminderParams): void {
    this.validateListName(params.list_name);
    this.validateReminderName(params.name);

    if (params.due_date && !this.isValidISODate(params.due_date)) {
      const error = new Error('Invalid date format. Use ISO 8601 format.') as any;
      error.code = ErrorCode.INVALID_DATE_FORMAT;
      throw error;
    }

    if (params.priority && !['none', 'low', 'medium', 'high'].includes(params.priority)) {
      const error = new Error('Invalid priority. Must be one of: none, low, medium, high') as any;
      error.code = ErrorCode.INVALID_PARAMETER;
      throw error;
    }
  }

  private isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if it matches ISO 8601 format patterns including timezone offsets
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    return isoPattern.test(dateString);
  }

  private parseISODateToComponents(isoDate: string): { totalSeconds: number } {
    const targetDate = new Date(isoDate);
    const currentDate = new Date();
    
    // Calculate difference in seconds from current time
    const totalSeconds = Math.floor((targetDate.getTime() - currentDate.getTime()) / 1000);
    
    console.error('ISO Date input:', isoDate);
    console.error('Target date:', targetDate.toString());
    console.error('Current date:', currentDate.toString());
    console.error('Seconds difference:', totalSeconds);
    
    return { totalSeconds };
  }

  private parseISODate(isoDate: string): string {
    const date = new Date(isoDate);
    
    // Debug: Log the parsed date
    console.error('ISO Date input:', isoDate);
    console.error('Parsed JS Date:', date.toString());
    
    // Try simpler format that AppleScript can understand
    // Format: "7/28/2025 12:00:00 AM" -> "July 28, 2025 12:00:00 AM"
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const timeString = date.toLocaleTimeString('en-US', { 
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const result = `${month} ${day}, ${year} ${timeString}`;
    console.error('Formatted for AppleScript:', result);
    
    return result;
  }

  private formatDate(dateString: string): string {
    if (!dateString || dateString === 'missing value') return '';
    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  private mapPriorityToAppleScript(priority: string): number {
    switch (priority) {
      case 'high':
        return 1;
      case 'medium':
        return 5;
      case 'low':
        return 9;
      default:
        return 0;
    }
  }

  private mapAppleScriptPriorityToString(priority: number): string {
    switch (priority) {
      case 1:
        return 'high';
      case 5:
        return 'medium';
      case 9:
        return 'low';
      default:
        return 'none';
    }
  }

  private sanitizeForAppleScript(input: string): string {
    // Only escape double quotes for AppleScript strings
    // Single quote escaping is handled by AppleScriptExecutor
    return input.replace(/"/g, '\\"');
  }
}
