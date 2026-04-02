import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WatchlistItem {
  ticker: string;
  name: string;
  addedAt: number;
}

interface WatchlistContextValue {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextValue>({
  watchlist: [],
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isInWatchlist: () => false,
});

const STORAGE_KEY = "@stock_watchlist";

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setWatchlist(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  const save = (items: WatchlistItem[]) => {
    setWatchlist(items);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const addToWatchlist = (item: WatchlistItem) => {
    setWatchlist((prev) => {
      if (prev.find((w) => w.ticker === item.ticker)) return prev;
      const next = [item, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((w) => w.ticker !== ticker);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isInWatchlist = (ticker: string) =>
    watchlist.some((w) => w.ticker === ticker);

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
