"use client";

import { Separator } from "@morse-bot/ui/separator";
import { type DecoderStats } from "@morse-bot/morse-decoder";

interface SignalStatsProps {
  stats: DecoderStats;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums dark:text-green-400">
        {value}
      </span>
    </div>
  );
}

export function SignalStats({ stats }: SignalStatsProps) {
  const signalDb = isFinite(stats.signalDb)
    ? `${stats.signalDb.toFixed(1)} dBFS`
    : "— dBFS";
  const snrDb = isFinite(stats.snrDb)
    ? `${stats.snrDb.toFixed(1)} dB`
    : "— dB";
  const frequency = `${stats.frequency.toFixed(0)} Hz`;
  const wpm = `${stats.wpm.toFixed(0)} WPM`;

  return (
    <div className="flex flex-wrap items-center justify-around gap-2 rounded border p-3 dark:border-zinc-700 dark:bg-zinc-950">
      <StatItem label="Signal" value={signalDb} />
      <Separator orientation="vertical" className="h-8" />
      <StatItem label="Freq" value={frequency} />
      <Separator orientation="vertical" className="h-8" />
      <StatItem label="SNR" value={snrDb} />
      <Separator orientation="vertical" className="h-8" />
      <StatItem label="Speed" value={wpm} />
    </div>
  );
}
