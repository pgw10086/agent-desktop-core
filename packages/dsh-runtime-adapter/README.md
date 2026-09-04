# `@platform/dsh-runtime-adapter`

这是 DeepSeek Harness（DSH）对 Agent Desktop Core 的运行时适配器。它负责把 DSH 的启动命令、
ready 探测、carrier 停止协议、崩溃恢复和 generation 切换接入通用桌面宿主。

它不负责 Conversation、Session、Tool、Skill、Approval、模型选择、凭据或产品插件业务。产品
Desktop 负责选择 DSH 版本、Node、profile、layout 和插件清单，再创建 adapter。

通用桌面能力由同仓库的 `@platform/agent-desktop-core` 提供。未来其他 Agent Runtime 可以实现
相同的生命周期契约，而不需要把 DSH 私有协议放进 Core。
