import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import Svg, { Path, Polyline, Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface CandleData {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type ChartType = "line" | "bar" | "candle";

interface Props {
  data: CandleData[];
  type: ChartType;
  width?: number;
  height?: number;
}

const PAD = { top: 10, right: 10, bottom: 32, left: 52 };

export default function StockChart({ data, type, width, height = 220 }: Props) {
  const colors = useColors();
  const screenW = Dimensions.get("window").width;
  const W = width || screenW - 32;
  const H = height;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const prices = useMemo(() => {
    if (!data || data.length === 0) return { min: 0, max: 100, range: 100, closes: [] };
    const closes = data.map((d) => d.close).filter(Boolean) as number[];
    const highs = data.map((d) => d.high).filter(Boolean) as number[];
    const lows = data.map((d) => d.low).filter(Boolean) as number[];
    const allVals = type === "candle" ? [...highs, ...lows] : closes;
    const min = Math.min(...allVals) * 0.995;
    const max = Math.max(...allVals) * 1.005;
    return { min, max, range: max - min, closes };
  }, [data, type]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { height: H, width: W }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No chart data</Text>
      </View>
    );
  }

  const toY = (v: number) => PAD.top + chartH - ((v - prices.min) / prices.range) * chartH;
  const toX = (i: number) => PAD.left + (i / (data.length - 1 || 1)) * chartW;

  const barW = Math.max(1, chartW / data.length - 1);
  const isPositive = (prices.closes[prices.closes.length - 1] || 0) >= (prices.closes[0] || 0);
  const lineColor = isPositive ? colors.positive : colors.negative;

  const yLabels = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const v = prices.min + (prices.range / steps) * i;
      return { v, y: toY(v) };
    });
  }, [prices]);

  const linePath = useMemo(() => {
    return data.map((d, i) => {
      const x = toX(i).toFixed(1);
      const y = toY(d.close).toFixed(1);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
  }, [data, prices]);

  const areaPath = useMemo(() => {
    if (data.length === 0) return "";
    const first = `M${toX(0).toFixed(1)},${toY(data[0].close).toFixed(1)}`;
    const lines = data.slice(1).map((d, i) => `L${toX(i + 1).toFixed(1)},${toY(d.close).toFixed(1)}`);
    const close = `L${toX(data.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;
    return [first, ...lines, close].join(" ");
  }, [data, prices]);

  return (
    <Svg width={W} height={H} style={{ backgroundColor: "transparent" }}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity={0.2} />
          <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {yLabels.map((label, i) => (
        <React.Fragment key={i}>
          <Line
            x1={PAD.left} y1={label.y.toFixed(1)}
            x2={W - PAD.right} y2={label.y.toFixed(1)}
            stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,4"
          />
          <SvgText
            x={PAD.left - 4} y={(label.y + 4).toFixed(1)}
            textAnchor="end" fontSize={9}
            fill={colors.mutedForeground}
          >
            {label.v >= 1000 ? `${(label.v / 1000).toFixed(1)}k` : label.v.toFixed(2)}
          </SvgText>
        </React.Fragment>
      ))}

      {type === "line" && (
        <>
          <Path d={areaPath} fill="url(#areaGrad)" />
          <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
        </>
      )}

      {type === "bar" && data.map((d, i) => {
        const x = toX(i) - barW / 2;
        const yTop = toY(d.close);
        const yBase = PAD.top + chartH;
        const h = Math.max(1, yBase - yTop);
        const positive = d.close >= d.open;
        return (
          <Rect
            key={i} x={x.toFixed(1)} y={yTop.toFixed(1)}
            width={Math.max(1, barW).toFixed(1)} height={h.toFixed(1)}
            fill={positive ? colors.positive : colors.negative}
            opacity={0.85}
          />
        );
      })}

      {type === "candle" && data.map((d, i) => {
        const x = toX(i);
        const candleW = Math.max(2, barW * 0.7);
        const positive = d.close >= d.open;
        const color = positive ? colors.positive : colors.negative;
        const yOpen = toY(d.open);
        const yClose = toY(d.close);
        const yHigh = toY(d.high);
        const yLow = toY(d.low);
        const top = Math.min(yOpen, yClose);
        const bodyH = Math.max(1, Math.abs(yOpen - yClose));
        return (
          <React.Fragment key={i}>
            <Line x1={x.toFixed(1)} y1={yHigh.toFixed(1)} x2={x.toFixed(1)} y2={yLow.toFixed(1)} stroke={color} strokeWidth={1} />
            <Rect x={(x - candleW / 2).toFixed(1)} y={top.toFixed(1)} width={candleW.toFixed(1)} height={bodyH.toFixed(1)} fill={color} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
