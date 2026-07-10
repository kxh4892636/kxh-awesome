# 06. Integrate and verify the root solution

Status: ready-for-agent

## Parent

[TypeScript 7 and Modern Agent-Optimized TypeScript Configuration](../PRD.md)

## What to build

Connect the four migrated projects into one root TypeScript 7 solution and demonstrate that the compiler graph and every affected build seam are green.

## Acceptance criteria

- [x] The root configuration has an empty direct file set and references exactly the four migrated projects.
- [x] The root solution contains no leaf runtime assumptions.
- [x] The TypeScript 7 root build traverses every reference without repository-owned errors.
- [x] Root and workspace compiler version checks report TypeScript 7.0.2.
- [x] Both Vite builds, Wiki checks/build, and plugin tests/packaging remain green.
- [x] Focused Vite+ checks cover only feature files.
- [x] Whitespace, encoding, dependencies, generated boundaries, and user changes are verified.

## Blocked by

- [02. Migrate the ETF Dashboard](./02-migrate-etf-dashboard.md)
- [03. Migrate the React/Go template](./03-migrate-react-go-template.md)
- [04. Migrate the Wiki](./04-migrate-wiki.md)
- [05. Migrate the Docusaurus plugin](./05-migrate-docusaurus-plugin.md)

## Comments

Final integration evidence is recorded in the feature E2E asset.
