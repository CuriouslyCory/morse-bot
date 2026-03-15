# PRD: Morse Code Decoder

## Introduction

Build a real-time morse code decoder web application that listens to audio input (microphone or audio files), detects CW tonal patterns using the Goertzel algorithm, and decodes them into readable text. The app also supports encoding — converting text to audible morse code playback. The decoder is publicly accessible; authenticated users can save and export decoded sessions. This is the web (Next.js) version, with an Expo mobile version planned next.

The project also includes renaming the monorepo package scope from `@acme` to `@moris-bot` and replacing demo content with the decoder as the primary experience.

## Goals

- Decode morse code from live microphone input in real-time
- Decode morse code from uploaded audio files
- Encode text to morse code with audio playback
- Display a spectrogram/waterfall visualization of the audio signal
- Show signal statistics (dBFS, frequency, SNR, WPM)
- Support adaptive speed detection for varying sender speeds
- Allow unauthenticated users full decoder/encoder access
- Allow authenticated users to save and export decoded sessions
- Make the decoder the home page of the application
- Structure shared decoding logic for reuse in the future Expo app

## User Stories

### US-001: Rename package scope from @acme to @moris-bot
**Description:** As a developer, I need the monorepo packages renamed from `@acme` to `@moris-bot` so the project has its own identity before building features.

**Acceptance Criteria:**
- [ ] All `@acme/` references replaced with `@moris-bot/` across all files (package.json, tsconfig, eslint configs, source imports, CSS imports, generator templates)
- [ ] Root package.json name updated from `create-t3-turbo` to `moris-bot`
- [ ] App metadata (titles, descriptions) updated from "Create T3 Turbo" to "Moris Bot"
- [ ] `pnpm-lock.yaml` regenerated via `pnpm install`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

### US-002: Create shared morse-decoder package
**Description:** As a developer, I need a platform-agnostic morse decoding library so the core algorithms can be shared between web and mobile apps.

**Acceptance Criteria:**
- [ ] New package at `packages/morse-decoder` with name `@moris-bot/morse-decoder`
- [ ] Goertzel single-frequency detector implemented (accepts Float32Array samples, returns magnitude)
- [ ] Envelope detector implemented (magnitude stream to binary on/off state with hysteresis)
- [ ] Timing analyzer implemented (classifies on/off durations as dit/dah/element-gap/character-gap/word-gap)
- [ ] Adaptive WPM tracking via exponential moving average on dit durations
- [ ] ITU morse code lookup tree implemented (covers all standard characters and prosigns)
- [ ] `createDecoder(config, events)` factory function exported as primary API
- [ ] Package has zero runtime dependencies (pure TypeScript)
- [ ] Package follows existing monorepo conventions (tsconfig extends base, eslint config, prettier config)
- [ ] Typecheck passes

### US-003: Create morse encoder module
**Description:** As a developer, I need a morse encoding module so text can be converted to morse timing data for audio playback.

**Acceptance Criteria:**
- [ ] `createEncoder(config)` function added to `packages/morse-decoder`
- [ ] Accepts a text string and WPM setting, produces an array of tone/silence timing events
- [ ] Supports all characters in the ITU morse code tree
- [ ] Handles unknown characters gracefully (skips with no error)
- [ ] Typecheck passes

### US-004: Microphone audio input
**Description:** As a user, I want to use my microphone to capture morse code audio so the app can decode it in real-time.

**Acceptance Criteria:**
- [ ] Browser prompts for microphone permission when user clicks "Start"
- [ ] Audio captured via Web Audio API `getUserMedia`
- [ ] AudioWorklet processor forwards sample chunks to main thread via MessagePort
- [ ] Worklet file served from `public/audio-worklet/sample-forwarder.js`
- [ ] Audio samples fed into `@moris-bot/morse-decoder` `processSamples()` method
- [ ] Graceful error message shown if microphone permission is denied
- [ ] Graceful error message shown if browser does not support AudioWorklet
- [ ] Start/Stop button toggles recording state
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Audio file decoding
**Description:** As a user, I want to upload an audio file containing morse code so I can decode recordings.

**Acceptance Criteria:**
- [ ] File upload input accepts common audio formats (.wav, .mp3, .ogg, .m4a)
- [ ] Uploaded file decoded via Web Audio API `decodeAudioData`
- [ ] Decoded samples fed into `@moris-bot/morse-decoder` `processSamples()` in chunks
- [ ] Progress indicator shown during file processing
- [ ] Decoded text displayed the same way as live decoding
- [ ] User can stop/cancel file processing
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Spectrogram/waterfall display
**Description:** As a user, I want to see a visual representation of the audio signal so I can identify morse code patterns and tune the frequency.

**Acceptance Criteria:**
- [ ] Canvas-based scrolling waterfall display showing signal magnitude over time
- [ ] New data drawn as a column on the right, existing data scrolls left
- [ ] Signal intensity represented by color (dark = silence, bright = tone)
- [ ] Renders via `requestAnimationFrame`, independent of React render cycle
- [ ] Display updates in real-time during live decoding
- [ ] Display shows signal during file playback
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Signal statistics display
**Description:** As a user, I want to see signal statistics so I can monitor decoding quality and adjust settings.

**Acceptance Criteria:**
- [ ] Displays current signal level in dBFS
- [ ] Displays detected/target frequency in Hz
- [ ] Displays signal-to-noise ratio in dB
- [ ] Displays current detected/estimated WPM
- [ ] Stats update in real-time (debounced to ~15-30 fps to avoid excessive re-renders)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Decoded text output
**Description:** As a user, I want to see the decoded morse code as readable text so I can read the transmitted message.

**Acceptance Criteria:**
- [ ] Scrollable text area displays decoded characters
- [ ] Text area auto-scrolls to bottom as new characters arrive
- [ ] Monospace font for readability
- [ ] Shows in-progress element accumulation (dots/dashes for current unfinished character)
- [ ] Word boundaries rendered as spaces
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Decoder controls
**Description:** As a user, I want to adjust decoder settings so I can tune the decoder for different signals.

**Acceptance Criteria:**
- [ ] Target frequency slider/input (range: 300-1200 Hz, default: 600 Hz)
- [ ] WPM speed preset selector (5, 10, 13, 15, 20, 25, 30 WPM)
- [ ] Adaptive mode toggle (on by default)
- [ ] Detection threshold adjustment
- [ ] Clear/reset button to clear decoded text and reset decoder state
- [ ] Controls built using existing `@moris-bot/ui` components (Button, Input, Label)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Text-to-morse encoder with audio playback
**Description:** As a user, I want to type text and hear it played back as morse code so I can practice or generate morse audio.

**Acceptance Criteria:**
- [ ] Text input area for entering text to encode
- [ ] Play button generates morse code audio using Web Audio API `OscillatorNode`
- [ ] Configurable playback frequency (matches decoder target frequency)
- [ ] Configurable playback WPM
- [ ] Stop button halts playback mid-stream
- [ ] Visual indication of current character being played
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Remove demo content and make decoder the home page
**Description:** As a user, I want the decoder to be the first thing I see when visiting the app, not demo posts.

**Acceptance Criteria:**
- [ ] Demo posts CRUD UI removed from home page
- [ ] Demo auth showcase component removed from home page
- [ ] Decoder UI is the content of the `/` route
- [ ] Existing infrastructure (auth, db, tRPC) remains functional
- [ ] Post-related tRPC router and schema can remain for now (not user-facing)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Save decoded sessions (authenticated)
**Description:** As an authenticated user, I want to save my decoded sessions so I can review them later.

**Acceptance Criteria:**
- [ ] "Save Session" button visible only to authenticated users
- [ ] Unauthenticated users see a "Sign in to save sessions" prompt (non-blocking)
- [ ] Saved session stores: decoded text, timestamp, duration, source (mic/file), settings used
- [ ] New database table `decoded_sessions` with appropriate schema
- [ ] tRPC mutation for saving a session
- [ ] Success toast shown after saving
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: View and export saved sessions (authenticated)
**Description:** As an authenticated user, I want to view my saved sessions and export them as text files.

**Acceptance Criteria:**
- [ ] Sessions list page accessible from navigation (e.g., `/sessions`)
- [ ] List shows saved sessions with timestamp, duration, preview text
- [ ] Click a session to view full decoded text
- [ ] Export button downloads session as `.txt` file
- [ ] Delete button removes a saved session (with confirmation)
- [ ] Only shows sessions belonging to the authenticated user
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Decoder page layout and responsive design
**Description:** As a user, I want the decoder page to be well-organized and usable on different screen sizes.

**Acceptance Criteria:**
- [ ] Layout: controls bar (top), spectrogram + stats (middle), text output (bottom)
- [ ] Encoder section accessible via tab or toggle below the decoder
- [ ] Responsive: usable on desktop (1024px+) and tablet (768px+)
- [ ] Mobile web is functional but Expo app is the intended mobile experience
- [ ] Dark/light theme support via existing theme system
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The system must detect morse code tones using the Goertzel algorithm at a configurable target frequency
- FR-2: The system must classify tone durations as dits (1 unit) or dahs (3 units) based on ITU morse timing ratios
- FR-3: The system must classify silence durations as element gaps (1 unit), character gaps (3 units), or word gaps (7 units)
- FR-4: The system must support adaptive speed detection that adjusts to the sender's WPM in real-time
- FR-5: The system must decode all ITU international morse code characters (A-Z, 0-9, punctuation, prosigns)
- FR-6: The system must accept audio input from the browser microphone via Web Audio API
- FR-7: The system must accept audio input from uploaded audio files (.wav, .mp3, .ogg, .m4a)
- FR-8: The system must display a scrolling spectrogram/waterfall visualization of the audio signal
- FR-9: The system must display real-time signal statistics: dBFS, frequency, SNR, WPM
- FR-10: The system must display decoded text in a scrollable, auto-scrolling text area
- FR-11: The system must allow users to adjust target frequency, WPM, adaptive mode, and detection threshold
- FR-12: The system must encode text input to morse code timing data and play it as audio via OscillatorNode
- FR-13: The system must allow authenticated users to save decoded sessions to the database
- FR-14: The system must allow authenticated users to view, review, and export saved sessions as .txt files
- FR-15: The system must allow authenticated users to delete saved sessions
- FR-16: The decoder must be fully functional without authentication (save/export requires auth)
- FR-17: The shared `@moris-bot/morse-decoder` package must have zero platform-specific dependencies

## Non-Goals

- No mobile-specific UI (the Expo app will handle mobile)
- No real-time collaboration or shared decoding sessions
- No automatic frequency detection/scanning (user sets the target frequency)
- No support for non-ITU morse variants (e.g., American morse, Japanese wabun)
- No audio recording/saving of raw audio (only decoded text is saved)
- No CW Skimmer-style multi-channel parallel decoding
- No integration with SDR (software-defined radio) hardware
- No offline/PWA support in this version

## Design Considerations

- The decoder UI should evoke a radio/signal processing aesthetic (dark theme preferred, monospace text, signal-style visualizations)
- Reuse existing `@moris-bot/ui` components (Button, Input, Label, Separator, Theme, Toast) wherever possible
- The spectrogram is custom canvas rendering, not a UI library component
- Layout should be information-dense but not cluttered, similar to the "Morse Expert" screenshot

## Technical Considerations

- **Goertzel algorithm** is used instead of FFT because we only need to detect one frequency — it's O(N) per block vs O(N log N) for FFT
- **AudioWorklet** is used over AnalyserNode for reliable sample-level access on a dedicated audio thread; the worklet is a thin sample forwarder (~15 lines), all DSP runs on the main thread
- **Shared package** (`packages/morse-decoder`) accepts `Float32Array` samples and emits events — the same API will be consumed by Expo using `expo-av` audio buffers
- **Envelope detection** uses dual-threshold hysteresis to avoid jitter at the tone/silence boundary
- **Adaptive timing** uses exponential moving average on observed dit durations to track sender speed
- **React re-render throttling**: decoder stats update at ~30Hz; use `requestAnimationFrame`-gated state updates to avoid excessive re-renders
- **Spectrogram canvas** renders independently of React via `requestAnimationFrame`
- The AudioWorklet processor file must be plain `.js` served from `/public` (worklets require a URL, not a bundled module)
- `getUserMedia` requires HTTPS in production; Chrome allows HTTP for localhost in development

## Success Metrics

- User can decode a 15 WPM morse code audio source with >90% character accuracy
- Decoder handles WPM range of 5-30 with adaptive mode enabled
- Spectrogram visually shows distinct tone/silence patterns
- Time from page load to first decoded character is under 5 seconds (excluding mic permission prompt)
- Authenticated user can save and retrieve a session in under 3 clicks

## Open Questions

- Should the encoder output be directly routable back into the decoder for self-test/loopback?
- What prosigns should be supported beyond the standard ITU set?
- Should saved sessions include the decoder settings used, to allow replay with the same configuration?
- Should there be a "practice mode" that generates random morse and scores the user's manual decoding?
