import type { DecoderStats } from "@morse-bot/morse-decoder";
import { Text, View } from "react-native";

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
    <View className="bg-muted/50 flex-1 items-center gap-1 rounded-lg px-4 py-3">
      <Text className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
        {label}
      </Text>
      <Text
        className={`font-mono text-sm font-bold tabular-nums ${color ?? ""}`}
      >
        {value}
      </Text>
    </View>
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
    <View className="gap-2">
      <View className="flex-row gap-2">
        <StatItem label="Signal" value={signalDb} color="text-primary" />
        <StatItem label="Freq" value={frequency} color="text-secondary" />
      </View>
      <View className="flex-row gap-2">
        <StatItem label="SNR" value={snrDb} color="text-chart-5" />
        <StatItem label="Speed" value={wpm} color="text-accent-foreground" />
      </View>
    </View>
  );
}
