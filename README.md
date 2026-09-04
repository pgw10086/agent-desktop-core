# Agent Desktop Core

Agent Desktop Core 是面向 AI Agent Desktop 产品的共享 Electron 桌面基础层。它提供窗口
Surface、快捷键、通知、受控 IPC、deadline、生命周期和最小的 Agent Runtime 生命周期契约。

本仓库当前包含两个 package：

- [`@platform/agent-desktop-core`](packages/agent-desktop-core/README.md)：通用桌面能力，不绑定 DSH 或某个具体 Agent。
- [`@platform/dsh-runtime-adapter`](packages/dsh-runtime-adapter/README.md)：DSH 的启动、ready 探测、进程恢复和 generation 适配器。

依赖方向只有一条：`@platform/dsh-runtime-adapter` 依赖 `@platform/agent-desktop-core`。未来接入
其他 Agent Runtime 时，新增对应 adapter；不要把 Conversation、Session、Tool、Approval、模型
或凭据语义塞进 Core。

## 开发

要求 Node `>=24 <25`、pnpm `>=11 <12`：

```sh
corepack pnpm install
corepack pnpm test
corepack pnpm pack:core
corepack pnpm pack:dsh
```

详细边界和迁移背景见 [`MIGRATION.md`](MIGRATION.md)；包级 API 说明见上面的 package README。
