import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface DrillStats {
  attempts: number;
  correct: number;
  streak: number;
  bestStreak: number;
  /** Results of the most recent answers, newest last. */
  recent: boolean[];
}

type AllStats = Record<string, DrillStats>;

const STORAGE_KEY = 'poker-drills/stats/v2';
const RECENT = 10;
export const EMPTY_STATS: DrillStats = { attempts: 0, correct: 0, streak: 0, bestStreak: 0, recent: [] };

/** Mastered: at least 8 of the last 10 answers right. */
export function isMastered(s: DrillStats): boolean {
  return s.recent.length >= RECENT && s.recent.filter(Boolean).length >= 8;
}

interface StatsContextValue {
  statsFor: (drill: string) => DrillStats;
  record: (drill: string, correct: boolean) => void;
  reset: () => void;
  totals: { attempts: number; correct: number };
}

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AllStats>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setStats(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // Don't overwrite saved stats with the empty defaults before they load.
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats)).catch(() => {});
  }, [stats, loaded]);

  const record = useCallback((drill: string, correct: boolean) => {
    setStats((prev) => {
      const s = prev[drill] ?? EMPTY_STATS;
      const streak = correct ? s.streak + 1 : 0;
      return {
        ...prev,
        [drill]: {
          attempts: s.attempts + 1,
          correct: s.correct + (correct ? 1 : 0),
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
          recent: [...s.recent, correct].slice(-RECENT),
        },
      };
    });
  }, []);

  const reset = useCallback(() => setStats({}), []);
  const statsFor = useCallback((drill: string) => stats[drill] ?? EMPTY_STATS, [stats]);
  const totals = Object.values(stats).reduce(
    (acc, s) => ({ attempts: acc.attempts + s.attempts, correct: acc.correct + s.correct }),
    { attempts: 0, correct: 0 },
  );

  return <StatsContext.Provider value={{ statsFor, record, reset, totals }}>{children}</StatsContext.Provider>;
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used inside StatsProvider');
  return ctx;
}
