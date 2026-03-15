# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Warfrma Noticias — Discord Bot

A community Discord bot for Warframe focused on news, trading prices, builds, and price alerts.

### Bot Package: `artifacts/warframe-bot` (`@workspace/warframe-bot`)

- **Entry point**: `src/index.js` — starts Express keep-alive server, loads commands, connects to Discord
- **Command deployment**: `src/deploy-commands.js` — run once to register slash commands with Discord
- **Commands**: `src/commands/` — one file per slash command
  - `news.js` — `/news`: Latest Warframe news from warframestat.us
  - `price.js` — `/price <item>`: Cheapest seller on Warframe Market
  - `build.js` — `/build <name>`: Community builds from local JSON database
  - `alerts.js` — `/alerts <item> <price>`: Subscribe to price drop alerts
- **Services**: `src/services/`
  - `warframeNewsService.js` — Fetches news from Warframe Status API
  - `warframeMarketService.js` — Fetches orders from Warframe Market API
- **Database**: `src/database/`
  - `builds.json` — Local build database (add new entries here)
  - `alerts.json` — Active price alerts (written automatically)
- **Utils**: `src/utils/`
  - `formatItemName.js` — Normalizes item names for API calls
  - `embedBuilder.js` — Creates all Discord embeds with consistent styling

### Bot Workflow

The bot runs as the "Warfrma Noticias Bot" workflow.

To add new slash commands:
1. Create a new file in `src/commands/` with `export const data` (SlashCommandBuilder) and `export async function execute(interaction)`
2. Re-run `node src/deploy-commands.js` from `artifacts/warframe-bot/`
3. Restart the workflow

To add new builds: edit `src/database/builds.json` with the item key in snake_case.

### Web Dashboard

Served at the root of the bot's HTTP server (port 3000). All pages share `src/web/style.css` and `src/web/dashboard.js`.

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard.html` | Bot status + live WebSocket event log |
| News | `/news.html` | Warframe news feed |
| Prices | `/prices.html` | Price checker with top-sellers table |
| Builds | `/builds.html` | Searchable build database |

REST API endpoints: `GET /api/status`, `GET /api/news`, `GET /api/builds`, `GET /api/price/:item`

WebSocket broadcasts: `bot_started`, `status_update`, `alert_triggered`, `news_updated`

### Environment Variables Required

- `DISCORD_TOKEN` — Bot token (Discord Developer Portal)
- `CLIENT_ID` — Application ID
- `GUILD_ID` — Discord server ID
- `PORT` — Auto-set by Replit for keep-alive Express server
- `GITHUB_TOKEN` — GitHub Personal Access Token (classic, repo scope) used for pushing to GitHub. The user dismissed the Replit GitHub integration, so this secret is used manually instead.

### GitHub Repository

- Remote: https://github.com/KronoxYT/Warfrma-Noticias-Bot.git
- Branch: `main`
- To push updates: set the remote URL with the token temporarily, push HEAD:main, then reset the URL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
