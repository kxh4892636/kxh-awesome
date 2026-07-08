ask-matt
code-review
codebase-design
diagnosing-bugs
domain-modeling
grill-me
grill-with-docs
grilling
handoff
implement
improve-codebase-architecture
prototype
research
setup-matt-pocock-skills
tdd
to-spec
to-tickets
wayfinder
writing-great-skills

当前 loop-coding 里保留了 19 个。
过程数量是：
最初复制：21 个（ask-matt + 20 个被它引用的 skill）
后来删除：2 个（triage、teach）
当前剩余：19 个

---

可以抽象成这组规则，作为你后续写类似 skill 的 checklist。

**1. 先写行为，不先写解释**

Skill 不是知识文章，而是让 agent 采取稳定流程的执行规程。每段都要回答：

- 什么时候触发
- 先做什么
- 做到什么程度才算完成
- 遇到分支怎么走
- 什么情况必须停下来

少写“为什么这很重要”，多写“如果 X，就做 Y；完成标准是 Z”。

**2. 用一个 leading word 锚定整条 skill**

每个好 skill 都应该有一个能反复召回行为的核心词：

- debugging: `tight loop`
- TDD: `red → green`
- 架构设计: `deep module`、`seam`
- 大型探索: `map`、`frontier`、`fog of war`
- 拆票: `tracer bullet`

这个词要短、强、有既有语义。不要每次都解释一长串“快速、确定、低成本反馈循环”，直接压缩成 `tight loop`，然后在文中反复使用。

**3. 每个步骤都要有 completion criterion**

不要写：

> Explore the codebase.

要写：

> Explore until every public entry point touched by the change is named, and each has either a test seam or an explicit reason no seam exists.

完成标准要满足两个条件：

- **可判断**：agent 能知道 done / not done。
- **有要求**：能逼出足够 legwork，而不是随手扫一眼就结束。

**4. 用强动词和短句控制行为**

这套 skill 的语气通常是：

- `Use ...`
- `Ask ...`
- `Stop ...`
- `Do not proceed until ...`
- `Record ...`
- `Run ...`
- `Present ...`

少用“consider”、“try to”、“it may be useful to”。这些词会把规则变成建议，降低可预测性。

**5. 先正向规定目标，再少量设置硬禁令**

优先写：

> Test through public interfaces.

而不是：

> Do not test implementation details.

禁令可以保留，但要配正向目标：

> Tests live at seams, never against internals.

这样 agent 的注意力落在 `seams`，不是落在被禁止的行为上。

**6. 把 skill 分成 steps 和 reference**

`SKILL.md` 顶层只放每次都要看的内容：

- 触发条件
- 主流程
- 分支选择
- 完成标准
- 核心术语

只在某些分支才用到的例子、模板、长 glossary、格式规范，放到旁边文件，通过明确的 context pointer 链接过去，例如：

> For UI prototypes, read `UI.md`; for logic prototypes, read `LOGIC.md`.

**7. 一个含义只放一个地方**

不要在 description、正文、引用文件里重复解释同一个规则。重复会造成维护成本，也会把某个概念的权重放大到不该有的程度。

可以重复的是 **leading word**，不是重复整段含义。

**8. description 只负责触发，不负责教学**

Model-invoked skill 的 `description` 应该写成触发器：

```yaml
description: Use when the user wants to debug a hard bug, diagnose a regression, or investigate flaky behavior.
```

不要把完整方法论塞进 description。description 常驻上下文，每个词都贵。

**9. 用对比划清边界**

这套风格很喜欢用成对概念：

- Good / Bad
- Deep / Shallow
- Standards / Spec
- HITL / AFK
- Model-invoked / User-invoked
- Step / Reference
- In scope / Out of scope

对比能减少歧义，特别适合告诉 agent “这件事和相邻概念不是一回事”。

**10. 写成“纪律”，不是“偏好”**

类似风格的 skill 应该有明确立场：

> No red-capable command, no Phase 2.

这种句子比“prefer having a repro before debugging”有效得多。Skill 的目标是 predictability，不是表达温和建议。

一个实用模板：

```md
---
name: <skill-name>
description: Use when ...
---

# <Skill Name>

<一句话定义这条 skill 的纪律。>

## Core principle

<leading word + 行为原则。>

## Process

### 1. <Step>

<做什么。>

Completion criterion: <可检查的完成标准。>

### 2. <Step>

...

## Branches

- If <case A>, do <path A>.
- If <case B>, read <reference file> and do <path B>.

## Anti-patterns

- **<Name>** — <坏模式是什么> → <改成什么>.

## When done

<产物、验证、记录、交接方式。>
```

核心判断标准很简单：读完这条 skill 后，agent 在不同会话里是否会走同一套过程。会，就是好 skill；只是“看起来写得完整”，但不会改变行为，就是 no-op。
