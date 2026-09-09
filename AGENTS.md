# Agent Desktop Core Agent 规则

- 本仓库位于 `/Users/pgw/Developer/codes/platform-core/agent-desktop-core`，在
  `/Users/pgw/Developer/codes/hermit-platform/agent-desktop-core` 通过相对链接提供外层工作区入口；
  两者指向同一个 Git 仓库。
- 使用中文沟通；需要取舍时用大白话说明方案、利弊和适用场景。
- 修改前先读取 `README.md`、公共 export、相关实现和测试。
- 详细包内边界、Runtime Adapter 契约和工程规则分别见
  `docs/architecture/system-boundaries.md`、`docs/contracts/runtime-adapter.md` 和
  `docs/development/engineering-rules.md`；不要在本文件复制长篇事实。
- `packages/agent-desktop-core/` 只负责 Electron、操作系统、受控 IPC、Surface、快捷键、通知、
  deadline、生命周期和通用 Agent Runtime 生命周期契约。
- `packages/dsh-runtime-adapter/` 只负责 DSH 命令、ready 探测、carrier、DSH 进程恢复和 generation；
  它依赖 Core，但 Core 不依赖它。
- 不引入产品页面、产品插件清单、品牌、DSH Web/Layout、Conversation/Session/Tool/Approval 或业务数据。
- Product Desktop 必须选择并配置具体 runtime adapter、版本和制品；Core 不替产品选择 Agent runtime。
- 优先定位根因，不增加静默 fallback、重复状态或跨仓库源码引用。
- 公共 contract 改动必须同步对应 package README、类型测试和至少一个真实消费者集成验证。
- 未经明确要求，不执行 commit、push、发布、签名或远端配置。
