# Runtime Adapter 契约

状态：`current`

本文是 `@hermit/dsh-runtime-adapter` 的包内契约。跨产品的依赖方向仍以外层
[`ADR-0007`](../../../../hermit-platform/docs/adr/0007-agent-desktop-core-runtime-adapters.md) 为准。

## Core 的最小接口

`@hermit/agent-desktop-core` 只定义 Agent runtime 的生命周期，不定义 Agent 业务语义：

```ts
type AgentRuntimeState =
  | "idle" | "starting" | "ready" | "stopping"
  | "stopped" | "recovering" | "unavailable"

interface AgentRuntimeAdapter {
  readonly runtimeId: string
  readonly state: AgentRuntimeState
  start(): Promise<URL | undefined>
  stop(): Promise<void>
  restart(): Promise<URL | undefined>
}
```

`URL` 是可选的本地 Web endpoint。非 Web runtime 可以返回 `undefined`，不能伪造一个无效地址。

## DSH Adapter 的职责

DSH adapter 把产品选择的 command 接入 Core：

1. 启动产品已经选定的 Node、DSH carrier 和参数；
2. 从输出中提取 ready URL；
3. 只接受 `http://127.0.0.1:<有效端口>`，拒绝凭据、其他主机和无效端口；
4. 通过受界定的 HTTP 探测确认服务真的可用；
5. 让 Electron 只加载经过校验的 URL；
6. 停止时等待受管进程退出，崩溃时按明确策略进入 recovering 或 unavailable。

DSH 在 ready 前退出或超时时，adapter 返回的失败原因必须带上最后一段有界启动输出，便于产品定位
插件装载、运行时缺失或配置错误；不能只返回退出码，也不能把无界子进程日志塞进错误链。

固定 `sleep`、随机端口当作认证、监听 `0.0.0.0`、静默切到另一套 runtime 都不符合契约。

## Generation 切换

Product Desktop 负责准备并选择 generation；adapter 负责执行切换：

```text
prepared -> trial -> committed
             |
             `-> failed -> previous committed
```

- `prepared` 只表示制品和 manifest 已通过产品侧检查；
- `trial` 表示候选已经启动并通过 ready；
- `committed` 才是下次启动默认使用的事实；
- 候选失败时必须停止候选、恢复旧实例并保留失败原因；
- 只能在同一 `dataEpoch` 内切换，数据迁移不属于本仓库；
- 没有旧 generation 时不得声称可以回滚。

generation id、上游 DSH commit、snapshot checksum、Node/DSH 版本和 data epoch 必须来自已
校验的 manifest。adapter 不下载、验签、解包或决定产品制品是否允许发布。

## 资源和迟到事件

每次启动、停止、重启和 generation 切换都形成新的 supervisor generation。旧进程的 ready、exit
或 timer 事件到达时，必须先比对 generation，再决定是否更新状态；过期事件只能记录为诊断，不能
重新打开窗口、覆盖新 URL 或改变当前状态。

## 消费者约束

Product Desktop 必须在组合根选择 runtime、版本、profile、layout、插件和发布制品。它可以使用
adapter 的公开 API，但不能：

- 直接导入 adapter 的 `src/*`；
- 把 DSH Conversation/Session/Tool/Approval 状态写入 Core；
- 依赖未声明的进程句柄、IPC channel 或 carrier 内部字段；
- 用 link、workspace 源码路径或本地 tarball 替代正式发布 package。

本地联调可以使用明确命名的 dev override；CI 和发布必须使用已发布的版本化 package，并记录
lockfile、manifest 和 SHA-256。

## 验证要求

至少覆盖：ready URL 校验、HTTP ready 超时、停止和崩溃、重复 stop、旧 generation 迟到事件、
候选切换成功、候选失败恢复旧版本，以及没有可回滚版本时的明确失败。至少一个真实消费者还要
验证从 adapter ready 到产品 renderer 加载的集成路径。
