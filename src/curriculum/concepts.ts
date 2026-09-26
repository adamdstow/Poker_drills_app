import { Rng, parseCards } from '@/poker/cards';
import { textChoices } from './choices';
import { Question } from './types';

interface Concept {
  prompt: string;
  hole?: string;
  board?: string;
  correct: string;
  wrong: string[];
  why: string;
}

function toQuestion(c: Concept, rng: Rng): Question {
  return {
    prompt: c.prompt,
    hole: c.hole ? parseCards(c.hole) : undefined,
    board: c.board ? parseCards(c.board) : undefined,
    ...textChoices(c.correct, c.wrong, rng),
    explanation: [c.correct, c.why],
  };
}

export const conceptQuestion = (bank: Concept[]) => (rng: Rng) => toQuestion(bank[Math.floor(rng() * bank.length)], rng);

export const SIZING_CONCEPTS: Concept[] = [
  {
    prompt: 'On the river you bet 2× pot instead of ⅓ pot. The range that calls you will be…',
    correct: 'Narrower and stronger',
    wrong: ['Wider and weaker', 'Exactly the same', 'Mostly draws'],
    why: 'A big bet offers a worse price, so only hands strong enough to stand the cost continue. Big bets narrow ranges.',
  },
  {
    prompt: 'You flop top set on a wet board with lots of draws around. Why bet big?',
    hole: 'Qs Qd',
    board: 'Qh Jh Tc',
    correct: 'To give draws a worse price to continue',
    wrong: ['To make every worse hand fold', 'Because bigger bets always win more', 'To get called by weaker pairs more often'],
    why: 'Bigger bets deny equity: draws now need more equity than they have to call profitably.',
  },
  {
    prompt: 'When you choose a raise size, it should mostly reflect…',
    correct: 'What you want your opponent to believe or do',
    wrong: ['Your own equity only', 'The size of their bet only', 'Always a fixed 3× raise'],
    why: 'Sizing is about the decision you’re giving your opponent: which hands you want to call, fold or be priced out.',
  },
  {
    prompt: 'Why does a small bet do a poor job of protecting a vulnerable made hand?',
    correct: 'It gives draws a cheap price to see the next card',
    wrong: ['It always gets raised', 'It makes your range too strong', 'Small bets are never called'],
    why: 'Against a ⅓-pot bet a draw only needs 20% equity, so most draws can call correctly.',
  },
];

export const IMPLIED_CONCEPTS: Concept[] = [
  {
    prompt: 'You call with this flush draw and hit. What’s the danger?',
    hole: '5h 4h',
    board: 'Kh 9h 2c',
    correct: 'A bigger flush: this draw isn’t to the nuts',
    wrong: ['None, a flush always wins', 'Only a full house beats you', 'You have too few outs to call'],
    why: 'Non-nut draws carry reverse implied odds: when you hit, you can still lose a big pot to a higher flush.',
  },
  {
    prompt: 'You need a Q or a 7 for your straight. Which of those outs are “dirty” if villain has a heart draw?',
    hole: 'Jc Tc',
    board: 'Kh 9h 8d',
    correct: 'Q♥ and 7♥',
    wrong: ['All four Queens', 'All four Sevens', 'None of them'],
    why: 'The heart Queen and Seven make your straight but also complete a heart flush, which beats you.',
  },
  {
    prompt: 'Which draw has the best implied odds?',
    correct: 'Nut flush draw, deep stacks, opponent who pays off',
    wrong: ['Low flush draw on a paired board', 'Any draw when stacks are short', 'Straight draw that also makes a flush for the board'],
    why: 'Implied odds need money left behind, a draw that wins when it hits, and an opponent who pays you.',
  },
  {
    prompt: 'Stacks are only about one pot deep behind. How much do implied odds help?',
    correct: 'Very little: there’s almost nothing left to win later',
    wrong: ['A lot, always add implied odds', 'They double your equity', 'They matter most when stacks are short'],
    why: 'Implied odds are future winnings. With short stacks there aren’t any, so direct pot odds decide the call.',
  },
  {
    prompt: 'Reverse implied odds should make you…',
    correct: 'Call less often with non-nut draws',
    wrong: ['Call more often with non-nut draws', 'Ignore how strong your draw is', 'Always raise your draws'],
    why: 'If hitting can still cost you a big pot, the draw is worth less than its raw outs suggest.',
  },
];

export const EXPLOIT_CONCEPTS: Concept[] = [
  {
    prompt: 'Villain folds far too often to large river bets. Best adjustment?',
    correct: 'Bluff more, using big sizes',
    wrong: ['Bluff less', 'Only make small value bets', 'Check every river'],
    why: 'If they overfold, bluffs win more often than the break-even rate, so bluff more than GTO.',
  },
  {
    prompt: 'Villain calls down with almost anything. Best adjustment?',
    correct: 'Value bet thinner and bluff less',
    wrong: ['Bluff more', 'Bet smaller with your best hands', 'Check back your value hands'],
    why: 'Calling stations pay off value and don’t fold, so bluffs lose money and medium hands become value bets.',
  },
  {
    prompt: 'Villain almost never bluffs the river. Best adjustment?',
    correct: 'Fold more of your bluff-catchers',
    wrong: ['Call more to catch bluffs', 'Raise more as a bluff', 'Nothing, stay balanced'],
    why: 'Bluff-catchers only win against bluffs. If they don’t bluff, calling just pays off value.',
  },
  {
    prompt: 'Villain folds to flop c-bets far too often. Best adjustment?',
    correct: 'C-bet more often, including weak hands',
    wrong: ['C-bet only with strong hands', 'Stop c-betting', 'Always check-raise instead'],
    why: 'When folds are too frequent, betting with any two cards shows an instant profit.',
  },
  {
    prompt: 'Why learn GTO before exploiting?',
    correct: 'It’s an unexploitable baseline to deviate from',
    wrong: ['It always wins the most money', 'Exploits are against the rules', 'GTO means never bluffing'],
    why: 'GTO protects you when you have no read. Exploit only when you’ve spotted a leak.',
  },
];
