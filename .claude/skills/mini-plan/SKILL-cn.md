---
name: mini-plan
description: 当你有针对多步骤任务的规范或需求时，在接触代码之前使用
---

# 编写计划

## 概述

编写全面的实施计划，假设工程师对我们的代码库零上下文且品味可疑。记录他们需要知道的一切：每个任务要接触哪些文件、代码、测试、他们可能需要检查的文档、如何测试。将整个计划作为细分的任务提供给他们。DRY。YAGNI。TDD。频繁提交。

假设他们是熟练的开发人员，但几乎不了解我们的工具集或问题域。假设他们不太了解良好的测试设计。

**开始时宣布：** "我正在使用 writing-plans 技能来创建实施计划。"

**上下文：** 这应该在专用工作树中运行（由头脑风暴技能创建）。

**将计划保存到：** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## 细分任务粒度

**每个步骤是一个动作（2-5 分钟）：**

- "编写失败的测试" - 步骤
- "运行它以确保它失败" - 步骤
- "实现使测试通过的最小代码" - 步骤
- "运行测试并确保它们通过" - 步骤
- "提交" - 步骤

## 计划文档标头

**每个计划必须以此标头开始：**

```markdown
# [功能名称] 实施计划

> **给 Claude：** 必需子技能：使用 superpowers:executing-plans 来逐任务实施此计划。

**目标：** [一句话描述此构建内容]

**架构：** [2-3 句关于方法的描述]

**技术栈：** [关键技术/库]

---
```

## 任务结构

````markdown
### 任务 N：[组件名称]

**文件：**

- 创建：`exact/path/to/file.py`
- 修改：`exact/path/to/existing.py:123-145`
- 测试：`tests/exact/path/to/test.py`

**步骤 1：编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```
````

**步骤 2：运行测试以验证它失败**

运行：`pytest tests/path/test.py::test_name -v`
预期：FAIL 并显示 "function not defined"

**步骤 3：编写最小实现**

```python
def function(input):
    return expected
```

**步骤 4：运行测试以验证它通过**

运行：`pytest tests/path/test.py::test_name -v`
预期：PASS

**步骤 5：提交**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```

```

## 记住
- 始终使用精确文件路径
- 计划中的完整代码（而不是"添加验证"）
- 带有预期输出的精确命令
- 使用 @ 语法引用相关技能
- DRY、YAGNI、TDD、频繁提交

## 执行交接

保存计划后，提供执行选择：

**"计划已完成并保存到 `docs/plans/<filename>.md`。两种执行选项：**

**1. 子代理驱动（此会话）** - 我为每个任务分派新的子代理，任务之间进行审查，快速迭代

**2. 并行会话（单独）** - 使用 executing-plans 打开新会话，分批执行并带有检查点

**哪种方法？"**

**如果选择子代理驱动：**
- **必需子技能：** 使用 superpowers:subagent-driven-development
- 留在此会话中
- 每个任务使用新子代理 + 代码审查

**如果选择并行会话：**
- 引导他们在工作树中打开新会话
- **必需子技能：** 新会话使用 superpowers:executing-plans
```
