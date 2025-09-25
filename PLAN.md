# TypeScript Remediation Plan

## Overview
- **Command used:** `npx tsc --noEmit --pretty false --incremental false`
- **Result:** Hundreds of errors across tests, app routes, API clients, and shared UI utilities. The compiler log is stored at `tsc.log` for reference.
- **Goal:** Eliminate all TypeScript errors by aligning code with the current API surface, tightening type definitions, and fixing outdated mocks/tests. Work should proceed in the phased order below so that foundational typing fixes unlock later steps.

## Phase 1 – Tooling and Global Typings
1. **Install & configure missing testing dependencies.**
   - Add `@testing-library/user-event` (and its types if needed) to `devDependencies` so the import in `__tests__/app/dashboard/friends/activity/page.test.tsx` resolves.【F:__tests__/app/dashboard/friends/activity/page.test.tsx†L1-L4】【F:tsc.log†L7-L12】
   - Ensure `@testing-library/jest-dom` types are picked up globally by extending `tsconfig.json` with a `types` array (e.g., `"types": ["jest", "@testing-library/jest-dom"]`) so matchers like `toBeInTheDocument` stop erroring across the test suite.【F:tsc.log†L9-L52】【F:tsconfig.json†L3-L24】
2. **Standardise Jest globals usage.**
   - Replace invalid `import jest from "jest"` with `import { jest } from "@jest/globals"`, and update files relying on `jest.mocked` to use `vi`-style helpers or proper casting. This affects `__tests__/components/auth/login-form.test.tsx` and any other test relying on `jest.fn` / `jest.mock`.【F:__tests__/components/auth/login-form.test.tsx†L1-L42】【F:tsc.log†L37-L72】
   - Verify `jest.setup.js` still runs after dependency updates.
3. **Create a dedicated `tsconfig.test.json` (if needed).**
   - Scope Jest-only compiler options to the `__tests__` directory to avoid leaking test-only globals into production code.

## Phase 2 – Audit Test Coverage vs. Available Components
1. **Remove or rewrite orphaned tests.**
   - `LoginForm` component referenced in tests no longer exists under `components/auth`, causing module resolution failures.【F:__tests__/components/auth/login-form.test.tsx†L3-L4】【F:tsc.log†L33-L40】 Decide whether to rebuild the component or rewrite the test to cover the actual login UI (check `app/(auth)/login` route).
   - Perform similar validation for other test files to ensure they target real components/pages.
2. **Update mocks to match real APIs.**
   - Align mocked API responses in tests with the actual shapes exported from `lib/api/types.ts` to prevent future drift.

## Phase 3 – Align API Models and App Usage
1. **Reconcile `User`-related fields.**
   - Components expect camelCase properties (`firstName`, `displayName`, `role`, `username`, etc.) but `lib/api/types.ts` exposes snake_case fields.【F:components/navigation/mobile-navigation.tsx†L100-L150】【F:lib/api/types.ts†L24-L60】
   - Decide on a mapping strategy: either normalise API responses (e.g., via transformers) before storing in state or update consuming components to use the snake_case keys. Ensure `types/auth.ts` re-export works once `User` is available.【F:types/auth.ts†L1-L27】【F:tsc.log†L123-L136】
2. **Messaging & notifications domain.**
   - Page `app/dashboard/messages/page.tsx` assumes additional fields (`type`, `lastMessage`, `unreadCount`) absent from `Conversation`/`Message` types.【F:app/dashboard/messages/page.tsx†L119-L210】【F:lib/api/types.ts†L504-L523】
   - Update types to match the backend contract in `backend-api.json`, then adjust UI logic accordingly.
3. **Videos domain.**
   - `app/dashboard/videos/page.tsx` and `components/analytics/video-analytics-view.tsx` reference properties like `uploadProgress`, `views`, `likes`, `uploadAt` not present in `lib/api/types.ts` `Video` model.【F:app/dashboard/videos/page.tsx†L84-L309】【F:lib/api/types.ts†L832-L858】
   - Extend types (or adapt responses) to include these metrics or modify components to consume existing fields.
4. **Analytics data contracts.**
   - Ensure real-time and advanced analytics components rely on consistent API shapes. The current implementation mixes mock data, duplicate helpers (`generateTimeSeriesData`) and expects fields such as `active_parties` not defined in types.【F:components/analytics/real-time-analytics.tsx†L1-L120】【F:tsc.log†L233-L320】
   - Refactor analytics API wrappers (`lib/api/analytics.ts`) to expose typed responses, then update components accordingly.
5. **PaginatedResponse usage.**
   - Several screens (`app/dashboard/messages`, `components/admin/content-moderation`, `components/social/smart-friend-search`) treat `PaginatedResponse<T>` as if it had `results`, `pagination`, or nested `users`. Update interface or destructuring logic to match the real backend pagination structure.【F:tsc.log†L147-L220】【F:lib/api/types.ts†L13-L23】
6. **Axios client error typing.**
   - `lib/api/client.ts` assumes `error.response.data` contains `message`, `detail`, etc., but is typed as `{}` by Axios. Introduce an `ApiErrorPayload` type and cast/validate before accessing properties.【F:lib/api/client.ts†L240-L260】【F:tsc.log†L117-L124】

## Phase 4 – Real-time & Socket Features
1. **Unify socket implementation.**
   - Components (`components/party/*`, `components/billing/chat`, `components/navigation/mobile-navigation`) expect a Socket.IO-style API (`on`, `off`, `emit`). The current context exposes a browser `WebSocket` with `send`/`onmessage`. Choose one approach:
     - Adopt `socket.io-client` end-to-end (update `contexts/socket-context.tsx` to create a `Socket` instance and expose typed event helpers), or
     - Refactor consumers to use the lightweight WebSocket wrapper methods (`joinRoom`, `sendMessage`, `onMessage`).
   - Update TypeScript definitions accordingly to remove `Property 'emit' does not exist on type 'WebSocket'` errors.【F:contexts/socket-context.tsx†L1-L120】【F:tsc.log†L87-L115】
2. **WebRTC typings.**
   - Provide proper typings or shims for `getRemoteStreams`, custom events, and `DisplayMediaStreamConstraints` used in party voice/screen sharing modules.【F:components/party/voice-chat.tsx†L200-L210】【F:components/party/screen-sharing.tsx†L90-L150】
3. **Event models.**
   - Update event scheduling components to use snake_case fields (`start_time`, `max_attendees`) or normalise API responses. Adjust TypeScript definitions in `lib/api/events.ts` accordingly.【F:components/events/event-scheduling-system.tsx†L670-L720】【F:lib/api/types.ts†L600-L720】

## Phase 5 – UI & Utility Components
1. **Charting wrappers.**
   - Tighten typings around Recharts wrappers (`components/ui/chart.tsx`), ensuring props like `payload`, `label`, and `data` are typed against the library’s interfaces or custom generics. Add explicit interfaces for `chartData` arrays instead of `{}` placeholders.【F:components/ui/chart.tsx†L110-L290】【F:tsc.log†L60-L95】
2. **Checkbox and table controls.**
   - Extend `components/ui/checkbox.tsx` to accept `readOnly`/`indeterminate`, or adjust `watch-party-table.tsx` to avoid passing unsupported props.【F:components/ui/checkbox.tsx†L1-L28】【F:components/ui/watch-party-table.tsx†L420-L470】
3. **Lazy image & intersection observer.**
   - Update `useIntersectionObserver` to support generics so `targetRef` can be typed as `RefObject<HTMLDivElement>` when used inside `components/ui/lazy-image.tsx`.【F:components/ui/lazy-image.tsx†L32-L48】【F:lib/performance/lazy-loading.tsx†L35-L60】
4. **Mobile video controls.**
   - Investigate why `useIsMobile` expects arguments; ensure hook typings align so calling it without parameters is valid. Verify exports from `hooks/use-mobile.tsx`.【F:components/ui/mobile-video-controls.tsx†L26-L45】【F:hooks/use-mobile.tsx†L1-L20】
5. **Video upload flow.**
   - Type `progressEvent` in `components/video/video-upload.tsx` using Axios progress event interfaces, and ensure other callbacks have explicit parameter types.【F:components/video/video-upload.tsx†L60-L90】
6. **SEO optimizer.**
   - Give `seoTrends` a concrete type instead of implicit `any[]`, and consolidate dataset initialisation in `components/seo/seo-accessibility-optimizer.tsx`.【F:components/seo/seo-accessibility-optimizer.tsx†L70-L90】【F:tsc.log†L52-L60】
7. **Theme provider props.**
   - Update `components/theme-provider.tsx` and `components/providers.tsx` so prop types match (`attribute`, `defaultTheme`, etc.) to clear the incompatibility.【F:components/theme-provider.tsx†L1-L20】【F:components/providers.tsx†L30-L45】
8. **Tailwind config typing.**
   - Add explicit parameter types to the plugin function in `tailwind.config.ts` (`addUtilities: PluginAPI['addUtilities']`).【F:tailwind.config.ts†L260-L290】

## Phase 6 – Domain-specific Clean-up
1. **Profile & store modules.**
   - Type `response.data` generics for profile/store fetches (`user-achievements.tsx`, `store-purchase-modal.tsx`, etc.) to avoid `unknown` results.【F:components/profile/user-achievements.tsx†L50-L70】【F:components/store/store-purchase-modal.tsx†L70-L110】
2. **Auth context.**
   - Ensure `useAuth` state exposes `role`, `isAdmin`, `loading` only if the backend provides them, or adjust contexts/tests to match available data.【F:contexts/auth-context.tsx†L120-L170】【F:components/auth/protected-route.tsx†L20-L100】
3. **Internationalisation keys.**
   - Expand the translation dictionary or relax typing so `components/i18n/LanguageSwitcher.tsx` accepts the `language.*` keys referenced in the component.【F:components/i18n/LanguageSwitcher.tsx†L150-L250】
4. **Integrations page.**
   - Add types or module declarations for `react-syntax-highlighter` imports (`components/integrations/integration-api-system.tsx`). Consider bundling local type definitions if DefinitelyTyped coverage is missing.【F:components/integrations/integration-api-system.tsx†L20-L170】【F:tsc.log†L320-L340】

## Phase 7 – Verification
1. After each phase (or major PR), run:
   - `npx tsc --noEmit --pretty false --incremental false`
   - `npm run lint`
   - `npm run test`
2. Keep `tsc.log` updated until the project is type-clean, then remove redundant logs/documentation.
