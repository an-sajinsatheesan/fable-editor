import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';

function caretIn(container: HTMLElement, editor: FableEditor): void {
  const ed = container.querySelector('.earea') as HTMLElement;
  const range = document.createRange();
  range.selectNodeContents(ed.firstElementChild || ed);
  range.collapse(true);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  (editor as any).saveSel();
}

function clickMathButton(container: HTMLElement): void {
  const btn = Array.from(container.querySelectorAll('.tbr .tbtn')).find(
    (b) => (b as HTMLElement).title === 'Insert math formula'
  ) as HTMLElement;
  expect(btn).toBeTruthy();
  btn.click();
}

function currentDialog(): HTMLElement {
  const dlg = document.body.querySelector('.dlg') as HTMLElement;
  expect(dlg).toBeInTheDocument();
  return dlg;
}

function saveDialog(dlg: HTMLElement): void {
  (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();
}

describe('math / LaTeX formulas', () => {
  let container: HTMLDivElement;
  let editor: FableEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new FableEditor({ target: container });
    caretIn(container, editor);
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
    document.querySelectorAll('.dlg, .ovl, .imgctx').forEach((el) => el.remove());
  });

  it('opens a dialog with a LaTeX textarea and a live preview', () => {
    clickMathButton(container);
    const dlg = currentDialog();
    const ta = dlg.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta).toBeInTheDocument();
    ta.value = 'x^2';
    ta.dispatchEvent(new Event('input'));
    const preview = dlg.querySelector('.math-preview') as HTMLElement;
    expect(preview.innerHTML).toContain('katex');
  });

  it('inserts an inline formula as a <span class="math-fable"> with data-latex', () => {
    clickMathButton(container);
    const dlg = currentDialog();
    const ta = dlg.querySelector('textarea') as HTMLTextAreaElement;
    ta.value = 'x^2';
    saveDialog(dlg);

    const el = container.querySelector('.earea .math-fable') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe('SPAN');
    expect(el.classList.contains('math-fable-block')).toBe(false);
    expect(el.dataset.latex).toBe('x^2');
    expect(el.getAttribute('contenteditable')).toBe('false');
    expect(el.innerHTML).toContain('katex');
    expect(document.body.querySelector('.dlg')).not.toBeInTheDocument();
  });

  it('derivation preview wraps the source in \\begin{aligned} so & alignment does not error', () => {
    // regression: the live preview must apply the same \begin{aligned}...\end{aligned}
    // wrapping as the save handler, or "&" (needed for step-by-step derivations) throws
    // a KaTeX parse error in the preview even though the saved formula would be fine.
    clickMathButton(container);
    const dlg = currentDialog();
    const ta = dlg.querySelector('textarea') as HTMLTextAreaElement;
    ta.value = 'x &= 1 \\\\ y &= 2';
    const chk = dlg.querySelector('input[type=checkbox]') as HTMLInputElement;
    chk.checked = true;
    chk.dispatchEvent(new Event('change'));
    const preview = dlg.querySelector('.math-preview') as HTMLElement;
    expect(preview.querySelector('.katex-error')).toBeNull();
    expect(preview.querySelector('.katex')).toBeInTheDocument();
  });

  it('inserts a multi-line derivation as a <div class="math-fable math-fable-block">', () => {
    clickMathButton(container);
    const dlg = currentDialog();
    const ta = dlg.querySelector('textarea') as HTMLTextAreaElement;
    ta.value = 'x &= 1 \\\\ y &= 2';
    const chk = dlg.querySelector('input[type=checkbox]') as HTMLInputElement;
    chk.checked = true;
    chk.dispatchEvent(new Event('change'));
    saveDialog(dlg);

    const el = container.querySelector('.earea .math-fable') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe('DIV');
    expect(el.classList.contains('math-fable-block')).toBe(true);
  });

  it('does not insert anything when the LaTeX field is left empty', () => {
    clickMathButton(container);
    const dlg = currentDialog();
    saveDialog(dlg);
    expect(container.querySelector('.earea .math-fable')).toBeNull();
  });

  it('selecting an inserted formula shows an edit/delete toolbar; edit re-opens it prefilled', () => {
    clickMathButton(container);
    let dlg = currentDialog();
    (dlg.querySelector('textarea') as HTMLTextAreaElement).value = 'a+b';
    saveDialog(dlg);

    const el = container.querySelector('.earea .math-fable') as HTMLElement;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    const ctx = document.body.querySelector('.imgctx') as HTMLElement;
    expect(ctx).toBeInTheDocument();
    const buttons = ctx.querySelectorAll('button');
    expect(buttons.length).toBe(2);

    (buttons[0] as HTMLElement).click(); // edit
    dlg = currentDialog();
    const ta = dlg.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta.value).toBe('a+b');
  });

  it('delete button removes the formula and its toolbar', () => {
    clickMathButton(container);
    const dlg = currentDialog();
    (dlg.querySelector('textarea') as HTMLTextAreaElement).value = 'a+b';
    saveDialog(dlg);

    const el = container.querySelector('.earea .math-fable') as HTMLElement;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const ctx = document.body.querySelector('.imgctx') as HTMLElement;
    (ctx.querySelectorAll('button')[1] as HTMLElement).click(); // delete

    expect(container.querySelector('.earea .math-fable')).toBeNull();
    expect(document.body.querySelector('.imgctx')).toBeNull();
  });

  it('renders invalid LaTeX as an inline error instead of throwing', () => {
    clickMathButton(container);
    const dlg = currentDialog();
    const ta = dlg.querySelector('textarea') as HTMLTextAreaElement;
    ta.value = '\\frac{1}';
    expect(() => ta.dispatchEvent(new Event('input'))).not.toThrow();
    const preview = dlg.querySelector('.math-preview') as HTMLElement;
    expect(preview.innerHTML.length).toBeGreaterThan(0);
  });
});
