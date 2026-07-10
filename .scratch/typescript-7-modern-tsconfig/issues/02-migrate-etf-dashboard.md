# 02. Migrate the ETF Dashboard

Status: ready-for-agent

## Parent

[TypeScript 7 and Modern Agent-Optimized TypeScript Configuration](../PRD.md)

## What to build

Give the ETF Dashboard one explicit TypeScript 7 project that matches its Vite browser runtime and preserves the existing application build.

## Acceptance criteria

- [x] The project inherits the shared baseline and declares ES2023, bundler resolution, React JSX, its alias, root boundary, and Vite ambient types.
- [x] One compiler context includes owned application source and TypeScript tool configuration.
- [x] Strictness fixes preserve environment fallback and selection behavior.
- [x] Generated RPC code is not manually edited.
- [x] The existing production build completes with TypeScript 7.
- [x] Focused Vite+ checks pass.

## Blocked by

[01. Establish the TypeScript 7 migration foundation](./01-establish-typescript-7-foundation.md)

## Comments

Implementation evidence is recorded in the feature E2E asset.
