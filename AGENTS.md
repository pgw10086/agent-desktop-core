# Desktop Core Agent 规则

- 使用中文沟通；需要取舍时用大白话说明方案、利弊和适用场景。
- 修改前先读取 `README.md`、公共 export、相关实现和测试。
- 本仓库只负责 Electron、操作系统、受控 IPC、Surface、生命周期和 DSH 进程监管。
- 不引入产品页面、产品插件清单、品牌、DSH Web/Layout 或业务数据。
- Product Desktop 必须先解析好 DSH 命令和制品；Core 不选择 DSH 版本。
- 优先定位根因，不增加静默 fallback、重复状态或跨仓库源码引用。
- 公共 contract 改动必须同步 README、类型测试和至少一个真实消费者集成验证。
- 未经明确要求，不执行 commit、push、发布、签名或远端配置。
