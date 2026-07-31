/**
 * e1RM-trend som handritad SVG. Uppgift 9.5.
 *
 * Inget grafbibliotek (PLAN.md §2.2): Recharts och uPlot är hundratals kB för
 * en enda vy, och bundlen är redan stor. Blir graferna fler och mer krävande
 * är det då ett bibliotek ska övervägas — inte innan.
 */

interface Props {
  values: number[];
  /** Höjd i px. Bredden anpassar sig till behållaren. */
  height?: number;
  label: string;
}

export function Sparkline({ values, height = 64, label }: Props) {
  const points = values.filter((v) => Number.isFinite(v));

  if (points.length < 2) {
    return (
      <p className="text-xs text-[var(--color-dim)]">
        Behöver minst två mätpunkter för en trend.
      </p>
    );
  }

  const W = 300;
  const H = height;
  const PAD = 4;

  const min = Math.min(...points);
  const max = Math.max(...points);
  // En helt platt serie skulle ge division med noll och en linje utanför ytan.
  const span = max - min || 1;

  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);

  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const sist = points[points.length - 1]!;
  const forsta = points[0]!;
  const stigande = sist >= forsta;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={`${label}: från ${forsta} till ${sist} kg över ${points.length} set`}
        preserveAspectRatio="none"
      >
        <path
          d={d}
          fill="none"
          stroke={stigande ? 'var(--color-fg)' : 'var(--color-dim)'}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={x(points.length - 1)} cy={y(sist)} r={3} fill="var(--color-fg)" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-[var(--color-dim)] tabular-nums">
        <span>{min.toFixed(1)} kg</span>
        <span>{label}</span>
        <span>{max.toFixed(1)} kg</span>
      </figcaption>
    </figure>
  );
}
