import { useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { Canvas, Rect } from "@shopify/react-native-skia";
import type { DecoderStats } from "@morse-bot/morse-decoder";

interface SpectrogramProps {
  stats: DecoderStats;
}

const BUFFER_SIZE = 512;
const CANVAS_HEIGHT = 64;

/** dBFS floor — everything at or below this is rendered black */
const DB_MIN = -80;
/** dBFS ceiling — everything at or above this is full brightness */
const DB_MAX = -20;

/** Maps a dBFS value to an RGB string using a black → green → yellow gradient. */
function dbToColor(db: number): string {
  const t = Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)));
  let r: number, g: number, b: number;
  if (t < 0.5) {
    // Black → dark green
    const u = t * 2;
    r = 0;
    g = Math.round(u * 160);
    b = 0;
  } else {
    // Dark green → bright yellow-green
    const u = (t - 0.5) * 2;
    r = Math.round(u * 200);
    g = Math.round(160 + u * 95);
    b = 0;
  }
  return `rgb(${r.toString()},${g.toString()},${b.toString()})`;
}

export function Spectrogram({ stats }: SpectrogramProps) {
  const { width } = useWindowDimensions();
  const bufferRef = useRef<number[]>(new Array(BUFFER_SIZE).fill(-Infinity));
  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    // Shift buffer left and append new value
    bufferRef.current.push(stats.signalDb);
    bufferRef.current = bufferRef.current.slice(-BUFFER_SIZE);
    setRenderTick((t) => t + 1);
  }, [stats]);

  const buffer = bufferRef.current;
  const rectWidth = width / BUFFER_SIZE;

  return (
    <Canvas style={{ width, height: CANVAS_HEIGHT }} key={renderTick}>
      {buffer.map((db, i) => (
        <Rect
          key={i}
          x={i * rectWidth}
          y={0}
          width={rectWidth}
          height={CANVAS_HEIGHT}
          color={dbToColor(db)}
        />
      ))}
    </Canvas>
  );
}
