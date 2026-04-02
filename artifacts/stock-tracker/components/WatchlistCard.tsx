import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStockQuote, useStockHistory } from "@/hooks/useStockData";
import MiniChart from "./MiniChart";
import * as Haptics from "expo-haptics";

interface Props {
  ticker: string;
  name: string;
}

export default function WatchlistCard({ ticker, name }: Props) {
  const colors = useColors();
  const { data: quote, loading } = useStockQuote(ticker);
  const { data: history } = useStockHistory(ticker, "3m");

  const change = quote?.regularMarketChange;
  const changePct = quote?.regularMarketChangePercent;
  const isPositive = (change || 0) >= 0;

  const closes = (history || []).map((h: any) => h.close).filter(Boolean);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/stock/[ticker]", params: { ticker, name } });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={styles.left}>
        <Text style={[styles.ticker, { color: colors.foreground }]}>{ticker}</Text>
        <Text style={[styles.name, { color: colors.mutedForeground }]} numberOfLines={1}>{name}</Text>
      </View>

      <View style={styles.chart}>
        {closes.length > 1 && <MiniChart data={closes} positive={isPositive} width={80} height={36} />}
      </View>

      <View style={styles.right}>
        {loading && !quote ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={[styles.price, { color: colors.foreground }]}>
              {quote?.regularMarketPrice != null
                ? `$${quote.regularMarketPrice.toFixed(2)}`
                : "—"}
            </Text>
            <View style={[styles.changeBadge, { backgroundColor: isPositive ? `${colors.positive}22` : `${colors.negative}22` }]}>
              <Ionicons
                name={isPositive ? "arrow-up" : "arrow-down"}
                size={10}
                color={isPositive ? colors.positive : colors.negative}
              />
              <Text style={[styles.changePct, { color: isPositive ? colors.positive : colors.negative }]}>
                {changePct != null ? `${Math.abs(changePct).toFixed(2)}%` : "—"}
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  left: { flex: 1 },
  ticker: { fontSize: 16, fontFamily: "Inter_700Bold" },
  name: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  chart: { width: 80, alignItems: "center" },
  right: { alignItems: "flex-end", minWidth: 80 },
  price: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  changeBadge: {
    flexDirection: "row", alignItems: "center", gap: 2,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginTop: 3,
  },
  changePct: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
