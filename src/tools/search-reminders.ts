/**
 * Search Reminders Tool
 * MCP Tool for searching reminders by keyword
 */

import { MCPTool } from '../mcp-types.js';
import { ReminderService, SearchRemindersParams } from '../types';

export function createSearchRemindersTool(reminderService: ReminderService): MCPTool {
  return {
    name: 'search_reminders',
    description: 'Search reminders by keyword across all lists or within a specific list',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword or phrase',
        },
        list_name: {
          type: 'string',
          description: 'Optional: restrict search to a specific list',
          optional: true,
        },
        completed: {
          type: 'boolean',
          description:
            'Optional: filter by completion status (true: completed, false: incomplete, undefined: all)',
          optional: true,
        },
      },
      required: ['query'],
    },
    handler: async (args: Record<string, unknown>) => {
      try {
        const params: SearchRemindersParams = {
          query: args.query as string,
          list_name: args.list_name as string | undefined,
          completed: args.completed as boolean | undefined,
        };

        const result = await reminderService.searchReminders(params);
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
