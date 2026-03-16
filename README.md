# Morse Bot

A real-time morse code decoder and encoder built as a TypeScript monorepo. Decode morse code from your microphone or audio files, view live signal visualizations, and encode text back to morse with audio playback.

## Features

- **Real-time microphone decoding** - Listen to morse code through your mic and see it decoded live
- **Audio file decoding** - Upload WAV files and decode morse code with progress tracking
- **Adaptive speed tracking** - Automatically adapts to the sender's WPM with EMA smoothing
- **Live spectrogram** - Canvas-based scrolling waterfall display of the audio signal
- **Text-to-morse encoder** - Convert text to morse code with audio playback and character highlighting
- **Session persistence** - Save, view, and export decoded sessions (authenticated users)
- **Configurable parameters** - Tune frequency (300-1200 Hz), WPM, detection threshold, and adaptive mode

## Architecture

This is a [Turborepo](https://turborepo.com) monorepo using the `@morse-bot` package scope.

```text
apps
  ├─ nextjs          — Next.js web app with decoder UI, auth, and session management
  ├─ expo            — React Native mobile app (Expo SDK 54)
  └─ tanstack-start  — Tanstack Start web app
packages
  ├─ morse-decoder   — Core decoding/encoding library (Goertzel filter, envelope detector,
  │                    timing analyzer, morse tree, encoder)
  ├─ api             — tRPC v11 router (posts, sessions)
  ├─ auth            — Authentication via Better Auth
  ├─ db              — Drizzle ORM with Supabase/Postgres
  ├─ ui              — Shared UI components (shadcn/ui)
  └─ validators      — Shared validation schemas
tooling
  ├─ eslint          — Shared ESLint presets
  ├─ prettier        — Shared Prettier config
  ├─ tailwind        — Shared Tailwind theme
  └─ typescript      — Shared tsconfig
```

### Morse Decoder Pipeline

Audio samples flow through a signal processing pipeline:

1. **Goertzel filter** - Single-frequency IIR detector (no FFT needed)
2. **Envelope detector** - Dual-threshold hysteresis tone classifier with adaptive noise floor
3. **Timing analyzer** - Classifies durations into dits, dahs, and gaps (element/character/word)
4. **Morse tree lookup** - Binary tree mapping of dit/dah sequences to ITU characters

## Quick Start

### Prerequisites

- Node.js ^24.13.1
- pnpm ^10.19.0

### Setup

```bash
# Install dependencies
pnpm i

# Configure environment variables
cp .env.example .env

# Push the database schema
pnpm db:push

# Generate the Better Auth schema
pnpm auth:generate

# Start development
pnpm dev
```

### Running Tests

```bash
pnpm test
```

Tests validate the morse decoder against sample WAV files with an 80% accuracy target. Current results:

| File | Expected | Accuracy |
|------|----------|----------|
| morse-test1.wav | "HI. HOW ARE YOU?" | 90.3% |
| morse-test2.wav | "THE ORANGE FOX JUMPS OVER THE BROWN LOG." | 98.7% |
| morse-test3.wav | "WHERE IS THE BACON?" | 97.3% |

## Deployment

The Next.js app can be deployed to [Vercel](https://vercel.com). Select `apps/nextjs` as the root directory and add your `POSTGRES_URL` environment variable.

## License

[MIT](LICENSE)
