# 05. Migrate the Docusaurus plugin

Status: ready-for-agent

## Parent

[TypeScript 7 and Modern Agent-Optimized TypeScript Configuration](../PRD.md)

## What to build

Give the publishable Docusaurus plugin a strict TypeScript 7 configuration and prove its tests and bundled declarations still work.

## Acceptance criteria

- [x] The plugin inherits the shared baseline and declares ES2022, NodeNext semantics, ambient types, and owned source/test/tool boundaries.
- [x] Declaration intent remains enabled while isolated declarations remain disabled.
- [x] Front-matter, regex-group, and optional-slug fixes preserve route behavior.
- [x] Existing tests and declaration packaging pass.
- [x] The TypeScript 6 API alias exists only because the observed packaging failure required it; TypeScript 7 remains the build compiler.
- [x] No unrelated dependency upgrade is included.

## Blocked by

[01. Establish the TypeScript 7 migration foundation](./01-establish-typescript-7-foundation.md)

## Comments

Implementation evidence is recorded in the feature E2E asset.
