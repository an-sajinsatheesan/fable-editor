import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';

function setTable(container: HTMLElement, editor: FableEditor): void {
  const ed = container.querySelector('.earea') as HTMLElement;
  ed.innerHTML =
    '<table><tbody>' +
    '<tr><td>A1</td><td>B1</td><td>C1</td></tr>' +
    '<tr><td>A2</td><td>B2</td><td>C2</td></tr>' +
    '<tr><td>A3</td><td>B3</td><td>C3</td></tr>' +
    '</tbody></table>';
}

/** Put the caret inside the cell with the given text. */
function caretInCell(container: HTMLElement, editor: FableEditor, text: string): void {
  const cell = Array.from(container.querySelectorAll('.earea td')).find((c) => c.textContent === text)!;
  const range = document.createRange();
  range.selectNodeContents(cell.firstChild!);
  range.collapse(true);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  (editor as any).saveSel();
}

function rows(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.earea tr')).map((tr) =>
    Array.from(tr.children).map((c) => c.textContent).join(',')
  );
}

let container: HTMLDivElement;
let editor: FableEditor;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  editor = new FableEditor({ target: container });
  setTable(container, editor);
});

afterEach(() => {
  editor.destroy();
  container.remove();
  document.querySelectorAll('.tblctx, .pop').forEach((el) => el.remove());
});

describe('table row/column move', () => {
  it('moves the current row up and down', () => {
    caretInCell(container, editor, 'A2');
    (editor as any).tableMove('rowup');
    expect(rows(container)).toEqual(['A2,B2,C2', 'A1,B1,C1', 'A3,B3,C3']);
    (editor as any).tableMove('rowdown');
    expect(rows(container)).toEqual(['A1,B1,C1', 'A2,B2,C2', 'A3,B3,C3']);
  });

  it('first row cannot move further up; last cannot move down', () => {
    caretInCell(container, editor, 'A1');
    (editor as any).tableMove('rowup');
    expect(rows(container)[0]).toBe('A1,B1,C1');
    caretInCell(container, editor, 'A3');
    (editor as any).tableMove('rowdown');
    expect(rows(container)[2]).toBe('A3,B3,C3');
  });

  it('moves the current column left and right across every row', () => {
    caretInCell(container, editor, 'B1');
    (editor as any).tableMove('colleft');
    expect(rows(container)).toEqual(['B1,A1,C1', 'B2,A2,C2', 'B3,A3,C3']);
    // caret travelled with the moved cell (now first column)
    (editor as any).tableMove('colright');
    expect(rows(container)).toEqual(['A1,B1,C1', 'A2,B2,C2', 'A3,B3,C3']);
  });

  it('first column cannot move left; last cannot move right', () => {
    caretInCell(container, editor, 'A1');
    (editor as any).tableMove('colleft');
    expect(rows(container)[0]).toBe('A1,B1,C1');
    caretInCell(container, editor, 'C1');
    (editor as any).tableMove('colright');
    expect(rows(container)[0]).toBe('A1,B1,C1');
  });

  it('table context toolbar exposes move buttons', () => {
    const table = container.querySelector('.earea table') as HTMLElement;
    table.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const ctx = document.body.querySelector('.tblctx') as HTMLElement;
    expect(ctx).toBeInTheDocument();
    const titles = Array.from(ctx.querySelectorAll('button')).map((b) => b.title);
    expect(titles).toContain('Move row up');
    expect(titles).toContain('Move row down');
    expect(titles).toContain('Move column left');
    expect(titles).toContain('Move column right');
    expect(titles).toContain('Cell background');
  });
});

describe('cell background', () => {
  it('cell background menu applies the picked color to the caret cell only', () => {
    caretInCell(container, editor, 'B2');
    const table = container.querySelector('.earea table') as HTMLElement;
    table.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const ctx = document.body.querySelector('.tblctx') as HTMLElement;
    const fillBtn = Array.from(ctx.querySelectorAll('button')).find((b) => b.title === 'Cell background') as HTMLElement;
    fillBtn.click();
    const pop = document.body.querySelector('.pop') as HTMLElement;
    expect(pop).toBeInTheDocument();
    const swatch = pop.querySelector('.cpal button') as HTMLElement; // first palette color
    const color = swatch.title;
    swatch.click();

    const cell = Array.from(container.querySelectorAll('.earea td')).find((c) => c.textContent === 'B2') as HTMLElement;
    expect(cell.style.backgroundColor).not.toBe('');
    const others = Array.from(container.querySelectorAll('.earea td')).filter((c) => c.textContent !== 'B2');
    others.forEach((c) => expect((c as HTMLElement).style.backgroundColor).toBe(''));
    expect(color).toBeTruthy();
  });

  it('remove color clears the cell background', () => {
    caretInCell(container, editor, 'B2');
    const cell = Array.from(container.querySelectorAll('.earea td')).find((c) => c.textContent === 'B2') as HTMLElement;
    cell.style.backgroundColor = '#ffe08a';
    const table = container.querySelector('.earea table') as HTMLElement;
    table.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const ctx = document.body.querySelector('.tblctx') as HTMLElement;
    (Array.from(ctx.querySelectorAll('button')).find((b) => b.title === 'Cell background') as HTMLElement).click();
    const pop = document.body.querySelector('.pop') as HTMLElement;
    const remove = pop.querySelector('button.cswatch.nocolor') as HTMLElement;
    remove.click();
    expect(cell.style.backgroundColor).toBe('');
  });
});
