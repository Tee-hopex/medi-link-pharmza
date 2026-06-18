PHARVA Implementation Plan
How to read this plan
Each phase builds on the previous. The API must be fixed first — it's the foundation everything else calls. Web is second (already ~70% connected). Mobile is the largest body of work. Real-time is last because it requires both ends to be connected first.

Phase 1 — API Hardening
Fix the foundation before connecting any client.

1.1 — Enforce RBAC on all routes
requireRole() is defined in auth.middleware.ts but called nowhere. Apply it:

Route file	Rule
patients.router.ts	MEDICAL only — patients are pharmacy/clinical staff feature
inventory.router.ts	MEDICAL or NON_MEDICAL — not PATIENT
marketplace.router.ts (POST/DELETE)	MEDICAL or NON_MEDICAL — patients can browse but not list
jobs.router.ts (POST deactivate)	MEDICAL or NON_MEDICAL
emergency-rx.router.ts (broadcast)	any role, but respond → MEDICAL or NON_MEDICAL only
analytics.router.ts	MEDICAL or NON_MEDICAL
1.2 — Verification level enforcement middleware
Create a requireVerification(...levels: VerificationLevel[]) middleware (same pattern as requireRole). Apply:

Marketplace listing creation → LEVEL_1 minimum
Emergency Rx broadcast → PENDING minimum (so unverified accounts can't spam)
1.3 — Fix escrow refund gap in orders
In orders.service.ts / orders.router.ts, the updateOrderStatus path to CANCELLED only refunds if the order was PENDING. Add refund logic for CONFIRMED and IN_TRANSIT → CANCELLED transitions as well.

1.4 — Add missing API endpoints
Notifications (schema exists, no routes exist):

GET /notifications — fetch user's notifications (paginated, unread first)
PATCH /notifications/:id/read — mark one read
PATCH /notifications/read-all — mark all read
Job Applications (spec requires this, schema does not have it):

Add JobApplication model to Prisma schema with fields: jobId, applicantId, coverMessage, status (PENDING/ACCEPTED/REJECTED), createdAt
POST /jobs/:id/apply — submit application
GET /jobs/:id/applications — poster only, list applicants
PATCH /jobs/:id/applications/:appId — accept/reject (poster only, requireRole MEDICAL/NON_MEDICAL)
Adherence Logging (spec says per-dose TAKEN/MISSED/SKIPPED):

Add AdherenceLog model: medicationScheduleId, doseTime, status (TAKEN/MISSED/SKIPPED), loggedAt
POST /patients/:id/medications/:medId/log — log a dose event
GET /patients/:id/medications/:medId/logs — history
1.5 — Paystack withdrawal
In wallet.router.ts, the withdrawal endpoint debits the wallet but has a // TODO: integrate Paystack transfer API stub. Wire the actual Paystack Transfer API (POST https://api.paystack.co/transfer) using the existing paystack.ts lib — create recipient then initiate transfer.

1.6 — ANNOUNCEMENT channel posting guard
In network.router.ts message-send handler, check: if channel.type === 'ANNOUNCEMENT', only allow MEDICAL users (or add an isAdmin field to ChannelMember).

Phase 2 — Web Frontend Gaps
The web app is mostly wired — these are targeted fixes.

2.1 — Role-based sidebar
Sidebar.tsx renders all nav groups unconditionally. Read user.role from the auth store and filter:

PATIENT role: hide Inventory, Marketplace, Patients, Analytics, MediCareer groups
NON_MEDICAL: hide Patients
MEDICAL: show everything
2.2 — Next.js middleware role-aware redirect
middleware.ts only checks token presence. Decode the JWT payload (without full verification — just parse the claims) to read role, then redirect PATIENT users away from /inventory, /patients, /analytics to /dashboard.

2.3 — Wire Wallet Fund & Withdraw buttons
In the wallet page, the Fund and Withdraw buttons have no onClick. Wire them:

Fund: call POST /wallet/fund/initialize → redirect to Paystack checkout URL → on return, call POST /wallet/fund/verify?reference=...
Withdraw: open a modal with bank account fields → call POST /wallet/withdraw
2.4 — Notifications bell
Add GET /notifications call to a useNotifications hook (polling every 30s, or replace with socket in Phase 5)
Bell icon in the header shows unread count badge
Dropdown lists recent notifications with mark-read on click
2.5 — Socket.io client (prerequisite for 2.6)
Create web/lib/socket.ts — initialize socket.io-client with auth token. Wrap in a React context provider mounted in the dashboard layout. Expose useSocket() hook.

2.6 — Real-time wiring in web
Once socket client exists (2.5):

EmergencyRx page: listen on emergency-rx:response event → append response to local state instead of polling
Network / chat page: listen on channel:{id}:message → append to message list
Orders page: listen on user:{id}:order-update → update order status inline
2.7 — Pharmacy directory page
Add /pharmacies page — calls GET /pharmacies/nearby with the browser's navigator.geolocation coordinates. Renders as a card list (no map dependency needed for web v1).

Phase 3 — Mobile: Auth & API Layer
The entire mobile app currently runs on mock data. This phase builds the real network layer.

3.1 — API client
Create medi-link-mobile/lib/api.ts — an Axios instance configured with:

baseURL from expo-constants / env
Request interceptor: attach Authorization: Bearer <token> from auth store
Response interceptor: on 401, call refresh endpoint → retry → on second 401, logout
3.2 — SecureStore token persistence
The mobile auth store currently holds tokens only in memory. Use expo-secure-store to persist access_token and refresh_token across app restarts. On app boot (_layout.tsx), read from SecureStore and rehydrate the auth store before routing.

3.3 — Real login & register
Replace the setTimeout mock in login.tsx with a real POST /auth/login call via the API client. Fix role: 'PHARMACIST' → use the actual UserRole enum values (MEDICAL, NON_MEDICAL, PATIENT). Wire register.tsx to POST /auth/register.

3.4 — Auth store token refresh & logout
Add a refreshToken() action to the mobile auth store that calls POST /auth/refresh. Wire the logout action to call POST /auth/logout (clears refresh token in DB) and clear SecureStore.

Phase 4 — Mobile: Connect All Screens to API
Screen by screen, replace mock constants with real API calls.

Each screen gets a pattern: loading skeleton → fetch on mount → error state → real data.

4.1 — Inventory
inventory.tsx — replace MOCK_DRUGS with GET /inventory. Wire drug/add.tsx to POST /inventory. Wire drug/[id].tsx to GET /inventory/:id, PATCH /inventory/:id, DELETE /inventory/:id.

4.2 — Marketplace
marketplace.tsx — replace MOCK_LISTINGS with GET /marketplace. Wire listing/[id].tsx to show detail + POST /orders (buy action).

4.3 — Orders
orders.tsx — replace MOCK_ORDERS with GET /orders. Wire status-advance buttons to PATCH /orders/:id/status.

4.4 — Emergency Rx
emergency-rx.tsx — replace the entire BLAST_PHARMACIES/RESPONSE_SCHEDULE demo with real flow: get geolocation → POST /emergency-rx/broadcast → listen on socket for responses (Phase 5 dependency; use polling fallback GET /emergency-rx/:id/responses until then).

4.5 — Patients
patients.tsx — replace MOCK_PATIENTS with GET /patients. Add patient modal → POST /patients. Medication schedule → POST /patients/:id/medications. Only render this tab for MEDICAL role.

4.6 — Wallet
wallet.tsx — replace MOCK_BALANCE / MOCK_TRANSACTIONS with GET /wallet. Wire fund button to Paystack WebView (use expo-web-browser to open checkout URL). Wire withdraw to POST /wallet/withdraw.

4.7 — Network / Chat
network.tsx — replace MOCK_CHANNELS with GET /network/channels. Wire join → POST /network/channels/:id/join. Wire channel/[id].tsx to GET /network/channels/:id/messages + POST /network/channels/:id/messages (socket real-time in Phase 5).

4.8 — MediCareer
medi-career.tsx — replace MOCK_JOBS with GET /jobs. Wire apply → POST /jobs/:id/apply (requires Phase 1.4 job applications endpoint).

4.9 — Analytics screen (missing entirely)
Create medi-link-mobile/app/analytics.tsx — calls GET /analytics/dashboard and GET /analytics/expiry-timeline. Render summary cards + a bar chart using react-native-chart-kit or victory-native. Add to tab bar (only visible for MEDICAL/NON_MEDICAL).

4.10 — Profile & Settings
settings.tsx and profile.tsx — wire to GET /users/me, PATCH /users/me. Display verification level with a clear "Get Verified" CTA for UNVERIFIED users.

4.11 — Nearby Pharmacies
med-route.tsx — currently uses MOCK_PHARMACIES. Wire to GET /pharmacies/nearby?lat=&lon=&radius=10 using device location.

Phase 5 — Real-time (Socket.io Clients)
Both clients need socket wiring. Do this after Phase 2.5 and Phase 3.1 are done.

5.1 — Mobile socket client
Create medi-link-mobile/lib/socket.ts — socket.io-client instance. Connect on login with auth token. Disconnect on logout.

5.2 — Mobile real-time events
emergency-rx:response → update Emergency Rx screen
channel:{id}:message → append to chat in channel/[id].tsx
user:{id}:order-update → update order status in orders.tsx
user:{id}:notification → show in-app toast via NotificationSystem.tsx
5.3 — Expo Push Notifications
On login, call Notifications.getExpoPushTokenAsync() and send token to a new PATCH /users/me/push-token endpoint
In the API cron job (expiry-alerts.job.ts) and order event handlers, send Expo push notifications alongside the DB record using the stored push token
Handle foreground/background notification display via expo-notifications
Phase 6 — Polish & Consistency
Do this last — clean up rough edges across all three apps.

6.1 — Mobile Skeleton states
Skeleton.tsx already exists. Apply it consistently as the loading state on every screen in Phase 4 instead of spinners or empty views.

6.2 — Mobile error handling
Add a reusable ErrorBanner component. Every screen's API call should show it on failure with a retry button.

6.3 — Role-based mobile tab bar
TabBar.tsx and (tabs)/_layout.tsx — hide tabs that don't apply to the user's role (e.g. PATIENT users shouldn't see the Inventory or Patients tabs).

6.4 — Consistent enum usage
Audit all places using 'PHARMACIST' (invalid) and replace with 'MEDICAL'. This appears in the mobile auth store mock and potentially in any hardcoded role checks.

Execution Order Summary

Phase 1  API Hardening          ← unblocks everything
  │
  ├── Phase 2  Web gaps         ← parallel with Phase 3 once Phase 1 done
  │
  └── Phase 3  Mobile auth/API  ← prerequisite for Phase 4
        │
        └── Phase 4  Mobile screens  ← can be done screen-by-screen
              │
              └── Phase 5  Real-time  ← needs both clients partially done
                    │
                    └── Phase 6  Polish