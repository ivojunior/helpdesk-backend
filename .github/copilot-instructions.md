# Copilot Instructions for helpdesk-backend

This guide provides essential context for AI coding agents working on the `helpdesk-backend` project. Follow these conventions and workflows to be immediately productive.

## Architecture Overview
- **TypeScript/Node.js backend** using Express, Prisma ORM, and SQLite.
- **Main entry point:** `src/index.ts` initializes Express, loads environment variables, sets up CORS, logging, and API routes.
- **Database:** Defined in `prisma/schema.prisma` (SQLite, file-based). Models include `User`, `Ticket`, `Comment`, etc. Use Prisma Client for all DB access.
- **Services:** Business logic and integrations are in `src/services/`. Example: `database.service.ts` for DB lifecycle, `logger.service.ts` for logging.
- **Routes:** API endpoints are defined in `src/routes/api.routes.ts`. Middleware lives in `src/middleware/`.

## Developer Workflows
- **Development:**
  - Start dev server: `npm run dev` (uses `ts-node-esm`)
  - Build: `npm run build` (TypeScript -> JS)
  - Start production: `npm start`
- **Database:**
  - Migrate: `npm run prisma:migrate`
  - Seed: `npm run prisma:seed` or `npm run db:seed`
  - Reset: `npm run db:reset`
  - Prisma Studio: `npm run prisma:studio` (DB browser)
- **Lint/Format:**
  - Lint: `npm run lint`
  - Format: `npm run format`
  - Type-check: `npm run type-check`

## Project-Specific Patterns
- **Environment variables** are loaded from `.env` (see `src/index.ts`).
- **CORS origins** are explicitly set for local dev and configurable via `FRONTEND_URL`.
- **Logging:** Use `Logger` from `src/services/logger.service.ts` for all logs.
- **Authentication:** Custom middleware in `src/middleware/auth.middleware.ts` (integrates with Google Auth).
- **Data relationships:** Prisma models use explicit relations (see `schema.prisma`).
- **Error handling:** Centralized via Express middleware (see `src/index.ts`).

## Integration Points
- **Prisma ORM:** All DB access via Prisma Client. Regenerate client after schema changes (`npm run prisma:generate`).
- **Google Auth:** Integrated via `google-auth-library` in auth middleware.
- **Frontend:** CORS configured for local and remote frontend URLs.

## Examples
- **Add a new API route:**
  - Define route in `src/routes/api.routes.ts`
  - Implement logic in a service under `src/services/`
  - Register middleware in `src/index.ts`
- **Add a new model:**
  - Update `prisma/schema.prisma`
  - Run `npm run prisma:migrate` and `npm run prisma:generate`
  - Use new model via Prisma Client in services

## Key Files & Directories
- `src/index.ts` — App entry, middleware, routes
- `prisma/schema.prisma` — DB schema
- `src/services/` — Business logic, DB, logging
- `src/routes/api.routes.ts` — API endpoints
- `src/middleware/auth.middleware.ts` — Auth logic

---

For questions or unclear patterns, review the above files or ask for clarification. Update this guide as new conventions emerge.
