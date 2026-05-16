import { formatCurrency, formatPercent, getProgress } from "@/lib/format";

type ProgressSummaryProps = {
  collected: number;
  budget: number;
};

export function ProgressSummary({ collected, budget }: ProgressSummaryProps) {
  const progress = getProgress(collected, budget);

  return (
    <div className="grid gap-2">
      <div className="flex items-end justify-between gap-3 text-sm">
        <span className="font-semibold">Собрано {formatPercent(progress)}</span>
        <span className="text-right font-semibold">
          {formatCurrency(collected)} / {formatCurrency(budget)}
        </span>
      </div>
      <div className="progress-track" aria-label={`Собрано ${formatPercent(progress)}`}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

