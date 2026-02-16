# ChatApp Full Technical Documentation and React Native Migration Guide

Generated: 2026-02-15
Project Root: `/Users/keshav4r3/Desktop/chatApp`

## 1. Executive Summary

This project is a full-stack real-time chat platform built with Next.js (App Router), MongoDB (Mongoose), and a separate Socket.IO server.

Core capabilities implemented today:
- Authentication with JWT in `httpOnly` cookie.
- Email OTP verification for registration and password reset.
- 1:1 chats and group chats.
- Real-time messaging and typing indicators via Socket.IO.
- "Status" feature (24-hour stories) with likes and one-comment-per-user controls.
- Mobile-responsive UI with split desktop/mobile layout behavior.

Important for React Native:
- Backend is mostly reusable as-is.
- Current auth mechanism is cookie-based, so RN needs cookie jar handling or backend token-header support.
- Some logic issues should be fixed before scaling to mobile (listed in Section 11).

---

## 2. Architecture Overview

### 2.1 High-Level Components

1. Web App + API Server
- Framework: Next.js App Router.
- Frontend routes under `app/(auth)` and `app/(main)`.
- Backend API route handlers under `app/api/**`.

2. Real-Time Server
- Standalone Node.js + Express + Socket.IO server in `socket-server.js`.
- Handles websocket events and an internal notify endpoint.

3. Database
- MongoDB via Mongoose.
- Models in `models/*.js`.

4. Shared Core Libraries
- Auth helpers: `lib/auth.js`.
- DB connector: `lib/db.js`.
- Validation: `lib/validation.js`.
- Error wrapper: `lib/error.js`.
- Membership guard: `lib/chat-utils.js`.

### 2.2 Request/Data Flow

1. Browser requests page or API.
2. `middleware.js` applies route protection and security headers.
3. API route validates JWT cookie using `verifyToken`.
4. API route loads/saves MongoDB data with Mongoose.
5. For message/group events, API calls socket server `/internal/notify`.
6. Socket server emits events to rooms.
7. Clients subscribed to rooms update UI in real time.

---

## 3. Tech Stack

### 3.1 Frontend
- Next.js 16.x
- React 19.x
- Tailwind CSS 4.x
- Framer Motion
- Zustand
- Lucide Icons
- React Three Fiber + Drei (3D effects)

### 3.2 Backend
- Next.js API routes (server runtime)
- Mongoose 9.x
- JWT (`jsonwebtoken`)
- JOSE (`jose`) in middleware for edge token verify
- bcryptjs
- Zod
- Nodemailer

### 3.3 Real-Time
- Socket.IO server 4.x (standalone)
- Socket.IO client 4.x
- Express 5.x (socket server host)

---

## 4. Project Structure and Responsibilities

### 4.1 Application Layers

- UI pages: `app/(auth)/*`, `app/(main)/*`
- UI modules: `components/features/*`, `components/layout/*`, `components/providers/*`, `components/ui/*`
- API handlers (controllers): `app/api/**/route.js`
- Domain models: `models/*`
- Infra libs: `lib/*`
- Edge middleware: `middleware.js`
- Realtime process: `socket-server.js`

### 4.2 "Controller" Mapping

This project does not use a separate `controllers/` folder. Controller logic lives directly inside each route handler file in `app/api/**/route.js`.

---

## 5. Environment and Runtime Configuration

Required variables used by code:
- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_SOCKET_URL`
- `SOCKET_PORT`
- `CLIENT_URL`
- `SOCKET_INTERNAL_KEY`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

Notes:
- `JWT_SECRET` has insecure fallback in code (`fallback_secret`) if missing.
- `SOCKET_INTERNAL_KEY` has insecure fallback (`super-secret-internal-key`) if missing.
- Production should fail fast if secrets are absent, not fallback.

---

## 6. Data Model Documentation

### 6.1 User (`models/User.js`)

Fields:
- `name` (required)
- `email` (unique, sparse)
- `phoneNumber` (unique, sparse)
- `password` (required, bcrypt-hashed in pre-save hook)
- `avatar` (default empty string)
- `about` (default status text)
- `isOnline` (default false)
- `lastSeen` (default now)
- `createdAt`, `updatedAt` (timestamps)

Indexes:
- Text index on `name` for user search.

Methods:
- `comparePassword(candidatePassword)`

### 6.2 OTP (`models/OTP.js`)

Fields:
- `email` (required, normalized)
- `otpHash` (bcrypt hash)
- `expiresAt` (default +10 mins)
- `attempts` (default 0)
- `isVerified` (default false, currently not used in flows)

Indexes:
- TTL index on `expiresAt` with `expireAfterSeconds: 0`.
- Index on `email`.

Methods:
- `verifyOTP(candidateOTP)`

### 6.3 Chat (`models/Chat.js`)

Fields:
- `participants` (array of User refs)
- `lastMessage` (Message ref)
- `unreadCounts` (Map `userId -> count`)
- `isGroup` (boolean)
- `groupName`, `groupCode`, `groupAvatar`
- `admins` (array of User refs)
- Soft-delete fields: `deletedAt`, `deletedBy`, `status`, `deleteReason`
- timestamps

Indexes:
- Unique sparse index on `groupCode`.
- Indexes on `participants`, `deletedAt`, `status`.

### 6.4 Message (`models/Message.js`)

Fields:
- `chatId` (Chat ref, required)
- `sender` (User ref, required)
- `content`
- `type` (`text|image|video|audio|file`)
- `mediaUrl`
- `readBy` (array of User refs)
- `system` (boolean)
- `groupId` (Chat ref)
- timestamps

Indexes:
- `{ chatId: 1, createdAt: -1 }` for timeline pagination.

### 6.5 Status (`models/Status.js`)

Fields:
- `creatorId` (User ref)
- `text` (max 300)
- `visibleTo` (User refs)
- `likes` (User refs)
- `color`
- `expiresAt`
- timestamps

Indexes:
- TTL index on `expiresAt`.

### 6.6 StatusComment (`models/StatusComment.js`)

Fields:
- `statusId` (Status ref)
- `userId` (User ref)
- `comment` (max 200)
- `createdAt`
- `expiresAt`

Indexes:
- Index on `statusId`.
- TTL index on `expiresAt`.

---

## 7. Authentication and Authorization Flow

### 7.1 Registration Flow

1. User enters email.
2. `POST /api/auth/send-otp` creates OTP hash and emails code.
3. User submits OTP to `POST /api/auth/verify-otp`.
4. API returns `verificationToken` JWT with `{ email, type: email_verification }`.
5. User submits profile + password + token to `POST /api/auth/register`.
6. API creates user and sets auth cookie `token` (7 days).

### 7.2 Login Flow

- `POST /api/auth/login` with `identifier` (email or phone) + `password`.
- On success sets `token` cookie and returns user without password.

### 7.3 Session Check

- `GET /api/auth/me` reads cookie, verifies JWT, returns current user.

### 7.4 Logout Flow

- `POST /api/auth/logout` clears cookie and sets anti-cache headers.

### 7.5 Forgot Password Flow

1. `POST /api/auth/forgot-password` sends OTP.
2. `POST /api/auth/verify-otp` returns verification token.
3. `POST /api/auth/reset-password` validates token and updates password.

### 7.6 Middleware Controls (`middleware.js`)

- Protects paths starting with:
  - `/chat`
  - `/status`
  - `/people`
  - `/api/chats`
  - `/api/users`
- Redirects legacy `/chats*` to `/chat*`.
- Redirects root `/`:
  - authenticated -> `/chat`
  - unauthenticated -> landing page
- Adds security headers and no-cache headers for protected routes.

Important:
- Other APIs still enforce auth internally with `verifyToken`, but middleware matcher is partial.

---

## 8. Backend API Reference (Controllers)

All paths are relative to same host as Next app.
Auth means valid JWT cookie required.

### 8.1 Auth APIs

1. `POST /api/auth/send-otp`
- Auth: No
- Body: `{ email }`
- Success: `{ success, message }`
- Errors: email required, email already registered

2. `POST /api/auth/verify-otp`
- Auth: No
- Body: `{ email, otp }`
- Success: `{ success, message, verificationToken }`
- Errors: OTP missing/expired/invalid, too many attempts

3. `POST /api/auth/resend-otp`
- Auth: No
- Body: `{ email }`
- Success: `{ success, message }`
- Errors: cooldown (429), missing email

4. `POST /api/auth/register`
- Auth: No
- Body: `{ name, email, phoneNumber?, password, verificationToken }`
- Success: `{ user }` + sets cookie
- Errors: missing fields, invalid verification token, user already exists

5. `POST /api/auth/login`
- Auth: No
- Body: `{ identifier, password }`
- Success: `{ user }` + sets cookie
- Errors: missing credentials, invalid credentials

6. `GET /api/auth/me`
- Auth: Yes
- Success: `{ user }`
- Errors: not authenticated, invalid token, user not found

7. `POST /api/auth/logout`
- Auth: No strict check
- Success: `{ success: true }` + clears cookie

8. `POST /api/auth/forgot-password`
- Auth: No
- Body: `{ email }`
- Success: `{ success, message }`
- Errors: missing email, user not found

9. `POST /api/auth/reset-password`
- Auth: No
- Body: `{ email, password, verificationToken }`
- Success: `{ success, message }`
- Errors: invalid token, user not found

### 8.2 User APIs

1. `GET /api/users`
- Auth: Yes
- Returns all other users with profile fields.

2. `GET /api/users/search?mode=name|email&query=...`
- Auth: Yes
- Query length must be >= 2.
- Uses text index for `name` mode; regex for email mode.

3. `GET /api/users/search-by-email?email=...`
- Auth: Yes
- Query length must be >= 3.
- Regex email search, limit 10.

### 8.3 Chat APIs

1. `GET /api/chats`
- Auth: Yes
- Returns user's active chats, populated participants and last message.
- Response is transformed for UI with `name`, `avatar`, `unreadCount`.

2. `POST /api/chats`
- Auth: Yes
- Body: `{ participantId }`
- Creates direct chat if none exists.

3. `POST /api/chats/find-or-create`
- Auth: Yes
- Body validated by Zod.
- Uses transaction.
- Returns existing or new direct chat.

4. `GET /api/chats/:chatId`
- Auth: Yes
- Includes membership check (`checkChatMembership`).
- Group privacy rule: non-admins see only self + admins in participants list.
- Returns 410 if group soft-deleted.

5. `POST /api/chats/read`
- Auth: Yes
- Body validated by Zod: `{ chatId }`
- Membership check.
- Sets unread count to 0 for current user.
- Marks all messages read by current user.

### 8.4 Message APIs

1. `GET /api/messages?chatId=...&cursor=...&limit=...`
- Auth: Yes
- Membership check.
- Reverse pagination by `createdAt` descending.
- Returns `{ messages, nextCursor, hasMore }`.

2. `POST /api/messages`
- Auth: Yes
- Body validated by Zod: `{ chatId, content, type }`
- Transaction:
  - create message
  - update chat `lastMessage`
  - increment unread counts for other participants
- Group rule: only text allowed in group chats (non-text blocked).
- Triggers socket internal notify with event `receive_message`.

### 8.5 Group APIs

1. `POST /api/groups`
- Auth: Yes
- Body: `{ groupName, groupAvatar, participants[] }`
- Creates group with random 16-char hex `groupCode`.
- Creator auto-added to participants/admins.

2. `POST /api/groups/join`
- Auth: Yes
- Body: `{ groupCode }`
- Adds current user to participants.
- Calls socket notify with event `group:joined`.

3. `POST /api/groups/leave`
- Auth: Yes
- Body: `{ chatId }`
- Removes user from participants/admins.
- Calls socket notify with `group:left`.

4. `DELETE /api/groups/delete`
- Auth: Yes
- Body: `{ chatId }`
- Admin only.
- Soft-deletes group (`status=deleted`, `deletedAt`, `deletedBy`).
- Calls socket notify with `group:deleted`.

### 8.6 Status APIs

1. `GET /api/status`
- Auth: Yes
- Returns active statuses from secure channel users.
- Includes `likeCount`, `hasLiked`, `timeRemaining`.

2. `POST /api/status`
- Auth: Yes
- Body: `{ text, color }`
- Constraints:
  - one active status at a time
  - max 5 statuses/day
- Creates status with 24-hour expiration.

3. `DELETE /api/status?id=...`
- Auth: Yes
- Creator only.
- Deletes status.

4. `POST /api/status/:id/like`
- Auth: Yes
- Rules:
  - cannot like own status
  - cannot like twice
  - must be visible to user
  - status not expired

5. `GET /api/status/:id/comment`
- Auth: Yes
- Returns comments for status after visibility check.

6. `POST /api/status/:id/comment`
- Auth: Yes
- Body: `{ comment }` max 200
- Rules:
  - cannot comment own status
  - only one comment per user per status
  - comment expires with status

---

## 9. Real-Time (Socket) Architecture

File: `socket-server.js`

### 9.1 Server Setup
- Express HTTP server + Socket.IO.
- CORS origin from `CLIENT_URL` (default `http://localhost:3000`).
- Health endpoint: `GET /health`.

### 9.2 Socket Events (Client <-> Server)

Inbound events from client:
- `join_room(roomId)` -> socket joins room.
- `send_message(data)` -> server emits `receive_message` to room.
- `group:typing(chatId)` -> emits `group:typing` to room.
- `group:stop_typing(chatId)` -> emits `group:stop_typing` to room.

Outbound events to client:
- `receive_message`
- `group:typing`
- `group:stop_typing`
- `group:joined`
- `group:left`
- `group:deleted`

### 9.3 Internal Notify Endpoint

`POST /internal/notify`
- Secured by header `x-internal-secret` matching `SOCKET_INTERNAL_KEY`.
- Body: `{ event, chatId, payload }`
- Emits event to specified room.
- For `group:deleted`, force-leaves sockets from room.

---

## 10. Frontend Functional Flow

### 10.1 Global Providers

In `app/layout.js`:
- `SocketProvider`
- `ToastProvider`
- `ErrorBoundary`

### 10.2 Auth Screens

1. Register (`app/(auth)/register/page.js`)
- Step 1 email -> send OTP
- Step 2 verify OTP
- Step 3 finalize registration

2. Login (`app/(auth)/login/page.js`)
- login with identifier/password
- forgot password multi-step flow

### 10.3 Main App Layout

`components/layout/MainLayout.js`:
- Desktop: icon rail + sidebar panel + content pane.
- Mobile: single-pane slide between list and detail views.
- Determines tab from URL path.

### 10.4 Chat UX

- `ChatList` fetches `/api/chats` and listens to socket `receive_message`.
- `ChatWindow`:
  - fetches chat details and paginated messages.
  - optimistic message send.
  - typing indicator events.
  - group info modal and group action handlers.

### 10.5 Group UX

- Create group modal picks participants from existing direct chats.
- Join group modal uses group code.
- Group info modal shows members and admin actions.

### 10.6 Status UX

- `StatusFeed` lists own and others' statuses, with create modal.
- `StatusWindow`:
  - slideshow view
  - like and comment interactions
  - delete own status
  - auto-advance timer

### 10.7 People UX

- `UserSearch` looks up users by email and creates/finds direct chat.

### 10.8 Settings UX

- `ProfileSettings` currently UI-only mock (no backend update endpoint yet).

---

## 11. Security Features and Controls

Implemented controls:
- JWT signed sessions (`jsonwebtoken`) with 7-day expiry.
- `httpOnly`, `sameSite=strict`, `secure` in production cookie settings.
- Password hashing with bcrypt pre-save hook.
- OTP hashing with bcrypt + TTL expiration + max attempts.
- Route-level auth checks in API handlers.
- Membership guard (`checkChatMembership`) for message/chat access.
- Zod validation for key payloads.
- Global API error wrapper with typed responses.
- Security headers in middleware.
- No-store cache headers for protected routes.
- Internal socket notify endpoint protected with shared secret.

Security and reliability gaps to address:

1. Secret fallbacks in production code
- `fallback_secret` and fallback internal key should be removed.

2. Sensitive values found in local env file
- Rotate compromised credentials immediately if ever shared.
- Never commit real secrets.

3. Socket URL fallback mismatch
- Some APIs fallback to `http://localhost:6000`, but socket server defaults to 4000.

4. Middleware coverage incomplete
- Middleware protects some API groups only. Others rely solely on route checks.

5. Group/user identity type comparison risk
- Some membership checks use `.includes(decoded.userId)` on ObjectId arrays; normalize with string comparisons for consistency.

6. Profile update not implemented
- Settings UI exists without backend endpoint.

7. Online presence fields unused
- `isOnline` and `lastSeen` are not updated by socket lifecycle.

8. Media messaging partially implemented
- Schema supports media, but no upload pipeline or media endpoints.

9. Socket room leave event missing
- Client emits `leave_room`, server has no handler.

10. Status current-user ID mismatch
- `StatusWindow` reads `data.user.id` but backend returns `_id`, affecting self-actions logic.

---

## 12. React Native Migration Blueprint (Reuse Current Backend)

### 12.1 Mobile Architecture Recommendation

1. App shell
- React Native + TypeScript (Expo or bare RN).

2. Networking
- Shared API client module.
- Handle cookies explicitly or extend backend to accept bearer token.

3. State
- Use Zustand (compatible with current mental model) or React Query + Zustand hybrid.

4. Realtime
- `socket.io-client` in RN.
- Join `chatId` rooms and `user_<id>` room after auth.

### 12.2 Screen Mapping

Web -> RN screen map:
- Landing -> optional splash/onboarding
- Login/Register/Forgot -> Auth stack screens
- Chat list + chat detail -> Chats tab + Chat screen
- Status feed + status viewer -> Status tab + Story viewer
- People search -> People tab
- Settings/profile -> Settings tab
- Group create/join/info -> modal screens

### 12.3 Auth Strategy for RN

Current backend assumes cookie session.
Choose one:

Option A (minimal backend changes)
- Keep cookie auth.
- Use RN cookie manager and ensure fetch/axios stores and sends cookies.
- Ensure CORS and credentials config fit mobile domain context.

Option B (recommended for mobile robustness)
- Add header-based auth support:
  - return access token in login/register
  - send `Authorization: Bearer <token>` from RN
  - keep cookie auth for web compatibility

### 12.4 RN API Integration Checklist

1. Implement request wrapper mirroring `hooks/useApi.js` behavior.
2. Port auth flows in same sequence (OTP verify token then register/reset).
3. Implement chat pagination with cursor.
4. Implement optimistic send with rollback.
5. Mark chat read when entering chat detail.
6. Reconnect socket and rejoin rooms on app foreground/network recovery.
7. Implement status slideshow with timer + like/comment constraints.
8. Add central unauthorized handling (clear auth and redirect to login).

### 12.5 Suggested Pre-Migration Backend Hardening

1. Remove fallback secrets.
2. Unify socket URL defaults to 4000 everywhere.
3. Normalize ObjectId comparisons using `String(id)`.
4. Add profile update API (`PUT /api/users/me`).
5. Decide and implement final auth transport for mobile.
6. Add rate limiting for auth and message/status endpoints.

---

## 13. Agentic AI Handoff Prompt (Copy/Paste)

Use this prompt with your agentic AI to generate the React Native app:

```text
You are building a production-grade React Native mobile app that reuses an existing Next.js + MongoDB backend for a chat platform.

Project goals:
- Build iOS/Android app with feature parity for auth, chats, groups, status/stories, and people search.
- Reuse backend endpoints exactly as documented.
- Use Socket.IO for real-time updates.

Backend characteristics to follow:
- Auth flows:
  - send OTP -> verify OTP -> register
  - login
  - forgot password -> verify OTP -> reset password
- JWT session currently cookie-based.
- APIs include:
  - /api/auth/*
  - /api/users/*
  - /api/chats/*
  - /api/messages
  - /api/groups/*
  - /api/status/*
- Socket server emits and listens for:
  - join_room
  - receive_message
  - group:typing
  - group:stop_typing
  - group:joined
  - group:left
  - group:deleted

Technical requirements:
- React Native with TypeScript.
- Use Zustand for local app state and either React Query or a clean service layer for server data.
- Implement resilient API client with:
  - centralized error handling
  - unauthorized handling
  - retry for transient network issues
- Implement optimistic message sending with rollback.
- Implement message pagination with cursor.
- Implement status viewer with timer auto-advance.
- Implement full auth stack and protected app stack navigation.
- Build responsive UI for phones with polished loading/empty/error states.

Deliverables:
1. Folder structure and architecture explanation.
2. Complete RN code for screens, navigation, api layer, state stores, socket provider, reusable components.
3. Environment setup instructions.
4. Step-by-step run instructions.
5. Testing checklist for auth, chat realtime, group flows, and status lifecycle.

Important constraints:
- Keep backend contract compatible.
- If auth cookie handling is unreliable in RN, include a minimal backend extension plan for bearer token support without breaking web.
- Explicitly list any backend fixes required before full mobile rollout.
```

---

## 14. Quick Assessment

The app is already a strong base for mobile reuse. The fastest path is to keep current APIs and build RN clients on top, but fix auth transport strategy and the known reliability gaps first. Once those are addressed, this backend can support both web and mobile clients with minimal duplication.
