import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { searchStocks } from "@/hooks/useStockData";
import { useWatchlist } from "@/context/WatchlistContext";
import * as Haptics from "expo-haptics";

const POPULAR = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corp." },
  { ticker: "GOOGL", name: "Alphabet Inc." },
  { ticker: "AMZN", name: "Amazon.com Inc." },
  { ticker: "NVDA", name: "NVIDIA Corp." },
  { ticker: "TSLA", name: "Tesla Inc." },
  { ticker: "META", name: "Meta Platforms" },
  { ticker: "BRK-B", name: "Berkshire Hathaway" },
  { ticker: "SPY", name: "SPDR S&P 500 ETF" },
  { ticker: "QQQ", name: "Invesco QQQ Trust" },
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToWatchlist } = useWatchlist();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStocks(text.trim());
        setResults(data);
      } catch {}
      setLoading(false);
    }, 400);
  }, []);

  const handleSelect = (ticker: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/stock/[ticker]", params: { ticker, name } });
  };

  const displayList = query.trim() ? results : POPULAR;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Search</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Ticker symbol or company name"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      )}

      {!loading && (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.ticker || item.symbol}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
          ListHeaderComponent={
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {query.trim() ? "Results" : "Popular Stocks"}
            </Text>
          }
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No results found</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const ticker = item.ticker || item.symbol;
            const name = item.name || item.longname || item.shortname || "";
            return (
              <TouchableOpacity
                style={[styles.resultRow, { borderBottomColor: colors.border }]}
                onPress={() => handleSelect(ticker, name)}
                activeOpacity={0.7}
              >
                <View style={[styles.tickerBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tickerText, { color: colors.primary }]}>{ticker}</Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
                  <Text style={[styles.resultType, { color: colors.mutedForeground }]}>
                    {item.quoteType || "Equity"}
                    {item.exchange ? ` · ${item.exchange}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 12 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase", paddingHorizontal: 16, paddingVertical: 12 },
  resultRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tickerBadge: { width: 60, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  tickerText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  resultType: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  empty: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
