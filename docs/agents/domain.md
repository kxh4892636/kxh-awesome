# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This repository uses a single-context layout:

- `CONTEXT.md` at the repository root contains the domain glossary.
- `docs/adr/` contains architectural decision records.

`CONTEXT.md` 和 `docs/adr/` 中的文件内容使用中文

## Before exploring, read these

- `CONTEXT.md` at the repo root.
- ADRs under `docs/adr/` that touch the area you're about to work in.

If these files don't exist, proceed silently. Don't flag their absence or suggest creating them upfront. The `/domain-modeling` skill creates them lazily when terms or decisions are resolved.

## File structure

```text
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-example-decision.md
│   └── 0002-another-decision.md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept—in an issue title, refactor proposal, hypothesis, or test name—use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept isn't in the glossary yet, reconsider whether you're inventing language the project doesn't use or note the genuine gap for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding it.
