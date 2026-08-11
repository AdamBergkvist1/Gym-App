# ADR 0001 — Ingen omstrukturering av `src/`

**Status:** Antagen
**Datum:** 2026-08-11
**Underlag:** uppgift 12.13 i `docs/TASKS.md`

## Sammanhang

Adam beskrev 2026-08-07 kodbasen som rörig: *"I don't know where things are and how they
should work."* Förslaget att bryta upp `src/` i en `src/packages/<namn>/`-layout — med
implementation dold i undermappar bakom entry points — har återkommit flera gånger sedan
dess.

Uppgift 12.13 mätte strukturen innan något flyttades.

## Beslut

**`src/` struktureras inte om.** Den nuvarande indelningen i sju mappar
(`ai db lib parser sync timer ui`) behålls.

## Skäl

Beroendegrafen är **acyklisk och skiktad i fem nivåer**:

```
nivå 0 (löv)  lib, parser      importerar ingenting utanför sig själva
nivå 1        db               → parser, lib
nivå 2        sync, timer      → db, parser
nivå 3        ai               → sync, db, parser, lib
nivå 4        ui               → alla ovan
```

Verifierat genom uttömmande sökning, inte stickprov: `db` importerar aldrig sync/ai/ui/timer,
`sync` aldrig ai/ui, `ai` aldrig ui.

Varje funktion i `db/` tar `database: GymDatabase = db` som sista parameter. Det är ett
konsekvent genomfört seam som gör hela datalagret testbart utan mockning — den egenskap en
omstrukturering hade eftersträvat finns alltså redan.

**En omstrukturering skulle alltså lösa ett problem som inte är påvisat.** Den skulle
samtidigt röra varje importrad i kodbasen och göra varje öppen uppgift i fas 13 svårare att
slutföra.

Rörighetskänslan hade en annan och mätbar orsak: de sex tomma `index.ts` som deklarerade en
struktur de inte levererade. Det åtgärdas av 12.17 och kräver ingen flytt av filer.

## Följder

- `/setup-ts-deep-modules` körs inte på det här repot. Den förutsätter en
  `src/packages/`-layout som inte finns, och skulle alltså kräva just den flytt som avvisas
  här.
- Barrelfiler som re-exporterar en hel mapp införs inte. Principen *"en adapter = hypotetiskt
  seam, två = verkligt"* gäller: ingenting varierar över ett `src/db`-barrel.
- Beslutet gäller strukturen, inte enskilda moduler. Att fördjupa en modul där friktion
  faktiskt uppstår är fortfarande öppet — det är en annan fråga än mappindelningen.

## Vad som skulle ändra beslutet

En cykel i beroendegrafen, eller en mapp som växer så att den rymmer två orelaterade
ansvarsområden. Kör om mätningen innan förslaget tas upp igen — påståendet ovan är daterat
och gäller kodbasen som den såg ut 2026-08-11.
