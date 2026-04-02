# Live Stock Tracker

  A production-ready mobile app for live stock tracking with AI-powered analysis.

  ## Features

  - **Live Stock Quotes** — Real-time prices refreshed every 30 seconds (Yahoo Finance)
  - **Custom Watchlist** — Add any stock by ticker symbol; persisted locally
  - **Interactive Charts** — Line, Bar, and Candlestick chart types
  - **Historical Data** — Up to 10 years of price history (1M / 3M / 6M / 1Y / 3Y / 5Y / 10Y)
  - **Key Statistics** — P/E ratio, market cap, 52-week range, revenue growth, profit margin, beta
  - **AI Analysis** — GPT-4o powered analysis with market sentiment, key strengths & risks, technical analysis, price predictions, and Buy/Hold/Sell recommendation
  - **Stock Search** — Search by ticker or company name

  ## Tech Stack

  - **Mobile**: Expo (React Native) with expo-router
  - **Backend**: Express 5 + TypeScript
  - **Stock Data**: yahoo-finance2
  - **AI**: OpenAI GPT-4o via Replit AI Integrations
  - **Charts**: react-native-svg custom charts
  - **State**: React Query + AsyncStorage

  ## Structure

  ```
  artifacts/
    api-server/         # Express API (stock quotes, history, AI analysis)
    stock-tracker/      # Expo mobile app
  lib/
    api-spec/           # OpenAPI spec
    api-client-react/   # Generated React Query hooks
    api-zod/            # Generated Zod schemas
    db/                 # Drizzle ORM + PostgreSQL
  ```

  ## API Endpoints

  | Method | Path | Description |
  |--------|------|-------------|
  | GET | /api/stocks/quote/:ticker | Real-time quote |
  | GET | /api/stocks/search?q= | Search by name/ticker |
  | GET | /api/stocks/history/:ticker?period= | OHLCV history |
  | GET | /api/stocks/summary/:ticker | Company fundamentals |
  | POST | /api/stocks/ai-analysis | GPT-4o AI analysis (SSE streaming) |
  