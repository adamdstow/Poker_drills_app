import { useCallback, useState } from 'react';
import { useStats } from '@/stats/StatsContext';

/** Holds the current question and the user's pick, and records results. */
export function useDrill<Q, A>(drill: string, generate: () => Q, answerOf: (q: Q) => A) {
  const { record } = useStats();
  const [question, setQuestion] = useState(generate);
  const [picked, setPicked] = useState<A | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [round, setRound] = useState(0);

  const pick = useCallback(
    (value: A) => {
      if (picked !== null || timedOut) return;
      setPicked(value);
      record(drill, value === answerOf(question));
    },
    [picked, timedOut, record, drill, answerOf, question],
  );

  const timeOut = useCallback(() => {
    if (picked !== null || timedOut) return;
    setTimedOut(true);
    record(drill, false);
  }, [picked, timedOut, record, drill]);

  const next = useCallback(() => {
    setQuestion(generate());
    setPicked(null);
    setTimedOut(false);
    setRound((r) => r + 1);
  }, [generate]);

  return { question, answer: answerOf(question), picked, pick, next, timedOut, timeOut, round };
}
