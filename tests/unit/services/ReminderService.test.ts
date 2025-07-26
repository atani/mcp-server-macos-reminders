/**
 * ReminderService Unit Tests
 * Following t_wada's TDD approach with comprehensive test coverage
 */

import assert from 'power-assert';
import { ReminderServiceImpl } from '../../../src/services/ReminderService';
import { MockAppleScriptExecutor } from '../../mocks/MockAppleScriptExecutor';
import { ErrorCode } from '../../../src/types';

describe('ReminderService', () => {
  let service: ReminderServiceImpl;
  let mockExecutor: MockAppleScriptExecutor;

  beforeEach(() => {
    mockExecutor = new MockAppleScriptExecutor();
    service = new ReminderServiceImpl(mockExecutor);
  });

  describe('constructor', () => {
    it('should create instance with executor dependency', () => {
      assert(service instanceof ReminderServiceImpl);
    });
  });

  describe('getReminderLists', () => {
    /**
     * Test List (t_wada's approach):
     * ✅ should return all reminder lists
     * ✅ should handle empty list response
     * ✅ should propagate executor errors
     */

    it('should return all reminder lists', async () => {
      // Arrange
      const expectedOutput = '仕事, Family, 定期的, 買うもの, Study';
      mockExecutor.setDefaultResponse(expectedOutput);

      // Act
      const result = await service.getReminderLists();

      // Assert
      assert(result.lists.length === 5);
      assert(result.lists[0].name === '仕事');
      assert(result.lists[1].name === 'Family');
      assert(result.lists[2].name === '定期的');
      assert(result.lists[3].name === '買うもの');
      assert(result.lists[4].name === 'Study');
      
      // Verify each list has an ID
      result.lists.forEach(list => {
        assert(typeof list.id === 'string');
        assert(list.id.length > 0);
      });
    });

    it('should handle empty list response', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('');

      // Act
      const result = await service.getReminderLists();

      // Assert
      assert(result.lists.length === 0);
    });

    it('should propagate executor errors', async () => {
      // Arrange
      const error = new Error('Permission denied') as any;
      error.code = ErrorCode.PERMISSION_DENIED;
      mockExecutor.setErrorToThrow(error);

      // Act & Assert
      try {
        await service.getReminderLists();
        assert.fail('Expected error to be thrown');
      } catch (thrownError) {
        const err = thrownError as any;
        assert(err.code === ErrorCode.PERMISSION_DENIED);
        assert(err.message === 'Permission denied');
      }
    });
  });

  describe('getReminders', () => {
    /**
     * Test List:
     * ✅ should return reminders from specified list
     * ✅ should filter by completion status when specified
     * ✅ should handle empty reminder list
     * ✅ should validate list name parameter
     * ✅ should propagate executor errors
     */

    it('should return reminders from specified list', async () => {
      // Arrange
      const mockOutput = 'Task 1|false|Note 1|Monday, January 1, 2024 at 9:00:00 AM|Tuesday, January 2, 2024 at 5:00:00 PM\nTask 2|true|Note 2|Monday, January 1, 2024 at 10:00:00 AM|missing value';
      mockExecutor.setDefaultResponse(mockOutput);

      // Act
      const result = await service.getReminders({ list_name: '仕事' });

      // Assert
      assert(result.reminders.length === 2);
      
      const firstReminder = result.reminders[0];
      assert(firstReminder.name === 'Task 1');
      assert(firstReminder.completed === false);
      assert(firstReminder.notes === 'Note 1');
      assert(firstReminder.list_name === '仕事');
      assert(typeof firstReminder.id === 'string');
      assert(firstReminder.id.length > 0);
      
      const secondReminder = result.reminders[1];
      assert(secondReminder.name === 'Task 2');
      assert(secondReminder.completed === true);
      assert(secondReminder.notes === 'Note 2');
      assert(secondReminder.due_date === undefined);
    });

    it('should filter by completion status when specified', async () => {
      // Arrange
      const mockOutput = 'Completed Task|true|Note|Date|missing value';
      mockExecutor.setDefaultResponse(mockOutput);

      // Act
      const result = await service.getReminders({ 
        list_name: '仕事', 
        completed: true 
      });

      // Assert
      assert(result.reminders.length === 1);
      assert(result.reminders[0].completed === true);
      
      // Verify the AppleScript included completion filter
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('if isCompleted is true then'));
    });

    it('should handle empty reminder list', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('');

      // Act
      const result = await service.getReminders({ list_name: '仕事' });

      // Assert
      assert(result.reminders.length === 0);
    });

    it('should validate list name parameter', async () => {
      // Act & Assert - empty string
      try {
        await service.getReminders({ list_name: '' });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
        assert(err.message.includes('List name cannot be empty'));
      }

      // Act & Assert - whitespace only
      try {
        await service.getReminders({ list_name: '   ' });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });

    it('should propagate executor errors', async () => {
      // Arrange
      const error = new Error('List not found') as any;
      error.code = ErrorCode.LIST_NOT_FOUND;
      mockExecutor.setErrorToThrow(error);

      // Act & Assert
      try {
        await service.getReminders({ list_name: '仕事' });
        assert.fail('Expected error to be thrown');
      } catch (thrownError) {
        const err = thrownError as any;
        assert(err.code === ErrorCode.LIST_NOT_FOUND);
      }
    });
  });

  describe('createReminder', () => {
    /**
     * Test List:
     * ✅ should create basic reminder successfully
     * ✅ should create reminder with notes
     * ✅ should create reminder with due date
     * ✅ should create reminder with priority
     * ✅ should validate required parameters
     * ✅ should validate date format
     * ✅ should handle executor errors gracefully
     */

    it('should create basic reminder successfully', async () => {
      // Arrange
      const mockReminderId = 'reminder-123';
      mockExecutor.setDefaultResponse(mockReminderId);

      // Act
      const result = await service.createReminder({
        list_name: '仕事',
        name: 'New Task'
      });

      // Assert
      assert(result.success === true);
      assert(result.reminder_id === mockReminderId);
      assert(result.error === undefined);
      
      // Verify AppleScript was called with correct parameters
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('set name of newReminder to "New Task"'));
    });

    it('should create reminder with notes', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('reminder-123');

      // Act
      const result = await service.createReminder({
        list_name: '仕事',
        name: 'Task with notes',
        notes: 'This is a note'
      });

      // Assert
      assert(result.success === true);
      
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('set body of newReminder to "This is a note"'));
    });

    it('should create reminder with due date', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('reminder-123');

      // Act
      const result = await service.createReminder({
        list_name: '仕事',
        name: 'Task with due date',
        due_date: '2024-01-15T15:00:00.000Z'
      });

      // Assert
      assert(result.success === true);
      
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('set due date of newReminder to date'));
    });

    it('should create reminder with priority', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('reminder-123');

      // Act
      const result = await service.createReminder({
        list_name: '仕事',
        name: 'High priority task',
        priority: 'high'
      });

      // Assert
      assert(result.success === true);
      
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('set priority of newReminder to 1'));
    });

    it('should validate required parameters', async () => {
      // Test empty list name
      try {
        await service.createReminder({
          list_name: '',
          name: 'Task'
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }

      // Test empty reminder name
      try {
        await service.createReminder({
          list_name: '仕事',
          name: ''
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });

    it('should validate date format', async () => {
      // Act & Assert
      try {
        await service.createReminder({
          list_name: '仕事',
          name: 'Task',
          due_date: 'invalid-date'
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_DATE_FORMAT);
        assert(err.message.includes('Invalid date format'));
      }
    });

    it('should handle executor errors gracefully', async () => {
      // Arrange
      const error = new Error('List not found') as any;
      error.code = ErrorCode.LIST_NOT_FOUND;
      mockExecutor.setErrorToThrow(error);

      // Act
      const result = await service.createReminder({
        list_name: 'NonExistent',
        name: 'Task'
      });

      // Assert
      assert(result.success === false);
      assert(result.error?.code === ErrorCode.LIST_NOT_FOUND);
      assert(result.error?.message === 'List not found');
      assert(result.reminder_id === undefined);
    });
  });

  describe('completeReminder', () => {
    /**
     * Test List:
     * ✅ should complete reminder successfully
     * ✅ should validate parameters
     * ✅ should handle executor errors gracefully
     */

    it('should complete reminder successfully', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('');

      // Act
      const result = await service.completeReminder({
        list_name: '仕事',
        reminder_name: 'Task to complete'
      });

      // Assert
      assert(result.success === true);
      assert(result.error === undefined);
      
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('set completed of targetReminder to true'));
    });

    it('should validate parameters', async () => {
      // Test empty list name
      try {
        await service.completeReminder({
          list_name: '',
          reminder_name: 'Task'
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }

      // Test empty reminder name
      try {
        await service.completeReminder({
          list_name: '仕事',
          reminder_name: ''
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });

    it('should handle executor errors gracefully', async () => {
      // Arrange
      const error = new Error('Reminder not found') as any;
      error.code = ErrorCode.REMINDER_NOT_FOUND;
      mockExecutor.setErrorToThrow(error);

      // Act
      const result = await service.completeReminder({
        list_name: '仕事',
        reminder_name: 'NonExistent'
      });

      // Assert
      assert(result.success === false);
      assert(result.error?.code === ErrorCode.REMINDER_NOT_FOUND);
    });
  });

  describe('deleteReminder', () => {
    /**
     * Test List:
     * ✅ should delete reminder successfully
     * ✅ should validate parameters
     * ✅ should handle executor errors gracefully
     */

    it('should delete reminder successfully', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('');

      // Act
      const result = await service.deleteReminder({
        list_name: '仕事',
        reminder_name: 'Task to delete'
      });

      // Assert
      assert(result.success === true);
      
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('delete targetReminder'));
    });

    it('should validate parameters', async () => {
      // Test validation similar to completeReminder
      try {
        await service.deleteReminder({
          list_name: '',
          reminder_name: 'Task'
        });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
      }
    });

    it('should handle executor errors gracefully', async () => {
      // Arrange
      const error = new Error('Reminder not found') as any;
      error.code = ErrorCode.REMINDER_NOT_FOUND;
      mockExecutor.setErrorToThrow(error);

      // Act
      const result = await service.deleteReminder({
        list_name: '仕事',
        reminder_name: 'NonExistent'
      });

      // Assert
      assert(result.success === false);
      assert(result.error?.code === ErrorCode.REMINDER_NOT_FOUND);
    });
  });

  describe('searchReminders', () => {
    /**
     * Test List:
     * ✅ should search reminders across all lists
     * ✅ should search reminders in specific list
     * ✅ should filter by completion status
     * ✅ should validate search query
     * ✅ should handle empty search results
     * ✅ should propagate executor errors
     */

    it('should search reminders across all lists', async () => {
      // Arrange
      const mockOutput = 'Matching Task|false|Note|Date|missing value|仕事\nAnother Match|true|Note2|Date2|Date3|Family';
      mockExecutor.setDefaultResponse(mockOutput);

      // Act
      const result = await service.searchReminders({
        query: 'Match'
      });

      // Assert
      assert(result.reminders.length === 2);
      assert(result.reminders[0].name === 'Matching Task');
      assert(result.reminders[0].list_name === '仕事');
      assert(result.reminders[1].name === 'Another Match');
      assert(result.reminders[1].list_name === 'Family');
    });

    it('should search reminders in specific list', async () => {
      // Arrange
      const mockOutput = 'Task in Work|false|Note|Date|missing value|仕事';
      mockExecutor.setDefaultResponse(mockOutput);

      // Act
      const result = await service.searchReminders({
        query: 'Task',
        list_name: '仕事'
      });

      // Assert
      assert(result.reminders.length === 1);
      assert(result.reminders[0].list_name === '仕事');
      
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('set searchLists to {list "仕事"}'));
    });

    it('should filter by completion status', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('Completed Task|true|Note|Date|missing value|仕事');

      // Act
      const result = await service.searchReminders({
        query: 'Task',
        completed: true
      });

      // Assert
      assert(result.reminders.length === 1);
      assert(result.reminders[0].completed === true);
      
      const executedScript = mockExecutor.getLastExecutedScript();
      assert(executedScript?.includes('if isCompleted is true then'));
    });

    it('should validate search query', async () => {
      // Act & Assert
      try {
        await service.searchReminders({ query: '' });
        assert.fail('Expected error to be thrown');
      } catch (error) {
        const err = error as any;
        assert(err.code === ErrorCode.INVALID_PARAMETER);
        assert(err.message.includes('Search query cannot be empty'));
      }
    });

    it('should handle empty search results', async () => {
      // Arrange
      mockExecutor.setDefaultResponse('');

      // Act
      const result = await service.searchReminders({
        query: 'NonExistentTask'
      });

      // Assert
      assert(result.reminders.length === 0);
    });

    it('should propagate executor errors', async () => {
      // Arrange
      const error = new Error('Permission denied') as any;
      error.code = ErrorCode.PERMISSION_DENIED;
      mockExecutor.setErrorToThrow(error);

      // Act & Assert
      try {
        await service.searchReminders({ query: 'Task' });
        assert.fail('Expected error to be thrown');
      } catch (thrownError) {
        const err = thrownError as any;
        assert(err.code === ErrorCode.PERMISSION_DENIED);
      }
    });
  });
});

/**
 * Test List Summary (t_wada's approach)
 * 
 * ReminderService Unit Tests:
 * ✅ Constructor
 * ✅ getReminderLists (3 tests)
 * ✅ getReminders (5 tests)  
 * ✅ createReminder (7 tests)
 * ✅ completeReminder (3 tests)
 * ✅ deleteReminder (3 tests)
 * ✅ searchReminders (6 tests)
 * 
 * Total: 28 unit tests covering all public methods
 * Focus: Logic validation, parameter validation, error handling
 * Mock Strategy: Full isolation from AppleScript execution
 */