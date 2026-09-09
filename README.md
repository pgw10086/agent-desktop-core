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

Package 制品发布由 `.github/workflows/package-ci.yml` 和
`.github/workflows/package-release.yml` 负责。合入 `main` 只执行测试和打包检查；推送与
package 版本一致的 `vX.Y.Z` tag 后，CI 在该提交上生成 `.tgz`、来源清单和 SHA-256，并以
hash-aware 方式发布到本仓库 Release。已存在且摘要不同的资产会直接失败。

详细边界和迁移背景见 [`MIGRATION.md`](MIGRATION.md)；包级 API 说明见上面的 package README。

## 文档入口

- [Core 包内边界](docs/architecture/system-boundaries.md)
- [Runtime Adapter 契约](docs/contracts/runtime-adapter.md)
- [Core 仓库工程规则](docs/development/engineering-rules.md)
- [文档权威索引](docs/document-authority.yaml)
- [外层多仓工作区规则](../../hermit-platform/AGENTS.md)
