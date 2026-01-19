/**
 * Reminder List Detail Resource
 * MCP Resource for providing detailed information about a specific reminder list
 */

import { MCPResource } from '../mcp-types.js';
import { ReminderService } from '../types';

export function createReminderListDetailResource(reminderService: ReminderService): MCPResource {
  return {
    uri: 'reminders://list/{list_name}',
    name: 'Reminder List Detail',
    description: 'Detailed information about a specific reminder list',
    mimeType: 'application/json',
    handler: async (uri: string) => {
      try {
        // Extract list name from URI: reminders://list/{list_name}
        const match = uri.match(/^reminders:\/\/list\/(.+)$/);
        if (!match) {
          throw new Error('Invalid URI format. Expected: reminders://list/{list_name}');
        }

        const listName = decodeURIComponent(match[1]);

        // Get all reminders for the list
        const result = await reminderService.getReminders({ list_name: listName });

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  list: {
                    name: listName,
                    id: `list-${listName}`,
                    reminders: result.reminders,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const err = error as any;
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
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
