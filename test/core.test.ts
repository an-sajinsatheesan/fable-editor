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
      expect(container.querySelectorAll('.tbr .tgrp > *').length).toBe(41);
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
});
