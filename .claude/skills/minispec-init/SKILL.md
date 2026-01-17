---
name: miniSpec-init
description: Initialize miniSpec project structure
---

<!-- MINISPEC:START -->
<task>Based on the user-input, generate [feature-name]. Create directory structure according to <folder-structure></task>
<folder-structure>
minispec/
├── [yyyy-mm]-[feature-name]/
│   ├── draft.md
│   ├── spec.md
│   ├── tasks.md
│   └── [changes]/
</folder-structure>
<rules>
<rule>Ask the user to confirm the `/minispec/[yyyy-mm]-[feature-name]` location</rule>
<rule>Determine whether `/minispec/[yyyy-mm]-[feature-name]` exists. If it exists, regenerate [feature-name] and create the directory structure</rule>
<rule>[feature-name] brief, accurate (no more than 8 Chinese characters) and semantic, e.g., "add user login feature"</rule>
<rule>Create empty files only. Do not write file content</rule>
</rules>
<init-after>
<information>Inform the user that the directory structure has been created under `/minispec/[yyyy-mm]-[feature-name]`</information>
<git-add>
Give the user two options(yes or no) whether they want to commit git changes, the git command below, display the git commit message to user
```
git add .
git commit -m "feat: init [feature-name] spec"
```
</git-add>
<plan>
1. Give the user two options(yes or no) whether use `miniSpec-plan` skill to create a detailed execution plan
2. If choose yes, give the user two options
   1. Use user input when calling `miniSpec-init` as the requirements
   2. Let user input the requirements
</plan>
</init-after>
<!-- MINISPEC:END -->