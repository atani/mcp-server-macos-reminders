#!/usr/bin/env node

/**
 * macOS Reminders MCP Server
 * Main entry point for the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import internal types
import { MCPTool, MCPResource } from './mcp-types.js';

// Import implementations
import { AppleScriptExecutorImpl } from './applescript/executor.js';
import { ReminderServiceImpl } from './services/ReminderService.js';

// Import tools
import { createGetReminderListsTool } from './tools/get-lists.js';
import { createGetRemindersTool } from './tools/get-reminders.js';
import { createCreateReminderTool } from './tools/create-reminder.js';
import { createCompleteReminderTool } from './tools/complete-reminder.js';
import { createDeleteReminderTool } from './tools/delete-reminder.js';
import { createSearchRemindersTool } from './tools/search-reminders.js';

// Import resources
import { createRemindersListsResource } from './resources/lists.js';
import { createReminderListDetailResource } from './resources/list-detail.js';

/**
 * Create and configure MCP server
 */
async function main() {
  // Initialize dependencies
  const appleScriptExecutor = new AppleScriptExecutorImpl();
  const reminderService = new ReminderServiceImpl(appleScriptExecutor);

  // Create tools
  const tools = [
    createGetReminderListsTool(reminderService),
    createGetRemindersTool(reminderService),
    createCreateReminderTool(reminderService),
    createCompleteReminderTool(reminderService),
    createDeleteReminderTool(reminderService),
    createSearchRemindersTool(reminderService),
  ];

  // Create resources
  const resources = [
    createRemindersListsResource(reminderService),
    createReminderListDetailResource(reminderService),
  ];

  // Create server
  const server = new Server(
    {
      name: 'mcp-reminder-claude',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
    const { name, arguments: args } = request.params;

    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      return await tool.handler(args || {});
    } catch (error) {
      const err = error as any;
      throw new Error(`Tool execution failed: ${err.message || 'Unknown error'}`);
    }
  });

  // Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request): Promise<any> => {
    const { uri } = request.params;

    // Find matching resource
    let matchingResource = resources.find(r => r.uri === uri);

    // Handle parameterized URIs like reminders://list/{list_name}
    if (!matchingResource) {
      matchingResource = resources.find(r => {
        if (r.uri.includes('{')) {
          const pattern = r.uri.replace(/\{[^}]+\}/g, '([^/]+)');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(uri);
        }
        return false;
      });
    }

    if (!matchingResource) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    try {
      return await matchingResource.handler(uri);
    } catch (error) {
      const err = error as any;
      throw new Error(`Resource access failed: ${err.message || 'Unknown error'}`);
    }
  });

  // Error handling
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('macOS Reminders MCP Server started');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});