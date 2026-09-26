# Poker Drill App — Spec

Source of truth for all work on this repo. Decisions below are final.
Sections 1–9 are the Claude Code brief verbatim; the appendix carries the maths
reference and design notes from the design document (Sep 26, 2026).

## Product
- Personal training app for one user (me) for No-Limit Texas Hold'em maths.
- Installable Progressive Web App: installed separately via Safari "Add to Home Screen" on iPhone and iPad. Must work fully offline after first load (service worker, web manifest, apple-touch-icon, standalone display).
- Responsive: single column on iPhone; use the extra space on iPad. Large tap targets, numeric keypad for number inputs (`inputmode="decimal"`).
- No backend, no login. Hosted on GitHub Pages, deployed automatically by a GitHub Actions workflow on push to main. If Pages can't publish from this repo (e.g. private repo on a free plan), stop and tell me.

## Tech
- TypeScript, static build (Vite or similar; your choice, justify briefly).
- Strict separation into:
  1. `engine/`: pure functions: deck, dealing, hand evaluation, draw detection, outs, all formulas. No UI code.
  2. `questions/`: one generator per level, each producing: prompt, card display data, correct answer, tolerance, and a step-by-step explanation.
  3. `progress/`: all saving/loading behind a `StorageAdapter` interface. Implement a local (IndexedDB or localStorage) adapter now. Design so a remote adapter (my own VPS) can be added later without touching other code. Version the data schema.
  4. `ui/`
- Unit tests (Vitest) for every formula and generator, written before the UI. Include tests that generated questions always have one unambiguous correct answer.
- All tunable numbers (time limits, thresholds, tolerances, bet sizes) in one config file.

## Poker conventions
- Heads-up spots only. All amounts in big blinds (bb).
- Bet sizes drawn from realistic fractions of pot: 1/3, 1/2, 2/3, 3/4, pot, 1.5x, 2x.
- Opponent's hand is NEVER shown. Outs are standard counts: flush draw 9, open-ended straight draw 8, gutshot 4, double gutshot 8, two overcards 6, combo draws = union of outs (never double-count a card that completes two draws).
  Compute outs by enumerating unseen cards and checking which complete a draw, so overlaps are handled automatically. Only count overcard outs when the question explicitly states the opponent holds a single pair below both overcards.
- Rule of 4/2: flop (two cards to come) = outs × 4, minus (outs − 8) when outs > 8; turn = outs × 2. Answers are graded against this shortcut (tolerance ±1 percentage point). After each answer, also show the exact equity (flop: 1 − C(47−outs,2)/C(47,2); turn: outs/46) for reference.
- Required equity = call / (pot + opponent's bet + my call).
- Avoid generating borderline call/fold spots where shortcut equity and required equity are within 2 points.

## Levels (all unlocked from the start)
0. **Arithmetic package** (v1.1): six levels, each with its own medals. Runs ramp from easy (question 1) to hard (question 20).
   - **A1 Pot addition**: pot + bet (tens) → pot + bet + call → hundreds and several streets → thousands, uneven numbers and raises.
   - **A2 Times tables**: outs × 2 / × 4, bet multiples, raise sizing, × 1.5 / 2.5 / 3.5, two-digit × one-digit.
   - **A3 Division**: ÷ 2 / 5 / 10, ÷ 3 / 4, fractions of the pot (½ ⅓ ¼ ⅔ ¾), ÷ 6 / 8 / 12.
   - **A4 Fractions ↔ %**: the fraction table, "X% is 1 in ?", % of a number.
   - **A5 Division to %**: round denominators → simplify to a known fraction → call ÷ final pot → awkward numbers (±1%).
   - **A6 Multi-step sums**: combo outs, equity ↔ odds, Rule of 4 correction, full pot-odds chain, pot odds after a raise.
1. **Outs counting**: hand + board shown, enter number of outs.
2. **Equity from outs**: given outs and street, enter equity %.
3. **Equity ↔ odds**: convert both directions (e.g. 25% ↔ 3:1).
4. **Required equity**: given pot, bet, call, enter required equity %.
5. **Full call/fold**: deal a spot; I answer call or fold. Explanation shows outs → equity → required equity → decision.
6. **Bet sizing**: gradeable only, e.g. smallest bet (as % of pot) that makes a given draw's call −EV this street: bet > e·pot / (1 − 2e); or pick which of several sizes denies correct odds.
7. **Implied & reverse implied odds**: e.g. how much must I win on later streets to make this call break even: future winnings = call / equity − final pot. Reverse implied: identify whether hitting gives the nuts or a non-nut hand (multiple choice).
8. **GTO bluffing**: three separate question types, each forward and reverse-solved (given %, find bet size):
   - Break-even fold % for a pure bluff = bet / (pot + bet)
   - Balanced bluff share of betting range = bet / (pot + 2·bet)
   - Minimum defence frequency (MDF) = pot / (pot + bet)

   Explanations must state which of the three is being asked, since confusing them is the main learning risk.
9. **Range construction**: given N value combos and a bet size, how many bluff combos to balance: bluffs = N × bet / (pot + bet).
10. **Mixed drills**: random questions from levels 1–9, plus exploit spots: given an opponent's fold % vs a bet, is a pure bluff +EV? EV = fold% × pot − (1 − fold%) × bet.

Every question shows a clear step-by-step worked explanation after I answer, right or wrong.

## Cheat sheets and hints (v1.1)
- Every level (A1–A6 and 1–10) has a cheat sheet: how-to tricks, worked examples and, where useful, a reference table.
- The cheat sheet is shown on the level page and is available during every run, timed ones included (open by default on iPad, collapsed on iPhone).
- A wrong answer shows a hint: **what went wrong** (recognising common mistakes, e.g. leaving your own call out of the final pot, or giving the MDF when the break-even fold % was asked) and **what to think about** next time.

## Medals (per level, earned in order within that level)
- A run = 20 questions.
- **Silver**: one run at ≥90% accuracy, untimed.
- **Gold**: one run at ≥90%, timed.
- **Platinum**: three runs (not necessarily consecutive) at ≥95%, timed.
- Timed: per-question limit set per level in config (start at ~8s for Level 0, scaling up to ~20s for Levels 5 and 10). Timing out counts as wrong.
- Home screen shows each level with its medal status.

## Progress
- Store every run: level, tier, date, score, time taken, questions missed.
- Schema v2 (v1.1): level keys are strings ("A1"–"A6", "1"–"10"); v1 data and backups are upgraded automatically.
- Simple stats per level: best score, attempts, most-missed question types.
- Export progress to a JSON file and import it back (backup/manual transfer between devices).

## Done means
- All tests pass, app deploys to GitHub Pages, installs on iPhone and iPad and works in airplane mode.
- Give me the URL and short install steps for Safari when finished.

---

## Appendix A — Maths reference (the app grades against these exact rules)

**Outs.** Only count outs when behind; a made hand already ahead is not drawing.

| Draw | Outs |
|---|---|
| Flush draw | 9 |
| Open-ended straight draw | 8 |
| Double gutshot | 8 |
| Two overcards | 6 |
| Gutshot (inside straight) | 4 |
| Combo draw | Sum of both, minus cards counted twice |

Example: flush draw + OESD = 9 + 8 − 2 = 15 outs.

**Rule of 4 and 2.** 9 outs on the flop = 36%. 15 outs on the flop = 60 − 7 = 53% (exact 54.1%).

**Equity to odds.** Odds against = (100 − equity) : equity.

| Equity | 50% | 33% | 25% | 20% | 17% | 14% | 11% | 9% |
|---|---|---|---|---|---|---|---|---|
| Odds | 1:1 | 2:1 | 3:1 | 4:1 | 5:1 | 6:1 | 8:1 | 10:1 |

**Pot odds.** Pot 100, opponent bets 50, you call 50 → final pot 200, required equity 25%.

**Bet sizing / denial.** Caller facing B into P needs B / (P + 2B). To make a draw with equity e call at a loss, bet B > e·P / (1 − 2e). Turn flush draw ≈ 19.6% → any bet above ≈ ⅓ pot denies correct odds.

**Implied odds.** Effective required equity = call / (final pot + future winnings). Future winnings to break even = call / equity − final pot. **Reverse implied odds:** hitting may still lose (e.g. straight completes on a flush-completing card); tighten calls with non-nut draws.

**GTO (corrected).** EV of a pure bluff = fold% × P − (1 − fold%) × B.

| Figure | Formula | ½ pot | Pot | 2× pot |
|---|---|---|---|---|
| Break-even fold % for a pure bluff | B / (P + B) | 33% | 50% | 67% |
| Balanced bluff share of betting range | B / (P + 2B) | 25% | 33% | 40% |
| Minimum defence frequency (MDF) | P / (P + B) | 67% | 50% | 33% |
| Bluffs per value combo | B / (P + B) | 0.33 | 0.5 | 0.67 |

## Appendix B — Level 8 correction

The source PDF labels bet / (pot + bet) as the optimal bluff frequency. That is actually the break-even fold % for a pure bluff. The balanced bluff share is bet / (pot + 2·bet), so the PDF's 33% / 50% / 67% overstates it; correct figures are 25% / 33% / 40%.

- **Break-even fold %** = B / (P + B): how often a pure bluff must work to not lose money.
- **Balanced bluff %** = B / (P + 2B): share of your bets that should be bluffs so the opponent is indifferent.
- **MDF** = P / (P + B): how often the defender must continue, or the bettor profits bluffing any two cards.

## Appendix C — Design decisions

| # | Question | Decision |
|---|---|---|
| 1 | Devices | Web app installed separately on iPhone and iPad via Safari; works offline |
| 2 | Users & progress | Just Adam; per-device progress; code structured for later VPS sync; export/import |
| 3 | Opponent's hand | Never shown; standard out counts |
| 4 | Game | No-Limit Texas Hold'em only |
| 5 | Grading | Rule of 4/2 (±1 point); exact equity shown afterwards |
| 6 | Progression | All levels open; three medals per level |
| 7 | Judgement levels (6, 9, 10) | Every question has one markable answer plus explanation |
| 8 | Hosting | GitHub Pages now; VPS when sync is added |
| 9 | Level 8 | Corrected formula; drill all three GTO figures separately |

Assumptions (changeable): heads-up only; amounts in bb; first medal is Silver; time limits ~8s (L0) to ~20s (L5, L10); Platinum runs need not be consecutive; overcard outs only when the question states opponent holds a single pair below both overcards.

## Future roadmap (not v1)
- VPS sync via a remote `StorageAdapter`; app may then move from GitHub Pages to the VPS.
- Open for later: multiway pots, currency amounts, open "what would you do" spots.
