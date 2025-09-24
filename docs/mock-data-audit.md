# Mock Data Audit (Phase 1)

## Completed Work
- Catalogued outstanding mock-driven surfaces across analytics, admin, integrations, documentation, and localization experiences so they can be methodically replaced with live backend calls.【F:components/seo/seo-accessibility-optimizer.tsx†L74-L161】【F:app/admin/chat/stats/page.tsx†L54-L92】【F:components/integrations/GoogleDriveUpload.tsx†L108-L199】
- Hardened the social experience by replacing the remaining mock datasets with live users, activity, and community calls from `usersAPI`/`socialAPI`, extending the API client where filtering support was missing.【F:components/social/enhanced-social-features.tsx†L271-L352】【F:components/social/smart-friend-search.tsx†L129-L340】【F:components/social/online-status-indicators.tsx†L134-L170】【F:app/dashboard/friends/activity/page.tsx†L90-L177】【F:lib/api/users.ts†L204-L233】

## Phase 3 – Discovery & Notifications
- **DiscoverPage** orchestrates trending videos, parties, user suggestions, categories, and metrics with live data from `searchAPI`, `videosAPI`, `partiesAPI`, `usersAPI`, and `analyticsAPI`, normalizing payloads and surfacing loading/error states for each fetch.【F:app/discover/page.tsx†L546-L792】【F:app/discover/page.tsx†L886-L1382】
- **GroupedNotifications** now loads, paginates, and mutates real notification data, syncing read/delete/bulk actions plus friend request and party invite workflows against the backend services.【F:components/notifications/grouped-notifications.tsx†L3-L404】【F:components/notifications/grouped-notifications.tsx†L404-L507】

## Phase 2 Social Integrations
- **EnhancedSocialFeatures** now pulls friend suggestions, communities, activity feed items, and achievements from backend modules instead of local arrays, including friend request and community join actions.【F:components/social/enhanced-social-features.tsx†L288-L352】
- **SmartFriendSearch** uses `usersAPI.searchUsers`/`getFriendSuggestions` to populate search results and recommendation tabs with live data and real friend-request flows.【F:components/social/smart-friend-search.tsx†L151-L347】
- **OnlineStatusIndicators** polls `usersAPI.getOnlineStatus`, normalizes presence metadata, and only surfaces toast errors on initial failure.【F:components/social/online-status-indicators.tsx†L134-L170】
- **FriendsActivityFeed** consumes `usersAPI.getActivity`, mapping backend payloads into the existing UI with filter/timeframe support.【F:app/dashboard/friends/activity/page.tsx†L90-L171】

## Remaining Mock Data Consumers
### Analytics & Monitoring
| Location | Mock usage | Recommended API | Notes |
| --- | --- | --- | --- |
| `components/seo/seo-accessibility-optimizer.tsx` | Empty SEO/accessibility arrays backfill the UI before fake transforms run.【F:components/seo/seo-accessibility-optimizer.tsx†L74-L161】 | `analyticsAPI.getSystemAnalytics`, `adminAPI.getLogs`【F:backend-api.json†L3174-L3198】【F:backend-api.json†L5227-L5266】 | Use performance and log endpoints already powering admin dashboards to populate metrics/issues.
| `components/analytics/real-time-analytics.tsx` | Mock live users, rooms, and chart series drive the entire real-time dashboard.【F:components/analytics/real-time-analytics.tsx†L43-L123】 | `analyticsAPI.getRealtimeAnalytics`, `analyticsAPI.getRealTimeData`【F:backend-api.json†L3257-L3398】 | Wire the existing real-time analytics feeds and remove duplicated generators.
| `components/video/stream-analytics-overlay.tsx` | Simulated viewer counts and retention curves render overlays.【F:components/video/stream-analytics-overlay.tsx†L48-L118】 | `videosAPI.getVideoAnalytics`, `videosAPI.getProcessingStatus`【F:backend-api.json†L1551-L1591】 | Fetch server analytics so live/recorded overlays reflect production metrics.
| `components/video/video-processing-pipeline.tsx` | Processing queues, tasks, and settings are hard-coded fixtures.【F:components/video/video-processing-pipeline.tsx†L92-L168】 | `videosAPI.getProcessingStatus`, `videosAPI.getProcessingJobs`【F:backend-api.json†L1551-L1591】 | Use video processing endpoints for job state, task progress, and output artifacts.
| `components/performance/performance-optimizer.tsx` | Synthetic performance metrics, bundle stats, and history populate charts.【F:components/performance/performance-optimizer.tsx†L74-L193】 | `analyticsAPI.getSystemPerformance`, `analyticsAPI.getDashboard`【F:backend-api.json†L3174-L3237】 | Replace random metrics with analytics/system feeds to align with ops dashboards.
| `components/monitoring/monitoring-dashboard.tsx` | Metrics, logs, alerts, and service health come from local arrays.【F:components/monitoring/monitoring-dashboard.tsx†L92-L219】 | `adminAPI.getSystemHealth`, `adminAPI.getLogs`, `analyticsAPI.getSystemAnalytics`【F:backend-api.json†L3174-L3198】【F:backend-api.json†L5227-L5266】 | Bind to the same admin telemetry used for system status pages.
| `app/admin/system/page.tsx` | Historical charts are generated client-side instead of via health endpoints.【F:app/admin/system/page.tsx†L161-L188】 | `adminAPI.getSystemHealth`, `adminAPI.getLogs`【F:backend-api.json†L5227-L5266】 | Pull real CPU/memory/network history and reuse log export routes.
| `components/deployment/deployment-pipeline.tsx` | Deployments, stages, and environments are mock arrays updated locally.【F:components/deployment/deployment-pipeline.tsx†L71-L198】 | `adminAPI.getDashboard`, `adminAPI.getAnalytics`【F:backend-api.json†L4966-L4989】 | Surface real deployment history and environment health from admin dashboards.
| `app/admin/analytics/advanced/page.tsx` | Metrics, segments, regions, and device stats are fabricated.【F:app/admin/analytics/advanced/page.tsx†L52-L187】 | `analyticsAPI.getDashboard`, `analyticsAPI.postAdvancedQuery`【F:backend-api.json†L3200-L3284】 | Drive advanced analytics cards from dashboard and custom-query endpoints.

### Admin, Security & Support Tools
| Location | Mock usage | Recommended API | Notes |
| --- | --- | --- | --- |
| `components/admin/faq-management.tsx` | FAQ list and stats are seeded locally on load.【F:components/admin/faq-management.tsx†L80-L154】 | `supportAPI.getFAQs`, `supportAPI.updateFAQ`, `supportAPI.voteFAQ`【F:backend-api.json†L4493-L4545】 | Hook CRUD, ordering, and voting to support FAQ endpoints.
| `app/admin/chat/stats/page.tsx` | Chat totals, charts, and moderation activity are randomised datasets.【F:app/admin/chat/stats/page.tsx†L54-L92】 | `chatAPI.getPartyMessages`, `chatAPI.getActiveUsers`【F:backend-api.json†L2514-L2635】 | Fetch room analytics and moderation stats from chat endpoints.
| `components/groups/group-management-system.tsx` | Group/member lists rely on mock payloads and fake delays.【F:components/groups/group-management-system.tsx†L95-L190】 | `socialAPI.getGroups`, `socialAPI.getGroup`, `socialAPI.joinGroup`【F:backend-api.json†L4745-L4799】 | Use social group endpoints for roster management and membership actions.
| `components/security/advanced-security-system.tsx` | Threats, rules, audit logs, and compliance reports are hard-coded.【F:components/security/advanced-security-system.tsx†L86-L220】 | `adminAPI.getSystemHealth`, `adminAPI.getLogs`, `adminAPI.getComplianceReports`【F:backend-api.json†L5227-L5266】 | Bind security dashboards to admin telemetry and compliance feeds.
| `components/security/session-management.tsx` | Session list and revoke flows operate on mock sessions only.【F:components/security/session-management.tsx†L64-L151】 | `usersAPI.getSessions`, `usersAPI.deleteSession`, `usersAPI.revokeAllSessions`【F:backend-api.json†L846-L1215】 | Replace fixtures with real session management and destructive actions.
| `components/testing/testing-suite-dashboard.tsx` | Test suites and results are fabricated and timers simulate execution.【F:components/testing/testing-suite-dashboard.tsx†L102-L200】 | `analyticsAPI.getDashboard`, `analyticsAPI.postAdvancedQuery`【F:backend-api.json†L3200-L3284】 | Expose CI/test analytics via dashboard and advanced query endpoints.
| `app/admin/translations/page.tsx` | Language progress and translation rows are mock structures.【F:app/admin/translations/page.tsx†L51-L157】 | Add localization endpoints (new) | Backend lacks localization routes—coordinate to expose translation project CRUD.

### Integrations & External Services
| Location | Mock usage | Recommended API | Notes |
| --- | --- | --- | --- |
| `components/integrations/google-drive-upload.tsx` | Folder tree, uploads, and progress are simulated on the client.【F:components/integrations/google-drive-upload.tsx†L67-L154】 | `integrationsAPI.getGoogleDriveFiles`, `integrationsAPI.getGoogleDriveAuthUrl`, `integrationsAPI.getGoogleDriveStreamingUrl`【F:backend-api.json†L3717-L3776】 | Mirror Google Drive auth, browsing, and upload flows via integrations endpoints.
| `components/integrations/GoogleDriveUpload.tsx` | Mock file listings and upload timers stand in for Drive APIs.【F:components/integrations/GoogleDriveUpload.tsx†L108-L199】 | `integrationsAPI.getGoogleDriveFiles`, `integrationsAPI.getGoogleDriveAuthUrl`【F:backend-api.json†L3717-L3776】 | Consolidate with the shared Drive client once live data is wired.
| `app/dashboard/settings/integrations/google-drive/page.tsx` | Sync status and folder listings are hard-coded.【F:app/dashboard/settings/integrations/google-drive/page.tsx†L25-L179】 | `integrationsAPI.getGoogleDriveFiles`, `integrationsAPI.getGoogleDriveAuthUrl`【F:backend-api.json†L3717-L3776】 | Drive the settings page from real Drive status, folders, and usage metrics.
| `app/dashboard/settings/integrations/discord/page.tsx` | Connected account and server list are static mocks.【F:app/dashboard/settings/integrations/discord/page.tsx†L35-L188】 | `integrationsAPI.getAuthUrl('discord')`, `integrationsAPI.getHealth`【F:backend-api.json†L3694-L3733】 | Use generic OAuth + health endpoints to surface Discord connection state.

### Content, Localization & Engagement
| Location | Mock usage | Recommended API | Notes |
| --- | --- | --- | --- |
| `components/documentation/documentation-manager.tsx` | Documents, categories, and edits bootstrap from fixtures.【F:components/documentation/documentation-manager.tsx†L60-L160】 | Add `DocsAPI` for `/api/docs/` content【F:backend-api.json†L57-L92】 | Implement knowledge-base CRUD so authors work against live docs.
| `components/i18n/multi-language-system.tsx` | Language, translation, and project data are seeded locally.【F:components/i18n/multi-language-system.tsx†L103-L218】 | Add localization endpoints (new) | Coordinate backend work to expose translation projects, keys, and approvals.
| `components/billing/chat/typing-indicators.tsx` | Random typing users simulate presence instead of websocket/REST feeds.【F:components/billing/chat/typing-indicators.tsx†L21-L55】 | `chatAPI.getActiveUsers`, websocket presence【F:backend-api.json†L2514-L2635】 | Replace timers with room presence polling or socket subscriptions.

## Missing Client API Helpers (TODO)
- [ ] Add a lightweight `DocsAPI` client to surface `/api/docs/` content alongside documentation management surfaces.【F:backend-api.json†L57-L92】
- [ ] Introduce a `DashboardAPI` wrapper for `/api/dashboard/activities/` so activity summaries can be reused outside the friends feed.【F:backend-api.json†L140-L167】
- [ ] Extend `analyticsAPI` with helpers for `/api/analytics/dashboard/realtime/` and `/api/analytics/advanced/query/` to support the remaining dashboards.【F:backend-api.json†L3200-L3284】
- [ ] Plan a `LocalizationAPI` once translation endpoints are defined, covering language status, strings, and approvals.【F:components/i18n/multi-language-system.tsx†L103-L218】
