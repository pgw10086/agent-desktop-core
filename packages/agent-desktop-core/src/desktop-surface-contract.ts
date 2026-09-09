/** Desktop Surface 的稳定类型；不携带 Electron、Node 或原生窗口对象。 */

export type SurfaceKind = string

export interface DesktopSurfaceSize {
  readonly width: number
  readonly height: number
}

export type DesktopSurfaceChrome = 'system' | 'none'
export type DesktopSurfaceMovement = 'allowed' | 'locked'
export type DesktopSurfaceDismiss = 'hide' | 'close' | 'ignore'

/** 临时 Surface 关闭时对焦点的处理方式；不携带 Electron 或平台对象。 */
export type DesktopSurfaceDismissDisposition = 'restore-previous' | 'keep-current' | 'external-handoff'

/** Desktop Core 从平台适配器取得的一次性焦点恢复租约。 */
export interface DesktopFocusLease {
  /** 尝试恢复打开 Surface 前的外部应用焦点；失败必须返回明确结果。 */
  restore(): Promise<DesktopFocusRestoreResult>
  /** 释放一次性平台句柄；重复调用必须安全。 */
  dispose(): void
}

export type DesktopFocusRestoreResult =
  | { readonly status: 'restored' }
  | { readonly status: 'unavailable'; readonly reason: string }

/** 平台适配器只负责捕获和恢复外部焦点，Core 不理解具体应用或业务。 */
export interface DesktopFocusPort {
  capture(): DesktopFocusLease | undefined
}

export interface DesktopSurfaceWindowPolicy {
  readonly chrome?: DesktopSurfaceChrome
  readonly movable?: DesktopSurfaceMovement
  readonly resizable?: boolean
  readonly alwaysOnTop?: boolean
  readonly anchor?: string
  readonly placement?: string
  readonly preferredSize?: DesktopSurfaceSize
  readonly minSize?: DesktopSurfaceSize
  readonly maxSize?: DesktopSurfaceSize
  readonly focus?: string
  readonly escape?: DesktopSurfaceDismiss
  readonly blur?: 'hide' | 'keep'
  /** 未指定 close disposition 时使用的默认关闭策略。 */
  readonly dismiss?: DesktopSurfaceDismissDisposition
  readonly rememberPosition?: boolean
  readonly rememberSize?: boolean
}

export interface DesktopSurfaceDefinition {
  readonly id: string
  readonly kind: SurfaceKind
  readonly content: {
    /** runtime-view 由具体 Agent Runtime adapter 解释，Core 不绑定某个 runtime。 */
    readonly type: 'runtime-view' | 'plugin-view'
    readonly runtimeId?: string
    readonly viewId?: string
    readonly contract?: number
  }
  readonly window?: DesktopSurfaceWindowPolicy
  readonly session?: {
    readonly type: 'new-on-submit' | 'last-bound' | 'existing'
    readonly sessionId?: string
  }
  readonly actions?: readonly string[]
}

export interface DesktopSurfaceOpenOptions {
  readonly anchor?: string
  readonly placement?: string
  readonly preferredSize?: DesktopSurfaceSize
  readonly focus?: string
  readonly alwaysOnTop?: boolean
  readonly session?: DesktopSurfaceDefinition['session']
}

export interface DesktopSurfaceCloseOptions {
  /** 覆盖注册定义的关闭策略；仅由受信任的 typed caller 选择。 */
  readonly disposition?: DesktopSurfaceDismissDisposition
}

export interface DesktopSurfaceHandle {
  readonly id: string
  close(): Promise<void>
  focus(): Promise<void>
  on(event: string, listener: (payload: unknown) => void): () => void
}

export interface DesktopSurfaceCapabilities {
  readonly platform: string
  readonly supported: boolean
  readonly features: Readonly<Record<string, boolean>>
}

export type DesktopSurfaceErrorCode =
  | 'PLATFORM_UNSUPPORTED'
  | 'CAPABILITY_UNAVAILABLE'
  | 'INVALID_DEFINITION'
  | 'SESSION_UNAVAILABLE'
  | 'OWNER_UNLOADED'
  | 'RENDERER_FAILED'

export class DesktopSurfaceError extends Error {
  override readonly name = 'DesktopSurfaceError'

  constructor(
    readonly code: DesktopSurfaceErrorCode,
    message: string,
    options?: { readonly cause?: unknown },
  ) {
    super(message, options)
  }
}

export interface DesktopSurfaceService {
  register(definition: DesktopSurfaceDefinition): () => void
  open(id: string, options?: DesktopSurfaceOpenOptions): Promise<DesktopSurfaceHandle>
  toggle(id: string, options?: DesktopSurfaceOpenOptions): Promise<DesktopSurfaceHandle | null>
  resize(id: string, size: DesktopSurfaceSize): void
  close(id: string, options?: DesktopSurfaceCloseOptions): Promise<void>
  capabilities(): DesktopSurfaceCapabilities
}

/** Renderer 通过 preload bridge 消费的桌面能力；不暴露注册 loader 的内部入口。 */
export interface DesktopSurfaceClient {
  open(id: string, options?: DesktopSurfaceOpenOptions): Promise<DesktopSurfaceResult>
  toggle(id: string, options?: DesktopSurfaceOpenOptions): Promise<DesktopSurfaceResult>
  resize(id: string, size: DesktopSurfaceSize): Promise<DesktopSurfaceResult>
  close(id: string, options?: DesktopSurfaceCloseOptions): Promise<DesktopSurfaceResult>
  openMainSession(sessionId: string): Promise<DesktopMainSessionResult>
  capabilities(): Promise<DesktopSurfaceCapabilities>
}

export type DesktopSurfaceResult =
  | { readonly status: 'opened'; readonly id: string }
  | { readonly status: 'closed'; readonly id: string }
  | { readonly status: 'resized'; readonly id: string }
  | { readonly status: 'unavailable'; readonly id: string; readonly code: DesktopSurfaceErrorCode; readonly reason: string }

export type DesktopMainSessionResult =
  | { readonly status: 'opened'; readonly sessionId: string }
  | { readonly status: 'unavailable'; readonly sessionId: string; readonly code: DesktopSurfaceErrorCode; readonly reason: string }
