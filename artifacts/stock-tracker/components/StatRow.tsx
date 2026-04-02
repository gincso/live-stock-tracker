import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
}

export default function StatRow({ label, value, highlight }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.value, { color: highlight ? colors.primary : colors.foreground }]}>
        {value ?? "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  value: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
