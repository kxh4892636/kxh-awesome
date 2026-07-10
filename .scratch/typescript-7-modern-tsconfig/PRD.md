# TypeScript 7 and Modern Agent-Optimized TypeScript Configuration

Status: ready-for-agent

## Problem Statement

The monorepo currently runs TypeScript 6 and has several independent TypeScript configurations with overlapping but inconsistent compiler choices. The root configuration unintentionally treats the repository as one NodeNext project, the Wiki configuration includes documentation examples that are not application source, and package boundaries are not represented as a TypeScript project graph. This creates noisy diagnostics, makes runtime assumptions less obvious to developers and coding agents, and prevents the repository from taking advantage of TypeScript 7's native compiler performance.

The user wants every TypeScript project to run on TypeScript 7 while retaining the correct runtime and tooling assumptions for each project. The resulting configuration should favor modern, erasable TypeScript, explicit project boundaries, strict feedback, predictable ambient types, and fast verification without turning third-party declaration defects or unrelated repository content into project errors.

## Solution

Upgrade the workspace compiler catalog and every TypeScript project to TypeScript 7.0.2, then reorganize the compiler configuration into a root solution, a shared safety baseline, and one project-specific configuration per TypeScript project. The root solution will describe the monorepo project graph without compiling repository files directly. Each project will inherit strict, agent-friendly safety checks while explicitly defining its runtime target, module resolution, ambient types, source boundary, and build role.

Use TypeScript 7 as the only compiler by default. Add a TypeScript 6 compatibility alias only if a real packaging or framework command proves that it still requires the legacy compiler API. Keep third-party declaration checking skipped, but apply the full strict baseline to repository-owned source. Make the minimal behavior-preserving source corrections required by the new checks, including converting the Wiki's remaining executable JavaScript pages to TSX and excluding documentation code samples from the Wiki application project.

## User Stories

1. As a repository maintainer, I want every TypeScript project to execute TypeScript 7, so that local development and CI benefit from the native compiler's performance.

2. As a repository maintainer, I want the root compiler configuration to describe project references instead of compiling the whole repository as one program, so that unrelated files do not contaminate diagnostics.

3. As a coding agent, I want a shared strict baseline, so that unsafe or hallucinated code is rejected consistently across projects.

4. As a coding agent, I want every project to declare its own runtime assumptions, so that I do not use Node APIs in browser code or browser assumptions in publishable library code.

5. As a frontend developer, I want the two Vite applications to retain a modern ES2023 browser target and bundler-aware module resolution, so that type checking matches their actual build pipeline.

6. As a Wiki maintainer, I want the Docusaurus application to retain its supported ES2022 baseline, so that modernization does not silently exceed the framework's runtime expectations.

7. As a plugin consumer, I want the publishable Docusaurus plugin checked with Node-compatible module semantics, so that imports accepted during development also work for downstream ESM consumers.

8. As a repository maintainer, I want application and library targets to be explicit rather than inherited from future compiler defaults, so that TypeScript upgrades do not silently change supported APIs.

9. As a coding agent, I want ambient type packages allowlisted per project, so that newly installed dependencies cannot silently introduce unrelated global variables.

10. As a test author, I want test APIs imported explicitly, so that tests do not depend on hidden Vitest globals.

11. As a TypeScript developer, I want unchecked indexed access, exact optional properties, implicit return, override, fallthrough, unused-code, side-effect import, and index-signature checks enabled, so that common defects are caught before build time.

12. As a build-tool user, I want repository code limited to erasable TypeScript syntax, so that Vite, Docusaurus, tsdown, and future compatible transformers interpret the same source consistently.

13. As a repository maintainer, I want third-party declaration internals skipped, so that upstream React, MDX, Ant Design, or tooling declaration defects do not block this repository.

14. As a repository maintainer, I still want repository usage of third-party APIs type checked, so that skipping declaration internals does not weaken application code.

15. As a Wiki developer, I want only real site configuration and source included in the Wiki TypeScript project, so that article examples with intentionally incomplete dependencies do not create false failures.

16. As a Wiki developer, I want all executable site pages written in TSX, so that no production page bypasses strict type checking.

17. As a plugin author, I want declaration generation verified through the existing packaging tool, so that published types remain usable without adding low-value isolated-declaration annotations to tool configuration.

18. As a maintainer reviewing this migration, I want source fixes to be mechanical and behavior-preserving, so that the compiler upgrade does not become an unplanned product refactor.

19. As a maintainer, I want TypeScript 6 introduced only after an observed compatibility failure, so that the normal dependency graph remains unambiguously TypeScript 7.

20. As a maintainer, I want the existing Vite+ version and unrelated dependencies left unchanged, so that compiler migration risk is isolated.

21. As a contributor, I want generated files and unrelated formatting defects left untouched, so that the change remains reviewable and does not overwrite user work.

22. As an implementation agent, I want one root static verification seam and a small set of real package build seams, so that completion can be demonstrated without duplicating low-level tests.

23. As a CI operator, I want the dependency lock regenerated only through the repository's Vite+ workflow, so that package metadata remains reproducible.

24. As a future maintainer, I want the TypeScript 6 fallback removed when the remaining compiler API consumers support TypeScript 7, so that temporary compatibility does not become permanent architecture.

## Implementation Decisions

- The shared compiler catalog will pin TypeScript to the current 7.0 patch line with a tilde range beginning at 7.0.2. The root workspace will also declare the compiler explicitly instead of relying on hoisting or an optional tooling peer.

- All TypeScript workspaces will continue to consume the shared catalog entry. TypeScript 7 is the default and only compiler dependency unless verification demonstrates a concrete compiler API incompatibility.

- A TypeScript 6 compatibility package will not be installed proactively. If a real command fails because a tool imports the removed compiler API, use the official side-by-side alias strategy, keep TypeScript 7's compiler binary as the build and CI entry point, record the reason near the dependency declaration, and rerun the same failed command.

- The Vite+ dependency will not be upgraded as part of this work. Its current and latest releases still advertise an optional TypeScript 5/6 compiler API peer, so an unrelated Vite+ upgrade neither removes the compatibility question nor belongs in the compiler migration.

- The root TypeScript configuration will become a solution-only project with an empty file set and references to the Wiki, ETF Dashboard, React/Go template, and Docusaurus plugin. It will not define a runtime module system or directly include repository source.

- A shared TypeScript baseline will contain only cross-project safety and portability decisions. Runtime target, library set, module mode, ambient types, aliases, root boundary, and include/exclude patterns remain project-specific.

- Referenced projects will be composite projects and will use TypeScript only for checking. Actual JavaScript and declaration artifacts remain owned by Vite, Docusaurus, and tsdown.

- The shared safety baseline will explicitly enable strict mode, exact optional property semantics, unchecked indexed access, implicit return checks, override checks, switch fallthrough checks, unused local and parameter checks, property-access restrictions for index signatures, unchecked side-effect import checks, unknown catch variables, consistent file-name casing, forced module detection, verbatim module syntax, and erasable-only TypeScript syntax.

- Third-party declaration internals will remain skipped. This does not suppress checking when repository code calls or consumes third-party APIs.

- The ETF Dashboard and React/Go template will use an ES2023 target and library set, ES module output semantics, bundler module resolution, React's automatic JSX runtime, no emit, their existing source aliases, and only Vite client ambient types.

- The user explicitly rejected separate browser and Node compiler configurations for the Vite applications. Each application therefore retains one project-specific configuration that also includes the TypeScript tool configuration it owns.

- The Wiki will use the Docusaurus-aligned ES2022 target, ES module output semantics, bundler resolution, React JSX, no emit, and explicit Node, React, and Docusaurus ambient types.

- The Wiki source boundary will include only site configuration, sidebar configuration, and application source. Documentation content, documentation code examples, generated Docusaurus state, and built output are not part of the application TypeScript project.

- The Wiki's remaining executable JavaScript pages will be converted to TSX, after which JavaScript input support will be disabled for that project.

- The Docusaurus plugin will use an ES2022 target, NodeNext module and resolution semantics, explicit Node, React, and Docusaurus ambient types, and its existing source, tests, and packaging configuration boundary.

- The plugin will keep declaration intent visible, but will not enable isolated declarations. Declaration correctness is verified at the higher packaging seam because the current isolated-declaration result adds configuration boilerplate without exposing additional public API defects.

- Existing aliases will remain relative to each project root and will not use the removed base URL option.

- Strictness fixes are authorized only when directly required by the agreed compiler settings and when runtime behavior remains unchanged. Expected corrections include explicit index-signature access, omission of absent optional properties, correct null representation at a UI component boundary, React 19-compatible JSX types, and TSX conversion of executable Wiki pages.

- If implementation reveals a strictness error that requires a behavioral or domain decision rather than a mechanical type correction, implementation must stop and request direction instead of weakening the compiler baseline or guessing.

- Generated RPC sources, generated documentation, distribution output, unrelated repository content, and existing user modifications are read-only for this work.

## Testing Decisions

- Tests and checks should assert observable toolchain behavior: which compiler runs, whether the repository project graph type-checks, whether applications build, whether the Wiki builds, and whether the plugin packages usable declarations. Tests should not assert the textual ordering of compiler options or other incidental JSON structure.

- The highest static seam is a TypeScript 7 build of the root solution project. This must traverse all four referenced projects and complete without repository-owned type errors.

- Compiler version checks must demonstrate that the root and every TypeScript workspace resolve TypeScript 7.0.2 from their normal workspace commands.

- The ETF Dashboard and React/Go template must each pass their existing production build command. These commands exercise TypeScript checking and the actual Vite build path.

- The Wiki must pass its existing type-check command and its production Docusaurus build. This verifies both the narrowed source boundary and framework compatibility.

- The Docusaurus plugin must pass its existing tests and packaging build. The packaging result is the acceptance seam for declaration generation and externalized module handling.

- If plugin packaging fails specifically because a dependency imports the legacy compiler API, that failure is the trigger for the approved TypeScript 6 alias fallback. After adding the fallback, rerun the exact packaging command and the TypeScript 7 compiler version checks.

- Run focused Vite+ checks only on files changed by this implementation, using the repository's fix-capable check workflow where appropriate. Do not format or lint unrelated files merely to obtain a green repository-wide formatter result.

- Regenerate dependency resolution through the repository's Vite+ install command after changing the compiler catalog. The lockfile is an output of that command and must not be edited manually.

- Validate the resulting Markdown/config/source changes for whitespace and line-ending integrity. Existing unrelated working-tree changes must remain unchanged.

- Prior art consists of the existing package build scripts, the plugin's current tests, the Wiki's current type-check and build scripts, and the repository's root Vite+ type-aware check configuration. No new unit-test seam is required because this migration changes toolchain contracts rather than application behavior.

## Out of Scope

- Upgrading Vite+, Vite, Vitest, Docusaurus, React, Ant Design, or any dependency other than TypeScript and a proven TypeScript 6 compatibility alias.

- Refactoring application features, changing UI behavior, changing routes, changing API contracts, or modifying Go services.

- Splitting either Vite application into separate browser and Node TypeScript projects.

- Enabling isolated declarations for the Docusaurus plugin.

- Type-checking code examples embedded in Wiki documentation.

- Repairing, completing, or adding dependencies for documentation example programs.

- Fixing repository-wide formatting errors, warnings in deprecated content, or pre-existing changes outside the compiler migration.

- Manually editing generated sources, generated documentation, distribution output, or the dependency lockfile.

- Proactively installing TypeScript 6 without an observed tool compatibility failure.

- Creating new domain vocabulary or an architecture decision record for reversible compiler configuration choices.

## Further Notes

- The primary migration reference is Microsoft's [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). It documents the native compiler, TypeScript 7's lack of a programmatic API, TypeScript 6 compatibility package, new defaults, removed options, and the current limitation for MDX-style embedded-language tooling.

- The root solution shape follows the TypeScript handbook guidance for [project references](https://www.typescriptlang.org/docs/handbook/project-references): an empty root file set, explicit leaf references, and inherited shared options.

- The application and library module choices follow TypeScript's [compiler option guidance](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options): bundler resolution for bundled applications and stricter Node-compatible checking for a publishable ESM library.

- Current compatibility probes show that the ETF Dashboard, React/Go template, and Docusaurus plugin already type-check with TypeScript 7 before the stricter baseline is applied. The Wiki's current failures reproduce identically under TypeScript 6 and 7, confirming that they are existing source-boundary and React 19 type issues rather than a TypeScript 7 regression.

- Disabling third-party declaration skipping currently exposes upstream declaration failures in React/MDX, Ant Design internals, and Vite+ packaging types. Keeping the skip enabled is therefore an intentional ownership boundary, not a reduction in checks for repository source.
