# Domain Docs

This repo uses a multi-context domain documentation layout.

Before exploring, read `CONTEXT-MAP.md` at the repo root. It points to one `CONTEXT.md` per relevant context. Also read ADRs that touch the area being changed:

- `docs/adr/` for system-wide decisions
- `src/<context>/docs/adr/` for context-specific decisions

If these files do not exist yet, proceed silently. Domain docs are created lazily when terms or decisions are actually resolved.

When output names a domain concept, use the vocabulary from the relevant `CONTEXT.md`. If output contradicts an existing ADR, surface that conflict explicitly.
