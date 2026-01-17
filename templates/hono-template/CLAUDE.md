<!-- MINISPEC:START -->
<checkList>
- Determine the `/minispec/[yyyy-mm]-[feature-name]` directory based on user input. Ask the user to confirm the [feature-name] location
- If the `/minispec/[yyyy-mm]-[feature-name]` directory is not exist, create it by `miniSpec-init` skill
</checkList>
<workflow>
<workflow-stage>Initialize miniSpec, use `miniSpec-init` skill</workflow-stage>
<workflow-stage>Create miniSpec plan by multi-round conversation, use `miniSpec-plan` skill</workflow-stage>
<workflow-stage>
1. Implementing miniSpec Task, use `miniSpec-act` skill
2. After one task, optional replan the miniSpec plan, use `miniSpec-plan` skill
</workflow-stage>
<spec-structure>
minispec/
├── [yyyy-mm]-[feature-name]/
│   ├── draft.md # user requirements
│   ├── spec.md # real-time context and technical implementation
│   ├── tasks.md # task list
│   └── [changes]/ # task change records
</spec-structure>
<user-instruction>
- Follow user instructions unless they conflict with the skills
- If the user instructions conflict with the skills, ask the user for confirmation
</user-instruction>
<best-practice>
<simplicity>
Simplicity First
- Minimize the number of new/edited/deleted code lines, keep changes as small as possible
- Prefer single-file operations until proven insufficient
- Prioritize direct, minimal implementation; increase complexity only when requested or explicitly needed
</simplicity>
<compatibility>
Compatibility First
- When editing/deleting existing code, avoid breaking original logic; make patch modifications instead
- When adding new code, consider compatibility with existing code
- Consider the impact scope and logical relationships between different components
</compatibility>
<reuse>
Reusability First
- Reuse existing code logic as much as possible, avoid reimplementing
- Encapsulate code/functions/components
</reuse>
</best-practice>
<output-language>Content displayed to the user is in Chinese; language during model execution is not restricted<output-language>
<!-- MINISPEC:END -->
