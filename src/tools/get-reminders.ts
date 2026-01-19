/**
 * Get Reminders Tool
 * MCP Tool for retrieving reminders from a specific list
 */

import { MCPTool } from '../mcp-types.js';
import { ReminderService, GetRemindersParams } from '../types';

export function createGetRemindersTool(reminderService: ReminderService): MCPTool {
  return {
    name: 'get_reminders',
    description: 'Get reminders from a specific list',
    inputSchema: {
      type: 'object',
      properties: {
        list_name: {
          type: 'string',
          description: 'Name of the reminder list',
        },
        completed: {
          type: 'boolean',
          description:
            'Filter by completion status (true: completed, false: incomplete, undefined: all)',
          optional: true,
        },
      },
      required: ['list_name'],
    },
    handler: async (args: Record<string, unknown>) => {
      try {
        const params: GetRemindersParams = {
          list_name: args.list_name as string,
          completed: args.completed as boolean | undefined,
        };

        const result = await reminderService.getReminders(params);
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
