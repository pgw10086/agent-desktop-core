# `@hermit/desktop-core`

这是可供多个 Product Desktop 使用的 Desktop Core 平台 package。它只提供经过类型约束的桌面能力、Electron
适配器、Surface/快捷键/通知/deadline 生命周期、DSH 进程监管和受信 IPC 入口，不包含
Hermit 的主窗口布局、业务插件装配、DSH 包选择或 DSH 私有实现。

Product Desktop 先解析好 Node、DSH、carrier、profile 和工作目录，再把 `DshCommand` 交给
Core。这样两个产品共用相同的启动、就绪探测、崩溃恢复和 generation 切换规则，但各自
锁定自己的 DSH Web/Layout 制品。

根入口保持可在 Node 测试环境加载；需要创建 Electron 原生通知时，显式使用
`@hermit/desktop-core/electron-notification-factory` 子路径。

本仓库拥有独立 Git、lockfile、测试和 package 制品。当前版本仍标记为 private candidate；
在确定私有 registry、远端仓库和两个产品的兼容性矩阵前，不发布到远端 registry。
本次从原仓库抽取的来源和后续事实归属见 [MIGRATION.md](MIGRATION.md)。

常用命令：

```sh
corepack pnpm install --frozen-lockfile --ignore-scripts
corepack pnpm test
corepack pnpm pack
```
