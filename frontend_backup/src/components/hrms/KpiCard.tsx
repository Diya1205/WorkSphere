import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: number;
  helper?: string;
  icon?: React.ComponentType<{ className?: string }>;
  series?: number[];
  className?: string;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="text-primary/60">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiCard({ label, value, delta, helper, icon: Icon, series, className }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)] transition-shadow hover:shadow-[var(--shadow-hover)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span className="truncate">{label}</span>
          </div>
          <div className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-foreground tabular">
            {value}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular",
                  positive ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                )}
              >
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {positive ? "+" : ""}
                {delta.toFixed(1)}%
              </span>
            )}
            {helper && <span className="text-[11px] text-muted-foreground">{helper}</span>}
          </div>
        </div>
        {series && <Sparkline data={series} />}
      </div>
    </div>
  );
}
