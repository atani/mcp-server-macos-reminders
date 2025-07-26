/**
 * Get Reminder Lists Tool
 * MCP Tool for retrieving all reminder lists
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ReminderService } from '../types';

export function createGetReminderListsTool(reminderService: ReminderService): Tool {
  return {
    name: 'get_reminder_lists',
    description: 'Get all reminder lists from macOS Reminders app',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (_args: Record<string, unknown>) => {
      try {
        const result = await reminderService.getReminderLists();
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
