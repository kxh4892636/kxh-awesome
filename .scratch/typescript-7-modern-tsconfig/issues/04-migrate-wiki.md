# 04. Migrate the Wiki

Status: ready-for-agent

## Parent

[TypeScript 7 and Modern Agent-Optimized TypeScript Configuration](../PRD.md)

## What to build

Turn the Wiki into a TypeScript 7 Docusaurus project whose checks cover executable site code rather than incomplete documentation examples.

## Acceptance criteria

- [x] The Wiki inherits the shared baseline and declares ES2022, bundler resolution, React JSX, its alias, root boundary, and ambient types.
- [x] Only site configuration, sidebar configuration, and application source are included.
- [x] Executable JavaScript pages are migrated to TSX and JavaScript inputs are disabled.
- [x] React 19-compatible JSX types preserve rendered output.
- [x] The existing type-check and Docusaurus production build complete successfully.
- [x] Documentation examples and unrelated Markdown remain unchanged.

## Blocked by

[01. Establish the TypeScript 7 migration foundation](./01-establish-typescript-7-foundation.md)

## Comments

Implementation evidence is recorded in the feature E2E asset.
