# PRD: Code Review Remediation

## Introduction

A comprehensive code review of the moris-bot project uncovered 13 issues across the `@acme` to `@moris-bot` rename, the `packages/morse-decoder` shared library, Next.js hooks/components, and the tRPC session router. Issues range from a security vulnerability (IDOR on session delete) to a broken build (tsconfig won't emit `dist/`), incomplete rename (4 files still reference `@acme`), and several correctness/robustness bugs. This PRD covers fixing all issues.

## Goals

- Fix all critical issues: incomplete rename, broken tsconfig, security IDOR
- Fix all important correctness bugs: AudioContext leak, Safari sampleRate, encoder constants, morse tree collisions, decoder state corruption, spectrogram performance, missing Suspense boundary
- Fix moderate issues: isProcessing timing, pathFilter API, README references
- Ensure `pnpm typecheck` and `pnpm lint` pass after all fixes
- Ensure zero remaining `@acme` references outside `node_modules` and `pnpm-lock.yaml`

## User Stories

### US-001: Fix incomplete @acme rename in turbo generator templates
**Description:** As a developer, I need the turbo generator templates updated so that new packages scaffolded by `turbo generate` use the `@moris-bot` scope.

**Acceptance Criteria:**
- [ ] `turbo/generators/templates/package.json.hbs` lines 2, 18, 19, 20, 25: all `@acme/` replaced with `@morse-bot/`
- [ ] `turbo/generators/templates/eslint.config.ts.hbs` line 3: `@acme/eslint-config/base` changed to `@morse-bot/eslint-config/base`
- [ ] `turbo/generators/templates/tsconfig.json.hbs` line 2: `@acme/tsconfig/compiled-package.json` changed to `@morse-bot/tsconfig/compiled-package.json`
- [ ] Typecheck passes

### US-002: Fix incomplete @acme rename in Expo postcss config
**Description:** As a developer, I need the Expo app's PostCSS config to reference the renamed tailwind package so the build doesn't break.

**Acceptance Criteria:**
- [ ] `apps/expo/postcss.config.mjs` line 1: `@acme/tailwind-config` changed to `@morse-bot/tailwind-config`
- [ ] Typecheck passes

### US-003: Update README to remove stale @acme references
**Description:** As a developer, I need the README to reflect the completed rename so documentation commands actually work.

**Acceptance Criteria:**
- [ ] `README.md` line 72: remove or update the "rename @acme" paragraph (rename is already done)
- [ ] `README.md` line 105: `@acme/auth` changed to `@morse-bot/auth`
- [ ] `README.md` line 117: `@acme/db` changed to `@morse-bot/db`
- [ ] `grep -r "@acme" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.mjs" --include="*.hbs" --include="*.md" --include="*.css" .` returns zero results (excluding node_modules and pnpm-lock.yaml)

### US-004: Fix morse-decoder tsconfig to emit dist output
**Description:** As a developer, I need the morse-decoder package's TypeScript build to actually produce declaration files in `dist/` so consuming packages can resolve the types export.

**Acceptance Criteria:**
- [ ] `packages/morse-decoder/tsconfig.json` line 2: changed from `@morse-bot/tsconfig/base.json` to `@morse-bot/tsconfig/compiled-package.json`
- [ ] Running `pnpm --filter @morse-bot/morse-decoder build` produces files in `packages/morse-decoder/dist/`
- [ ] `packages/morse-decoder/dist/index.d.ts` exists after build
- [ ] Typecheck passes

### US-005: Fix IDOR vulnerability in session delete and getById
**Description:** As a developer, I need the session tRPC router to verify ownership on delete and getById so users cannot access or delete other users' sessions.

**Acceptance Criteria:**
- [ ] `packages/api/src/router/session.ts` `delete` mutation: where clause changed from `eq(DecodedSession.id, input)` to `and(eq(DecodedSession.id, input), eq(DecodedSession.userId, ctx.session.user.id))`
- [ ] `packages/api/src/router/session.ts` `getById` query: where clause changed from `eq(DecodedSession.id, input.id)` to `and(eq(DecodedSession.id, input.id), eq(DecodedSession.userId, ctx.session.user.id))`
- [ ] `and` imported from `@morse-bot/db` (or `drizzle-orm`)
- [ ] Typecheck passes

### US-006: Fix AudioContext leak on recording setup error
**Description:** As a developer, I need the useAudioInput hook to clean up the AudioContext and media stream if setup fails partway through, so browser resources aren't leaked.

**Acceptance Criteria:**
- [ ] `apps/nextjs/src/hooks/use-audio-input.ts` catch block (line 67): closes `audioContextRef.current` if it was set
- [ ] Catch block stops media stream tracks via `streamRef.current?.getTracks().forEach(t => t.stop())`
- [ ] Catch block nulls out all refs (`audioContextRef`, `streamRef`, `sourceNodeRef`, `workletNodeRef`)
- [ ] Typecheck passes

### US-007: Fix Safari sampleRate mismatch
**Description:** As a developer, I need the audio input hook to detect the actual AudioContext sample rate (which Safari may override) and expose it so the decoder uses the correct rate.

**Acceptance Criteria:**
- [ ] `apps/nextjs/src/hooks/use-audio-input.ts`: after creating AudioContext, read `audioContext.sampleRate` as the actual rate
- [ ] Hook return value includes `actualSampleRate: number | null` (null when not recording)
- [ ] The decoder panel or useMorseDecoder hook uses the actual sample rate (not the requested one) when configuring the decoder
- [ ] Typecheck passes

### US-008: Add elementGap constant to TIMING_RATIOS
**Description:** As a developer, I need the TIMING_RATIOS constant to include an explicit `elementGap` entry so the encoder doesn't reuse the `dit` tone constant for gap timing.

**Acceptance Criteria:**
- [ ] `packages/morse-decoder/src/constants.ts` TIMING_RATIOS: add `elementGap: 1`
- [ ] `packages/morse-decoder/src/encoder.ts` line 28: change `dit * TIMING_RATIOS.dit` to `dit * TIMING_RATIOS.elementGap`
- [ ] Typecheck passes

### US-009: Fix morse tree prosign collision
**Description:** As a developer, I need the morse code lookup table to not map ITU prosigns to unrelated ASCII characters, so decoded CW operating signals are correct.

**Acceptance Criteria:**
- [ ] `packages/morse-decoder/src/morse-tree.ts`: remove or comment out the `".-..."` -> `"&"` mapping (line 55), with a comment explaining it's the ITU "AS" (wait) prosign
- [ ] Optionally add `".-..."` -> `"<AS>"` or similar prosign notation instead
- [ ] Remove or comment out `"...-..-"` -> `"$"` mapping (line 63) with a comment noting it's non-ITU
- [ ] Typecheck passes

### US-010: Fix updateConfig state corruption in decoder
**Description:** As a developer, I need `updateConfig()` to reset the decoder's transition tracking state when DSP components are rebuilt, so stale state doesn't cause spurious dit/dah emissions.

**Acceptance Criteria:**
- [ ] `packages/morse-decoder/src/decoder.ts` `updateConfig` method: after rebuilding components, also resets `prevToneActive = false`, `lastTransitionMs = null`, and `currentElements = []`
- [ ] Alternatively, call the existing `resetState()` function (but note this also clears `decodedText` — choose the appropriate approach)
- [ ] Typecheck passes

### US-011: Fix spectrogram unbounded queue during file processing
**Description:** As a developer, I need the spectrogram component to handle rapid data inflow (during file processing) without unbounded memory growth or O(n) shift operations.

**Acceptance Criteria:**
- [ ] `apps/nextjs/src/app/_components/spectrogram.tsx`: replace `while (queue.length) { queue.shift() }` with `queue.splice(0)` to drain entire queue at once
- [ ] Only paint the last `CANVAS_WIDTH` entries from the drained array (skip excess entries)
- [ ] No visible lag or memory growth when processing a large audio file
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Add Suspense boundary to sessions page
**Description:** As a developer, I need the sessions page to wrap its data-fetching component in a Suspense boundary so client-side navigation doesn't throw an unhandled suspense.

**Acceptance Criteria:**
- [ ] `apps/nextjs/src/app/sessions/page.tsx`: wrap `<SessionsList />` in `<Suspense fallback={<p>Loading sessions...</p>}>`
- [ ] Import `Suspense` from `react`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Fix isProcessing timing in useAudioFile hook
**Description:** As a developer, I need `isProcessing` to be set to `true` before async work begins so the UI correctly reflects the processing state during audio decoding.

**Acceptance Criteria:**
- [ ] `apps/nextjs/src/hooks/use-audio-file.ts`: move `setIsProcessing(true)` from line 62 to before the first `await` (before `file.arrayBuffer()` at line 40)
- [ ] Typecheck passes

### US-014: Verify or fix trpc.session.pathFilter() usage
**Description:** As a developer, I need the session invalidation in SessionsList to use an API that actually exists in the installed tRPC version.

**Acceptance Criteria:**
- [ ] `apps/nextjs/src/app/sessions/_components/sessions-list.tsx` line 40: verify `trpc.session.pathFilter()` exists; if not, replace with `{ queryKey: trpc.session.list.queryOptions().queryKey }`
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Zero `@acme` references remain in any source file, template, config, or documentation (excluding node_modules and lockfiles)
- FR-2: `packages/morse-decoder` build (`tsc`) produces declaration files in `dist/`
- FR-3: Session `delete` and `getById` endpoints enforce user ownership via `userId` check in the where clause
- FR-4: AudioContext and MediaStream resources are cleaned up on any error during recording setup
- FR-5: Decoder uses the actual AudioContext sample rate, not the requested one, to handle browsers that override it
- FR-6: `TIMING_RATIOS` includes an explicit `elementGap` constant
- FR-7: Morse code lookup table does not map ITU prosigns to unrelated ASCII characters
- FR-8: `updateConfig()` resets decoder transition state when rebuilding DSP components
- FR-9: Spectrogram drains its queue in one pass per frame with no unbounded growth
- FR-10: `SessionsList` is wrapped in a `<Suspense>` boundary
- FR-11: `isProcessing` state is set before async work begins in file processing
- FR-12: Session query invalidation uses a valid tRPC API

## Non-Goals

- No new features or UI changes — this is purely a bug/quality fix pass
- No refactoring beyond what's needed to fix each issue
- No test writing (tests are a separate effort)
- No performance optimization beyond the spectrogram queue fix

## Technical Considerations

- The tsconfig fix (US-004) is the most critical — without it, the morse-decoder package produces no build output, which could cascade into import resolution failures in Next.js
- The IDOR fix (US-005) requires importing `and` from drizzle-orm — verify this is re-exported from `@morse-bot/db` or import directly
- The Safari sampleRate fix (US-007) changes the `useAudioInput` hook's return type, which will require updating the consuming component (`decoder-panel.tsx`)
- The morse tree fix (US-009) changes decoder behavior — characters previously decoded as `&` or `$` will now be skipped or show prosign notation

## Success Metrics

- `pnpm typecheck` passes with zero errors
- `pnpm lint` passes with zero errors
- `grep -r "@acme"` across source files returns zero matches
- `packages/morse-decoder/dist/index.d.ts` exists after build
- Session delete/getById queries include userId in their where clause

## Open Questions

- For US-009 (morse tree): should prosigns like AS (wait) be decoded to a notation like `<AS>`, or simply dropped? Current plan is to remove the mapping and add a comment.
- For US-010 (updateConfig): should it preserve decoded text or fully reset? Currently `resetState()` clears text — a partial reset of just transition state may be more user-friendly.
