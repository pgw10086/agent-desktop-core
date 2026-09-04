# 迁移来源

本仓库从 `hermit-vnext` commit `7fd89dc520a2cf80668e042a125426163ab593df` 的
`apps/desktop-vnext` 通用桌面能力中抽取，并在 2026-09-03 完成独立 package、测试和制品验证。
当前仓库提供 `@platform/agent-desktop-core` 和 `@platform/dsh-runtime-adapter` 两个 package；
原仓库只作为迁移历史和回滚参考，后续平台契约和实现事实只在本仓库维护。
