/**
 * Complete Reminder Tool
 * MCP Tool for marking a reminder as completed
 */

import { MCPTool } from '../mcp-types.js';
import { ReminderService, CompleteReminderParams } from '../types';

export function createCompleteReminderTool(reminderService: ReminderService): MCPTool {
  return {
    name: 'complete_reminder',
    description: 'Mark a reminder as completed',
    inputSchema: {
      type: 'object',
      properties: {
        list_name: {
          type: 'string',
          description: 'Name of the reminder list',
        },
        reminder_name: {
          type: 'string',
          description: 'Name of the reminder to complete',
        },
      },
      required: ['list_name', 'reminder_name'],
    },
    handler: async (args: Record<string, unknown>) => {
      try {
        const params: CompleteReminderParams = {
          list_name: args.list_name as string,
          reminder_name: args.reminder_name as string,
        };

        const result = await reminderService.completeReminder(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const err = error as any;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: err.code || 'UNKNOWN_ERROR',
                    message: err.message || 'Unknown error',
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }
    },
  };
}
