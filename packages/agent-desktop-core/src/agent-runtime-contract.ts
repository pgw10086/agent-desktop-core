/**
 * Agent Runtime 的最小生命周期契约。
 *
 * Core 只关心运行时是否启动、可用和可停止，不解释 Conversation、Session、Tool 或模型语义。
 * endpoint 是可选的；本地 Web runtime 通常提供它，远程或非 Web runtime 可以不返回。
 */
export type AgentRuntimeState =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'stopping'
  | 'stopped'
  | 'recovering'
  | 'unavailable'

export interface AgentRuntimeAdapter {
  /** 稳定的运行时类型标识，例如 dsh 或其他 Agent runtime。 */
  readonly runtimeId: string
  /** 当前生命周期状态；业务状态不进入 Core。 */
  readonly state: AgentRuntimeState
  /** 启动并等待运行时达到可用状态。 */
  start(): Promise<URL | undefined>
  /** 停止当前运行时及其由 adapter 管理的资源。 */
  stop(): Promise<void>
  /** 重启当前运行时并等待它再次可用。 */
  restart(): Promise<URL | undefined>
}
