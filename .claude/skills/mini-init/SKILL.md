---
name: miniSpec-init
description: 用于初始化 miniSpec 项目结构
disable-model-invocation: true
---

<overview>
根据用户输入, 生成[feature-name], 在@/minispec 目录下根据<folder-structure>创建目录结构
</overview>
<folder-structure>
minispec/
├── [feature-name]/ # 正在实现的功能
│   ├── context.md # 功能上下文
│   ├── spec.md # 规格文档
│   ├── tasks.md # 任务列表文档
│   └──[changes]/ # 任务记录列表
</folder-structure>
<rules>
判断@/minispec/[feature-name] 是否存在,如果存在, 请重新生成[feature-name]并创建目录结构
</rules>
<user-message>
告知用户已在@/minispec/[feature-name] 目录下创建目录结构
<user-message>
<init-after>
<git-add>
执行以下 git 命令
```
git add .
git commit -m "feat: init miniSpec for [feature-name]"
```
<git-add>
<plan>使用 miniSpec-plan 创建详细的执行计划</plan>
<init-after>
