export type DonutSegment = { label: string; value: number; color: string };

export default function DonutChart({
  segments,
  total,
}: {
  segments: DonutSegment[];
  total: number;
}) {
  let offset = 0;

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
        {/* r = 100 / (2π) sehingga keliling lingkaran tepat 100 */}
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" strokeWidth="4.5" />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => {
              const pct = (s.value / total) * 100;
              const circle = (
                <circle
                  key={s.label}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="4.5"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += pct;
              return circle;
            })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#102a4c]">{total}</span>
        <span className="text-xs text-[#7183a0]">Tenant</span>
      </div>
    </div>
  );
}
