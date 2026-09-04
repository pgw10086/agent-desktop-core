# `@platform/agent-desktop-core`

Agent Desktop Core 是面向 AI Agent Desktop 产品的 Electron 平台底座，提供窗口和 Surface、快捷键、
通知、deadline、激活生命周期、受控 IPC、通用证据记录和小型 Agent Runtime 生命周期契约。具体 Agent
Runtime（例如 DeepSeek Harness，DSH）通过同仓库的独立 adapter package 接入。

Core 不实现 Conversation、Session、Tool、Skill、Approval、模型选择、凭据、插件业务数据或产品 UI，
也不决定某个产品使用哪个 runtime、Node、profile、layout 或插件清单。Core 负责承载 runtime，但它本身
不是 Agent runtime。

通用桌面能力从根入口导出；需要创建 Electron 原生通知时，显式使用
`@platform/agent-desktop-core/electron-notification-factory` 子路径。

本仓库同时维护通用 Core 和 DSH adapter 两个 package。它们拥有独立 package manifest、构建、测试和
制品入口；当前仍标记为 private candidate，不发布到远端 registry。

常用命令：

```sh
corepack pnpm install --frozen-lockfile --ignore-scripts
corepack pnpm test
corepack pnpm pack
```
