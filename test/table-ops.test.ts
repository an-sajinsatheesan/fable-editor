import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';

const CELL_STYLE = 'border:1px solid #b9c2cc;width:120px';

function makeTable(rows: number, cols: number): string {
  let html = '<table style="border-collapse:collapse;width:100%;table-layout:fixed"><tbody>';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) html += `<td style="${CELL_STYLE}"><br></td>`;
    html += '</tr>';
  }
  return html + '</tbody></table>';
}

describe('table operations keep cell styling', () => {
  let container: HTMLDivElement;
  let editor: FableEditor;

  /* jsdom never fires selectionchange, so mirror what the browser does:
     set the caret and let the editor capture it via saveSel() */
  const caretIn = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    (editor as any).saveSel();
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new FableEditor({ target: container });
    editor.setContent(makeTable(2, 3));
    caretIn(container.querySelector('.earea td') as HTMLElement);
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
  });

  const op = (name: string) => (editor as any).tableOp(name);

  it('inserted rows copy border and width styles from the source row', () => {
    op('rowbelow');
    const rows = container.querySelectorAll('.earea tr');
    expect(rows.length).toBe(3);
    const newCells = rows[1].querySelectorAll('td');
    expect(newCells.length).toBe(3);
    newCells.forEach((td) => {
      expect((td as HTMLElement).style.border).toBeTruthy();
      expect((td as HTMLElement).style.width).toBe('120px');
    });
  });

  it('inserted columns copy borders but drop the width', () => {
    op('colafter');
    const rows = container.querySelectorAll('.earea tr');
    rows.forEach((tr) => {
      expect(tr.children.length).toBe(4);
      const inserted = tr.children[1] as HTMLElement;
      expect(inserted.style.border).toBeTruthy();
      expect(inserted.style.width).toBe('');
    });
  });

  it('new tables use fixed layout so columns stay evenly sized', () => {
    editor.setContent('<p><br></p>');
    caretIn(container.querySelector('.earea p') as HTMLElement);
    (editor as any).insertTable(4, 6);
    const table = container.querySelector('.earea table') as HTMLElement;
    expect(table).toBeInTheDocument();
    expect(table.style.tableLayout).toBe('fixed');
    expect(container.querySelectorAll('.earea tr').length).toBe(4);
    expect(container.querySelectorAll('.earea tr')[0].children.length).toBe(6);
  });

  it('shows a border marker on the cell holding the caret when the table is selected', () => {
    const table = container.querySelector('.earea table') as HTMLTableElement;
    (editor as any).selectTableForResize(table);
    const mark = document.body.querySelector('.tbl-cellmark') as HTMLElement;
    expect(mark).toBeTruthy();
    expect(mark.style.display).toBe('block');
    (editor as any).clearTableHandles();
    expect(document.body.querySelector('.tbl-cellmark')).toBeNull();
  });

  it('highlights the target row/column while an operation is hovered', () => {
    const table = container.querySelector('.earea table') as HTMLTableElement;
    (editor as any).selectTableForResize(table);
    (editor as any).setOpTarget('row');
    expect(document.body.querySelector('.tbl-opmark')).toBeTruthy();
    (editor as any).setOpTarget('col');
    expect(document.body.querySelector('.tbl-opmark')).toBeTruthy();
    (editor as any).setOpTarget(null);
    expect(document.body.querySelector('.tbl-opmark')).toBeNull();
    (editor as any).clearTableHandles();
  });

  it('delete row / delete column still work', () => {
    op('delrow');
    expect(container.querySelectorAll('.earea tr').length).toBe(1);
    caretIn(container.querySelector('.earea td') as HTMLElement);
    op('delcol');
    expect(container.querySelectorAll('.earea tr')[0].children.length).toBe(2);
  });
});
