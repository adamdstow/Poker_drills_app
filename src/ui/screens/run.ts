import { TIER_NAMES } from '../../progress/medals';
import { newRunId } from '../../progress/store';
import { diagnose, responseText, type Response } from '../../questions/grade';
import type { Question } from '../../questions/types';
import type { App, Rendered } from '../app';
import { cheatSheetPanel, coachEl, tableEl } from '../components';
import { clear, h } from '../dom';
import type { AnswerResult, RunSession } from '../session';

export function renderRun(app: App, session: RunSession): Rendered {
  let timer: number | undefined;
  let questionStart = 0;
  let answered = false;

  const counter = h('span', { class: 'run-counter' });
  const scoreEl = h('span', { class: 'run-score' });
  const progressFill = h('div', { class: 'progress-fill' });
  const timerFill = h('div', { class: 'timer-fill' });
  const timerText = h('span', { class: 'timer-text' });
  const timerBar = h('div', { class: 'timer', hidden: !session.timed }, h('div', { class: 'timer-track' }, timerFill), timerText);
  const questionPane = h('section', { class: 'question-pane' });
  const answerPane = h('section', { class: 'answer-pane' });

  const quit = () => {
    if (session.index === 0 || confirm('Quit this run? It will not be saved.')) app.go({ name: 'level', level: session.level.key });
  };

  const el = h(
    'main',
    { class: 'screen run' },
    h(
      'header',
      { class: 'run-header' },
      h('button', { class: 'btn-ghost', onClick: quit }, '✕ Quit'),
      h('div', { class: 'run-title' }, `${session.level.group === 'arithmetic' ? session.level.key : `Level ${session.level.key}`} · ${TIER_NAMES[session.tier]}`),
      h('div', { class: 'run-status' }, scoreEl, counter),
    ),
    h('div', { class: 'progress' }, progressFill),
    timerBar,
    h('div', { class: 'run-layout' }, questionPane, answerPane),
    cheatSheetPanel(session.level.cheatSheet),
  );

  const stopTimer = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };

  const tick = () => {
    const left = Math.max(0, session.timeLimitMs - (Date.now() - questionStart));
    timerFill.style.width = `${(left / session.timeLimitMs) * 100}%`;
    timerFill.classList.toggle('low', left < session.timeLimitMs * 0.25);
    timerText.textContent = `${Math.ceil(left / 1000)}s`;
    if (left <= 0) submit({ kind: 'timeout' });
  };

  const updateHeader = () => {
    counter.textContent = `${Math.min(session.index + (answered ? 0 : 1), session.questions.length)}/${session.questions.length}`;
    scoreEl.textContent = `✓ ${session.score}`;
    progressFill.style.width = `${(session.index / session.questions.length) * 100}%`;
  };

  function renderQuestion(q: Question) {
    clear(questionPane);
    questionPane.append(h('div', { class: 'q-type' }, q.typeLabel));
    if (q.cards) questionPane.append(tableEl(q.cards));
    if (q.facts?.length) {
      questionPane.append(
        h('div', { class: 'facts' }, q.facts.map((f) => h('div', { class: 'fact' }, h('span', { class: 'fact-label' }, f.label), h('span', { class: 'fact-value' }, f.value)))),
      );
    }
    questionPane.append(h('p', { class: 'prompt' }, q.prompt));
  }

  function renderInput(q: Question) {
    clear(answerPane);
    if (q.answer.kind === 'number') {
      const input = h('input', {
        class: 'answer-input',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        autocorrect: 'off',
        spellcheck: 'false',
        enterkeyhint: 'done',
        'aria-label': 'Your answer',
        placeholder: '?',
      });
      const form = h(
        'form',
        {
          class: 'answer-form',
          onSubmit: (e: Event) => {
            e.preventDefault();
            if (input.value.trim() === '') return;
            submit({ kind: 'number', raw: input.value });
          },
        },
        h('div', { class: 'input-row' }, input, q.answer.unit ? h('span', { class: 'unit' }, q.answer.unit) : null),
        h('button', { class: 'btn primary big', type: 'submit' }, 'Check'),
      );
      answerPane.append(form);
      input.focus();
    } else {
      answerPane.append(
        h(
          'div',
          { class: `choices n${q.answer.options.length}` },
          q.answer.options.map((o) => h('button', { class: 'btn choice big', onClick: () => submit({ kind: 'choice', id: o.id }) }, o.label)),
        ),
      );
    }
  }

  function renderFeedback(r: AnswerResult) {
    clear(answerPane);
    const last = session.done;
    const next = h('button', { class: 'btn primary big', onClick: () => advance() }, last ? 'See results' : 'Next →');
    answerPane.append(
      h(
        'div',
        { class: `feedback ${r.correct ? 'ok' : 'bad'}` },
        h('div', { class: 'feedback-title' }, r.correct ? '✓ Correct' : r.response.kind === 'timeout' ? '⏱ Time’s up' : '✗ Not quite'),
        h(
          'div',
          { class: 'feedback-answers' },
          r.correct ? null : h('div', null, h('span', { class: 'muted' }, 'You: '), responseText(r.question, r.response)),
          h('div', null, h('span', { class: 'muted' }, 'Answer: '), h('strong', null, r.question.answerText)),
        ),
      ),
      ...(r.correct ? [] : [coachEl(diagnose(r.question, r.response))]),
      h('div', { class: 'explain-title' }, 'Worked answer'),
      h('ol', { class: 'explanation' }, r.question.explanation.map((s) => h('li', null, s))),
      next,
    );
    next.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 819px)').matches) answerPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit(response: Response) {
    if (answered) return;
    answered = true;
    stopTimer();
    (document.activeElement as HTMLElement | null)?.blur();
    const r = session.answer(response, Date.now() - questionStart);
    updateHeader();
    renderFeedback(r);
  }

  async function advance() {
    if (session.done) {
      const before = app.store.medals(session.level.key);
      const record = session.toRecord(newRunId());
      try {
        await app.store.recordRun(record);
      } catch (err) {
        alert(`Could not save this run: ${String(err)}`);
      }
      app.go({ name: 'results', session, record, before });
      return;
    }
    showQuestion();
  }

  function showQuestion() {
    answered = false;
    const q = session.current;
    updateHeader();
    renderQuestion(q);
    renderInput(q);
    questionStart = Date.now();
    if (session.timed) {
      tick();
      timer = window.setInterval(tick, 100);
    }
    window.scrollTo(0, 0);
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && answered && document.activeElement?.tagName !== 'BUTTON') {
      e.preventDefault();
      void advance();
    }
  };

  return {
    el,
    mounted: () => {
      document.addEventListener('keydown', onKey);
      showQuestion();
    },
    cleanup: () => {
      stopTimer();
      document.removeEventListener('keydown', onKey);
    },
  };
}
