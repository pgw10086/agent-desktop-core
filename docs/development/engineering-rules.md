# Core 仓库工程规则

状态：`current`

外层多仓协作规则见 [`hermit-platform/AGENTS.md`](../../../../hermit-platform/AGENTS.md)。本文只保留
Core 仓库和两个 package 的具体开发要求。

## 开始修改前

- 先读根目录 `AGENTS.md`、`README.md`、本索引和目标 package README；
- 再读公共 export、相关实现、类型、测试和调用方；
- 涉及跨产品职责时，补读外层平台边界和 ADR，不在本仓库另造一套产品规则；
- 发现边界不清先写清楚选择和影响，再修改实现。

## 代码和接口

- 保持 Core、Runtime Adapter 和 Product Desktop 的职责单一；
- 公共 export 必须有稳定命名、输入校验、失败结果和生命周期说明；
- 外部输入使用运行时校验和类型收窄，不能用类型断言代替校验；
- 不增加静默 fallback、重复状态或私有跨仓源码引用；
- 代码文件超过 700 行时评估按职责拆分，不机械切割；
- 中文注释只解释不变量、原因、生命周期和安全边界，不重复代码字面含义。

## 测试和日志

- Core 测试覆盖能力接口、拒绝路径、超时、资源释放和迟到事件；
- Adapter 测试覆盖 ready、进程监督、generation 切换和回滚；
- 至少一个真实消费者覆盖 package 集成，不用 README、样式或快照测试充数；
- 日志说明执行位置、关键状态、分支原因和异常上下文；不记录凭据、真实用户数据和完整业务正文；
- 预期失败使用 typed result 或明确 error，真正违反不变量才抛出程序异常。

## 依赖和制品

- 仓库内部 package 可以使用 `workspace:*`；跨仓库正式依赖只能用已发布 package 的固定版本；
- 不把 `link:`、`../other-repo/src` 或隐式 hoist 写进 CI/Release 依赖；
- `package.json#engines` 写兼容范围，lockfile、manifest 和验证报告记录某次候选的精确版本；
- 不解析 `latest`、Git HEAD 或未锁定的 workspace 制品；
- 修改公共 contract 时，同步 package README、类型测试和真实消费者集成验证。

## 文档归属

- Core 包内边界只写在 `docs/architecture/system-boundaries.md`；
- Runtime Adapter 生命周期和 generation 只写在 `docs/contracts/runtime-adapter.md`；
- package 的 API 说明写在对应 package README；
- 迁移来源和回滚信息写在 `MIGRATION.md`；
- 文档权威入口是 `docs/document-authority.yaml`；其他文档链接到权威来源，不复制长篇规则。

## 完成标准

运行与变更直接相关的检查，报告真实结果；涉及公共接口、职责边界、依赖或制品时，必须同步
相应文档。未经明确要求，不执行 commit、push、发布、签名、公证、部署或远端配置。
