# 01. Establish the TypeScript 7 migration foundation

Status: ready-for-agent

## Parent

[TypeScript 7 and Modern Agent-Optimized TypeScript Configuration](../PRD.md)

## What to build

Make TypeScript 7.0.2 the unambiguous compiler for the workspace and provide the reusable strict baseline that later project tickets can adopt.

## Acceptance criteria

- [x] The shared compiler catalog uses the agreed TypeScript 7.0 patch range, and the root workspace declares the compiler explicitly.
- [x] The lock is regenerated through Vite+ rather than edited manually.
- [x] The root and every TypeScript workspace report TypeScript 7.0.2.
- [x] The shared configuration contains cross-project strictness and portability rules without project runtime assumptions.
- [x] TypeScript 6 is introduced only after a real compiler API failure, and unrelated tools remain unchanged.
- [x] Generated files and unrelated working-tree changes remain untouched.

## Blocked by

None — can start immediately.

## Comments

Implementation evidence is recorded in the feature E2E asset.
