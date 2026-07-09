import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';
import { CHAR_CATEGORIES, EMOJI_CATEGORIES } from '../src/core/config';

/** Put the caret inside the editor's first block so insertHTML lands there. */
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

/** jsdom cannot construct a ClipboardEvent with data — fake the shape handlePaste reads. */
function paste(container: HTMLElement, text: string, html = ''): void {
  const ed = container.querySelector('.earea') as HTMLElement;
  const e = new Event('paste', { bubbles: true, cancelable: true }) as any;
  e.clipboardData = {
    getData: (type: string) => (type === 'text/plain' ? text : type === 'text/html' ? html : ''),
    items: []
  };
  ed.dispatchEvent(e);
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

describe('math paste', () => {
  it('pasting $$…$$ inserts a block formula', () => {
    paste(container, '$$x = \\frac{1}{2}$$');
    const el = container.querySelector('.earea .math-fable') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe('DIV');
    expect(el.classList.contains('math-fable-block')).toBe(true);
    expect(el.dataset.latex).toBe('x = \\frac{1}{2}');
    expect(el.innerHTML).toContain('katex');
  });

  it('pasting a multi-line derivation joins the steps with \\\\ row breaks', () => {
    paste(container, '$$2x + 3 = 11\n2x = 8\nx = 4$$');
    const el = container.querySelector('.earea .math-fable-block') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.dataset.latex).toBe('2x + 3 = 11 \\\\ 2x = 8 \\\\ x = 4');
  });

  it('pasting \\(…\\) or LaTeX-ish $…$ inserts an inline formula on the same line', () => {
    paste(container, '\\(a^2 + b^2 = c^2\\)');
    let el = container.querySelector('.earea .math-fable') as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    el.remove();
    caretIn(container, editor);
    paste(container, '$e^{i\\pi} = -1$');
    el = container.querySelector('.earea .math-fable') as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el.dataset.latex).toBe('e^{i\\pi} = -1');
  });

  it('pasting a \\begin environment inserts a block formula', () => {
    paste(container, '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}');
    const el = container.querySelector('.earea .math-fable-block') as HTMLElement;
    expect(el).toBeInTheDocument();
  });

  it('does NOT convert ordinary text with dollar amounts', () => {
    paste(container, '$5 and $10');
    expect(container.querySelector('.earea .math-fable')).toBeNull();
    expect(container.querySelector('.earea')!.textContent).toContain('$5 and $10');
  });

  it('does not touch HTML pastes (normal paste pipeline unchanged)', () => {
    paste(container, '$$x^2$$', '<p>$$x^2$$</p>');
    expect(container.querySelector('.earea .math-fable')).toBeNull();
  });
});

describe('math typing', () => {
  function typeDollarAfter(text: string): void {
    const ed = container.querySelector('.earea') as HTMLElement;
    const p = ed.firstElementChild as HTMLElement;
    p.textContent = text;
    const node = p.firstChild as Text;
    const range = document.createRange();
    range.setStart(node, node.length);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    ed.dispatchEvent(new KeyboardEvent('keydown', { key: '$', bubbles: true, cancelable: true }));
  }

  it('typing the closing $ of "$x^2$" converts the run into an inline formula', () => {
    typeDollarAfter('the square $x^2');
    const el = container.querySelector('.earea .math-fable') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.dataset.latex).toBe('x^2');
    expect(container.querySelector('.earea')!.textContent).not.toContain('$x^2');
  });

  it('leaves plain-text dollars alone ("$5 and 3" + $)', () => {
    typeDollarAfter('$5 and 3');
    expect(container.querySelector('.earea .math-fable')).toBeNull();
  });
});

describe('video dialog and embeds', () => {
  it('the toolbar video button opens a dialog with General / Embed / Advanced tabs', () => {
    toolbarButton(container, 'Insert video').click();
    const dlg = document.body.querySelector('.dlg') as HTMLElement;
    expect(dlg).toBeInTheDocument();
    const tabs = dlg.querySelectorAll('.dtabs button');
    expect(tabs.length).toBe(3);
    expect(tabs[0].classList.contains('on')).toBe(true);
    // general: source + width + height; advanced: alt source + poster
    expect(dlg.querySelectorAll('.dtabpanel input[type=url]').length).toBe(3);
    expect(dlg.querySelectorAll('.dtabpanel input[type=number]').length).toBe(2);
    expect(dlg.querySelector('.dtabpanel textarea')).toBeInTheDocument();
  });

  it('saving a YouTube URL from the General tab inserts an iframe player', () => {
    toolbarButton(container, 'Insert video').click();
    const dlg = document.body.querySelector('.dlg') as HTMLElement;
    const src = dlg.querySelector('.dtabpanel input[type=url]') as HTMLInputElement;
    src.value = 'https://www.youtube.com/watch?v=VKyxrZkPrTQ';
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click(); // save
    const frame = container.querySelector('.earea .video-embed iframe') as HTMLIFrameElement;
    expect(frame).toBeInTheDocument();
    expect(frame.getAttribute('src')).toBe('https://www.youtube.com/embed/VKyxrZkPrTQ');
    expect((frame.parentElement as HTMLElement).getAttribute('contenteditable')).toBe('false');
  });

  it('saving pasted embed code from the Embed tab inserts it wrapped non-editable', () => {
    toolbarButton(container, 'Insert video').click();
    const dlg = document.body.querySelector('.dlg') as HTMLElement;
    const ta = dlg.querySelector('.dtabpanel textarea') as HTMLTextAreaElement;
    ta.value = '<iframe src="https://player.example.com/x"></iframe>';
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();
    const emb = container.querySelector('.earea .video-embed') as HTMLElement;
    expect(emb).toBeInTheDocument();
    expect(emb.querySelector('iframe')!.getAttribute('src')).toBe('https://player.example.com/x');
  });

  it('saving a direct file URL builds a <video> with poster and alternative source', () => {
    toolbarButton(container, 'Insert video').click();
    const dlg = document.body.querySelector('.dlg') as HTMLElement;
    const urls = dlg.querySelectorAll('.dtabpanel input[type=url]');
    (urls[0] as HTMLInputElement).value = 'https://cdn.example.com/a.mp4';
    (urls[1] as HTMLInputElement).value = 'https://cdn.example.com/a.webm';
    (urls[2] as HTMLInputElement).value = 'https://cdn.example.com/poster.jpg';
    (dlg.querySelectorAll('footer button')[1] as HTMLElement).click();
    const vid = container.querySelector('.earea video') as HTMLVideoElement;
    expect(vid).toBeInTheDocument();
    expect(vid.getAttribute('poster')).toBe('https://cdn.example.com/poster.jpg');
    const sources = vid.querySelectorAll('source');
    expect(sources.length).toBe(2);
    expect(sources[0].getAttribute('src')).toBe('https://cdn.example.com/a.mp4');
  });

  it('pasting a bare YouTube URL embeds the player', () => {
    paste(container, 'https://youtu.be/VKyxrZkPrTQ');
    const frame = container.querySelector('.earea .video-embed iframe') as HTMLIFrameElement;
    expect(frame).toBeInTheDocument();
    expect(frame.getAttribute('src')).toBe('https://www.youtube.com/embed/VKyxrZkPrTQ');
  });

  it('pasting a URL inside other text stays plain text', () => {
    paste(container, 'watch this https://youtu.be/VKyxrZkPrTQ later');
    expect(container.querySelector('.earea .video-embed')).toBeNull();
  });
});

describe('character map and emoji pickers', () => {
  it('special characters dialog shows category tabs left and the glyph grid right', () => {
    toolbarButton(container, 'Special character…').click();
    const dlg = document.body.querySelector('.dlg') as HTMLElement;
    const tabs = dlg.querySelectorAll('.chmap .chtabs button');
    expect(tabs.length).toBe(CHAR_CATEGORIES.length);
    expect(tabs[0].classList.contains('on')).toBe(true);
    expect(dlg.querySelectorAll('.chmap .chgrid button').length).toBe(CHAR_CATEGORIES[0].chars.length);
    // switching category re-renders the grid
    (tabs[2] as HTMLElement).click();
    expect(tabs[2].classList.contains('on')).toBe(true);
    expect(dlg.querySelectorAll('.chmap .chgrid button').length).toBe(CHAR_CATEGORIES[2].chars.length);
  });

  it('emoji dialog opens from its own toolbar button with emoji categories', () => {
    toolbarButton(container, 'Emojis…').click();
    const dlg = document.body.querySelector('.dlg') as HTMLElement;
    const tabs = dlg.querySelectorAll('.chmap .chtabs button');
    expect(tabs.length).toBe(EMOJI_CATEGORIES.length);
    const grid = dlg.querySelector('.chmap .chgrid') as HTMLElement;
    expect(grid.classList.contains('emgrid')).toBe(true);
    expect(grid.querySelectorAll('button').length).toBe(EMOJI_CATEGORIES[0].chars.length);
    // picking an emoji closes the dialog
    (grid.querySelector('button') as HTMLElement).click();
    expect(document.body.querySelector('.dlg')).toBeNull();
  });
});
