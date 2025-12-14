# Jatayu

Jatayu is a full‑stack collaboration and disaster‑management platform for organisations and teams to manage sessions, teams, resources, and real‑time requests. It consists of a React (Vite) frontend and an Express/MongoDB backend with Socket.IO for realtime updates.

## Overview

- Two dashboards target two roles:
  - Employee/Session dashboard (`DashPage1`) for teams and session‑level activities.
  - Organisation dashboard (`DashPageOuter`) for organisation‑level management.
- Core capabilities:
  - Authentication for organisations and employees (JWT).
  - Organisation, Team, and Session management.
  - Requests between organisations and teams (bi‑directional) with realtime notifications.
  - Resource assignment from organisations to teams, with counts tracked and pushed in realtime.
  - Charts, calendars, and UI utilities for operations visibility.

## Repository Structure

- `client/` — Vite React app (UI, routing, charts, forms, socket client).
- `server/` — Express app (REST APIs, Socket.IO, MongoDB via Mongoose).
- `newDashboard/` — Additional dashboard assets (optional).

## Tech Stack

- Frontend:
  - React 17, React Router v6
  - Vite (dev server and build)
  - TailwindCSS, Emotion (styling)
  - MUI (`@mui/material`, icons, data‑grid)
  - FullCalendar
  - Nivo charts (bar, pie, line, geo)
  - Form libs: `formik`, `react-hook-form`, `yup`
  - `socket.io-client` for realtime
- Backend:
  - Node.js, Express
  - MongoDB with Mongoose
  - Auth: JWT (`jsonwebtoken`), password hashing (`bcryptjs`), mailer (`nodemailer`)
  - Security: `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `xss-clean`, `hpp`
  - CORS enabled (`cors`)
  - Socket.IO namespace `/socket` for realtime workflows

## Architecture

Backend process (`server/index.js`):

- Loads environment with `dotenv`
- Connects to MongoDB via `config/dbConnect`
- Boots the Express app from `server/app.js`
- Attaches a Socket.IO server to the HTTP server and exports `io`

Express app (`server/app.js`):

- Global middlewares (security, logging in development, body parsing, sanitization, CORS)
- Rate limit for `/api`
- Routers:
  - `/api/v1/employee` — Employee CRUD
  - `/api/v1/organisation` — Auth, organisations, teams, sessions, requests
- Global error handler

Frontend app (`client/src/App.jsx`):

- Two main routes: `/dashboard/` (Session/Employee) and `/dashboardOuter/` (Organisation)
- Additional pages: `/login`, `/signup`, `/` landing, `/meta`, request/resource forms
- Socket client connects and listens/dispatches events to `/socket`

## Data Model (conceptual)

- `Organisation` — includes `resources` (array of `{ type, number }`), `requests` (array of `Request` IDs), and organisation metadata.
- `Team` — includes `resources`, `requests`, `organisationId`, members.
- `Request` — includes sender/receiver IDs and type/payload for flows.
- `Session` — grouping construct tying organisations and teams.

## REST API (selected)

Base: `/api/v1/organisation`

- Auth (Organisation): `POST /signup`, `POST /login`, `POST /forgotPassword`, `PATCH /resetPassword/:token`, `PATCH /updatePassword` (protected)
- Employee: `POST /employee-signup`
- Organisations: `POST /createOrganisation`, `PATCH /updateOrganisation`, `GET /getOrganisation/:id`, `GET /getAllOrganisations`, `GET /getAllOrganisationsBySession`, `DELETE /deleteOrganisation/:id`
- Requests: `GET /requests/:requestId`, `GET /getAllRequests/:orgId`, `GET /getAllRequestsBySession`
- Sessions: `POST /createSession`, `POST /addOrganisation`, `GET /sessions/byOrganisation/:organisationId`, `GET /sessions/:sessionId`
- Teams: `POST /teamCreate`, `POST /addToTeam`, `GET /teams/byOrganisation/:organisationId`, `POST /sessions/addTeamToSession`, `POST /getTeams`

`/api/v1/employee` exposes standard CRUD via `employeeController`.

## Socket.IO Events (namespace `/socket`)

Generic:

- `ping`, `custom-event` — diagnostics
- `send-chat-message` — emits `receive-message` globally or to a room
- `join-room` — room join + ack

Requests:

- `req-from-org` — Organisation → Organisation: creates request, pushes to both; broadcasts `receive-request` with receiver org ID
- `req-from-emp` — Team → Organisation: creates request, pushes to sending team and receiving org; broadcasts `receive-request`
- `req-to-emp` — Organisation → Team: creates request, pushes to receiving team and sending org; broadcasts `receive-request`

Resources:

- `assign-team-resource` — Organisation assigns resource to Team, decrements org counts, pushes to team; broadcasts `receive-resource` with `teamId`
- `team-get-resource` — Returns team’s `resources`

## Frontend Pages & Routing

`/dashboard/` (Session/Employee): `Dashboard`, `Team`, `Contacts`, `Organisations`, `RequestsSession`, `Resources`, `Invoices`, `Form`, `Calendar`, `FAQ`, charts (`BarChart`, `PieChart`, `LineChart`, `Geography`), `NotFound`, `RequestForm`, `ResourceForm`

`/dashboardOuter/` (Organisation): `DashboardO`, `TeamO`, `ContactsO`, `RequestsOrg`, `ResourcesO`, `InvoicesO`, `FormO`, `FAQ`, `NotFound`

Other routes: `/login`, `/signup`, `/` (Landing), `/meta`

## Setup

### Prerequisites

- Node.js 16+
- MongoDB (local or hosted)

### Environment (`server/.env`)

- `PORT=4000`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `JWT_EXPIRES_IN=...`
- SMTP vars if using password reset

### Install & Run

```powershell
# Backend
cd e:\Project2\Jatayu\Jatayu\server
npm install
npm run start

# Frontend
cd e:\Project2\Jatayu\Jatayu\client
npm install
npm run dev
```

## Development Notes

- Rate limiting applies to `/api` (100 req/hr/IP).
- Body size limit: 10kb JSON.
- CORS is open (`*`) for dev; tighten for prod.
- Use the global error handler for consistent API errors.

## Scripts

- Backend: `start` (nodemon `index.js`), `socket` (nodemon `testSocket.js`)
- Frontend: `dev`, `build`, `preview`, `lint`

## Deployment

- Serve `client` build via static hosting or behind a proxy.
- Run `server` with proper env vars; restrict CORS and increase rate limit controls.
- Use MongoDB Atlas and configure indexes for large collections.

## Troubleshooting

- Backend not starting: check `MONGODB_URI`, DB up, port free.
- Socket issues: confirm frontend connects to correct host/port and `/socket`.
- Resource assignment errors: ensure org `resources` contain the requested `type` with sufficient `number`.
- Auth failures: check JWT envs and protected route middleware.

## License

See `LICENSE` for licensing terms.
