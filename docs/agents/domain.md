# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the
codebase.

This repo is **single-context**: one `CONTEXT.md` and one `docs/adr/` at the root.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root
- **`docs/adr/`** — read ADRs that touch the area you're about to work in

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't
suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs`
and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get
resolved.

Neither exists as of this file's creation. That is the expected state, not a gap to fill.

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-....md
│   └── 0002-....md
└── src/
```

## Relationship to the existing project documents

`CLAUDE.md` §8 already names the documents this project runs on (`docs/SPEC.md`,
`docs/PLAN.md`, `docs/DESIGN.md`, `docs/TASKS.md`, `supabase/migrations/`). Those keep their
roles unchanged.

`CONTEXT.md` and `docs/adr/` do not replace or duplicate them:

- `CONTEXT.md` is the **glossary** — what the domain terms mean (`set`, `spökdata`,
  `utkorg`, `pass`). `docs/SPEC.md` says what the app does; `CONTEXT.md` says what its words
  mean.
- `docs/adr/` records **one decision per file, with the alternatives that lost and why**.
  `docs/PLAN.md` holds settled design; an ADR holds the argument behind a single choice.

Nothing is migrated out of the §8 documents into these. They accrete only when
`/domain-modeling` resolves something new.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis,
a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary
explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing
language the project doesn't use (reconsider) or there's a real gap (note it for
`/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently
overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
