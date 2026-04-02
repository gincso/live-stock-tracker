import { Router, type IRouter } from "express";
import yahooFinance from "yahoo-finance2";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
});

router.get("/quote/:ticker", async (req, res) => {
  const { ticker } = req.params;
  try {
    const quote = await yahooFinance.quote(ticker.toUpperCase());
    res.json({ success: true, data: quote });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch quote");
    res.status(500).json({ success: false, error: err?.message || "Failed to fetch quote" });
  }
});

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.status(400).json({ success: false, error: "Query param 'q' is required" });
  }
  try {
    const results = await yahooFinance.search(q, { quotesCount: 8, newsCount: 0 });
    const quotes = (results.quotes || []).filter((r: any) => r.quoteType === "EQUITY" || r.quoteType === "ETF");
    res.json({ success: true, data: quotes });
  } catch (err: any) {
    req.log.error({ err }, "Failed to search");
    res.status(500).json({ success: false, error: err?.message || "Search failed" });
  }
});

router.get("/history/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const { period = "1y" } = req.query;

  const periodMap: Record<string, { interval: string; period1: string }> = {
    "1m": { interval: "1d", period1: getDateOffset(-30) },
    "3m": { interval: "1d", period1: getDateOffset(-90) },
    "6m": { interval: "1wk", period1: getDateOffset(-180) },
    "1y": { interval: "1wk", period1: getDateOffset(-365) },
    "3y": { interval: "1mo", period1: getDateOffset(-3 * 365) },
    "5y": { interval: "1mo", period1: getDateOffset(-5 * 365) },
    "10y": { interval: "1mo", period1: getDateOffset(-10 * 365) },
  };

  const cfg = periodMap[period as string] || periodMap["1y"];
  try {
    const data = await yahooFinance.chart(ticker.toUpperCase(), {
      interval: cfg.interval as any,
      period1: cfg.period1,
    });
    const candles = (data.quotes || []).map((q: any) => ({
      date: new Date(q.date).getTime(),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    }));
    res.json({ success: true, data: candles });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch history");
    res.status(500).json({ success: false, error: err?.message || "Failed to fetch history" });
  }
});

router.get("/summary/:ticker", async (req, res) => {
  const { ticker } = req.params;
  try {
    const summary = await yahooFinance.quoteSummary(ticker.toUpperCase(), {
      modules: ["summaryProfile", "financialData", "defaultKeyStatistics"],
    });
    res.json({ success: true, data: summary });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch summary");
    res.status(500).json({ success: false, error: err?.message || "Failed to fetch summary" });
  }
});

router.post("/ai-analysis", async (req, res) => {
  const { ticker, quote, history, summary } = req.body;

  if (!ticker) {
    return res.status(400).json({ success: false, error: "ticker is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const priceHistory = (history || []).slice(-30).map((h: any) =>
      `${new Date(h.date).toLocaleDateString()}: $${h.close?.toFixed(2)}`
    ).join(", ");

    const prompt = `You are a professional stock market analyst. Analyze ${ticker} stock for an investor.

Current Data:
- Price: $${quote?.regularMarketPrice?.toFixed(2) || "N/A"}
- Change Today: ${quote?.regularMarketChangePercent?.toFixed(2) || "N/A"}%
- Market Cap: ${formatMarketCap(quote?.marketCap)}
- P/E Ratio: ${quote?.trailingPE?.toFixed(2) || "N/A"}
- 52-Week High: $${quote?.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}
- 52-Week Low: $${quote?.fiftyTwoWeekLow?.toFixed(2) || "N/A"}
- Revenue Growth: ${summary?.financialData?.revenueGrowth ? (summary.financialData.revenueGrowth * 100).toFixed(1) + "%" : "N/A"}
- Profit Margin: ${summary?.financialData?.profitMargins ? (summary.financialData.profitMargins * 100).toFixed(1) + "%" : "N/A"}
- Beta: ${summary?.defaultKeyStatistics?.beta?.toFixed(2) || "N/A"}

Recent Price History (last 30 data points): ${priceHistory || "N/A"}

Provide:
1. **Market Sentiment** - Current market mood and momentum (2-3 sentences)
2. **Key Strengths** - 3 bullet points of what's working for this stock
3. **Key Risks** - 3 bullet points of potential risks
4. **Technical Analysis** - Price trend assessment and key levels to watch (2-3 sentences)
5. **AI Prediction** - Short-term (1-month) and medium-term (6-month) price outlook with reasoning
6. **Recommendation** - Buy / Hold / Sell with confidence level (Low/Medium/High) and one-line rationale

Be specific, data-driven, and concise. Use the actual numbers provided.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log.error({ err }, "AI analysis failed");
    res.write(`data: ${JSON.stringify({ error: err?.message || "AI analysis failed" })}\n\n`);
    res.end();
  }
});

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatMarketCap(val?: number | null): string {
  if (!val) return "N/A";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val}`;
}

export default router;
