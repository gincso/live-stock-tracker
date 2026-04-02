import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from "react-native-svg";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  positive: boolean;
}

export default function MiniChart({ data, width = 80, height = 36, positive }: Props) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = height * 0.05;
    const usableH = height - padY * 2;
    const stepX = width / (data.length - 1);

    return data.map((v, i) => {
      const x = i * stepX;
      const y = padY + usableH - ((v - min) / range) * usableH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [data, width, height]);

  const color = positive ? "#3fb950" : "#f85149";

  return (
    <Svg width={width} height={height}>
      <Path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
