/**
 * Internal MCP type definitions
 * These are used internally since the SDK's Tool/Resource types don't include handlers
 */

export interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: Record<string, unknown>) => Promise<MCPToolResult>;
}

export interface MCPResourceContents {
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: (uri: string) => Promise<MCPResourceContents>;
}
