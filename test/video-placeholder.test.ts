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

/** The toolbar's video button now opens the insert/edit-video dialog; the drop/upload
    placeholder is still used by template media slots (and pre-existing content), so
    these tests drive the placeholder machinery directly. */
function insertPlaceholder(editor: FableEditor): void {
  (editor as any).insertVideoPlaceholder();
}

describe('video upload placeholder', () => {
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
    insertPlaceholder(editor);
    const ph = container.querySelector('.earea .vid-ph') as HTMLElement;
    expect(ph).toBeInTheDocument();
    expect(ph.getAttribute('contenteditable')).toBe('false');
    expect(ph.classList.contains('active')).toBe(true);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    expect(ctx).toBeInTheDocument();
    expect(ctx.querySelectorAll('button').length).toBe(3);
  });

  it('delete button removes the placeholder', () => {
    insertPlaceholder(editor);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[2] as HTMLElement).click();
    expect(container.querySelector('.earea .vid-ph')).toBeNull();
    expect(document.body.querySelector('.img-ph-ctx')).toBeNull();
  });

  it('Delete/Backspace key removes a selected placeholder', () => {
    insertPlaceholder(editor);
    const ed = container.querySelector('.earea') as HTMLElement;
    ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    expect(container.querySelector('.earea .vid-ph')).toBeNull();
    expect(document.body.querySelector('.img-ph-ctx')).toBeNull();
  });

  it('link button swaps to a URL input and flags invalid URLs', () => {
    insertPlaceholder(editor);
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
    expect(container.querySelector('.earea .vid-ph')).toBeInTheDocument();
  });

  it('replaces the placeholder with a <video> once metadata loads', async () => {
    // jsdom never loads media — make the probe succeed immediately once its
    // src is assigned, mirroring how the image test stubs `Image`.
    const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src')!;
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true,
      get: desc.get,
      set(this: HTMLMediaElement, v: string) {
        desc.set!.call(this, v);
        queueMicrotask(() => this.dispatchEvent(new Event('loadedmetadata')));
      }
    });
    try {
      insertPlaceholder(editor);
      const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
      (ctx.querySelectorAll('button')[1] as HTMLElement).click();
      const inp = ctx.querySelector('input.urlinp') as HTMLInputElement;
      const ok = ctx.querySelector('button.txtbtn') as HTMLButtonElement;
      inp.value = 'https://example.com/clip.mp4';
      ok.click();
      await vi.waitFor(() => {
        expect(container.querySelector('.earea .vid-ph')).not.toBeInTheDocument();
      });
      const vid = container.querySelector('.earea video') as HTMLVideoElement;
      expect(vid).toBeInTheDocument();
      expect(vid.getAttribute('src')).toBe('https://example.com/clip.mp4');
      expect(document.body.querySelector('.img-ph-ctx')).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(HTMLMediaElement.prototype, 'src', desc);
    }
  });

  it('upload button routes the picked file into the placeholder', async () => {
    insertPlaceholder(editor);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[0] as HTMLElement).click(); // upload
    const fileInput = container.querySelector('input[type=file][accept^="video"]') as HTMLInputElement;
    const file = new File([new Uint8Array([0, 0, 0, 1])], 'clip.mp4', { type: 'video/mp4' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(container.querySelector('.earea video')).toBeInTheDocument();
    });
    const vid = container.querySelector('.earea video') as HTMLVideoElement;
    expect(vid.getAttribute('src')).toMatch(/^data:/);
    expect(vid.title).toBe('clip.mp4');
    expect(container.querySelector('.earea .vid-ph')).not.toBeInTheDocument();
  });

  it('keeps the normal insert-at-caret upload path when no placeholder is active', async () => {
    const fileInput = container.querySelector('input[type=file][accept^="video"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'plain.mp4', { type: 'video/mp4' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(container.querySelector('.earea video')).toBeInTheDocument();
    });
    expect(container.querySelector('.earea .vid-ph')).not.toBeInTheDocument();
  });
});

describe('video upload placeholder with videoUploadHandler', () => {
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
      videoUploadHandler: () => Promise.resolve('https://cdn.example.com/uploaded.mp4')
    });
    caretIn(container, editor);

    insertPlaceholder(editor);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[0] as HTMLElement).click(); // upload
    const fileInput = container.querySelector('input[type=file][accept^="video"]') as HTMLInputElement;
    const file = new File([new Uint8Array([0, 0, 0, 1])], 'clip.mp4', { type: 'video/mp4' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));

    const ph = container.querySelector('.earea .vid-ph') as HTMLElement;
    expect(ph.classList.contains('uploading')).toBe(true);

    await vi.waitFor(() => {
      expect(container.querySelector('.earea video')).toBeInTheDocument();
    });
    const vid = container.querySelector('.earea video') as HTMLVideoElement;
    expect(vid.getAttribute('src')).toBe('https://cdn.example.com/uploaded.mp4');
    expect(vid.title).toBe('clip.mp4');
  });

  it('shows an error state and calls onVideoUploadError when the handler rejects', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const onVideoUploadError = vi.fn();
    editor = new FableEditor({
      target: container,
      videoUploadHandler: () => Promise.reject(new Error('boom')),
      onVideoUploadError
    });
    caretIn(container, editor);

    insertPlaceholder(editor);
    const ctx = document.body.querySelector('.img-ph-ctx') as HTMLElement;
    (ctx.querySelectorAll('button')[0] as HTMLElement).click(); // upload
    const fileInput = container.querySelector('input[type=file][accept^="video"]') as HTMLInputElement;
    const file = new File([new Uint8Array([0, 0, 0, 1])], 'clip.mp4', { type: 'video/mp4' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      const ph = container.querySelector('.earea .vid-ph') as HTMLElement;
      expect(ph.classList.contains('upload-error')).toBe(true);
    });
    expect(container.querySelector('.earea video')).not.toBeInTheDocument();
    expect(onVideoUploadError).toHaveBeenCalledTimes(1);
    expect(onVideoUploadError.mock.calls[0][1]).toBeInstanceOf(File);
  });
});
