import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

export type DrillId = 'preflop' | 'potOdds' | 'showdown' | 'outs';

export interface DrillStats {
  attempts: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

type AllStats = Record<DrillId, DrillStats>;

const STORAGE_KEY = 'poker-drills/stats/v1';
const EMPTY: DrillStats = { attempts: 0, correct: 0, streak: 0, bestStreak: 0 };
const INITIAL: AllStats = { preflop: EMPTY, potOdds: EMPTY, showdown: EMPTY, outs: EMPTY };

interface StatsContextValue {
  stats: AllStats;
  record: (drill: DrillId, correct: boolean) => void;
  reset: () => void;
}

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AllStats>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setStats({ ...INITIAL, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // Don't overwrite saved stats with the empty defaults before they load.
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats)).catch(() => {});
  }, [stats, loaded]);

  const record = useCallback((drill: DrillId, correct: boolean) => {
    setStats((prev) => {
      const s = prev[drill];
      const streak = correct ? s.streak + 1 : 0;
      return {
        ...prev,
        [drill]: {
          attempts: s.attempts + 1,
          correct: s.correct + (correct ? 1 : 0),
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
        },
      };
    });
  }, []);

  const reset = useCallback(() => setStats(INITIAL), []);

  return <StatsContext.Provider value={{ stats, record, reset }}>{children}</StatsContext.Provider>;
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used inside StatsProvider');
  return ctx;
}
