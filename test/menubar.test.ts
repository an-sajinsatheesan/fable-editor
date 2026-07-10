import { describe, it, expect, beforeEach } from 'vitest';
import { FableEditor } from '../src/core';

describe('menubar format menu', () => {
    let target: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = '';
        target = document.createElement('div');
        document.body.appendChild(target);
    });

    it('format menu contains the new submenu/action items', () => {
        new FableEditor({ target });
        const btn = document.querySelector('[data-menu-key="format"]') as HTMLButtonElement;
        expect(btn).toBeTruthy();
        btn.click();
        const pop = document.querySelector('.pop') as HTMLElement;
        expect(pop).toBeTruthy();
        const labels = Array.from(pop.querySelectorAll('.mi .prev')).map((e) => e.textContent);
        for (const expected of [
            'Font family', 'Font size', 'Blocks', 'Align', 'Line height', 'Word spacing',
            'Letter spacing', 'Text color', 'Background color', 'Bullet list', 'Numbered list',
            'Decrease indent', 'Increase indent', 'Left to right', 'Right to left', 'Change case',
            'Blockquote', 'Clear formatting'
        ]) {
            expect(labels).toContain(expected);
        }
        // submenu arrow rendered for flyout items
        const fontItem = Array.from(pop.querySelectorAll('.mi')).find((b) => b.textContent?.includes('Font family'))!;
        expect(fontItem.querySelector('.subarrow')).toBeTruthy();
        // hovering opens the flyout with the font list
        fontItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        const sub = document.querySelector('.pop.sub') as HTMLElement;
        expect(sub).toBeTruthy();
        expect(sub.textContent).toContain('Arial');
    });

    it('align flyout applies alignment', () => {
        new FableEditor({ target, initialContent: '<p>hello</p>' });
        const btn = document.querySelector('[data-menu-key="format"]') as HTMLButtonElement;
        btn.click();
        const pop = document.querySelector('.pop') as HTMLElement;
        const alignItem = Array.from(pop.querySelectorAll('.mi')).find((b) => b.textContent?.trim() === 'Align')!;
        alignItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        const sub = document.querySelector('.pop.sub') as HTMLElement;
        const center = Array.from(sub.querySelectorAll('.mi')).find((b) => b.textContent?.includes('Align center')) as HTMLButtonElement;
        expect(center).toBeTruthy();
        // place caret in the paragraph so the command has a target
        const p = document.querySelector('.earea p') as HTMLElement;
        const r = document.createRange();
        r.selectNodeContents(p);
        const s = window.getSelection()!;
        s.removeAllRanges();
        s.addRange(r);
        center.click();
        // jsdom execCommand is a mock (see setup.ts) — assert the command was issued
        expect((document.execCommand as ReturnType<typeof import('vitest').vi.fn>).mock.calls.some((c) => c[0] === 'justifyCenter')).toBe(true);
        // and the popup closed after the click
        expect(document.querySelector('.pop')).toBeNull();
    });

    it('color flyout shows the shared 25-swatch palette', () => {
        new FableEditor({ target });
        const btn = document.querySelector('[data-menu-key="format"]') as HTMLButtonElement;
        btn.click();
        const pop = document.querySelector('.pop') as HTMLElement;
        const colorItem = Array.from(pop.querySelectorAll('.mi')).find((b) => b.textContent?.includes('Text color'))!;
        colorItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        const sub = document.querySelector('.pop.sub') as HTMLElement;
        expect(sub).toBeTruthy();
        expect(sub.querySelectorAll('.cpal button').length).toBe(25);
    });
});
