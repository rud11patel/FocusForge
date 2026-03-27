# FocusForge MVP

FocusForge is a full-stack MVP for gamified focus tracking based on the supplied PRD.

## Stack

- Frontend: React, React Router, Tailwind CSS, Vite
- Backend: Node.js, Express
- Database: PostgreSQL

## Features in this MVP

- JWT authentication
- Task management
- Tags and tag-based session grouping
- Active focus sessions with refresh recovery
- Session completion with XP and level calculation
- Daily streak updates based on a 60 minute rule
- Dashboard, analytics, leaderboard, settings
- Privacy-aware global leaderboard

## Workspace

- `frontend/`: React app
- `backend/`: Express API
- `backend/schema.sql`: PostgreSQL schema and seed tags

## Run

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set PostgreSQL values
3. Apply `backend/schema.sql` to your PostgreSQL database
4. Start both apps: `npm run dev`
