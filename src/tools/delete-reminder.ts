/**
 * Delete Reminder Tool
 * MCP Tool for deleting a reminder
 */

import { MCPTool } from '../mcp-types.js';
import { ReminderService, DeleteReminderParams } from '../types';

export function createDeleteReminderTool(reminderService: ReminderService): MCPTool {
  return {
    name: 'delete_reminder',
    description: 'Delete a reminder from the specified list',
    inputSchema: {
      type: 'object',
      properties: {
        list_name: {
          type: 'string',
          description: 'Name of the reminder list',
        },
        reminder_name: {
          type: 'string',
          description: 'Name of the reminder to delete',
        },
      },
      required: ['list_name', 'reminder_name'],
    },
    handler: async (args: Record<string, unknown>) => {
      try {
        const params: DeleteReminderParams = {
          list_name: args.list_name as string,
          reminder_name: args.reminder_name as string,
        };

        const result = await reminderService.deleteReminder(params);
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
