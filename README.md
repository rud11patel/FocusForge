# FocusForge

FocusForge is a full-stack focus tracking app for planning deep work, running timed sessions, and tracking progress over time.

It includes task-based focus sessions, tags, XP, levels, streaks, analytics, session recovery, browser alerts, and a privacy-aware leaderboard.

## Stack

- React
- React Router
- Tailwind CSS
- Vite
- Node.js
- Express
- PostgreSQL
- JWT authentication

## Features

- Register and log in with JWT auth
- Create and manage tasks
- Organize sessions with tags
- Start, pause, resume, complete, and abandon focus sessions
- Recover active sessions after refresh
- Show browser alerts, sounds, tab title alerts, and return popups when sessions end
- Track XP, levels, daily streaks, and longest streaks
- View dashboard metrics and progress
- Analyze daily focus, weekly focus, tags, best focus time, and streak history
- Compare weekly focus on the leaderboard
- Manage privacy settings

## Project Structure

```text
backend/   Express API, PostgreSQL schema, services, routes
frontend/  React app, pages, components, API client
```

## Setup

Install dependencies:

```bash
npm install
```

Create a PostgreSQL database:

```bash
createdb focusforge
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the values:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/focusforge
JWT_SECRET=replace-this-with-a-long-random-secret
```

Apply the database schema:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

Or run `backend/schema.sql` manually in your PostgreSQL client.

Start the app:

```bash
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

## Scripts

Run frontend and backend together:

```bash
npm run dev
```

Run only the backend:

```bash
npm run dev:backend
```

Run only the frontend:

```bash
npm run dev:frontend
```

Build the project:

```bash
npm run build
```

Start the backend:

```bash
npm --workspace backend start
```

Preview the frontend build:

```bash
npm --workspace frontend run preview
```

## Environment Variables

Backend:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/focusforge
JWT_SECRET=replace-this-with-a-long-random-secret
```

Frontend:

```env
VITE_API_URL=http://localhost:4000/api
```

For production, set `CLIENT_URL` to the deployed frontend URL and `VITE_API_URL` to the deployed backend API URL.

## Database

The schema lives in:

```text
backend/schema.sql
```

Run it when setting up a fresh database.

If you already had a database before pause and resume support was added, run the schema again or apply the active session updates from `backend/schema.sql`.

## Deployment

A simple deployment setup is:

- Render Web Service for the backend
- Render PostgreSQL for the database
- Render Static Site for the frontend

Backend settings:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Backend environment:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.com
DATABASE_URL=postgresql://...
JWT_SECRET=your-production-secret
```

Frontend settings:

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Frontend environment:

```env
VITE_API_URL=https://your-backend-url.com/api
```

Before using the deployed app, apply `backend/schema.sql` to the production database.

## API

Main API groups:

- `/api/auth`
- `/api/tasks`
- `/api/tags`
- `/api/sessions`
- `/api/stats`
- `/api/leaderboard`
- `/api/users`

Most routes require a logged-in user.
