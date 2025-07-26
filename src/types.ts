/**
 * Type definitions for macOS Reminders MCP Server
 * Following t_wada's approach: Clear interfaces for testability
 */

export interface ReminderList {
  name: string;
  id: string;
}

export interface Reminder {
  name: string;
  id: string;
  completed: boolean;
  notes?: string;
  due_date?: string; // ISO 8601 format
  creation_date: string; // ISO 8601 format
  priority?: string; // 'none', 'low', 'medium', 'high'
  list_name: string;
}

// Tool Parameters
export interface GetRemindersParams {
  list_name: string;
  completed?: boolean;
}

export interface CreateReminderParams {
  list_name: string;
  name: string;
  notes?: string;
  due_date?: string; // ISO 8601 format
  priority?: 'none' | 'low' | 'medium' | 'high';
}

export interface CompleteReminderParams {
  list_name: string;
  reminder_name: string;
}

export interface DeleteReminderParams {
  list_name: string;
  reminder_name: string;
}

export interface SearchRemindersParams {
  query: string;
  list_name?: string;
  completed?: boolean;
}

// Tool Results
export interface GetReminderListsResult {
  lists: ReminderList[];
}

export interface GetRemindersResult {
  reminders: Reminder[];
}

export interface BaseResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface CreateReminderResult extends BaseResult {
  reminder_id?: string;
}

export interface CompleteReminderResult extends BaseResult {}

export interface DeleteReminderResult extends BaseResult {}

export interface SearchRemindersResult {
  reminders: Reminder[];
}

// Error Codes
export enum ErrorCode {
  REMINDERS_APP_NOT_FOUND = 'REMINDERS_APP_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LIST_NOT_FOUND = 'LIST_NOT_FOUND',
  REMINDER_NOT_FOUND = 'REMINDER_NOT_FOUND',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  APPLESCRIPT_ERROR = 'APPLESCRIPT_ERROR',
  INVALID_PARAMETER = 'INVALID_PARAMETER'
}

// Abstract interfaces for dependency injection (t_wada's approach)
export interface AppleScriptExecutor {
  execute(script: string): Promise<string>;
}

export interface ReminderService {
  getReminderLists(): Promise<GetReminderListsResult>;
  getReminders(params: GetRemindersParams): Promise<GetRemindersResult>;
  createReminder(params: CreateReminderParams): Promise<CreateReminderResult>;
  completeReminder(params: CompleteReminderParams): Promise<CompleteReminderResult>;
  deleteReminder(params: DeleteReminderParams): Promise<DeleteReminderResult>;
  searchReminders(params: SearchRemindersParams): Promise<SearchRemindersResult>;
}

// Tool and Resource handler interfaces
export interface ToolHandler {
  (args: Record<string, unknown>): Promise<{
    content: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export interface ResourceHandler {
  (uri: string): Promise<{
    contents: Array<{
      uri: string;
      mimeType: string;
      text: string;
    }>;
  }>;
}