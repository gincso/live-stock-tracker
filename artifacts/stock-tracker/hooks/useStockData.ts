import { useState, useEffect, useRef, useCallback } from "react";

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export function useStockQuote(ticker: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/stocks/quote/${ticker}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  return { data, loading, error, refresh: fetchQuote };
}

export function useStockHistory(ticker: string | null, period: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/stocks/history/${ticker}?period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data || []);
        else setError(json.error);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker, period]);

  return { data, loading, error };
}

export function useStockSummary(ticker: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/stocks/summary/${ticker}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { data, loading, error };
}

export function useAIAnalysis() {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (ticker: string, quote: any, history: any[], summary: any) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setAnalysis("");
    setError(null);

    try {
      const res = await fetch(`${BASE}/api/stocks/ai-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, quote, history, summary }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.content) {
                setAnalysis((prev) => prev + parsed.content);
              }
              if (parsed.done) {
                setLoading(false);
              }
              if (parsed.error) {
                setError(parsed.error);
                setLoading(false);
              }
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message);
        setLoading(false);
      }
    }
  }, []);

  return { analysis, loading, error, analyze };
}

export async function searchStocks(query: string): Promise<any[]> {
  const res = await fetch(`${BASE}/api/stocks/search?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  return json.success ? json.data : [];
}
