import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

/** Shrinking time bar. Calls `onExpire` once when it runs out; freezes when `running` is false. */
export function Countdown({ seconds, running, onExpire }: { seconds: number; running: boolean; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (!running) return;
    const end = Date.now() + left * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, (end - Date.now()) / 1000);
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        expire.current();
      }
    }, 100);
    return () => clearInterval(id);
    // Restart only when paused/resumed; `left` is read once as the starting point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const fraction = left / seconds;
  const color = fraction > 0.5 ? colors.correct : fraction > 0.2 ? colors.accent : colors.wrong;
  return (
    <View style={styles.wrap} accessibilityLabel={`${Math.ceil(left)} seconds left`}>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${fraction * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.text, { color }]}>{Math.ceil(left)}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
  text: { fontWeight: '800', fontSize: 14, width: 32, textAlign: 'right' },
});
