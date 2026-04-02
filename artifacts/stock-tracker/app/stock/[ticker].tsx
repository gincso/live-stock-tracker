import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Animated,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStockQuote, useStockHistory, useStockSummary, useAIAnalysis } from "@/hooks/useStockData";
import { useWatchlist } from "@/context/WatchlistContext";
import StockChart from "@/components/StockChart";
import StatRow from "@/components/StatRow";
import * as Haptics from "expo-haptics";

type ChartType = "line" | "bar" | "candle";
type Period = "1m" | "3m" | "6m" | "1y" | "3y" | "5y" | "10y";

const PERIODS: Period[] = ["1m", "3m", "6m", "1y", "3y", "5y", "10y"];
const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "line", label: "Line" },
  { key: "bar", label: "Bar" },
  { key: "candle", label: "Candle" },
];

function fmt(n: number | null | undefined, prefix = "$"): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M`;
  return `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function StockDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ticker: string; name: string }>();
  const ticker = params.ticker?.toUpperCase() || "";
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const [period, setPeriod] = useState<Period>("1y");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [activeTab, setActiveTab] = useState<"chart" | "stats" | "ai">("chart");

  const { data: quote, loading: quoteLoading, refresh } = useStockQuote(ticker);
  const { data: history, loading: historyLoading } = useStockHistory(ticker, period);
  const { data: summary, loading: summaryLoading } = useStockSummary(ticker);
  const { analysis, loading: aiLoading, error: aiError, analyze } = useAIAnalysis();

  const watched = isInWatchlist(ticker);
  const priceChange = quote?.regularMarketChange;
  const priceChangePct = quote?.regularMarketChangePercent;
  const isPositive = (priceChange || 0) >= 0;

  const handleWatchlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (watched) {
      removeFromWatchlist(ticker);
    } else {
      addToWatchlist({
        ticker,
        name: params.name || quote?.longName || quote?.shortName || ticker,
        addedAt: Date.now(),
      });
    }
  };

  const handleAnalyze = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    analyze(ticker, quote, history, summary);
  }, [ticker, quote, history, summary, analyze]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8),
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTicker, { color: colors.foreground }]}>{ticker}</Text>
          {(params.name || quote?.shortName) && (
            <Text style={[styles.headerName, { color: colors.mutedForeground }]} numberOfLines={1}>
              {params.name || quote?.shortName}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.watchBtn} onPress={handleWatchlist}>
          <Ionicons
            name={watched ? "bookmark" : "bookmark-outline"}
            size={22}
            color={watched ? colors.primary : colors.foreground}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }}
      >
        <View style={styles.priceBlock}>
          {quoteLoading && !quote ? (
            <ActivityIndicator color={colors.primary} style={{ height: 60 }} />
          ) : (
            <>
              <Text style={[styles.price, { color: colors.foreground }]}>
                {fmt(quote?.regularMarketPrice)}
              </Text>
              <View style={styles.changeRow}>
                <Ionicons
                  name={isPositive ? "arrow-up" : "arrow-down"}
                  size={14}
                  color={isPositive ? colors.positive : colors.negative}
                />
                <Text style={[styles.change, { color: isPositive ? colors.positive : colors.negative }]}>
                  {fmt(priceChange)} ({fmtPct(priceChangePct)})
                </Text>
                <Text style={[styles.marketStatus, { color: colors.mutedForeground }]}>
                  {quote?.marketState === "REGULAR" ? "Live" : quote?.marketState || ""}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(["chart", "stats", "ai"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => {
                setActiveTab(tab);
                if (tab === "ai" && !analysis && !aiLoading) handleAnalyze();
              }}
            >
              <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
                {tab === "chart" ? "Chart" : tab === "stats" ? "Stats" : "AI Analysis"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "chart" && (
          <View style={styles.chartSection}>
            <View style={styles.chartTypeRow}>
              {CHART_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.key}
                  style={[styles.chipBtn, { backgroundColor: chartType === ct.key ? colors.primary : colors.secondary }]}
                  onPress={() => setChartType(ct.key)}
                >
                  <Text style={[styles.chipLabel, { color: chartType === ct.key ? colors.primaryForeground : colors.mutedForeground }]}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.chartWrap}>
              {historyLoading ? (
                <ActivityIndicator color={colors.primary} style={{ height: 220 }} />
              ) : (
                <StockChart data={history || []} type={chartType} height={220} />
              )}
            </View>

            <View style={styles.periodRow}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, period === p && { backgroundColor: colors.secondary }]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodLabel, { color: period === p ? colors.primary : colors.mutedForeground }]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.statsGrid, { marginTop: 16 }]}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>Open</Text>
                <Text style={[styles.statCardValue, { color: colors.foreground }]}>{fmt(quote?.regularMarketOpen)}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>High</Text>
                <Text style={[styles.statCardValue, { color: colors.positive }]}>{fmt(quote?.regularMarketDayHigh)}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>Low</Text>
                <Text style={[styles.statCardValue, { color: colors.negative }]}>{fmt(quote?.regularMarketDayLow)}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>Volume</Text>
                <Text style={[styles.statCardValue, { color: colors.foreground }]}>{fmt(quote?.regularMarketVolume, "")}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "stats" && (
          <View style={[styles.statsSection, { paddingHorizontal: 16 }]}>
            <Text style={[styles.statsGroupLabel, { color: colors.mutedForeground }]}>Price Stats</Text>
            <StatRow label="52-Week High" value={fmt(quote?.fiftyTwoWeekHigh)} />
            <StatRow label="52-Week Low" value={fmt(quote?.fiftyTwoWeekLow)} />
            <StatRow label="50-Day MA" value={fmt(quote?.fiftyDayAverage)} />
            <StatRow label="200-Day MA" value={fmt(quote?.twoHundredDayAverage)} />

            <Text style={[styles.statsGroupLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Valuation</Text>
            <StatRow label="Market Cap" value={fmt(quote?.marketCap)} />
            <StatRow label="P/E Ratio (TTM)" value={quote?.trailingPE?.toFixed(2)} />
            <StatRow label="Forward P/E" value={quote?.forwardPE?.toFixed(2)} />
            <StatRow label="EPS (TTM)" value={quote?.epsTrailingTwelveMonths?.toFixed(2)} />
            <StatRow label="Beta" value={summary?.defaultKeyStatistics?.beta?.toFixed(2)} />

            <Text style={[styles.statsGroupLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Financials</Text>
            <StatRow label="Revenue Growth" value={summary?.financialData?.revenueGrowth != null ? fmtPct(summary.financialData.revenueGrowth * 100) : null} />
            <StatRow label="Profit Margin" value={summary?.financialData?.profitMargins != null ? fmtPct(summary.financialData.profitMargins * 100) : null} />
            <StatRow label="Return on Equity" value={summary?.financialData?.returnOnEquity != null ? fmtPct(summary.financialData.returnOnEquity * 100) : null} />
            <StatRow label="Debt-to-Equity" value={summary?.financialData?.debtToEquity?.toFixed(2)} />
            <StatRow label="Free Cash Flow" value={fmt(summary?.financialData?.freeCashflow)} />

            {summary?.summaryProfile?.longBusinessSummary && (
              <>
                <Text style={[styles.statsGroupLabel, { color: colors.mutedForeground, marginTop: 20 }]}>About</Text>
                <Text style={[styles.aboutText, { color: colors.foreground }]}>
                  {summary.summaryProfile.longBusinessSummary}
                </Text>
              </>
            )}
          </View>
        )}

        {activeTab === "ai" && (
          <View style={[styles.aiSection, { paddingHorizontal: 16 }]}>
            <View style={[styles.aiBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="robot-excited" size={24} color={colors.primary} />
              <Text style={[styles.aiBannerText, { color: colors.mutedForeground }]}>
                Powered by GPT-5. Analysis uses real-time price, fundamentals, and 10-year history.
              </Text>
            </View>

            {!analysis && !aiLoading && (
              <TouchableOpacity
                style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
                onPress={handleAnalyze}
              >
                <MaterialCommunityIcons name="brain" size={18} color={colors.primaryForeground} />
                <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>Analyze {ticker}</Text>
              </TouchableOpacity>
            )}

            {aiLoading && !analysis && (
              <View style={styles.aiLoadWrap}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.aiLoadText, { color: colors.mutedForeground }]}>Analyzing {ticker}...</Text>
              </View>
            )}

            {analysis ? (
              <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.analysisText, { color: colors.foreground }]}>{analysis}</Text>
                {!aiLoading && (
                  <TouchableOpacity
                    style={[styles.reanalyzeBtn, { borderColor: colors.border }]}
                    onPress={handleAnalyze}
                  >
                    <Ionicons name="refresh" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.reanalyzeText, { color: colors.mutedForeground }]}>Re-analyze</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {aiError && (
              <Text style={[styles.errorText, { color: colors.negative }]}>{aiError}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTicker: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerName: { fontSize: 12, fontFamily: "Inter_400Regular", maxWidth: 200 },
  watchBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  priceBlock: { paddingHorizontal: 20, paddingVertical: 20 },
  price: { fontSize: 38, fontFamily: "Inter_700Bold" },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  change: { fontSize: 15, fontFamily: "Inter_500Medium" },
  marketStatus: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 4 },
  tabRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chartSection: { paddingTop: 16 },
  chartTypeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chipLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  chartWrap: { paddingHorizontal: 16 },
  periodRow: { flexDirection: "row", justifyContent: "space-evenly", paddingHorizontal: 8, marginTop: 12 },
  periodBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  periodLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 8 },
  statCard: {
    width: "47%", borderRadius: 12, padding: 12,
  },
  statCardLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  statCardValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statsSection: { paddingTop: 16 },
  statsGroupLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4, marginTop: 4 },
  aboutText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 8 },
  aiSection: { paddingTop: 16 },
  aiBanner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  aiBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  analyzeBtn: {
    flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center",
    height: 50, borderRadius: 14, marginBottom: 16,
  },
  analyzeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  aiLoadWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  aiLoadText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  analysisCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16,
  },
  analysisText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 22 },
  reanalyzeBtn: {
    flexDirection: "row", gap: 6, alignItems: "center",
    marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  reanalyzeText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12 },
});
