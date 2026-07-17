# Meetly Mobile Migration Plan

## TL;DR

- **Recommended approach:** Gradual migration to **Expo + Expo Router + NativeWind** with **Phase 0 privacy/product alignment first**, **shared-core extraction second**, and a **complete hybrid/cloud baseline** that explicitly includes backend upload/job/security/observability work before any native on-device AI commitment.
- **Total effort:** **26.0 person-weeks base case** for the recommended baseline. This is **total effort, not calendar duration**; some phases can run in parallel after contracts stabilize.
- **Top 3 risks:**
  1. The current recording stack depends on browser-only media APIs and desktop/tab system-audio sharing, which has no proven Expo parity. (`src/domains/meetings/services/recording-engine.service.ts:48-214`)
  2. The current AI stack depends on browser-native `browser-whisper` and WebLLM/WebGPU, which are not drop-in compatible with Expo/Hermes. (`src/domains/meetings/services/transcription.service.ts:35-67`, `src/domains/meetings/services/notes-generation.service.ts:155-227`, `package.json:24-29`)
  3. The current app is local-first and browser-persistent, so migration requires replacing `IndexedDB`, `localStorage`, DOM export flows, cross-origin-isolated browser assumptions, **and** adding a secure backend path if cloud/hybrid AI is approved. (`src/domains/meetings/services/meetings-repository.service.ts:3-89`, `src/lib/transcription-settings.ts:34-89`, `src/lib/notes-settings.ts:34-49`, `next.config.ts:3-19`, `src/domains/onboarding/content/onboarding-steps.ts:27-30`)

## 1. Evidence Method

This document is based on direct repository inspection of the current tree and targeted external documentation verification performed on **2026-07-17**. Repository evidence was gathered from:

- project constraints and architecture docs: `.opencode/knowledge/critical-constraints.md`, `.opencode/knowledge/architecture-patterns.md`
- dependency and script inventory: `package.json`
- web runtime configuration: `next.config.ts`
- all files under `src/app/`, `src/domains/meetings/`, `src/domains/onboarding/`, and `src/domains/settings/`
- shared files under `src/components/`, `src/lib/`, `src/config/`, `src/styles/`, and `src/utils/` that materially affect the migrated features.

Negative claims such as “no Server Actions” or “no schemas” are marked as **verified tree/search evidence** when they come from repository-wide glob/grep checks rather than a single file citation.

## 2. Current Architecture and Dependency Inventory

### 2.1 Repository shape and active domains

The active application lives in `src/` with `app/`, `components/`, `config/`, `domains/`, `lib/`, `stories/`, `styles/`, and `utils/`. The only product domains currently present are `meetings`, `onboarding`, and `settings` (**verified tree/search evidence** from recursive tree inspection). The practical architecture is therefore a small App Router shell over three domain folders, not a larger multi-feature backend-integrated platform.

### 2.2 Documented architecture rules versus actual codebase

The project rules define:

- RSC-first architecture. (`.opencode/knowledge/critical-constraints.md:7-31`)
- Server Actions for all mutations. (`.opencode/knowledge/critical-constraints.md:35-66`)
- React Query for server state and Zustand only for UI/client state. (`.opencode/knowledge/critical-constraints.md:174-299`)
- domain-based organization with business logic under `src/domains/`. (`.opencode/knowledge/critical-constraints.md:118-142`, `.opencode/knowledge/architecture-patterns.md:125-183`)

The real codebase only partially follows that model:

- Routing is indeed thin and domain-oriented. (`src/app/page.tsx:23-35`, `src/app/record/page.tsx:4-11`, `src/app/notes/page.tsx:3-8`, `src/app/settings/page.tsx:3-8`, `src/app/meeting/[id]/page.tsx:7-10`)
- However, mutations and persistence are implemented in browser-side services instead of Server Actions. (`src/domains/meetings/services/meetings-repository.service.ts:39-89`, `src/domains/meetings/services/meeting-export.service.ts:4-13`)
- There is no React Query or Zustand in the installed dependency graph. (`package.json:20-76`)
- There are no `use server` files, no `schema.ts`/`*.schema.ts` domain schemas, and no Zod usage in `src/` (**verified tree/search evidence** from repo-wide `glob`/`grep` searches).

This mismatch matters because the migration target must be grounded in the **actual browser-local architecture**, not in the aspirational rules alone.

### 2.3 Runtime and package inventory relevant to migration

#### Framework/runtime packages actually installed

- `next@15.3.8`, `react@19.1.1`, `react-dom@19.1.1`. (`package.json:34-37`)
- Tailwind v4 stack: `tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`. (`package.json:50-75`)
- Storybook stack for web component development. (`package.json:27`, `package.json:40-49`, `package.json:71`)
- `lucide-react` for iconography. (`package.json:33`)
- `class-variance-authority` and `cnfast` for class composition. (`package.json:30-31`)
- Radix web UI primitives: `@radix-ui/react-select`, `@radix-ui/react-slot`. (`package.json:24-25`)

#### AI/runtime packages actually installed

- `browser-whisper@^1.1.0` for browser transcription. (`package.json:29`)
- `@browser-ai/web-llm@^2.1.8` and `@mlc-ai/web-llm@^0.2.84` for browser-side LLM execution. (`package.json:22`, `package.json:24`)
- `ai@^6.0.228` for AI SDK abstractions used in note generation. (`package.json:28`)

#### Packages notably absent

- `@tanstack/react-query`, `zustand`, `react-hook-form`, and `zod` are **not** installed. (`package.json:20-76`)

That absence is decisive: any migration recommendation that assumes existing server-state/query infrastructure or existing mobile-friendly schema layers would be fiction.

### 2.4 Web runtime configuration that affects migration

`next.config.ts` adds `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` **only** on `/record`, because `browser-whisper` needs cross-origin isolation there, while meeting-note generation intentionally avoids those headers to prevent cross-origin model-weight download breakage. (`next.config.ts:3-19`)

This is a strong signal that the current stack is not merely “local AI”; it is **browser-constraint local AI** with route-specific header requirements.

### 2.5 Shared shell and styling architecture

- `RootLayout` installs Google fonts through `next/font/google`, renders a sticky shell nav, then injects `OnboardingModal` globally after page content. (`src/app/layout.tsx:1-52`)
- `globals.css` imports Tailwind and global theme tokens, defines extensive CSS custom properties, and paints atmospheric background effects using `body::before` and `body::after`. (`src/app/globals.css:1-205`)
- `styles/main.css` imports reusable CSS files, including onboarding-specific BEM classes. (`src/styles/main.css:1-3`)

The visual system is therefore tied to Tailwind classes, CSS variables, pseudo-elements, and browser layout behavior. Mobile migration should preserve tokens and semantics, but not attempt a literal CSS port.

### 2.6 Data and feature seams already present in code

The most important existing seams are service-level, not app-level:

- persistence seam: `meetings-repository.service.ts`. (`src/domains/meetings/services/meetings-repository.service.ts:22-89`)
- capture seam: `recording-engine.service.ts`. (`src/domains/meetings/services/recording-engine.service.ts:33-214`)
- ASR seam: `transcription.service.ts`. (`src/domains/meetings/services/transcription.service.ts:21-67`)
- notes-generation seam: `notes-generation.service.ts`. (`src/domains/meetings/services/notes-generation.service.ts:141-227`)
- settings/prefs seam: `transcription-settings.ts` and `notes-settings.ts`. (`src/lib/transcription-settings.ts:22-89`, `src/lib/notes-settings.ts:9-49`)

These seams should drive the mobile architecture. They already express where adapters belong.

## 3. Route Map and Layer Migration Analysis

### 3.1 Current App Router surface

The current `src/app/` tree is intentionally small:

| Route           | Source                          | Current behavior                                                                               | Migration note                                                             |
| --------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `/`             | `src/app/page.tsx`              | Renders `DashboardHeader`, `QuickStartHero`, and `RecentMeetings`. (`src/app/page.tsx:1-36`)   | Becomes mobile dashboard/home screen.                                      |
| `/record`       | `src/app/record/page.tsx`       | Wraps `RecordingWorkspace` in `RecordingRequirementsGate`. (`src/app/record/page.tsx:1-12`)    | Separate stack screen; capability gating will need mobile-specific checks. |
| `/notes`        | `src/app/notes/page.tsx`        | Renders `NotesList`. (`src/app/notes/page.tsx:1-9`)                                            | Likely notes tab root.                                                     |
| `/settings`     | `src/app/settings/page.tsx`     | Renders `SettingsPanel`. (`src/app/settings/page.tsx:1-9`)                                     | Likely settings tab root.                                                  |
| `/meeting/[id]` | `src/app/meeting/[id]/page.tsx` | Awaits dynamic param and renders `MeetingDetailLoader`. (`src/app/meeting/[id]/page.tsx:1-10`) | Candidate detail stack screen, probably nested semantically under notes.   |

### 3.2 Global shell and navigation semantics

- `RootLayout` renders `TopNav` globally for every page. (`src/app/layout.tsx:37-49`)
- `TopNav` only exposes **Home**, **Meeting notes**, and **Settings**. (`src/components/layout/top-nav.tsx:16-35`)
- `TopNav` treats `/meeting/*` as active under the **notes** section, not as a first-class top-level route. (`src/components/layout/top-nav.tsx:23-28`)
- `QuickStartHero` launches recording through a dedicated link to `/record`. (`src/domains/meetings/components/organisms/quick-start-hero.tsx:26-31`)

This means the current information architecture is effectively:

1. Home/dashboard
2. Notes index and note detail
3. Settings
4. Record as an action flow launched from Home

### 3.3 Missing Next.js route-layer features

The current repository contains **no** `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `middleware.ts`, or `src/providers/` files (**verified tree/search evidence** from repo-wide glob searches). There is also no server API layer or auth middleware to translate to native.

That simplifies the first migration step: most work is UI/runtime replacement, not route-handler translation.

### 3.4 App Router to Expo Router mapping candidates

| Next.js file                    | Expo Router candidate                                        | Justification                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/layout.tsx`            | `app/_layout.tsx`                                            | Shared app shell, font setup replacement, onboarding injection point. (`src/app/layout.tsx:32-49`)                                     |
| `src/app/page.tsx`              | `app/(tabs)/index.tsx`                                       | Dashboard is top-level destination. (`src/app/page.tsx:23-35`)                                                                         |
| `src/app/notes/page.tsx`        | `app/(tabs)/notes.tsx`                                       | Notes is top-level destination and nav item. (`src/app/notes/page.tsx:3-8`, `src/components/layout/top-nav.tsx:23-28`)                 |
| `src/app/settings/page.tsx`     | `app/(tabs)/settings.tsx`                                    | Settings is top-level destination and nav item. (`src/app/settings/page.tsx:3-8`, `src/components/layout/top-nav.tsx:30-34`)           |
| `src/app/record/page.tsx`       | `app/record.tsx` or `app/(stack)/record.tsx`                 | Recording is launched from dashboard CTA, not persistent tab. (`src/domains/meetings/components/organisms/quick-start-hero.tsx:26-31`) |
| `src/app/meeting/[id]/page.tsx` | `app/notes/[id].tsx` **preferred** or `app/meeting/[id].tsx` | Current nav semantics classify meeting detail under notes. (`src/components/layout/top-nav.tsx:23-28`)                                 |

### 3.5 Layer migration by concern

#### Routing layer

Current route files are thin orchestrators, so routing is **Adapt**, not **Rewrite** at the architectural level. (`src/app/page.tsx:23-35`, `src/app/record/page.tsx:4-11`, `src/app/meeting/[id]/page.tsx:7-10`)

#### State and repository layer

Current async meeting data is loaded with `useEffect` + `useState` from a repository-like service. (`src/domains/meetings/components/organisms/recent-meetings.tsx:10-27`, `src/domains/meetings/components/organisms/notes-list.tsx:9-26`, `src/domains/meetings/components/organisms/meeting-detail-loader.tsx:26-47`)

This is exactly why **Zustand should not become the primary home for meetings/transcripts/notes**:

- project rules reserve Zustand for UI/client state. (`.opencode/knowledge/critical-constraints.md:174-187`, `.opencode/knowledge/critical-constraints.md:248-267`)
- meeting records are async persisted resources, not ephemeral UI state. (`src/domains/meetings/services/meetings-repository.service.ts:39-89`)
- the current hook that truly benefits from local state orchestration is `useRecording`, which manages transient session state, timers, muting, and reducer transitions in-memory. (`src/domains/meetings/hooks/use-recording.ts:37-240`, `src/domains/meetings/hooks/use-recording.ts:245-419`)

**Recommendation:** keep persisted meetings behind a repository/query seam; use Zustand, if introduced, only for recording session UI, shell state, or preferences that must outlive a single component tree.

#### UI layer

The UI depends on:

- Tailwind utility classes and CSS variables. (`src/app/globals.css:7-87`)
- Radix/shadcn web primitives in shared components. (`src/components/ui/button.tsx:1-60`, `src/components/ui/select.tsx:1-185`)
- DOM semantics such as `Link`, form inputs, `aria-pressed`, and fixed overlays. (`src/components/layout/top-nav.tsx:46-58`, `src/domains/settings/components/molecules/option-chips.tsx:29-49`, `src/domains/onboarding/components/organisms/onboarding-modal.tsx:42-109`)

This makes the UI layer a systematic **Adapt/Rewrite** to React Native + NativeWind, not a mechanical port.

#### Files/export layer

Browser export is implemented by creating object URLs and auto-clicking a generated anchor in `document.body`. (`src/domains/meetings/services/meeting-export.service.ts:4-13`)

On mobile, this becomes a document/share/file-system workflow, not a download workflow.

#### Permissions and capability layer

- `/record` is gated by `RecordingRequirementsGate`, which checks `RECORDING_REQUIREMENTS`. (`src/app/record/page.tsx:6-9`, `src/components/system/recording-requirements-gate.tsx:12-30`, `src/lib/system-capabilities.ts:37-48`)
- Those requirements include `secureContext`, `getUserMedia`, `mediaRecorder`, `audioContext`, `indexedDB`, and `webgpu`. (`src/lib/system-capabilities.ts:37-45`)

In Expo, the permission layer must be redesigned around native microphone/storage/runtime support; most current browser capability checks do not translate 1:1.

### 3.6 What is easier than it looks

- Route count is tiny.
- No auth flows to port.
- No upload APIs to port.
- No server actions or backend contracts to rebuild.

### 3.7 What is harder than it looks

- System audio capture on mobile is not equivalent to browser tab/system sharing.
- Browser-only AI stack is deeply coupled to WebGPU/WebCodecs/Web Workers and route-specific isolation.
- Local browser persistence and file export semantics must be redesigned for device storage and mobile sharing.

## 4. Meetings Domain Inventory (`src/domains/meetings/`)

### 4.1 Domain summary

The meetings domain contains:

- **messages:** 1 file. (`src/domains/meetings/messages.ts:1-224`)
- **types:** 3 files. (`src/domains/meetings/types/meeting.types.ts:1-14`, `src/domains/meetings/types/recording.types.ts:1-60`, `src/domains/meetings/types/meeting-detail.types.ts:1-73`)
- **hooks:** 1 file. (`src/domains/meetings/hooks/use-recording.ts:1-419`)
- **services:** 5 files. (`src/domains/meetings/services/meetings-repository.service.ts:1-89`, `src/domains/meetings/services/recording-engine.service.ts:1-214`, `src/domains/meetings/services/transcription.service.ts:1-67`, `src/domains/meetings/services/notes-generation.service.ts:1-227`, `src/domains/meetings/services/meeting-export.service.ts:1-93`)
- **components/templates:** 1 file. (`src/domains/meetings/components/templates/meeting-detail-view.tsx:1-42`)
- **components/organisms:** 14 files.
- **components/molecules:** 7 files.
- **components/atoms:** 18 files.

Absent categories:

- **stores:** none (**verified tree/search evidence** from recursive domain glob).
- **schemas:** none (**verified tree/search evidence** from repo-wide schema glob/grep).
- **Server Actions:** none (**verified tree/search evidence** from repo-wide `use server` grep).
- **tests:** none inside the domain (**verified tree/search evidence** from recursive domain glob).
- **stories:** none inside the domain (**verified tree/search evidence** from recursive domain glob).

### 4.2 Important end-to-end flow facts

- Dashboard loads stored meetings from IndexedDB via `listStoredMeetings()` inside `RecentMeetings`. (`src/domains/meetings/components/organisms/recent-meetings.tsx:14-27`, `src/domains/meetings/services/meetings-repository.service.ts:56-63`)
- Recording flow is `select mode -> start capture -> transcribe -> build stored meeting -> save meeting -> navigate to detail`. (`src/domains/meetings/hooks/use-recording.ts:319-360`, `src/domains/meetings/hooks/use-recording.ts:300-311`, `src/domains/meetings/components/organisms/recording-workspace.tsx:51-54`)
- Stored meetings persist `audioBlob`. (`src/domains/meetings/types/meeting-detail.types.ts:53-59`, `src/domains/meetings/hooks/use-recording.ts:147-164`)
- Newly built meetings save `participants: []`, so participants are currently empty persisted data, not captured metadata. (`src/domains/meetings/hooks/use-recording.ts:157-163`)
- Action item completion is ephemeral UI state only: `ActionItemCard` copies `item.done` into local `useState` and never persists updates back to storage. (`src/domains/meetings/components/molecules/action-item-card.tsx:13-19`, `src/domains/meetings/components/molecules/action-item-card.tsx:21-55`)
- `/record` is currently gated by browser capability requirements that include `webgpu`, so recording is blocked by more than microphone support today. (`src/lib/system-capabilities.ts:37-48`, `src/components/system/recording-requirements-gate.tsx:15-30`, `src/app/record/page.tsx:6-9`)
- The dashboard search input is visual only; it has no state, no handler, and no filtering path. (`src/domains/meetings/components/organisms/dashboard-header.tsx:21-27`)

### 4.3 Classification rubric

Each file is classified with the following rubric:

- **Reusable** — can move into shared core with no platform runtime dependency beyond TypeScript/portable business logic.
- **Adapt** — valuable logic/structure can survive, but the file directly depends on web or mobile-specific primitives and needs targeted refactoring.
- **Rewrite** — the file is primarily an implementation of platform runtime behavior or platform-shaped UI and should be re-authored against the target runtime.

Consistency rule used in this plan:

- if the file’s _core leverage_ is domain logic and the platform binding is peripheral, classify **Adapt**;
- if the file’s _core leverage_ is the platform binding itself, classify **Rewrite**.

### 4.4 File-by-file inventory

#### Messages

| File                               | Class        | Reason                                                                                                                       |
| ---------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/messages.ts` | **Reusable** | Pure product copy, label maps, formatter helpers, and defaults; no platform APIs. (`src/domains/meetings/messages.ts:4-224`) |

#### Types

| File                                                 | Class        | Reason                                                                                                                                                                        |
| ---------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/types/meeting.types.ts`        | **Reusable** | Pure meeting status/mode/value object types. (`src/domains/meetings/types/meeting.types.ts:1-14`)                                                                             |
| `src/domains/meetings/types/recording.types.ts`      | **Adapt**    | Mostly reusable recording state types, but `ChannelAnalysers` exposes `AnalyserNode`, which is browser-specific. (`src/domains/meetings/types/recording.types.ts:19-22`)      |
| `src/domains/meetings/types/meeting-detail.types.ts` | **Adapt**    | Domain model is mostly portable, but `StoredMeeting.audioBlob?: Blob` binds the persisted type to browser blobs. (`src/domains/meetings/types/meeting-detail.types.ts:53-59`) |

#### Hook

| File                                          | Class     | Reason                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/hooks/use-recording.ts` | **Adapt** | The reducer, session transitions, timecode formatting, and meeting assembly are portable, but the hook is still coupled to browser services, `window` timers, `URL.createObjectURL`, and `crypto.randomUUID`. (`src/domains/meetings/hooks/use-recording.ts:34-165`, `src/domains/meetings/hooks/use-recording.ts:263-317`, `src/domains/meetings/hooks/use-recording.ts:347-360`) |

#### Services

| File                                                           | Class       | Reason                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/services/meetings-repository.service.ts` | **Rewrite** | Entire implementation is IndexedDB-specific, including open/transaction/object-store mechanics. (`src/domains/meetings/services/meetings-repository.service.ts:3-89`)                                                                                                                  |
| `src/domains/meetings/services/recording-engine.service.ts`    | **Rewrite** | Depends on `MediaRecorder`, `AudioContext`, `MediaStream`, `getUserMedia`, and `getDisplayMedia`. (`src/domains/meetings/services/recording-engine.service.ts:15-214`)                                                                                                                 |
| `src/domains/meetings/services/transcription.service.ts`       | **Rewrite** | Uses dynamic import of `browser-whisper`, browser `File`, and browser-oriented model execution. (`src/domains/meetings/services/transcription.service.ts:26-67`)                                                                                                                       |
| `src/domains/meetings/services/notes-generation.service.ts`    | **Adapt**   | Parsing/prompt logic is reusable, but engine loading and execution depend on `@browser-ai/web-llm` + AI SDK browser/web runtime assumptions. (`src/domains/meetings/services/notes-generation.service.ts:21-130`, `src/domains/meetings/services/notes-generation.service.ts:155-227`) |
| `src/domains/meetings/services/meeting-export.service.ts`      | **Adapt**   | Markdown generation is portable, but actual export uses DOM anchor downloads and object URLs. (`src/domains/meetings/services/meeting-export.service.ts:4-13`, `src/domains/meetings/services/meeting-export.service.ts:18-93`)                                                        |

#### Template

| File                                                                | Class     | Reason                                                                                                                                                                  |
| ------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/components/templates/meeting-detail-view.tsx` | **Adapt** | Structural composition is portable, but layout and child components are web/Tailwind-based. (`src/domains/meetings/components/templates/meeting-detail-view.tsx:12-41`) |

#### Organisms

| File                                                                  | Class     | Reason                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/components/organisms/dashboard-header.tsx`      | **Adapt** | Pure presentation, but uses web `<input>` and current search is non-functional UI chrome only. (`src/domains/meetings/components/organisms/dashboard-header.tsx:13-29`)                                                                                     |
| `src/domains/meetings/components/organisms/quick-start-hero.tsx`      | **Adapt** | Presentation and mode summaries are portable, but CTA uses Next `Link` through `RecordButton`. (`src/domains/meetings/components/organisms/quick-start-hero.tsx:12-32`, `src/domains/meetings/components/atoms/record-button.tsx:24-45`)                    |
| `src/domains/meetings/components/organisms/recent-meetings.tsx`       | **Adapt** | Screen orchestration is portable, but it directly loads from browser repository and renders `Link`-based cards. (`src/domains/meetings/components/organisms/recent-meetings.tsx:10-55`, `src/domains/meetings/components/molecules/meeting-card.tsx:14-42`) |
| `src/domains/meetings/components/organisms/recording-workspace.tsx`   | **Adapt** | Good orchestration seam for mobile, but coupled to Next navigation, link back button, and browser recording pipeline. (`src/domains/meetings/components/organisms/recording-workspace.tsx:19-138`)                                                          |
| `src/domains/meetings/components/organisms/recording-stage.tsx`       | **Adapt** | Composition is portable, but it assumes analyser-driven live meters and web layout classes. (`src/domains/meetings/components/organisms/recording-stage.tsx:36-110`)                                                                                        |
| `src/domains/meetings/components/organisms/recording-processing.tsx`  | **Adapt** | UX flow is portable, but retry/download actions still assume browser result URLs and anchor downloads. (`src/domains/meetings/components/organisms/recording-processing.tsx:20-125`)                                                                        |
| `src/domains/meetings/components/organisms/notes-list.tsx`            | **Adapt** | Screen orchestration is portable, but it loads from browser repository and links into web detail routes. (`src/domains/meetings/components/organisms/notes-list.tsx:9-52`)                                                                                  |
| `src/domains/meetings/components/organisms/meeting-detail-loader.tsx` | **Adapt** | Loader logic is portable, but still tied to IndexedDB-backed lookup and browser `Blob` payloads. (`src/domains/meetings/components/organisms/meeting-detail-loader.tsx:13-60`)                                                                              |
| `src/domains/meetings/components/organisms/meeting-detail-header.tsx` | **Adapt** | Strong orchestration component, but uses Next navigation, DOM input editing, and browser repository/export services. (`src/domains/meetings/components/organisms/meeting-detail-header.tsx:49-270`)                                                         |
| `src/domains/meetings/components/organisms/meeting-notes.tsx`         | **Adapt** | Tabs and save flow are portable, but persistence still writes into browser repository and note generation remains browser-runtime dependent. (`src/domains/meetings/components/organisms/meeting-notes.tsx:30-74`)                                          |
| `src/domains/meetings/components/organisms/transcript-panel.tsx`      | **Adapt** | Pure transcript rendering logic is portable, but styling and semantics are web-specific. (`src/domains/meetings/components/organisms/transcript-panel.tsx:8-42`)                                                                                            |
| `src/domains/meetings/components/organisms/notes-generator.tsx`       | **Adapt** | Lifecycle and gating are portable, but generation depends on browser WebGPU capability checks and browser note-generation runtime. (`src/domains/meetings/components/organisms/notes-generator.tsx:27-171`)                                                 |
| `src/domains/meetings/components/organisms/ai-notes-panel.tsx`        | **Adapt** | Pure notes rendering with no external I/O, but still web/Tailwind presentation and checkbox child semantics. (`src/domains/meetings/components/organisms/ai-notes-panel.tsx:10-86`)                                                                         |
| `src/domains/meetings/components/organisms/meeting-sidebar.tsx`       | **Adapt** | Pure details rendering, but built from Tailwind/web presentational primitives. (`src/domains/meetings/components/organisms/meeting-sidebar.tsx:20-68`)                                                                                                      |

#### Molecules

| File                                                               | Class     | Reason                                                                                                                                                                                |
| ------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/components/molecules/action-item-card.tsx`   | **Adapt** | Visual and interaction logic is portable, but it is DOM checkbox UI with ephemeral local completion state. (`src/domains/meetings/components/molecules/action-item-card.tsx:13-55`)   |
| `src/domains/meetings/components/molecules/mode-selector.tsx`      | **Adapt** | Good portable prop contract, but uses button/ARIA semantics and Tailwind classes. (`src/domains/meetings/components/molecules/mode-selector.tsx:14-53`)                               |
| `src/domains/meetings/components/molecules/capture-channel.tsx`    | **Adapt** | Excellent mobile conceptually, but depends on analyser-driven waveform/meter atoms and DOM buttons. (`src/domains/meetings/components/molecules/capture-channel.tsx:41-122`)          |
| `src/domains/meetings/components/molecules/meeting-card.tsx`       | **Adapt** | Presentation is portable, but entry interaction uses Next `Link` and decorative waveform spans. (`src/domains/meetings/components/molecules/meeting-card.tsx:14-44`)                  |
| `src/domains/meetings/components/molecules/notes-tabs.tsx`         | **Adapt** | Tab contract is portable, but uses web buttons and CSS-based selection styling. (`src/domains/meetings/components/molecules/notes-tabs.tsx:10-35`)                                    |
| `src/domains/meetings/components/molecules/note-list-card.tsx`     | **Adapt** | Card semantics are portable, but route entry uses Next `Link` and Tailwind typography/layout. (`src/domains/meetings/components/molecules/note-list-card.tsx:12-69`)                  |
| `src/domains/meetings/components/molecules/recording-controls.tsx` | **Adapt** | Control composition is portable, but built from web button atoms and current timecode display assumptions. (`src/domains/meetings/components/molecules/recording-controls.tsx:13-42`) |

#### Atoms

| File                                                               | Class       | Reason                                                                                                                                                            |
| ------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/meetings/components/atoms/control-button.tsx`         | **Adapt**   | Generic control atom with portable props, but implemented as web `<button>` and class strings. (`src/domains/meetings/components/atoms/control-button.tsx:21-45`) |
| `src/domains/meetings/components/atoms/live-waveform.tsx`          | **Rewrite** | DOM span animation driven by `requestAnimationFrame` and `AnalyserNode` frequency data. (`src/domains/meetings/components/atoms/live-waveform.tsx:24-91`)         |
| `src/domains/meetings/components/atoms/capture-hint.tsx`           | **Adapt**   | Pure visual helper, but uses `lucide-react` and web layout. (`src/domains/meetings/components/atoms/capture-hint.tsx:7-14`)                                       |
| `src/domains/meetings/components/atoms/detail-row.tsx`             | **Adapt**   | Portable content row API, web flex/text implementation only. (`src/domains/meetings/components/atoms/detail-row.tsx:8-15`)                                        |
| `src/domains/meetings/components/atoms/recording-pill.tsx`         | **Adapt**   | Portable state badge semantics, web class implementation. (`src/domains/meetings/components/atoms/recording-pill.tsx:8-27`)                                       |
| `src/domains/meetings/components/atoms/note-heading.tsx`           | **Adapt**   | Portable section-heading API, web typography/spacing implementation. (`src/domains/meetings/components/atoms/note-heading.tsx:17-32`)                             |
| `src/domains/meetings/components/atoms/status-badge.tsx`           | **Adapt**   | Pure status display with portable props, but web classes. (`src/domains/meetings/components/atoms/status-badge.tsx:15-26`)                                        |
| `src/domains/meetings/components/atoms/icon-button.tsx`            | **Adapt**   | Generic icon action atom, but web button semantics. (`src/domains/meetings/components/atoms/icon-button.tsx:12-31`)                                               |
| `src/domains/meetings/components/atoms/waveform.tsx`               | **Adapt**   | Deterministic waveform math is portable, but rendered through styled DOM spans. (`src/domains/meetings/components/atoms/waveform.tsx:18-57`)                      |
| `src/domains/meetings/components/atoms/level-meter.tsx`            | **Rewrite** | Reads `AnalyserNode`, mutates DOM styles, and animates via `requestAnimationFrame`. (`src/domains/meetings/components/atoms/level-meter.tsx:24-88`)               |
| `src/domains/meetings/components/atoms/meeting-tag.tsx`            | **Adapt**   | Simple display atom, trivial to reimplement natively. (`src/domains/meetings/components/atoms/meeting-tag.tsx:5-10`)                                              |
| `src/domains/meetings/components/atoms/start-recording-button.tsx` | **Adapt**   | Portable CTA semantics with disabled state, but web button/Tailwind implementation. (`src/domains/meetings/components/atoms/start-recording-button.tsx:9-35`)     |
| `src/domains/meetings/components/atoms/record-button.tsx`          | **Rewrite** | Dual button/link implementation uses Next `Link`, hover animation, and layered DOM spans. (`src/domains/meetings/components/atoms/record-button.tsx:11-46`)       |
| `src/domains/meetings/components/atoms/timecode.tsx`               | **Adapt**   | Pure display of already-formatted values; easy RN rewrite. (`src/domains/meetings/components/atoms/timecode.tsx:7-18`)                                            |
| `src/domains/meetings/components/atoms/participant-avatar.tsx`     | **Adapt**   | Pure presentational mapping of participant color to visual token. (`src/domains/meetings/components/atoms/participant-avatar.tsx:9-31`)                           |
| `src/domains/meetings/components/atoms/mode-chip.tsx`              | **Adapt**   | Pure display atom, easy native rewrite. (`src/domains/meetings/components/atoms/mode-chip.tsx:9-16`)                                                              |
| `src/domains/meetings/components/atoms/mode-dot.tsx`               | **Adapt**   | Pure visual token atom, easy native rewrite. (`src/domains/meetings/components/atoms/mode-dot.tsx:15-25`)                                                         |
| `src/domains/meetings/components/atoms/meeting-name-field.tsx`     | **Adapt**   | Simple text input atom, but currently a raw web `<input>`. (`src/domains/meetings/components/atoms/meeting-name-field.tsx:9-27`)                                  |

### 4.5 Meetings migration takeaways

1. **Pure reusable core exists, but it is concentrated in types/messages/parsing/formatting, not in UI.**
2. **The dominant migration cost is services and orchestration, not route count.**
3. **A repository seam already exists; do not collapse it into Zustand.**
4. **Desktop/browser system-audio assumptions are load-bearing product behavior, not an implementation detail.** (`src/domains/meetings/messages.ts:53-57`, `src/domains/meetings/messages.ts:83-89`, `src/domains/meetings/services/recording-engine.service.ts:103-115`)

## 5. Onboarding Domain Inventory (`src/domains/onboarding/`)

### 5.1 Domain summary

The onboarding domain contains 8 actual files:

- messages: 1 (`src/domains/onboarding/messages.ts:1-11`)
- types: 1 (`src/domains/onboarding/types/onboarding-step.types.ts:1-7`)
- content: 1 (`src/domains/onboarding/content/onboarding-steps.ts:1-32`)
- hooks: 1 (`src/domains/onboarding/hooks/use-onboarding.ts:1-46`)
- atoms: 2 (`src/domains/onboarding/components/atoms/step-image.tsx:1-24`, `src/domains/onboarding/components/atoms/step-indicator.tsx:1-23`)
- molecules: 1 (`src/domains/onboarding/components/molecules/onboarding-step-panel.tsx:1-28`)
- organisms: 1 (`src/domains/onboarding/components/organisms/onboarding-modal.tsx:1-110`)

Absent categories:

- stores: none (**verified tree/search evidence**)
- schemas: none (**verified tree/search evidence**)
- Server Actions: none (**verified tree/search evidence**)
- tests: none (**verified tree/search evidence**)
- stories: none (**verified tree/search evidence**)

### 5.2 File-by-file inventory

| File                                                                    | Category | Class        | Reason                                                                                                                                                                            |
| ----------------------------------------------------------------------- | -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domains/onboarding/messages.ts`                                    | messages | **Reusable** | Pure copy and label formatter. (`src/domains/onboarding/messages.ts:1-11`)                                                                                                        |
| `src/domains/onboarding/types/onboarding-step.types.ts`                 | types    | **Reusable** | Pure TypeScript domain shape for onboarding content. (`src/domains/onboarding/types/onboarding-step.types.ts:1-7`)                                                                |
| `src/domains/onboarding/content/onboarding-steps.ts`                    | content  | **Reusable** | Static onboarding content decoupled from implementation. (`src/domains/onboarding/content/onboarding-steps.ts:7-32`)                                                              |
| `src/domains/onboarding/hooks/use-onboarding.ts`                        | hook     | **Adapt**    | Navigation flow is portable, but completion state is persisted through `localStorage`. (`src/domains/onboarding/hooks/use-onboarding.ts:5-45`)                                    |
| `src/domains/onboarding/components/atoms/step-image.tsx`                | atom     | **Adapt**    | Presentation contract is portable, but it uses web `<img>` and `lucide-react`. (`src/domains/onboarding/components/atoms/step-image.tsx:1-24`)                                    |
| `src/domains/onboarding/components/atoms/step-indicator.tsx`            | atom     | **Adapt**    | Step math is portable, but rendering relies on DOM spans and CSS classes. (`src/domains/onboarding/components/atoms/step-indicator.tsx:8-23`)                                     |
| `src/domains/onboarding/components/molecules/onboarding-step-panel.tsx` | molecule | **Adapt**    | Pure content composition, but implemented with web typography/layout primitives. (`src/domains/onboarding/components/molecules/onboarding-step-panel.tsx:10-28`)                  |
| `src/domains/onboarding/components/organisms/onboarding-modal.tsx`      | organism | **Rewrite**  | Uses `createPortal`, `document.body`, focus refs, `window` key listeners, and fixed overlay semantics. (`src/domains/onboarding/components/organisms/onboarding-modal.tsx:3-109`) |

### 5.3 Onboarding migration takeaways

- The domain is structurally clean and small.
- Most real value is in static content and the flow contract, not in current implementation weight.
- The only durable state is a single completion flag keyed as `meetly.onboarding.completed`. (`src/domains/onboarding/hooks/use-onboarding.ts:5-25`)
- The mobile port should preserve behavior but replace `localStorage` and portal/modal mechanics.

## 6. Settings Domain Inventory (`src/domains/settings/`)

### 6.1 Domain summary

The settings domain contains 5 actual files:

- messages: 1 (`src/domains/settings/messages.ts:1-20`)
- hooks: 2 (`src/domains/settings/hooks/use-transcription-settings.ts:1-38`, `src/domains/settings/hooks/use-notes-settings.ts:1-25`)
- molecules: 1 (`src/domains/settings/components/molecules/option-chips.tsx:1-56`)
- organisms: 1 (`src/domains/settings/components/organisms/settings-panel.tsx:1-98`)

Absent categories:

- stores: none (**verified tree/search evidence**)
- schemas: none (**verified tree/search evidence**)
- Server Actions: none (**verified tree/search evidence**)
- tests: none (**verified tree/search evidence**)
- stories: none (**verified tree/search evidence**)

### 6.2 File-by-file inventory

| File                                                           | Category | Class        | Reason                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------- | -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/domains/settings/messages.ts`                             | messages | **Reusable** | Pure settings copy/config object. (`src/domains/settings/messages.ts:1-20`)                                                                                                                                                                                              |
| `src/domains/settings/hooks/use-transcription-settings.ts`     | hook     | **Adapt**    | Good mobile hook contract, but values come from browser-specific `localStorage` helpers and `browser-whisper` model IDs. (`src/domains/settings/hooks/use-transcription-settings.ts:3-38`, `src/lib/transcription-settings.ts:22-89`)                                    |
| `src/domains/settings/hooks/use-notes-settings.ts`             | hook     | **Adapt**    | Good mobile hook contract, but persistence is browser `localStorage` through shared helper. (`src/domains/settings/hooks/use-notes-settings.ts:3-25`, `src/lib/notes-settings.ts:9-49`)                                                                                  |
| `src/domains/settings/components/molecules/option-chips.tsx`   | molecule | **Adapt**    | Reusable selection contract, but depends on DOM buttons, `aria-pressed`, `lucide-react`, and Tailwind classes. (`src/domains/settings/components/molecules/option-chips.tsx:19-56`)                                                                                      |
| `src/domains/settings/components/organisms/settings-panel.tsx` | organism | **Rewrite**  | Screen-level composition is simple, but it is tightly bound to current web styling and browser-model option sources. (`src/domains/settings/components/organisms/settings-panel.tsx:18-98`, `src/lib/transcription-settings.ts:53-89`, `src/lib/notes-settings.ts:9-49`) |

### 6.3 Settings migration takeaways

- Settings is conceptually a lightweight preferences screen, not a configuration subsystem.
- No validation, forms, or persistence abstraction exists yet.
- Model/language option catalogs already live outside the domain in shared `lib/` files, which is useful for shared-core extraction. (`src/lib/transcription-settings.ts:22-89`, `src/lib/notes-settings.ts:9-49`)

## 7. Shared Pure-Logic Extraction Strategy

### 7.1 Extraction principle

The right extraction target is **not** “shared components first.” The right extraction target is a **shared domain/application core** containing:

- stable types
- content/messages
- reducers/state machines
- formatting/parsing helpers
- option catalogs
- service interfaces (ports)

This follows the existing **candidate extraction seams** already present in the repository and avoids inventing abstractions without real leverage. The current repo already concentrates persistence, capture, ASR, and note-generation logic in separate concrete files, which makes them good seam candidates even though they are **not yet interchangeable adapters**. (`src/domains/meetings/services/meetings-repository.service.ts:39-89`, `src/domains/meetings/services/recording-engine.service.ts:33-214`, `src/domains/meetings/services/transcription.service.ts:21-67`, `src/domains/meetings/services/notes-generation.service.ts:141-227`)

### 7.2 Recommended extraction layers

#### A. Shared domain core (`shared/meetly-core` or equivalent)

Extract with minimal or no behavioral changes:

- `src/domains/meetings/messages.ts` (`Reusable`). (`src/domains/meetings/messages.ts:4-224`)
- `src/domains/meetings/types/meeting.types.ts`. (`src/domains/meetings/types/meeting.types.ts:1-14`)
- platform-neutral subset of `src/domains/meetings/types/meeting-detail.types.ts` excluding direct blob dependency, or replacing blob with a platform-neutral audio reference. (`src/domains/meetings/types/meeting-detail.types.ts:53-59`)
- platform-neutral subset of `src/domains/meetings/types/recording.types.ts` after removing `AnalyserNode` from shared contracts. (`src/domains/meetings/types/recording.types.ts:19-22`)
- pure helper slice from `use-recording.ts`: `channelsForMode`, `formatTimecode`, `formatDuration`, reducer/action/state shape, and a **refactored** `buildStoredMeeting` that receives `id`, `createdAt`, and pre-derived date labels instead of calling `crypto.randomUUID()` and `new Date()` internally. As implemented today, `buildStoredMeeting` is **not pure**. (`src/domains/meetings/hooks/use-recording.ts:107-165`, `src/domains/meetings/hooks/use-recording.ts:141-149`)
- `slugify`. (`src/utils/slug.util.ts:1-17`)
- portable export helpers: `notesToMarkdown`, `transcriptToMarkdown`. (`src/domains/meetings/services/meeting-export.service.ts:15-73`)
- portable note-generation helpers: `SYSTEM_PROMPT`, `buildPrompt`, `parseNotes`, `parseActionItem`, `stripBullet`, `isNone`. (`src/domains/meetings/services/notes-generation.service.ts:21-130`)
- onboarding content/types/messages. (`src/domains/onboarding/messages.ts:1-11`, `src/domains/onboarding/types/onboarding-step.types.ts:1-7`, `src/domains/onboarding/content/onboarding-steps.ts:7-32`)
- settings copy and option catalogs. (`src/domains/settings/messages.ts:1-20`, `src/lib/transcription-settings.ts:22-89`, `src/lib/notes-settings.ts:9-49`)

#### B. Application ports (`shared/meetly-ports` or same package)

Define ports around existing seam candidates:

- `MeetingRepositoryPort`
  - `saveMeeting`
  - `getMeeting`
  - `listMeetings`
  - `deleteMeeting`
  - `updateMeetingTitle`
  - `updateMeetingNotes`
- `AudioCapturePort`
  - `start(mode)`
  - `pause()`
  - `resume()`
  - `stop()`
  - `setMuted(channel, muted)`
  - optional level/waveform feed API
- `TranscriptionPort`
  - `transcribe(audio, options)`
- `NotesGenerationPort`
  - `generate(transcript, options)`
- `PreferencesPort`
  - onboarding completion
  - transcription language/model
  - notes model

Proposed critical contracts and invariants:

- `MeetingRepositoryPort`
  - `saveMeeting(meeting)` must be atomic for a single meeting record and overwrite by id deterministically.
  - `listMeetings()` must return newest-first ordering equivalent to current `createdAt` descending behavior. (`src/domains/meetings/services/meetings-repository.service.ts:56-63`)
  - `updateMeetingNotes(id, notes)` and `updateMeetingTitle(id, title)` are no-ops when the record is missing, matching current semantics. (`src/domains/meetings/services/meetings-repository.service.ts:71-89`)
- `AudioCapturePort`
  - `start(mode)` either yields a usable session or throws a typed start failure.
  - mute state changes must be ordered and observable by the orchestration layer.
  - `stop()` must resolve to a final recording artifact exactly once.
- `TranscriptionPort`
  - accepts a recorded audio artifact plus language/model options;
  - emits ordered progress and ordered transcript segments;
  - supports cancellation semantics if the implementation/runtime can abort work safely.
- `NotesGenerationPort`
  - accepts transcript turns in order;
  - can stream partial draft text and progress;
  - supports cancellation semantics during generation;
  - returns structured notes in the same logical shape as current `MeetingNotes`. (`src/domains/meetings/types/meeting-detail.types.ts:34-39`)
- `PreferencesPort`
  - stores onboarding completion, transcription language/model, and notes model with deterministic fallback defaults. (`src/lib/transcription-settings.ts:32-44`, `src/lib/transcription-settings.ts:72-86`, `src/lib/notes-settings.ts:32-45`, `src/domains/onboarding/hooks/use-onboarding.ts:5-28`)

Error model expectations:

- repository read/update/delete on missing records should prefer deterministic no-op or explicit not-found semantics rather than silent partial failure;
- capture/transcription/notes failures should remain typed enough to preserve current user-facing error mapping patterns. (`src/domains/meetings/hooks/use-recording.ts:242-243`, `src/domains/meetings/messages.ts:51-58`, `src/domains/meetings/messages.ts:189-199`)

Those ports are justified by existing concrete implementations already being isolated in separate files, but they should be treated as **planning seams**, not as proof that swappable adapters already exist. (`src/domains/meetings/services/meetings-repository.service.ts:39-89`, `src/domains/meetings/services/recording-engine.service.ts:48-214`, `src/domains/meetings/services/transcription.service.ts:26-67`, `src/domains/meetings/services/notes-generation.service.ts:179-227`, `src/lib/transcription-settings.ts:36-85`, `src/lib/notes-settings.ts:36-45`, `src/domains/onboarding/hooks/use-onboarding.ts:16-28`)

#### C. Platform adapters

- **Web adapters** wrap current implementations.
- **Expo adapters** replace browser implementations with native/mobile ones.

### 7.3 Proposed dependency direction

| Layer                    | Can depend on                                   | Must not depend on                                |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| Shared domain core       | nothing platform-specific                       | Next.js, React Native, browser globals, Expo APIs |
| Shared application ports | shared domain core                              | concrete adapters                                 |
| Web adapters             | shared domain core, ports, browser/Next runtime | Expo/mobile modules                               |
| Expo adapters            | shared domain core, ports, Expo/RN runtime      | browser/Next runtime                              |
| Web UI                   | shared domain core, ports, web adapters         | Expo/mobile UI                                    |
| Mobile UI                | shared domain core, ports, expo adapters        | Next/web UI                                       |

### 7.4 Dependency direction diagram

```text
                ┌─────────────────────────────┐
                │      Shared Domain Core     │
                │ types, messages, reducers,  │
                │ parsers, formatters         │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │     Application Ports       │
                │ repository/capture/asr/llm  │
                │ preferences interfaces      │
                └───────┬─────────────┬───────┘
                        │             │
          ┌─────────────▼───┐   ┌────▼─────────────┐
          │   Web Adapters   │   │   Expo Adapters  │
          │ IndexedDB/WebGPU │   │ SQLite/FileSys/  │
          │ MediaRecorder    │   │ mic/native AI    │
          └──────────┬───────┘   └────────┬─────────┘
                     │                    │
             ┌───────▼───────┐    ┌──────▼────────┐
             │   Next/Web UI  │    │   Mobile UI   │
             └───────────────┘    └───────────────┘
```

### 7.5 Shared components: what not to over-extract

Do **not** prioritize sharing presentational components like `TopNav`, `OnboardingModal`, `MeetingCard`, or `SettingsPanel`. Their contracts are not deep enough to justify a cross-platform abstraction yet, and their implementations are platform-shaped. (`src/components/layout/top-nav.tsx:37-63`, `src/domains/onboarding/components/organisms/onboarding-modal.tsx:11-109`, `src/domains/meetings/components/molecules/meeting-card.tsx:14-44`, `src/domains/settings/components/organisms/settings-panel.tsx:18-98`)

### 7.6 Shared state recommendation

If the mobile app later introduces Zustand, keep it constrained to:

- in-progress recording UI state
- global shell/nav state
- lightweight preferences caching

Do **not** use it as the source of truth for persisted meetings. That would violate the project’s own state strategy and make synchronization, hydration, and persistence harder. (`.opencode/knowledge/critical-constraints.md:174-187`, `src/domains/meetings/services/meetings-repository.service.ts:39-89`)

## 8. AI Mobile Feasibility and Alternatives

### 8.1 Current codebase AI stack

Meetly currently uses:

- `browser-whisper` for transcription. (`package.json:29`, `src/domains/meetings/services/transcription.service.ts:35-67`)
- `@browser-ai/web-llm` through its `webLLM(...)` helper for note generation. (`package.json:22`, `src/domains/meetings/services/notes-generation.service.ts:156-173`)
- `ai` `streamText()` to consume the model with a common API. (`package.json:28`, `src/domains/meetings/services/notes-generation.service.ts:183-220`)
- browser capability detection that explicitly checks WebGPU. (`src/lib/system-capabilities.ts:87-157`)

### 8.2 Documented facts from external sources (verified 2026-07-17)

#### Expo development and runtime facts

- Expo documents that **development builds** are required when you need your own native libraries and native configuration beyond Expo Go. Source: Expo development builds introduction, accessed 2026-07-17 — <https://docs.expo.dev/develop/development-builds/introduction/>.
- Expo Audio provides native microphone recording and optional background recording/playback, with config-plugin-driven permissions and service/background-mode setup. Source: Expo Audio docs, accessed 2026-07-17 — <https://docs.expo.dev/versions/latest/sdk/audio/>.
- Expo FileSystem provides device-local file and directory access, downloads/uploads, and document/cache storage APIs. Source: Expo FileSystem docs, accessed 2026-07-17 — <https://docs.expo.dev/versions/latest/sdk/filesystem/>.

#### AI SDK facts

- AI SDK has an official Expo quickstart that uses `expo/fetch` for streaming and documents polyfills such as `structuredClone`, `TextEncoderStream`, and `TextDecoderStream` for mobile runtimes. Source: AI SDK Expo quickstart, accessed 2026-07-17 — <https://ai-sdk.dev/docs/getting-started/expo>.
- AI SDK positions itself as a TypeScript abstraction over model providers and runtimes, not as a built-in on-device inference engine by itself. Source: AI SDK introduction, accessed 2026-07-17 — <https://ai-sdk.dev/docs/introduction>.
- **Version warning:** this repository currently installs `ai@^6.0.228`, not AI SDK 7. (`package.json:28`) The fetched public docs are latest-version docs and may describe capabilities or examples beyond the exact installed version. Exact Expo compatibility for the chosen `ai` version and any native adapters must therefore be validated in a kickoff compatibility matrix, not assumed from latest docs.

#### Current browser packages facts

- `browser-whisper` explicitly describes itself as **in-browser** transcription using **WebCodecs**, **WebGPU**, Web Workers, browser caching, and fallback behavior when some browser features are missing. It also requires COOP/COEP headers for threaded WASM on the page that loads it. Sources accessed 2026-07-17: <https://www.npmjs.com/package/browser-whisper>, <https://github.com/tanpreetjolly/browser-whisper>.
- WebLLM explicitly describes itself as a **high-performance in-browser LLM inference engine** using **WebGPU** and browser caches/workers. Sources accessed 2026-07-17: <https://webllm.mlc.ai/docs/>, <https://github.com/mlc-ai/web-llm>.

#### Native alternatives facts

- `whisper.rn` is a React Native binding of `whisper.cpp`; it requires prebuild/native integration for Expo use and supports asset/runtime model handling with platform-specific constraints. Source accessed 2026-07-17 — <https://github.com/mybigday/whisper.rn>.
- `llama.rn` is a React Native binding of `llama.cpp`, requires the **New Architecture** starting with v0.10, supports Expo through a plugin/config flow, and depends on GGUF/native model loading. Source accessed 2026-07-17 — <https://github.com/mybigday/llama.rn>.
- `react-native-executorch` supports on-device AI in React Native, but documents minimum platform versions (iOS 17 / Android 13) and New Architecture requirements, and shows Expo integration through native packages and resource fetchers. Source accessed 2026-07-17 — <https://github.com/software-mansion/react-native-executorch>.

### 8.3 Codebase-specific compatibility conclusions

#### A. `browser-whisper` is not a drop-in Expo replacement

This is a **documented fact** and code-supported conclusion:

- the package is in-browser and depends on browser runtime constructs such as workers, browser media/file handling, browser storage, and isolation-sensitive threaded WASM; external docs say so;
- Meetly’s implementation imports `BrowserWhisper` directly and wraps recorded browser `Blob` data into a browser `File`; (`src/domains/meetings/services/transcription.service.ts:35-45`)
- Next config adds COOP/COEP only for `/record` specifically to make that browser runtime viable. (`next.config.ts:3-19`)

Therefore, direct reuse inside Expo/Hermes is not viable. The seam can be preserved; the adapter cannot.

#### B. WebLLM / `@browser-ai/web-llm` is not a drop-in Expo replacement

Again, this is a **documented fact** and code-supported conclusion:

- WebLLM is documented as an in-browser WebGPU engine;
- Meetly’s service loads `webLLM(...)` dynamically and guards execution with browser capability checks centered on `doesBrowserSupportWebLLM()` and WebGPU. (`src/domains/meetings/services/notes-generation.service.ts:155-173`)

This means the existing LLM adapter is web-native, not React Native-native.

#### C. AI SDK is reusable as an abstraction, not as proof of local on-device parity

The current repo uses `streamText` after obtaining a browser-native local model adapter. (`src/domains/meetings/services/notes-generation.service.ts:183-220`)

That pattern can still work in Expo **if** there is a valid native model adapter behind it, or if the app moves to a cloud/hybrid provider. The AI SDK helps unify the API shape; it does not solve native inference by itself.

### 8.4 Expo Go vs development builds

- **Documented fact:** Expo development builds are required when the app needs custom native code. Source: <https://docs.expo.dev/develop/development-builds/introduction/> (accessed 2026-07-17).
- **Inference for this codebase:** any serious attempt to replace `browser-whisper` or WebLLM with `whisper.rn`, `llama.rn`, or ExecuTorch necessarily moves Meetly out of Expo Go and into development-build/native territory.

### 8.4.1 Kickoff compatibility validation matrix (required before implementation)

At implementation kickoff, validate and pin the following matrix in the delivery repo before committing to the mobile stack:

| Concern                              | Version(s) to pin and validate  | Why                                              |
| ------------------------------------ | ------------------------------- | ------------------------------------------------ |
| Expo SDK                             | chosen Expo SDK release         | native module compatibility boundary             |
| React Native                         | chosen RN version from Expo SDK | native architecture/runtime boundary             |
| Hermes / New Architecture            | enabled/disabled choice         | required by some native AI libraries             |
| `ai` package                         | installed AI SDK major/minor    | current repo is on v6, docs fetched may show v7  |
| `expo-audio` / `expo-file-system`    | exact SDK-compatible versions   | recording/storage behavior must match Expo SDK   |
| `whisper.rn`, `llama.rn`, ExecuTorch | exact candidate versions        | native AI viability depends on concrete versions |
| iOS / Android minimum OS targets     | exact supported matrix          | determines device eligibility and QA scope       |

This matrix is a **POC prerequisite**, not an implementation afterthought.

### 8.5 Feasible mobile AI options for Meetly

#### Phase 0 prerequisite — privacy/product approval before any cloud path

Before any cloud or hybrid implementation, product/privacy must approve one of these scenarios:

1. **Local-only required** — no transcript, audio, or notes content leaves device.
2. **Transcript-only cloud** — audio stays local; transcript or transcript chunks may be sent.
3. **Audio-upload cloud** — recorded audio may be uploaded for ASR and downstream note generation.
4. **Hybrid mixed policy** — for example, cloud transcription allowed, cloud notes optional, local export retained.

Cloud phases are blocked until one of those scenarios is explicitly approved because current onboarding promises local-only behavior. (`src/domains/onboarding/content/onboarding-steps.ts:27-30`)

#### Option 1 — Cloud transcription + cloud notes (lowest engineering risk)

**What changes:**

- mobile app records audio natively;
- uploads audio to backend/provider;
- backend transcribes and generates notes;
- mobile app stores result locally for offline reading.
- secure backend/API path becomes part of baseline scope, including provider credential protection, upload policy, retention/deletion controls, retries/idempotency, processing status, and observability/cost controls.

**Pros:**

- fastest delivery;
- avoids native model packaging, memory pressure, and thermal issues;
- easiest to support broad device matrix.

**Cons:**

- loses current “nothing leaves your device” product promise unless product policy changes; current onboarding explicitly promises local-only privacy. (`src/domains/onboarding/content/onboarding-steps.ts:27-30`)

#### Option 2 — Hybrid: local recording/storage + cloud AI (recommended risk-balanced baseline)

**What changes:**

- keep local-first capture and local meeting persistence;
- use cloud ASR and/or cloud notes generation as the first mobile AI backend;
- preserve repository and export flows locally;
- optionally add offline/native AI later behind the same ports.
- implement a backend transport boundary so provider keys never ship in the client.

**Pros:**

- preserves most product UX;
- dramatically lowers native AI complexity;
- supports incremental validation before betting on device inference.

**Cons:**

- privacy stance changes for AI steps;
- requires backend/provider integration absent today.

#### Option 3 — Native on-device ASR + native on-device notes (highest product fidelity, highest risk)

**What changes:**

- transcription replaced with `whisper.rn` or another native ASR path;
- note generation replaced with `llama.rn`, ExecuTorch, or similar;
- Expo development builds become mandatory;
- supported-device matrix becomes constrained by RAM, OS, architecture, and thermal budget.

**Pros:**

- closest to current local-first product story;
- avoids sending meeting content to servers.

**Cons:**

- highest implementation and QA cost;
- model download sizes can be large;
- cold start, RAM, thermals, and battery can become product blockers;
- backgrounding and long-running inference require deeper native/product validation.

### 8.5.1 Cloud/hybrid baseline architecture requirements

If cloud or hybrid AI is approved, the baseline architecture must include the following work items; otherwise the recommendation is under-scoped:

- **API transport boundary**
  - mobile client never holds provider API credentials;
  - requests go through a controlled backend or edge service;
  - all uploads/jobs carry idempotency keys and request correlation ids.
- **Upload policy**
  - define max audio duration/size;
  - define accepted codecs/container normalization path;
  - define whether uploads are direct-to-storage, proxy-through-backend, or chunked.
- **Processing model**
  - synchronous small-job path versus async job queue for larger files;
  - processing status endpoint/polling contract or push callback model;
  - retry semantics for network failure, duplicate submit, and partial provider failure.
- **Retention/deletion policy**
  - audio retention window;
  - transcript retention window;
  - deletion guarantees after success/failure/cancel;
  - auditability and privacy notice updates.
- **Consent/trust model**
  - explicit user consent copy before any upload if policy changes;
  - minimum device/session trust when auth is absent.
- **Observability and cost controls**
  - request logging without storing sensitive payloads by default;
  - provider cost ceilings and rate limits;
  - storage lifecycle rules;
  - dead-letter / failed-job recovery process.

Minimum no-auth trust model if accounts remain out of scope:

- anonymous device/session identifier generated client-side and rotated predictably;
- server-issued upload/job token per session or per request;
- coarse abuse controls (rate limit, file-size limit, duration limit, MIME validation, checksum validation);
- no assumption of user identity continuity across reinstalls.

If user accounts are later required, the plan changes materially:

- add authenticated upload ownership, per-user retention, subject deletion flows, and multi-device sync/security semantics;
- budget new backend auth/session work separately because no auth system exists today (**verified tree/search evidence**).

### 8.5.2 Privacy sequencing and authoritative scenario totals

To avoid ambiguity, this plan uses one authoritative set of scenario totals:

| Scenario                                       | Included work assumption                                                                                                                                    |  Low | Base | High |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---: | ---: | ---: |
| Recommended audio-upload cloud/hybrid baseline | Formal Phases 0-7 exactly as defined in Section 9                                                                                                           | 18.5 | 26.0 | 37.5 |
| Transcript-only cloud                          | Same formal Phases 0-7, with reduced backend/upload complexity versus full audio upload                                                                     | 17.0 | 24.5 | 36.0 |
| Local-only required                            | Same common Phases 0-4 and Phase 7, but replace the recommended cloud Phases 5-6 with a local/native production AI track; native-AI POCs/QA remain included | 24.0 | 32.0 | 45.5 |

The **recommended 26.0 pw base case** assumes **audio-upload cloud/hybrid approval**, because that is the safest engineering baseline for functional parity with transcript and notes generation. The authoritative **local-only totals** are **24.0 / 32.0 / 45.5 pw**.

### 8.6 Device, performance, and product constraints

#### Model size and storage

- `browser-whisper` docs cite approximate downloads from ~64 MB (`whisper-tiny`) to ~2.7 GB (`whisper-large-v3-turbo`). Source accessed 2026-07-17 — <https://www.npmjs.com/package/browser-whisper>.
- Current Meetly settings expose those model choices to users already. (`src/lib/transcription-settings.ts:53-72`)
- Current notes settings expose 1.5B, 2B, 3B, and 7B-class model IDs. (`src/lib/notes-settings.ts:9-32`)

**Inference for mobile:** on-device packaging/downloading is not a minor implementation detail; it is part of the product/storage UX.

#### RAM and thermal constraints

- `llama.rn` and ExecuTorch both imply non-trivial device capability constraints in their docs, including new architecture and platform minimums. Sources accessed 2026-07-17 — <https://github.com/mybigday/llama.rn>, <https://github.com/software-mansion/react-native-executorch>.
- Current web app exposes no native device matrix because the browser/runtime acts as the compatibility boundary. (`src/lib/system-capabilities.ts:122-157`)

**Inference for Meetly:** a native on-device AI path requires explicit supported-device policy, not just engineering optimism.

#### Background behavior

- Expo Audio documents background recording/playback options, but not a guarantee of background AI inference parity with the current desktop-web flow. Source accessed 2026-07-17 — <https://docs.expo.dev/versions/latest/sdk/audio/>.

**Conclusion:** microphone recording continuity may be possible; long-running ASR/LLM processing under real mobile background conditions still needs a POC and cannot be promised up front.

### 8.7 Microphone capture versus current system-audio capture

Current web behavior supports:

- microphone capture via `getUserMedia`; (`src/domains/meetings/services/recording-engine.service.ts:93-100`)
- system/tab audio capture via `getDisplayMedia`; (`src/domains/meetings/services/recording-engine.service.ts:103-115`)
- product copy explicitly says on macOS system audio means a **shared browser tab**, not native apps. (`src/domains/meetings/messages.ts:83-89`)

For mobile:

- microphone capture is feasible with native audio APIs;
- **system-audio capture parity is not established by the provided Expo/RN documentation and should be treated as unproven**.

Therefore, the migration plan must assume:

1. microphone capture is the safe baseline;
2. system-audio parity is a separate product/technical investigation;
3. any promise of “record both mic + system audio” on Expo before a platform-specific proof would be irresponsible.

### 8.8 WebView evaluation

WebView is **not** the default recommendation here.

Why not:

- current browser AI path depends on WebGPU/WebCodecs/worker/cross-origin-isolation assumptions documented by `browser-whisper` and WebLLM; sources accessed 2026-07-17 — <https://www.npmjs.com/package/browser-whisper>, <https://webllm.mlc.ai/docs/>.
- current app also relies on `/record`-scoped COOP/COEP headers. (`next.config.ts:3-19`)
- mobile WebViews typically introduce more uncertainty around media permissions, performance, backgrounding, and GPU/browser feature parity than a proper native path.

**Conclusion:** WebView could be considered only as a disposable experiment, not as the recommended migration architecture.

### 8.9 Recommended AI stance for this migration

1. **Mobile AI baseline:** build the mobile app with local recording, local persistence, and a pluggable AI seam.
2. **Recommended delivery baseline:** use an approved cloud or hybrid backend for transcription/notes.
3. **Optional native-AI track:** only pursue native on-device AI after dedicated POCs prove acceptable latency, storage footprint, thermal behavior, and supported-device coverage.

## 9. Phased Migration Plan, Dependencies, and Effort

### 9.1 Recommended migration strategy

**Recommendation: gradual migration, not full greenfield rewrite and not WebView.**

Why:

- route surface is small and feature seams are already explicit, so a strangler-style shared-core extraction is feasible; (`src/app/page.tsx:23-35`, `src/domains/meetings/services/meetings-repository.service.ts:39-89`)
- browser-only adapters are the real problem, not product structure; (`src/domains/meetings/services/recording-engine.service.ts:15-214`, `src/domains/meetings/services/transcription.service.ts:26-67`, `src/domains/meetings/services/notes-generation.service.ts:155-227`)
- a direct full rewrite would force simultaneous decisions on UI, persistence, capture, ASR, notes, export, and device policy, which is unnecessarily risky;
- WebView does not reliably solve the browser AI/runtime assumptions already encoded into `next.config.ts` and current services. (`next.config.ts:3-19`)

### 9.2 Phase plan for the recommended baseline

| Phase     | Scope                                                                                                                          | Dependencies |      Low |     Base |     High |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------: | -------: | -------: |
| 0         | Privacy/product decision, trust model, legal/retention policy, scenario selection                                              | none         |      1.0 |      1.5 |      2.0 |
| 1         | Shared-core extraction, minimal test runner, and target architecture skeleton                                                  | Phase 0      |      3.0 |      3.5 |      4.0 |
| 2         | Expanded test/CI mobile harness + Expo shell + Expo Router + NativeWind/token migration                                        | Phases 0-1   |      2.0 |      3.0 |      4.5 |
| 3         | Local persistence, onboarding, settings, export/share replacement                                                              | Phases 1-2   |      2.0 |      3.0 |      4.5 |
| 4         | Recording baseline: microphone capture, permissions, restart/detail/share flows                                                | Phases 1-3   |      3.0 |      4.0 |      6.0 |
| 5         | Secure cloud/hybrid backend path: upload/API transport, jobs, observability, cost controls, retention/deletion, consent wiring | Phases 0-4   |      3.0 |      4.5 |      7.0 |
| 6         | Mobile AI client integration + retry/offline/partial failure handling + integration/device E2E                                 | Phases 2-5   |      2.5 |      3.5 |      5.5 |
| 7         | Native AI POCs, compatibility matrix, device matrix, QA hardening, release gates                                               | Phases 2-6   |      2.0 |      3.0 |      4.0 |
| **Total** |                                                                                                                                |              | **18.5** | **26.0** | **37.5** |

**Arithmetic check:**

- Low = 1.0 + 3.0 + 2.0 + 2.0 + 3.0 + 3.0 + 2.5 + 2.0 = **18.5**
- Base = 1.5 + 3.5 + 3.0 + 3.0 + 4.0 + 4.5 + 3.5 + 3.0 = **26.0**
- High = 2.0 + 4.0 + 4.5 + 4.5 + 6.0 + 7.0 + 5.5 + 4.0 = **37.5**

### 9.3 Phase details

#### Phase 0 — Privacy/product prerequisite and scenario approval (1.5 pw base)

Deliverables:

- approve one privacy scenario from Section 8.5;
- define upload/retention/deletion policy if any cloud path is accepted;
- define minimum anonymous device/session trust model if auth remains out of scope;
- define consent/disclosure changes required by product/privacy/legal.

This phase is a hard prerequisite for any cloud or hybrid implementation.

#### Phase 1 — Shared-core extraction, minimal test runner, and target architecture skeleton (3.5 pw base)

Deliverables:

- minimal deterministic unit-test runner setup before any behavior-changing extraction;
- CI guard against focused/skipped-only tests before extraction begins;
- extract shared types/messages/helpers/option catalogs;
- define repository/capture/transcription/notes/preferences ports;
- normalize platform-neutral meeting model contracts;
- remove browser-specific types from shared interfaces.

Why first:

- this is the highest-leverage de-risking step;
- it establishes executable tests in the correct order before code movement begins;
- it allows web and mobile to coexist while implementations diverge safely.

#### Phase 2 — Expanded mobile test/CI harness plus Expo shell and UI foundation (3.0 pw base)

Deliverables:

- mobile-focused integration/E2E harness expansion on top of the minimal Phase 1 runner;
- Expo app bootstrap with development-build-ready assumptions;
- Expo Router structure aligned to current IA;
- NativeWind/token migration strategy from `globals.css` theme values;
- replacement of shell navigation and base screen scaffolds.

Technical focus:

- map `TopNav` semantics to tabs/stack architecture; (`src/components/layout/top-nav.tsx:16-35`)
- port visual language, not literal CSS pseudo-elements; (`src/app/globals.css:171-204`)
- replace shared web components that are Radix-dependent. (`src/components/ui/button.tsx:1-60`, `src/components/ui/select.tsx:1-185`)

#### Phase 3 — Persistence, onboarding, settings, export/share (3.0 pw base)

Deliverables:

- mobile persistence implementation for meetings;
- mobile preferences implementation for onboarding/settings;
- mobile export/share flow replacing browser downloads;
- migrated onboarding and settings screens;
- contract tests for repository/preferences/export seams.

Technical focus:

- replace IndexedDB with mobile storage implementation;
- replace `localStorage` preferences and completion flag;
- replace `document.createElement('a')` export flow with file/share workflow. (`src/domains/meetings/services/meeting-export.service.ts:4-13`)

#### Phase 4 — Recording baseline (4.0 pw base)

Deliverables:

- microphone-only capture baseline;
- permission UX and unsupported-state UX;
- local save -> detail -> restart -> share flow end-to-end on device;
- waveform/meter UX approximation or redesign based on available native audio sampling.

Technical focus:

- replace `RecordingEngine` browser graph;
- preserve reducer/state semantics from `useRecording`;
- explicitly drop or gate system-audio capture until proven. (`src/domains/meetings/services/recording-engine.service.ts:91-129`)

#### Phase 5 — Secure cloud/hybrid backend path (4.5 pw base)

Deliverables:

- backend/API transport for the approved cloud/hybrid scenario;
- provider credential protection off-device;
- upload policy: file-size, duration, MIME/codec, checksum, and retry constraints;
- request/session trust envelope for anonymous devices if accounts remain absent;
- idempotent submission semantics and processing status contract;
- retention/deletion controls for uploaded audio/transcript artifacts;
- observability, rate limiting, cost controls, and failure recovery.

This work is included in the recommended baseline because otherwise the cloud/hybrid recommendation would be under-scoped.

#### Phase 6 — Mobile AI client integration and resilience (3.5 pw base)

Deliverables:

- transcript generation via the chosen approved mobile-safe backend path;
- notes generation via the chosen backend/provider path;
- progress UX, retries, persistence, and offline degradation behavior;
- mocked external AI integration tests and device E2E for retry and partial-failure flows.

Technical focus:

- preserve current UX contracts where sensible: progress, live/draft feedback, retry paths. (`src/domains/meetings/components/organisms/recording-processing.tsx:76-121`, `src/domains/meetings/components/organisms/notes-generator.tsx:95-135`)
- keep AI behind ports so native/local alternatives remain possible;
- verify duplicate submit, offline retry, transcript success + notes failure, and restart recovery behavior.

#### Phase 7 — Native AI POCs, compatibility matrix, QA hardening, release gates (3.0 pw base)

Deliverables:

- POCs for native ASR and/or native notes inference;
- device support matrix and go/no-go report;
- regression QA across supported devices and audio scenarios;
- final release-readiness criteria for native AI promotion beyond POC.

This phase is where on-device AI should be judged, not assumed.

### 9.3.1 Automated testing and quality gates by phase

| Phase | Automated strategy                                                                                                                 | Quality gate                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1     | minimal deterministic unit tests for reducers, formatters, parsers, markdown conversion, and option helpers; focused-test CI guard | extraction starts only after the runner works and CI blocks focused tests |
| 2     | shell/navigation smoke tests plus expanded mobile harness wiring                                                                   | app shell boots in test harness and mobile-targeted CI path runs          |
| 3     | contract tests against repository/preferences/export implementations; restart/storage/share integration tests                      | equivalent supported semantics across web/mobile implementations          |
| 4     | permission/storage/restart/share integration tests; device E2E for record -> persist -> restart -> detail -> share                 | baseline recording flow passes on one iOS and one Android target          |
| 5     | backend API tests for validation, idempotency, retention, job status, provider failure mapping, and observability hooks            | secure transport path passes oversize/duplicate/failure scenarios         |
| 6     | mocked external AI integration tests for offline, retry, and partial AI failures; device E2E for AI retry                          | record -> process -> persist -> retry path is stable                      |
| 7     | native AI POC benchmarks and soak tests                                                                                            | native AI proceeds only if device/latency/thermal gates pass              |

### 9.4 Parallelizable work

Potential parallel lanes once Phase 1 defines shared contracts:

- late-Phase-2 preparatory analysis for persistence/preferences migration (for example storage mapping, fixture design, and repository contract test drafting) can overlap with shell work, but **formal Phase 3 implementation still starts only after Phase 2 exit criteria are met**, consistent with the dependency table.
- Recording UX/UI work can overlap with mobile repository implementation once the repository seam contract is stable.
- Formal Phase 5 implementation begins only after Phases 0–4 meet their exit criteria; after Phase 0 approval, only non-implementation preparation such as provider evaluation, threat modeling, and retention-policy drafting may overlap with earlier phases.
- AI client integration (Phase 6) can overlap with later QA hardening once backend status/retry contracts are frozen.

### 9.5 Scenario totals relative to the recommended baseline

The recommended **26.0 pw** base case assumes **audio-upload cloud/hybrid approval**.

Authoritative scenario totals used in this plan:

| Scenario                                       | Included work assumption                                                                                                                                    |  Low | Base | High |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---: | ---: | ---: |
| Recommended audio-upload cloud/hybrid baseline | Formal Phases 0-7 exactly as defined above                                                                                                                  | 18.5 | 26.0 | 37.5 |
| Transcript-only cloud                          | Same formal Phases 0-7, with reduced backend/upload complexity versus full audio upload                                                                     | 17.0 | 24.5 | 36.0 |
| Local-only required                            | Same common Phases 0-4 and Phase 7, but replace the recommended cloud Phases 5-6 with a local/native production AI track; native-AI POCs/QA remain included | 24.0 | 32.0 | 45.5 |

#### 9.5.1 Auditable decomposition formulas

**Common work included in both recommended and local-only scenarios**

- Formal Phases **0 + 1 + 2 + 3 + 4 + 7**
- Low = 1.0 + 3.0 + 2.0 + 2.0 + 3.0 + 2.0 = **13.0 pw**
- Base = 1.5 + 3.5 + 3.0 + 3.0 + 4.0 + 3.0 = **18.0 pw**
- High = 2.0 + 4.0 + 4.5 + 4.5 + 6.0 + 4.0 = **25.0 pw**

**Recommended cloud/hybrid replacement track**

- Formal Phases **5 + 6**
- Low = 3.0 + 2.5 = **5.5 pw**
- Base = 4.5 + 3.5 = **8.0 pw**
- High = 7.0 + 5.5 = **12.5 pw**

**Recommended baseline formula**

- Low = common 13.0 + cloud/hybrid track 5.5 = **18.5 pw**
- Base = common 18.0 + cloud/hybrid track 8.0 = **26.0 pw**
- High = common 25.0 + cloud/hybrid track 12.5 = **37.5 pw**

**Local-only native-AI replacement track**

- This track **replaces formal Phases 5 and 6** from the recommended baseline.
- It represents the additional work required to deliver production-capable local transcription and local notes instead of the cloud/hybrid backend + mobile AI client integration path, while still keeping Phase 7 native-AI validation/QA in the common bucket.
- Low = **11.0 pw**
- Base = **14.0 pw**
- High = **20.5 pw**

**Local-only formula**

- Low = common 13.0 + local-only native-AI track 11.0 = **24.0 pw**
- Base = common 18.0 + local-only native-AI track 14.0 = **32.0 pw**
- High = common 25.0 + local-only native-AI track 20.5 = **45.5 pw**

**Local-only delta versus recommended baseline**

- Low delta = 24.0 - 18.5 = **+5.5 pw**
- Base delta = 32.0 - 26.0 = **+6.0 pw**
- High delta = 45.5 - 37.5 = **+8.0 pw**

This means the authoritative **local-only totals** are:

- Low: **24.0 pw**
- Base: **32.0 pw**
- High: **45.5 pw**

Those totals assume:

- no cloud upload/job backend is built for AI processing;
- production-capable local transcription and local note generation are pursued instead of the recommended cloud/hybrid path;
- the native-AI validation/QA phase remains included, because local-only is inseparable from native runtime proof.

### 9.6 Work intentionally excluded from the base estimate

The 26.0 pw base estimate **does not** assume full production-grade native on-device ASR + native LLM shipping on all target devices. It assumes:

- mobile shell is delivered;
- local recording/persistence flows work;
- AI works through the approved safer baseline path (cloud or hybrid);
- native AI remains validated through POCs and decision gates before full commitment.

### 9.7 Auth, upload, and backend scope note

No current auth layer exists in the repository (**verified tree/search evidence** from repo-wide auth globs). This revised plan **does include** the secure backend/upload/job path required by the recommended cloud/hybrid baseline, but it assumes the minimum anonymous device/session trust model from Section 8.5.1. If the product later requires user accounts, identity-bound storage, or cross-device sync, that is additional scope beyond the current recommended baseline.

## 10. Final Recommendation, Risks, Decision Gates, and POC Criteria

### 10.1 Final recommendation

Adopt a **gradual Expo migration with Phase 0 privacy/product approval first, shared-core extraction second, and a complete cloud/hybrid baseline third**, while explicitly treating native on-device AI and system-audio capture as **phase-gated investigations**, not guaranteed deliverables.

This recommendation is driven by code facts:

- the app is already organized around seam candidates worth preserving; (`src/domains/meetings/services/meetings-repository.service.ts:39-89`, `src/domains/meetings/services/recording-engine.service.ts:33-214`)
- the current AI and recording implementations are browser-native and must be replaced, not ported; (`src/domains/meetings/services/transcription.service.ts:35-67`, `src/domains/meetings/services/notes-generation.service.ts:155-227`, `next.config.ts:3-19`)
- no auth, server actions, schemas, or cloud upload system currently exist, so if cloud/hybrid AI is approved the backend path must be built deliberately rather than assumed away (**verified tree/search evidence**).

### 10.2 What I do **not** recommend

#### Not recommended: immediate full rewrite with native on-device AI as the default scope

Reason: too many unknowns land at once — capture parity, model packaging, RAM/thermal behavior, background execution, privacy/product constraints, and device support.

#### Not recommended: WebView-based “reuse the browser app” strategy

Reason: current web app depends on browser isolation headers, WebGPU/WebCodecs assumptions, and desktop-style media semantics. (`next.config.ts:3-19`, `src/domains/meetings/services/recording-engine.service.ts:103-115`)

### 10.3 Top risk register

1. **System-audio parity risk**
   - Current value proposition includes mic/system/mix modes. (`src/domains/meetings/types/meeting.types.ts:3`, `src/domains/meetings/messages.ts:100-104`)
   - Mobile proof is absent.

2. **Native AI viability risk**
   - Existing AI runtime is browser-native. (`src/domains/meetings/services/transcription.service.ts:35-67`, `src/domains/meetings/services/notes-generation.service.ts:155-227`)
   - Native replacements imply tighter device constraints and deeper native integration.

3. **Privacy-position risk**
   - Current onboarding explicitly promises no servers/no uploads/no accounts. (`src/domains/onboarding/content/onboarding-steps.ts:27-30`)
   - Any hybrid/cloud baseline changes that statement and needs explicit product approval before implementation.

4. **Cloud baseline operational risk**
   - once cloud/hybrid is approved, upload limits, retention, retries, and provider cost controls become production risks, not implementation details.

5. **State-management drift risk**
   - pushing async persisted meetings into Zustand would conflict with project rules and obscure the repository seam. (`.opencode/knowledge/critical-constraints.md:174-187`, `src/domains/meetings/services/meetings-repository.service.ts:39-89`)

### 10.4 Mandatory decision gates before committing to implementation

#### Gate A — Privacy/product gate (Phase 0)

Choose one approved scenario from Section 8.5 before any cloud/hybrid implementation starts.

#### Gate B — System-audio product gate

Decide whether mobile launch requires:

- mic-only capture,
- mic + imported audio,
- or true system-audio capture parity.

#### Gate C — Compatibility matrix gate

Pin and validate the version matrix from Section 8.4.1 at project kickoff.

#### Gate D — Device support gate

Define target minimums:

- iOS versions/devices
- Android versions/devices
- storage expectations for downloaded models
- performance thresholds for recording/transcription/note generation

### 10.5 POC criteria

#### POC 1 — Mobile recording baseline

Success criteria:

- record microphone audio on iOS and Android;
- persist locally;
- reopen detail screen after app restart;
- export/share recorded audio.

Failure criteria:

- unstable permissions;
- unusable audio quality;
- persistence loss across restart.

#### POC 2 — Approved cloud/hybrid AI baseline

Success criteria:

- transcript and notes generation work end-to-end from mobile recording;
- provider credentials remain server-side;
- progress, retry, idempotency, and persistence match current user expectations reasonably;
- acceptable latency on real devices and networks.

Failure criteria:

- privacy/product rejection;
- unacceptable latency or cost envelope;
- insecure credential or retention design.

#### POC 3 — Native ASR viability

Candidate path: `whisper.rn` or another native ASR engine.

Success criteria:

- acceptable cold-start and first-model-download UX;
- acceptable transcription latency on target devices;
- no catastrophic thermal/battery behavior in a 20–30 minute recording test;
- app binary/model storage impact is acceptable.

Failure criteria:

- device support too narrow;
- memory crashes;
- poor transcription latency/quality tradeoff.

#### POC 4 — Native note-generation viability

Candidate path: `llama.rn` or ExecuTorch-backed small note model.

Success criteria:

- concise meeting-note generation on target devices within acceptable latency;
- stable memory usage;
- manageable model download size;
- acceptable battery/thermal profile.

Failure criteria:

- requires too-new devices only;
- generation latency destroys UX;
- model storage/packaging is unacceptable.

### 10.6 Recommended target architecture after migration

#### Mobile app responsibilities

- screen routing and UI
- microphone recording
- local meeting persistence
- local onboarding/settings/preferences
- export/share
- async orchestration around repository and AI ports

#### Shared core responsibilities

- domain models
- meeting/session reducers and helper logic
- parsing/formatting
- content/messages
- application ports

#### Runtime implementations

- web implementation: current browser-local behavior
- mobile implementation: Expo/native runtime behavior
- AI implementation: approved cloud/hybrid path first, native later only if proven

### 10.7 Closing position

Meetly is a good candidate for mobile migration **because the feature set is focused and the code already exposes useful seam candidates**. It is a bad candidate for a naïve “just port the React app to React Native” approach **because the hard parts are not JSX; they are browser-only capture, browser-only AI, browser-local persistence assumptions, and—if cloud/hybrid is approved—the newly required secure backend path**. (`src/domains/meetings/services/recording-engine.service.ts:33-214`, `src/domains/meetings/services/transcription.service.ts:21-67`, `src/domains/meetings/services/notes-generation.service.ts:141-227`, `src/domains/meetings/services/meetings-repository.service.ts:22-89`)

## 11. Evidence Appendix

### 11.1 Repository snapshot

- **Commit SHA inspected:** `70a07b1930d1fee172c171b479644ac1ea12d586`
- **Dirty-tree caveat:** the working tree was not clean during analysis. At inspection time, `git status --short` showed modified onboarding/layout/style files and an untracked `.opencode/plans/` directory. This plan therefore reflects the repository **as currently checked out**, not necessarily a pristine committed state.

### 11.2 Reproducible evidence queries used for absence claims

The following repository-aware queries were used during analysis:

- `glob("src/**/*route.ts")` — verified no route handlers.
- `glob("src/**/loading.tsx")` — verified no loading boundaries.
- `glob("src/**/error.tsx")` — verified no route error boundaries.
- `glob("src/**/not-found.tsx")` — verified no not-found boundaries.
- `glob("src/**/middleware.ts")` — verified no middleware.
- `glob("src/providers/**/*")` — verified no providers directory content.
- `glob("src/domains/*/actions*.ts")` and `grep(/^['\" ]*use server['\"]/ in src/**/*.ts* )` — verified no Server Actions.
- `glob("src/domains/*/*.schema.ts")`, `glob("src/domains/*/schema.ts")`, and `grep(/from 'zod'|z\.object\(/ in src/**/*.ts* )` — verified no Zod schemas.
- `grep(/from '@tanstack/react-query'|useQuery\(|useMutation\(/ in src/**/*.ts* )` — verified no React Query usage.
- `grep(/from 'zustand'|create\(/ in src/**/*.ts* )` combined with dependency inventory — verified no Zustand usage.
- recursive `glob("src/domains/meetings/**/*")`, `glob("src/domains/onboarding/**/*")`, and `glob("src/domains/settings/**/*")` — used to enumerate every actual domain file exactly once.

### 11.3 Inventory coverage verification

After drafting, domain file coverage was cross-checked against the live tree so that:

- all 50 meetings-domain files are represented once;
- all 8 onboarding-domain files are represented once;
- all 5 settings-domain files are represented once.

This appendix intentionally excludes secret material and irrelevant contents from other dirty files.
