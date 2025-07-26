#!/usr/bin/env node

/**
 * macOS Reminders MCP Server
 * Main entry point for the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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

// Tool and Resource interfaces
interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: (uri: string) => Promise<{
    contents: Array<{
      uri: string;
      mimeType: string;
      text: string;
    }>;
  }>;
}

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

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    const tool = tools.find(t => t.name === name) as unknown as MCPTool;
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

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    // Find matching resource
    let matchingResource = resources.find(r => r.uri === uri) as unknown as MCPResource;
    
    // Handle parameterized URIs like reminders://list/{list_name}
    if (!matchingResource) {
      matchingResource = resources.find(r => {
        if (r.uri.includes('{')) {
          const pattern = r.uri.replace(/\{[^}]+\}/g, '([^/]+)');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(uri);
        }
        return false;
      }) as unknown as MCPResource;
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