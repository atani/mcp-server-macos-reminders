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
      let script = `tell application "Reminders"
        set reminderList to list "${params.list_name}"
        set allReminders to every reminder in reminderList
        set result to ""
        repeat with reminderItem in allReminders
          set reminderName to name of reminderItem
          set isCompleted to completed of reminderItem`;

      // Add completion filter if specified
      if (params.completed !== undefined) {
        script += `
          if isCompleted is ${params.completed} then`;
      }

      script += `
            set reminderNotes to body of reminderItem
            set creationDate to creation date of reminderItem
            set dueDate to due date of reminderItem
            set result to result & reminderName & "|" & isCompleted & "|" & reminderNotes & "|" & creationDate & "|" & dueDate & "\\n"`;

      if (params.completed !== undefined) {
        script += `
          end if`;
      }

      script += `
        end repeat
        return result
      end tell`;

      const output = await this.executor.execute(script);
      const reminders = this.parseReminderOutput(output, params.list_name);

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
      let script = `tell application "Reminders"
        set reminderList to list "${params.list_name}"
        set newReminder to make new reminder at end of reminderList
        set name of newReminder to "${params.name}"`;

      if (params.notes) {
        script += `
        set body of newReminder to "${params.notes}"`;
      }

      if (params.due_date) {
        const parsedDate = this.parseISODate(params.due_date);
        script += `
        set due date of newReminder to date "${parsedDate}"`;
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
      const script = `tell application "Reminders"
        set reminderList to list "${params.list_name}"
        set targetReminder to first reminder in reminderList whose name is "${params.reminder_name}"
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
      const script = `tell application "Reminders"
        set reminderList to list "${params.list_name}"
        set targetReminder to first reminder in reminderList whose name is "${params.reminder_name}"
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
      let script = `tell application "Reminders"
        set foundReminders to {}
        set searchQuery to "${params.query}"`;

      if (params.list_name) {
        script += `
        set searchLists to {list "${params.list_name}"}`;
      } else {
        script += `
        set searchLists to every list`;
      }

      script += `
        repeat with currentList in searchLists
          set listName to name of currentList
          set reminders to every reminder in currentList
          repeat with reminderItem in reminders
            set reminderName to name of reminderItem
            set isCompleted to completed of reminderItem`;

      if (params.completed !== undefined) {
        script += `
            if isCompleted is ${params.completed} then`;
      }

      script += `
              if reminderName contains searchQuery then
                set reminderNotes to body of reminderItem
                set creationDate to creation date of reminderItem
                set dueDate to due date of reminderItem
                set end of foundReminders to (reminderName & "|" & isCompleted & "|" & reminderNotes & "|" & creationDate & "|" & dueDate & "|" & listName)
              end if`;

      if (params.completed !== undefined) {
        script += `
            end if`;
      }

      script += `
          end repeat
        end repeat
        
        set result to ""
        repeat with foundReminder in foundReminders
          set result to result & foundReminder & "\\n"
        end repeat
        return result
      end tell`;

      const output = await this.executor.execute(script);
      const reminders = this.parseSearchOutput(output);

      return { reminders };
    } catch (error) {
      throw error;
    }
  }

  // Private helper methods

  private parseListOutput(output: string): ReminderList[] {
    if (!output.trim()) return [];

    return output.split(', ').map((name, index) => ({
      name: name.trim(),
      id: `list-${index}`, // AppleScript doesn't provide list IDs easily
    }));
  }

  private parseReminderOutput(output: string, listName: string): Reminder[] {
    if (!output.trim()) return [];

    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [name, completed, notes, creationDate, dueDate] = line.split('|');
        return {
          name: name || '',
          id: `reminder-${Date.now()}-${Math.random()}`, // Generate unique ID
          completed: completed === 'true',
          notes: notes !== 'missing value' ? notes : undefined,
          creation_date: this.formatDate(creationDate),
          due_date: dueDate !== 'missing value' ? this.formatDate(dueDate) : undefined,
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
        const [name, completed, notes, creationDate, dueDate, listName] = line.split('|');
        return {
          name: name || '',
          id: `reminder-${Date.now()}-${Math.random()}`,
          completed: completed === 'true',
          notes: notes !== 'missing value' ? notes : undefined,
          creation_date: this.formatDate(creationDate),
          due_date: dueDate !== 'missing value' ? this.formatDate(dueDate) : undefined,
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
  }

  private isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString().slice(0, dateString.length);
  }

  private parseISODate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US');
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
}
