import { test, expect, type Page } from '@playwright/test';
import {
  avslutaPass,
  hämtaÖvning,
  justeringsarket,
  loggaSetGenomAppen,
  läggTillÖvning,
  startaPass,
  talknapp,
} from './hjalpare';

/**
 * KONTRASTVAKTEN. Uppgift 12.36.
 *
 * ⚠️ **DEN HÄR MÄTNINGEN HAR REDAN HITTAT SJU FEL SOM INGEN ANNAN GRIND FÄLLDE**
 * — fyra i steg 4.1 och tre i steg 4.2 — och fram till nu har den bara funnits
 * som ett skript någon skrev för hand i en webbläsarpanel och som dog med
 * sessionen. Det är hela skälet till att filen finns: metoden var beprövad och
 * ändå omöjlig att köra igen utan att först återuppfinna den.
 *
 * **Felklassen den fångar syns inte i ett diff.** Steg 4.1 bytte appen från ett
 * mörkt till ett ljust tema. Fyra rader som var korrekta före bytet blev fel
 * efter, utan att en enda av dem ändrades — det var *tokens innebörd* som
 * ändrades under dem. Typecheck, lint, enhetstester, bygge och e2e var gröna
 * hela tiden. Bara en mätning i den renderade DOM:en såg det.
 *
 * ---
 *
 * ## Metoden: låt webbläsaren göra färgmatten
 *
 * ⛔ **TOLKA ALDRIG EN FÄRGSTRÄNG SJÄLV.** Första versionen av skriptet i steg
 * 4.2 gjorde det, med en RGB-regex, och läste `oklab(0.94 0.001 0.014 / 0.4)`
 * som rött = 0,94. Den rapporterade **tre falska fel** på kolumnrubrikerna. Hade
 * de "fixats" hade korrekta rader ändrats för att blidka ett trasigt mätverktyg.
 *
 * Det är inte hypotetiskt här: Tailwind 4 skriver ut opacitet som
 * `color-mix(in oklab, …)`, och `index.css` räknar fram `--color-accent-soft`
 * med `color-mix`. Appens faktiska datorstilar ÄR moderna färgrymder.
 *
 * **I stället:** en 1×1-canvas. Sätt en känd bottenfärg, måla lagren ovanpå i
 * tur och ordning, läs pixeln. Då hanteras alfa, `oklab`, `color-mix` och allt
 * annat CSS kan hitta på — av webbläsaren, som per definition tolkar sina egna
 * färger rätt. Vi läser bara ut tre heltal på slutet. Ingen färgsträng tolkas
 * någonstans i den här filen, inte ens för att avgöra om något är genomskinligt.
 *
 * **Mätningen kontrollerar sig själv.** En färgsträng som canvas inte förstår
 * lämnar `fillStyle` orörd i stället för att kasta — alltså hade vi mätt
 * föregående färg utan att veta om det, vilket är exakt samma tysta lögn som
 * regexen var. `tolkbar()` nedan sätter två olika sentinelvärden och kräver
 * samma svar från båda. Faller en framtida färgfunktion utanför webbläsarens
 * stöd rapporteras elementet som **omätbart** i stället för att gissas på.
 *
 * ---
 *
 * ## Varför e2e och inte ett skript
 *
 * Samma val som `tabular-nums` i `index.css`: **strukturellt i stället för
 * ihågkommet.** `no-horizontal-overflow.spec.ts` är syskonet — den går också
 * igenom varje element på varje rutt och mäter något som annars bara upptäcks
 * av ett öga som råkar titta.
 *
 * Vakten körs på alla tre viewportbredder, precis som syskonet. Kontrast är i
 * praktiken breddoberoende i den här appen, så två av tre körningar är i dag
 * dubbelarbete — avsiktligt: det kostar nästan ingenting när sviten kör
 * parallellt, och dagen någon lägger in en responsiv regel som byter färg är
 * det skillnaden mellan att fånga det och att inte göra det.
 */

/* ------------------------------------------------------------------ *
 * Undantagslistan                                                     *
 * ------------------------------------------------------------------ */

/**
 * ⚠️ **ETT TYST UNDANTAG ÄR SAMMA SORTS LÖGN SOM EN TYST GRÖN VAKT.**
 *
 * Därför finns **ingen** annan väg förbi mätningen än den här listan — inga
 * `continue` med en ursäktande kommentar nere i koden, inga hårdkodade
 * selektorer. Faller vakten på något är svaret **antingen en rättad färg eller
 * en ny rad här med sitt skäl utskrivet**. Aldrig en höjd tröskel.
 *
 * Sista testet i filen faller om en post slutar träffa något. En kvarglömd post
 * är en ursäkt ingen längre kan motivera, och den döljer nästa fel.
 */
interface Undantag {
  /** CSS-selektor elementet måste matcha. */
  selektor: string;
  /** Vilken sorts fynd posten ursäktar. */
  sort: 'text' | 'kant';
  /**
   * Valfri extra begränsning: undantaget gäller bara om färgen som mäts är
   * exakt den här CSS-variabeln, upplöst ur `:root` och jämförd som **målad
   * pixel** — inte som sträng. Utan den skulle en selektorbaserad post ursäkta
   * varenda kant på varje element den träffar, oavsett vilken token som målat
   * den, och det är alldeles för trubbigt.
   */
  variabel?: string;
  /**
   * Gäller bara kanter, och bara när elementet har en synlig kant på **exakt en
   * sida**.
   *
   * Det är en strukturell skillnad och inte en smakbedömning: en kontur runt en
   * komponent har fyra sidor. En ensam `border-t` kan per definition inte rita
   * en komponents gräns — den skiljer två rader åt. 1.4.11 kräver 3:1 för det
   * som *identifierar* en komponent, och en avdelare gör inte det.
   */
  endastEnKantsida?: true;
  /** Varför det är rätt att inte mäta detta. Skrivs ut när listan granskas. */
  skäl: string;
}

/**
 * **Roller vars innebörd ÄR "det här är inte en kontroll" — 12.52.**
 *
 * Undantaget för dekorativa kanter gäller allt utom kontroller, och listan nedan
 * är den enda plats där ett `role` ändå får läsas som dekoration. Den är skriven
 * som ett **negativt** urval med flit: en roll som inte står här behandlas som en
 * kontroll, så en ARIA-roll ingen tänkt på faller åt det håll som ger ett rött
 * fynd i stället för en tyst grön mätning. Det var precis motsatsen som gjorde
 * att steg 4.3:s `fieldset` slank igenom.
 *
 * Tre sorter, alla med samma egenskap: de identifierar inget man kan använda.
 * **Dekoration** (`presentation`, `none`), **utgångar** som skriver text till
 * användaren (`status`, `alert`, `log`, `timer`, `marquee`) och **innehåll**
 * (`img`, `note`, `tooltip`, `figure`, `separator`).
 *
 * ⚠️ `timer` står här efter en mätning, inte i förväg: vilotimerns kort
 * (`RestTimer.tsx`) föll som fynd när regeln först skrevs utan listan. Kortet är
 * en yta med knappar inuti — knapparna identifieras av sina egna etiketter, och
 * kortkanten ritar ingen kontroll.
 */
const ICKE_KONTROLLROLLER = [
  'presentation',
  'none',
  'img',
  'note',
  'tooltip',
  'figure',
  'separator',
  'status',
  'alert',
  'log',
  'timer',
  'marquee',
];

/**
 * Vad som räknas som en kontroll. Taggnamnen är de element som är interaktiva
 * **utan** att behöva ett `role`; allt annat avgörs av rollen.
 */
const KONTROLL =
  'button, input, select, textarea, a, fieldset, label, details, summary, ' +
  `[role]:not(${ICKE_KONTROLLROLLER.map((r) => `[role="${r}"]`).join(', ')})`;

const UNDANTAG: Undantag[] = [
  {
    selektor: ':disabled, [aria-disabled="true"]',
    sort: 'text',
    skäl:
      'WCAG 1.4.3 undantar uttryckligen inaktiva kontroller från kontrastkravet, och ' +
      'appen dämpar dem med disabled:opacity-40/50 just för att de ska läsa som ' +
      'otillgängliga. Att kräva 4,5:1 här hade tvingat fram en dämpning som inte syns, ' +
      'vilket är sämre för användaren än fyndet.',
  },
  // ✏️ HÄR LÅG EN ANDRA :disabled-POST, för kanter. Den togs bort samma dag den
  // skrevs, eftersom staleness-testet nedan fällde den direkt: ingen av de fyra
  // lägena har en inaktiv kontroll med synlig kant. Posten var alltså en ursäkt
  // för ett fall som inte finns, och den hade tystat en riktig kant den dagen
  // någon lade till en. Behövs den igen skrivs den tillbaka med sitt skäl —
  // det är precis den rörelsen listan finns för.
  {
    // ⚠️ SELEKTORN UNDANTAR MED FLIT INTE KONTROLLER. Steg 4.1:s värsta fynd var
    // "tre kontroller med --color-line som enda avgränsning", uppmätta till
    // 1,01:1 mot papperet — alltså osynliga tryckytor. En kontroll vars enda
    // gräns är den dekorativa tokenen ska fällas, inte ursäktas. Därför räknas
    // knappar, fält och länkar bort ur undantaget.
    //
    // 🔴 **HÅLET SOM GAV REGELN NEDAN.** Steg 4.3 del C byggde segmentkontrollen
    // som en `<fieldset>` med radioknappar — och en `--color-line`-kant på den
    // gick **grön**, eftersom `fieldset` inte stod i listan och därmed lästes som
    // dekoration. Kontrollens kant är det enda som skiljer den från papperet
    // (1,09:1), så vakten hade tystat exakt den felklass den byggdes för.
    // **Rutorna inuti är `sr-only`, så det är gruppen som ÄR kontrollen visuellt.**
    //
    // 🔴 **DÄRFÖR RÄKNAR RADEN INTE LÄNGRE UPP ROLLER — 12.52.** Först stod fyra
    // enskilda (`button`, `link`, `group`, `radiogroup`), och då ärvde varje roll
    // utanför listan samma hål: `tablist`, `switch`, `tab`. Urvalet är vänt nu —
    // se `KONTROLL` och `ICKE_KONTROLLROLLER` ovan.
    //
    // ⚠️ Vaktas av testet **"en författardeklarerad roll ursäktas inte som
    // dekoration"** sist i filen, som var rött mot den gamla uppräkningen.
    selektor: `:not(${KONTROLL})`,
    sort: 'kant',
    variabel: '--color-line',
    skäl:
      'Dekorativa avdelare. index.css definierar --color-line som dekorativ ("en ' +
      'dekorativ linje ska inte konkurrera med kortkanten") och en avdelare mellan två ' +
      'rader bär ingen betydelse — 1.4.11 gäller det som IDENTIFIERAR en komponent. ' +
      'Kontroller är undantagna från undantaget; se kommentaren ovan raden.',
  },
  {
    // Uppmätt, inte antaget: den här posten skrevs efter att kontrollerna redan
    // bytt till --color-line-strong och "+ Lägg till set" blev en tung regel
    // tvärs över övningskortet. Linjen skiljer knappraden från setraderna ovan
    // och har samma roll som avdelarna mellan dem — den ritar ingen knapp.
    selektor: 'button, [role="button"]',
    sort: 'kant',
    variabel: '--color-line',
    endastEnKantsida: true,
    skäl:
      'Enkantad avdelare på en helbred rad inuti ett kort ("+ Lägg till set"). Raden ' +
      'identifieras av sin etikett och sin plats i kortets radlista, inte av linjen — ' +
      'och en kontur har fyra sidor. Att måla den i --color-line-strong gjorde den till ' +
      'en tyngre regel än setradernas egna avdelare, alltså SÄMRE läsbarhet av en ' +
      'bokstavstrogen tillämpning av 1.4.11.',
  },
];

/* ------------------------------------------------------------------ *
 * Mätningen                                                           *
 * ------------------------------------------------------------------ */

interface Fynd {
  sort: 'text' | 'kant' | 'omätbar';
  element: string;
  detalj: string;
  kvot: number | null;
  krav: number | null;
}

interface Mätresultat {
  fynd: Fynd[];
  /** Hur många element varje undantagspost träffade. Index följer UNDANTAG. */
  undantagsträffar: number[];
  /**
   * Antal mätningar per sort.
   *
   * ⚠️ **DE ÄR SÄRADE MED FLIT, OCH DET ÄR EN RÄTTELSE PÅ MIG SJÄLV.** Första
   * versionen räknade ett enda `mätta`, och eftersom kantvägen ger utslag på
   * varje sida hade den räknaren stått långt över noll även om textvägen aldrig
   * kört en enda mätning. Vakten hade då varit grön på text utan att mäta text
   * — exakt den klass av tyst grön vakt som 12.37 handlar om, byggd in i det
   * verktyg som finns för att hitta den.
   */
  mätta: { text: number; kant: number };
  /**
   * Element inuti en överlagring vars underlag kommer **utifrån** överlagringen.
   * Tom lista när `överlagring` inte skickats med.
   *
   * ⚠️ **12.41:s egentliga fråga.** `bakgrundslager()` går uppåt genom
   * FÖRFÄDERSKEDJAN, inte genom det som råkar ligga bakom på skärmen. Ett ark
   * ligger ovanpå passet: så länge arket har en egen ogenomskinlig bakgrund
   * stannar vandringen där och modellen beskriver vad ögat ser. Gör den inte
   * det, går vandringen förbi dimmern (som är genomskinlig) hela vägen upp till
   * `body` och rapporterar **papperet** som underlag — trots att det som syns är
   * en nedtonad passvy. Det är ett tal vakten inte kan stå för, och då är rätt
   * svar att säga *omätbart* i stället för att gissa.
   */
  underlagUtanför: string[];
}

/**
 * Kör mätningen i sidans egen kontext.
 *
 * Allt inuti `evaluate` körs i webbläsaren, inte i Node — det är enda sättet att
 * komma åt datorstilar och en riktig canvas.
 *
 * `överlagring` är en selektor för ett ark eller en dialog. Skickas den med
 * kontrolleras varje mätt element inuti den mot `underlagUtanför` ovan.
 */
async function mätSidan(
  page: Page,
  undantag: Undantag[],
  överlagring?: string
): Promise<Mätresultat> {
  return page.evaluate(([undantag, överlagring]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('ingen 2d-kontext — mätningen kan inte göras');

    /**
     * Sant om canvas förstår färgsträngen.
     *
     * En avvisad tilldelning lämnar `fillStyle` orörd i stället för att kasta.
     * Två olika sentinelvärden avslöjar det: förstås strängen svarar båda
     * försöken samma sak, annars ligger sentinelerna kvar och skiljer sig.
     */
    const tolkbarCache = new Map<string, boolean>();
    const tolkbar = (färg: string): boolean => {
      const träff = tolkbarCache.get(färg);
      if (träff !== undefined) return träff;
      ctx.fillStyle = '#000000';
      ctx.fillStyle = färg;
      const första = ctx.fillStyle;
      ctx.fillStyle = '#ffffff';
      ctx.fillStyle = färg;
      const svar = första === ctx.fillStyle;
      tolkbarCache.set(färg, svar);
      return svar;
    };

    /** Målar lagren i tur och ordning på en 1×1-yta och läser ut pixeln. */
    const målaCache = new Map<string, [number, number, number]>();
    const måla = (lager: string[]): [number, number, number] => {
      const nyckel = lager.join('|');
      const träff = målaCache.get(nyckel);
      if (träff) return träff;
      ctx.clearRect(0, 0, 1, 1);
      for (const färg of lager) {
        ctx.fillStyle = färg;
        ctx.fillRect(0, 0, 1, 1);
      }
      const d = ctx.getImageData(0, 0, 1, 1).data;
      const pixel: [number, number, number] = [d[0]!, d[1]!, d[2]!];
      målaCache.set(nyckel, pixel);
      return pixel;
    };

    const lika = (a: [number, number, number], b: [number, number, number]) =>
      a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

    /**
     * Ogenomskinlighet avgörs genom att måla färgen på svart OCH på vitt.
     * Blir pixeln densamma släpper inget underlag igenom; blir den svart
     * respektive vit målades ingenting alls. Ingen alfa-sträng tolkas.
     */
    const ogenomskinlig = (färg: string) =>
      lika(måla(['#000000', färg]), måla(['#ffffff', färg]));
    const heltGenomskinlig = (färg: string) =>
      lika(måla(['#000000', färg]), [0, 0, 0]) && lika(måla(['#ffffff', färg]), [255, 255, 255]);

    const luminans = ([r, g, b]: [number, number, number]): number => {
      const kanal = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
    };

    const kvot = (a: [number, number, number], b: [number, number, number]): number => {
      const la = luminans(a);
      const lb = luminans(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };

    const beskriv = (el: Element): string => {
      const klass =
        typeof el.className === 'string' && el.className.trim()
          ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
          : '';
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
      return `${el.tagName.toLowerCase()}${klass}${text ? ` "${text}"` : ''}`;
    };

    /** Tokens värde ur `:root`, målat till en pixel för jämförelse. */
    const rot = getComputedStyle(document.documentElement);
    const variabelPixel = (namn: string): [number, number, number] | null => {
      const värde = rot.getPropertyValue(namn).trim();
      if (!värde || !tolkbar(värde)) return null;
      return måla(['#ffffff', värde]);
    };

    const fynd: Fynd[] = [];
    const undantagsträffar = undantag.map(() => 0);
    const mätta = { text: 0, kant: 0 };

    /**
     * Sant om elementet är ursäktat för den här sortens fynd i den här färgen.
     * Räknar träffen så att staleness-testet kan se vilka poster som lever.
     */
    const ursäktad = (
      el: Element,
      sort: 'text' | 'kant',
      färg: string,
      kantsidor = 0
    ): boolean => {
      let träff = false;
      undantag.forEach((post, i) => {
        if (post.sort !== sort) return;
        if (!el.matches(post.selektor)) return;
        if (post.endastEnKantsida && kantsidor !== 1) return;
        if (post.variabel) {
          const token = variabelPixel(post.variabel);
          if (!token || !lika(token, måla(['#ffffff', färg]))) return;
        }
        undantagsträffar[i]!++;
        träff = true;
      });
      return träff;
    };

    /**
     * Bakgrundslagren under ett element, ytterst först.
     *
     * Vandringen slutar vid första helt ogenomskinliga bakgrunden — inget under
     * den kan påverka pixeln. `hinder` samlar det som gör den här enkla
     * lagerstapeln ogiltig i stället för att tiga om det: en gradient, ett
     * genomskinligt förfäderslager eller ett blandningsläge betyder att modellen
     * inte längre beskriver vad ögat ser, och då ska vakten säga det i klartext
     * i stället för att rapportera ett tal den inte kan stå för.
     */
    const lagerCache = new Map<Element, { lager: string[]; hinder: string[] }>();
    const bakgrundslager = (start: Element | null): { lager: string[]; hinder: string[] } => {
      if (!start) return { lager: ['#ffffff'], hinder: [] };
      const träff = lagerCache.get(start);
      if (träff) return träff;

      const s = getComputedStyle(start);
      const hinder: string[] = [];
      if (s.backgroundImage !== 'none') hinder.push(`bakgrundsbild på ${beskriv(start)}`);
      if (s.opacity !== '1') hinder.push(`opacity ${s.opacity} på ${beskriv(start)}`);
      if (s.mixBlendMode !== 'normal') hinder.push(`mix-blend-mode på ${beskriv(start)}`);
      if (s.filter !== 'none') hinder.push(`filter på ${beskriv(start)}`);

      const bg = s.backgroundColor;
      let svar: { lager: string[]; hinder: string[] };
      if (!tolkbar(bg)) {
        hinder.push(`otolkbar bakgrundsfärg "${bg}" på ${beskriv(start)}`);
        svar = { lager: ['#ffffff'], hinder };
      } else if (ogenomskinlig(bg)) {
        // Inget under kan påverka pixeln. Webbläsarens egen duk läggs underst
        // ändå, så stapeln alltid har en definierad botten.
        svar = { lager: ['#ffffff', bg], hinder };
      } else {
        const under = bakgrundslager(start.parentElement);
        svar = { lager: [...under.lager, bg], hinder: [...under.hinder, ...hinder] };
      }
      lagerCache.set(start, svar);
      return svar;
    };

    /**
     * Elementet självt eller närmaste förfader med ogenomskinlig bakgrund —
     * alltså där `bakgrundslager()` slutar vandra. Returnerar `null` när ingen
     * finns, vilket inte kan hända i den här appen men inte får antas.
     */
    const stoppelement = (start: Element): Element | null => {
      for (let el: Element | null = start; el; el = el.parentElement) {
        const bg = getComputedStyle(el).backgroundColor;
        if (tolkbar(bg) && ogenomskinlig(bg)) return el;
      }
      return null;
    };

    const överlagringsrot = överlagring === null ? null : document.querySelector(överlagring);
    const underlagUtanför: string[] = [];
    // En selektor som inte träffar något är en tyst grön mätning av ingenting,
    // och den ska säga ifrån i samma lista som riktiga fynd.
    if (överlagring !== null && överlagringsrot === null) {
      underlagUtanför.push(`ingen överlagring matchade selektorn "${överlagring}"`);
    }

    /** Sant om elementet har egen text, inte bara ärvd från sina barn. */
    const harEgenText = (el: Element): boolean => {
      for (const nod of el.childNodes) {
        if (nod.nodeType === Node.TEXT_NODE && (nod.textContent ?? '').trim() !== '') return true;
      }
      return false;
    };

    const sidor = ['top', 'right', 'bottom', 'left'] as const;

    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const eget = bakgrundslager(el);
      const förälder = bakgrundslager(el.parentElement);

      // ----------------------------------------------------------- text
      if (harEgenText(el) && !ursäktad(el, 'text', s.color)) {
        if (eget.hinder.length > 0) {
          fynd.push({
            sort: 'omätbar',
            element: beskriv(el),
            detalj: eget.hinder.join('; '),
            kvot: null,
            krav: null,
          });
        } else if (!tolkbar(s.color)) {
          fynd.push({
            sort: 'omätbar',
            element: beskriv(el),
            detalj: `canvas förstår inte textfärgen "${s.color}"`,
            kvot: null,
            krav: null,
          });
        } else {
          const bak = måla(eget.lager);
          const fram = måla([...eget.lager, s.color]);
          const px = parseFloat(s.fontSize);
          // WCAG:s "stor text": 18 pt (24 px), eller 14 pt (18,66 px) i fet
          // stil. Fetstilsklausulen står utskriven här och inte gömd i ett tal,
          // eftersom det är den enda plats i hela filen där kravet SÄNKS.
          const fet = Number(s.fontWeight) >= 700;
          const krav = px >= 24 || (fet && px >= 18.66) ? 3 : 4.5;
          const k = kvot(fram, bak);
          mätta.text++;
          if (k < krav) {
            fynd.push({
              sort: 'text',
              element: beskriv(el),
              detalj: `${s.color} på rgb(${bak.join(', ')}), ${px} px${fet ? ' fet' : ''}`,
              kvot: k,
              krav,
            });
          }
        }
      }

      // --------------------------------------------------------- kanter
      // Färgerna dedupliceras: fyra sidor i samma färg är en kant att mäta, men
      // en enskild avvikande sida (t.ex. bara border-bottom) får INTE tappas —
      // det var buggen i första utkastet, som bröt efter första sidan.
      const mättaFärger = new Set<string>();
      const synligKant = (sida: (typeof sidor)[number]) => {
        const bredd = parseFloat(s.getPropertyValue(`border-${sida}-width`));
        const stil = s.getPropertyValue(`border-${sida}-style`);
        return bredd > 0 && stil !== 'none' && stil !== 'hidden';
      };
      // Antalet sidor avgör om kanten kan vara en kontur alls — se
      // `endastEnKantsida` i undantagslistan.
      const kantsidor = sidor.filter(synligKant).length;

      // ------------------------------------------- överlagringens underlag
      // Prövas bara på element som FAKTISKT MÄTS. Dimmern bakom ett ark har
      // varken text eller kant och hämtar sitt underlag ur sidan bakom — vilket
      // är helt riktigt för just den, och hade blivit ett falskt larm om varje
      // element inuti roten prövades.
      if (överlagringsrot !== null && överlagringsrot.contains(el) && (harEgenText(el) || kantsidor > 0)) {
        const stopp = stoppelement(el);
        if (stopp === null || !överlagringsrot.contains(stopp)) {
          underlagUtanför.push(
            `${beskriv(el)} — underlaget kommer från ${stopp === null ? 'ingenstans' : beskriv(stopp)}`
          );
        }
      }

      for (const sida of sidor) {
        const färg = s.getPropertyValue(`border-${sida}-color`);
        if (!synligKant(sida)) continue;
        if (mättaFärger.has(färg)) continue;
        mättaFärger.add(färg);

        if (!tolkbar(färg)) {
          fynd.push({
            sort: 'omätbar',
            element: beskriv(el),
            detalj: `canvas förstår inte kantfärgen "${färg}"`,
            kvot: null,
            krav: null,
          });
          continue;
        }
        // En helt genomskinlig kant målar ingenting och kan inte bära betydelse.
        if (heltGenomskinlig(färg)) continue;
        if (ursäktad(el, 'kant', färg, kantsidor)) continue;

        if (eget.hinder.length > 0 || förälder.hinder.length > 0) {
          fynd.push({
            sort: 'omätbar',
            element: beskriv(el),
            detalj: [...new Set([...eget.hinder, ...förälder.hinder])].join('; '),
            kvot: null,
            krav: null,
          });
          continue;
        }

        // Kantpixeln ligger ovanpå elementets egen bakgrund (background-clip är
        // border-box som förval). Utanför den ligger förälderns underlag.
        const kant = måla([...eget.lager, färg]);
        const inåt = kvot(kant, måla(eget.lager));
        const utåt = kvot(kant, måla(förälder.lager));
        mätta.kant++;
        // BÅDA sidor, inte den bästa av två. Det är projektets egen läsning av
        // 1.4.11, och den är redan tillämpad i koden: RestTimer.tsx underkänner
        // --color-ok-line just för att den mäter 2,99:1 på den sida som vetter
        // utåt, trots att insidan klarar sig.
        const sämst = Math.min(inåt, utåt);
        if (sämst < 3) {
          fynd.push({
            sort: 'kant',
            element: beskriv(el),
            detalj: `border-${sida} ${färg} — inåt ${inåt.toFixed(2)}, utåt ${utåt.toFixed(2)}`,
            kvot: sämst,
            krav: 3,
          });
        }
      }
    }

    return { fynd, undantagsträffar, mätta, underlagUtanför };
  }, [undantag, överlagring ?? null] as [Undantag[], string | null]);
}

/** Gör fyndlistan läsbar i terminalen. */
function rapport(fynd: Fynd[]): string {
  return fynd
    .map((f) =>
      f.kvot === null
        ? `  [omätbar] ${f.element}\n      ${f.detalj}`
        : `  [${f.sort}] ${f.element}\n      ${f.detalj}\n      ${f.kvot.toFixed(2)}:1, kräver ${f.krav}:1`
    )
    .join('\n');
}

/* ------------------------------------------------------------------ *
 * Lägena som mäts                                                     *
 * ------------------------------------------------------------------ */

/**
 * ⚠️ **Ett tomt Idag mäter nästan ingenting.** Hela den semantiska paletten —
 * bekräftad rad, snittal, vilotimer — finns bara när ett pass pågår, och det är
 * där steg 4.1:s och 4.2:s fel satt. Andra läget nedan är därför det som bär
 * vakten; de tre rutterna är billiga tillägg.
 */
interface Läge {
  namn: string;
  förbered: (page: Page) => Promise<void>;
  /**
   * Selektor för en överlagring som ligger öppen när mätningen körs. Sätts den
   * kontrolleras också att arkets innehåll får sitt underlag ur arket — se
   * `underlagUtanför` i `Mätresultat`.
   */
  överlagring?: string;
}

const LÄGEN: Läge[] = [
  {
    namn: 'Idag utan pågående pass',
    förbered: async (page: Page) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    },
  },
  {
    namn: 'Idag med pågående pass och en bekräftad rad',
    förbered: async (page: Page) => {
      await page.goto('/');
      const övning = await hämtaÖvning(page);
      await startaPass(page);
      await läggTillÖvning(page, övning.name);
      // Bekräftelsen startar också vilotimern (TodayPage.tsx:131), så chipet som
      // steg 4.2 del C byggde om kommer med utan att mätningen behöver egna steg.
      await loggaSetGenomAppen(page, övning.name);
    },
  },
  {
    // ⚠️ **HISTORIK MÄTS MED INNEHÅLL, OCH DET ÄR EN RÄTTELSE UNDER BYGGET.**
    // Första versionen gick rakt till `/historik` på en tom databas och mätte
    // därmed en tomstatusruta och en flikrad — alltså grön av fel skäl, precis
    // den felklass hela filen finns för. Passlistan, dess datum, volymtal och
    // radavdelare fanns inte i urvalet över huvud taget.
    //
    // Passet loggas GENOM APPEN och inte rått, enligt beslut 6 i 11B.0e — samma
    // skäl som i `historiksida.spec.ts`: en fixtur mäter sig själv.
    namn: 'Historik med ett loggat pass',
    förbered: async (page: Page) => {
      await page.goto('/');
      const övning = await hämtaÖvning(page);
      await startaPass(page);
      await läggTillÖvning(page, övning.name);
      await loggaSetGenomAppen(page, övning.name);
      await avslutaPass(page);
      await page.goto('/historik');
      await page.waitForLoadState('networkidle');
      // Mätningen får inte köra mot ett tomt skal. Utan den här väntan är
      // urvalet en kapplöpning mot useLiveQuery.
      await expect(page.getByText('Inga pass ännu.')).toHaveCount(0);
    },
  },
  {
    // ⚠️ **FEMTE LÄGET, tillagt i steg 4.3 del C.** Segmentkontrollen ligger
    // DIREKT PÅ PAPPERET med en kant som identifierar en kontroll, och det är
    // Historiks första riktiga kant — kommentaren längre ner om att skärmens
    // kanträknare är legitimt noll gäller alltså inte det här läget.
    //
    // ⚠️ **Kanten är NEUTRAL (`--color-line-strong`), inte semantisk.** Den är
    // därför inte `12.40`:s andra fall: den uppgiften frågar om semantiska
    // ytor — ok/varning — utanför ett kort. Se noteringen i 12.40.
    //
    // Den tomma statistikvyn mäts på köpet. Den försvinner i 4.4, men tills
    // dess är den en sida användaren kan stå på.
    namn: 'Historik → Statistik',
    förbered: async (page: Page) => {
      await page.goto('/historik?vy=statistik');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/Statistik byggs härnäst/)).toBeVisible();
    },
  },
  {
    namn: 'Inställningar',
    förbered: async (page: Page) => {
      await page.goto('/installningar');
      await page.waitForLoadState('networkidle');
    },
  },

  /* ------------------------------------------------------------------ *
   * 12.41: rutten och de tre överlagringarna                            *
   * ------------------------------------------------------------------ */

  {
    // ⚠️ **Den allvarligaste av 12.41:s fyra luckor, och den enda som inte är en
    // överlagring.** `/ovning/:id` är en vanlig sida vem som helst når från
    // historiken — den stod bara inte i den här listan.
    namn: 'Övningssidan',
    förbered: async (page: Page) => {
      await page.goto('/');
      const övning = await hämtaÖvning(page);
      await page.goto(`/ovning/${övning.id}`);
      // Sidan mäts utan seedad historik: korten för tyngsta set och bästa e1RM
      // visar då sina tomlägen, vilket är det tillstånd en ny användare möter.
      await expect(page.getByRole('heading', { name: övning.name, level: 1 })).toBeVisible();
    },
  },
  {
    namn: 'Justeringsarket öppet',
    förbered: async (page: Page) => {
      await page.goto('/');
      const övning = await hämtaÖvning(page);
      await startaPass(page);
      await läggTillÖvning(page, övning.name);
      await talknapp(page, övning.name, 'vikt').click();
      await expect(justeringsarket(page, övning.name)).toBeVisible();
    },
    överlagring: '[role="dialog"]',
  },
  {
    namn: 'Övningsväljaren öppen',
    förbered: async (page: Page) => {
      await page.goto('/');
      await startaPass(page);
      await page.getByRole('button', { name: '+ Lägg till övning' }).click();
      const väljaren = page.getByRole('dialog', { name: 'Lägg till övning' });
      await expect(väljaren).toBeVisible();
      // Listan mäts med innehåll. Samma skäl som Historik-läget ovan: en tom
      // dialog hade mätt sitt eget skal och gått grön av fel anledning.
      await expect(väljaren.getByRole('button').nth(1)).toBeVisible();
    },
    överlagring: '[role="dialog"]',
  },
  {
    // ⚠️ **`ManualEntry.tsx` mäts INTE, och det är inte en lucka i vakten.**
    // 12.41 namnger den som en del av fritextinmatningen, men komponenten
    // importeras ingenstans i `src/` — den renderas alltså aldrig och kan inte
    // mätas. Se **12.53**. Fritexten på skärmen är `QuickLog`.
    namn: 'Fritexten utfälld',
    förbered: async (page: Page) => {
      await page.goto('/');
      await startaPass(page);
      await page.getByRole('button', { name: /Skriv i stället/ }).click();
      await expect(page.getByRole('textbox', { name: 'Logga ett set med fritext' })).toBeVisible();
    },
  },
];

/* ------------------------------------------------------------------ *
 * Vakterna                                                            *
 * ------------------------------------------------------------------ */

for (const läge of LÄGEN) {
  test(`${läge.namn} håller kontrastkraven`, async ({ page }) => {
    await läge.förbered(page);
    const resultat = await mätSidan(page, UNDANTAG, läge.överlagring);

    // 12.41: lagermodellen ska ha kontrollerats, inte antagits, för de lägen som
    // är överlagringar. Faller den här är svaret INTE en justerad färg — det är
    // att elementen ska rapporteras som omätbara.
    expect(
      resultat.underlagUtanför,
      `${läge.namn}: lagermodellen beskriver inte det ögat ser.\n` +
        resultat.underlagUtanför.map((rad) => `  ${rad}`).join('\n')
    ).toEqual([]);

    // Utan den här raden vore ett tomt urval en grön vakt. Se HANDOFF.md: två av
    // steg 4.2:s tre fynd var vakter som såg ut att mäta och inte gjorde det.
    //
    // ⚠️ **Bara text kontrolleras per läge, och det är uppmätt och inte antaget.**
    // Kanträknaren är legitimt noll på Idag-utan-pass och Historik: deras enda
    // kanter är dekorativa avdelare, som undantaget plockar bort innan mätningen.
    // Att kräva kanter här hade gett ett rött test utan ett fel bakom sig. Att
    // kantvägen ändå lever bevisas samlat i sista testet.
    expect(resultat.mätta.text, `${läge.namn}: inga TEXTelement mättes`).toBeGreaterThan(0);

    expect(
      resultat.fynd,
      `${läge.namn} — ${resultat.fynd.length} fynd:\n${rapport(resultat.fynd)}`
    ).toEqual([]);
  });
}

/**
 * ⚠️ **EGEN KONTEXT PER LÄGE, OCH DET ÄR UPPMÄTT OCH INTE FÖRSIKTIGHET.**
 * Lägena är ordningsberoende: *Idag med pågående pass* lämnar ett pass igång i
 * IndexedDB, och nästa läge hittade då ingen `Starta tomt pass`-knapp och föll
 * på en timeout. Testerna ovan får en ny kontext var av Playwright automatiskt;
 * den här loopen måste be om det själv.
 */
test('kantvägen lever och varje undantag träffar fortfarande något', async ({
  browser,
  contextOptions,
}) => {
  const summa = UNDANTAG.map(() => 0);
  let kanter = 0;

  for (const läge of LÄGEN) {
    // `contextOptions` och inte tomma defaults: `browser.newContext()` ärver
    // INTE projektets `use`-block, så baseURL och viewport hade fallit bort och
    // `goto('/')` misslyckats på en annan bredd än den vi tror oss mäta.
    const kontext = await browser.newContext(contextOptions);
    const sida = await kontext.newPage();
    try {
      await läge.förbered(sida);
      const resultat = await mätSidan(sida, UNDANTAG);
      kanter += resultat.mätta.kant;
      resultat.undantagsträffar.forEach((n, i) => {
        summa[i]! += n;
      });
    } finally {
      await kontext.close();
    }
  }

  // Kantvägens motsvarighet till textkontrollen per läge. Ligger samlat här
  // eftersom enskilda lägen legitimt saknar mätbara kanter — se kommentaren i
  // testet ovan. Blir den här noll mäter vakten inga kanter alls någonstans,
  // och då är halva filen tyst grön.
  expect(kanter, 'inga kanter mättes i något läge — kantvägen är död').toBeGreaterThan(0);

  const oanvända = UNDANTAG.filter((_, i) => summa[i] === 0);
  expect(
    oanvända,
    `Undantag som inte längre träffar något element:\n${oanvända
      .map((u) => `  ${u.sort} ${u.variabel ?? ''} ${u.selektor}\n      ${u.skäl}`)
      .join('\n')}\n\n` +
      'En kvarglömd post är en ursäkt ingen längre kan motivera, och den döljer nästa fel. ' +
      'Ta bort den.'
  ).toEqual([]);
});

/**
 * **VAKT FÖR VAKTEN. Uppgift 12.52.**
 *
 * Testerna ovan mäter appen som den ser ut i dag. Det här testet mäter i stället
 * *undantagets räckvidd*, och det gör det på element som inte finns i appen —
 * för att frågan gäller kontrollen som byggs i morgon.
 *
 * 🔴 **Skälet är ett faktiskt missat fel.** Steg 4.3 del C byggde
 * segmentkontrollen som en `<fieldset>`, och dess 1,09:1-kant gick grön: taggen
 * stod inte i undantagets kontrollista och lästes som dekoration. Den luckan
 * hittades av ett sabotage, inte av vakten. Varje roll som inte råkar stå i
 * listan ärvde samma lucka — och det är den ärvningen som mäts här.
 *
 * ⚠️ **Elementen injiceras och ingår därför inte i appens egen mätning.** De
 * läggs sist i `body`, ovanpå papperet, och tas bort med sidan när testet slutar.
 */
test('en författardeklarerad roll ursäktas inte som dekoration', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => {
    const lägg = (tagg: string, klass: string, roll: string | null) => {
      const el = document.createElement(tagg);
      el.className = klass;
      if (roll !== null) el.setAttribute('role', roll);
      // `--color-line` och inget annat: det är den token undantaget gäller, och
      // en hårdkodad färg hade mätt något annat än regeln.
      el.style.cssText = 'width:120px;height:24px;border:1px solid var(--color-line);';
      document.body.append(el);
    };
    // `tablist` är vald för att den inte stod i den gamla uppräkningen och
    // inte heller i `ICKE_KONTROLLROLLER`. Byts den mot en roll som står i
    // någondera mäter testet ingenting.
    lägg('div', 'prov-roll', 'tablist');
    lägg('div', 'prov-utgang', 'status');
    lägg('div', 'prov-dekor', null);
    // ⚠️ **Taggnamnshalvan av `KONTROLL` mäts INTE av appen i dag, och det är
    // uppmätt:** `fieldset` togs bort ur listan som sabotage och alla lägen
    // förblev gröna. Segmentkontrollen — den kontroll raden skrevs för — bär
    // sedan lagningen `--color-line-strong`, och undantagsposten gäller bara
    // `--color-line`. Raden hade alltså blivit ovaktad utan det här elementet.
    lägg('fieldset', 'prov-fieldset', null);
  });

  const resultat = await mätSidan(page, UNDANTAG);
  const kantfynd = (klass: string) =>
    resultat.fynd.filter((f) => f.sort === 'kant' && f.element.includes(klass));

  expect(
    kantfynd('prov-roll'),
    'En `--color-line`-kant på `[role="tablist"]` ursäktades som dekoration.\n' +
      'Undantaget avgör tillhörighet på taggnamn och en handfull uppräknade roller, ' +
      'så varje kontrolltyp utanför listan ärver hålet från steg 4.3.\n' +
      `Alla fynd:\n${rapport(resultat.fynd)}`
  ).toHaveLength(1);

  // Andra halvan av påståendet, och den är inte en formalitet: en regel som
  // fäller ALLT skulle klara raden ovan och samtidigt göra undantaget dött.
  expect(
    kantfynd('prov-dekor'),
    'En kantad `div` utan roll fälldes — då är undantaget för dekorativa ' +
      'avdelare inte längre ett undantag.'
  ).toEqual([]);

  // `ICKE_KONTROLLROLLER` är den enda plats där ett `role` ändå läses som
  // dekoration, och utan den här raden kan listan tömmas utan att något test
  // säger ifrån. Den är uppmätt: vilotimerns kort (`role="timer"`) föll som
  // fynd innan listan fanns.
  expect(
    kantfynd('prov-utgang'),
    'En `--color-line`-kant på `[role="status"]` fälldes. En utgång som skriver ' +
      'text till användaren identifierar ingen kontroll, och kravet gäller det ' +
      'som IDENTIFIERAR en komponent.'
  ).toEqual([]);

  expect(
    kantfynd('prov-fieldset'),
    'En `--color-line`-kant på en `<fieldset>` ursäktades som dekoration. Det är ' +
      'steg 4.3:s ursprungliga hål, återöppnat — en kontrollgrupp vars enda ' +
      'avgränsning är den dekorativa tokenen.'
  ).toHaveLength(1);
});
