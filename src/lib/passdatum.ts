/**
 * Passets datum som det står på historikraden. Uppgift steg 4.3 del A.
 *
 * ⚠️ **FUNKTIONEN LIGGER I `lib` OCH INTE I KOMPONENTEN, OCH DET ÄR SKÄLET:**
 * `DESIGN.md` §3.2 skriver ut formen — `Tisdag 2 aug` — alltså är den ett krav
 * och inte en formateringsdetalj. Ett krav som bara finns inuti en komponent
 * har ingen vakt, och nästa person som byter `weekday: 'long'` mot `'short'`
 * märker ingenting förrän Adam ser det på telefonen.
 */

const ETT_DYGN_MS = 86_400_000;

function sammaDag(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/**
 * `I dag` · `I går` · `Tisdag 4 aug`.
 *
 * `nu` är injicerbar för att testet ska kunna vara det i dag är utan att
 * frysa klockan globalt.
 */
export function passdatum(iso: string, nu: Date = new Date()): string {
  const d = new Date(iso);
  if (sammaDag(d, nu)) return 'I dag';
  if (sammaDag(d, new Date(nu.getTime() - ETT_DYGN_MS))) return 'I går';

  // Veckodagen skrivs ut. Den korta formen (`tis`) valdes när datumet delade
  // rad med tre tal; i §3.2 har raden bara längden till höger om sig, och
  // veckodagen är det man minns ett pass på.
  const text = d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });

  // ⚠️ **PUNKTEN TAS BORT MED FLIT.** `sv-SE` skriver `4 aug.` men `4 mars`,
  // `4 maj`, `4 juni`, `4 juli` — punkt på sju månader av tolv. Kvar hade raden
  // bytt utseende beroende på årstid, vilket ser ut som ett fel och inte som en
  // språkregel.
  const utanPunkt = text.replace(/\.$/, '');
  return utanPunkt.charAt(0).toUpperCase() + utanPunkt.slice(1);
}
