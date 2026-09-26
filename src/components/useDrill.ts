import { useCallback, useState } from 'react';
import { DrillId, useStats } from '@/stats/StatsContext';

/** Holds the current question and the user's pick, and records results. */
export function useDrill<Q, A>(drill: DrillId, generate: () => Q, answerOf: (q: Q) => A) {
  const { record } = useStats();
  const [question, setQuestion] = useState(generate);
  const [picked, setPicked] = useState<A | null>(null);

  const pick = useCallback(
    (value: A) => {
      if (picked !== null) return;
      setPicked(value);
      record(drill, value === answerOf(question));
    },
    [picked, record, drill, answerOf, question],
  );

  const next = useCallback(() => {
    setQuestion(generate());
    setPicked(null);
  }, [generate]);

  return { question, answer: answerOf(question), picked, pick, next };
}
