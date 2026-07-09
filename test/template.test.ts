import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';

/** Put the caret inside the editor's first block so insertHTML lands there.
    jsdom never fires selectionchange, so also let the editor capture the
    range via saveSel(), exactly as a browser would. */
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

function openTemplateMenu(container: HTMLElement): HTMLElement {
  const btn = Array.from(container.querySelectorAll('.tbr .tbtn')).find(
    (b) => (b as HTMLElement).title === 'Templates'
  ) as HTMLElement;
  expect(btn).toBeTruthy();
  btn.click();
  const pick = document.body.querySelector('.pop .tplpick') as HTMLElement;
  expect(pick).toBeTruthy();
  return pick;
}

function insertTemplate(container: HTMLElement, index: number): HTMLElement {
  const pick = openTemplateMenu(container);
  (pick.querySelectorAll('.tpltile')[index] as HTMLElement).click();
  return container.querySelector('.earea .tpl') as HTMLElement;
}

function mousedownIn(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
}

describe('template blocks', () => {
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
    document.querySelectorAll('.tplctx, .img-ph-ctx').forEach((el) => el.remove());
  });

  it('template menu shows a div-based preview tile per layout', () => {
    const pick = openTemplateMenu(container);
    const tiles = pick.querySelectorAll('.tpltile');
    expect(tiles.length).toBe(4);
    tiles.forEach((tile) => {
      expect(tile.querySelector('.pv')).toBeTruthy();
      expect(tile.querySelector('.pv-img')).toBeTruthy();
    });
  });

  it('clicking a tile inserts a template block with media slot and editable text', () => {
    const tpl = insertTemplate(container, 0);
    expect(tpl).toBeTruthy();
    expect(tpl.classList.contains('tpl-img-left')).toBe(true);
    const media = tpl.querySelector(':scope > .tpl-media') as HTMLElement;
    expect(media).toBeTruthy();
    expect(media.getAttribute('contenteditable')).toBe('false');
    expect(media.querySelector('.img-ph')).toBeTruthy();
    const text = tpl.querySelector(':scope > .tpl-text') as HTMLElement;
    expect(text).toBeTruthy();
    expect(text.querySelector('h2')).toBeTruthy();
    expect(text.querySelector('p')).toBeTruthy();
  });

  it('multiple blocks can be inserted one after another', () => {
    insertTemplate(container, 0);
    /* jsdom's insertHTML shim doesn't advance the caret like a browser does —
       park it in the trailing paragraph before the next insert */
    const ed = container.querySelector('.earea') as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(ed.lastElementChild as HTMLElement);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    (editor as any).saveSel();
    insertTemplate(container, 2);
    expect(container.querySelectorAll('.earea .tpl').length).toBe(2);
  });

  it('clicking a block shows its ctx toolbar with 4 layout buttons + delete', () => {
    const tpl = insertTemplate(container, 0);
    mousedownIn(tpl.querySelector('h2') as HTMLElement);
    expect(tpl.classList.contains('tpl-selected')).toBe(true);
    const ctx = document.body.querySelector('.tplctx') as HTMLElement;
    expect(ctx).toBeTruthy();
    const btns = ctx.querySelectorAll('button');
    expect(btns.length).toBe(5);
    expect(btns[0].classList.contains('on')).toBe(true); // img-left active
  });

  it('layout buttons switch the block class and keep DOM order = visual order', () => {
    const tpl = insertTemplate(container, 0);
    mousedownIn(tpl.querySelector('h2') as HTMLElement);
    const ctx = document.body.querySelector('.tplctx') as HTMLElement;
    (ctx.querySelectorAll('button')[3] as HTMLElement).click(); // img-center
    expect(tpl.classList.contains('tpl-img-center')).toBe(true);
    expect(tpl.classList.contains('tpl-img-left')).toBe(false);
    // img-center puts the text first in the DOM
    expect((tpl.firstElementChild as HTMLElement).classList.contains('tpl-text')).toBe(true);
    const ctx2 = document.body.querySelector('.tplctx') as HTMLElement;
    (ctx2.querySelectorAll('button')[1] as HTMLElement).click(); // img-right
    expect(tpl.classList.contains('tpl-img-right')).toBe(true);
    expect((tpl.firstElementChild as HTMLElement).classList.contains('tpl-media')).toBe(true);
  });

  it('delete button removes the whole block and its toolbar', () => {
    const tpl = insertTemplate(container, 0);
    mousedownIn(tpl.querySelector('h2') as HTMLElement);
    const ctx = document.body.querySelector('.tplctx') as HTMLElement;
    (ctx.querySelectorAll('button')[4] as HTMLElement).click();
    expect(container.querySelector('.earea .tpl')).toBeNull();
    expect(document.body.querySelector('.tplctx')).toBeNull();
  });

  it('deleting the placeholder inside a block removes the media slot only', () => {
    const tpl = insertTemplate(container, 0);
    const ph = tpl.querySelector('.img-ph') as HTMLElement;
    mousedownIn(ph);
    const phCtx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    // slot buttons inside a template: upload, link, switch-to-video, trash
    (phCtx.querySelectorAll('button')[3] as HTMLElement).click(); // trash
    expect(tpl.querySelector('.tpl-media')).toBeNull();
    expect(container.querySelector('.earea .tpl')).toBeTruthy(); // text block stays
  });

  it('mousedown outside the block clears selection and toolbar', () => {
    const tpl = insertTemplate(container, 0);
    mousedownIn(tpl.querySelector('h2') as HTMLElement);
    expect(document.body.querySelector('.tplctx')).toBeTruthy();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(document.body.querySelector('.tplctx')).toBeNull();
    expect(tpl.classList.contains('tpl-selected')).toBe(false);
  });
});
