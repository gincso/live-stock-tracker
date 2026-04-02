# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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
- **AI**: OpenAI GPT-4o via Replit AI Integrations (env: AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY)
- **Stock Data**: yahoo-finance2 (real-time quotes, historical data, company summaries)

## Applications

### Live Stock Tracker (Mobile — Expo)
- Path: `artifacts/stock-tracker/`
- Dark theme financial app (navy/charcoal + teal accent)
- Features:
  - Watchlist with mini charts and live price updates (refreshes every 30s)
  - Search stocks by ticker or company name (Yahoo Finance search)
  - Stock detail with line/bar/candlestick charts
  - Historical data: 1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y
  - Key stats: P/E, market cap, 52-week range, revenue growth, profit margin, beta
  - AI Analysis: GPT-4o powered analysis with market sentiment, strengths, risks, technical analysis, price predictions, and buy/hold/sell recommendation
  - Watchlist persisted to AsyncStorage

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (stocks routes, AI analysis)
│   └── stock-tracker/      # Expo mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/ # OpenAI integration template
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Endpoints

- `GET /api/stocks/quote/:ticker` — Real-time quote
- `GET /api/stocks/search?q=` — Search tickers/companies
- `GET /api/stocks/history/:ticker?period=` — OHLCV history (1m/3m/6m/1y/3y/5y/10y)
- `GET /api/stocks/summary/:ticker` — Company fundamentals
- `POST /api/stocks/ai-analysis` — GPT-4o AI analysis (SSE streaming)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
