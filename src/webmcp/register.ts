import type { AppState } from '../domain/types'
import { createWebMcpTools, type ToolDispatch } from './tools'

export type WebMcpStatus = 'registering' | 'ready' | 'unavailable' | 'error'

export function registerWebMcpTools(
  getState: () => AppState,
  dispatch: ToolDispatch,
  onStatus: (status: WebMcpStatus, count: number) => void,
): () => void {
  const modelContext = document.modelContext
  if (!modelContext) {
    onStatus('unavailable', 0)
    return () => undefined
  }

  const controllers: AbortController[] = []
  let disposed = false
  const tools = createWebMcpTools(getState, dispatch)
  onStatus('registering', tools.length)

  void Promise.all(
    tools.map(async (tool) => {
      const controller = new AbortController()
      controllers.push(controller)
      await modelContext.registerTool(tool, { signal: controller.signal })
    }),
  )
    .then(() => {
      if (!disposed) onStatus('ready', tools.length)
    })
    .catch(() => {
      if (!disposed) onStatus('error', 0)
    })

  return () => {
    disposed = true
    controllers.forEach((controller) => controller.abort())
  }
}
