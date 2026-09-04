export interface ToolAnnotations {
  readOnlyHint: boolean
  untrustedContentHint: boolean
}

export interface WebMcpTool {
  name: string
  title: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
    additionalProperties?: boolean
  }
  annotations: ToolAnnotations
  execute: (
    input: Record<string, unknown>,
    context?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown
}

export interface BrowserModelContext {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void> | void
  getTools?: () => Promise<WebMcpTool[]>
  executeTool?: (
    tool: WebMcpTool,
    input: string,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>
  addEventListener?: (name: 'toolchange', listener: EventListener) => void
}

declare global {
  interface Document {
    modelContext?: BrowserModelContext
  }
}
