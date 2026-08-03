#!/usr/bin/env node
/**
 * `npm run status` — mäter projektets tillstånd i stället för att lita på minnet.
 *
 * VARFÖR DEN FINNS
 * 2026-08-03 upptäcktes att `TASKS.md` påstod att fas 10 var ogjord medan appen
 * hade legat deployad i dagar, att `HANDOFF.md` angav 234 tester när det var 237,
 * och att en varning i fetstil bad om en migration som redan var körd.
 *
 * Ingen hade glömt något. Påståendena skrevs från AVSIKT och kontrollerades
 * aldrig mot VERKLIGHET. En AI-session som läser dokumenten tror på dem, och
 * bygger om det som redan fungerar.
 *
 * DEN HÄR FILENS ENDA REGEL
 * **Den får aldrig gissa.** Går något inte att mäta skriver den `okänt` och
 * varför — aldrig ett troligt värde. En statusrapport som ibland hittar på är
 * värre än ingen, eftersom man slutar kunna lita på de rader som stämmer.
 *
 * ANVÄNDNING
 *   npm run status          snabbt (~1 s). Läser filer och git.
 *   npm run status -- --full  kör även testsviten och ett produktionsbygge.
 */

import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FULL = process.argv.includes('--full');

const OKÄNT = 'okänt';

/** Kör ett kommando. Misslyckas det returneras null — aldrig ett påhittat värde. */
function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      ...opts,
    }).trim();
  } catch {
    return null;
  }
}

/**
 * npm och npx är `.cmd`-skript på Windows, och `execFileSync` kan inte starta
 * dem utan skal. Utan detta rapporterade skriptet "bygge MISSLYCKADES" på ett
 * bygge som fungerar — alltså exakt den sortens falska påstående filen finns
 * till för att förhindra. Argumenten är hårdkodade literaler, aldrig indata.
 */
function runNpm(args) {
  return run(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
}

/** Vitest färgar sin utskrift. Utan detta hamnar ANSI-koder mitt i siffrorna. */
function utanFärg(s) {
  return s.replace(/\[[0-9;]*m/g, '');
}

const rader = [];
function rubrik(text) {
  rader.push('', `\x1b[1m${text}\x1b[0m`, '─'.repeat(text.length));
}
function rad(nyckel, värde, flagga = null) {
  const v = värde === null || värde === undefined ? `\x1b[2m${OKÄNT}\x1b[0m` : String(värde);
  const märke = flagga === 'fel' ? ' \x1b[31m←\x1b[0m' : flagga === 'varning' ? ' \x1b[33m←\x1b[0m' : '';
  rader.push(`  ${nyckel.padEnd(26)} ${v}${märke}`);
}
function notis(text) {
  rader.push(`  \x1b[2m${text}\x1b[0m`);
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}
function dagarSedan(datum) {
  return Math.floor((Date.now() - datum.getTime()) / 86_400_000);
}

// ─────────────────────────────────────────────────────────── git
rubrik('Git');

const gren = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
const head = run('git', ['rev-parse', 'HEAD']);
const smutsigt = run('git', ['status', '--porcelain']);
const senaste = run('git', ['log', '-1', '--format=%h %ad %s', '--date=short']);

rad('gren', gren);
rad('senaste commit', senaste);

if (smutsigt === null) {
  rad('arbetsträd', null);
} else {
  const antal = smutsigt === '' ? 0 : smutsigt.split('\n').length;
  rad('arbetsträd', antal === 0 ? 'rent' : `${antal} ändrade filer`, antal === 0 ? null : 'varning');
}

const spårning = run('git', ['rev-list', '--left-right', '--count', 'HEAD...@{u}']);
if (spårning) {
  const [före, efter] = spårning.split(/\s+/).map(Number);
  const text = före === 0 && efter === 0 ? 'i nivå med origin' : `${före} före, ${efter} efter origin`;
  rad('mot origin', text, före === 0 && efter === 0 ? null : 'varning');
} else {
  rad('mot origin', null);
  notis('ingen uppströmsgren, eller git kunde inte nås');
}

// ─────────────────────────────────────────────────────────── tester
rubrik('Tester');

function räknaFiler(dir, filter) {
  const träffar = [];
  const gå = (d) => {
    let poster;
    try {
      poster = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const p of poster) {
      if (p.name === 'node_modules' || p.name.startsWith('.')) continue;
      const full = join(d, p.name);
      if (p.isDirectory()) gå(full);
      else if (filter(p.name)) träffar.push(full);
    }
  };
  gå(dir);
  return träffar;
}

const enhetsfiler = räknaFiler(join(ROOT, 'src'), (n) => n.endsWith('.test.ts') || n.endsWith('.test.tsx'));
const e2efiler = existsSync(join(ROOT, 'e2e'))
  ? räknaFiler(join(ROOT, 'e2e'), (n) => n.endsWith('.spec.ts'))
  : [];

rad('enhetstestfiler', enhetsfiler.length);
rad('e2e-specfiler', e2efiler.length);

if (FULL) {
  const ut = runNpm(['test']);
  const träff = ut && utanFärg(ut).match(/Tests\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+failed)?/);
  if (träff) {
    const misslyckade = Number(träff[2] ?? 0);
    rad('tester', `${träff[1]} gröna${misslyckade ? `, ${misslyckade} RÖDA` : ''}`, misslyckade ? 'fel' : null);
  } else {
    rad('tester', null);
    notis('vitest gav inget läsbart antal — kör `npm test` för hand');
  }
} else {
  rad('antal tester', null);
  notis('kör med --full för att mäta. Ett antal ur minnet vore en gissning.');
}

// ─────────────────────────────────────────────────────────── bygget
rubrik('Bygget');

if (FULL) {
  const byggt = runNpm(['run', 'build']);
  if (byggt === null) rad('bygge', 'MISSLYCKADES', 'fel');
}

const dist = join(ROOT, 'dist', 'assets');
if (existsSync(dist)) {
  const jsFiler = readdirSync(dist).filter((n) => n.endsWith('.js'));
  let störst = null;
  for (const f of jsFiler) {
    const p = join(dist, f);
    const s = statSync(p).size;
    if (!störst || s > störst.size) störst = { fil: f, size: s, path: p };
  }
  if (störst) {
    const gz = gzipSync(readFileSync(störst.path)).length;
    rad('största js-chunk', `${kb(störst.size)} rå / ${kb(gz)} gzip`);
    notis('gzip är siffran som går över nätet. Rå storlek överdriver problemet.');
  }
  const ålder = dagarSedan(statSync(join(ROOT, 'dist')).mtime);
  rad('dist byggd', ålder === 0 ? 'idag' : `för ${ålder} dagar sedan`, ålder > 1 && !FULL ? 'varning' : null);
  if (ålder > 1 && !FULL) notis('siffrorna ovan kan vara inaktuella — kör med --full');
} else {
  rad('dist', null);
  notis('inget bygge finns. Kör med --full.');
}

// ─────────────────────────────────────────────────────────── uppgifter
rubrik('Uppgifter (TASKS.md)');

const tasksPath = join(ROOT, 'docs', 'TASKS.md');
if (existsSync(tasksPath)) {
  const text = readFileSync(tasksPath, 'utf8');
  let fas = null;
  const faser = new Map();
  for (const r of text.split('\n')) {
    const fasTräff = r.match(/^#{2,3}\s+(Fas\s+[\w.]+[^—\n]*)/i);
    if (fasTräff) {
      fas = fasTräff[1].trim();
      if (!faser.has(fas)) faser.set(fas, { klara: 0, öppna: 0 });
      continue;
    }
    if (!fas) continue;
    const ruta = r.match(/^\s*-\s*\[([ xX])\]/);
    if (!ruta) continue;
    const post = faser.get(fas);
    if (ruta[1] === ' ') post.öppna++;
    else post.klara++;
  }
  for (const [namn, { klara, öppna }] of faser) {
    if (klara + öppna === 0) continue;
    const klar = öppna === 0;
    rad(namn.slice(0, 26), `${klara}/${klara + öppna} klara${klar ? ' ✓' : ''}`);
  }
} else {
  rad('TASKS.md', null);
}

// ─────────────────────────────────────────────────────────── dokumentens ålder
rubrik('Dokumentation');

for (const namn of ['HANDOFF.md', 'TASKS.md', 'PLAN.md', 'SPEC.md', 'DESIGN.md']) {
  const p = join(ROOT, 'docs', namn);
  if (!existsSync(p)) {
    rad(namn, 'SAKNAS', namn === 'DESIGN.md' ? 'varning' : 'fel');
    continue;
  }
  const ålder = dagarSedan(statSync(p).mtime);
  rad(namn, ålder === 0 ? 'ändrad idag' : `${ålder} dagar sedan`, ålder > 14 ? 'varning' : null);
}

// ─────────────────────────────────────────────────────────── produktion
rubrik('Produktion');

const gh = ['gh', 'C:/Program Files/GitHub CLI/gh.exe'].find((p) => run(p, ['--version']));
if (!gh) {
  rad('deployment', null);
  notis('gh CLI hittades inte — installera med `winget install --id GitHub.cli`');
} else {
  const hemsida = run(gh, ['repo', 'view', '--json', 'homepageUrl', '--jq', '.homepageUrl']);
  rad('produktions-URL', hemsida || null);

  const dep = run(gh, ['api', 'repos/{owner}/{repo}/deployments?per_page=1', '--jq', '.[0].sha + " " + .[0].created_at']);
  if (dep) {
    const [sha, skapad] = dep.split(' ');
    const kort = sha.slice(0, 7);
    const aktuell = head && sha === head;
    rad('senaste deployment', `${kort} (${skapad.slice(0, 10)})`);

    // Den viktigaste raden i hela skriptet: ligger produktionen efter koden?
    if (aktuell) {
      rad('produktion vs HEAD', 'samma commit ✓');
    } else {
      const bakom = run('git', ['rev-list', '--count', `${sha}..HEAD`]);
      rad('produktion vs HEAD', bakom ? `produktionen ligger ${bakom} commits efter` : 'SKILJER SIG', 'varning');
    }
  } else {
    rad('senaste deployment', null);
    notis('inga deployments via GitHub, eller gh saknar behörighet');
  }
}

// ─────────────────────────────────────────────────────────── vad som INTE mäts
rubrik('Mäts INTE av detta skript');
notis('Att något saknas här är avsiktligt — se listan, inte tystnaden.');
rader.push('');
for (const p of [
  'Supabase-schema, RLS och radantal — kräver nycklar. Fråga Claude att kolla via MCP.',
  'Edge Function-versionen i produktion — deployas via webbeditorn, utan versionshantering.',
  'Om appen fungerar på riktig iPhone — Playwright är WebKit, inte iOS Safari.',
  'Om HANDOFF.md STÄMMER — bara när den senast ändrades.',
]) {
  rader.push(`  · ${p}`);
}

rader.push('');
console.log(rader.join('\n'));
