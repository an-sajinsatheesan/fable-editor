import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';
import { CODE_LANGS } from '../src/core/config';

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

function toolbarButton(container: HTMLElement, title: string): HTMLElement {
  const btn = Array.from(container.querySelectorAll('.tbr .tbtn')).find(
    (b) => (b as HTMLElement).title === title
  ) as HTMLElement;
  expect(btn).toBeTruthy();
  return btn;
}

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

describe('inline code', () => {
  function selectText(text: string): void {
    const ed = container.querySelector('.earea') as HTMLElement;
    const p = ed.firstElementChild as HTMLElement;
    p.textContent = text;
    const range = document.createRange();
    range.selectNodeContents(p.firstChild!);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    (editor as any).saveSel();
  }

  it('toolbar button wraps the selection in <code> and unwraps on second click', () => {
    selectText('npm install');
    toolbarButton(container, 'Inline code').click();
    const code = container.querySelector('.earea code') as HTMLElement;
    expect(code).toBeInTheDocument();
    expect(code.textContent).toBe('npm install');

    toolbarButton(container, 'Inline code').click();
    expect(container.querySelector('.earea code')).toBeNull();
    expect(container.querySelector('.earea')!.textContent).toContain('npm install');
  });

  it('does nothing for a collapsed selection outside code', () => {
    toolbarButton(container, 'Inline code').click();
    expect(container.querySelector('.earea code')).toBeNull();
  });

  it('typing the closing backtick of `cmd` converts the run to <code>', () => {
    const ed = container.querySelector('.earea') as HTMLElement;
    const p = ed.firstElementChild as HTMLElement;
    p.textContent = 'run `npm test';
    const node = p.firstChild as Text;
    const range = document.createRange();
    range.setStart(node, node.length);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    ed.dispatchEvent(new KeyboardEvent('keydown', { key: '`', bubbles: true, cancelable: true }));

    const code = container.querySelector('.earea code') as HTMLElement;
    expect(code).toBeInTheDocument();
    expect(code.textContent).toBe('npm test');
    expect(ed.textContent).not.toContain('`');
  });

  it('a lone backtick stays literal', () => {
    const ed = container.querySelector('.earea') as HTMLElement;
    const p = ed.firstElementChild as HTMLElement;
    p.textContent = 'plain text';
    const node = p.firstChild as Text;
    const range = document.createRange();
    range.setStart(node, node.length);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    const e = new KeyboardEvent('keydown', { key: '`', bubbles: true, cancelable: true });
    ed.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(container.querySelector('.earea code')).toBeNull();
  });
});

describe('code sample blocks', () => {
  function openDialog(): HTMLElement {
    toolbarButton(container, 'Code sample…').click();
    const dlg = document.body.querySelector('.dlg') as HTMLElement;
    expect(dlg).toBeInTheDocument();
    return dlg;
  }

  function pickLang(dlg: HTMLElement, label: string): void {
    (dlg.querySelector('.dsel-btn') as HTMLElement).click(); // open the dropdown
    const opt = Array.from(dlg.querySelectorAll('.dsel-list button')).find(
      (b) => b.textContent === label
    ) as HTMLElement;
    expect(opt).toBeTruthy();
    opt.click();
  }

  it('dialog offers a custom language dropdown and a monospace textarea', () => {
    const dlg = openDialog();
    expect(dlg.querySelectorAll('.dsel-list button').length).toBe(CODE_LANGS.length);
    expect((dlg.querySelector('.dsel-btn .lbl') as HTMLElement).textContent).toBe('Plain text');
    expect(dlg.querySelector('textarea.code-input')).toBeInTheDocument();
    // opening + picking updates the field label and closes the list
    pickLang(dlg, 'Go');
    expect((dlg.querySelector('.dsel-btn .lbl') as HTMLElement).textContent).toBe('Go');
    expect((dlg.querySelector('.dsel') as HTMLElement).classList.contains('open')).toBe(false);
  });

  it('saving inserts a non-editable <pre class="code-block"> with escaped content', () => {
    const dlg = openDialog();
    pickLang(dlg, 'HTML/XML');
    (dlg.querySelector('textarea') as HTMLTextAreaElement).value = '<div>&"hello"</div>';
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();

    const pre = container.querySelector('.earea pre.code-block') as HTMLElement;
    expect(pre).toBeInTheDocument();
    expect(pre.getAttribute('contenteditable')).toBe('false');
    expect(pre.dataset.lang).toBe('html');
    expect(pre.getAttribute('data-lang-label')).toBe('HTML/XML');
    const code = pre.querySelector('code') as HTMLElement;
    expect(code.textContent).toBe('<div>&"hello"</div>');
    expect(code.querySelector('div')).toBeNull(); // markup was escaped, not parsed
  });

  it('empty code inserts nothing', () => {
    const dlg = openDialog();
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();
    expect(container.querySelector('.earea pre.code-block')).toBeNull();
  });

  it('clicking a block shows edit/copy/delete; edit re-opens prefilled', () => {
    let dlg = openDialog();
    (dlg.querySelector('textarea') as HTMLTextAreaElement).value = 'print(42)';
    pickLang(dlg, 'Python');
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();

    const pre = container.querySelector('.earea pre.code-block') as HTMLElement;
    pre.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const ctx = document.body.querySelector('.imgctx') as HTMLElement;
    expect(ctx).toBeInTheDocument();
    expect(ctx.querySelectorAll('button').length).toBe(3);

    (ctx.querySelectorAll('button')[0] as HTMLElement).click(); // edit
    dlg = document.body.querySelector('.dlg') as HTMLElement;
    expect((dlg.querySelector('textarea') as HTMLTextAreaElement).value).toBe('print(42)');
    expect((dlg.querySelector('.dsel-btn .lbl') as HTMLElement).textContent).toBe('Python');

    // change and save updates the same block
    (dlg.querySelector('textarea') as HTMLTextAreaElement).value = 'print(43)';
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();
    expect(container.querySelectorAll('.earea pre.code-block').length).toBe(1);
    expect(container.querySelector('.earea pre.code-block code')!.textContent).toBe('print(43)');
  });

  it('delete button removes the block and its toolbar', () => {
    const dlg = openDialog();
    (dlg.querySelector('textarea') as HTMLTextAreaElement).value = 'x';
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();

    const pre = container.querySelector('.earea pre.code-block') as HTMLElement;
    pre.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const ctx = document.body.querySelector('.imgctx') as HTMLElement;
    (ctx.querySelectorAll('button')[2] as HTMLElement).click();

    expect(container.querySelector('.earea pre.code-block')).toBeNull();
    expect(document.body.querySelector('.imgctx')).toBeNull();
  });
});
