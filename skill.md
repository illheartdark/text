# Skill 功能归纳

## 系统级 Skill（`C:\Users\King\.codex\skills\.system`）

- imagegen — 生成或编辑位图图像（照片、插图、mockup、透明背景等）
- openai-docs — 查询 OpenAI / Codex 官方文档（模型、定价、API、设置等）
- plugin-creator — 创建 Codex 插件及 marketplace 条目
- review-agent — 审查代码变更，返回可操作的缺陷发现
- skill-creator — 创建或更新 Skill
- skill-installer — 从精选列表或 GitHub 仓库安装 Skill

## 个人 Agent Skill（`C:\Users\King\.agents\skills`）

- brainstorming — 创造性工作前的需求与设计探索
- dispatching-parallel-agents — 并行分派子代理处理独立任务
- executing-plans — 按书面实现计划逐步执行
- finishing-a-development-branch — 开发完成后引导合并 / PR / 清理
- receiving-code-review — 技术核实后再采纳代码审查反馈
- requesting-code-review — 完成任务后请求代码审查
- subagent-driven-development — 用全新子代理逐任务执行计划并审查
- systematic-debugging — 先找根因再修复的系统化调试
- test-driven-development — 先写测试再写实现（TDD）
- using-git-worktrees — 用隔离工作区（worktree）开展开发
- using-superpowers — 对话开始时强制调用相关 Skill
- verification-before-completion — 声称完成前必须运行验证
- writing-plans — 为多步骤任务编写实现计划
- writing-skills — 用 TDD 方式编写和验证 Skill

## 插件运行时 Skill（`C:\Users\King\.codex\plugins\cache\openai-primary-runtime`）

- documents — 创建、编辑、修订 Word / Google Docs 文档
- pdf — 读取、创建、检查、验证 PDF（含可填写表单）
- presentations — 创建或编辑 PowerPoint / Google Slides
- excel-live-control — 实时控制打开的 Excel 工作簿
- spreadsheets — 创建、编辑、分析表格文件（xlsx / csv 等）
- template-creator — 从参考资料创建可复用模板 Skill
