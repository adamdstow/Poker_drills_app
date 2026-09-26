# Poker Drills

A mobile app (Expo / React Native) for drilling poker maths, built on the curriculum in *Poker Fundamentals: Equity, Pot Odds & Game Theory*. Every question is generated at random and explained after you answer. Progress is saved on the device.

## Curriculum

Work up from level 0. A level counts as mastered when you get 8 of your last 10 right, and the home screen highlights the next level to work on. Every level stays open.

| # | Level | What you drill |
| --- | --- | --- |
| 0 | Arithmetic Foundation | ×2 and ×4, fractions → %, "what % of", "% of $" |
| 1 | Counting Outs | Real hands on the flop and turn: flush, straight and overcard outs, with overlaps counted once |
| 2 | Equity from Outs | Rule of 4 and 2, including −1% per out above 8 for big draws |
| 3 | Equity ↔ Odds | Benchmark table both ways (33% ↔ 2:1, 20% ↔ 4:1 …) |
| 4 | Pot Odds & Required Equity | Final pot, call ÷ final pot, call/fold given your equity |
| 5 | Call or Fold *(timed, 30s)* | Real hands: count outs → equity → pot odds → decision |
| 6 | Bet Sizing | Smallest bet that denies a draw, the equity your opponent needs, range narrowing |
| 7 | Implied & Reverse Implied Odds | Effective required equity, break-even implied winnings, nut vs non-nut draws, dirty outs |
| 8 | GTO Bluff Frequency | How often a bluff must work, bluff share of a balanced range, and both solved in reverse |
| 9 | Range Construction | Bluff combos for a given value count and size, which size balances a range, over- or under-bluffing |
| 10 | Applied Mixed Drills *(timed, 30s)* | Random questions from levels 1–9 plus exploit reads |

**Bonus drills:** Preflop Ranges (raise or fold from each 6-max seat) and Hand Rankings (who wins at showdown).

### A note on bluff frequency

The source doc gives "optimal bluff frequency = bet ÷ (pot + bet)", which is 33% / 50% / 67% for ½-pot, pot and 2× pot. That formula is really **how often a bluff must succeed to break even**. The share of a balanced betting range that should be bluffs is **bet ÷ (pot + 2 × bet)**, the same as the caller's pot odds: 25% / 33% / 40%. Level 8 drills both, labelled separately, and level 9 builds ranges from the second one.

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
npm test           # engine and curriculum tests (vitest)
npm run typecheck  # TypeScript
```

```
src/
  app/          screens (Expo Router): home, level/[id], preflop, showdown
  curriculum/   question generators for levels 0-10
  components/   cards, timer, range chart, shared drill layout
  poker/        cards, hand evaluator, outs counting, equity maths, preflop ranges
  stats/        per-level stats saved with AsyncStorage
```

Each level is a `generate(rng)` function returning a question, choices and an explanation, so adding or changing drills only touches `src/curriculum/`.
