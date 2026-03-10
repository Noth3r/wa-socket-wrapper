# wa-socket: Baileys-Based WhatsApp REST API Server

## TL;DR

> **Quick Summary**: Build a production-ready TypeScript + Express.js REST API server wrapping Baileys (WebSocket-based WhatsApp library) with multi-session support, replicating all features of wwebjs-api (~120+ endpoints) but with improved API design — no Chromium dependency.
> 
> **Deliverables**:
> - Complete REST API server with 100+ endpoints across 8 route groups
> - Multi-session WhatsApp management via Baileys
> - Webhook + WebSocket + SSE event delivery system
> - Media handling (send/receive images, videos, audio, documents)
> - Group, contact, chat, message management APIs
> - Best-effort channel/newsletter support via Baileys events
> - QR code + pairing code authentication
> - Swagger/OpenAPI documentation
> - Docker support (Dockerfile + docker-compose)
> - Full TDD test suite with vitest
> 
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Task 1 → Task 2 → Task 5 → Task 8 → Task 14 → Task 18 → Task 22 → Final

---

## Context

### Original Request
"I want to create wa-bot using baileys to replicate rest api wrapper for whatsapp-web.js (wwebjs-api). Baileys using websocket not chromium, so it's more lightweight."

### Interview Summary
**Key Discussions**:
- **Language/Runtime**: TypeScript + Node.js (user selected)
- **HTTP Framework**: Express.js (user selected, recommended)
- **Multi-session**: Yes — multiple WhatsApp accounts simultaneously, each with session ID
- **API Compatibility**: "Similar but improved" — same feature coverage as wwebjs-api, better design where appropriate (NOT 1:1 drop-in replacement)
- **Core library**: Baileys (`@whiskeysockets/baileys`) via WebSocket — no Chromium
- **Test strategy**: TDD — vitest framework, RED-GREEN-REFACTOR
- **Channel support**: Best-effort using Baileys newsletter events, skip unsupported ones

**Research Findings**:
- wwebjs-api has 120+ endpoints across 8 route groups (session, client, message, chat, groupChat, contact, channel, health)
- Baileys v7+ removed `makeInMemoryStore` — custom store implementation needed
- Key Baileys differences: no getChats/getContacts built-in (need custom store), no Puppeteer (no screenshot endpoint), auth via `useMultiFileAuthState`, events via `sock.ev.on()`
- 26 webhook events mapped — 21 direct maps, 3 gaps (message_revoke_me, call, media_uploaded), 2 drops (message_ciphertext, loading_screen)
- Per-session webhook URLs should be first-class (not env var hacks like wwebjs-api)
- SSE for QR delivery recommended as improvement over polling

### Metis Review
**Identified Gaps** (addressed):
- **Custom store needed**: Baileys v7 removed `makeInMemoryStore` — plan includes custom store implementation with chat/contact/message caching from history sync events
- **Webhook event mapping**: 3 events have no Baileys equivalent — documented as unsupported in API docs
- **Call events**: Baileys lacks call event support — excluded from scope, documented
- **Rate limiting for WhatsApp**: Need internal rate limiting for Baileys operations (not just Express rate limiting) to avoid bans
- **Reconnection strategy**: Must handle Baileys disconnect reasons properly with exponential backoff
- **JID format handling**: Baileys uses `number@s.whatsapp.net` format — need input normalization layer
- **Memory management**: Multiple sessions = multiple Baileys instances in memory — need cleanup strategy
- **SSE for QR codes**: Added as improvement over wwebjs-api's polling approach

---

## Work Objectives

### Core Objective
Build a lightweight, production-ready REST API server that wraps Baileys for WhatsApp automation with multi-session support, matching wwebjs-api's feature coverage with improved API design.

### Concrete Deliverables
- `src/` — TypeScript source tree with Express server, controllers, services, middleware
- `package.json` + `tsconfig.json` — Project configuration with build/dev/test scripts
- `.env.example` — Configuration reference
- `swagger.json` — OpenAPI 3.0 specification
- `Dockerfile` + `docker-compose.yml` — Container deployment
- `tests/` — vitest test suite (TDD)

### Definition of Done
- [x] `npm run build` compiles without errors
- [ ] `npm test` passes all tests (vitest)
- [x] `npm start` boots server successfully, healthcheck responds
- [ ] Session can be started, QR scanned, messages sent/received
- [ ] All 100+ endpoints return proper responses
- [ ] Webhook fires on incoming messages
- [ ] Docker build succeeds and container runs

### Must Have
- TypeScript strict mode throughout
- Multi-session management (start, stop, restart, terminate, list)
- QR code delivery (JSON, PNG image, SSE stream)
- Pairing code support
- Message sending: text, image, video, audio, document, location, contact, poll
- Message operations: reply, react, delete, edit, forward, star
- Group management: create, update, participants, invite, settings
- Contact management: block, unblock, profile, status
- Chat operations: typing, recording, seen, mute, pin, archive
- Webhook system with per-session URL configuration
- WebSocket real-time events
- API key authentication middleware
- Rate limiting (Express-level + internal Baileys operation throttling)
- Proper error handling with consistent error response format
- Swagger/OpenAPI docs
- Docker support
- vitest test coverage for core modules

### Must NOT Have (Guardrails)
- **No Puppeteer/Chromium**: Zero browser dependencies — the whole point of using Baileys
- **No screenshot endpoint**: `getPageScreenshot` is Puppeteer-specific, excluded
- **No `getWWebVersion` endpoint**: Browser-specific, excluded
- **No `runMethod` endpoints**: These are escape hatches for wwebjs-api's limitations — our API should be comprehensive enough not to need them
- **No database dependency**: File-based session storage only (like wwebjs-api)
- **No `message_ciphertext` event**: Baileys handles encryption internally
- **No `loading_screen` event**: Browser-specific, irrelevant
- **No over-abstraction**: Direct, readable code — no unnecessary abstraction layers, strategy patterns, or factory patterns where a simple function suffices
- **No AI slop**: No excessive JSDoc on obvious methods, no commented-out code, no unused imports, no generic variable names (data, result, item, temp)
- **No premature optimization**: Simple Map-based stores first, optimize only if measured need
- **No call event handling**: Baileys lacks call support — document as unsupported, don't fake it

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: vitest
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR
- **Test setup**: Task 1 includes vitest configuration

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API endpoints**: Use Bash (curl) — Send requests, assert status + response fields
- **WebSocket events**: Use Bash (wscat/node script) — Connect, listen, assert events
- **Unit tests**: Use Bash (`npx vitest run`) — Run tests, assert pass count
- **Build verification**: Use Bash (`npx tsc --noEmit`) — Type-check, assert zero errors
- **Docker**: Use Bash (docker build/run) — Build image, verify container starts

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.

```
Wave 1 (Foundation — project scaffolding + shared types):
├── Task 1: Project scaffolding + vitest + build config [quick]
├── Task 2: TypeScript types & interfaces [quick]
├── Task 3: Configuration module (env parsing) [quick]
├── Task 4: Logger module (pino) [quick]
└── Task 5: Error handling utilities + response helpers [quick]

Wave 2 (Core infrastructure — session manager + middleware):
├── Task 6: Baileys session manager service [deep]
├── Task 7: Custom store (chat/contact/message cache) [deep]
├── Task 8: Middleware stack (API key, rate limit, session validation, CORS) [unspecified-high]
├── Task 9: Webhook dispatcher service [unspecified-high]
├── Task 10: WebSocket server + SSE handler [unspecified-high]
└── Task 11: Media handling utilities (download/upload) [unspecified-high]

Wave 3 (Controllers — API endpoints, MAX PARALLEL):
├── Task 12: Health + Session controller & routes [quick]
├── Task 13: Client controller (sendMessage, profile, presence, labels) [deep]
├── Task 14: Message controller (delete, edit, react, forward, star, media) [deep]
├── Task 15: Chat controller (typing, seen, mute, pin, archive, fetch) [unspecified-high]
├── Task 16: Group chat controller (create, participants, invite, settings) [deep]
├── Task 17: Contact controller (block, profile, about, common groups) [unspecified-high]
└── Task 18: Channel/Newsletter controller (best-effort) [unspecified-high]

Wave 4 (Integration — Express app assembly + docs):
├── Task 19: Express app assembly + route registration [unspecified-high]
├── Task 20: Swagger/OpenAPI specification [writing]
├── Task 21: Docker support (Dockerfile + docker-compose) [quick]
└── Task 22: .env.example + README setup guide [writing]

Wave 5 (Verification):
├── Task 23: Integration tests (multi-session lifecycle) [deep]
├── Task 24: API endpoint smoke tests [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: T1 → T2 → T6 → T13 → T19 → T23 → Final
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Wave 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2-5, all | 1 |
| 2 | 1 | 6-18 | 1 |
| 3 | 1 | 6, 8, 9, 10 | 1 |
| 4 | 1 | 6, 9, 10 | 1 |
| 5 | 1 | 6-18 | 1 |
| 6 | 2, 3, 4, 5 | 7, 12-18, 19 | 2 |
| 7 | 2, 6 | 13-18, 19 | 2 |
| 8 | 2, 3, 5 | 19 | 2 |
| 9 | 2, 3, 4, 5 | 6, 19 | 2 |
| 10 | 2, 3, 4, 5 | 19 | 2 |
| 11 | 2, 5 | 13, 14, 18 | 2 |
| 12 | 6, 5 | 19 | 3 |
| 13 | 6, 7, 11 | 19 | 3 |
| 14 | 6, 7, 11 | 19 | 3 |
| 15 | 6, 7 | 19 | 3 |
| 16 | 6, 7 | 19 | 3 |
| 17 | 6, 7 | 19 | 3 |
| 18 | 6, 7, 11 | 19 | 3 |
| 19 | 6-18, 8 | 20, 23, 24 | 4 |
| 20 | 19 | — | 4 |
| 21 | 19 | — | 4 |
| 22 | 3 | — | 4 |
| 23 | 19 | Final | 5 |
| 24 | 19 | Final | 5 |
| F1-F4 | 23, 24 | — | Final |

### Agent Dispatch Summary

- **Wave 1**: **5** — T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `quick`, T5 → `quick`
- **Wave 2**: **6** — T6 → `deep`, T7 → `deep`, T8 → `unspecified-high`, T9 → `unspecified-high`, T10 → `unspecified-high`, T11 → `unspecified-high`
- **Wave 3**: **7** — T12 → `quick`, T13 → `deep`, T14 → `deep`, T15 → `unspecified-high`, T16 → `deep`, T17 → `unspecified-high`, T18 → `unspecified-high`
- **Wave 4**: **4** — T19 → `unspecified-high`, T20 → `writing`, T21 → `quick`, T22 → `writing`
- **Wave 5**: **2** — T23 → `deep`, T24 → `unspecified-high`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs


- [x] 1. Project Scaffolding + Vitest + Build Config

  **What to do**:
  - Initialize npm project with `npm init -y`
  - Install dependencies: `@whiskeysockets/baileys`, `express`, `pino`, `pino-pretty`, `dotenv`, `cors`, `express-rate-limit`, `qrcode`, `ws`, `zod`, `axios`
  - Install dev dependencies: `typescript`, `vitest`, `@types/express`, `@types/node`, `@types/cors`, `@types/ws`, `tsx`, `@types/qrcode`
  - Create `tsconfig.json` with strict mode, ES2022 target, NodeNext module resolution, `src` rootDir, `dist` outDir
  - Create `vitest.config.ts` with TypeScript support
  - Create `.gitignore` (node_modules, dist, sessions, .env, *.log)
  - Create `package.json` scripts: `build` (tsc), `dev` (tsx watch src/server.ts), `start` (node dist/server.js), `test` (vitest), `test:run` (vitest run)
  - Create minimal `src/server.ts` placeholder (empty Express app that listens on port)
  - Write test: `tests/setup.test.ts` — verify vitest runs, import from src works

  **Must NOT do**:
  - Do NOT install any Puppeteer/Chromium packages
  - Do NOT create complex project structure yet — just the root files
  - Do NOT add ESLint/Prettier config (not in scope)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple scaffolding task with well-defined file outputs
  - **Skills**: []
    - No special skills needed for npm init + config files

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 — runs first (other Wave 1 tasks depend on this)
  - **Blocks**: Tasks 2, 3, 4, 5 (all need package.json + tsconfig to exist)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/package.json` — Reference for dependency list and scripts structure

  **External References**:
  - Baileys npm: `@whiskeysockets/baileys` — core WhatsApp library
  - vitest docs: setup with TypeScript

  **WHY Each Reference Matters**:
  - `Tempwwebjs-api/package.json` — Compare dependency list to ensure we have Baileys equivalents for each wwebjs-api dependency

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/setup.test.ts`
  - [ ] `npx vitest run` → PASS (1 test, 0 failures)

  **QA Scenarios:**

  ```
  Scenario: Project builds successfully
    Tool: Bash
    Preconditions: All dependencies installed (npm install completed)
    Steps:
      1. Run `npx tsc --noEmit`
      2. Check exit code is 0
    Expected Result: Zero TypeScript compilation errors
    Failure Indicators: Any `error TS` in output
    Evidence: .sisyphus/evidence/task-1-build-check.txt

  Scenario: Dev server starts
    Tool: Bash
    Preconditions: Project built
    Steps:
      1. Run `npx tsx src/server.ts &` (background)
      2. Wait 3 seconds
      3. Run `curl http://localhost:3000/ping` (or configured port)
      4. Kill background process
    Expected Result: Server starts without crash
    Failure Indicators: Process exits with non-zero code, EADDRINUSE error
    Evidence: .sisyphus/evidence/task-1-dev-server.txt
  ```

  **Commit**: YES
  - Message: `chore: scaffold project with TypeScript, vitest, and build config`
  - Files: `package.json, tsconfig.json, vitest.config.ts, .gitignore, src/server.ts, tests/setup.test.ts`
  - Pre-commit: `npx tsc --noEmit && npx vitest run`

- [x] 2. TypeScript Types & Interfaces

  **What to do**:
  - Create `src/types/index.ts` — barrel export file
  - Create `src/types/session.ts` — Session types:
    - `SessionId` (branded string type)
    - `SessionStatus` enum: `starting`, `qr_ready`, `connected`, `disconnected`, `terminated`
    - `SessionInfo`: `{ id: SessionId, status: SessionStatus, qr?: string, me?: ContactInfo }`
    - `SessionConfig`: `{ webhookUrl?: string, webhookEvents?: string[], autoRestart?: boolean }`
  - Create `src/types/message.ts` — Message types:
    - `ContentType`: `'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'poll' | 'sticker'`
    - `SendMessageRequest`: `{ chatId: string, contentType: ContentType, content: any, options?: SendMessageOptions }`
    - `SendMessageOptions`: `{ quotedMessageId?, mentions?, caption?, fileName?, mimetype? }`
    - `MessageInfo`: normalized message shape for API responses
  - Create `src/types/chat.ts` — Chat types: `ChatInfo`, `ChatUpdate`
  - Create `src/types/group.ts` — Group types: `GroupInfo`, `GroupParticipant`, `GroupUpdateAction`
  - Create `src/types/contact.ts` — Contact types: `ContactInfo`, `ContactStatus`
  - Create `src/types/webhook.ts` — Webhook types:
    - `WebhookEvent` union type of all 23 supported event names
    - `WebhookPayload<T>`: `{ sessionId: string, event: WebhookEvent, data: T, timestamp: number }`
  - Create `src/types/api.ts` — API response types:
    - `ApiResponse<T>`: `{ success: boolean, data?: T, error?: string }`
    - `PaginatedResponse<T>`: `ApiResponse<T> & { pagination: { offset, limit, total } }`
  - Write tests for type correctness: create test objects conforming to each interface

  **Must NOT do**:
  - Do NOT import Baileys types directly in this file — create our own abstractions
  - Do NOT create types for features we're excluding (screenshots, runMethod, call events)
  - Do NOT over-engineer with generics — keep types practical

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Type definitions are straightforward, well-scoped to interface files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 3, 4, 5 (after Task 1 completes)
  - **Parallel Group**: Wave 1 (with Tasks 3, 4, 5)
  - **Blocks**: Tasks 6-18 (all need types)
  - **Blocked By**: Task 1 (needs tsconfig.json)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/controllers/clientController.js:28-65` — sendMessage content types (string, MessageMedia, MessageMediaFromURL, Location, Contact, Poll) — map to our ContentType union
  - `Tempwwebjs-api/src/sessions.js:1-20` — Session status patterns
  - `Tempwwebjs-api/src/controllers/groupChatController.js:1-30` — Group action types

  **API/Type References**:
  - Baileys `src/Types/Message.ts` — `AnyMessageContent` union type for message sending
  - Baileys `src/Types/Events.ts` — `BaileysEventMap` for webhook event names
  - Baileys `src/Types/Auth.ts` — `AuthenticationCreds` for session info
  - Baileys `src/Types/Chat.ts` — `Chat`, `Contact` types

  **WHY Each Reference Matters**:
  - wwebjs-api controllers show the request/response shapes our API should support
  - Baileys types show what data we can actually extract from the library — our types must bridge these two

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/types.test.ts`
  - [ ] `npx vitest run tests/types.test.ts` → PASS

  **QA Scenarios:**

  ```
  Scenario: Types compile without errors
    Tool: Bash
    Preconditions: Task 1 complete, types files created
    Steps:
      1. Run `npx tsc --noEmit`
      2. Check output for zero errors
    Expected Result: All type files compile cleanly under strict mode
    Failure Indicators: `error TS` in output mentioning src/types/
    Evidence: .sisyphus/evidence/task-2-types-compile.txt
  ```

  **Commit**: YES (groups with Tasks 3, 4, 5)
  - Message: `feat(core): add shared types, config, logger, and error utilities`
  - Files: `src/types/*.ts`
  - Pre-commit: `npx tsc --noEmit && npx vitest run`

- [x] 3. Configuration Module

  **What to do**:
  - Create `src/config.ts`
  - Use `zod` for environment variable validation and parsing
  - Define config schema with all supported env vars:
    - `PORT` (default: 3000)
    - `API_KEY` (optional — if unset, auth disabled)
    - `BASE_WEBHOOK_URL` (optional)
    - `ENABLE_WEBHOOK` (default: true)
    - `ENABLE_WEBSOCKET` (default: false)
    - `MAX_ATTACHMENT_SIZE` (default: 10MB in bytes)
    - `SET_MESSAGES_AS_SEEN` (default: false)
    - `DISABLED_CALLBACKS` (pipe-separated string → Set<string>)
    - `RATE_LIMIT_MAX` (default: 1000)
    - `RATE_LIMIT_WINDOW_MS` (default: 1000)
    - `RECOVER_SESSIONS` (default: true)
    - `SESSIONS_PATH` (default: './sessions')
    - `LOG_LEVEL` (default: 'info')
    - `BASE_PATH` (default: '/')
    - `CORS_ORIGINS` (default: '*')
    - `TRUST_PROXY` (default: false)
  - Export validated config object with typed fields
  - Load `.env` via `dotenv`
  - Create `.env.example` with all vars documented
  - Write TDD tests: valid config, missing optional vars use defaults, invalid values throw

  **Must NOT do**:
  - Do NOT include Chrome-specific env vars (CHROME_BIN, HEADLESS, WEB_VERSION, etc.)
  - Do NOT read per-session webhook URLs from env vars — that's handled by session config in the API

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, well-defined schema, straightforward zod usage
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 2, 4, 5
  - **Parallel Group**: Wave 1 (with Tasks 2, 4, 5)
  - **Blocks**: Tasks 6, 8, 9, 10 (need config)
  - **Blocked By**: Task 1 (needs package.json with zod installed)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/config.js` — All env vars and defaults to replicate (minus Chrome-specific ones)
  - `Tempwwebjs-api/.env.example` — Complete env var documentation format

  **External References**:
  - Zod docs: `https://zod.dev` — schema validation for env parsing

  **WHY Each Reference Matters**:
  - `config.js` shows every env var wwebjs-api supports — we replicate all non-Chrome ones and add our improvements
  - `.env.example` shows the documentation format users expect

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/config.test.ts`
  - [ ] `npx vitest run tests/config.test.ts` → PASS (at least 5 tests)

  **QA Scenarios:**

  ```
  Scenario: Config loads with defaults when no env vars set
    Tool: Bash
    Preconditions: No .env file present
    Steps:
      1. Run node script: `npx tsx -e "import { config } from './src/config'; console.log(JSON.stringify(config))"`
      2. Parse JSON output
      3. Assert port === 3000, enableWebhook === true, enableWebsocket === false
    Expected Result: All defaults applied correctly
    Failure Indicators: Zod validation error thrown, wrong default values
    Evidence: .sisyphus/evidence/task-3-config-defaults.txt

  Scenario: Config rejects invalid values
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `PORT=abc npx tsx -e "import { config } from './src/config'"` (invalid port)
      2. Assert process exits with non-zero code
      3. Assert error message mentions PORT validation
    Expected Result: Zod throws validation error for invalid PORT
    Failure Indicators: No error thrown, server starts with NaN port
    Evidence: .sisyphus/evidence/task-3-config-validation.txt
  ```

  **Commit**: YES (groups with Tasks 2, 4, 5)
  - Message: `feat(core): add shared types, config, logger, and error utilities`
  - Files: `src/config.ts, .env.example`
  - Pre-commit: `npx vitest run`

- [x] 4. Logger Module

  **What to do**:
  - Create `src/logger.ts`
  - Use `pino` logger with configurable log level from config
  - Create child logger factory: `createLogger(module: string)` → returns pino child with module context
  - Support `pino-pretty` for development (when LOG_LEVEL=debug or NODE_ENV=development)
  - Export default logger instance and factory function
  - Write TDD tests: logger creates correctly, child loggers include module name, log level respects config

  **Must NOT do**:
  - Do NOT use winston or bunyan — pino is the standard (matches wwebjs-api)
  - Do NOT create complex transport configurations

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single small file, standard pino setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 2, 3, 5
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 5)
  - **Blocks**: Tasks 6, 9, 10 (need logger)
  - **Blocked By**: Task 1 (needs pino installed)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/logger.js` — Pino logger setup pattern with log level

  **WHY Each Reference Matters**:
  - Shows how wwebjs-api configures pino — we match the approach but add child logger factory for better module tracing

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/logger.test.ts`
  - [ ] `npx vitest run tests/logger.test.ts` → PASS

  **QA Scenarios:**

  ```
  Scenario: Logger outputs valid JSON
    Tool: Bash
    Preconditions: Config module works
    Steps:
      1. Run `npx tsx -e "import { createLogger } from './src/logger'; const log = createLogger('test'); log.info({ msg: 'hello' })"`
      2. Capture stdout
      3. Parse as JSON — assert `msg` field contains 'hello'
    Expected Result: Pino outputs structured JSON log line
    Failure Indicators: Non-JSON output, missing fields
    Evidence: .sisyphus/evidence/task-4-logger-output.txt
  ```

  **Commit**: YES (groups with Tasks 2, 3, 5)
  - Message: `feat(core): add shared types, config, logger, and error utilities`
  - Files: `src/logger.ts`
  - Pre-commit: `npx vitest run`

- [x] 5. Error Handling Utilities + Response Helpers

  **What to do**:
  - Create `src/utils/response.ts`:
    - `sendSuccess<T>(res, data: T, statusCode?: number)` — standard success response `{ success: true, data }`
    - `sendError(res, statusCode, message, details?)` — standard error response `{ success: false, error: message }`
    - `sendPaginated<T>(res, data: T[], pagination)` — paginated response
  - Create `src/utils/errors.ts`:
    - `AppError` class extending Error with statusCode, code, details
    - `NotFoundError`, `ValidationError`, `AuthenticationError`, `SessionNotFoundError`, `SessionNotConnectedError`
    - `asyncHandler(fn)` — express async wrapper that catches promise rejections
  - Create `src/utils/jid.ts`:
    - `normalizeJid(input: string)` — converts phone number to `number@s.whatsapp.net`, group ID to `id@g.us`
    - `isGroupJid(jid)`, `isNewsletterJid(jid)`, `extractPhoneNumber(jid)`
    - Input validation: strip +, spaces, dashes from phone numbers
  - Create `src/utils/index.ts` — barrel exports
  - Write TDD tests for all utilities: response format, error creation, JID normalization edge cases

  **Must NOT do**:
  - Do NOT create a global error handler middleware here (that goes in Task 8 middleware)
  - Do NOT add business logic — pure utility functions only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure utility functions, no external dependencies beyond Express types
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 2, 3, 4
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 6-18 (all use response helpers and error types)
  - **Blocked By**: Task 1 (needs TypeScript setup)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/utils.js` — `sendErrorResponse` function pattern, webhook trigger utility
  - `Tempwwebjs-api/src/controllers/clientController.js:1-25` — How controllers use `sendErrorResponse` — our pattern should match

  **API/Type References**:
  - Baileys JID utilities: `jidNormalizedUser()`, `isJidGroup()`, `isJidNewsletter()` — reference for our JID normalization

  **WHY Each Reference Matters**:
  - `utils.js` shows the response pattern all controllers expect — we must be consistent
  - Baileys JID functions show the target format our normalizer must produce

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/utils.test.ts`
  - [ ] `npx vitest run tests/utils.test.ts` → PASS (at least 10 tests)

  **QA Scenarios:**

  ```
  Scenario: JID normalization handles various input formats
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run npx tsx script that imports normalizeJid
      2. Test: normalizeJid('6281234567890') === '6281234567890@s.whatsapp.net'
      3. Test: normalizeJid('+62-812-3456-7890') === '6281234567890@s.whatsapp.net'
      4. Test: normalizeJid('120363XXX@newsletter') handles newsletter JIDs
      5. Test: normalizeJid('120363XXX@g.us') preserves group JIDs
    Expected Result: All normalizations produce correct Baileys JID format
    Failure Indicators: Wrong suffix, phone number not cleaned
    Evidence: .sisyphus/evidence/task-5-jid-normalize.txt

  Scenario: Error classes include correct status codes
    Tool: Bash
    Preconditions: None
    Steps:
      1. Import NotFoundError, ValidationError, AuthenticationError
      2. Assert new NotFoundError('x').statusCode === 404
      3. Assert new ValidationError('x').statusCode === 400
      4. Assert new AuthenticationError('x').statusCode === 401
    Expected Result: Each error class carries the correct HTTP status code
    Failure Indicators: Wrong status codes, missing statusCode property
    Evidence: .sisyphus/evidence/task-5-error-classes.txt
  ```

  **Commit**: YES (groups with Tasks 2, 3, 4)
  - Message: `feat(core): add shared types, config, logger, and error utilities`
  - Files: `src/utils/*.ts`
  - Pre-commit: `npx vitest run`

- [x] 6. Baileys Session Manager Service

  **What to do**:
  - Create `src/services/session-manager.ts`:
    - `SessionManager` class:
      - `sessions: Map<string, BaileysSession>` — in-memory session registry
      - `startSession(sessionId, config?: SessionConfig)` — creates Baileys socket with `useMultiFileAuthState`, registers events, stores in map
      - `stopSession(sessionId)` — graceful disconnect without deleting auth data
      - `restartSession(sessionId)` — stop + start
      - `terminateSession(sessionId)` — disconnect + delete auth folder
      - `getSession(sessionId)` — returns session or throws SessionNotFoundError
      - `getSessionStatus(sessionId)` — returns SessionStatus
      - `getAllSessions()` — returns all SessionInfo[]
      - `getSessionSocket(sessionId)` — returns Baileys WASocket (validated connected)
      - `restoreSessions()` — reads sessions directory, re-starts persisted sessions
    - `BaileysSession` internal type: `{ socket: WASocket, state: AuthState, status: SessionStatus, qr?: string, config: SessionConfig, store: Store }`
    - Event handling:
      - `connection.update` → track status changes, capture QR, detect auth/disconnect
      - `creds.update` → save credentials via `saveCreds()`
      - All Baileys events → forward to webhook/websocket dispatcher (Task 9)
    - Reconnection logic: if disconnect reason is NOT `loggedOut`, auto-reconnect with exponential backoff (max 5 retries, 1s/2s/4s/8s/16s)
    - WhatsApp rate limiting: internal queue with 500ms delay between Baileys operations to avoid bans
    - Memory cleanup: on session stop/terminate, null out socket references, clear event listeners
  - Export singleton instance
  - Write TDD tests: session lifecycle (start/stop/restart/terminate), status transitions, reconnection logic, concurrent session creation

  **Must NOT do**:
  - Do NOT use Puppeteer or any browser automation
  - Do NOT store session data in a database
  - Do NOT implement message sending here — just session lifecycle + event forwarding
  - Do NOT implement the actual webhook/websocket dispatch — call an injected callback or event emitter

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core service with complex lifecycle management, Baileys integration, reconnection logic, and event handling. Requires understanding Baileys socket API deeply.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — no browser interaction

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 7, 8, 9, 10, 11
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 7, 12-18, 19
  - **Blocked By**: Tasks 2, 3, 4, 5 (needs types, config, logger, utils)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/sessions.js:1-100` — Session Map pattern, `setupSession()` flow (create client, register events, store in map)
  - `Tempwwebjs-api/src/sessions.js:100-200` — Event registration pattern (qr, authenticated, ready, disconnected, message, etc.)
  - `Tempwwebjs-api/src/sessions.js:200-350` — `restoreSessions()`, `validateSession()`, `reloadSession()`, `deleteSession()`
  - `Tempwwebjs-api/src/sessions.js:350-500` — `flushSessions()` for terminateAll/terminateInactive

  **API/Type References**:
  - Baileys `makeWASocket(config)` — socket creation with auth, logger, version
  - Baileys `useMultiFileAuthState(folder)` — returns `{ state, saveCreds }`
  - Baileys `makeCacheableSignalKeyStore(keys, logger)` — wrap keys for caching
  - Baileys `connection.update` event — `{ connection, lastDisconnect, qr }`
  - Baileys `DisconnectReason` enum — loggedOut, connectionClosed, timedOut, etc.
  - Baileys `fetchLatestBaileysVersion()` — get WA version for socket config

  **WHY Each Reference Matters**:
  - `sessions.js` is the direct equivalent we're replacing — follow its lifecycle pattern but swap Puppeteer+wwjs for Baileys
  - Baileys socket API is the core integration point — every session operation calls these methods
  - DisconnectReason determines reconnection behavior (loggedOut = no reconnect, others = retry)

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/services/session-manager.test.ts`
  - [ ] `npx vitest run tests/services/session-manager.test.ts` → PASS (at least 8 tests)

  **QA Scenarios:**

  ```
  Scenario: Session manager creates and tracks sessions
    Tool: Bash
    Preconditions: Dependencies installed, config/types/utils exist
    Steps:
      1. Run npx tsx script that imports SessionManager
      2. Call startSession('test-1') — verify returns without error
      3. Call getAllSessions() — assert length === 1
      4. Call getSessionStatus('test-1') — assert status is 'starting' or 'qr_ready'
      5. Call stopSession('test-1') — verify returns without error
      6. Call getAllSessions() — assert length === 0
    Expected Result: Full lifecycle works, session map is properly maintained
    Failure Indicators: Throw on startSession, session not removed on stop, wrong status
    Evidence: .sisyphus/evidence/task-6-session-lifecycle.txt

  Scenario: Session manager rejects duplicate session IDs
    Tool: Bash
    Preconditions: Session 'test-1' already started
    Steps:
      1. Call startSession('test-1') again
      2. Assert it throws an appropriate error
    Expected Result: Error thrown indicating session already exists
    Failure Indicators: Second session created, overwriting first
    Evidence: .sisyphus/evidence/task-6-duplicate-session.txt
  ```

  **Commit**: YES (groups with Task 7)
  - Message: `feat(session): add Baileys session manager with custom store`
  - Files: `src/services/session-manager.ts`
  - Pre-commit: `npx vitest run`

- [x] 7. Custom Store (Chat/Contact/Message Cache)

  **What to do**:
  - Create `src/services/store.ts`:
    - `BaileysStore` class:
      - `chats: Map<string, ChatInfo>` — chat cache
      - `contacts: Map<string, ContactInfo>` — contact cache
      - `messages: Map<string, Map<string, MessageInfo>>` — messages per chat (bounded buffer)
      - `bind(socket: WASocket)` — attach event listeners to populate cache:
        - `messaging-history.set` → bulk load chats, contacts, messages from history sync
        - `chats.upsert` / `chats.update` / `chats.delete` → maintain chat map
        - `contacts.upsert` / `contacts.update` → maintain contact map
        - `messages.upsert` / `messages.update` / `messages.delete` → maintain message map
      - `getChats()` → ChatInfo[] sorted by lastMessageTime
      - `getChatById(jid)` → ChatInfo | undefined
      - `getContacts()` → ContactInfo[]
      - `getContactById(jid)` → ContactInfo | undefined
      - `getMessages(jid, options?: { limit?, offset? })` → MessageInfo[]
      - `getMessageById(jid, msgId)` → MessageInfo | undefined
      - `clear()` — release all data for memory cleanup
    - Message buffer limit: keep max 100 messages per chat (configurable), FIFO eviction
    - Normalize Baileys proto objects to our TypeScript types (ChatInfo, ContactInfo, MessageInfo)
  - Write TDD tests: store populates from events, getChats returns sorted, message buffer respects limit, clear releases memory

  **Must NOT do**:
  - Do NOT persist store to disk — it's rebuilt from Baileys history sync on each connect
  - Do NOT use Baileys' removed `makeInMemoryStore` (removed in v7)
  - Do NOT store unlimited messages — enforce buffer limits

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex data management with multiple event sources, cache eviction logic, type normalization from Baileys protobuf to our types
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 8, 9, 10, 11 (after Task 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 13-18, 19 (controllers need store)
  - **Blocked By**: Tasks 2, 6 (needs types + session manager)

  **References**:

  **Pattern References**:
  - Baileys removed `makeInMemoryStore` in v7 — we build our own following the event-driven pattern from Baileys examples

  **API/Type References**:
  - Baileys `messaging-history.set` event — `{ chats: Chat[], contacts: Contact[], messages: WAMessage[], isLatest, syncType }`
  - Baileys `chats.upsert`, `chats.update`, `chats.delete` events
  - Baileys `contacts.upsert`, `contacts.update` events
  - Baileys `messages.upsert` event — `{ messages: WAMessage[], type: 'notify' | 'append' }`
  - Our `src/types/chat.ts`, `src/types/contact.ts`, `src/types/message.ts` — target types for normalization

  **WHY Each Reference Matters**:
  - Baileys events are the data source — understanding their payloads is critical for correct caching
  - Our types define the normalization target — store must convert proto objects to these shapes

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/services/store.test.ts`
  - [ ] `npx vitest run tests/services/store.test.ts` → PASS (at least 8 tests)

  **QA Scenarios:**

  ```
  Scenario: Store populates from mock history sync events
    Tool: Bash
    Preconditions: Types defined
    Steps:
      1. Create BaileysStore instance
      2. Simulate messaging-history.set event with 5 chats, 10 contacts, 20 messages
      3. Call getChats() — assert length === 5
      4. Call getContacts() — assert length === 10
      5. Call getMessages(chatJid) — assert returns messages for that chat
    Expected Result: All data correctly cached and retrievable
    Failure Indicators: Missing data, wrong chat-message association
    Evidence: .sisyphus/evidence/task-7-store-populate.txt

  Scenario: Message buffer respects limit
    Tool: Bash
    Preconditions: Store instance exists
    Steps:
      1. Simulate 150 messages.upsert events for a single chat
      2. Call getMessages(chatJid) — assert length <= 100 (buffer limit)
      3. Verify oldest messages were evicted (FIFO)
    Expected Result: Buffer caps at 100, oldest messages removed
    Failure Indicators: Buffer exceeds limit, newest messages evicted instead
    Evidence: .sisyphus/evidence/task-7-store-buffer-limit.txt
  ```

  **Commit**: YES (groups with Task 6)
  - Message: `feat(session): add Baileys session manager with custom store`
  - Files: `src/services/store.ts`
  - Pre-commit: `npx vitest run`

- [x] 8. Middleware Stack (API Key, Rate Limit, Session Validation, CORS)

  **What to do**:
  - Create `src/middleware/api-key.ts`:
    - Check `x-api-key` header against config `API_KEY`
    - If API_KEY not configured, skip auth (all requests allowed)
    - Return 403 with error response if key invalid
  - Create `src/middleware/rate-limiter.ts`:
    - Use `express-rate-limit` with config values
    - Return 429 with error response on limit exceeded
  - Create `src/middleware/session-validation.ts`:
    - `validateSessionId` — regex check: `/^[\w-]+$/`
    - `validateSessionExists` — checks session exists in SessionManager
    - `validateSessionConnected` — checks session status is 'connected'
  - Create `src/middleware/error-handler.ts`:
    - Global Express error handler middleware
    - Catches AppError subtypes → appropriate status code + error response
    - Catches unknown errors → 500 + generic error response
    - Logs errors via logger
  - Create `src/middleware/index.ts` — barrel export
  - Write TDD tests for each middleware: valid/invalid API key, rate limit hit, session validation states

  **Must NOT do**:
  - Do NOT add Swagger middleware here (that's in Task 19 app assembly)
  - Do NOT add request body parsing here (Express built-in `json()` goes in app setup)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple interconnected middleware files with mocking needed for tests
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 6, 7, 9, 10, 11
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 19 (app assembly needs middleware)
  - **Blocked By**: Tasks 2, 3, 5 (needs types, config, error utils)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/middleware.js` — Complete middleware implementation (apikey, sessionNameValidation, sessionValidation, rateLimiter) — replicate all 4 patterns

  **WHY Each Reference Matters**:
  - Exact middleware patterns to match — our implementation should handle the same cases (missing header, invalid session name format, disconnected session)

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/middleware.test.ts`
  - [ ] `npx vitest run tests/middleware.test.ts` → PASS (at least 10 tests)

  **QA Scenarios:**

  ```
  Scenario: API key middleware rejects invalid key
    Tool: Bash
    Preconditions: Server running with API_KEY=test-key
    Steps:
      1. curl -H 'x-api-key: wrong-key' http://localhost:3000/ping
      2. Assert response status === 403
      3. Assert response body contains `{ success: false, error: 'Invalid API key' }`
    Expected Result: 403 Forbidden with error message
    Failure Indicators: 200 OK, no auth check
    Evidence: .sisyphus/evidence/task-8-apikey-reject.txt

  Scenario: Session validation rejects invalid session name
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. curl http://localhost:3000/api/sessions/invalid name!/status (space in name)
      2. Assert response status === 400 or 422
      3. Assert error message mentions invalid session ID format
    Expected Result: Validation error for non-alphanumeric session ID
    Failure Indicators: Request passes through, 500 error instead of 400
    Evidence: .sisyphus/evidence/task-8-session-validation.txt
  ```

  **Commit**: YES (groups with Tasks 9, 10, 11)
  - Message: `feat(infra): add middleware, webhook, websocket, and media handling`
  - Files: `src/middleware/*.ts`
  - Pre-commit: `npx vitest run`

- [x] 9. Webhook Dispatcher Service

  **What to do**:
  - Create `src/services/webhook.ts`:
    - `WebhookDispatcher` class:
      - `dispatch(sessionId: string, event: WebhookEvent, data: any)` — sends POST to webhook URL
      - Check `config.enableWebhook` — skip if disabled
      - Check `config.disabledCallbacks` — skip if event is disabled
      - Check per-session webhook config (from SessionConfig.webhookUrl)
      - Fallback to `config.baseWebhookUrl` if no per-session URL
      - Include `x-api-key` header in webhook requests (if API_KEY configured)
      - Payload format: `{ sessionId, event, data, timestamp }`
      - Use axios with 5s timeout, retry once on failure
      - Log webhook delivery success/failure
    - Export singleton instance
  - Write TDD tests: dispatch calls axios, respects disabled callbacks, uses per-session URL, falls back to base URL

  **Must NOT do**:
  - Do NOT queue webhook deliveries — fire-and-forget with single retry
  - Do NOT block the event loop waiting for webhook response

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Service with HTTP client, retry logic, config integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 6, 7, 8, 10, 11
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 6 (session manager forwards events to webhook), Task 19
  - **Blocked By**: Tasks 2, 3, 4, 5 (needs types, config, logger, utils)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/utils.js` — `triggerWebhook()` function — shows payload format, axios usage, API key forwarding
  - `Tempwwebjs-api/src/sessions.js:100-200` — How events are dispatched to webhooks within session event handlers

  **WHY Each Reference Matters**:
  - `utils.js` triggerWebhook is the exact function we're replacing — match its behavior (payload shape, headers)
  - sessions.js shows which events trigger webhooks and what data they pass

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/services/webhook.test.ts`
  - [ ] `npx vitest run tests/services/webhook.test.ts` → PASS (at least 5 tests)

  **QA Scenarios:**

  ```
  Scenario: Webhook dispatcher sends correct payload
    Tool: Bash
    Preconditions: Mock HTTP server running on localhost:4000
    Steps:
      1. Set BASE_WEBHOOK_URL=http://localhost:4000/hook
      2. Call dispatch('test-session', 'message', { body: 'hello' })
      3. Assert mock server received POST to /hook
      4. Assert request body contains sessionId, event, data, timestamp fields
      5. Assert x-api-key header present if API_KEY configured
    Expected Result: Webhook delivered with correct payload shape
    Failure Indicators: No request received, wrong payload format, missing headers
    Evidence: .sisyphus/evidence/task-9-webhook-dispatch.txt
  ```

  **Commit**: YES (groups with Tasks 8, 10, 11)
  - Message: `feat(infra): add middleware, webhook, websocket, and media handling`
  - Files: `src/services/webhook.ts`
  - Pre-commit: `npx vitest run`

- [x] 10. WebSocket Server + SSE Handler

  **What to do**:
  - Create `src/services/websocket.ts`:
    - `WebSocketManager` class:
      - Uses `ws` library (WebSocketServer)
      - Upgrade handler: `handleUpgrade(request, socket, head)` — routes `ws://host/ws/:sessionId` connections
      - Per-session WebSocket rooms: `Map<string, Set<WebSocket>>`
      - `broadcast(sessionId, event, data)` — sends to all clients subscribed to session
      - Payload format: JSON `{ sessionId, event, data, timestamp }` (same as webhook)
      - Ping/pong keepalive (30s interval)
      - Clean up on client disconnect
      - Check `config.enableWebsocket` — skip if disabled
  - Create `src/services/sse.ts`:
    - `SSEManager` class:
      - Handles `GET /api/sessions/:sessionId/qr/stream` — SSE endpoint for QR code updates
      - Sets `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
      - Sends QR code updates as SSE events: `data: {"qr": "..."}`
      - Sends authentication status: `data: {"status": "authenticated"}`
      - Closes connection on auth success or client disconnect
      - Per-session subscriber tracking
  - Write TDD tests: WebSocket connection/broadcast, SSE event format, cleanup on disconnect

  **Must NOT do**:
  - Do NOT require authentication for WebSocket connections (API key only applies to REST)
  - Do NOT implement custom binary protocols — JSON only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Two real-time communication protocols (WebSocket + SSE) with connection lifecycle management
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 6, 7, 8, 9, 11
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 19 (app assembly integrates WebSocket upgrade + SSE routes)
  - **Blocked By**: Tasks 2, 3, 4, 5 (needs types, config, logger)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/websocket.js` — Full WebSocket implementation (per-session WSS, upgrade handling, broadcast, ping/pong)

  **WHY Each Reference Matters**:
  - `websocket.js` is the exact WebSocket pattern we're replacing — match its connection model (per-session rooms) and add SSE as improvement

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/services/websocket.test.ts`
  - [ ] `npx vitest run tests/services/websocket.test.ts` → PASS (at least 4 tests)

  **QA Scenarios:**

  ```
  Scenario: WebSocket receives session events
    Tool: Bash
    Preconditions: Server running with ENABLE_WEBSOCKET=true
    Steps:
      1. Connect WebSocket to ws://localhost:3000/ws/test-session
      2. Trigger a broadcast event via WebSocketManager.broadcast()
      3. Assert client receives JSON message with sessionId, event, data fields
    Expected Result: Event broadcasted to connected WebSocket client
    Failure Indicators: No message received, invalid JSON, connection refused
    Evidence: .sisyphus/evidence/task-10-ws-broadcast.txt

  Scenario: SSE streams QR updates
    Tool: Bash (curl)
    Preconditions: Server running, session starting (QR not yet scanned)
    Steps:
      1. curl -N http://localhost:3000/api/sessions/test/qr/stream
      2. Assert Content-Type: text/event-stream
      3. Assert first event contains QR data
    Expected Result: SSE connection established, QR events received
    Failure Indicators: Wrong content type, no events, connection closed immediately
    Evidence: .sisyphus/evidence/task-10-sse-qr.txt
  ```

  **Commit**: YES (groups with Tasks 8, 9, 11)
  - Message: `feat(infra): add middleware, webhook, websocket, and media handling`
  - Files: `src/services/websocket.ts, src/services/sse.ts`
  - Pre-commit: `npx vitest run`

- [x] 11. Media Handling Utilities

  **What to do**:
  - Create `src/services/media.ts`:
    - `downloadMediaFromMessage(message: WAMessage)` — uses Baileys `downloadContentFromMessage()` to get media buffer
      - Detect media type from message (imageMessage, videoMessage, audioMessage, documentMessage, stickerMessage)
      - Return `{ buffer: Buffer, mimetype: string, filename?: string }`
      - Check `config.maxAttachmentSize` — reject oversized media
    - `prepareMediaForSending(content: any, contentType: ContentType)` — converts API request to Baileys message format
      - Handle base64 data → Buffer
      - Handle URL → `{ url: string }` (Baileys fetches)
      - Handle file path → `{ url: filePath }`
      - Return Baileys-compatible `AnyMessageContent` object
    - `getMediaMimetype(message: WAMessage)` — extract mimetype from message
    - `getMediaFilename(message: WAMessage)` — extract or generate filename
  - Write TDD tests: download with mock message, prepare from base64/URL, size limit enforcement

  **Must NOT do**:
  - Do NOT store media to disk — stream/buffer only
  - Do NOT implement media preview/thumbnail generation

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Buffer management, type detection, format conversion between API format and Baileys format
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 6, 7, 8, 9, 10
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 13, 14, 18 (controllers that handle media)
  - **Blocked By**: Tasks 2, 5 (needs types and utils)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/controllers/clientController.js:28-65` — sendMessage content type handling (MessageMedia, MessageMediaFromURL)
  - `Tempwwebjs-api/src/controllers/messageController.js:50-100` — downloadMedia and downloadMediaAsData handlers

  **API/Type References**:
  - Baileys `downloadContentFromMessage(msg, type)` — returns AsyncGenerator<Buffer>
  - Baileys `prepareWAMessageMedia(content, options)` — pre-upload media
  - Baileys message types: `imageMessage`, `videoMessage`, `audioMessage`, `documentMessage`, `stickerMessage`

  **WHY Each Reference Matters**:
  - clientController shows the input formats we need to accept (base64, URL) — our prepareMediaForSending must handle these
  - Baileys download/prepare functions are the actual APIs we call

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/services/media.test.ts`
  - [ ] `npx vitest run tests/services/media.test.ts` → PASS (at least 5 tests)

  **QA Scenarios:**

  ```
  Scenario: Media preparation converts base64 to buffer
    Tool: Bash
    Preconditions: None
    Steps:
      1. Call prepareMediaForSending with base64 image data and contentType 'image'
      2. Assert result has `image` property with Buffer value
      3. Assert result includes caption if provided
    Expected Result: Baileys-compatible message content object produced
    Failure Indicators: Wrong property name, Buffer not created, missing fields
    Evidence: .sisyphus/evidence/task-11-media-prepare.txt

  Scenario: Media size limit enforced
    Tool: Bash
    Preconditions: MAX_ATTACHMENT_SIZE set to 1000 bytes
    Steps:
      1. Create a mock message with mediaKey and size > 1000
      2. Call downloadMediaFromMessage
      3. Assert it throws an error about size limit
    Expected Result: Error thrown before attempting download
    Failure Indicators: Download proceeds without size check
    Evidence: .sisyphus/evidence/task-11-media-size-limit.txt
  ```

  **Commit**: YES (groups with Tasks 8, 9, 10)
  - Message: `feat(infra): add middleware, webhook, websocket, and media handling`
  - Files: `src/services/media.ts`
  - Pre-commit: `npx vitest run`

- [x] 12. Health + Session Controller & Routes

  **What to do**:
  - Create `src/controllers/session.controller.ts`:
    - `GET /api/sessions` — list all sessions (calls sessionManager.getAllSessions())
    - `POST /api/sessions/:sessionId/start` — start session, accepts optional body `{ webhookUrl?, webhookEvents? }`
    - `POST /api/sessions/:sessionId/stop` — stop session (disconnect, keep auth)
    - `GET /api/sessions/:sessionId/status` — get session status
    - `GET /api/sessions/:sessionId/qr` — get QR code as JSON `{ qr: '...' }`
    - `GET /api/sessions/:sessionId/qr/image` — get QR code as PNG image (use `qrcode` package)
    - `GET /api/sessions/:sessionId/qr/stream` — SSE stream for QR updates (delegates to SSEManager)
    - `POST /api/sessions/:sessionId/pairing-code` — request pairing code, body: `{ phoneNumber }`
    - `POST /api/sessions/:sessionId/restart` — restart session
    - `DELETE /api/sessions/:sessionId` — terminate session (logout + delete data)
    - `DELETE /api/sessions/inactive` — terminate all inactive sessions
    - `DELETE /api/sessions` — terminate all sessions
  - Create `src/controllers/health.controller.ts`:
    - `GET /ping` — returns `{ success: true, message: 'pong' }`
  - Create `src/routes/session.routes.ts` — Express Router with session routes
  - Create `src/routes/health.routes.ts` — Express Router with health routes
  - Write TDD tests: each endpoint returns correct status/response, validation works

  **Must NOT do**:
  - Do NOT implement `getPageScreenshot` — Puppeteer-specific, excluded
  - Do NOT add complex business logic in controllers — delegate to SessionManager

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward controller wiring, delegates to SessionManager
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 13-18
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19 (app assembly registers routes)
  - **Blocked By**: Tasks 5, 6 (needs utils + session manager)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/controllers/sessionController.js` — All session endpoints (469 lines) — replicate functionality with improved route design
  - `Tempwwebjs-api/src/controllers/healthController.js` — Health endpoint pattern
  - `Tempwwebjs-api/src/routes.js:10-30` — Session route definitions

  **WHY Each Reference Matters**:
  - sessionController.js shows every session operation we must support — our controllers cover the same functionality
  - Note our improved design: `DELETE /api/sessions/:id` instead of `GET /session/terminate/:id` (proper REST verbs)

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/controllers/session.test.ts`
  - [ ] `npx vitest run tests/controllers/session.test.ts` → PASS (at least 8 tests)

  **QA Scenarios:**

  ```
  Scenario: Health endpoint responds correctly
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. curl http://localhost:3000/ping
      2. Assert status 200
      3. Assert body: { success: true, message: 'pong' }
    Expected Result: Health check returns success
    Failure Indicators: Non-200 status, wrong response body
    Evidence: .sisyphus/evidence/task-12-health.txt

  Scenario: Session start and status flow
    Tool: Bash (curl)
    Preconditions: Server running with valid config
    Steps:
      1. POST /api/sessions/test-1/start — assert 200
      2. GET /api/sessions/test-1/status — assert status is 'starting' or 'qr_ready'
      3. GET /api/sessions — assert test-1 appears in list
      4. POST /api/sessions/test-1/stop — assert 200
      5. GET /api/sessions/test-1/status — assert status is 'disconnected'
    Expected Result: Full session lifecycle via REST API
    Failure Indicators: Wrong status codes, session not tracked, errors on stop
    Evidence: .sisyphus/evidence/task-12-session-lifecycle.txt
  ```

  **Commit**: YES (groups with Tasks 13-18)
  - Message: `feat(api): add all controllers and route handlers`
  - Files: `src/controllers/session.controller.ts, src/controllers/health.controller.ts, src/routes/session.routes.ts, src/routes/health.routes.ts`
  - Pre-commit: `npx vitest run`

- [x] 13. Client Controller (sendMessage, Profile, Presence, Labels)

  **What to do**:
  - Create `src/controllers/client.controller.ts`:
    - `POST /api/sessions/:sessionId/client/send-message` — universal send message endpoint:
      - Accept `{ chatId, contentType, content, options? }`
      - contentType 'text' → `{ text: content }`
      - contentType 'image' → prepare media + optional caption
      - contentType 'video' → prepare media + optional caption
      - contentType 'audio' → prepare media + ptt option for voice notes
      - contentType 'document' → prepare media + filename + mimetype
      - contentType 'location' → `{ location: { degreesLatitude, degreesLongitude } }`
      - contentType 'contact' → `{ contacts: { displayName, contacts: [{ vcard }] } }`
      - contentType 'poll' → `{ poll: { name, values, selectableCount } }`
      - contentType 'sticker' → prepare media as sticker
      - Options: quoted message, mentions
      - Use `sock.sendMessage(jid, content, options)` via session manager
    - `GET /api/sessions/:sessionId/client/contacts` — get all contacts from store
    - `GET /api/sessions/:sessionId/client/chats` — get all chats from store
    - `POST /api/sessions/:sessionId/client/chats` — get chats with filters (body: `{ since?, unread? }`)
    - `POST /api/sessions/:sessionId/client/chat/:chatId` — get specific chat
    - `POST /api/sessions/:sessionId/client/contact/:contactId` — get specific contact
    - `POST /api/sessions/:sessionId/client/is-registered` — check if number registered (body: `{ phoneNumber }`) — use `sock.onWhatsApp()`
    - `POST /api/sessions/:sessionId/client/number-id` — get WhatsApp ID for number
    - `POST /api/sessions/:sessionId/client/profile-picture-url` — get profile pic URL (body: `{ contactId }`) — use `sock.profilePictureUrl()`
    - `POST /api/sessions/:sessionId/client/set-status` — set status message — use `sock.updateProfileStatus()`
    - `POST /api/sessions/:sessionId/client/set-display-name` — set display name — use `sock.updateProfileName()`
    - `POST /api/sessions/:sessionId/client/set-profile-picture` — set profile picture — use `sock.updateProfilePicture()`
    - `DELETE /api/sessions/:sessionId/client/profile-picture` — delete profile picture — use `sock.removeProfilePicture()`
    - `POST /api/sessions/:sessionId/client/create-group` — create group — use `sock.groupCreate()`
    - `POST /api/sessions/:sessionId/client/presence/available` — send online — use `sock.sendPresenceUpdate('available')`
    - `POST /api/sessions/:sessionId/client/presence/unavailable` — send offline — use `sock.sendPresenceUpdate('unavailable')`
    - `POST /api/sessions/:sessionId/client/search-messages` — search messages in store
    - `GET /api/sessions/:sessionId/client/blocked-contacts` — get blocked contacts (from blocklist.set event cache)
    - `GET /api/sessions/:sessionId/client/labels` — get all labels
    - `POST /api/sessions/:sessionId/client/labels/:labelId` — get label by ID
    - `POST /api/sessions/:sessionId/client/labels/chat/:chatId` — get labels for chat
    - `POST /api/sessions/:sessionId/client/labels/:labelId/chats` — get chats by label
    - `POST /api/sessions/:sessionId/client/labels/modify` — add/remove labels from chat
  - Create `src/routes/client.routes.ts` — Express Router
  - Write TDD tests for sendMessage with different content types, profile operations, presence

  **Must NOT do**:
  - Do NOT implement `runMethod` — escape hatch not needed
  - Do NOT implement `acceptInvite` here — that's in group controller
  - Do NOT implement `getState` / `getWWebVersion` — browser-specific

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Largest controller with 25+ endpoints, complex sendMessage logic handling 9 content types, requires deep Baileys API knowledge
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 12, 14-18
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 6, 7, 11 (needs session manager, store, media utils)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/controllers/clientController.js:1-1600` — Complete client controller (1600+ lines) — replicate all endpoints, skip browser-specific ones
  - `Tempwwebjs-api/src/controllers/clientController.js:28-120` — sendMessage implementation with content type switching
  - `Tempwwebjs-api/src/controllers/clientController.js:200-400` — Profile and presence operations

  **API/Type References**:
  - Baileys `sock.sendMessage(jid, content, options)` — all message types
  - Baileys `sock.onWhatsApp(phoneNumber)` — check registration
  - Baileys `sock.profilePictureUrl(jid, type)` — get profile pic
  - Baileys `sock.sendPresenceUpdate(type, jid?)` — presence
  - Baileys `sock.groupCreate(name, participants)` — create group

  **WHY Each Reference Matters**:
  - clientController.js is the largest controller we're replacing — use it as the feature checklist
  - Each Baileys function maps to a specific wwebjs-api endpoint

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/controllers/client.test.ts`
  - [ ] `npx vitest run tests/controllers/client.test.ts` → PASS (at least 12 tests)

  **QA Scenarios:**

  ```
  Scenario: Send text message via API
    Tool: Bash (curl)
    Preconditions: Server running, session 'test-1' connected
    Steps:
      1. POST /api/sessions/test-1/client/send-message with body:
         { "chatId": "6281234567890", "contentType": "text", "content": "Hello from API" }
      2. Assert status 200
      3. Assert response contains message key (id, remoteJid, fromMe)
    Expected Result: Message sent, response includes message metadata
    Failure Indicators: 500 error, missing message key, wrong JID format
    Evidence: .sisyphus/evidence/task-13-send-text.txt

  Scenario: Get chats from store
    Tool: Bash (curl)
    Preconditions: Session connected and history synced
    Steps:
      1. GET /api/sessions/test-1/client/chats
      2. Assert status 200
      3. Assert response data is array of chat objects with id, name, lastMessage fields
    Expected Result: Chat list returned from store cache
    Failure Indicators: Empty array before sync, missing fields, error
    Evidence: .sisyphus/evidence/task-13-get-chats.txt
  ```

  **Commit**: YES (groups with Tasks 12, 14-18)
  - Message: `feat(api): add all controllers and route handlers`
  - Files: `src/controllers/client.controller.ts, src/routes/client.routes.ts`
  - Pre-commit: `npx vitest run`

- [x] 14. Message Controller (Delete, Edit, React, Forward, Star, Media)

  **What to do**:
  - Create `src/controllers/message.controller.ts`:
    - `POST /api/sessions/:sessionId/messages/delete` — delete for everyone (body: `{ chatId, messageId }`) — use `sock.sendMessage(jid, { delete: key })`
    - `POST /api/sessions/:sessionId/messages/edit` — edit message (body: `{ chatId, messageId, text }`) — use `sock.sendMessage(jid, { text, edit: key })`
    - `POST /api/sessions/:sessionId/messages/react` — react to message (body: `{ chatId, messageId, reaction }`) — use `sock.sendMessage(jid, { react: { text: emoji, key } })`
    - `POST /api/sessions/:sessionId/messages/forward` — forward message (body: `{ chatId, messageId, targetChatId }`) — retrieve message, use `sock.sendMessage(targetJid, { forward: msg })`
    - `POST /api/sessions/:sessionId/messages/star` — star message (body: `{ chatId, messageId }`) — use chat modification
    - `POST /api/sessions/:sessionId/messages/unstar` — unstar message
    - `POST /api/sessions/:sessionId/messages/reply` — reply to message (body: `{ chatId, messageId, content, contentType }`) — use `sock.sendMessage(jid, content, { quoted: msg })`
    - `POST /api/sessions/:sessionId/messages/download-media` — download media from message (body: `{ chatId, messageId }`) — returns base64 data
    - `POST /api/sessions/:sessionId/messages/download-media/stream` — download as binary stream
    - `POST /api/sessions/:sessionId/messages/info` — get message info (delivery status)
    - `POST /api/sessions/:sessionId/messages/mentions` — get mentioned contacts from message
    - `POST /api/sessions/:sessionId/messages/quoted` — get quoted/reply message
    - `POST /api/sessions/:sessionId/messages/reactions` — get reactions on message
    - `POST /api/sessions/:sessionId/messages/poll-votes` — get poll votes
    - `POST /api/sessions/:sessionId/messages/contact` — get sender contact info
  - Create `src/routes/message.routes.ts` — Express Router
  - Write TDD tests for each message operation

  **Must NOT do**:
  - Do NOT implement `getOrder` or `getPayment` — WhatsApp Business specific, Baileys support unclear
  - Do NOT implement `runMethod` — excluded
  - Do NOT implement `getClassInfo` as-is — it's a wwebjs-api internal; expose structured message data instead

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 15 endpoints, each with different Baileys API calls, message retrieval from store, media handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 12, 13, 15-18
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 6, 7, 11 (needs session manager, store, media utils)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/controllers/messageController.js` — All message endpoints (849 lines) — replicate functionality

  **API/Type References**:
  - Baileys `sock.sendMessage(jid, { delete: key })` — delete message
  - Baileys `sock.sendMessage(jid, { text, edit: key })` — edit message
  - Baileys `sock.sendMessage(jid, { react: { text, key } })` — react
  - Baileys `sock.sendMessage(jid, { forward: msg })` — forward
  - Baileys `downloadContentFromMessage(msg, type)` — download media

  **WHY Each Reference Matters**:
  - messageController.js shows all message operations and their request/response shapes
  - Each Baileys send pattern has a specific message content shape we must match

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/controllers/message.test.ts`
  - [ ] `npx vitest run tests/controllers/message.test.ts` → PASS (at least 8 tests)

  **QA Scenarios:**

  ```
  Scenario: React to message via API
    Tool: Bash (curl)
    Preconditions: Session connected, known message exists
    Steps:
      1. POST /api/sessions/test-1/messages/react with body:
         { "chatId": "6281234567890@s.whatsapp.net", "messageId": "ABC123", "reaction": "❤️" }
      2. Assert status 200
      3. Assert response success: true
    Expected Result: Reaction sent to message
    Failure Indicators: 500 error, message not found, reaction not sent
    Evidence: .sisyphus/evidence/task-14-react-message.txt

  Scenario: Download media returns base64 data
    Tool: Bash (curl)
    Preconditions: Session connected, message with media exists in store
    Steps:
      1. POST /api/sessions/test-1/messages/download-media with body:
         { "chatId": "6281234567890@s.whatsapp.net", "messageId": "MEDIA123" }
      2. Assert status 200
      3. Assert response data contains mimetype and data (base64 string)
    Expected Result: Media downloaded and returned as base64
    Failure Indicators: 500 error, empty data, wrong mimetype
    Evidence: .sisyphus/evidence/task-14-download-media.txt
  ```

  **Commit**: YES (groups with Tasks 12, 13, 15-18)
  - Message: `feat(api): add all controllers and route handlers`
  - Files: `src/controllers/message.controller.ts, src/routes/message.routes.ts`
  - Pre-commit: `npx vitest run`

- [x] 15. Chat Controller (Typing, Seen, Mute, Pin, Archive, Fetch)

  **What to do**:
  - Create `src/controllers/chat.controller.ts`:
    - `POST /api/sessions/:sessionId/chats/:chatId/typing` — send typing indicator — use `sock.sendPresenceUpdate('composing', jid)`
    - `POST /api/sessions/:sessionId/chats/:chatId/recording` — send recording indicator — use `sock.sendPresenceUpdate('recording', jid)`
    - `POST /api/sessions/:sessionId/chats/:chatId/clear-state` — clear typing/recording — use `sock.sendPresenceUpdate('paused', jid)`
    - `POST /api/sessions/:sessionId/chats/:chatId/seen` — mark messages as read — use `sock.readMessages([key])`
    - `POST /api/sessions/:sessionId/chats/:chatId/mark-unread` — mark as unread — use chat modification
    - `POST /api/sessions/:sessionId/chats/:chatId/archive` — archive chat — use `sock.chatModify({ archive: true }, jid)`
    - `POST /api/sessions/:sessionId/chats/:chatId/unarchive` — unarchive chat
    - `POST /api/sessions/:sessionId/chats/:chatId/pin` — pin chat — use `sock.chatModify({ pin: true }, jid)`
    - `POST /api/sessions/:sessionId/chats/:chatId/unpin` — unpin chat
    - `POST /api/sessions/:sessionId/chats/:chatId/mute` — mute chat (body: `{ duration? }`) — use `sock.chatModify({ mute: duration }, jid)`
    - `POST /api/sessions/:sessionId/chats/:chatId/unmute` — unmute chat
    - `GET /api/sessions/:sessionId/chats/:chatId/messages` — fetch messages from store (query: `{ limit?, offset? }`)
    - `GET /api/sessions/:sessionId/chats/:chatId/contact` — get chat contact info
    - `DELETE /api/sessions/:sessionId/chats/:chatId` — delete chat — use `sock.chatModify({ delete: true }, jid)`
    - `POST /api/sessions/:sessionId/chats/:chatId/clear` — clear chat messages
    - `POST /api/sessions/:sessionId/chats/:chatId/labels` — get chat labels
    - `POST /api/sessions/:sessionId/chats/:chatId/labels/modify` — change chat labels
  - Create `src/routes/chat.routes.ts` — Express Router
  - Write TDD tests for typing state, seen, archive/pin/mute operations

  **Must NOT do**:
  - Do NOT implement `syncHistory` as separate endpoint — Baileys syncs automatically
  - Do NOT implement `runMethod` — excluded

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 17 endpoints, mostly straightforward Baileys chatModify calls but many of them
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 12-14, 16-18
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 6, 7 (needs session manager, store)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/controllers/chatController.js` — All chat endpoints — replicate functionality

  **API/Type References**:
  - Baileys `sock.sendPresenceUpdate('composing' | 'recording' | 'paused', jid)` — typing/recording
  - Baileys `sock.readMessages([{ remoteJid, id, participant }])` — mark read
  - Baileys `sock.chatModify({ archive, pin, mute, delete, clear }, jid)` — chat modifications

  **WHY Each Reference Matters**:
  - chatController.js shows the operations we replicate; Baileys `chatModify` is the Swiss Army knife for most of these

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/controllers/chat.test.ts`
  - [ ] `npx vitest run tests/controllers/chat.test.ts` → PASS (at least 8 tests)

  **QA Scenarios:**

  ```
  Scenario: Send typing indicator
    Tool: Bash (curl)
    Preconditions: Session connected
    Steps:
      1. POST /api/sessions/test-1/chats/6281234567890@s.whatsapp.net/typing
      2. Assert status 200
      3. Assert response success: true
    Expected Result: Typing indicator sent to chat
    Failure Indicators: 500 error, session not found
    Evidence: .sisyphus/evidence/task-15-typing.txt

  Scenario: Archive and unarchive chat
    Tool: Bash (curl)
    Preconditions: Session connected
    Steps:
      1. POST /api/sessions/test-1/chats/6281234567890@s.whatsapp.net/archive
      2. Assert status 200
      3. POST /api/sessions/test-1/chats/6281234567890@s.whatsapp.net/unarchive
      4. Assert status 200
    Expected Result: Both operations succeed
    Failure Indicators: Error on either operation
    Evidence: .sisyphus/evidence/task-15-archive.txt
  ```

  **Commit**: YES (groups with Tasks 12-14, 16-18)
  - Message: `feat(api): add all controllers and route handlers`
  - Files: `src/controllers/chat.controller.ts, src/routes/chat.routes.ts`
  - Pre-commit: `npx vitest run`

- [x] 16. Group Chat Controller (Create, Participants, Invite, Settings)

  **What to do**:
  - Create `src/controllers/group.controller.ts`:
    - `GET /api/sessions/:sessionId/groups/:groupId` — get group metadata — use `sock.groupMetadata(jid)`
    - `POST /api/sessions/:sessionId/groups/:groupId/participants/add` — add participants (body: `{ participants: string[] }`) — use `sock.groupParticipantsUpdate(jid, participants, 'add')`
    - `POST /api/sessions/:sessionId/groups/:groupId/participants/remove` — remove participants
    - `POST /api/sessions/:sessionId/groups/:groupId/participants/promote` — promote to admin
    - `POST /api/sessions/:sessionId/groups/:groupId/participants/demote` — demote from admin
    - `GET /api/sessions/:sessionId/groups/:groupId/invite-code` — get invite link — use `sock.groupInviteCode(jid)`
    - `POST /api/sessions/:sessionId/groups/:groupId/revoke-invite` — revoke invite link — use `sock.groupRevokeInvite(jid)`
    - `POST /api/sessions/:sessionId/groups/:groupId/leave` — leave group — use `sock.groupLeave(jid)`
    - `PUT /api/sessions/:sessionId/groups/:groupId/subject` — update group name (body: `{ subject }`) — use `sock.groupUpdateSubject(jid, subject)`
    - `PUT /api/sessions/:sessionId/groups/:groupId/description` — update description (body: `{ description }`) — use `sock.groupUpdateDescription(jid, desc)`
    - `PUT /api/sessions/:sessionId/groups/:groupId/picture` — set group picture — use `sock.updateProfilePicture(jid, media)`
    - `DELETE /api/sessions/:sessionId/groups/:groupId/picture` — delete group picture — use `sock.removeProfilePicture(jid)`
    - `PUT /api/sessions/:sessionId/groups/:groupId/settings/messages-admins-only` — restrict messages to admins
    - `PUT /api/sessions/:sessionId/groups/:groupId/settings/info-admins-only` — restrict info editing to admins
    - `GET /api/sessions/:sessionId/groups/:groupId/membership-requests` — get join requests — use `sock.groupRequestParticipantsList(jid)`
    - `POST /api/sessions/:sessionId/groups/:groupId/membership-requests/approve` — approve requests — use `sock.groupRequestParticipantsUpdate(jid, participants, 'approve')`
    - `POST /api/sessions/:sessionId/groups/:groupId/membership-requests/reject` — reject requests
    - `POST /api/sessions/:sessionId/groups/accept-invite` — join group via invite code — use `sock.groupAcceptInvite(code)`
    - `POST /api/sessions/:sessionId/groups/invite-info` — get invite info — use `sock.groupGetInviteInfo(code)`
    - `GET /api/sessions/:sessionId/groups` — get all groups — use `sock.groupFetchAllParticipating()`
  - Create `src/routes/group.routes.ts` — Express Router
  - Write TDD tests for group operations

  **Must NOT do**:
  - Do NOT implement `runMethod` — excluded
  - Do NOT implement real-time group updates here — those come via webhook events

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 20 endpoints, complex participant management, multiple Baileys group API calls
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 12-15, 17-18
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 6, 7 (needs session manager, store)

  **References**:

  **Pattern References**:
  - `Tempwwebjs-api/src/controllers/groupChatController.js` — All group endpoints — replicate functionality with improved REST verbs

  **API/Type References**:
  - Baileys `sock.groupCreate(name, participants)` — create group
  - Baileys `sock.groupMetadata(jid)` — get group info
  - Baileys `sock.groupParticipantsUpdate(jid, participants, action)` — add/remove/promote/demote
  - Baileys `sock.groupInviteCode(jid)` / `sock.groupRevokeInvite(jid)` — invite management
  - Baileys `sock.groupUpdateSubject(jid, subject)` / `sock.groupUpdateDescription(jid, desc)` — settings
  - Baileys `sock.groupRequestParticipantsList(jid)` / `sock.groupRequestParticipantsUpdate(jid, p, action)` — join requests
  - Baileys `sock.groupFetchAllParticipating()` — list all groups

  **WHY Each Reference Matters**:
  - groupChatController.js is our feature checklist; Baileys has 1:1 methods for most group operations

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `tests/controllers/group.test.ts`
  - [ ] `npx vitest run tests/controllers/group.test.ts` → PASS (at least 8 tests)

  **QA Scenarios:**

  ```
  Scenario: Get group metadata via API
    Tool: Bash (curl)
    Preconditions: Session connected, in at least one group
    Steps:
      1. GET /api/sessions/test-1/groups/120363XXX@g.us
      2. Assert status 200
      3. Assert response data contains subject, participants array, desc
    Expected Result: Group metadata returned with participant list
    Failure Indicators: 500 error, empty participants, missing fields
    Evidence: .sisyphus/evidence/task-16-group-metadata.txt

  Scenario: Get all participating groups
    Tool: Bash (curl)
    Preconditions: Session connected
    Steps:
      1. GET /api/sessions/test-1/groups
      2. Assert status 200
      3. Assert response data is array of group objects
    Expected Result: List of all groups the account is in
    Failure Indicators: Empty array when groups exist, error
    Evidence: .sisyphus/evidence/task-16-all-groups.txt
  ```

  **Commit**: YES (groups with Tasks 12-15, 17-18)
  - Message: `feat(api): add all controllers and route handlers`
  - Files: `src/controllers/group.controller.ts, src/routes/group.routes.ts`
  - Pre-commit: `npx vitest run`

- [x] 17. Contact Controller (Block, Unblock, Profile, Lookup)

  **What to do**:
  - Create `src/controllers/contact.controller.ts` with handlers for all contact endpoints
  - Create `src/routes/contact.routes.ts` with Express Router wiring
  - Endpoints (9 total, all under `POST /api/sessions/:sessionId/contacts/...`):
    - `POST /contacts/info` — Get contact info by JID (getClassInfo equivalent)
    - `POST /contacts/block` — Block a contact by JID
    - `POST /contacts/unblock` — Unblock a contact by JID
    - `POST /contacts/about` — Get contact's 'About' status text
    - `POST /contacts/chat` — Get chat object for a contact
    - `POST /contacts/profile-picture` — Get contact's profile picture URL
    - `POST /contacts/formatted-number` — Get formatted phone number from JID
    - `POST /contacts/country-code` — Get country code from JID
    - `POST /contacts/common-groups` — Get common groups with a contact
  - **Baileys mapping**:
    - `sock.updateBlockStatus(jid, 'block'/'unblock')` for block/unblock
    - `sock.fetchStatus(jid)` for about/status text
    - `sock.profilePictureUrl(jid, 'image')` for profile picture
    - JID parsing utilities for formatted number and country code extraction
    - `sock.groupFetchAllParticipating()` then filter for common groups
  - Write Zod schemas for request validation (all take `contactId` as JID string)
  - Write vitest unit tests mocking the session manager and Baileys socket
  - Handle edge cases: invalid JID format, contact not found, privacy restrictions (null profile pic)

  **Must NOT do**:
  - Do NOT create `getContactById` as a separate service — use Baileys JID directly
  - Do NOT use wwebjs-api's pattern of `client.getContactById(id)` then `contact.method()` — Baileys is stateless per-call
  - Do NOT add `runMethod` escape hatch

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend controller with Baileys API integration, moderate complexity
  - **Skills**: `[]`
    - No specialized skills needed — standard TypeScript/Express patterns
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 16, 18)
  - **Blocks**: Task 19 (Express App Assembly)
  - **Blocked By**: Tasks 2 (Types), 5 (Error Utils), 6 (Session Manager), 8 (Middleware)

  **References**:

  **Pattern References** (existing code to follow):
  - `Tempwwebjs-api/src/controllers/contactController.js` — All 9 contact endpoints (block, unblock, getAbout, getChat, getProfilePicUrl, getFormattedNumber, getCountryCode, getCommonGroups, getClassInfo). Shows the pattern of fetching contact then calling method. In Baileys, these are direct socket calls instead.
  - `Tempwwebjs-api/src/routes.js:212-225` — Contact router setup with 9 POST routes
  - Tasks 12-16 controllers (same project) — Follow the same controller pattern: Zod validation → session lookup → Baileys call → response envelope

  **API/Type References** (contracts to implement against):
  - `src/types/index.ts` (from Task 2) — Response envelope types, contact-related DTOs
  - `src/schemas/` (from Task 2) — Zod schema patterns for request validation

  **External References** (libraries and frameworks):
  - Baileys `sock.updateBlockStatus(jid, action)` — action is `'block'` or `'unblock'`
  - Baileys `sock.fetchStatus(jid)` — returns `{ status: string, setAt: Date }` or undefined
  - Baileys `sock.profilePictureUrl(jid, 'image')` — returns URL string or throws if private
  - Baileys JID format: `1234567890@s.whatsapp.net` for contacts, parse with `@whiskeysockets/baileys` `jidDecode()`

  **WHY Each Reference Matters**:
  - contactController.js shows the full feature set to replicate — but adapt from wwebjs OOP style (contact.block()) to Baileys functional style (sock.updateBlockStatus())
  - Routes file shows the URL patterns — we're improving these (e.g., kebab-case paths)
  - JID decode is critical for formatted-number and country-code extraction — Baileys provides `jidDecode()` which splits user/server

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `src/controllers/__tests__/contact.controller.test.ts`
  - [ ] `npx vitest run src/controllers/__tests__/contact.controller.test.ts` → PASS (9+ tests, 0 failures)
  - [ ] Tests cover: block success, unblock success, about fetch, profile pic (found + privacy null), formatted number extraction, country code extraction, common groups, invalid JID error

  **QA Scenarios:**

  ```
  Scenario: Block a contact successfully
    Tool: Bash (curl)
    Preconditions: Server running on localhost:3000, session "test-1" connected
    Steps:
      1. curl -s -X POST http://localhost:3000/api/sessions/test-1/contacts/block -H 'Content-Type: application/json' -H 'x-api-key: test-key' -d '{"contactId": "1234567890@s.whatsapp.net"}'
      2. Assert HTTP status 200
      3. Assert response body contains `{"success": true}`
    Expected Result: Contact blocked, success response returned
    Failure Indicators: 400/500 error, missing success field
    Evidence: .sisyphus/evidence/task-17-block-contact.txt

  Scenario: Get profile picture with privacy restriction
    Tool: Bash (curl)
    Preconditions: Session connected, contact has private profile picture
    Steps:
      1. curl -s -X POST http://localhost:3000/api/sessions/test-1/contacts/profile-picture -H 'Content-Type: application/json' -H 'x-api-key: test-key' -d '{"contactId": "1234567890@s.whatsapp.net"}'
      2. Assert HTTP status 200
      3. Assert response body contains `{"success": true, "profilePicUrl": null}`
    Expected Result: Graceful null for private profile, not an error
    Failure Indicators: 500 error thrown instead of null
    Evidence: .sisyphus/evidence/task-17-profile-pic-private.txt

  Scenario: Invalid JID format rejected
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. curl -s -X POST http://localhost:3000/api/sessions/test-1/contacts/block -H 'Content-Type: application/json' -H 'x-api-key: test-key' -d '{"contactId": "not-a-valid-jid"}'
      2. Assert HTTP status 400
      3. Assert response contains validation error message
    Expected Result: 400 Bad Request with clear error about invalid JID
    Failure Indicators: 500 error or accepted invalid JID
    Evidence: .sisyphus/evidence/task-17-invalid-jid.txt
  ```

  **Evidence to Capture:**
  - [ ] task-17-block-contact.txt
  - [ ] task-17-profile-pic-private.txt
  - [ ] task-17-invalid-jid.txt

  **Commit**: YES (groups with Tasks 12-16, 18)
  - Message: `feat(api): add all controllers and route handlers`
  - Files: `src/controllers/contact.controller.ts, src/routes/contact.routes.ts, src/controllers/__tests__/contact.controller.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 18. Channel/Newsletter Controller (Best-Effort Baileys Newsletter Support)

  **What to do**:
  - Create `src/controllers/channel.controller.ts` with handlers for channel/newsletter endpoints
  - Create `src/routes/channel.routes.ts` with Express Router wiring
  - **Supported endpoints** (best-effort — depends on Baileys newsletter API availability):
    - `POST /channels/info` — Get channel info by newsletter JID
    - `POST /channels/send-message` — Send text/media message to a channel
    - `POST /channels/fetch-messages` — Fetch messages from a channel
    - `POST /channels/send-seen` — Mark channel messages as read
    - `POST /channels/mute` — Mute a channel
    - `POST /channels/unmute` — Unmute a channel
    - `POST /channels/set-profile-picture` — Set channel profile picture
    - `POST /channels/set-description` — Set channel description
    - `POST /channels/set-subject` — Set channel name/subject
    - `DELETE /channels/:channelId` — Delete a channel (improved: uses DELETE verb)
    - `POST /channels/subscribers` — Get channel subscribers
    - `POST /channels/set-reaction-setting` — Set who can react
  - **Admin operations** (if Baileys supports):
    - `POST /channels/admin/invite` — Send admin invite
    - `POST /channels/admin/accept-invite` — Accept admin invite
    - `POST /channels/admin/revoke-invite` — Revoke admin invite
    - `POST /channels/admin/transfer-ownership` — Transfer channel ownership
    - `POST /channels/admin/demote` — Demote a channel admin
  - **Baileys newsletter mapping**:
    - `sock.newsletterMetadata('invite', code)` or `sock.newsletterMetadata('jid', jid)` for channel info
    - `sock.sendMessage(newsletterJid, content)` for sending messages
    - `sock.newsletterMute(jid)` / `sock.newsletterUnmute(jid)` for mute/unmute
    - `sock.newsletterUpdateDescription(jid, desc)` for description
    - `sock.newsletterUpdateName(jid, name)` for subject
    - `sock.newsletterUpdatePicture(jid, buffer)` for profile picture
    - `sock.newsletterDelete(jid)` for deleting a channel
    - `sock.newsletterReactionMode(jid, mode)` for reaction settings
    - `sock.newsletterFollow(jid)` / `sock.newsletterUnfollow(jid)` for subscribe/unsubscribe (mapped from mute/unmute if needed)
    - Note: Some admin operations may not be available in Baileys — mark as `501 Not Implemented` with clear message
  - Write Zod schemas for request validation
  - Write vitest unit tests
  - For any endpoint where Baileys lacks the API: return `501 Not Implemented` with `{ success: false, error: "Channel admin operations not supported by Baileys" }`
  - **JID format**: Newsletter JIDs use `@newsletter` suffix (e.g., `120363XXX@newsletter`)

  **Must NOT do**:
  - Do NOT silently fail — if a feature is not supported, return 501 explicitly
  - Do NOT use wwebjs-api's `MessageMedia` pattern — Baileys uses raw buffers for media
  - Do NOT add `runMethod` escape hatch
  - Do NOT fake/stub endpoints that can't work — either implement or 501

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend controller with Baileys newsletter API (less documented, may need exploration)
  - **Skills**: `[]`
    - No specialized skills needed
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 16, 17)
  - **Blocks**: Task 19 (Express App Assembly)
  - **Blocked By**: Tasks 2 (Types), 5 (Error Utils), 6 (Session Manager), 8 (Middleware), 11 (Media Utilities)

  **References**:

  **Pattern References** (existing code to follow):
  - `Tempwwebjs-api/src/controllers/channelController.js` — All 16 channel endpoints (getClassInfo, sendMessage, fetchMessages, sendSeen, mute, unmute, acceptChannelAdminInvite, sendChannelAdminInvite, revokeChannelAdminInvite, transferChannelOwnership, demoteChannelAdmin, getSubscribers, setProfilePicture, setDescription, setSubject, setReactionSetting, deleteChannel). Shows content type switching pattern for messages.
  - `Tempwwebjs-api/src/routes.js:232-253` — Channel router setup with 16 POST routes
  - Tasks 12-17 controllers — Follow the same controller pattern established in this project

  **API/Type References** (contracts to implement against):
  - `src/types/index.ts` (from Task 2) — Response envelope types, channel-related DTOs
  - Newsletter JID format: `120363XXXXXXXXXXXX@newsletter`

  **External References** (libraries and frameworks):
  - Baileys newsletter API: `sock.newsletterMetadata()`, `sock.newsletterMute()`, `sock.newsletterUnmute()`, `sock.newsletterUpdateDescription()`, `sock.newsletterUpdateName()`, `sock.newsletterUpdatePicture()`, `sock.newsletterDelete()`, `sock.newsletterReactionMode()`, `sock.newsletterFollow()`, `sock.newsletterUnfollow()`
  - Baileys `sock.sendMessage(newsletterJid, { text: '...' })` for channel text messages
  - Baileys newsletter events: `messaging-history.set` may include newsletter metadata

  **WHY Each Reference Matters**:
  - channelController.js shows all 16 features to replicate — but many use wwebjs-specific APIs (chat.isChannel, MessageMedia) that must be adapted to Baileys newsletter API
  - Newsletter JIDs use `@newsletter` suffix, NOT `@g.us` — validation must check this
  - Baileys newsletter API is less documented than core messaging — the executor may need to explore the Baileys source for exact method signatures

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `src/controllers/__tests__/channel.controller.test.ts`
  - [ ] `npx vitest run src/controllers/__tests__/channel.controller.test.ts` → PASS (10+ tests, 0 failures)
  - [ ] Tests cover: channel info fetch, send text message, fetch messages, mute/unmute, set description, set subject, delete channel, 501 for unsupported admin ops

  **QA Scenarios:**

  ```
  Scenario: Send text message to a channel
    Tool: Bash (curl)
    Preconditions: Server running on localhost:3000, session "test-1" connected
    Steps:
      1. curl -s -X POST http://localhost:3000/api/sessions/test-1/channels/send-message -H 'Content-Type: application/json' -H 'x-api-key: test-key' -d '{"channelId": "120363001234567890@newsletter", "content": "Hello channel!", "contentType": "text"}'
      2. Assert HTTP status 200
      3. Assert response body contains `{"success": true, "message": {...}}`
    Expected Result: Message sent to channel, message object returned
    Failure Indicators: 500 error, missing message in response
    Evidence: .sisyphus/evidence/task-18-send-channel-message.txt

  Scenario: Unsupported admin operation returns 501
    Tool: Bash (curl)
    Preconditions: Server running, session connected
    Steps:
      1. curl -s -X POST http://localhost:3000/api/sessions/test-1/channels/admin/transfer-ownership -H 'Content-Type: application/json' -H 'x-api-key: test-key' -d '{"channelId": "120363001234567890@newsletter", "newOwnerId": "1234567890@s.whatsapp.net"}'
      2. Assert HTTP status 501
      3. Assert response contains `{"success": false, "error": "...not supported..."}`
    Expected Result: 501 Not Implemented with clear explanation
    Failure Indicators: 200 with empty result, or 500 crash
    Evidence: .sisyphus/evidence/task-18-unsupported-admin-op.txt

  Scenario: Invalid newsletter JID rejected
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. curl -s -X POST http://localhost:3000/api/sessions/test-1/channels/info -H 'Content-Type: application/json' -H 'x-api-key: test-key' -d '{"channelId": "1234567890@s.whatsapp.net"}'
      2. Assert HTTP status 400
      3. Assert response contains validation error about newsletter JID format
    Expected Result: 400 with clear error that JID must be @newsletter format
    Failure Indicators: Accepted non-newsletter JID, or 500 error
    Evidence: .sisyphus/evidence/task-18-invalid-newsletter-jid.txt
  ```

  **Evidence to Capture:**
  - [ ] task-18-send-channel-message.txt
  - [ ] task-18-unsupported-admin-op.txt
  - [ ] task-18-invalid-newsletter-jid.txt

  **Commit**: YES (groups with Tasks 12-17)
  - Message: `feat(api): add all controllers and route handlers`
  - Files: `src/controllers/channel.controller.ts, src/routes/channel.routes.ts, src/controllers/__tests__/channel.controller.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 19. Express App Assembly + Route Wiring

  **What to do**:
  - Create `src/app.ts` — the main Express application factory
  - Create `src/server.ts` — HTTP server startup with WebSocket upgrade handling
  - Create `src/routes/index.ts` — barrel file that mounts all route groups under `/api`
  - Wire all route groups:
    - `GET /api/health/ping` → health controller
    - `/api/sessions/*` → session routes (Tasks 6, 12)
    - `/api/sessions/:sessionId/client/*` → client routes (Task 13)
    - `/api/sessions/:sessionId/messages/*` → message routes (Task 14)
    - `/api/sessions/:sessionId/chats/*` → chat routes (Task 15)
    - `/api/sessions/:sessionId/groups/*` → group routes (Task 16)
    - `/api/sessions/:sessionId/contacts/*` → contact routes (Task 17)
    - `/api/sessions/:sessionId/channels/*` → channel routes (Task 18)
    - `/api/sessions/:sessionId/qr/stream` → SSE QR endpoint (Task 10)
    - `/ws` → WebSocket upgrade (Task 10)
  - Apply middleware in order:
    1. CORS (configurable origins)
    2. `express.json()` with configurable body size limit
    3. Request logging (pino-http)
    4. API key validation (global, from Task 8)
    5. Rate limiting (from Task 8)
    6. Per-route: session name validation, session connected validation
    7. Global error handler (last middleware)
  - Create `src/index.ts` — entry point that:
    1. Loads config (Task 3)
    2. Initializes logger (Task 4)
    3. Creates Express app
    4. Starts HTTP server
    5. Optionally restores saved sessions on startup
    6. Graceful shutdown handler (SIGTERM/SIGINT) that terminates all sessions
  - Write vitest tests for app creation and route mounting

  **Must NOT do**:
  - Do NOT inline any business logic in app.ts — it only wires routes and middleware
  - Do NOT use `app.listen()` directly — use `http.createServer(app)` for WebSocket upgrade support
  - Do NOT hardcode port — use config
  - Do NOT add Swagger UI here — that's Task 20

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration task that must correctly wire all previous modules together. Requires understanding of Express middleware ordering, WebSocket upgrade handling, and graceful shutdown.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (Sequential — depends on all controllers)
  - **Blocks**: Tasks 20, 21, 22, 23, 24
  - **Blocked By**: Tasks 1-18 (all prior tasks must be complete)

  **References**:

  **Pattern References** (existing code to follow):
  - `Tempwwebjs-api/src/routes.js` — Complete route wiring for all 8 controller groups. Shows middleware ordering (apikey first, then session validation). Our version improves: nested under `/api`, session ID in path prefix not suffix, proper REST verbs.
  - `Tempwwebjs-api/src/sessions.js:580-601` — `restoreSessions()` function for session recovery on startup. Shows the pattern of scanning auth directory and re-initializing sessions.
  - Task 10 (WebSocket + SSE) — WebSocket upgrade handler that needs `http.createServer(app)` pattern

  **API/Type References** (contracts to implement against):
  - `src/config/index.ts` (from Task 3) — PORT, HOST, CORS_ORIGIN, MAX_BODY_SIZE, ENABLE_SWAGGER, RESTORE_SESSIONS_ON_STARTUP
  - `src/middleware/` (from Task 8) — apiKeyAuth, rateLimiter, sessionNameValidation, sessionConnectedValidation, errorHandler
  - All route files from Tasks 12-18

  **External References** (libraries and frameworks):
  - Express middleware ordering: https://expressjs.com/en/guide/using-middleware.html
  - `http.createServer(app)` + WebSocket upgrade: needed because `app.listen()` doesn't expose the raw server for ws upgrade events

  **WHY Each Reference Matters**:
  - routes.js shows the complete wiring pattern but with old URL structure — we restructure to `/api/sessions/:sessionId/...`
  - restoreSessions shows startup recovery logic — critical for production (server restart shouldn't lose all sessions)
  - WebSocket upgrade needs raw http.Server, not Express's wrapper

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `src/__tests__/app.test.ts`
  - [ ] `npx vitest run src/__tests__/app.test.ts` → PASS (5+ tests, 0 failures)
  - [ ] Tests cover: app creation, route mounting verification, middleware ordering, error handler catches unknown routes (404), graceful shutdown

  **QA Scenarios:**

  ```
  Scenario: Server starts and responds to health check
    Tool: Bash (curl)
    Preconditions: Build passes (`npx tsc --noEmit`), no other process on port
    Steps:
      1. Start server: `npx tsx src/index.ts &` (background)
      2. Wait 2s for startup
      3. curl -s http://localhost:3000/api/health/ping
      4. Assert HTTP status 200
      5. Assert response contains `{"success": true}`
      6. Kill server process
    Expected Result: Server starts, health endpoint responds
    Failure Indicators: Port already in use, startup crash, no response
    Evidence: .sisyphus/evidence/task-19-health-check.txt

  Scenario: Unknown route returns 404
    Tool: Bash (curl)
    Preconditions: Server running on localhost:3000
    Steps:
      1. curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/nonexistent
      2. Assert HTTP status 404
      3. Assert response body is JSON with error message
    Expected Result: 404 JSON error, not HTML
    Failure Indicators: 200, HTML error page, or connection refused
    Evidence: .sisyphus/evidence/task-19-404-route.txt

  Scenario: Missing API key returns 401
    Tool: Bash (curl)
    Preconditions: Server running, API_KEY configured
    Steps:
      1. curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/sessions
      2. Assert HTTP status 401
      3. Assert response contains authentication error
    Expected Result: 401 Unauthorized
    Failure Indicators: 200 (no auth enforced), 500 error
    Evidence: .sisyphus/evidence/task-19-missing-api-key.txt
  ```

  **Evidence to Capture:**
  - [ ] task-19-health-check.txt
  - [ ] task-19-404-route.txt
  - [ ] task-19-missing-api-key.txt

  **Commit**: YES
  - Message: `feat(core): assemble Express app with all routes and middleware`
  - Files: `src/app.ts, src/server.ts, src/routes/index.ts, src/index.ts, src/__tests__/app.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 20. Swagger/OpenAPI Specification + UI

  **What to do**:
  - Create `src/swagger.ts` — OpenAPI 3.0 spec generator
  - Generate comprehensive `swagger.json` (or build programmatically) covering ALL endpoints:
    - Session management (8 endpoints)
    - Client operations (30+ endpoints)
    - Message operations (15+ endpoints)
    - Chat operations (12+ endpoints)
    - Group operations (15+ endpoints)
    - Contact operations (9 endpoints)
    - Channel operations (16 endpoints)
    - Health (1 endpoint)
  - For each endpoint document:
    - Summary and description
    - Request body schema (with examples)
    - Response schema (success + error)
    - Authentication requirement (x-api-key header)
    - Path parameters (sessionId)
  - Integrate `swagger-ui-express` into the app:
    - Mount at `GET /api-docs` when `ENABLE_SWAGGER=true` (config-controlled)
    - Serve the JSON spec at `GET /api-docs/json`
  - Use Zod-to-OpenAPI (`@asteasolutions/zod-to-openapi`) or manually craft the spec
  - Write vitest test that validates the generated spec against OpenAPI 3.0 schema

  **Must NOT do**:
  - Do NOT copy wwebjs-api's swagger.json verbatim — our routes and schemas are different
  - Do NOT include Chrome/Puppeteer-specific endpoints in the spec
  - Do NOT make Swagger UI available when ENABLE_SWAGGER is false
  - Do NOT use swagger-autogen — it produces low-quality specs

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Documentation-heavy task requiring systematic endpoint cataloging, but also code integration
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: Could be used to verify Swagger UI renders, but curl check is sufficient

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 21, 22 — after Task 19)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Task 19 (needs all routes wired to document them)

  **References**:

  **Pattern References** (existing code to follow):
  - `Tempwwebjs-api/swagger.json` — Complete OpenAPI spec for wwebjs-api (120+ endpoints). Use as reference for endpoint descriptions and example values, but adapt paths and schemas to our improved API design.
  - `Tempwwebjs-api/src/routes.js:260-263` — Swagger UI mounting pattern with swagger-ui-express

  **API/Type References** (contracts to implement against):
  - All route files from Tasks 12-18 — each defines the exact endpoints to document
  - All Zod schemas from Task 2 — can be converted to OpenAPI schemas

  **External References** (libraries and frameworks):
  - `swagger-ui-express`: https://www.npmjs.com/package/swagger-ui-express
  - `@asteasolutions/zod-to-openapi`: https://github.com/asteasolutions/zod-to-openapi (optional — for auto-generating schemas from Zod)
  - OpenAPI 3.0 spec: https://spec.openapis.org/oas/v3.0.3

  **WHY Each Reference Matters**:
  - wwebjs-api's swagger.json provides excellent endpoint descriptions and examples — adapt language but not copy paths
  - Zod-to-OpenAPI would reduce manual work significantly if Zod schemas are already comprehensive

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `src/__tests__/swagger.test.ts`
  - [ ] `npx vitest run src/__tests__/swagger.test.ts` → PASS
  - [ ] Tests cover: spec is valid OpenAPI 3.0, all route groups present, auth scheme defined

  **QA Scenarios:**

  ```
  Scenario: Swagger UI loads and renders
    Tool: Bash (curl)
    Preconditions: Server running with ENABLE_SWAGGER=true
    Steps:
      1. curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api-docs/
      2. Assert HTTP status 200 (or 301 redirect to trailing slash)
      3. curl -s http://localhost:3000/api-docs/ | head -20
      4. Assert response contains 'swagger-ui' HTML
    Expected Result: Swagger UI HTML page served
    Failure Indicators: 404, empty response, or plain JSON
    Evidence: .sisyphus/evidence/task-20-swagger-ui.txt

  Scenario: OpenAPI JSON spec endpoint works
    Tool: Bash (curl)
    Preconditions: Server running with ENABLE_SWAGGER=true
    Steps:
      1. curl -s http://localhost:3000/api-docs/json
      2. Assert HTTP status 200
      3. Assert response is valid JSON
      4. Assert JSON contains `"openapi": "3.0"` (or 3.0.x)
      5. Assert JSON contains paths for `/api/sessions`, `/api/health/ping`
    Expected Result: Valid OpenAPI 3.0 JSON spec returned
    Failure Indicators: 404, invalid JSON, missing paths
    Evidence: .sisyphus/evidence/task-20-openapi-spec.txt

  Scenario: Swagger disabled when ENABLE_SWAGGER=false
    Tool: Bash (curl)
    Preconditions: Server running with ENABLE_SWAGGER=false
    Steps:
      1. curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api-docs/
      2. Assert HTTP status 404
    Expected Result: Swagger UI not mounted
    Failure Indicators: 200 (Swagger still accessible)
    Evidence: .sisyphus/evidence/task-20-swagger-disabled.txt
  ```

  **Evidence to Capture:**
  - [ ] task-20-swagger-ui.txt
  - [ ] task-20-openapi-spec.txt
  - [ ] task-20-swagger-disabled.txt

  **Commit**: YES
  - Message: `docs(api): add OpenAPI 3.0 spec and Swagger UI`
  - Files: `src/swagger.ts, swagger.json (if static)`
  - Pre-commit: `npx vitest run`

- [x] 21. Docker Support (Dockerfile + docker-compose)

  **What to do**:
  - Create `Dockerfile` — multi-stage build:
    - **Stage 1 (build)**: `node:20-alpine`, install deps, compile TypeScript
    - **Stage 2 (production)**: `node:20-alpine`, copy compiled JS + node_modules (production only), non-root user
    - Expose port (default 3000)
    - CMD: `node dist/index.js`
    - NO Chromium, NO Puppeteer, NO browser dependencies — just Node.js
  - Create `docker-compose.yml`:
    - Service: `wa-socket`
    - Volume mount for session auth data persistence: `./data/auth:/app/data/auth`
    - Environment variables from `.env` file
    - Restart policy: `unless-stopped`
    - Health check: `curl -f http://localhost:3000/api/health/ping || exit 1`
  - Create `.dockerignore` — exclude: node_modules, .git, .env, dist, .sisyphus, Tempwwebjs-api
  - Ensure TypeScript compiles cleanly before Docker build (`tsconfig.json` outDir: `dist`)

  **Must NOT do**:
  - Do NOT install Chrome/Chromium/Puppeteer in Docker — this is the key advantage over wwebjs-api
  - Do NOT use `node:20` (full image) — use `node:20-alpine` for minimal size
  - Do NOT run as root in production stage
  - Do NOT include devDependencies in production image

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Docker setup, well-known patterns, no complex logic
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser needed for Docker build/test

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 20, 22 — after Task 19)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Task 19 (needs complete app to containerize)

  **References**:

  **Pattern References** (existing code to follow):
  - `Tempwwebjs-api/Dockerfile` (if exists) — Note: theirs includes Chromium deps. Ours is MUCH simpler.
  - `Tempwwebjs-api/docker-compose.yml` (if exists) — Volume and env patterns to reference

  **External References** (libraries and frameworks):
  - Node.js Docker best practices: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
  - Multi-stage builds: Alpine-based, non-root user, production-only deps

  **WHY Each Reference Matters**:
  - wwebjs-api Docker files show what NOT to do (Chrome deps) and what to keep (volume patterns for auth persistence)
  - Alpine image keeps container ~150MB vs ~900MB with Chromium

  **Acceptance Criteria**:

  **TDD:** N/A (Docker files, no unit tests)

  **QA Scenarios:**

  ```
  Scenario: Docker image builds successfully
    Tool: Bash
    Preconditions: Docker daemon running
    Steps:
      1. docker build -t wa-socket:test .
      2. Assert exit code 0
      3. docker images wa-socket:test --format '{{.Size}}'
      4. Assert image size < 300MB (no Chromium)
    Expected Result: Image builds, size is reasonable (< 300MB)
    Failure Indicators: Build fails, image > 500MB (Chromium leak)
    Evidence: .sisyphus/evidence/task-21-docker-build.txt

  Scenario: Container starts and health check passes
    Tool: Bash
    Preconditions: Docker image built, port 3000 free
    Steps:
      1. docker run -d --name wa-socket-test -p 3000:3000 -e API_KEY=test-key wa-socket:test
      2. Wait 5s for startup
      3. curl -s http://localhost:3000/api/health/ping
      4. Assert HTTP status 200
      5. docker stop wa-socket-test && docker rm wa-socket-test
    Expected Result: Container starts, health check responds
    Failure Indicators: Container exits immediately, no response on port 3000
    Evidence: .sisyphus/evidence/task-21-docker-run.txt
  ```

  **Evidence to Capture:**
  - [ ] task-21-docker-build.txt
  - [ ] task-21-docker-run.txt

  **Commit**: YES
  - Message: `chore(docker): add Dockerfile and docker-compose for containerized deployment`
  - Files: `Dockerfile, docker-compose.yml, .dockerignore`
  - Pre-commit: `docker build -t wa-socket:test .`

- [x] 22. Environment Config (.env.example) + README

  **What to do**:
  - Create `.env.example` with ALL configuration variables, documented with comments:
    ```
    # Server
    PORT=3000
    HOST=0.0.0.0
    
    # Authentication
    API_KEY=your-api-key-here
    
    # Sessions
    MAX_SESSIONS=10
    RESTORE_SESSIONS_ON_STARTUP=true
    AUTH_DATA_DIR=./data/auth
    
    # Rate Limiting
    RATE_LIMIT_WINDOW_MS=60000
    RATE_LIMIT_MAX=100
    
    # Webhook
    GLOBAL_WEBHOOK_URL=
    WEBHOOK_ENABLED=true
    
    # WebSocket
    WEBSOCKET_ENABLED=true
    
    # Swagger
    ENABLE_SWAGGER=true
    
    # CORS
    CORS_ORIGIN=*
    
    # Logging
    LOG_LEVEL=info
    ```
  - Create `README.md` with sections:
    1. **Project Title + Description** — What it does, why Baileys over wwebjs
    2. **Features** — Multi-session, REST API, WebSocket, SSE QR, Swagger, Docker
    3. **Quick Start** — npm install + npm run dev (3 steps)
    4. **Docker** — docker-compose up (2 steps)
    5. **Configuration** — All env vars with descriptions
    6. **API Overview** — Route groups with example curl commands
    7. **Authentication** — API key header usage
    8. **Webhook Events** — List of supported events
    9. **QR Code** — SSE streaming endpoint usage
    10. **License** — MIT (or as user prefers)
  - Create `.env` with sensible development defaults (gitignored)
  - Ensure `.gitignore` includes: node_modules, dist, .env, data/, .sisyphus/

  **Must NOT do**:
  - Do NOT include Chrome/Puppeteer env vars (CHROME_BIN, HEADLESS, etc.)
  - Do NOT write an excessively long README — concise, scannable, example-driven
  - Do NOT include real API keys or phone numbers in examples
  - Do NOT create docs/ directory — README.md is sufficient

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation-focused task, README quality matters
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 20, 21 — after Task 19)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Task 19 (needs to know final API structure for documentation)

  **References**:

  **Pattern References** (existing code to follow):
  - `Tempwwebjs-api/.env.example` — Shows all config vars for the original project. Remove Chrome-specific ones, keep: API_KEY, PORT, ENABLE_LOCAL_CALLBACK_EXAMPLE, ENABLE_SWAGGER_ENDPOINT, MAX_ATTACHMENT_SIZE, SET_MESSAGES_AS_SEEN, DISABLED_CALLBACKS, WEB_VERSION, WEB_VERSION_CACHE_TYPE, RECOVER_SESSIONS.
  - `Tempwwebjs-api/README.md` (if exists) — Structure reference

  **API/Type References** (contracts to implement against):
  - `src/config/index.ts` (from Task 3) — The source of truth for all env vars

  **WHY Each Reference Matters**:
  - .env.example from wwebjs-api shows which configs users expect — we add ours (webhook URL, WebSocket enable) and remove theirs (Chrome)

  **Acceptance Criteria**:

  **TDD:** N/A (documentation, no unit tests)

  **QA Scenarios:**

  ```
  Scenario: .env.example contains all required variables
    Tool: Bash
    Preconditions: File exists at project root
    Steps:
      1. cat .env.example
      2. Assert contains: PORT, API_KEY, MAX_SESSIONS, RESTORE_SESSIONS_ON_STARTUP, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, GLOBAL_WEBHOOK_URL, WEBSOCKET_ENABLED, ENABLE_SWAGGER, CORS_ORIGIN, LOG_LEVEL
      3. Assert does NOT contain: CHROME_BIN, HEADLESS, PUPPETEER
    Expected Result: All non-Chrome vars present, no Chrome vars
    Failure Indicators: Missing critical env vars, Chrome vars present
    Evidence: .sisyphus/evidence/task-22-env-example.txt

  Scenario: README has all required sections
    Tool: Bash
    Preconditions: README.md exists at project root
    Steps:
      1. cat README.md
      2. Assert contains headings: Features, Quick Start, Docker, Configuration, API, Authentication
      3. Assert contains at least one curl example
      4. Assert does NOT mention Chromium, Puppeteer, or whatsapp-web.js as a dependency
    Expected Result: Comprehensive README with correct information
    Failure Indicators: Missing sections, references to Chrome/Puppeteer
    Evidence: .sisyphus/evidence/task-22-readme.txt
  ```

  **Evidence to Capture:**
  - [ ] task-22-env-example.txt
  - [ ] task-22-readme.txt

  **Commit**: YES
  - Message: `docs: add .env.example, README, and .gitignore`
  - Files: `.env.example, README.md, .gitignore, .env`
  - Pre-commit: N/A

- [x] 23. Integration Tests (Multi-Session Lifecycle)

  **What to do**:
  - Create `src/__tests__/integration/session-lifecycle.test.ts`
  - Write integration tests that exercise the full session lifecycle via HTTP:
    1. **Session create + QR flow**: POST to start session → GET QR SSE stream → verify QR events arrive
    2. **Multi-session isolation**: Start 2 sessions → verify they have separate states
    3. **Session stop + restart**: Start → stop → restart → verify reconnection
    4. **Session terminate**: Start → terminate → verify cleanup (auth data optional)
    5. **List sessions**: Start 2 sessions → GET list → verify both present with correct status
    6. **Webhook delivery**: Configure webhook URL → trigger event → verify webhook POST received (use local HTTP server in test)
    7. **WebSocket events**: Connect to /ws → start session → verify connection events arrive over WS
    8. **Rate limiting**: Send requests exceeding rate limit → verify 429 response
    9. **Error propagation**: Invalid session ID → verify proper error shape
  - Use `supertest` for HTTP testing against the Express app (no real server needed)
  - Mock Baileys socket at the `makeWASocket` boundary — don't hit WhatsApp servers
  - Use vitest with longer timeout for async tests (10s)
  - Create a test helper that builds a test app instance with mocked config

  **Must NOT do**:
  - Do NOT connect to real WhatsApp servers — all Baileys calls must be mocked
  - Do NOT share state between test cases — each test gets fresh app + session manager
  - Do NOT test individual controller logic — that's covered by unit tests in Tasks 12-18
  - Do NOT use snapshots — assert specific response shapes

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex test setup requiring mocking strategy, async event handling, multi-session state management
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser — these are HTTP-level integration tests

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Task 24 — after Task 19)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Task 19 (needs fully assembled app)

  **References**:

  **Pattern References** (existing code to follow):
  - All unit test files from Tasks 12-18 — Mocking patterns for Baileys socket and session manager
  - `src/app.ts` (Task 19) — App factory function to create test instances
  - `src/services/session-manager.ts` (Task 6) — The boundary where Baileys is injected and can be mocked

  **API/Type References** (contracts to implement against):
  - All route definitions from Tasks 12-18 — These define the HTTP contracts being tested
  - `src/types/index.ts` (Task 2) — Response envelope shapes to assert against

  **External References** (libraries and frameworks):
  - `supertest`: https://www.npmjs.com/package/supertest — HTTP assertions on Express apps without starting a real server
  - Vitest async testing: `vi.useFakeTimers()`, `vi.advanceTimersByTime()` for timeout scenarios

  **WHY Each Reference Matters**:
  - Unit test mocking patterns establish how to mock Baileys — integration tests extend this to full request-response cycles
  - App factory function enables creating isolated test instances per test suite
  - supertest avoids port conflicts and enables clean async HTTP testing

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test files created in `src/__tests__/integration/`
  - [ ] `npx vitest run src/__tests__/integration/` → PASS (9+ tests, 0 failures)
  - [ ] Tests run in < 30s total (mocked, no real WA connections)

  **QA Scenarios:**

  ```
  Scenario: All integration tests pass
    Tool: Bash
    Preconditions: All dependencies installed, no port conflicts
    Steps:
      1. npx vitest run src/__tests__/integration/ --reporter=verbose
      2. Assert exit code 0
      3. Assert output shows 9+ tests passed, 0 failed
      4. Assert total time < 30s
    Expected Result: All integration tests green
    Failure Indicators: Any test failure, timeout > 30s, import errors
    Evidence: .sisyphus/evidence/task-23-integration-tests.txt

  Scenario: Tests are properly isolated (no state leakage)
    Tool: Bash
    Preconditions: Integration tests exist
    Steps:
      1. npx vitest run src/__tests__/integration/ --sequence.shuffle
      2. Assert exit code 0 (tests pass in any order)
      3. Run again: npx vitest run src/__tests__/integration/ --sequence.shuffle
      4. Assert exit code 0 both times
    Expected Result: Tests pass regardless of execution order
    Failure Indicators: Tests fail when shuffled but pass in order
    Evidence: .sisyphus/evidence/task-23-test-isolation.txt
  ```

  **Evidence to Capture:**
  - [ ] task-23-integration-tests.txt
  - [ ] task-23-test-isolation.txt

  **Commit**: YES
  - Message: `test(integration): add multi-session lifecycle integration tests`
  - Files: `src/__tests__/integration/session-lifecycle.test.ts, src/__tests__/integration/test-helpers.ts`
  - Pre-commit: `npx vitest run`

- [x] 24. API Endpoint Smoke Tests (Full Coverage Sweep)

  **What to do**:
  - Create `src/__tests__/smoke/endpoints.test.ts`
  - Write a comprehensive smoke test that hits EVERY endpoint with valid request shape:
    - Goal: Verify all routes are mounted, accept correct HTTP method, validate request body, return correct response envelope
    - NOT testing business logic — just that the endpoint exists and responds correctly to valid/invalid input
  - Test matrix (for each endpoint):
    1. ✅ Valid request → 200 (or 201) with `{ success: true, ... }`
    2. ❌ Missing required field → 400 with validation error
    3. ❌ Wrong HTTP method → 404 or 405
    4. ❌ Missing API key → 401
  - Group by controller:
    - Session endpoints: 8 tests
    - Client endpoints: 30+ tests
    - Message endpoints: 15+ tests
    - Chat endpoints: 12+ tests
    - Group endpoints: 15+ tests
    - Contact endpoints: 9 tests
    - Channel endpoints: 16 tests
    - Health: 1 test
  - Use `supertest` against app factory
  - Mock all Baileys socket methods to return predictable data
  - This serves as a regression safety net — if any route is accidentally removed, this catches it

  **Must NOT do**:
  - Do NOT test deep business logic — integration tests (Task 23) cover that
  - Do NOT connect to WhatsApp — all mocked
  - Do NOT duplicate integration test scenarios — these are shallow endpoint existence checks
  - Do NOT skip any endpoint — this is a COMPLETE coverage sweep

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Repetitive but comprehensive — needs to systematically cover 100+ endpoints
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Task 23)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Task 19 (needs fully assembled app)

  **References**:

  **Pattern References** (existing code to follow):
  - `Tempwwebjs-api/src/routes.js` — Complete route list (ALL endpoints). Use this as the checklist to ensure every endpoint has a smoke test.
  - Task 23 integration test helpers — Reuse the test app factory and Baileys mock setup

  **API/Type References** (contracts to implement against):
  - All route files from Tasks 12-18 — These define every endpoint
  - `src/types/index.ts` (Task 2) — Standard response envelopes

  **External References** (libraries and frameworks):
  - `supertest` — Same as Task 23

  **WHY Each Reference Matters**:
  - routes.js is the definitive list of 120+ endpoints — smoke tests must cover all of them
  - Test helpers from Task 23 prevent duplicating mock setup code

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test files created in `src/__tests__/smoke/`
  - [ ] `npx vitest run src/__tests__/smoke/` → PASS (100+ tests, 0 failures)
  - [ ] Every endpoint in routes/index.ts has at least one smoke test

  **QA Scenarios:**

  ```
  Scenario: All smoke tests pass with 100+ endpoint coverage
    Tool: Bash
    Preconditions: All dependencies installed
    Steps:
      1. npx vitest run src/__tests__/smoke/ --reporter=verbose 2>&1 | tee output.txt
      2. Assert exit code 0
      3. Count test cases: grep -c 'PASS\|✓' output.txt
      4. Assert count >= 100
    Expected Result: 100+ tests passing, full endpoint coverage
    Failure Indicators: Any test failure, fewer than 100 tests
    Evidence: .sisyphus/evidence/task-24-smoke-tests.txt

  Scenario: Missing API key returns 401 for all protected endpoints
    Tool: Bash
    Preconditions: Smoke tests exist
    Steps:
      1. grep -c '401' src/__tests__/smoke/endpoints.test.ts
      2. Assert count > 0 (401 tests exist)
      3. npx vitest run src/__tests__/smoke/ --reporter=verbose
      4. Assert all 401 tests pass
    Expected Result: Every protected endpoint rejects missing API key
    Failure Indicators: Any endpoint accepts request without API key
    Evidence: .sisyphus/evidence/task-24-auth-coverage.txt
  ```

  **Evidence to Capture:**
  - [ ] task-24-smoke-tests.txt
  - [ ] task-24-auth-coverage.txt

  **Commit**: YES
  - Message: `test(smoke): add comprehensive endpoint smoke tests for all 100+ routes`
  - Files: `src/__tests__/smoke/endpoints.test.ts`
  - Pre-commit: `npx vitest run`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + lint + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify TypeScript strict mode is enforced.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Boot server with `npm start`. Verify health endpoint. Start a session, get QR code. Test send message endpoint (mock or real). Test session lifecycle (start → status → stop → terminate). Verify webhook delivery. Test error cases (invalid session, bad API key, missing params). Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Files | Pre-commit |
|------|--------|---------|-------|------------|
| 1 | T1 | `chore: scaffold project with TypeScript, vitest, and build config` | package.json, tsconfig.json, vitest.config.ts, .gitignore | `npx tsc --noEmit` |
| 1 | T2-T5 | `feat(core): add shared types, config, logger, and error utilities` | src/types/, src/config.ts, src/logger.ts, src/utils/ | `npx vitest run` |
| 2 | T6-T7 | `feat(session): add Baileys session manager with custom store` | src/services/session-manager.ts, src/services/store.ts | `npx vitest run` |
| 2 | T8-T11 | `feat(infra): add middleware, webhook, websocket, and media handling` | src/middleware/, src/services/webhook.ts, src/services/websocket.ts, src/services/media.ts | `npx vitest run` |
| 3 | T12-T18 | `feat(api): add all controllers and route handlers` | src/controllers/, src/routes/ | `npx vitest run` |
| 4 | T19 | `feat(app): assemble Express app with all routes and middleware` | src/app.ts, src/server.ts | `npx vitest run` |
| 4 | T20-T22 | `docs: add Swagger spec, Dockerfile, docker-compose, and README` | swagger.json, Dockerfile, docker-compose.yml, .env.example, README.md | `docker build .` |
| 5 | T23-T24 | `test: add integration and smoke tests` | tests/ | `npx vitest run` |

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit              # Expected: no errors
npx vitest run                # Expected: all tests pass
npm start                     # Expected: server starts on configured port
curl http://localhost:3000/ping  # Expected: {"success":true,"message":"pong"}
docker build -t wa-socket .   # Expected: build succeeds
docker run -p 3000:3000 wa-socket  # Expected: container starts, healthcheck passes
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [ ] All vitest tests pass
- [x] TypeScript compiles with zero errors in strict mode
- [ ] Docker builds and runs successfully
- [x] Swagger docs serve at /api-docs
- [ ] Server handles 5+ concurrent sessions without crash
