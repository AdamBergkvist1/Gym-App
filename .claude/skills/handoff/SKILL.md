---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

<!--
  URSPRUNG: mattpocock/skills, skills/productivity/handoff/SKILL.md
  LICENS:   MIT — Copyright (c) 2026 Matt Pocock
  Se docs/EXTERNT.md. Kopian är avsiktligt en minimal avvikelse från originalet:
  ENDAST lagringsplatsen är ändrad, plus stycket "Var dokumentet ska ligga".
  Håll det så — då går originalet att synka om utan att en omskrivning står i vägen.
-->

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Append it to `docs/HANDOFF.md` in this repo, as a new section at the top.

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Var dokumentet ska ligga — avvikelsen från originalet

Originalet sparar till OS:ets temp-katalog, uttryckligen inte i arbetsytan. Det passar en
stafettpinne mellan två agenter, men inte det här projektet: `CLAUDE.md` regel 5 kräver att
`docs/HANDOFF.md` uppdateras före varje sessionsslut, och filen är ett versionerat register
över projektets historia. En temp-fil hade inte överlevt en `git clone`, och nästa session
hade inte haft någon anledning att leta efter den.

Därför gäller följande här:

- **Skriv till `docs/HANDOFF.md`**, aldrig till temp-katalogen.
- **Lägg den nya sektionen överst**, direkt efter filens rubrik. Nyast först.
- **Radera aldrig äldre sektioner.** De är projektets minne.
- **Men lämna aldrig en äldre sektion som nu är felaktig oflaggad.** Motsäger den nya
  sektionen en äldre — ett beslut som ändrats, en plan som avförts — sätt en varningsruta
  överst i den äldre och skriv `DELVIS ÖVERSPELAD` i dess rubrik. En överlämning som
  motsäger sig själv är sämre än ingen alls, eftersom nästa session inte kan veta vilken
  del som gäller.
- **Committa filen** i en egen commit (`CLAUDE.md` regel 3).

## Vad som räknas som verifierbart

`CLAUDE.md` regel 5 förbjuder gissningar och "bör fungera". Konkret betyder det att siffror
ska komma från en körning du faktiskt gjort — antal tester, antal e2e, vad grindarna sa — och
att det som inte är verifierat ska stå utskrivet som overifierat. Skriv hellre "inte mätt" än
en trolig siffra.
