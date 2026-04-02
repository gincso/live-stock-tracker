import React, { useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { useWatchlist } from "@/context/WatchlistContext";
import WatchlistCard from "@/components/WatchlistCard";
import * as Haptics from "expo-haptics";

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { watchlist } = useWatchlist();

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/search");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Watchlist</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.secondary }]}
          onPress={handleAdd}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {watchlist.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trending-up-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No stocks yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Search for a ticker to add it to your watchlist
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={handleAdd}
          >
            <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Search Stocks</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.ticker}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
              <WatchlistCard ticker={item.ticker} name={item.name} />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 8,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 12 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
