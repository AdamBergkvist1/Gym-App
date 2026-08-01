import { useLiveQuery } from 'dexie-react-hooks';
import { getParseStats } from '../db/parseLog';

/**
 * Träffsäkerheten för fritextparsningen. Uppgift 8.10–8.11.
 *
 * Frågan panelen finns för att besvara: **har AI:n rätt tillräckligt ofta för
 * att vara värd sin latens?** Utan den går modellvalet inte att grunda på annat
 * än känsla.
 *
 * Panelen säger uttryckligen ifrån när underlaget är för tunt i stället för att
 * visa en procentsats. Fyra av fyra är 100 % — och en siffra som ser ut som ett
 * resultat men inte är det är värre än ingen siffra alls.
 */

function Rad({
  namn,
  data,
  andel,
}: {
  namn: string;
  data: { total: number; accepted: number; edited: number; rejected: number };
  andel: number | null;
}) {
  if (data.total === 0) {
    return (
      <div className="flex justify-between border-b border-[var(--color-line)] py-2 text-sm last:border-b-0">
        <span>{namn}</span>
        <span className="text-[var(--color-dim)]">används inte ännu</span>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--color-line)] py-2 last:border-b-0">
      <div className="flex justify-between text-sm">
        <span>{namn}</span>
        <span className="tabular-nums">
          {andel === null ? (
            <span className="text-[var(--color-dim)]">
              {data.total} försök — för få för en siffra
            </span>
          ) : (
            <strong>{Math.round(andel * 100)} % rätt</strong>
          )}
        </span>
      </div>
      <div className="mt-1 flex gap-3 text-xs text-[var(--color-dim)] tabular-nums">
        <span>{data.accepted} godtagna</span>
        <span>{data.edited} rättade</span>
        <span>{data.rejected} slängda</span>
      </div>
    </div>
  );
}

export function ParseStats() {
  const stats = useLiveQuery(() => getParseStats(), [], null);
  if (!stats) return null;

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      {stats.total === 0 ? (
        <p className="text-sm text-[var(--color-dim)]">
          Inga fritextinmatningar loggade ännu.
        </p>
      ) : (
        <>
          <Rad namn="Lokal grammatik" data={stats.byParser.local} andel={stats.accuracy.local} />
          <Rad namn="AI-reserv" data={stats.byParser.llm} andel={stats.accuracy.llm} />
          {stats.medianLlmLatencyMs !== null && (
            <p className="mt-2 text-xs text-[var(--color-dim)] tabular-nums">
              AI:ns mediansvarstid: {stats.medianLlmLatencyMs} ms
            </p>
          )}
          <p className="mt-2 text-xs text-[var(--color-dim)]">
            &quot;Rättade&quot; betyder att parsern föreslog fel och du ändrade innan du sparade.
            Det är det måttet som säger om den blir bättre.
          </p>
        </>
      )}
    </div>
  );
}
