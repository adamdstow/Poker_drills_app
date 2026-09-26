import type { CheatSheet } from './types';

/** Reference cards shown on each level page and during runs. */
export const CHEAT_SHEETS: Record<string, CheatSheet> = {
  A1: {
    howTo: [
      'A called bet goes in twice: final pot = pot + bet + call = pot + 2 × bet.',
      'Add the biggest parts first: thousands, then hundreds, then tens, then units.',
      'Uneven numbers: round to the nearest ten, add, then fix the difference (47 + 38 → 50 + 40 = 90, minus 3 and 2 = 85).',
      'Several streets: build it one street at a time — each called bet adds 2 × bet.',
      'After a raise and a call, both players have the raise-to amount in: pot + 2 × raise-to.',
    ],
    examples: [
      { q: 'Pot 60, opponent bets 40, you call.', steps: ['40 + 40 = 80', '60 + 80 = 140'] },
      { q: 'Pot 1,250, bet 875, call.', steps: ['875 × 2 = 1,750', '1,250 + 1,750 = 3,000'] },
      { q: 'Pot 120. You bet 80, they raise to 260, you call.', steps: ['You both end with 260 in', '120 + 2 × 260 = 640'] },
    ],
  },
  A2: {
    howTo: [
      '× 2: double it. × 4: double, then double again (13 → 26 → 52).',
      'Split two-digit numbers: 17 × 4 = 10 × 4 + 7 × 4 = 40 + 28 = 68.',
      '× 1.5: the number plus half of it (84 → 84 + 42 = 126).',
      '× 2.5: double it, then add half (40 → 80 + 20 = 100).',
      '× 5: × 10, then halve (36 × 5 = 360 ÷ 2 = 180).',
    ],
    examples: [
      { q: '15 outs × 4', steps: ['15 × 2 = 30', '30 × 2 = 60'] },
      { q: '1.5 × pot of 70', steps: ['Half of 70 = 35', '70 + 35 = 105'] },
      { q: '38 × 7', steps: ['30 × 7 = 210', '8 × 7 = 56', '210 + 56 = 266'] },
    ],
    table: {
      title: 'Outs × 2 and × 4',
      head: ['Outs', '× 2 / × 4'],
      rows: [['4', '8 / 16'], ['6', '12 / 24'], ['8', '16 / 32'], ['9', '18 / 36'], ['12', '24 / 48'], ['15', '30 / 60']],
    },
  },
  A3: {
    howTo: [
      '÷ 2 is half. ÷ 4 is half, then half again. ÷ 8 is half three times.',
      '÷ 5 is ÷ 10, then double (140 ÷ 5 = 14 × 2 = 28).',
      '⅓ of the pot: ÷ 3. ⅔: ÷ 3, then double.',
      '¾ of the pot: the pot minus a quarter (80 − 20 = 60).',
      '÷ 6 is half, then ÷ 3. ÷ 12 is half, then ÷ 6.',
    ],
    examples: [
      { q: '⅔ of 135', steps: ['135 ÷ 3 = 45', '45 × 2 = 90'] },
      { q: '¾ of 96', steps: ['96 ÷ 4 = 24', '96 − 24 = 72'] },
      { q: '168 ÷ 8', steps: ['Half: 84', 'Half: 42', 'Half: 21'] },
    ],
    table: {
      title: 'Bet sizes on a 60 pot',
      head: ['Size', 'Bet'],
      rows: [['⅓ pot', '20'], ['½ pot', '30'], ['⅔ pot', '40'], ['¾ pot', '45'], ['Pot', '60'], ['1.5× pot', '90'], ['2× pot', '120']],
    },
  },
  A4: {
    howTo: [
      'Learn the unit fractions by heart — everything else is built from them.',
      'For n/d, take 1/d and multiply: 3/8 = 3 × 12.5% = 37.5%.',
      'X% of a number: find 10% (move the decimal point), then scale — 30% of 80 = 3 × 8 = 24.',
      '"25% is 1 in how many?" → 100 ÷ 25 = 4.',
    ],
    examples: [
      { q: '5/8 as a %', steps: ['⅛ = 12.5%', '× 5 = 62.5%'] },
      { q: '2/7 as a %', steps: ['⅐ ≈ 14.3%', '× 2 ≈ 28.6%'] },
      { q: '75% of 160', steps: ['25% = 40', '× 3 = 120'] },
    ],
    table: {
      title: 'Fractions → %',
      head: ['Fraction', '%'],
      rows: [['½', '50'], ['⅓', '33.3'], ['¼', '25'], ['⅕', '20'], ['⅙', '16.7'], ['⅐', '14.3'], ['⅛', '12.5'], ['⅑', '11.1'], ['1/10', '10'], ['⅔', '66.7'], ['¾', '75'], ['⅜', '37.5']],
    },
  },
  A5: {
    howTo: [
      'Small number on top: call ÷ final pot, never the other way round.',
      'Simplify first: divide both numbers by the same thing (45 ÷ 135 → 1 ÷ 3 = 33%).',
      'Match to a fraction you know: 40 ÷ 140 = 2 ÷ 7 ≈ 28.6%.',
      'Or use 10% steps: 10% of 170 is 17; 45 is about 2.6 of those → about 26%.',
      'Close is fine: answers within 1% are marked right.',
    ],
    examples: [
      { q: '30 ÷ 90', steps: ['Simplify: 1 ÷ 3', '= 33%'] },
      { q: '40 ÷ 140', steps: ['Simplify: 2 ÷ 7', '⅐ ≈ 14.3%, × 2 ≈ 28.6%'] },
      { q: '27 ÷ 114', steps: ['10% of 114 ≈ 11.4', '27 ÷ 11.4 ≈ 2.4 → about 24%'] },
    ],
    table: {
      title: 'Pot odds at common sizes (call ÷ final pot)',
      head: ['Bet', 'You need'],
      rows: [['⅓ pot', '20%'], ['½ pot', '25%'], ['⅔ pot', '28.6%'], ['¾ pot', '30%'], ['Pot', '33.3%'], ['1.5× pot', '37.5%'], ['2× pot', '40%']],
    },
  },
  A6: {
    howTo: [
      'Do one step at a time and hold the middle number: final pot first, then divide.',
      'Combo outs: add the draws, then subtract cards counted twice.',
      'Equity → odds: (100 − e) ÷ e. Odds X:1 → equity: 100 ÷ (X + 1).',
      'Rule of 4 above 8 outs: outs × 4 − (outs − 8).',
      'After a raise, your call is only the extra: raise-to − your bet.',
    ],
    examples: [
      { q: 'Pot 60, bet 40, you call. Call as % of final pot?', steps: ['Final pot = 60 + 40 + 40 = 140', '40 ÷ 140 ≈ 28.6%'] },
      { q: '13 outs on the flop', steps: ['13 × 4 = 52', '13 − 8 = 5', '52 − 5 = 47%'] },
      { q: '20% equity as odds', steps: ['100 − 20 = 80', '80 ÷ 20 = 4 → 4:1'] },
    ],
  },
  '1': {
    howTo: [
      'An out is an unseen card that makes your hand the likely winner.',
      'Name every draw you have, count each one, then subtract cards counted twice.',
      'A card that completes both a flush and a straight is one out, not two.',
      'Only count overcards when the question says the opponent holds a pair below both of your cards.',
      'Straights made only by the board are not your outs.',
    ],
    examples: [
      { q: '9♥ 8♥ on 7♥ 6♣ 2♥', steps: ['Flush: 9 hearts', 'Straight: four 5s + four 10s = 8', '5♥ and 10♥ counted twice', '9 + 8 − 2 = 15 outs'] },
      { q: '9♣ 7♦ on J♥ 8♠ 5♣', steps: ['Needs a 6 (5-9) or a 10 (7-J)', 'Double gutshot: 8 outs'] },
    ],
    table: {
      title: 'Standard outs',
      head: ['Draw', 'Outs'],
      rows: [['Flush draw', '9'], ['Open-ended straight', '8'], ['Double gutshot', '8'], ['Two overcards', '6'], ['Gutshot', '4'], ['Flush + open-ender', '15'], ['Flush + gutshot', '12']],
    },
  },
  '2': {
    howTo: [
      'Flop (two cards to come): outs × 4.',
      'Above 8 outs on the flop, subtract (outs − 8).',
      'Turn (one card to come): outs × 2.',
      'Answers are marked on the shortcut (±1%); the exact figure is shown afterwards.',
    ],
    examples: [
      { q: '9 outs on the flop', steps: ['9 × 4 = 36', '− (9 − 8) = 35%', 'Exact 35.0%'] },
      { q: '15 outs on the flop', steps: ['15 × 4 = 60', '− 7 = 53%', 'Exact 54.1%'] },
      { q: '9 outs on the turn', steps: ['9 × 2 = 18%', 'Exact 19.6%'] },
    ],
    table: {
      title: 'Rule of 4 and 2',
      head: ['Outs', 'Flop / Turn'],
      rows: [['4', '16% / 8%'], ['6', '24% / 12%'], ['8', '32% / 16%'], ['9', '35% / 18%'], ['12', '44% / 24%'], ['15', '53% / 30%']],
    },
  },
  '3': {
    howTo: [
      'Odds against = losses : wins.',
      'Equity → odds: (100 − equity) ÷ equity. 25% → 75 ÷ 25 = 3 → 3:1.',
      'Odds → equity: 1 ÷ (X + 1). 4:1 → 1 ÷ 5 = 20%.',
    ],
    examples: [
      { q: '20% as odds', steps: ['80 : 20', '= 4:1'] },
      { q: '2:1 as equity', steps: ['2 + 1 = 3 outcomes', '1 ÷ 3 = 33%'] },
    ],
    table: {
      title: 'Equity ↔ odds',
      head: ['Equity', 'Odds'],
      rows: [['50%', '1:1'], ['33%', '2:1'], ['25%', '3:1'], ['20%', '4:1'], ['17%', '5:1'], ['14%', '6:1'], ['11%', '8:1'], ['9%', '10:1']],
    },
  },
  '4': {
    howTo: [
      'Required equity = call ÷ final pot.',
      'Final pot = pot + opponent\'s bet + your call.',
      'Trap: call ÷ the current pot leaves out the bet and your call.',
      'Facing a raise: your call is raise-to − what you already bet.',
    ],
    examples: [
      { q: 'Pot 100, bet 50', steps: ['Final pot 100 + 50 + 50 = 200', '50 ÷ 200 = 25%'] },
      { q: 'Pot 24, you bet 18, raised to 45', steps: ['Call = 45 − 18 = 27', 'Final pot 24 + 18 + 45 + 27 = 114', '27 ÷ 114 = 23.7%'] },
    ],
    table: {
      title: 'Facing a bet',
      head: ['Bet size', 'You need'],
      rows: [['⅓ pot', '20%'], ['½ pot', '25%'], ['⅔ pot', '28.6%'], ['¾ pot', '30%'], ['Pot', '33.3%'], ['1.5× pot', '37.5%'], ['2× pot', '40%']],
    },
  },
  '5': {
    howTo: [
      '1. Count your outs (subtract cards counted twice).',
      '2. Equity: flop × 4 (minus outs − 8 above 8 outs), turn × 2.',
      '3. Required equity: call ÷ (pot + bet + call).',
      '4. Call if your equity is higher, fold if it is lower.',
      'On the flop spots here the opponent is all-in, so two cards really do come.',
    ],
    examples: [
      { q: 'Turn, flush draw, pot 60, bet 30', steps: ['9 outs × 2 = 18%', 'Need 30 ÷ 120 = 25%', '18% < 25% → fold'] },
      { q: 'Flop all-in, 15 outs, pot 24, shove 48', steps: ['15 × 4 − 7 = 53%', 'Need 48 ÷ 120 = 40%', '53% > 40% → call'] },
    ],
  },
  '6': {
    howTo: [
      'Facing bet B into pot P, the caller needs B ÷ (P + 2B).',
      'Your bet denies correct odds when that is more than their equity.',
      'Threshold: bet > e ÷ (1 − 2e) of the pot.',
      'A turn flush draw (≈ 18–20%) is denied by about ⅓ pot or more.',
    ],
    examples: [
      { q: 'Draw with 18% equity', steps: ['0.18 ÷ (1 − 0.36) = 0.18 ÷ 0.64', '≈ 28% of the pot'] },
      { q: 'Pot 90, draw with 24%', steps: ['0.24 ÷ 0.52 ≈ 46%', '46% × 90 ≈ 41.5 bb'] },
    ],
    table: {
      title: 'What each size makes the caller need',
      head: ['Bet', 'Caller needs'],
      rows: [['⅓ pot', '20%'], ['½ pot', '25%'], ['⅔ pot', '28.6%'], ['¾ pot', '30%'], ['Pot', '33.3%'], ['1.5× pot', '37.5%'], ['2× pot', '40%']],
    },
  },
  '7': {
    howTo: [
      'Future winnings needed to break even = call ÷ equity − final pot.',
      'With future winnings W, required equity = call ÷ (final pot + W).',
      'Reverse implied odds: hitting can still lose. On the river check the board for pairs (full houses), three of a suit (flushes) and higher straights.',
      'Non-nut draws deserve tighter calls.',
    ],
    examples: [
      { q: 'Pot 60, bet 20, 8% equity', steps: ['Final pot 100', '20 ÷ 0.08 = 250', '250 − 100 = 150 bb more'] },
      { q: 'Low straight on a board with three hearts', steps: ['Any two hearts make a flush', 'Not the nuts'] },
    ],
  },
  '8': {
    howTo: [
      'First decide WHICH figure the question asks for — mixing them up is the main mistake.',
      'Break-even fold % (you bluff): risk ÷ (risk + reward) = B ÷ (P + B).',
      'Balanced bluff share (your betting range): B ÷ (P + 2B).',
      'MDF (you defend): P ÷ (P + B).',
      'Reverse: fold f → B/P = f ÷ (1 − f); share s → s ÷ (1 − 2s); MDF m → (1 − m) ÷ m.',
    ],
    examples: [
      { q: 'Pot-size bet', steps: ['Break-even fold 50%', 'Bluff share 33%', 'MDF 50%'] },
      { q: 'Balanced with 25% bluffs → size?', steps: ['0.25 ÷ (1 − 0.5) = 0.5', '½-pot bet'] },
    ],
    table: {
      title: 'The three figures',
      head: ['Size', 'Fold / Bluff / MDF'],
      rows: [['⅓ pot', '25 / 20 / 75'], ['½ pot', '33 / 25 / 67'], ['⅔ pot', '40 / 29 / 60'], ['¾ pot', '43 / 30 / 57'], ['Pot', '50 / 33 / 50'], ['1.5× pot', '60 / 38 / 40'], ['2× pot', '67 / 40 / 33']],
    },
  },
  '9': {
    howTo: [
      'Bluffs per value combo = B ÷ (P + B) — the caller\'s pot odds.',
      'Bluffs = value combos × B ÷ (P + B).',
      'Value combos = bluffs ÷ (B ÷ (P + B)).',
      'Check: bluffs ÷ all bets = B ÷ (P + 2B).',
    ],
    examples: [
      { q: '12 value combos, pot-size bet', steps: ['B ÷ (P + B) = ½', '12 × ½ = 6 bluffs'] },
      { q: '14 value combos, ¾-pot bet', steps: ['0.75 ÷ 1.75 = 3/7', '14 × 3/7 = 6 bluffs'] },
    ],
    table: {
      title: 'Bluffs per value combo',
      head: ['Size', 'Ratio'],
      rows: [['⅓ pot', '1/4'], ['½ pot', '1/3'], ['⅔ pot', '2/5'], ['¾ pot', '3/7'], ['Pot', '1/2'], ['1.5× pot', '3/5'], ['2× pot', '2/3']],
    },
  },
  '10': {
    howTo: [
      'Mixed questions from every level — use that level\'s shortcut.',
      'Exploit spots: a pure bluff is +EV when they fold more than B ÷ (P + B).',
      'Bluff EV = fold% × pot − (1 − fold%) × bet.',
    ],
    examples: [
      { q: 'They fold 60% to a pot-size bet', steps: ['Break-even 50%', '60% > 50% → bluff is +EV'] },
      { q: 'They fold 55% to a 2× pot bet', steps: ['Break-even 2 ÷ 3 = 67%', '55% < 67% → −EV'] },
    ],
  },
};
