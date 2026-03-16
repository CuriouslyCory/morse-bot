"use client";

import { useEffect, useRef } from "react";

import type { DecoderStats } from "@morse-bot/morse-decoder";

interface SpectrogramProps {
  stats: DecoderStats;
}

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 64;
/** dBFS floor — everything at or below this is rendered black */
const DB_MIN = -80;
/** dBFS ceiling — everything at or above this is full brightness */
const DB_MAX = -20;

/** Maps a dBFS value to an RGB tuple using a black → green → yellow gradient. */
function dbToColor(db: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)));
  if (t < 0.5) {
    // Black → dark green
    const u = t * 2;
    return [0, Math.round(u * 160), 0];
  }
  // Dark green → bright yellow-green
  const u = (t - 0.5) * 2;
  return [Math.round(u * 200), Math.round(160 + u * 95), 0];
}

/**
 * Canvas-based scrolling waterfall that visualises Goertzel magnitude over time.
 * New columns are appended on the right; older data scrolls left.
 * Rendering is driven by requestAnimationFrame, independent of React renders.
 */
export function Spectrogram({ stats }: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const queueRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  // Enqueue magnitude on every stats update (fires once per decoder block via rAF flush)
  useEffect(() => {
    queueRef.current.push(stats.signalDb);
  }, [stats]);

  // Set up the rAF rendering loop once on mount
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;

    // Capture as explicitly non-null typed consts so TypeScript propagates
    // the narrowed types into the inner tick function declaration.
    const el: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    // Fill canvas black initially
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    function tick() {
      // Drain entire queue atomically (O(1)) to avoid unbounded growth during fast file processing
      const items = queueRef.current.splice(0);
      // If more items arrived than we can display, skip the oldest ones
      const visible = items.slice(-CANVAS_WIDTH);

      const w = el.width;
      const h = el.height;

      for (const db of visible) {
        // Shift existing content one pixel to the left
        const imageData = ctx.getImageData(1, 0, w - 1, h);
        ctx.putImageData(imageData, 0, 0);

        // Draw the new column on the right edge
        const [r, g, b] = dbToColor(db);
        ctx.fillStyle = `rgb(${r.toString()},${g.toString()},${b.toString()})`;
        ctx.fillRect(w - 1, 0, 1, h);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full rounded border"
      aria-label="Signal spectrogram display"
    />
  );
}
