---
name: miniSpec-plan
description: Create miniSpec project execution plan, use before executing code
---

<!-- MINISPEC:START -->
<task>Engage in multi-round conversational interaction with the user. Update draft.md, spec.md, tasks.md files under the `/minispec/[yyyy-mm]-[feature-name]` directory based on conversation content. Create miniSpec project execution plan</task>
<rules>
<rule>Use absolute file paths and line numbers for references in the format `absolute-path:42`</rule>
<rule><important>Do not edit any code files. Only modify draft.md, spec.md, tasks.md files</important></rule>
<rule>When file content is too long, compress the file content as needed</rule>
</rules>
<markers>
Use markers to identify user requirements. Must be used in draft.md, spec.md, tasks.md files:
<mark>{{ADDED}}: new features/components/modules</mark>
<mark>{{MODIFIED}}: modified features/components/modules</mark>
<mark>{{REMOVED}}: removed features/components/modules</mark>
</markers>
<file-rules>
<draft>Record user requirements for [feature-name]. Do not include any technical implementation</draft>
<spec>
- Record the <important>real-time context</important> of the current project required for [feature-name]
- Record specific technical implementation for completing each feature of [feature-name]
</spec>
<tasks>
<task-file-example>
---
name: [feature-name]
description: 'brief introduction to requirements'
---
## 1. Requirement 1
- [ ] 1.1 Task 1
- [ ] 1.2 Task 2
- [ ] 1.3 Task 3
</task-file-example>
<task-granularity>
- Atomic, independent, executable actions (2-5min)
- Testable, can be independently verified for correctness
</task-granularity>
</tasks>
<how-to-update>
- Automatically update in each round based on conversation content
- Update based on current project real-time code. If user input conflicts with real-time code, ask user to confirm whether to update the plan, or remind user to modify input content
- Only update files that need changes. For example, technical implementation changes do not affect draft.md
</how-to-update>
</file-rules>
<after-per-session>
<git-add>
After each round of conversation ends, give the user two options(yes or no) whether they want to commit git changes, the git command below, display the git commit message to user
The [content-change] is a summary of conversation - brief, accurate (no more than 8 Chinese characters) and semantic, e.g., "add user login feature"
```
git add .
git commit -m "feat: update [content-change] plan"
```
</git-add>
<plan-or-act>
Give the user two options
1. Continue updating the plan in this directory
2. use `miniSpec-act` skill to execute the plan
</plan-or-act>
</after-per-session>
<!-- MINISPEC:END -->