import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';

/** jsdom never decodes images, so naturalWidth is always 0 and layout boxes are all
 *  zero-sized. These tests pin the behaviour that follows from that: the size stamp
 *  must stay a no-op rather than writing a bogus width, while the email pass still
 *  applies the size-independent rules. Real sizes are covered by manual verification
 *  in a browser. */
describe('image sizing', () => {
  let container: HTMLDivElement;
  let editor: FableEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new FableEditor({ target: container });
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
  });

  const setImages = (html: string) => {
    editor.setContent(html);
    return container.querySelector('.earea') as HTMLElement;
  };

  it('stampImageSize writes nothing while the image has not decoded', () => {
    setImages('<p><img src="https://example.com/a.png"></p>');
    const img = container.querySelector('.earea img') as HTMLImageElement;
    (editor as any).stampImageSize(img);
    expect(img.getAttribute('width')).toBeNull();
    expect(img.style.width).toBe('');
  });

  it('stampImageSize never touches an image inside a template media slot', () => {
    setImages('<div class="tpl-media"><img src="https://example.com/a.png"></div>');
    const img = container.querySelector('.earea .tpl-media img') as HTMLImageElement;
    Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    (editor as any).stampImageSize(img);
    expect(img.getAttribute('width')).toBeNull();
    expect(img.style.width).toBe('');
  });

  it('stampImageSize keeps a size the pasted source already carried', () => {
    setImages('<p><img width="417" height="125" src="https://example.com/a.png"></p>');
    const img = container.querySelector('.earea img') as HTMLImageElement;
    Object.defineProperty(img, 'naturalWidth', { value: 1600, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    (editor as any).stampImageSize(img);
    expect(img.getAttribute('width')).toBe('417');
    expect(img.style.width).toBe('');
  });

  it('stampImageSize clamps a wide image to the editor content width', () => {
    setImages('<p><img src="https://example.com/a.png"></p>');
    const img = container.querySelector('.earea img') as HTMLImageElement;
    Object.defineProperty(img, 'naturalWidth', { value: 1600, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    (editor as any).contentWidth = () => 700;
    (editor as any).stampImageSize(img);
    expect(img.getAttribute('width')).toBe('700');
    expect(img.style.width).toBe('700px');
    expect(img.style.height).toBe('auto');
  });

  it('stampImageSize keeps a small image at its natural width', () => {
    setImages('<p><img src="https://example.com/a.png"></p>');
    const img = container.querySelector('.earea img') as HTMLImageElement;
    Object.defineProperty(img, 'naturalWidth', { value: 320, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    (editor as any).contentWidth = () => 700;
    (editor as any).stampImageSize(img);
    expect(img.getAttribute('width')).toBe('320');
  });

  it('getContentForEmail makes images fluid so narrow clients do not clip them', () => {
    setImages('<p><img src="https://example.com/a.png"></p>');
    const out = editor.getContentForEmail();
    expect(out).toContain('max-width:100%');
    expect(out).toContain('height:auto');
  });

  it('getContentForEmail leaves template media images alone', () => {
    setImages('<div class="tpl-media"><img src="https://example.com/a.png"></div>');
    const out = editor.getContentForEmail();
    expect(out).not.toContain('max-width:100%');
  });

  it('getContentForEmail keeps a width the image already has', () => {
    setImages('<p><img width="417" src="https://example.com/a.png"></p>');
    const out = editor.getContentForEmail();
    expect(out).toContain('width="417"');
  });

  it('getContentForEmail still returns the direction wrapper it always did', () => {
    setImages('<p dir="ltr">hello</p>');
    expect(editor.getContentForEmail()).toMatch(/^<div dir="ltr"/);
  });
});

describe('sizing documents saved before the editor recorded image sizes', () => {
  let container: HTMLDivElement;
  let editor: FableEditor;
  let changes: string[];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    changes = [];
    editor = new FableEditor({ target: container, onChange: (html) => changes.push(html) });
    (editor as any).contentWidth = () => 700;
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
  });

  /** jsdom never loads images, so stand in for a decoded bitmap. */
  const decode = (img: HTMLImageElement, naturalWidth: number) => {
    Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
  };

  it('stamps a size-less image loaded through setContent', () => {
    editor.setContent('<p><img src="https://example.com/a.png"></p>');
    const img = container.querySelector('.earea img') as HTMLImageElement;
    decode(img, 1600);
    (editor as any).stampExistingImages();
    expect(img.getAttribute('width')).toBe('700');
    expect(img.style.width).toBe('700px');
  });

  it('leaves a document that already has sizes untouched', () => {
    editor.setContent('<p><img width="417" src="https://example.com/a.png"></p>');
    const img = container.querySelector('.earea img') as HTMLImageElement;
    decode(img, 1600);
    changes.length = 0;
    (editor as any).stampExistingImages();
    expect(img.getAttribute('width')).toBe('417');
    expect(changes).toHaveLength(0); /* nothing stamped -> no spurious change event */
  });

  it('emits a single change for a document with several size-less images', () => {
    editor.setContent(
      '<p><img src="https://example.com/a.png"></p>' +
        '<p><img src="https://example.com/b.png"></p>' +
        '<p><img src="https://example.com/c.png"></p>'
    );
    const imgs = Array.from(container.querySelectorAll('.earea img')) as HTMLImageElement[];
    imgs.forEach((img) => decode(img, 900));
    changes.length = 0;
    (editor as any).stampExistingImages();
    expect(imgs.every((i) => i.getAttribute('width') === '700')).toBe(true);
    expect(changes).toHaveLength(1);
  });

  it('does not emit a change when there are no images at all', () => {
    editor.setContent('<p>just text</p>');
    changes.length = 0;
    (editor as any).stampExistingImages();
    expect(changes).toHaveLength(0);
  });

  it('still emits once when only some of the images need stamping', () => {
    editor.setContent(
      '<p><img width="300" src="https://example.com/a.png"></p>' +
        '<p><img src="https://example.com/b.png"></p>'
    );
    const imgs = Array.from(container.querySelectorAll('.earea img')) as HTMLImageElement[];
    imgs.forEach((img) => decode(img, 900));
    changes.length = 0;
    (editor as any).stampExistingImages();
    expect(imgs[0].getAttribute('width')).toBe('300');
    expect(imgs[1].getAttribute('width')).toBe('700');
    expect(changes).toHaveLength(1);
  });

  it('skips template media slots when migrating', () => {
    editor.setContent('<div class="tpl-media"><img src="https://example.com/a.png"></div>');
    const img = container.querySelector('.earea .tpl-media img') as HTMLImageElement;
    decode(img, 1600);
    changes.length = 0;
    (editor as any).stampExistingImages();
    expect(img.getAttribute('width')).toBeNull();
    expect(changes).toHaveLength(0);
  });

  it('does not hang the single change when an image fails to load', () => {
    editor.setContent(
      '<p><img src="https://example.com/broken.png"></p><p><img src="https://example.com/b.png"></p>'
    );
    const imgs = Array.from(container.querySelectorAll('.earea img')) as HTMLImageElement[];
    decode(imgs[1], 900);
    changes.length = 0;
    (editor as any).stampExistingImages();
    imgs[0].dispatchEvent(new Event('error'));
    expect(imgs[1].getAttribute('width')).toBe('700');
    expect(changes).toHaveLength(1);
  });
});

describe('preview matches the editor', () => {
  let container: HTMLDivElement;
  let editor: FableEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new FableEditor({ target: container });
  });

  afterEach(() => {
    editor.destroy();
    container.remove();
    document.querySelectorAll('.ovl').forEach((el) => el.remove());
  });

  const openPreview = () => {
    (editor as any).previewDlg();
    return document.body.querySelector('.ovl .dlg') as HTMLElement;
  };

  it('sizes the preview box to the editor content column', () => {
    (editor as any).contentWidth = () => 980;
    const box = openPreview().querySelector('.pv-box') as HTMLElement;
    expect(box.style.width).toBe('980px');
  });

  it('falls back to a fixed width when the column cannot be measured', () => {
    (editor as any).contentWidth = () => 0;
    const box = openPreview().querySelector('.pv-box') as HTMLElement;
    expect(box.style.width).toBe('640px');
  });

  it('marks the dialog so it can grow wider than a standard dialog', () => {
    expect(openPreview().classList.contains('dlg-preview')).toBe(true);
  });

  it('never lets the box outgrow the dialog', () => {
    (editor as any).contentWidth = () => 3000;
    const box = openPreview().querySelector('.pv-box') as HTMLElement;
    expect(box.style.maxWidth).toBe('100%');
  });

  it('shows the editor content', () => {
    editor.setContent('<p>preview me</p>');
    const box = openPreview().querySelector('.pv-box') as HTMLElement;
    expect(box.innerHTML).toContain('preview me');
  });
});
