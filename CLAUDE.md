# CLAUDE.md — Project Conventions for new-api

@AGENTS.md

## Claude Code

- Follow the shared project instructions imported from `AGENTS.md`.

## 部署流程

**每次部署必须参考 `docs/DEPLOY.md`，严格按文档步骤执行，不要凭记忆操作。**

核心流程：
1. 提交代码 → 打 tag（`vX.Y.Z-pydaxing`）→ 推送触发 GitHub Actions 构建
2. Actions 会同时构建 Linux/macOS/Windows 三个版本，**只需关注 Linux 构建完成即可**（不用等其他平台）
3. 本地 `gh release download` 下载二进制到 `/tmp`
4. `sshpass + scp` 上传到服务器
5. `sshpass + ssh` 执行停服→替换→启动→验证

**不要在本地构建，不要在服务器直接下载（太慢），不要跳步骤。**

## 版本号命名

格式：`vX.Y.Z-pydaxing`
- patch（Z）：小改动、文案修改、bug fix
- minor（Y）：新功能、较大改动
- major（X）：重大架构变更