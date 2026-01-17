---
name: miniSpec-act
description: Execute miniSpec project execution plan, make code changes according to the execution plan
---

<!-- MINISPEC:START -->
<task>Execute tasks based on draft.md, spec.md, tasks.md, changes/ under the `/minispec/[yyyy-mm]-[feature-name]` directory</task>
<steps>
<step>Read `draft.md`, `spec.md`, `changes/` to understand user requirements, context, technical implementation, and completed tasks</step>
<step>Read `tasks.md` to get the task list</step>
<step>Ask user to select the [task-name] to execute</step>
<step>Starting from the first incomplete task, sequentially execute each task before [task-name] (including [task-name]): mark as `- [ ]` => execute task => mark as `- [x]` => next task</step>
<step>Confirm all tasks before [task-name] (including [task-name]) are completed, then end this round of task execution</step>
<step>Record code changes from this task to `changes/[task-name].md`, and update the <important>real-time context</important> of the current project in `spec.md`</step>
</steps>
<rules>
<rule>[task-name] must match tasks in `tasks.md`. If [task-name] is not in `tasks.md`, ask the user to select the correct task</rule>
<rule>During task execution, do not modify `draft.md`, `spec.md`, `tasks.md`, `changes/`</rule>
</rules>
<seek-user-confirmation>
Immediately stop the task and seek user assistance when:
1. Discovering serious defects in the plan or tasks
2. Encountering unsolvable obstacles
3. Tasks repeatedly fail
Use `miniSpec-plan` skill to update the execution plan
</seek-user-confirmation>
<after-per-session>
<git-add>
After task execution is completed, give the user two options(yes or no) whether they want to commit git changes, the git command below, display the git commit message to user
```
git add .
git commit -m "feat: complete [task-name] task"
```
</git-add>
<act-or-replan-or-end>
Give the user two options
1. Continue executing tasks in this directory
2. use `miniSpec-plan` skill to update the execution plan
<note>
- If all tasks in `task.md` are completed, inform the user that [feature-name] are finished and provide a brief completion summary of the [feature-name]
- Give the user two options(yes or no) whether they want to commit git changes, the git command below, display the git commit message to user
```
git add .
git commit -m "feat: complete [feature-name] spec"
</note>
```
</act-or-replan-or-end>
</after-per-session>
<!-- MINISPEC:END -->