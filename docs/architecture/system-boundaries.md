# Agent Desktop Core 包内边界

状态：`current`

本文只描述 `agent-desktop-core` 仓库内部的职责和依赖。多产品之间的总边界以外层
[`platform-boundaries`](../../../../hermit-platform/docs/architecture/platform-boundaries.md) 和
[`ADR-0007`](../../../../hermit-platform/docs/adr/0007-agent-desktop-core-runtime-adapters.md) 为准。

## 仓库组成

```text
@hermit/agent-desktop-core
    ^
    |
@hermit/dsh-runtime-adapter
```

本仓库是一个 pnpm workspace，但不是产品工作区。两个 package 共用仓库级测试和打包脚本，仍
分别拥有自己的 manifest、源码出口和 package README。

## `@hermit/agent-desktop-core` 负责什么

- Electron 窗口、Surface、焦点和窗口策略；
- 全局快捷键、系统通知、deadline 等受控桌面能力；
- 主进程与 Renderer 之间的最小 typed IPC 边界；
- activation generation 的资源所有权、失效和逆序清理；
- 不绑定具体 Agent 的 `AgentRuntimeAdapter` 生命周期接口；
- 受控的 evidence 记录和平台能力结果。

Surface 的临时焦点恢复由 Core 统一编排：打开前创建一次 `DesktopFocusLease`，关闭时按
`restore-previous`、`keep-current` 或 `external-handoff` 处理。Core 只调用抽象的
`DesktopFocusPort`，外部应用身份和平台激活细节由 Product Desktop 注入；同一产品进程内已有
窗口优先由 Core 恢复。焦点租约与 Surface 打开代际绑定，关闭幂等，`blur` 不能递归触发第二次关闭。

Core 只承载桌面平台能力，不保存产品业务数据，不解释 Agent 的业务协议。

## `@hermit/dsh-runtime-adapter` 负责什么

- 组装产品传入的 DSH command；
- 解析并校验 DSH ready URL；
- 等待实际 HTTP ready，而不是使用固定 sleep；
- 监督 DSH 子进程、处理停止、崩溃和重启；
- 维护 supervisor generation；
- 在明确的 `prepared -> trial -> committed` 状态中切换和回滚 runtime generation。

它依赖 Core 的生命周期契约，但 Core 不依赖 DSH adapter，也不把 DSH 私有协议放进 Core。

## 明确不负责的内容

以下内容必须留在 Product Desktop、DSH 或 Product Plugin：

- Conversation、Session、Tool、Skill、Approval、模型和凭据；
- DSH Web/Layout、导航、产品页面和插件清单；
- 产品业务数据、规则、搜索索引和领域状态；
- 产品选择的 DSH 版本、profile、Node、layout、插件组合和发布策略；
- 产品专属的剪贴板、数据库、文件或 native 业务流程。

“放进 Core 可以复用”不是进入 Core 的理由。必须先有真实消费者、公开 typed contract、失败
结果和生命周期清理方式。

## 公开接口边界

下游只能依赖 package 的公开 export 和 README 说明的子路径。禁止暴露或消费：

- `BrowserWindow`、`ipcRenderer`、Node 文件系统和原生模块实例；
- 任意 IPC 转发器、私有 preload 对象和 `src/*` 相对路径；
- 未写入 package API 的内部状态、事件名或测试 helper。

主进程必须校验 sender 和输入 schema；Renderer 只拿到完成单一能力所需的最小 facade。

## 生命周期不变量

- 每个窗口、监听器、定时器、IPC handler 和子进程都属于一个明确的 activation generation；
- 停用或重启时先让旧回调失效，再释放资源；
- 异步结果提交前必须确认 generation 仍有效；
- 停止流程可重复调用，已停止状态不能重新产生副作用；
- 候选 generation 启动失败时恢复旧的 committed generation，并保留可观察原因。

## 改动门槛

新增 Core 能力前，必须在同一变更中说明真实消费者、接口和失败结果、资源归属与清理、至少
一条集成或打包验证。只改实现而不更新 package README、类型测试和消费者验证，不能视为完成。
