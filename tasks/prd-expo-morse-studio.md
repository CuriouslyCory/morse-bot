# PRD: Expo Morse Code Studio - Full Feature Parity

## Introduction

The Next.js web app (`apps/nextjs`) provides a complete Morse Code Studio with real-time audio decoding, text-to-morse encoding, spectrogram visualization, and session management. The Expo app (`apps/expo`) currently only contains demo/template code (posts CRUD). This PRD defines the work to recreate all web app functionality 1:1 in the Expo mobile app, targeting ham radio enthusiasts who want the same experience on their mobile devices.

## Goals

- Achieve full feature parity between the Next.js web app and the Expo mobile app
- Reuse shared packages (`@morse-bot/morse-decoder`, `@morse-bot/api`, `@morse-bot/auth`) to avoid code duplication
- Provide native mobile UX (tab navigation, native controls, haptic feedback) while matching web functionality
- Support both iOS and Android platforms
- Replace the existing demo posts UI entirely with the Morse Code Studio

## User Stories

### US-001: Project Setup and Dependencies
**Description:** As a developer, I need the Expo project configured with all required native dependencies so that audio, canvas, and file system features work correctly.

**Acceptance Criteria:**
- [ ] New dependencies added to `apps/expo/package.json`: `react-native-live-audio-stream`, `react-native-audio-api`, `@shopify/react-native-skia`, `expo-document-picker`, `expo-clipboard`, `expo-file-system`, `expo-sharing`, `@react-native-community/slider`, `@morse-bot/morse-decoder` (as runtime dep)
- [ ] `app.config.ts` updated with microphone permission descriptions (iOS `NSMicrophoneUsageDescription`, Android `RECORD_AUDIO`)
- [ ] Expo plugins configured for all new native modules
- [ ] `pnpm install` succeeds without errors
- [ ] Typecheck passes: `pnpm --filter @morse-bot/expo typecheck`

### US-002: Tab Navigation Structure
**Description:** As a user, I want to switch between Decoder and Encoder modes using tabs so that I can quickly access both features.

**Acceptance Criteria:**
- [ ] Expo-router tab layout at `app/(tabs)/_layout.tsx` with two tabs: "Decoder" and "Encoder"
- [ ] Tab bar at bottom of screen with appropriate icons
- [ ] Decoder tab is the default/initial screen
- [ ] Root layout (`app/_layout.tsx`) wraps tabs with `QueryClientProvider` and shows header
- [ ] Old `app/index.tsx` and `app/post/[id].tsx` files removed
- [ ] Typecheck passes
- [ ] Lint passes

### US-003: Header with Auth-Aware Navigation
**Description:** As a user, I want to see the app title and a link to my saved sessions (when signed in) so that I can navigate the app.

**Acceptance Criteria:**
- [ ] Header displays "Morse Code Studio" title
- [ ] "My Sessions" link visible only when user is authenticated (using `authClient.useSession()`)
- [ ] "My Sessions" link navigates to `/sessions` screen
- [ ] Sign in/out button in header using existing Discord OAuth flow
- [ ] Typecheck passes

### US-004: Morse Decoder Hook
**Description:** As a developer, I need the `useMorseDecoder` hook ported to React Native so that audio samples can be decoded into morse text.

**Acceptance Criteria:**
- [ ] `hooks/use-morse-decoder.ts` created, using `@morse-bot/morse-decoder`'s `createDecoder`
- [ ] Hook returns `{ decodedText, stats, currentElements, processSamples, reset, updateConfig }` matching web API
- [ ] `requestAnimationFrame` batching works in React Native for state updates
- [ ] Decoder recreates when config changes (same `configKey` JSON comparison pattern)
- [ ] Typecheck passes

### US-005: WAV File Parser
**Description:** As a developer, I need a pure-JS WAV parser that works in React Native so that WAV audio files can be decoded to raw PCM samples.

**Acceptance Criteria:**
- [ ] `utils/wav-parser.ts` created accepting `ArrayBuffer` input (adapted from `packages/morse-decoder/src/__tests__/helpers/read-wav.ts`)
- [ ] Returns `{ samples: Float32Array, sampleRate: number, channels: number, bitsPerSample: number }`
- [ ] Supports 16-bit and 32-bit PCM WAV files
- [ ] Throws descriptive errors for invalid/unsupported files
- [ ] Typecheck passes

### US-006: Microphone Audio Input Hook
**Description:** As a user, I want to record audio from my phone's microphone so that I can decode morse code signals in real time.

**Acceptance Criteria:**
- [ ] `hooks/use-audio-input.ts` created using `react-native-live-audio-stream`
- [ ] Configured for 8kHz sample rate, mono, 16-bit PCM
- [ ] Converts base64 PCM chunks to Float32Array (Int16 / 32768 normalization)
- [ ] Requests microphone permission via `expo-av` `Audio.requestPermissionsAsync()` before recording
- [ ] Returns `{ isRecording, error, startRecording, stopRecording }` matching web hook interface
- [ ] Shows user-friendly error message if permission denied
- [ ] Properly cleans up stream on stop and unmount
- [ ] Typecheck passes

### US-007: Audio File Input Hook
**Description:** As a user, I want to pick a WAV file from my device so that I can decode pre-recorded morse code audio.

**Acceptance Criteria:**
- [ ] `hooks/use-audio-file.ts` created using `expo-document-picker` and `expo-file-system`
- [ ] Opens native file picker filtered to audio files (WAV)
- [ ] Reads selected file as base64 via `expo-file-system`, converts to ArrayBuffer
- [ ] Parses WAV with `utils/wav-parser.ts`
- [ ] Delivers samples in chunks (4096 default) with `onSamples(chunk, timestampMs)` callback
- [ ] Reports progress (0-1) between chunks, yields to UI thread between iterations
- [ ] Returns `{ isProcessing, progress, error, processFile, stopProcessing }`
- [ ] Cancellation works mid-processing
- [ ] Typecheck passes

### US-008: Decoder Controls Component
**Description:** As a user, I want to adjust decoder parameters (frequency, speed, threshold, adaptive mode) so that I can tune decoding for different morse signals.

**Acceptance Criteria:**
- [ ] `components/decoder-controls.tsx` created with native controls
- [ ] Frequency slider: range 300-1200 Hz, step 10, displays current value
- [ ] Speed (WPM) picker: presets 5, 10, 13, 15, 20, 25, 30 WPM
- [ ] Threshold slider: range 0.001-0.1, step 0.001, displays current value
- [ ] Adaptive toggle: native Switch component
- [ ] Clear/Reset button
- [ ] All controls disabled when decoding is active (`isDisabled` prop)
- [ ] Calls `onUpdateConfig(partial)` on each change
- [ ] Typecheck passes

### US-009: Signal Statistics Display
**Description:** As a user, I want to see real-time signal statistics (level, frequency, SNR, speed) so that I can monitor signal quality while decoding.

**Acceptance Criteria:**
- [ ] `components/signal-stats.tsx` created displaying 4 stats in a 2x2 grid
- [ ] Signal level in dBFS with "-- dBFS" when no signal
- [ ] Detected frequency in Hz
- [ ] SNR in dB with "-- dB" when no signal
- [ ] Estimated WPM
- [ ] Color-coded values matching web theme tokens (`text-primary`, `text-secondary`, etc.)
- [ ] Updates in real-time as decoder processes samples
- [ ] Typecheck passes

### US-010: Spectrogram Visualization
**Description:** As a user, I want to see a scrolling waterfall spectrogram so that I can visually monitor the morse signal over time.

**Acceptance Criteria:**
- [ ] `components/spectrogram.tsx` created using `@shopify/react-native-skia` Canvas
- [ ] Displays 512-wide waterfall that scrolls left as new data arrives
- [ ] Uses same `dbToColor()` gradient: black -> green -> yellow (dBFS range -80 to -20)
- [ ] Updates from `DecoderStats.signalDb` on each stats change
- [ ] Renders at frame rate without blocking JS thread (Skia renders on separate thread)
- [ ] Typecheck passes

### US-011: Decoded Text Output
**Description:** As a user, I want to see the decoded morse text with a blinking cursor and copy-to-clipboard support so that I can read and use the decoded output.

**Acceptance Criteria:**
- [ ] `components/decoded-text.tsx` created with ScrollView for decoded output
- [ ] Shows decoded text in monospace font
- [ ] Shows in-progress morse elements (dots/dashes) in muted color
- [ ] Blinking cursor animation when actively decoding
- [ ] Auto-scrolls to bottom as new text appears
- [ ] Copy button copies decoded text to clipboard via `expo-clipboard`
- [ ] Shows "Listening for morse code..." placeholder when recording with no output
- [ ] Shows "Press Start to begin decoding" when idle
- [ ] Typecheck passes

### US-012: Decoder Panel (Main Decoder Screen)
**Description:** As a user, I want a complete decoder interface that combines controls, audio input, visualization, and output so that I can decode morse code from microphone or files.

**Acceptance Criteria:**
- [ ] `components/decoder-panel.tsx` created, orchestrating all decoder sub-components
- [ ] "Start Mic" / "Stop Mic" button that toggles microphone recording
- [ ] "Open File" button that triggers WAV file picker
- [ ] "Stop" button visible during file processing
- [ ] Progress bar shown during file processing (colored bar with percentage width)
- [ ] Error messages displayed for mic/file errors
- [ ] Decoder controls card at top
- [ ] Spectrogram + signal stats in middle
- [ ] Decoded text output below
- [ ] "Save Session" button (visible when authenticated, disabled when no text)
- [ ] "Sign in to save sessions" link (visible when not authenticated, triggers Discord OAuth)
- [ ] Mic and file buttons disabled appropriately during active decoding
- [ ] Typecheck passes

### US-013: Morse Encoder Hook
**Description:** As a developer, I need the `useMorsePlayer` hook ported to React Native so that text can be played back as morse code audio tones.

**Acceptance Criteria:**
- [ ] `hooks/use-morse-player.ts` created using `react-native-audio-api` (AudioContext, OscillatorNode, GainNode)
- [ ] `play(text)` schedules sine wave tones at specified frequency and WPM
- [ ] `stop()` cancels playback and cleans up audio context
- [ ] `currentCharIndex` updates in real-time during playback for UI highlighting
- [ ] `buildCharTimings()` ported directly (pure math, unchanged)
- [ ] Returns `{ isPlaying, currentCharIndex, play, stop }`
- [ ] Typecheck passes

### US-014: Encoder Panel
**Description:** As a user, I want to type text and hear it played back as morse code audio so that I can practice or transmit morse code.

**Acceptance Criteria:**
- [ ] `components/encoder-panel.tsx` created with encoder UI
- [ ] Multiline TextInput for text entry with placeholder "Type text to encode as morse code..."
- [ ] WPM speed picker (same presets: 5, 10, 13, 15, 20, 25, 30)
- [ ] Frequency display in Hz
- [ ] Play button (disabled when text is empty)
- [ ] Stop button (shown during playback, destructive variant)
- [ ] Real-time character highlighting during playback (current char gets primary background color)
- [ ] TextInput disabled during playback
- [ ] Typecheck passes

### US-015: Tab Screens Integration
**Description:** As a user, I want the Decoder and Encoder tabs to be fully functional screens so that I can use the complete app.

**Acceptance Criteria:**
- [ ] `app/(tabs)/index.tsx` renders DecoderPanel inside SafeAreaView with screen title "Morse Decoder"
- [ ] `app/(tabs)/encoder.tsx` renders EncoderPanel inside SafeAreaView with screen title "Morse Encoder"
- [ ] Frequency and WPM shared between decoder and encoder (decoder changes propagate to encoder defaults)
- [ ] Typecheck passes

### US-016: Sessions Screen
**Description:** As an authenticated user, I want to view, expand, export, and delete my saved morse decoding sessions so that I can review past work.

**Acceptance Criteria:**
- [ ] `app/sessions.tsx` screen created, accessible from header "My Sessions" link
- [ ] Auth guard: shows sign-in prompt if not authenticated
- [ ] Fetches sessions via `useQuery(trpc.session.list.queryOptions())`
- [ ] Displays sessions in `LegendList` (already a dependency) with: creation timestamp, duration (formatted), source (mic/file)
- [ ] Each session shows first 100 chars of decoded text as preview
- [ ] "Show more" / "Show less" toggle for long sessions
- [ ] Export button: writes text to file via `expo-file-system` and shares via `expo-sharing`
- [ ] Delete button: confirmation via `Alert.alert()`, then `trpc.session.delete` mutation
- [ ] Toast/alert feedback on delete success/failure
- [ ] Empty state: "No saved sessions yet. Decode some morse code and click Save Session!"
- [ ] Back navigation to decoder
- [ ] Typecheck passes

### US-017: Save Session from Decoder
**Description:** As an authenticated user, I want to save a decoding session so that I can review decoded text later.

**Acceptance Criteria:**
- [ ] "Save Session" button in decoder panel calls `trpc.session.save` mutation
- [ ] Saves: decoded text, duration (ms since recording started), source ("mic" or "file"), settings (frequency, WPM)
- [ ] Shows success feedback after save
- [ ] Shows error feedback if save fails
- [ ] Button disabled when no decoded text or save is pending
- [ ] Typecheck passes

### US-018: Polish and Cleanup
**Description:** As a user, I want the app to feel polished with proper theming, navigation, and no leftover demo code.

**Acceptance Criteria:**
- [ ] Dark/light mode works correctly via `useColorScheme()` + NativeWind theme tokens
- [ ] `app.config.ts` updated with app name "Morse Code Studio"
- [ ] All posts-related code removed (PostCard, CreatePost, post/[id].tsx)
- [ ] No TypeScript errors: `pnpm --filter @morse-bot/expo typecheck`
- [ ] No lint errors: `pnpm --filter @morse-bot/expo lint`
- [ ] App launches successfully on iOS and Android simulator: `pnpm --filter @morse-bot/expo dev`

## Functional Requirements

- FR-1: The app must decode morse code from live microphone audio at configurable frequency (300-1200 Hz) and speed (5-30 WPM)
- FR-2: The app must decode morse code from WAV audio files picked from the device
- FR-3: The app must display real-time signal statistics (dBFS, frequency, SNR, WPM) during decoding
- FR-4: The app must display a scrolling spectrogram waterfall visualization during decoding
- FR-5: The app must display decoded text with in-progress morse elements and auto-scroll
- FR-6: The app must allow copying decoded text to the device clipboard
- FR-7: The app must encode user-typed text into morse code audio tones at configurable speed
- FR-8: The app must highlight the current character during morse code playback
- FR-9: The app must authenticate users via Discord OAuth using Better Auth
- FR-10: Authenticated users must be able to save decoding sessions with metadata (text, duration, source, settings)
- FR-11: Authenticated users must be able to view, expand, export, and delete saved sessions
- FR-12: The app must support dark and light color themes matching the web app
- FR-13: Tab navigation must provide quick switching between Decoder and Encoder modes

## Non-Goals

- No support for compressed audio formats (MP3, OGG, M4A) in initial release - WAV only
- No offline mode or local-only session storage
- No push notifications for any feature
- No audio recording/export (only decode existing audio)
- No sharing decoded text to social media
- No custom theme colors beyond the existing web theme
- No tablet-specific layouts
- No app store submission (dev builds only for now)

## Technical Considerations

### Shared Package Reuse
- `@morse-bot/morse-decoder`: Pure JS, works in React Native without changes. Use `createDecoder`, `createEncoder`, `DEFAULT_CONFIG`, `ditDurationMs`, `TIMING_RATIOS`, `getMorseForChar`
- `@morse-bot/api`: tRPC client already configured in Expo at `src/utils/api.tsx`. Session router (`save`, `list`, `getById`, `delete`) ready to use
- `@morse-bot/auth`: Better Auth client already configured in Expo at `src/utils/auth.ts` with `@better-auth/expo` plugin and secure storage

### Native Audio Architecture
- Microphone: `react-native-live-audio-stream` delivers base64-encoded PCM chunks. Convert to Float32Array via Int16 normalization
- Encoder playback: `react-native-audio-api` provides Web Audio API compatible interface (AudioContext, OscillatorNode, GainNode) - allows near-1:1 port of web `useMorsePlayer`
- WAV parsing: Pure JS DataView-based parser adapted from existing test helper at `packages/morse-decoder/src/__tests__/helpers/read-wav.ts`

### Portable Functions (copy directly from web)
- `dbToColor()` from `apps/nextjs/src/app/_components/spectrogram.tsx`
- `buildCharTimings()` from `apps/nextjs/src/hooks/use-morse-player.ts`
- `elementsToSymbols()` from `apps/nextjs/src/app/_components/decoded-text.tsx`
- `formatDuration()` from `apps/nextjs/src/app/sessions/_components/sessions-list.tsx`

### Key Differences from Web
- `requestAnimationFrame` exists in RN and works the same way for batching
- No `"use client"` directives needed (all RN code is client-side)
- HTML elements (`div`, `span`, `canvas`, `input`) replaced with RN equivalents (`View`, `Text`, Skia Canvas, TextInput, Slider, Switch)
- `@morse-bot/ui` components (Radix-based) cannot be used - build RN equivalents with NativeWind classes
- File download replaced with `expo-file-system` + `expo-sharing`
- `window.confirm` replaced with `Alert.alert`
- Import paths must not use `.js` extensions (bundler module resolution)

## Success Metrics

- All 13 functional requirements implemented and verified
- App typecheck and lint pass with zero errors
- User can decode morse from microphone with real-time spectrogram and stats
- User can decode morse from a WAV file with progress indicator
- User can encode and play back text as morse audio tones
- User can sign in, save sessions, view sessions, export and delete sessions
- Dark/light mode matches web app theme
- App launches and runs on both iOS and Android simulators

## Open Questions

- Should we add haptic feedback when morse tones play during encoding?
- Should the encoder frequency be independently configurable or always synced with the decoder?
- Do we need a dedicated onboarding screen explaining what the app does for first-time users?
