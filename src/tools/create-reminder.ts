/**
 * Create Reminder Tool
 * MCP Tool for creating a new reminder
 */

import { MCPTool } from '../mcp-types.js';
import { ReminderService, CreateReminderParams } from '../types';

export function createCreateReminderTool(reminderService: ReminderService): MCPTool {
  return {
    name: 'create_reminder',
    description: 'Create a new reminder in the specified list',
    inputSchema: {
      type: 'object',
      properties: {
        list_name: {
          type: 'string',
          description: 'Name of the reminder list',
        },
        name: {
          type: 'string',
          description: 'Name/title of the reminder',
        },
        notes: {
          type: 'string',
          description: 'Optional notes for the reminder',
          optional: true,
        },
        due_date: {
          type: 'string',
          description: 'Optional due date in ISO 8601 format (e.g., 2025-07-27T15:00:00Z)',
          optional: true,
        },
        priority: {
          type: 'string',
          enum: ['none', 'low', 'medium', 'high'],
          description: 'Priority level of the reminder',
          optional: true,
        },
      },
      required: ['list_name', 'name'],
    },
    handler: async (args: Record<string, unknown>) => {
      try {
        const params: CreateReminderParams = {
          list_name: args.list_name as string,
          name: args.name as string,
          notes: args.notes as string | undefined,
          due_date: args.due_date as string | undefined,
          priority: args.priority as 'none' | 'low' | 'medium' | 'high' | undefined,
        };

        const result = await reminderService.createReminder(params);
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
