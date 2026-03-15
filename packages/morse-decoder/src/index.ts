export type {
  DecoderConfig,
  DecoderEvents,
  DecoderStats,
  GoertzelResult,
  MorseElement,
  MorseGap,
} from "./types.js";

export {
  DEFAULT_CONFIG,
  ditDurationMs,
  TIMING_RATIOS,
} from "./constants.js";

export { getMorseForChar, lookupMorse } from "./morse-tree.js";
