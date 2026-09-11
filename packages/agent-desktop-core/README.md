# `@tianbuyv/agent-desktop-core`

Agent Desktop Core 是面向 AI Agent Desktop 产品的 Electron 平台底座，提供窗口和 Surface、快捷键、
通知、deadline、激活生命周期、受控 IPC、通用证据记录和小型 Agent Runtime 生命周期契约。具体 Agent
Runtime（例如 DeepSeek Harness，DSH）通过同仓库的独立 adapter package 接入。

Core 不实现 Conversation、Session、Tool、Skill、Approval、模型选择、凭据、插件业务数据或产品 UI，
也不决定某个产品使用哪个 runtime、Node、profile、layout 或插件清单。Core 负责承载 runtime，但它本身
不是 Agent runtime。

通用桌面能力从根入口导出；需要创建 Electron 原生通知时，显式使用
`@tianbuyv/agent-desktop-core/electron-notification-factory` 子路径。

Surface 若声明 `window.dismiss: 'restore-previous'`，Manager 会在窗口获得焦点前捕获一次焦点
租约，并在关闭后恢复。平台适配器通过 `DesktopFocusPort` 提供外部应用的捕获/恢复；同一产品
进程内已有窗口由 Manager 优先恢复。调用方可用 `keep-current` 保持当前焦点，或用
`external-handoff` 表示焦点将由另一个受信任流程接管。租约只属于一次打开代际，关闭幂等且
不会因 `blur` 事件递归执行。

本仓库同时维护通用 Core 和 DSH adapter 两个 package。它们拥有独立 package manifest、构建、测试和
npm 制品入口；同一个仓库 tag 会锁步发布两个 public package。

常用命令：

```sh
corepack pnpm install --frozen-lockfile --ignore-scripts
corepack pnpm test
corepack pnpm pack
```
