# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Relationship to docs/TASKS.md

`docs/TASKS.md` is the roadmap and the source of truth (`CLAUDE.md` rule 1) — numbered,
ordered, gated tasks with a "Klart när" acceptance condition each. It is written by hand and
read by a human. It predates these skills and is **not** being converted into a ticket store.

`.scratch/` is the fine-grained workspace beneath it: the tickets, specs and maps that skills
generate while working a single roadmap task. It is gitignored and disposable.

The traffic between them runs one way. When work in `.scratch/` settles into something
durable — a decision, a completed task, a new gate — promote it into `docs/TASKS.md` in the
same commit as the code. Never let `.scratch/` become the record; nothing there survives a
clean checkout.

Do not renumber, reformat or restructure `docs/TASKS.md` to look like a ticket store.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at
  `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` — never a single
  combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see
  `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments`
  heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. Adam will normally pass the path or the issue number
directly. A bare roadmap number (`13.4`, `12.13`) refers to `docs/TASKS.md`, not to a
`.scratch/` ticket.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the
  question in the body. A `Type:` line records the ticket type
  (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every
  file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and
  unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then
  append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
