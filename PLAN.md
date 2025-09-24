# API Integration Remediation Plan

This plan addresses the remaining areas of the frontend that rely on mock data or simulated timers. Phases are ordered from the fastest wins to the deepest, longest-running initiatives. Each phase lists the concrete instructions to complete before moving to the next.

## Phase 1 – Mock Data Audit & API Module Gap Analysis (Fastest Wins)
- Enumerate every component and hook still importing static arrays or mock helpers (use `rg` for `mock`, `placeholder`, `setTimeout`, etc.).
- Cross-reference findings with `backend-api.json` to confirm the intended endpoint for each mock dataset.
- Document missing client API helpers (e.g., `communitiesAPI`, deployment history loaders) and create TODO tickets for absent modules.
- Remove unused mock files or fixtures that no longer have consumers to prevent regression.

## Phase 2 – Social & Community Features
- Replace hard-coded arrays in `EnhancedSocialFeatures`, `SmartFriendSearch`, `OnlineStatusIndicators`, and `FriendsActivityFeed` with calls to the existing `usersAPI` and social/community endpoints.
- Implement real-time presence polling or WebSocket subscriptions for online status after the initial REST integration.
- Wire friend activity and notification payloads to backend data shapes, adding pagination and filtering parameters supported by the API.
- Update unit tests and Storybook stories to reflect live data flows (use MSW or API mocks that mirror backend contracts).

## Phase 3 – Discovery & Notification Surfaces
- Connect the Discover page (trending videos, suggested users, party recommendations, metrics) to party, video, and user discovery APIs.
- Replace `GroupedNotifications` mock clustering with read/unread state synchronized to backend notification endpoints; ensure batch actions update the server.
- Ensure discovery queries respect pagination, search, and sorting options defined in the backend spec.
- Introduce error/loading UI states for each async fetch.

## Phase 4 – Video Lifecycle & Analytics Integration
- Refactor `VideoProcessingPipeline` and `StreamAnalyticsOverlay` to consume `/api/videos/*` processing and analytics endpoints.
- Consolidate duplicate live analytics helper logic into a shared module that wraps real analytics APIs; remove random data generators.
- Establish polling or socket-based refresh for active streams once REST integration is verified.
- Validate data transforms so progress bars, metrics, and alerts match backend semantics.

## Phase 5 – Admin Dashboards & Support Tooling
- Replace local fixtures in FAQ, chat stats, monitoring, testing suites, group management, translation management, and advanced analytics pages with calls to `supportAPI`, `adminAPI`, `analyticsAPI`, and moderation routes.
- Implement server-driven pagination, filters, and status updates for FAQs, tickets, moderation queues, and analytics tables.
- Ensure admin actions (suspend/ban, FAQ CRUD, ticket responses) persist changes via the backend and update UI state optimistically with rollback handling.
- Remove redundant “historical metrics” generators and bind charts to live system health/performance endpoints.

## Phase 6 – Integrations, Documentation, & Localization
- Connect Google Drive components to auth/status/file/upload endpoints; handle OAuth flows, error states, and upload progress from the server.
- Replace Discord integration placeholders with real integration API calls (account linking, server listings, permission toggles).
- Update `DocumentationManager` and `MultiLanguageSystem` to consume documentation and translation services for live content and contributor activity.
- Add caching and invalidation strategies for frequently accessed integration data to minimize redundant calls.

## Phase 7 – Session & Real-Time Communication Features
- Swap mock session lists in `SessionManagement` for authentication session APIs; provide revoke/refresh flows that call the backend.
- Hook `TypingIndicators` into the real-time WebSocket infrastructure or polling endpoints for typing and presence signals.
- Ensure chat UIs reconcile server-sourced typing states with local user events to avoid flicker.

## Phase 8 – Deployment & Operational Tooling (Longest)
- Integrate deployment dashboard with deployment/CI endpoints for history, environment status, and current pipeline runs.
- Surface testing and monitoring documentation directly from admin/analytics APIs so on-call users see live metrics and alerts.
- Build reusable analytics widgets that can be shared across operational pages once live data is flowing.
- After all integrations, perform a final audit (e.g., `find app -maxdepth 3 -type f -name "page.tsx"`) to verify each page exercises at least one backend gate defined in `backend-api.json`.

## Phase 9 – Verification & Maintenance
- Write integration tests (unit + e2e) that ensure each API gate remains exercised during regression testing.
- Monitor network logs in staging to confirm mock endpoints are gone and API coverage matches the backend catalog.
- Establish lint rules or CI checks that flag reintroduced mock datasets or orphaned fixtures.
- Document ongoing maintenance practices in `DEPLOYMENT.md` or a dedicated runbook to keep frontend and backend contracts aligned.
