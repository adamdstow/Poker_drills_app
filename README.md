# Poker Drills

A mobile app (Expo / React Native) for drilling poker fundamentals. Every question is dealt at random and comes with an explanation after you answer. Your score, accuracy and streaks are saved on the device.

| Drill | What you practise |
| --- | --- |
| **Preflop Ranges** | Everyone has folded to you in a 6-max game. Raise or fold from UTG, HJ, CO, BTN or SB? The answer shows the opening chart with your hand highlighted. |
| **Pot Odds** | You're facing a bet with a draw. Compare the equity you need (pot odds) with the equity you have (outs ÷ unseen cards), then call or fold. |
| **Hand Rankings** | Two hands and a five-card board. Pick the winner or call a split, including kicker battles. |
| **Counting Outs** | Count the cards that give you a straight or better on the flop or turn, then learn the rule of 2 and 4. |

## Run it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer (Node 20+):
   ```bash
   npm install
   npm start
   ```
3. Scan the QR code in the terminal with your phone's camera (iOS) or the Expo Go app (Android).

You can also run `npm run web` to try it in a browser.

## Development

```bash
npm test           # poker engine unit tests (vitest)
npm run typecheck  # TypeScript
```

```
src/
  app/          screens (Expo Router: one file per route)
  components/   cards, range chart, shared drill layout
  poker/        pure TypeScript engine: cards, hand evaluator, ranges, outs, pot odds
  stats/        per-drill stats saved with AsyncStorage
```

The preflop charts are simplified 6-max, 100bb raise-first-in ranges, and live in `src/poker/ranges.ts` if you want to swap in your own.
