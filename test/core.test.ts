import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FableEditor } from '../src/core';

describe('FableEditor core', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('creates the editor shell and editable area', () => {
    const editor = new FableEditor({ target: container });
    const shell = container.querySelector('.tox');
    const ed = container.querySelector('.earea');
    expect(shell).toBeInTheDocument();
    expect(ed).toBeInTheDocument();
    expect(ed).toHaveAttribute('contenteditable', 'true');
    editor.destroy();
  });

  it('renders toolbar and menubar by default', () => {
    const editor = new FableEditor({ target: container });
    expect(container.querySelector('.mnb')).toBeInTheDocument();
    expect(container.querySelector('.tbr')).toBeInTheDocument();
    expect(container.querySelector('.sbar')).toBeInTheDocument();
    editor.destroy();
  });

  it('can hide toolbar, menubar, or statusbar', () => {
    const editor = new FableEditor({
      target: container,
      menubar: false,
      toolbar: false,
      statusbar: false
    });
    expect(container.querySelector('.mnb')).toHaveStyle('display: none');
    expect(container.querySelector('.tbr')).toHaveStyle('display: none');
    expect(container.querySelector('.sbar')).toHaveStyle('display: none');
    editor.destroy();
  });

  it('sets and returns content', () => {
    const editor = new FableEditor({ target: container });
    editor.setContent('<p>Hello <strong>world</strong></p>');
    expect(editor.getContent()).toContain('<p>Hello <strong>world</strong></p>');
    editor.destroy();
  });

  it('uses initial content', () => {
    const editor = new FableEditor({
      target: container,
      initialContent: '<p>Initial</p>'
    });
    expect(editor.getContent()).toContain('<p>Initial</p>');
    editor.destroy();
  });

  it('fires onChange when content changes', async () => {
    const onChange = vi.fn();
    const editor = new FableEditor({ target: container, onChange });
    editor.setContent('<p>Updated</p>');
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('<p>Updated</p>'));
    editor.destroy();
  });

  it('switches language and direction', () => {
    const editor = new FableEditor({ target: container, language: 'en' });
    const shell = container.querySelector('.tox') as HTMLElement;
    expect(shell.dir).toBe('ltr');

    editor.setLanguage('ar');
    expect(shell.dir).toBe('rtl');
    const fileBtn = Array.from(container.querySelectorAll('.mnb button')).find((b) =>
      b.textContent?.includes('ملف')
    );
    expect(fileBtn).toBeTruthy();
    editor.destroy();
  });

  it('inserts content', () => {
    const editor = new FableEditor({ target: container });
    editor.setContent('<p><br></p>');
    editor.insertContent('<em>inserted</em>');
    expect(editor.getContent()).toContain('<em>inserted</em>');
    editor.destroy();
  });

  it('destroys cleanly and removes all editor nodes', () => {
    const editor = new FableEditor({ target: container });
    editor.destroy();
    expect(container.querySelector('.tox')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  it('updates word count in status bar', () => {
    const editor = new FableEditor({ target: container });
    editor.setContent('<p>one two three</p>');
    const words = container.querySelector('.sbar .words') as HTMLElement;
    expect(words.textContent).toMatch(/3\s+words/);
    editor.destroy();
  });

  describe('configurable toolbar/menubar/fonts/content style', () => {
    it('renders the default toolbar/menubar identically to the built-in layout (golden master)', () => {
      const editor = new FableEditor({ target: container });
      expect(container.querySelectorAll('.tbr .tgrp').length).toBe(16);
      expect(container.querySelectorAll('.tbr .tgrp > *').length).toBe(47); // 44 original + emoji + letterspacing + code + codesample - mathformula
      const menuKeys = Array.from(container.querySelectorAll('.mnb button')).map(
        (b) => (b as HTMLElement).dataset.menuKey
      );
      expect(menuKeys).toEqual(['file', 'edit', 'view', 'insert', 'format', 'tools', 'table', 'help']);
      editor.destroy();
    });

    it('renders a custom toolbar string with the given groups and items', () => {
      const editor = new FableEditor({ target: container, toolbar: 'undo redo | bold' });
      const groups = container.querySelectorAll('.tbr .tgrp');
      expect(groups.length).toBe(2);
      expect(groups[0].children.length).toBe(2);
      expect(groups[1].children.length).toBe(1);
      expect((groups[1].children[0] as HTMLElement).dataset.id).toBe('bold');
      editor.destroy();
    });

    it('accepts TinyMCE-style toolbar strings via aliases (styles/image/media/table)', () => {
      const editor = new FableEditor({
        target: container,
        toolbar:
          'undo redo | styles | bold italic underline strikethrough | ' +
          'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image'
      });
      const groups = container.querySelectorAll('.tbr .tgrp');
      expect(groups.length).toBe(6);
      // "styles" renders the blocks dropdown, "image" the quick-image button
      expect((groups[1].children[0] as HTMLElement).dataset.id).toBe('blocksel');
      expect(groups[5].children.length).toBe(2);
      editor.destroy();
    });

    it('skips unknown toolbar tokens and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const editor = new FableEditor({ target: container, toolbar: 'bold bogus italic' });
      const group = container.querySelector('.tbr .tgrp') as HTMLElement;
      expect(group.children.length).toBe(2);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('bogus'));
      warn.mockRestore();
      editor.destroy();
    });

    it('renders a custom menubar subset/order and skips unknown tokens', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const editor = new FableEditor({ target: container, menubar: 'file bogus help' });
      const buttons = Array.from(container.querySelectorAll('.mnb button')) as HTMLElement[];
      expect(buttons.map((b) => b.dataset.menuKey)).toEqual(['file', 'help']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('bogus'));
      warn.mockRestore();
      editor.destroy();
    });

    it('still opens the table grid popup when the menubar is reordered', () => {
      const editor = new FableEditor({ target: container, menubar: 'table insert file' });
      const insertBtn = container.querySelector('.mnb button[data-menu-key="insert"]') as HTMLElement;
      insertBtn.click();
      const tableItem = Array.from(document.querySelectorAll('.mi')).find((el) =>
        el.textContent?.includes('Table')
      ) as HTMLElement | undefined;
      expect(() => tableItem?.click()).not.toThrow();
      editor.destroy();
    });

    it('overrides the font list shown in the font dropdown', () => {
      const editor = new FableEditor({
        target: container,
        fontFamilyFormats: [['MyFont', 'myfont,serif']]
      });
      const fontBtn = container.querySelector('.tsel.w-font') as HTMLElement;
      fontBtn.click();
      const labels = Array.from(document.querySelectorAll('.mi .prev')).map((el) => el.textContent);
      expect(labels).toContain('MyFont');
      expect(labels).not.toContain('Arial');
      editor.destroy();
    });

    it('scopes contentStyle body rules to the editor instance instead of leaking to document.body', () => {
      const editor = new FableEditor({
        target: container,
        contentStyle: '@import url(https://example.com/font.css); body { font-family: serif; font-size: 14px }'
      });
      const styleEl = container.querySelector('.tox > style') as HTMLStyleElement;
      expect(styleEl).toBeInTheDocument();
      expect(styleEl.textContent).not.toMatch(/(?<!\.)\bbody\s*\{/);
      const ed = container.querySelector('.earea') as HTMLElement;
      const scopedClass = Array.from(ed.classList).find((c) => c.startsWith('fable-content-'));
      expect(scopedClass).toBeTruthy();
      expect(styleEl.textContent).toContain('.' + scopedClass);
      expect(styleEl.textContent).toContain('@import url(https://example.com/font.css)');
      editor.destroy();
    });

    it('overrides the accepted image file types', () => {
      const editor = new FableEditor({ target: container, imageFileTypes: ['image/png'] });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toBe('image/png');
      editor.destroy();
    });

    it('parses toolbar strings into groups of tokens', () => {
      const editor = new FableEditor({ target: container });
      const parse = (editor as any).parseToolbarString.bind(editor);
      expect(parse('a b | c')).toEqual([['a', 'b'], ['c']]);
      expect(parse(' a  b |  | c ')).toEqual([['a', 'b'], ['c']]);
      expect(parse('')).toEqual([]);
      editor.destroy();
    });
  });

  describe('getContentForEmail() table borders', () => {
    /* Word writes a cell's borders as three parallel longhands. Mail pipelines
       allowlist CSS property by property, and one that keeps border-color and
       border-width but drops border-style leaves a cell with no border at all,
       because the initial border-style is none. */
    const dropStyleLonghands = (html: string) =>
      html.replace(/style="([^"]*)"/g, (_m, css: string) => {
        const kept = css
          .split(';')
          .map((d) => d.trim())
          .filter((d) => d && !/^(border-style|border-collapse|box-sizing)\s*:/i.test(d));
        return kept.length ? `style="${kept.join(';')}"` : '';
      });

    it('rewrites Word border longhands as per-side shorthands that survive a css allowlist', () => {
      const editor = new FableEditor({ target: container, language: 'ar' });
      editor.setContent(
        '<table dir="rtl" cellspacing="0" style="border-collapse:collapse"><tbody><tr>' +
          '<td style="border-color:windowtext;border-style:solid;border-width:1pt;width:93.5pt">أ</td>' +
          '<td style="border-color:windowtext currentcolor windowtext windowtext;' +
          'border-style:solid none solid solid;border-width:1pt medium 1pt 1pt;width:93.5pt">ب</td>' +
          '</tr></tbody></table>'
      );
      const html = editor.getContentForEmail();
      /* Anchored on the closing quote: the borders are the last word on the cell. */
      expect(html).toContain(';border:1pt solid #000000"');
      expect(html).toContain(
        ';border-top:1pt solid #000000;border-right:none;' +
          'border-bottom:1pt solid #000000;border-left:1pt solid #000000"'
      );
      /* The whole point: nothing here depends on border-style surviving. */
      expect(dropStyleLonghands(html)).toContain('border:1pt solid #000000');
      editor.destroy();
    });

    it('keeps the sides Word deliberately left out and drops zero-width borders', () => {
      const editor = new FableEditor({ target: container, language: 'ar' });
      editor.setContent(
        '<table><tbody><tr>' +
          '<td style="border-color:currentcolor windowtext windowtext;' +
          'border-style:none solid solid;border-width:medium 1pt 1pt">أ</td>' +
          '<td style="border-style:solid;border-width:0px;border-color:#333">ب</td>' +
          '</tr></tbody></table>'
      );
      const html = editor.getContentForEmail();
      expect(html).toContain(
        ';border-top:none;border-right:1pt solid #000000;border-bottom:1pt solid #000000;border-left:1pt solid #000000"'
      );
      expect(html).toContain(';border:none"');
      editor.destroy();
    });

    it('repairs a cell whose border-style was already stripped before it came back', () => {
      const editor = new FableEditor({ target: container, language: 'ar' });
      editor.setContent('<table><tbody><tr><td style="border-color:windowtext;border-width:1pt">أ</td></tr></tbody></table>');
      expect(editor.getContentForEmail()).toContain(';border:1pt solid #000000"');
      editor.destroy();
    });

    it('leaves cells with no border declarations and editor-made tables alone', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      editor.setContent(
        '<table style="border-collapse:collapse"><tbody><tr>' +
          '<td style="padding:4px">a</td>' +
          '<td style="border:1px solid #b9c2cc">b</td>' +
          '</tr></tbody></table>'
      );
      const html = editor.getContentForEmail();
      expect(html).toContain('<td style="padding:4px;');
      expect(html).not.toMatch(/padding:4px[^"]*border/);
      expect(html).toContain(';border:1px solid #b9c2cc"');
      editor.destroy();
    });

    it('pins border-collapse and cellspacing so a stripped border-collapse cannot open gaps', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      editor.setContent('<table><tbody><tr><td style="border:1px solid #000">a</td></tr></tbody></table>');
      const html = editor.getContentForEmail();
      expect(html).toContain('cellspacing="0"');
      expect(html).toContain('border-collapse:collapse');
      editor.destroy();
    });

    it('leaves a cell alone when a border value is a css-wide keyword it cannot inline', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      editor.setContent('<table><tbody><tr><td style="border-color:inherit;border-style:solid;border-width:0px">a</td></tr></tbody></table>');
      expect(editor.getContentForEmail()).toContain(
        '<td style="border-color:inherit;border-style:solid;border-width:0px;'
      );
      editor.destroy();
    });

    it('does not touch table borders in getContent()', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      const src = '<table><tbody><tr><td style="border-color:windowtext;border-style:solid;border-width:1pt">a</td></tr></tbody></table>';
      editor.setContent(src);
      expect(editor.getContent()).toBe(src);
      editor.destroy();
    });
  });

  describe('getContentForEmail()', () => {
    it('detects rtl from content when the editor language is en and no dir attribute is present', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      editor.setContent('<p>مرحبا بكم في هذا التقرير الشهري</p>');
      const html = editor.getContentForEmail();
      expect(html).toMatch(/^<div dir="rtl" style="direction:rtl;text-align:right">/);
      expect(html).toContain('<p dir="rtl" style="direction:rtl;text-align:right">');
      editor.destroy();
    });

    it('detects ltr from content when the editor language is ar and no dir attribute is present', () => {
      const editor = new FableEditor({ target: container, language: 'ar' });
      editor.setContent('<p>Hello team, please review the attached report.</p>');
      const html = editor.getContentForEmail();
      expect(html).toMatch(/^<div dir="ltr" style="direction:ltr;text-align:left">/);
      expect(html).toContain('<p dir="ltr" style="direction:ltr;text-align:left">');
      editor.destroy();
    });

    it('resolves each paragraph independently in mixed-direction content with no dir attributes', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      editor.setContent('<p>مرحبا بكم</p><p>Hello in English</p>');
      const html = editor.getContentForEmail();
      expect(html).toContain('<p dir="rtl" style="direction:rtl;text-align:right">مرحبا بكم</p>');
      expect(html).toContain('<p dir="ltr" style="direction:ltr;text-align:left">Hello in English</p>');
      editor.destroy();
    });

    it('keeps existing explicit dir/text-align untouched (regression: Word-style pasted content)', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      editor.setContent('<p dir="rtl" style="direction:rtl;text-align:center">مرحبا</p>');
      const html = editor.getContentForEmail();
      expect(html).toContain('<p dir="rtl" style="direction:rtl;text-align:center">مرحبا</p>');
      editor.destroy();
    });

    it('falls back to the editor\'s own direction for content with no strong-direction character', () => {
      const editor = new FableEditor({ target: container, language: 'ar' });
      editor.setContent('<p>12345 - 67890</p>');
      const html = editor.getContentForEmail();
      expect(html).toMatch(/^<div dir="rtl" style="direction:rtl;text-align:right">/);
      editor.destroy();
    });

    it('does not change getContent()\'s output', () => {
      const editor = new FableEditor({ target: container, language: 'en' });
      editor.setContent('<p>مرحبا بكم</p>');
      expect(editor.getContent()).toBe('<p>مرحبا بكم</p>');
      editor.destroy();
    });
  });
});
