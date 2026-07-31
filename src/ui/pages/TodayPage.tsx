/**
 * Vyn för aktivt pass. Fylls i fas 5 (uppgift 5.5–5.9).
 * Just nu bara skalet, så att navigeringen går att verifiera.
 */
export function TodayPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Pass</h1>
      <p className="mt-2 text-sm text-[var(--color-dim)]">
        Loggningen byggs i fas 5: aktivt pass, spökdata och fritextinmatning.
      </p>
      <p className="mt-4 text-sm text-[var(--color-dim)]">
        Parsern är redan klar och testad — den kopplas in här i uppgift 5.8.
      </p>
    </section>
  );
}
