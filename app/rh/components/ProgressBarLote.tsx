'use client';

interface ProgressBarLoteProps {
  percentual: number;
  total: number;
  concluidas: number;
  className?: string;
}

export default function ProgressBarLote({
  percentual,
  total,
  concluidas,
  className = '',
}: ProgressBarLoteProps) {
  const pct = Math.min(100, Math.max(0, Math.round(percentual)));

  const barColor =
    pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{pct}%</span>
        <span>
          {concluidas}/{total}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
