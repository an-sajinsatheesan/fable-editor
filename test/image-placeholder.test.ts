import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

function clickImageButton(container: HTMLElement): void {
  const btn = Array.from(container.querySelectorAll('.tbr .tbtn')).find(
    (b) => (b as HTMLElement).title === 'Insert image'
  ) as HTMLElement;
  expect(btn).toBeTruthy();
  btn.click();
}

describe('image upload placeholder', () => {
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
    document.querySelectorAll('.img-ph-ctx').forEach((el) => el.remove());
    vi.unstubAllGlobals();
  });

  it('inserts a placeholder box and shows upload/link buttons', () => {
    clickImageButton(container);
    const ph = container.querySelector('.earea .img-ph') as HTMLElement;
    expect(ph).toBeInTheDocument();
    expect(ph.getAttribute('contenteditable')).toBe('false');
    expect(ph.classList.contains('active')).toBe(true);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    expect(ctx).toBeInTheDocument();
    expect(ctx.querySelectorAll('button').length).toBe(3);
  });

  it('delete button removes the placeholder', () => {
    clickImageButton(container);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[2] as HTMLElement).click();
    expect(container.querySelector('.earea .img-ph')).toBeNull();
    expect(document.body.querySelector('.img-ph-ctx')).toBeNull();
  });

  it('Delete/Backspace key removes a selected placeholder', () => {
    clickImageButton(container);
    const ed = container.querySelector('.earea') as HTMLElement;
    ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    expect(container.querySelector('.earea .img-ph')).toBeNull();
    expect(document.body.querySelector('.img-ph-ctx')).toBeNull();
  });

  it('link button swaps to a URL input and flags invalid URLs', () => {
    clickImageButton(container);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[1] as HTMLElement).click();
    const inp = ctx.querySelector('input.urlinp') as HTMLInputElement;
    const ok = ctx.querySelector('button.txtbtn') as HTMLButtonElement;
    expect(inp).toBeInTheDocument();
    expect(ok).toBeInTheDocument();
    inp.value = 'not-a-url';
    ok.click();
    expect(inp.classList.contains('err')).toBe(true);
    // placeholder untouched
    expect(container.querySelector('.earea .img-ph')).toBeInTheDocument();
  });

  it('replaces the placeholder with an <img> once the URL loads', async () => {
    // jsdom never loads images — make the probe succeed immediately
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_v: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
    );
    clickImageButton(container);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[1] as HTMLElement).click();
    const inp = ctx.querySelector('input.urlinp') as HTMLInputElement;
    const ok = ctx.querySelector('button.txtbtn') as HTMLButtonElement;
    inp.value = 'https://example.com/pic.png';
    ok.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('.earea .img-ph')).not.toBeInTheDocument();
    const img = container.querySelector('.earea img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://example.com/pic.png');
    expect(document.body.querySelector('.img-ph-ctx')).not.toBeInTheDocument();
  });

  it('upload button routes the picked file into the placeholder', async () => {
    clickImageButton(container);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[0] as HTMLElement).click(); // upload
    const fileInput = container.querySelector('input[type=file][accept^="image"]') as HTMLInputElement;
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'shot.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(container.querySelector('.earea img')).toBeInTheDocument();
    });
    const img = container.querySelector('.earea img') as HTMLImageElement;
    expect(img.getAttribute('src')).toMatch(/^data:/);
    expect(img.title).toBe('shot.png');
    expect(container.querySelector('.earea .img-ph')).not.toBeInTheDocument();
  });

  it('keeps the normal insert-at-caret upload path when no placeholder is active', async () => {
    const fileInput = container.querySelector('input[type=file][accept^="image"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'plain.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(container.querySelector('.earea img')).toBeInTheDocument();
    });
    expect(container.querySelector('.earea .img-ph')).not.toBeInTheDocument();
  });
});

describe('image upload placeholder with imageUploadHandler', () => {
  let container: HTMLDivElement;
  let editor: FableEditor;

  afterEach(() => {
    editor.destroy();
    container.remove();
    document.querySelectorAll('.img-ph-ctx').forEach((el) => el.remove());
  });

  it('routes the file through the handler and inserts the resolved URL', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new FableEditor({
      target: container,
      imageUploadHandler: () => Promise.resolve('https://cdn.example.com/uploaded.png')
    });
    caretIn(container, editor);

    clickImageButton(container);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[0] as HTMLElement).click(); // upload
    const fileInput = container.querySelector('input[type=file][accept^="image"]') as HTMLInputElement;
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'shot.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));

    const ph = container.querySelector('.earea .img-ph') as HTMLElement;
    expect(ph.classList.contains('uploading')).toBe(true);

    await vi.waitFor(() => {
      expect(container.querySelector('.earea img')).toBeInTheDocument();
    });
    const img = container.querySelector('.earea img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/uploaded.png');
    expect(img.title).toBe('shot.png');
  });

  it('shows an error state and calls onImageUploadError when the handler rejects', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const onImageUploadError = vi.fn();
    editor = new FableEditor({
      target: container,
      imageUploadHandler: () => Promise.reject(new Error('boom')),
      onImageUploadError
    });
    caretIn(container, editor);

    clickImageButton(container);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[0] as HTMLElement).click(); // upload
    const fileInput = container.querySelector('input[type=file][accept^="image"]') as HTMLInputElement;
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'shot.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      const ph = container.querySelector('.earea .img-ph') as HTMLElement;
      expect(ph.classList.contains('upload-error')).toBe(true);
    });
    expect(container.querySelector('.earea img')).not.toBeInTheDocument();
    expect(onImageUploadError).toHaveBeenCalledTimes(1);
    expect(onImageUploadError.mock.calls[0][1]).toBeInstanceOf(File);
  });
});
