Skill 生成规则

1. 先定 invocation
   - Agent 需要自动触发 → 保留 ，写成 model-invoked skill；
   - 只由人手动调用 → 加 ， 只写一句人类摘要；
2. description 只写触发条件
   - 前置 leading word；
   - 一个 branch 一个触发条件；
   - 删除 body 已经会解释的身份说明；
   - 避免同义重复，如 “debug / diagnose / troubleshoot” 如果是同一分支，只留最能触发的词；
3. 用 leading word 锚定行为
   - 选择模型已有概念：、、、、；
   - 重复术语，不重复解释；
   - 不自己造词，除非必须且能定义清楚；
4. 正文优先写 steps
   - agent 需要按顺序做事 → 写 ；
   - 每一步必须有可判断的完成条件；
   - 不写“认真分析”“充分考虑”这类 no-op；
5. reference 下沉
   - 每次都要用的规则放 ；
   - 某个 branch 才用的细则放同目录引用文件，如 、；
   - 指针要写清何时读取，不要只丢链接；
6. 每个 skill 只服务一个可预测行为
   - 一个 skill 不同时承担调研、设计、实现、review；
   - 如果后续步骤会让 agent 急着跳过当前步骤，拆成多个 skill；
7. 强完成条件
   - 差：
   - 好：
8. 写 failure modes
   - 明确常见错误；
   - 每个错误给检测信号和修正动作；
   - 例如 premature completion、duplication、scope creep、testing internals；
9. 用正向指令替代否定
   - 差：
   - 好：
10. 最后 prune - 每句话问：是否改变 agent 行为？- 每个概念是否只有一个 source of truth？- 是否能替换成一个更强 leading word？
    模板 1：流程型 Skill

---

name: <skill-name>
description: <leading word>. Use when the user wants <trigger branch A>, <trigger branch B>, or when another skill needs <shared behavior>.

---

# <Skill Title>

<One sentence: what predictable behavior this skill produces.>

## Core Idea

<Define the leading word and why it controls the process.>

## Process

### 1. <Step Name>

<What the agent does.>

Completion criterion: <observable condition that proves this step is done>.

### 2. <Step Name>

<What the agent does next.>

Completion criterion: <observable condition>.

## Rules

- <Positive instruction that changes behavior>.
- <Positive instruction that changes behavior>.
- <Hard guardrail only if needed>.

## Failure Modes

- **<Failure mode>**: <signal>. Fix by <action>.
- **<Failure mode>**: <signal>. Fix by <action>.
  模板 2：Reference / 词汇型 Skill

---

name: <skill-name>
description: Shared vocabulary for <domain>. Use when the user wants to design, review, or discuss <topic>, or when another skill needs this vocabulary.

---

# <Skill Title>

Use these terms exactly. Consistent language is the point.

## Glossary

**<Term>** — <tight definition>.
_Avoid_: <synonyms that should not be used>.

**<Term>** — <tight definition>.
_Avoid_: <overloaded terms>.

## Principles

- **<Principle name>**: <rule that changes behavior>.
- **<Principle name>**: <rule that changes behavior>.

## Rejected Framings

- **<Bad framing>**: <why it misleads the agent>.
  模板 3：Router Skill

---

name: <router-name>
description: Ask which skill or flow fits your situation.
disable-model-invocation: true

---

# <Router Title>

Use this when you don't remember which skill to invoke.

## Main Flow

1. **`/<skill-a>`** — use when <situation>.
2. **Branch — <decision question>?**
   - **Yes** → `/<skill-b>` because <reason>.
   - **No** → `/<skill-c>` because <reason>.

## On-Ramps

- **<Starting situation>** → **`/<skill>`**. <What it produces>.
- **<Starting situation>** → **`/<skill>`**. <What it produces>.

## Standalone

- **`/<skill>`** — <when to reach for it>.
  模板 4：分支型 Skill

---

name: <skill-name>
description: <leading word>. Use when the user wants <branch A> or <branch B>.

---

# <Skill Title>

<One sentence explaining that the question decides the branch.>

## Pick a Branch

- **"<Question A>"** → [A.md](A.md). <Artifact/process produced>.
- **"<Question B>"** → [B.md](B.md). <Artifact/process produced>.

If ambiguous, ask. If the user is unavailable, choose based on <local context signal> and state the assumption.

## Rules That Apply To Both

1. **<Rule>**: <specific behavior>.
2. **<Rule>**: <specific behavior>.
3. **<Rule>**: <specific behavior>.

## When Done

Capture <the durable result>. Delete or absorb <temporary artifact>.
最小生成检查清单

- 是否能触发该 skill；
- 是否有一个明确 leading word；
- 是否每一步都有 completion criterion；
- 是否删除了 no-op、重复解释和泛化建议；
- 是否把 branch-only 内容下沉到引用文件；
- 是否写了 failure modes；
- 是否能让 agent 每次走同一套过程。
-
