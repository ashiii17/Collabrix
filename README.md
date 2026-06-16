# Collabrix

Collabrix is a production-oriented full-stack starter for real-time collaborative coding, interviews, contests, AI feedback, video signaling, session replay, analytics, and GitHub workflows.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Monaco Editor, Socket.IO client
- Backend: Express, Socket.IO, JWT auth, Prisma, PostgreSQL, Redis-ready event architecture
- Realtime: room presence, collaborative code sync, chat, replay events, WebRTC signaling
- Integrations: Docker code runner boundary, AI review/feedback service, GitHub service boundary

## Run Locally

```bash
cp .env.example .env
cp .env packages/db/.env
docker-compose up -d postgres redis
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Web runs on `http://localhost:3000`; API runs on `http://localhost:4000`.

## Security Notes

- The code execution service is intentionally isolated behind `CodeRunnerService`. Keep Docker execution disabled in local/dev unless the host is configured for untrusted code.
- In production, run code execution on isolated workers with CPU, memory, process, network, and filesystem limits.
- Store recordings/files in object storage and persist only metadata in PostgreSQL.

## Architecture

The codebase is a monorepo:

- `apps/web`: collaborative product UI
- `apps/api`: REST API, Socket.IO gateway, service integrations
- `packages/db`: Prisma schema and client
- `packages/shared`: shared Zod schemas and TypeScript types
