import type { MedalTier } from '../config';
import { randomSeed, createRng } from '../engine/rng';
import { getLevel } from '../questions';
import type { MedalStatus } from '../progress/medals';
import type { ProgressStore } from '../progress/store';
import type { RunRecord } from '../progress/types';
import { clear } from './dom';
import { renderData } from './screens/data';
import { renderArithmetic, renderHome } from './screens/home';
import { renderLevel } from './screens/level';
import { renderResults } from './screens/results';
import { renderRun } from './screens/run';
import { RunSession } from './session';

export type Screen =
  | { name: 'home' }
  | { name: 'arithmetic' }
  | { name: 'level'; level: string }
  | { name: 'run'; session: RunSession }
  | { name: 'results'; session: RunSession; record: RunRecord; before: MedalStatus }
  | { name: 'data' };

export interface Rendered {
  el: HTMLElement;
  /** Called when leaving the screen (stop timers, remove listeners). */
  cleanup?: () => void;
  /** Called once the element is in the document. */
  mounted?: () => void;
}

export class App {
  private cleanup: (() => void) | undefined;

  constructor(
    private readonly root: HTMLElement,
    readonly store: ProgressStore,
  ) {}

  /** Where the back button on a level page goes. */
  backFromLevel(level: string): Screen {
    return getLevel(level).group === 'arithmetic' ? { name: 'arithmetic' } : { name: 'home' };
  }

  go(screen: Screen): void {
    this.cleanup?.();
    this.cleanup = undefined;
    const r = this.render(screen);
    clear(this.root);
    this.root.appendChild(r.el);
    this.root.dataset.screen = screen.name;
    window.scrollTo(0, 0);
    this.cleanup = r.cleanup;
    r.mounted?.();
  }

  startRun(level: string, tier: MedalTier): void {
    this.go({ name: 'run', session: new RunSession(getLevel(level), tier, createRng(randomSeed())) });
  }

  private render(screen: Screen): Rendered {
    switch (screen.name) {
      case 'home':
        return renderHome(this);
      case 'arithmetic':
        return renderArithmetic(this);
      case 'level':
        return renderLevel(this, screen.level);
      case 'run':
        return renderRun(this, screen.session);
      case 'results':
        return renderResults(this, screen.session, screen.record, screen.before);
      case 'data':
        return renderData(this);
    }
  }
}
