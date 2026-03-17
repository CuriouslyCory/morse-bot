"use client";

import type { DecoderStats } from "@morse-bot/morse-decoder";

interface SignalStatsProps {
  stats: DecoderStats;
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-muted/50 flex flex-col items-center gap-1 rounded-lg px-4 py-3">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-bold tabular-nums ${color ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function SignalStats({ stats }: SignalStatsProps) {
  const signalDb = isFinite(stats.signalDb)
    ? `${stats.signalDb.toFixed(1)} dBFS`
    : "-- dBFS";
  const snrDb = isFinite(stats.snrDb)
    ? `${stats.snrDb.toFixed(1)} dB`
    : "-- dB";
  const frequency = `${stats.frequency.toFixed(0)} Hz`;
  const wpm = `${stats.wpm.toFixed(0)} WPM`;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      <StatItem label="Signal" value={signalDb} color="text-primary" />
      <StatItem label="Freq" value={frequency} color="text-secondary" />
      <StatItem label="SNR" value={snrDb} color="text-chart-5" />
      <StatItem label="Speed" value={wpm} color="text-accent-foreground" />
    </div>
  );
}
