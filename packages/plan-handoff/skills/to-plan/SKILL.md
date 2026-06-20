---
name: to-plan
description: Interview the user relentlessly about a plan or design, resolve decision dependencies one by one, and create a dependency-ordered TaskList. Use this whenever the user invokes to-plan, asks to plan before building, wants to stress-test a plan, or uses any grill-style planning phrase.
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a question can be answered by exploring the codebase, explore the codebase instead.

Constraint: after dependencies are resolved, create a TaskList based on dependency relationships. Order prerequisite tasks before dependent tasks, keep each task independently verifiable;
