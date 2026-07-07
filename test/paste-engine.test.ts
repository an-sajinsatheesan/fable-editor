import { describe, it, expect } from 'vitest';
import { cleanPastedHTML } from '../src/core/paste-engine';

const wordWrap = (body: string) =>
  `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta name=Generator content="Microsoft Word 15"></head><body>${body}</body></html>`;

const styleOf = (html: string, selector: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector(selector)?.getAttribute('style') || '';
};

describe('cleanPastedHTML — Word table alignment', () => {
  it('centers a table wrapped in <div align=center>', () => {
    const out = cleanPastedHTML(
      wordWrap(
        `<div align=center><table class=MsoTableGridLight border=1 width=342><tr><td><p class=MsoNormal>cell</p></td></tr></table></div>`
      ),
      'ltr'
    );
    const style = styleOf(out, 'table');
    expect(style).toContain('margin-left:auto');
    expect(style).toContain('margin-right:auto');
  });

  it('centers an RTL Word table wrapped in <div align=center> instead of pushing it to the edge', () => {
    const out = cleanPastedHTML(
      wordWrap(
        `<div align=center><table class=MsoTableGridLight border=1><tr><td><p class=MsoNormal dir=RTL style='text-align:center;direction:rtl'>الترتيب</p></td></tr></table></div>`
      ),
      'ltr'
    );
    const style = styleOf(out, 'table');
    expect(style).toContain('margin-left:auto');
    expect(style).toContain('margin-right:auto');
  });

  it('right-aligns a table wrapped in <div align=right>', () => {
    const out = cleanPastedHTML(
      wordWrap(`<div align=right><table><tr><td>cell</td></tr></table></div>`),
      'ltr'
    );
    const style = styleOf(out, 'table');
    expect(style).toContain('margin-left:auto');
    expect(style).not.toContain('margin-right:auto');
  });

  it('leaves an unaligned RTL Word table in the default position (no auto margins)', () => {
    // Word letters often put RTL content in a plain unaligned MsoTableGrid;
    // such tables should stay at the default position, not get auto-centered.
    const out = cleanPastedHTML(
      wordWrap(
        `<table class=MsoTableGrid border=1><tr><td><p class=MsoNormal dir=RTL style='text-align:right;direction:rtl'>تحية طيبة وبعد</p></td></tr></table>`
      ),
      'ltr'
    );
    const style = styleOf(out, 'table');
    expect(style).not.toContain('margin-left');
    expect(style).not.toContain('margin-right');
  });

  it('still converts align on plain block elements to text-align', () => {
    const out = cleanPastedHTML(wordWrap(`<p align=center>hello</p>`), 'ltr');
    expect(styleOf(out, 'p')).toContain('text-align:center');
  });
});
