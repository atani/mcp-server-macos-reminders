/**
 * Reminder Lists Resource
 * MCP Resource for providing all reminder lists information
 */

import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { ReminderService } from '../types';

export function createRemindersListsResource(reminderService: ReminderService): Resource {
  return {
    uri: 'reminders://lists',
    name: 'All Reminder Lists',
    description: 'Information about all reminder lists',
    mimeType: 'application/json',
    handler: async () => {
      try {
        const result = await reminderService.getReminderLists();

        // Get reminder counts for each list
        const listsWithCounts = await Promise.all(
          result.lists.map(async (list) => {
            try {
              const allReminders = await reminderService.getReminders({ list_name: list.name });
              const completedReminders = await reminderService.getReminders({
                list_name: list.name,
                completed: true,
              });

              return {
                name: list.name,
                id: list.id,
                reminder_count: allReminders.reminders.length,
                completed_count: completedReminders.reminders.length,
              };
            } catch (error) {
              // If we can't get counts, return basic info
              return {
                name: list.name,
                id: list.id,
                reminder_count: 0,
                completed_count: 0,
              };
            }
          })
        );

        return {
          contents: [
            {
              uri: 'reminders://lists',
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  lists: listsWithCounts,
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
              uri: 'reminders://lists',
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
