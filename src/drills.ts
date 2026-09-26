import { DrillId } from '@/stats/StatsContext';

export interface DrillInfo {
  id: DrillId;
  route: '/preflop' | '/pot-odds' | '/showdown' | '/outs';
  title: string;
  description: string;
  symbol: string;
}

export const DRILLS: DrillInfo[] = [
  {
    id: 'preflop',
    route: '/preflop',
    title: 'Preflop Ranges',
    description: 'Folded to you. Raise or fold from each position?',
    symbol: '♠',
  },
  {
    id: 'potOdds',
    route: '/pot-odds',
    title: 'Pot Odds',
    description: 'Facing a bet with a draw. Is the call profitable?',
    symbol: '♦',
  },
  {
    id: 'showdown',
    route: '/showdown',
    title: 'Hand Rankings',
    description: 'Two hands, one board. Who wins the pot?',
    symbol: '♥',
  },
  {
    id: 'outs',
    route: '/outs',
    title: 'Counting Outs',
    description: 'How many cards give you a straight or better?',
    symbol: '♣',
  },
];

export function drillTitle(id: DrillId): string {
  return DRILLS.find((d) => d.id === id)!.title;
}
