import { EditorInitOptions, EditorLanguage, FableEditorApi, MenuItemDef, DialogButton } from './types';
import { getStrings, I18nStrings } from './i18n';
import { FONTS, SIZES, BLOCKS, COLORS, QUICK_COLORS, CHARS, MIN_FONT_PX, MAX_FONT_PX, LINE_HEIGHTS, WORD_SPACINGS, DEFAULT_TOOLBAR, DEFAULT_MENUBAR } from './config';
import { IC } from './icons';
import { cleanPastedHTML, normalizeTextPaste } from './paste-engine';
import { importDocxToHtml } from './docx-import';

type ImgCorner = 'nw' | 'ne' | 'sw' | 'se';
const IMG_CORNERS: ImgCorner[] = ['nw', 'ne', 'sw', 'se'];

export class FableEditor implements FableEditorApi {
    private static instanceCounter = 0;

    private options: Required<Omit<EditorInitOptions, 'imageUploadHandler' | 'onImageUploadError' | 'contentStyle'>>;
    private lang: EditorLanguage = 'en';
    private contentClass = 'fable-content-' + FableEditor.instanceCounter++;
    private contentStyleEl: HTMLStyleElement | null = null;

    private shell!: HTMLElement;
    private menubar!: HTMLElement;
    private toolbar!: HTMLElement;
    private ed!: HTMLElement;
    private statusbar!: HTMLElement;
    private sbHelp!: HTMLElement;
    private sbWords!: HTMLElement;
    private imgInput!: HTMLInputElement;

    private savedRange: Range | null = null;
    private foreColor = '#000000';
    private backColor = '#FACC15';

    private openPop: HTMLElement | null = null;
    private openSubEl: HTMLElement | null = null;
    private popAnchor: HTMLElement | null = null;
    private dlgOvl: HTMLElement | null = null;

    private tblActive: HTMLTableElement | null = null;
    private tblCorner: HTMLElement | null = null;
    private tblColBars: HTMLElement[] = [];
    private tblCtx: HTMLElement | null = null;
    private tblCellMark: HTMLElement | null = null;
    private tblOpMark: HTMLElement | null = null;
    private tblOpMarkKind: 'row' | 'col' | null = null;

    private imgActive: HTMLImageElement | null = null;
    private imgHandles: HTMLElement[] = [];
    private imgCtx: HTMLElement | null = null;
    private imgHideTimer: number | null = null;

    private phActive: HTMLElement | null = null;
    private phCtx: HTMLElement | null = null;
    private phUploadTarget: HTMLElement | null = null;
    private imageUploadHandler?: (file: File) => Promise<string>;
    private onImageUploadError?: (error: unknown, file: File) => void;
    private contentStyle?: string;

    private selCtx: HTMLElement | null = null;

    private docInput!: HTMLInputElement;
    private revisions: Array<{ time: number; html: string }> = [];
    private revTimer: number | null = null;
    private draftTimer: number | null = null;
    private draftStorageKey = '';

    private listeners: Array<() => void> = [];
    private isDestroyed = false;

    constructor(options: EditorInitOptions) {
        this.options = {
            target: options.target,
            language: options.language || 'en',
            height: options.height ?? 302,
            initialContent: options.initialContent ?? '<p><br></p>',
            onChange: options.onChange || (() => { }),
            onReady: options.onReady || (() => { }),
            menubar: options.menubar ?? true,
            toolbar: options.toolbar ?? true,
            statusbar: options.statusbar ?? true,
            readonly: options.readonly ?? false,
            draftKey: options.draftKey ?? (typeof location !== 'undefined' ? location.pathname : 'default'),
            fontFamilyFormats: options.fontFamilyFormats ?? FONTS,
            imageFileTypes: options.imageFileTypes ?? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
        };
        this.imageUploadHandler = options.imageUploadHandler;
        this.onImageUploadError = options.onImageUploadError;
        this.contentStyle = options.contentStyle;
        this.lang = this.options.language;
        this.draftStorageKey = 'tmclone-draft:' + this.options.draftKey;
        this.initDOM();
        this.bindEvents();
        this.initUI();
        this.recordRevision();
        this.options.onReady(this);
    }

    private t(key: keyof I18nStrings): string {
        const s = getStrings(this.lang)[key];
        return typeof s === 'string' ? s : (s as string[]).join(',');
    }

    private tArr(key: keyof I18nStrings): string[] {
        return getStrings(this.lang)[key] as string[];
    }

    private dir(): 'ltr' | 'rtl' {
        return getStrings(this.lang).dir;
    }

    /* ---------------------------------------------------------- DOM setup */
    private initDOM(): void {
        const target = this.options.target;
        target.innerHTML = '';
        target.classList.add('tox-root');

        this.shell = document.createElement('div');
        this.shell.className = 'tox';

        this.menubar = document.createElement('div');
        this.menubar.className = 'mnb';

        this.toolbar = document.createElement('div');
        this.toolbar.className = 'tbr';

        this.ed = document.createElement('div');
        this.ed.className = 'earea ' + this.contentClass;
        this.ed.setAttribute('contenteditable', (!this.options.readonly).toString());
        this.ed.spellcheck = true;
        this.ed.innerHTML = this.options.initialContent;
        this.ed.style.height = this.options.height + 'px';

        this.statusbar = document.createElement('div');
        this.statusbar.className = 'sbar';
        this.statusbar.innerHTML = `
      <span class="mid"></span>
      <span class="words"></span>
      <span class="grip">
        <svg viewBox="0 0 12 12"><path d="M11 1 1 11M11 6 6 11M11 11h0"/></svg>
      </span>
    `;
        this.sbHelp = this.statusbar.querySelector('.mid') as HTMLElement;
        this.sbWords = this.statusbar.querySelector('.words') as HTMLElement;
        const grip = this.statusbar.querySelector('.grip') as HTMLElement;
        this.bindGrip(grip);

        this.shell.appendChild(this.menubar);
        this.shell.appendChild(this.toolbar);
        this.shell.appendChild(this.ed);
        this.shell.appendChild(this.statusbar);
        if (this.contentStyle) {
            this.contentStyleEl = document.createElement('style');
            this.contentStyleEl.textContent = this.scopeContentStyle(this.contentStyle);
            this.shell.appendChild(this.contentStyleEl);
        }
        target.appendChild(this.shell);

        if (!this.options.statusbar) this.statusbar.style.display = 'none';

        this.imgInput = document.createElement('input');
        this.imgInput.type = 'file';
        this.imgInput.accept = this.options.imageFileTypes.join(',');
        this.imgInput.style.display = 'none';
        target.appendChild(this.imgInput);

        this.docInput = document.createElement('input');
        this.docInput.type = 'file';
        this.docInput.accept = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        this.docInput.style.display = 'none';
        target.appendChild(this.docInput);
    }

    /** Rewrites the literal word `body` in a user-supplied `contentStyle` string to a
     *  selector scoped to this instance's content div. Everything else passes through
     *  verbatim, since `.ed` is a plain div in the host page (not an iframe) and an
     *  unscoped `body { ... }` rule would otherwise leak onto the host page's body. */
    private scopeContentStyle(css: string): string {
        return css.replace(/\bbody\b/g, '.' + this.contentClass);
    }

    private bindGrip(grip: HTMLElement): void {
        let startY = 0;
        let startH = 0;
        const md = (e: MouseEvent) => {
            startY = e.clientY;
            startH = this.ed.offsetHeight;
            e.preventDefault();
            const mv = (ev: MouseEvent) => {
                this.ed.style.height = Math.max(120, startH + ev.clientY - startY) + 'px';
            };
            const up = () => {
                window.removeEventListener('mousemove', mv);
                window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', mv);
            window.addEventListener('mouseup', up);
        };
        grip.addEventListener('mousedown', md);
        this.listeners.push(() => grip.removeEventListener('mousedown', md));
    }

    /* ---------------------------------------------------------- event binding */
    private bindEvents(): void {
        this.onDoc('mousedown', (e) => {
            if (
                this.openPop &&
                !this.openPop.contains(e.target as Node) &&
                !this.popAnchor!.contains(e.target as Node) &&
                !(this.openSubEl && this.openSubEl.contains(e.target as Node))
            ) {
                this.closePop();
            }
        });
        this.onDoc('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePop();
                this.closeDlg();
            }
        });
        this.onDoc('selectionchange', () => {
            const sel = window.getSelection();
            if (sel && this.ed.contains(sel.anchorNode)) {
                this.saveSel();
                this.refreshState();
                this.updateSelToolbar(sel);
                this.positionCellMarker();
            } else {
                this.clearSelToolbar();
            }
        });

        this.on(this.ed, 'input', () => {
            this.refreshState();
            this.onChange();
            this.positionTableHandles();
            this.positionImageHandles();
            this.positionImgPhCtx();
        });
        this.on(this.ed, 'keydown', (e: KeyboardEvent) => {
            if (e.altKey && e.key === '0') {
                e.preventDefault();
                this.helpDlg();
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.phActive) {
                e.preventDefault();
                this.removeImgPlaceholder();
            }
        });
        this.on(this.ed, 'paste', (e: ClipboardEvent) => this.handlePaste(e));
        this.on(this.ed, 'drop', (e: DragEvent) => {
            /* content drops stay blocked (powerpaste_block_drop) — only an
               image file dropped onto an upload placeholder is consumed */
            e.preventDefault();
            const ph = (e.target as HTMLElement).closest?.('.img-ph') as HTMLElement | null;
            if (!ph || !this.ed.contains(ph) || this.options.readonly) return;
            const file = Array.from(e.dataTransfer?.files || []).find((f) => f.type.startsWith('image/'));
            if (file) this.readImageFileInto(file, ph);
        });
        this.on(this.ed, 'dragover', (e: DragEvent) => e.preventDefault());
        this.on(this.ed, 'mousedown', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const table = target.closest?.('table');
            if (table && this.ed.contains(table)) this.selectTableForResize(table as HTMLTableElement);
            else this.clearTableHandles();
            const ph = target.closest?.('.img-ph') as HTMLElement | null;
            if (ph && this.ed.contains(ph) && !this.options.readonly) {
                e.preventDefault();
                this.ed.focus();
                this.selectImgPlaceholder(ph);
            } else {
                this.clearImgPlaceholderSel();
            }
            const img = target.closest?.('img') as HTMLImageElement | null;
            if (img && this.ed.contains(img) && !this.options.readonly) {
                e.preventDefault();
                this.selectImage(img);
            } else {
                this.clearImageHandles();
            }
        });
        this.on(this.ed, 'mouseover', (e: MouseEvent) => {
            if (this.options.readonly) return;
            const img = (e.target as HTMLElement).closest?.('img') as HTMLImageElement | null;
            if (img && this.ed.contains(img)) {
                this.cancelImgHide();
                this.selectImage(img);
            }
        });
        this.on(this.ed, 'mouseout', (e: MouseEvent) => {
            const img = (e.target as HTMLElement).closest?.('img');
            if (!img) return;
            const to = e.relatedTarget as Node | null;
            if (
                to &&
                (this.imgCtx?.contains(to) ||
                    this.imgHandles.some((h) => h.contains(to)) ||
                    (to as HTMLElement).closest?.('img') === img)
            )
                return;
            this.scheduleImgHide();
        });
        this.on(this.ed, 'scroll', () => {
            this.positionTableHandles();
            this.positionImageHandles();
            this.positionImgPhCtx();
        });
        this.onWin(
            'scroll',
            () => {
                this.positionTableHandles();
                this.positionImageHandles();
                this.positionImgPhCtx();
                this.repositionSelToolbar();
            },
            true
        );
        this.onWin('resize', () => {
            this.positionTableHandles();
            this.positionImageHandles();
            this.positionImgPhCtx();
            this.repositionSelToolbar();
        });

        this.on(this.imgInput, 'change', () => {
            const file = this.imgInput.files?.[0];
            if (!file) return;
            const ph = this.phUploadTarget;
            this.phUploadTarget = null;
            if (ph && this.ed.contains(ph)) {
                this.readImageFileInto(file, ph);
                return;
            }
            const fr = new FileReader();
            fr.onload = () => {
                this.restoreSel();
                document.execCommand(
                    'insertHTML',
                    false,
                    `<img src="${fr.result}" title="${file.name.replace(/"/g, '')}" alt="">`
                );
                this.onChange();
            };
            fr.readAsDataURL(file);
        });

        this.on(this.docInput, 'change', () => {
            const file = this.docInput.files?.[0];
            if (!file) return;
            this.importWordFile(file).catch(() => alert(this.t('importfail')));
        });

        this.onDoc('mousedown', (e) => {
            if (
                this.ed.contains(e.target as Node) ||
                e.target === this.tblCorner ||
                this.tblColBars.includes(e.target as HTMLElement) ||
                (this.tblCtx && this.tblCtx.contains(e.target as Node)) ||
                this.imgHandles.includes(e.target as HTMLElement) ||
                (this.imgCtx && this.imgCtx.contains(e.target as Node)) ||
                (this.phCtx && this.phCtx.contains(e.target as Node)) ||
                (this.selCtx && this.selCtx.contains(e.target as Node)) ||
                (this.openPop && this.openPop.contains(e.target as Node)) ||
                (this.openSubEl && this.openSubEl.contains(e.target as Node))
            )
                return;
            this.clearTableHandles();
            this.clearImageHandles();
            this.clearImgPlaceholderSel();
            this.clearSelToolbar();
        });
    }

    private on<K extends keyof HTMLElementEventMap>(
        target: EventTarget,
        event: K,
        handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
    ): void {
        target.addEventListener(event, handler as EventListener);
        this.listeners.push(() => target.removeEventListener(event, handler as EventListener));
    }

    private onDoc<K extends keyof DocumentEventMap>(event: K, handler: (this: Document, ev: DocumentEventMap[K]) => any): void {
        document.addEventListener(event, handler as EventListener);
        this.listeners.push(() => document.removeEventListener(event, handler as EventListener));
    }

    private onWin<K extends keyof WindowEventMap>(
        event: K,
        handler: (this: Window, ev: WindowEventMap[K]) => any,
        capture?: boolean
    ): void {
        window.addEventListener(event, handler as EventListener, capture);
        this.listeners.push(() => window.removeEventListener(event, handler as EventListener, capture));
    }

    /* ---------------------------------------------------------- public API */
    getContent(): string {
        return this.ed.innerHTML;
    }

    setContent(html: string): void {
        this.ed.innerHTML = html || '<p><br></p>';
        this.refreshState();
        this.clearTableHandles();
        this.clearImageHandles();
        this.clearImgPlaceholderSel();
        this.clearSelToolbar();
        this.onChange();
    }

    insertContent(html: string): void {
        this.restoreSel();
        document.execCommand('insertHTML', false, html);
        this.saveSel();
        this.refreshState();
        this.onChange();
    }

    setLanguage(lang: EditorLanguage): void {
        this.lang = lang;
        this.initUI();
    }

    focus(): void {
        this.ed.focus();
    }

    async importWordFile(file: File | Blob): Promise<void> {
        const html = await importDocxToHtml(file);
        this.recordRevision();
        this.setContent(html);
        this.recordRevision();
    }

    restoreDraft(): boolean {
        let raw: string | null = null;
        try {
            raw = localStorage.getItem(this.draftStorageKey);
        } catch {
            /* storage unavailable */
        }
        if (!raw) return false;
        try {
            const draft = JSON.parse(raw) as { time: number; html: string };
            if (!draft.html) return false;
            this.recordRevision();
            this.setContent(draft.html);
            return true;
        } catch {
            return false;
        }
    }

    getRevisions(): Array<{ time: number; html: string }> {
        return this.revisions.slice();
    }

    destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        if (this.revTimer != null) window.clearTimeout(this.revTimer);
        if (this.draftTimer != null) window.clearTimeout(this.draftTimer);
        this.closePop();
        this.closeDlg();
        this.clearTableHandles();
        this.clearImageHandles();
        this.clearImgPlaceholderSel();
        this.clearSelToolbar();
        this.listeners.forEach((fn) => fn());
        this.listeners = [];
        if (this.shell && this.shell.parentNode) this.shell.parentNode.removeChild(this.shell);
        if (this.imgInput && this.imgInput.parentNode) this.imgInput.parentNode.removeChild(this.imgInput);
        if (this.docInput && this.docInput.parentNode) this.docInput.parentNode.removeChild(this.docInput);
        this.contentStyleEl = null;
    }

    /* ---------------------------------------------------------- selection */
    private saveSel(): void {
        const s = window.getSelection();
        if (s && s.rangeCount && this.ed.contains(s.anchorNode)) this.savedRange = s.getRangeAt(0).cloneRange();
    }

    private restoreSel(): void {
        if (!this.savedRange) {
            this.ed.focus();
            return;
        }
        this.ed.focus();
        const s = window.getSelection();
        if (!s) return;
        s.removeAllRanges();
        s.addRange(this.savedRange);
    }

    private exec(cmd: string, val?: string): void {
        this.restoreSel();
        document.execCommand('styleWithCSS', false, cmd !== 'fontSize' ? 'true' : 'false');
        document.execCommand(cmd, false, val ?? (undefined as any));
        this.saveSel();
        this.refreshState();
        this.onChange();
    }

    private closestBlock(node: Node | null): HTMLElement | null {
        while (node && node !== this.ed) {
            if ((node as HTMLElement).nodeType === 1 && /^(P|DIV|H[1-6]|LI|PRE|BLOCKQUOTE|TD|TH)$/i.test((node as HTMLElement).tagName)) {
                return node as HTMLElement;
            }
            node = (node as ChildNode).parentNode;
        }
        return null;
    }

    private selectedBlocks(): HTMLElement[] {
        const s = window.getSelection();
        if (!s || !s.rangeCount || !this.ed.contains(s.anchorNode)) return [];
        const r = s.getRangeAt(0);
        const blocks = Array.from(this.ed.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,pre,blockquote,td,th')).filter((b) =>
            r.intersectsNode(b)
        );
        if (!blocks.length) {
            const b = this.closestBlock(s.anchorNode);
            if (b) return [b];
        }
        return blocks as HTMLElement[];
    }

    private onChange(): void {
        this.options.onChange(this.ed.innerHTML);
        this.scheduleRevision();
        this.scheduleDraftSave();
    }

    /* ---------------------------------------------------------- revisions / drafts */
    private recordRevision(): void {
        const html = this.ed.innerHTML;
        const last = this.revisions[this.revisions.length - 1];
        if (last && last.html === html) return;
        this.revisions.push({ time: Date.now(), html });
        if (this.revisions.length > 30) this.revisions.shift();
    }

    private scheduleRevision(): void {
        if (this.revTimer != null) window.clearTimeout(this.revTimer);
        this.revTimer = window.setTimeout(() => {
            this.revTimer = null;
            this.recordRevision();
        }, 1500);
    }

    private scheduleDraftSave(): void {
        if (this.draftTimer != null) window.clearTimeout(this.draftTimer);
        this.draftTimer = window.setTimeout(() => {
            this.draftTimer = null;
            try {
                localStorage.setItem(this.draftStorageKey, JSON.stringify({ time: Date.now(), html: this.ed.innerHTML }));
            } catch {
                /* storage unavailable or full */
            }
        }, 800);
    }

    private revisionDlg(): void {
        this.recordRevision();
        this.dialog(this.t('revhistory'), (body) => {
            if (!this.revisions.length) {
                body.innerHTML = `<p style="color:#556">${this.t('revempty')}</p>`;
                return;
            }
            const wrap = document.createElement('div');
            wrap.className = 'revwrap';
            const list = document.createElement('div');
            list.className = 'revlist';
            const prev = document.createElement('div');
            prev.className = 'revprev';
            const restoreBtn = document.createElement('button');
            restoreBtn.type = 'button';
            restoreBtn.className = 'revrestore';
            restoreBtn.textContent = this.t('restore');
            let selected = this.revisions.length - 1;
            const fmt = new Intl.DateTimeFormat(this.lang === 'ar' ? 'ar-AE' : 'en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const items: Record<number, HTMLButtonElement> = {};
            const show = (i: number) => {
                selected = i;
                this.revisions.forEach((_, j) => items[j]?.classList.toggle('on', j === i));
                prev.innerHTML = this.revisions[i].html;
                restoreBtn.disabled = i === this.revisions.length - 1;
            };
            for (let i = this.revisions.length - 1; i >= 0; i--) {
                const rev = this.revisions[i];
                const b = document.createElement('button');
                b.type = 'button';
                const words = (new DOMParser().parseFromString(rev.html, 'text/html').body.textContent || '').trim();
                const wc = words ? words.split(/\s+/).length : 0;
                const isCurrent = i === this.revisions.length - 1;
                b.innerHTML = `<span>${isCurrent ? this.t('currentver') : fmt.format(new Date(rev.time))}</span><span class="wc">${wc} ${this.t('words')}</span>`;
                b.addEventListener('click', () => show(i));
                items[i] = b;
                list.appendChild(b);
            }
            list.append(restoreBtn);
            restoreBtn.addEventListener('click', () => {
                const rev = this.revisions[selected];
                if (!rev) return;
                this.recordRevision();
                this.setContent(rev.html);
                this.recordRevision();
                this.closeDlg();
            });
            wrap.append(list, prev);
            body.appendChild(wrap);
            show(selected);
        });
    }

    /* ---------------------------------------------------------- popups / menus */
    private closeSub(): void {
        this.openSubEl?.remove();
        this.openSubEl = null;
    }

    private closePop(): void {
        this.closeSub();
        if (this.openPop) {
            this.openPop.remove();
            this.openPop = null;
            this.popAnchor?.classList.remove('open');
            this.popAnchor = null;
            /* a menu item's mouseleave never fires once the menu is removed,
               so drop any row/column highlight it left behind */
            this.setOpTarget(null);
        }
    }

    private openSubFor(item: MenuItemDef, anchor: HTMLElement): void {
        this.closeSub();
        const sub = document.createElement('div');
        sub.className = 'pop sub';
        sub.dir = this.dir();
        if (item.subBuild) item.subBuild(sub);
        else if (item.sub) this.menuItems(sub, item.sub);
        sub.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault();
        });
        document.body.appendChild(sub);
        const r = anchor.getBoundingClientRect();
        const isRtl = this.dir() === 'rtl';
        // overlap the parent item slightly so the pointer can travel into the flyout
        let x = isRtl ? r.left - sub.offsetWidth + 2 : r.right - 2;
        x = Math.max(8, Math.min(x + scrollX, scrollX + innerWidth - sub.offsetWidth - 8));
        let y = r.top + scrollY - 6;
        y = Math.max(8 + scrollY, Math.min(y, scrollY + innerHeight - sub.offsetHeight - 8));
        sub.style.left = x + 'px';
        sub.style.top = y + 'px';
        this.openSubEl = sub;
    }

    private popup(anchor: HTMLElement, build: (el: HTMLElement) => void): void {
        if (this.openPop && this.popAnchor === anchor) {
            this.closePop();
            return;
        }
        this.closePop();
        const el = document.createElement('div');
        el.className = 'pop';
        el.dir = this.dir();
        build(el);
        document.body.appendChild(el);
        const r = anchor.getBoundingClientRect();
        // align the menu with its control: at least as wide as the anchor
        el.style.minWidth = Math.max(160, Math.round(r.width)) + 'px';
        el.style.top = r.bottom + scrollY + 2 + 'px';
        const isRtl = this.dir() === 'rtl';
        let x = isRtl ? r.right - el.offsetWidth : r.left;
        x = Math.max(8, Math.min(x + scrollX, scrollX + innerWidth - el.offsetWidth - 8));
        el.style.left = x + 'px';
        el.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault();
        });
        this.openPop = el;
        this.popAnchor = anchor;
        anchor.classList.add('open');
    }

    private menuItems(el: HTMLElement, items: (MenuItemDef | '|')[]): void {
        items.forEach((it) => {
            if (it === '|') {
                el.insertAdjacentHTML('beforeend', '<div class="sep"></div>');
                return;
            }
            const hasSub = !!(it.sub || it.subBuild);
            const b = document.createElement('button');
            b.className = 'mi' + (it.on ? ' on' : '');
            b.innerHTML = `<span class="ic">${it.icon || ''}</span><span class="prev" ${it.previewStyle ? `style="${it.previewStyle}"` : ''
                }>${it.label}</span>${it.shortcut ? `<span class="sc">${it.shortcut}</span>` : ''}${hasSub ? `<span class="subarrow">${IC.chev}</span>` : ''
                }`;
            b.addEventListener('click', () => {
                if (!it.action) return;
                this.closePop();
                it.action();
            });
            b.addEventListener('mouseenter', () => {
                if (hasSub) this.openSubFor(it, b);
                else if (this.openSubEl && el !== this.openSubEl) this.closeSub();
                it.hover?.(true);
            });
            b.addEventListener('mouseleave', () => it.hover?.(false));
            el.appendChild(b);
        });
    }

    /* ---------------------------------------------------------- toolbar builders */
    private tbtn(icon: string, tip: string, fn: (e?: Event) => void, id?: string): HTMLButtonElement {
        const b = document.createElement('button');
        b.className = 'tbtn';
        b.type = 'button';
        b.title = tip;
        b.innerHTML = icon;
        if (id) b.dataset.id = id;
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', fn as EventListener);
        return b;
    }

    /** Font-size increase / decrease step button. */
    private stepBtn(delta: number): HTMLButtonElement {
        const sign = delta > 0 ? '+' : '−';
        const icon = delta > 0 ? IC.fontsizeup : IC.fontsizedown;
        const b = this.tbtn(icon, this.t('fontsize') + ' ' + sign, () => this.stepFontSize(delta));
        b.addEventListener('mousedown', () => this.saveSel());
        return b;
    }

    /** Toolbar icon button that opens a popup menu anchored to itself. */
    private menuTbtn(icon: string, tip: string, menuFn: (b: HTMLButtonElement) => void, id?: string): HTMLButtonElement {
        const b = this.tbtn(icon, tip, () => menuFn(b), id);
        b.classList.add('hasmenu');
        b.insertAdjacentHTML('beforeend', IC.chev);
        b.addEventListener('mousedown', () => this.saveSel());
        return b;
    }

    /** Quick text-color chips plus a "more" chip that opens the full palette. */
    private colorChips(): HTMLElement[] {
        const chip = (title: string): HTMLButtonElement => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'cchip';
            b.title = title;
            b.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.saveSel();
            });
            return b;
        };
        const chips = QUICK_COLORS.map((c) => {
            const b = chip(this.t('forecolor'));
            b.style.background = c;
            b.addEventListener('click', () => this.applyColor('fore', c));
            return b;
        });
        const more = chip(this.t('forecolor'));
        more.classList.add('more');
        more.dataset.cb = 'fore';
        more.innerHTML = IC.chev;
        more.addEventListener('click', () => this.colorMenu(more, 'fore'));
        return [...chips, more];
    }

    private group(...els: HTMLElement[]): HTMLElement {
        const g = document.createElement('div');
        g.className = 'tgrp';
        els.forEach((e) => {
            e.classList.add('gbtn');
            g.appendChild(e);
        });
        return g;
    }

    private tsel(cls: string, id: string, defLabel: string, menuFn: (b: HTMLButtonElement) => void): HTMLButtonElement {
        const b = document.createElement('button');
        b.className = 'tsel ' + cls;
        b.type = 'button';
        b.dataset.id = id;
        b.innerHTML = `<span class="lbl empty">${defLabel || ''}</span>${IC.chev}`;
        b.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.saveSel();
        });
        b.addEventListener('click', () => menuFn(b));
        return b;
    }

    private setListStyle(kind: 'ol' | 'ul', style: string): void {
        this.restoreSel();
        const s = window.getSelection();
        if (!s) return;
        let list = this.closestBlock(s.anchorNode)?.closest(kind);
        if (!list) {
            this.exec(kind === 'ol' ? 'insertOrderedList' : 'insertUnorderedList');
            list = this.closestBlock(s.anchorNode)?.closest(kind);
        }
        if (list) (list as HTMLElement).style.listStyleType = style;
        this.saveSel();
        this.onChange();
    }

    private listMenu(anchor: HTMLButtonElement, kind: 'ul' | 'ol'): void {
        const cmd = kind === 'ol' ? 'insertOrderedList' : 'insertUnorderedList';
        // the toggle item creates the default style, so it is not repeated below
        const styles: [string, string][] =
            kind === 'ol'
                ? [
                    ['lower-alpha', IC.ol_alpha],
                    ['lower-roman', IC.ol_roman],
                    ['upper-alpha', IC.ol_alphau],
                    ['upper-roman', IC.ol_romanu]
                ]
                : [
                    ['circle', IC.ul_circle],
                    ['square', IC.ul_square]
                ];
        const labels = this.tArr(kind === 'ol' ? 'liststyles_ol' : 'liststyles_ul').slice(1);
        const sel = window.getSelection();
        const listEl = sel ? (this.closestBlock(sel.anchorNode)?.closest(kind) as HTMLElement | null) : null;
        const curStyle = listEl ? listEl.style.listStyleType : '';
        this.popup(anchor, (el) => {
            this.menuItems(el, [
                {
                    label: this.t(kind === 'ol' ? 'numlist' : 'bullist'),
                    icon: kind === 'ol' ? IC.numlist : IC.bullist,
                    on: document.queryCommandState(cmd),
                    action: () => this.exec(cmd)
                }
            ]);
            el.insertAdjacentHTML('beforeend', '<div class="sep"></div>');
            const grid = document.createElement('div');
            grid.className = 'mi-grid';
            styles.forEach(([s, icon], i) => {
                const b = document.createElement('button');
                b.className = 'mi' + (curStyle === s ? ' on' : '');
                b.innerHTML = `<span class="ic">${icon}</span><span class="prev">${labels[i]}</span>`;
                b.addEventListener('click', () => {
                    this.closePop();
                    this.setListStyle(kind, s);
                });
                grid.appendChild(b);
            });
            el.appendChild(grid);
        });
    }

    private colorMenu(anchor: HTMLButtonElement, kind: 'fore' | 'back'): void {
        this.popup(anchor, (el) => {
            const grid = document.createElement('div');
            grid.className = 'cpal';
            COLORS.forEach((c) => {
                const b = document.createElement('button');
                b.style.background = c;
                b.title = c;
                b.addEventListener('click', () => {
                    this.closePop();
                    this.applyColor(kind, c);
                });
                grid.appendChild(b);
            });
            el.appendChild(grid);
            el.insertAdjacentHTML('beforeend', '<div class="sep"></div>');
            const foot = document.createElement('div');
            foot.className = 'cfoot';
            const cur = document.createElement('div');
            cur.className = 'cswatch cur';
            cur.title = this.t('currentcolor');
            const curColor = kind === 'fore' ? this.foreColor : this.backColor;
            cur.style.background = /^#[0-9a-f]{6}$/i.test(curColor) ? curColor : '#000000';
            cur.innerHTML = IC.check;
            const nocolor = document.createElement('button');
            nocolor.type = 'button';
            nocolor.className = 'cswatch nocolor';
            nocolor.title = this.t('removecolor');
            nocolor.addEventListener('click', () => {
                this.closePop();
                this.applyColor(kind, null);
            });
            const wheel = document.createElement('label');
            wheel.className = 'cswatch cwheel';
            wheel.title = this.t('customcolor');
            wheel.innerHTML = IC.palette;
            const picker = document.createElement('input');
            picker.type = 'color';
            picker.value = /^#[0-9a-f]{6}$/i.test(curColor) ? curColor : '#000000';
            picker.addEventListener('change', () => {
                this.closePop();
                this.applyColor(kind, picker.value);
            });
            wheel.appendChild(picker);
            foot.append(cur, nocolor, wheel);
            el.appendChild(foot);
        });
    }

    private applyColor(kind: 'fore' | 'back', c: string | null): void {
        if (kind === 'fore') {
            this.foreColor = c || '#000000';
            this.exec('foreColor', c || '#000000');
        } else {
            this.backColor = c || 'transparent';
            this.exec('hiliteColor', c || 'transparent');
        }
        this.syncColorSwatches(this.toolbar);
        if (this.selCtx) this.syncColorSwatches(this.selCtx);
    }

    private syncColorSwatches(container: HTMLElement): void {
        container.querySelectorAll(`[data-cb=fore]`).forEach((el) => ((el as HTMLElement).style.background = this.foreColor));
        container.querySelectorAll(`[data-cb=back]`).forEach((el) => ((el as HTMLElement).style.background = this.backColor));
    }

    private fontMenu(anchor: HTMLButtonElement): void {
        this.popup(anchor, (el) => {
            this.menuItems(
                el,
                this.options.fontFamilyFormats.map(([name, val]) => ({
                    label: name,
                    previewStyle: `font-family:${val}`,
                    on: this.currentFont() === name,
                    action: () => this.exec('fontName', val)
                }))
            );
        });
    }

    private sizeMenu(anchor: HTMLButtonElement): void {
        this.popup(anchor, (el) => {
            this.menuItems(
                el,
                SIZES.map((s) => ({
                    label: s,
                    on: this.currentSize() === s,
                    action: () => this.applyFontSize(s)
                }))
            );
        });
    }

    /** Font sizing needs a non-collapsed range. With a bare caret, grow the
        selection to the word under it; in an empty spot, select a zero-width
        space so the new size applies to what gets typed next. */
    private ensureSizeTarget(): void {
        const s = window.getSelection();
        if (!s) return;
        if (!s.rangeCount) {
            const r = document.createRange();
            r.selectNodeContents(this.ed);
            r.collapse(true);
            s.addRange(r);
        }
        if (!s.isCollapsed) return;
        const r = s.getRangeAt(0);
        const node = r.startContainer;
        if (node.nodeType === 3) {
            const text = (node as Text).data;
            let a = r.startOffset;
            let b = r.startOffset;
            while (a > 0 && /\S/.test(text[a - 1])) a--;
            while (b < text.length && /\S/.test(text[b])) b++;
            if (b > a) {
                const nr = document.createRange();
                nr.setStart(node, a);
                nr.setEnd(node, b);
                s.removeAllRanges();
                s.addRange(nr);
                this.savedRange = nr.cloneRange();
                return;
            }
        }
        const zw = document.createTextNode(String.fromCharCode(0x200b));
        r.insertNode(zw);
        const nr = document.createRange();
        nr.setStart(zw, 0);
        nr.setEnd(zw, 1);
        s.removeAllRanges();
        s.addRange(nr);
        this.savedRange = nr.cloneRange();
    }

    private applyFontSize(px: string): void {
        this.restoreSel();
        this.ensureSizeTarget();
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand('fontSize', false, '7');
        const spans: HTMLSpanElement[] = [];
        this.ed.querySelectorAll('font[size="7"]').forEach((f) => {
            const span = document.createElement('span');
            span.style.fontSize = px;
            while (f.firstChild) span.appendChild(f.firstChild);
            f.replaceWith(span);
            spans.push(span);
        });
        if (spans.length) {
            // keep the selection anchored inside the new spans so the current
            // size reads back correctly (e.g. for repeated +/- stepping)
            const r = document.createRange();
            r.setStart(spans[0], 0);
            r.setEnd(spans[spans.length - 1], spans[spans.length - 1].childNodes.length);
            const s = window.getSelection();
            if (s) {
                s.removeAllRanges();
                s.addRange(r);
            }
        }
        this.saveSel();
        this.refreshState();
        this.onChange();
    }

    private stepFontSize(delta: number): void {
        const cur = parseInt(this.currentSize(), 10) || 14;
        const next = Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, cur + delta));
        if (next === cur) return;
        this.applyFontSize(next + 'px');
    }

    /* ------------------------------------------------ case / spacing / link */
    private transformCase(kind: 'lower' | 'upper' | 'capitalize'): void {
        this.restoreSel();
        const s = window.getSelection();
        if (!s || !s.rangeCount || s.isCollapsed) return;
        const range = s.getRangeAt(0);
        const walker = document.createTreeWalker(this.ed, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        let n: Node | null;
        while ((n = walker.nextNode())) if (range.intersectsNode(n)) nodes.push(n as Text);
        nodes.forEach((t) => {
            const start = t === range.startContainer ? range.startOffset : 0;
            const end = t === range.endContainer ? range.endOffset : t.data.length;
            if (end <= start) return;
            const mid = t.data.slice(start, end);
            let out = mid;
            if (kind === 'lower') out = mid.toLowerCase();
            else if (kind === 'upper') out = mid.toUpperCase();
            else out = mid.replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());
            t.replaceData(start, end - start, out);
        });
        this.saveSel();
        this.refreshState();
        this.onChange();
    }

    private caseMenu(anchor: HTMLButtonElement): void {
        this.popup(anchor, (el) => {
            this.menuItems(el, [
                { label: this.t('lowercase'), icon: IC.lowercaseic, action: () => this.transformCase('lower') },
                { label: this.t('uppercase'), icon: IC.uppercaseic, action: () => this.transformCase('upper') },
                { label: this.t('capitalize'), icon: IC.capitalizeic, action: () => this.transformCase('capitalize') }
            ]);
        });
    }

    private applyBlockStyle(prop: 'lineHeight' | 'wordSpacing', value: string): void {
        this.restoreSel();
        const blocks = this.selectedBlocks();
        blocks.forEach((b) => {
            if (value) b.style[prop] = value;
            else b.style.removeProperty(prop === 'lineHeight' ? 'line-height' : 'word-spacing');
        });
        this.saveSel();
        this.onChange();
    }

    private currentBlockStyle(prop: 'lineHeight' | 'wordSpacing'): string {
        const s = window.getSelection();
        const b = s ? this.closestBlock(s.anchorNode) : null;
        return b ? b.style[prop] || '' : '';
    }

    private lineHeightMenu(anchor: HTMLButtonElement): void {
        const cur = this.currentBlockStyle('lineHeight');
        this.popup(anchor, (el) => {
            this.menuItems(el, [
                { label: this.t('normal'), on: !cur, action: () => this.applyBlockStyle('lineHeight', '') },
                ...LINE_HEIGHTS.map((v) => ({
                    label: v,
                    on: cur === v,
                    action: () => this.applyBlockStyle('lineHeight', v)
                }))
            ]);
        });
    }

    private wordSpacingMenu(anchor: HTMLButtonElement): void {
        const cur = this.currentBlockStyle('wordSpacing');
        this.popup(anchor, (el) => {
            this.menuItems(el, [
                { label: this.t('normal'), on: !cur, action: () => this.applyBlockStyle('wordSpacing', '') },
                ...WORD_SPACINGS.map((v) => ({
                    label: v,
                    on: cur === v,
                    action: () => this.applyBlockStyle('wordSpacing', v)
                }))
            ]);
        });
    }

    private closestAnchor(): HTMLAnchorElement | null {
        const s = window.getSelection();
        let node: Node | null = s && this.ed.contains(s.anchorNode) ? s.anchorNode : null;
        while (node && node !== this.ed) {
            if ((node as HTMLElement).nodeType === 1 && (node as HTMLElement).tagName === 'A') return node as HTMLAnchorElement;
            node = node.parentNode;
        }
        return null;
    }

    private linkDlg(): void {
        this.saveSel();
        const anchorEl = this.closestAnchor();
        let urlIn: HTMLInputElement;
        const buttons: DialogButton[] = [];
        if (anchorEl) {
            buttons.push({
                label: this.t('unlink'),
                action: () => {
                    const r = document.createRange();
                    r.selectNodeContents(anchorEl);
                    const s = window.getSelection();
                    if (s) {
                        s.removeAllRanges();
                        s.addRange(r);
                    }
                    document.execCommand('unlink');
                    this.closeDlg();
                    this.onChange();
                }
            });
        }
        buttons.push(
            { label: this.t('cancel'), action: () => this.closeDlg() },
            {
                label: this.t('save'),
                primary: true,
                action: () => {
                    const url = urlIn.value.trim();
                    this.closeDlg();
                    if (!url) return;
                    if (anchorEl) {
                        anchorEl.setAttribute('href', url);
                        this.onChange();
                        return;
                    }
                    this.restoreSel();
                    const s = window.getSelection();
                    if (!s || s.isCollapsed) {
                        document.execCommand('insertHTML', false, `<a href="${url.replace(/"/g, '&quot;')}">${url
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')}</a>`);
                    } else {
                        document.execCommand('styleWithCSS', false, 'false');
                        document.execCommand('createLink', false, url);
                    }
                    this.saveSel();
                    this.onChange();
                }
            }
        );
        this.dialog(
            this.t('linkttl'),
            (body) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:10px;margin:10px 0;min-width:360px';
                const lbl = document.createElement('span');
                lbl.style.cssText = 'width:60px;color:#556;flex:none';
                lbl.textContent = this.t('linkurl');
                urlIn = document.createElement('input');
                urlIn.type = 'url';
                urlIn.placeholder = 'https://';
                urlIn.style.cssText = 'flex:1;border:1px solid #cfd6df;border-radius:6px;padding:7px 9px;font:14px inherit';
                urlIn.value = anchorEl?.getAttribute('href') || '';
                row.append(lbl, urlIn);
                body.appendChild(row);
                setTimeout(() => urlIn.focus(), 0);
            },
            buttons
        );
    }

    private blocksMenu(anchor: HTMLButtonElement): void {
        this.popup(anchor, (el) => {
            this.menuItems(
                el,
                BLOCKS.map(([tag, key]) => ({
                    label: this.blockLabel(tag),
                    previewStyle: tag.startsWith('h')
                        ? `font-weight:700;font-size:${22 - 2 * (+tag[1])}px`
                        : tag === 'pre'
                            ? 'font-family:monospace'
                            : '',
                    on: this.currentBlock() === tag,
                    action: () => this.exec('formatBlock', '<' + tag + '>')
                }))
            );
        });
    }

    private blockLabel(tag: string): string {
        if (tag === 'p') return this.t('para');
        if (tag === 'pre') return this.t('pre');
        return this.t('heading') + ' ' + tag[1];
    }

    private tableGrid(anchor: HTMLElement, after?: () => void): void {
        this.popup(anchor, (el) => this.buildTableGridInto(el, after));
    }

    private buildTableGridInto(el: HTMLElement, after?: () => void): void {
        {
            const wrap = document.createElement('div');
            wrap.className = 'tgridwrap';
            const grid = document.createElement('div');
            grid.className = 'tgrid';
            const lbl = document.createElement('div');
            lbl.className = 'tgridlbl';
            lbl.textContent = '1 × 1';
            const cells: HTMLSpanElement[] = [];
            for (let r = 0; r < 8; r++)
                for (let c = 0; c < 10; c++) {
                    const sp = document.createElement('span');
                    sp.dataset.r = String(r);
                    sp.dataset.c = String(c);
                    sp.addEventListener('mouseenter', () => {
                        cells.forEach((x) => x.classList.toggle('hot', +x.dataset.r! <= r && +x.dataset.c! <= c));
                        lbl.textContent = c + 1 + ' × ' + (r + 1);
                    });
                    sp.addEventListener('click', () => {
                        this.closePop();
                        this.insertTable(r + 1, c + 1);
                        after?.();
                    });
                    cells.push(sp);
                    grid.appendChild(sp);
                }
            wrap.append(grid, lbl);
            el.appendChild(wrap);
        }
    }

    private insertTable(rows: number, cols: number): void {
        this.restoreSel();
        /* table-layout:fixed keeps the columns evenly sized while typing —
           text wraps at the column edge instead of widening the column */
        let html = '<table style="border-collapse:collapse;width:100%;table-layout:fixed"><tbody>';
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) html += '<td style="border:1px solid #b9c2cc"><br></td>';
            html += '</tr>';
        }
        html += '</tbody></table><p><br></p>';
        document.execCommand('insertHTML', false, html);
        this.saveSel();
        this.onChange();
    }

    private setDir(dir: 'ltr' | 'rtl'): void {
        this.restoreSel();
        const blocks = this.selectedBlocks();
        if (blocks.length) blocks.forEach((b) => b.setAttribute('dir', dir));
        else this.ed.setAttribute('dir', dir);
        this.saveSel();
        this.refreshState();
        this.onChange();
    }

    /** Splits a toolbar layout string into groups of item names: `|` separates visual
     *  groups, whitespace separates items within a group. Empty groups/tokens (e.g. from
     *  leading/trailing/doubled separators) are dropped. Pure function. */
    private parseToolbarString(spec: string): string[][] {
        return spec
            .split('|')
            .map((group) => group.trim().split(/\s+/).filter(Boolean))
            .filter((group) => group.length > 0);
    }

    /** Maps every supported toolbar item name to a builder for that one control. Each
     *  entry is a direct lift of what used to be an inline call in `buildToolbar()` — no
     *  behavior changes, just named lookup. Only `forecolor` yields multiple elements
     *  (the quick color chips); everything else yields one. */
    private buildToolbarRegistry(): Record<string, () => HTMLElement | HTMLElement[]> {
        const tableBtn = this.tbtn(IC.tableic, this.t('quicktable'), () => this.tableGrid(tableBtn));
        return {
            undo: () => this.tbtn(IC.undo, this.t('undo'), () => this.exec('undo')),
            redo: () => this.tbtn(IC.redo, this.t('redo'), () => this.exec('redo')),
            preview: () => this.tbtn(IC.prevw, this.t('preview'), () => this.previewDlg()),
            print: () => this.tbtn(IC.printic, this.t('print'), () => this.printDoc()),
            importword: () => this.tbtn(IC.wordic, this.t('importword'), () => this.pickWordDoc()),
            revhistory: () => this.tbtn(IC.historyic, this.t('revhistory'), () => this.revisionDlg()),
            fontfamily: () => this.tsel('w-font', 'fontsel', '', (b) => this.fontMenu(b)),
            fontsize: () => this.tsel('w-size', 'sizesel', '', (b) => this.sizeMenu(b)),
            fontsizeincrease: () => this.stepBtn(1),
            fontsizedecrease: () => this.stepBtn(-1),
            bold: () => this.tbtn(IC.bold, this.t('bold'), () => this.exec('bold'), 'bold'),
            italic: () => this.tbtn(IC.italic, this.t('italic'), () => this.exec('italic'), 'italic'),
            underline: () => this.tbtn(IC.underline, this.t('underline'), () => this.exec('underline'), 'underline'),
            strikethrough: () => this.tbtn(IC.strikethrough, this.t('strikethrough'), () => this.exec('strikeThrough'), 'strikeThrough'),
            forecolor: () => this.colorChips(),
            backcolor: () =>
                this.menuTbtn(
                    IC.backcolor + '<span class="colorbar" data-cb="back"></span>',
                    this.t('backcolor'),
                    (b) => this.colorMenu(b, 'back')
                ),
            alignleft: () => this.tbtn(IC.alignleft, this.t('alignleft'), () => this.exec('justifyLeft'), 'justifyLeft'),
            aligncenter: () => this.tbtn(IC.aligncenter, this.t('aligncenter'), () => this.exec('justifyCenter'), 'justifyCenter'),
            alignright: () => this.tbtn(IC.alignright, this.t('alignright'), () => this.exec('justifyRight'), 'justifyRight'),
            alignjustify: () => this.tbtn(IC.alignjustify, this.t('alignjustify'), () => this.exec('justifyFull'), 'justifyFull'),
            bullist: () => this.menuTbtn(IC.bullist, this.t('bullist'), (b) => this.listMenu(b, 'ul'), 'insertUnorderedList'),
            numlist: () => this.menuTbtn(IC.numlist, this.t('numlist'), (b) => this.listMenu(b, 'ol'), 'insertOrderedList'),
            outdent: () => this.tbtn(IC.outdent, this.t('outdent'), () => this.exec('outdent')),
            indent: () => this.tbtn(IC.indent, this.t('indent'), () => this.exec('indent')),
            link: () => this.tbtn(IC.link, this.t('linkttl'), () => this.linkDlg()),
            blockquote: () => this.tbtn(IC.quote, this.t('quote'), () => this.toggleBlock('blockquote'), 'blockquote'),
            changecase: () => this.menuTbtn(IC.caseic, this.t('changecase'), (b) => this.caseMenu(b)),
            lineheight: () => this.menuTbtn(IC.lineheight, this.t('lineheight'), (b) => this.lineHeightMenu(b)),
            wordspacing: () => this.menuTbtn(IC.wordspacing, this.t('wordspacing'), (b) => this.wordSpacingMenu(b)),
            removeformat: () => this.tbtn(IC.clearformatic, this.t('removeformat'), () => this.exec('removeFormat')),
            blocks: () => this.tsel('w-block', 'blocksel', this.t('para'), (b) => this.blocksMenu(b)),
            ltr: () => this.tbtn(IC.ltr, this.t('ltr'), () => this.setDir('ltr'), 'ltr'),
            rtl: () => this.tbtn(IC.rtl, this.t('rtl'), () => this.setDir('rtl'), 'rtl'),
            quickimage: () => this.tbtn(IC.image, this.t('quickimage'), () => this.insertImagePlaceholder()),
            quicktable: () => tableBtn,
            charmap: () => this.tbtn(IC.charic, this.t('charmap'), () => this.charMap()),
            fullscreen: () => this.tbtn(IC.fullscreen, this.t('fullscreen'), () => this.toggleFullscreen(), 'fullscreen'),
            sourcecode: () => this.tbtn(IC.srcic, this.t('sourcecode'), () => this.sourceDlg())
        };
    }

    private buildToolbar(): void {
        this.toolbar.innerHTML = '';
        const spec = this.options.toolbar === true ? DEFAULT_TOOLBAR : (this.options.toolbar as string);
        const registry = this.buildToolbarRegistry();
        this.parseToolbarString(spec).forEach((tokens) => {
            const elements: HTMLElement[] = [];
            tokens.forEach((token) => {
                const builder = registry[token];
                if (!builder) {
                    console.warn(`FableEditor: unknown toolbar item "${token}"`);
                    return;
                }
                const result = builder();
                if (Array.isArray(result)) elements.push(...result);
                else elements.push(result);
            });
            if (elements.length) this.toolbar.appendChild(this.group(...elements));
        });
        this.syncColorSwatches(this.toolbar);
    }

    /* ---------------------------------------------------------- menubar */
    private mItem(label: keyof I18nStrings, icon: string | undefined, action: () => void, shortcut?: string): MenuItemDef {
        return { label: this.t(label), icon, action, shortcut };
    }

    private buildMenubar(): void {
        this.menubar.innerHTML = '';
        const menus: Record<string, (MenuItemDef | '|')[]> = {
            file: [
                this.mItem('newdoc', IC.newic, () => {
                    this.recordRevision();
                    this.ed.innerHTML = '<p><br></p>';
                    this.onChange();
                }),
                '|',
                this.mItem('importword', IC.wordic, () => this.pickWordDoc()),
                this.mItem('restoredraft', IC.draftic, () => {
                    if (!this.restoreDraft()) alert(this.t('draftempty'));
                }),
                this.mItem('revhistory', IC.historyic, () => this.revisionDlg()),
                '|',
                this.mItem('preview', IC.prevw, () => this.previewDlg()),
                this.mItem('print', IC.printic, () => this.printDoc(), 'Ctrl+P')
            ],
            edit: [
                this.mItem('undo', IC.undo, () => this.exec('undo'), 'Ctrl+Z'),
                this.mItem('redo', IC.redo, () => this.exec('redo'), 'Ctrl+Y'),
                '|',
                this.mItem('cut', IC.cutic, () => this.exec('cut'), 'Ctrl+X'),
                this.mItem('copy', IC.copyic, () => this.exec('copy'), 'Ctrl+C'),
                this.mItem('paste', IC.pasteic, () => alert(this.t('pastehint')), 'Ctrl+V'),
                '|',
                this.mItem('selectall', IC.selall, () => this.exec('selectAll'), 'Ctrl+A')
            ],
            view: [
                this.mItem('fullscreen', IC.fullscreen, () => this.toggleFullscreen()),
                this.mItem('preview', IC.prevw, () => this.previewDlg()),
                this.mItem('sourcecode', IC.srcic, () => this.sourceDlg())
            ],
            insert: [
                this.mItem('link', IC.link, () => this.linkDlg()),
                this.mItem('image', IC.image, () => this.insertImagePlaceholder()),
                { label: this.t('inserttable'), icon: IC.tableic, action: () => this.tableGrid((this.menubar.querySelector('[data-menu-key="table"]') as HTMLElement) || this.menubar) },
                this.mItem('hr', IC.hric, () => this.exec('insertHorizontalRule')),
                '|',
                this.mItem('charmap', IC.charic, () => this.charMap()),
                this.mItem('datetime', IC.dateic, () =>
                    this.exec('insertText', new Date().toLocaleString(this.lang === 'ar' ? 'ar-AE' : 'en-GB'))
                ),
                '|',
                {
                    label: this.t('pagebreak'),
                    icon: IC.pbic,
                    action: () => {
                        this.restoreSel();
                        document.execCommand('insertHTML', false, '<hr class="pagebreak"><p><br></p>');
                        this.onChange();
                    }
                },
                this.mItem('nbsp', IC.nbspic, () => this.exec('insertText', '\u00A0'))
            ],
            format: [
                this.mItem('bold', IC.bold, () => this.exec('bold'), 'Ctrl+B'),
                this.mItem('italic', IC.italic, () => this.exec('italic'), 'Ctrl+I'),
                this.mItem('underline', IC.underline, () => this.exec('underline'), 'Ctrl+U'),
                this.mItem('strikethrough', IC.strikethrough, () => this.exec('strikeThrough')),
                this.mItem('superscript', IC.superscriptic, () => this.exec('superscript')),
                this.mItem('subscript', IC.subscriptic, () => this.exec('subscript')),
                '|',
                this.mItem('lowercase', IC.lowercaseic, () => this.transformCase('lower')),
                this.mItem('uppercase', IC.uppercaseic, () => this.transformCase('upper')),
                this.mItem('capitalize', IC.capitalizeic, () => this.transformCase('capitalize')),
                '|',
                this.mItem('clearformat', IC.clearformatic, () => this.exec('removeFormat'))
            ],
            tools: [this.mItem('sourcecode', IC.srcic, () => this.sourceDlg()), this.mItem('wordcount', IC.wcic, () => this.wordCountDlg())],
            table: [
                { label: this.t('inserttable'), icon: IC.tableic, subBuild: (el) => this.buildTableGridInto(el) },
                '|',
                {
                    label: this.t('cell'),
                    sub: [{ label: this.t('cellprops'), icon: IC.tableic, action: () => this.cellPropsDlg() }]
                },
                {
                    label: this.t('row'),
                    sub: [
                        { label: this.t('rowabove'), icon: IC.rowbefore, action: () => this.tableOp('rowabove'), hover: (on) => this.setOpTarget(on ? 'row' : null) },
                        { label: this.t('rowbelow'), icon: IC.rowafter, action: () => this.tableOp('rowbelow'), hover: (on) => this.setOpTarget(on ? 'row' : null) },
                        { label: this.t('delrow'), icon: IC.rowdelete, action: () => this.tableOp('delrow'), hover: (on) => this.setOpTarget(on ? 'row' : null) },
                        '|',
                        { label: this.t('rowprops'), icon: IC.tableic, action: () => this.rowPropsDlg(), hover: (on) => this.setOpTarget(on ? 'row' : null) }
                    ]
                },
                {
                    label: this.t('column'),
                    sub: [
                        { label: this.t('colbefore'), icon: IC.colbefore, action: () => this.tableOp('colbefore'), hover: (on) => this.setOpTarget(on ? 'col' : null) },
                        { label: this.t('colafter'), icon: IC.colafter, action: () => this.tableOp('colafter'), hover: (on) => this.setOpTarget(on ? 'col' : null) },
                        { label: this.t('delcol'), icon: IC.coldelete, action: () => this.tableOp('delcol'), hover: (on) => this.setOpTarget(on ? 'col' : null) },
                        '|',
                        { label: this.t('colprops'), icon: IC.tableic, action: () => this.colPropsDlg(), hover: (on) => this.setOpTarget(on ? 'col' : null) }
                    ]
                },
                '|',
                {
                    label: this.t('tablepropsttl'),
                    icon: IC.tableic,
                    action: () => {
                        const cell = this.currentCell();
                        if (!cell) {
                            alert(this.t('nocell'));
                            return;
                        }
                        this.tblActive = cell.closest('table');
                        this.tablePropsDlg();
                    }
                },
                { label: this.t('deltable'), icon: IC.trash, action: () => this.tableOp('deltable') }
            ],
            help: [this.mItem('helpttl', IC.helpic, () => this.helpDlg(), 'Alt+0')]
        };
        const spec = this.options.menubar === true ? DEFAULT_MENUBAR : (this.options.menubar as string);
        const seen = new Set<string>();
        spec
            .split(/\s+/)
            .filter(Boolean)
            .forEach((key) => {
                if (seen.has(key)) return;
                seen.add(key);
                if (!menus[key]) {
                    console.warn(`FableEditor: unknown menubar item "${key}"`);
                    return;
                }
                const b = document.createElement('button');
                b.type = 'button';
                b.textContent = this.t(key as keyof I18nStrings);
                b.dataset.menuKey = key;
                b.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.saveSel();
                });
                b.addEventListener('click', () => this.popup(b, (el) => this.menuItems(el, menus[key])));
                this.menubar.appendChild(b);
            });
    }

    /* ---------------------------------------------------------- table ops */
    private tableOp(op: string): void {
        this.restoreSel();
        const s = window.getSelection();
        if (!s) return;
        const cell =
            this.closestBlock(s.anchorNode)?.closest('td,th') ||
            (s.anchorNode && (s.anchorNode as Element).nodeType === 1 ? (s.anchorNode as Element).closest?.('td,th') : null);
        if (!cell) return;
        const row = cell.parentElement as HTMLTableRowElement;
        const table = cell.closest('table') as HTMLTableElement;
        const idx = Array.from(row.children).indexOf(cell as HTMLTableCellElement);
        const newRow = () => {
            const r = row.cloneNode(false) as HTMLTableRowElement;
            Array.from(row.children).forEach((src) => {
                const td = document.createElement('td');
                /* carry the source cell's inline style so borders / padding /
                   column widths survive on inserted rows */
                const st = (src as HTMLElement).getAttribute('style');
                if (st) td.setAttribute('style', st);
                td.style.removeProperty('background-color');
                td.innerHTML = '<br>';
                r.appendChild(td);
            });
            return r;
        };
        if (op === 'rowabove') row.before(newRow());
        if (op === 'rowbelow') row.after(newRow());
        if (op === 'delrow') {
            const body = row.parentElement!;
            row.remove();
            if (!body.querySelector('tr')) table.remove();
        }
        if (op === 'colbefore' || op === 'colafter') {
            table.querySelectorAll('tr').forEach((tr) => {
                const ref = tr.children[Math.min(idx, tr.children.length - 1)] as HTMLElement;
                const td = document.createElement('td');
                /* carry the reference cell's inline style so borders / padding
                   survive on inserted columns; width is dropped so the new
                   column shares the table space instead of doubling it */
                const st = ref.getAttribute('style');
                if (st) td.setAttribute('style', st);
                td.style.removeProperty('width');
                td.style.removeProperty('background-color');
                td.innerHTML = '<br>';
                op === 'colbefore' ? ref.before(td) : ref.after(td);
            });
        }
        if (op === 'delcol') {
            table.querySelectorAll('tr').forEach((tr) => tr.children[idx]?.remove());
            if (!table.querySelector('td,th')) table.remove();
        }
        if (op === 'deltable') table.remove();
        this.onChange();
        this.positionTableHandles();
    }

    private applyTableProps(table: HTMLTableElement, vals: Record<string, string>): void {
        if (vals.width) table.style.width = /^\d+$/.test(vals.width) ? vals.width + 'px' : vals.width;
        else table.style.removeProperty('width');

        const cells = Array.from(table.querySelectorAll('td,th')) as HTMLElement[];
        if (vals.cellpadding !== '') cells.forEach((c) => (c.style.padding = vals.cellpadding + 'px'));
        else cells.forEach((c) => c.style.removeProperty('padding'));

        if (vals.cellspacing !== '') {
            table.style.borderCollapse = 'separate';
            table.style.borderSpacing = vals.cellspacing + 'px';
        } else {
            table.style.borderCollapse = 'collapse';
            table.style.removeProperty('border-spacing');
        }

        if (vals.border !== '' && +vals.border > 0) {
            table.style.border = vals.border + 'px solid #b9c2cc';
            cells.forEach((c) => (c.style.border = vals.border + 'px solid #b9c2cc'));
        } else {
            table.style.removeProperty('border');
            cells.forEach((c) => c.style.removeProperty('border'));
        }

        table.style.removeProperty('margin-left');
        table.style.removeProperty('margin-right');
        if (vals.align === 'center') {
            table.style.marginLeft = 'auto';
            table.style.marginRight = 'auto';
        } else if (vals.align === 'right') {
            table.style.marginLeft = 'auto';
            table.style.marginRight = '0';
        } else if (vals.align === 'left') {
            table.style.marginLeft = '0';
            table.style.marginRight = 'auto';
        }
    }

    private tablePropsDlg(): void {
        const table = this.tblActive;
        if (!table) return;
        let wIn: HTMLInputElement;
        let padIn: HTMLInputElement;
        let spIn: HTMLInputElement;
        let bIn: HTMLInputElement;
        let alignSel: HTMLSelectElement;
        const rowStyle = 'display:flex;align-items:center;gap:10px;margin:10px 0';
        const lblStyle = 'width:120px;color:#556;flex:none';
        const inputStyle = 'flex:1;border:1px solid #cfd6df;border-radius:6px;padding:7px 9px;font:14px inherit';
        const firstCell = table.querySelector('td,th') as HTMLElement | null;
        const curWidth = table.style.width || '';
        const curPad = firstCell && firstCell.style.padding ? parseFloat(firstCell.style.padding) : '';
        const curSp = table.style.borderSpacing ? parseFloat(table.style.borderSpacing) : '';
        const curBorder = table.style.borderWidth ? parseFloat(table.style.borderWidth) : '';
        const ml = table.style.marginLeft;
        const mr = table.style.marginRight;
        const curAlign = ml === 'auto' && mr === 'auto' ? 'center' : ml === 'auto' ? 'right' : mr === 'auto' && ml === '0' ? 'left' : '';

        this.dialog(
            this.t('tablepropsttl'),
            (body) => {
                const mk = (labelKey: keyof I18nStrings, el: HTMLElement) => {
                    const row = document.createElement('div');
                    row.style.cssText = rowStyle;
                    const lbl = document.createElement('span');
                    lbl.style.cssText = lblStyle;
                    lbl.textContent = this.t(labelKey);
                    row.append(lbl, el);
                    body.appendChild(row);
                };
                wIn = document.createElement('input');
                wIn.type = 'text';
                wIn.style.cssText = inputStyle;
                wIn.placeholder = 'e.g. 600px or 100%';
                wIn.value = curWidth as string;
                mk('tblwidth', wIn);
                padIn = document.createElement('input');
                padIn.type = 'number';
                padIn.min = '0';
                padIn.style.cssText = inputStyle;
                padIn.value = String(curPad);
                mk('tblcellpadding', padIn);
                spIn = document.createElement('input');
                spIn.type = 'number';
                spIn.min = '0';
                spIn.style.cssText = inputStyle;
                spIn.value = String(curSp);
                mk('tblcellspacing', spIn);
                bIn = document.createElement('input');
                bIn.type = 'number';
                bIn.min = '0';
                bIn.style.cssText = inputStyle;
                bIn.value = String(curBorder);
                mk('tblborder', bIn);
                alignSel = document.createElement('select');
                alignSel.style.cssText = inputStyle;
                (
                    [
                        ['', 'alignnone'],
                        ['left', 'alignleft'],
                        ['center', 'aligncenter'],
                        ['right', 'alignright']
                    ] as [string, keyof I18nStrings][]
                ).forEach(([v, k]) => {
                    const o = document.createElement('option');
                    o.value = v;
                    o.textContent = this.t(k);
                    if (v === curAlign) o.selected = true;
                    alignSel.appendChild(o);
                });
                mk('tblalign', alignSel);
            },
            [
                { label: this.t('cancel'), action: () => this.closeDlg() },
                {
                    label: this.t('save'),
                    primary: true,
                    action: () => {
                        this.applyTableProps(table, {
                            width: wIn.value.trim(),
                            cellpadding: padIn.value.trim(),
                            cellspacing: spIn.value.trim(),
                            border: bIn.value.trim(),
                            align: alignSel.value
                        });
                        this.closeDlg();
                        this.onChange();
                        this.positionTableHandles();
                    }
                }
            ]
        );
    }

    /* ------------------------------------------- cell / row / column props */
    private currentCell(): HTMLTableCellElement | null {
        let node: Node | null = this.savedRange ? this.savedRange.startContainer : null;
        if (!node || !this.ed.contains(node)) {
            const s = window.getSelection();
            node = s && this.ed.contains(s.anchorNode) ? s.anchorNode : null;
        }
        while (node && node !== this.ed) {
            if ((node as HTMLElement).nodeType === 1 && /^(TD|TH)$/.test((node as HTMLElement).tagName)) {
                return node as HTMLTableCellElement;
            }
            node = node.parentNode;
        }
        return null;
    }

    private toHexColor(c: string): string {
        if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
        const m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(c);
        if (!m) return '';
        return '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('');
    }

    private formRow(body: HTMLElement, label: string, el: HTMLElement): void {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;margin:10px 0;min-width:360px';
        const lbl = document.createElement('span');
        lbl.style.cssText = 'width:120px;color:#556;flex:none';
        lbl.textContent = label;
        row.append(lbl, el);
        body.appendChild(row);
    }

    private formInput(value: string, placeholder = ''): HTMLInputElement {
        const i = document.createElement('input');
        i.type = 'text';
        i.style.cssText = 'flex:1;border:1px solid #cfd6df;border-radius:6px;padding:7px 9px;font:14px inherit;min-width:0';
        i.value = value;
        i.placeholder = placeholder;
        return i;
    }

    private formSelect(options: [string, string][], cur: string): HTMLSelectElement {
        const sel = document.createElement('select');
        sel.style.cssText = 'flex:1;border:1px solid #cfd6df;border-radius:6px;padding:7px 9px;font:14px inherit;background:#fff';
        options.forEach(([v, label]) => {
            const o = document.createElement('option');
            o.value = v;
            o.textContent = label;
            if (v === cur) o.selected = true;
            sel.appendChild(o);
        });
        return sel;
    }

    private formBg(cur: string): { wrap: HTMLElement; color: HTMLInputElement; fill: HTMLInputElement } {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'flex:1;display:flex;align-items:center;gap:8px';
        const hex = this.toHexColor(cur);
        const color = document.createElement('input');
        color.type = 'color';
        color.value = hex || '#ffffff';
        color.style.cssText = 'width:36px;height:29px;border:1px solid #cfd6df;border-radius:4px;padding:1px;background:none;cursor:pointer';
        const lbl = document.createElement('label');
        lbl.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;color:#556';
        const fill = document.createElement('input');
        fill.type = 'checkbox';
        fill.checked = !!hex;
        lbl.append(fill, document.createTextNode(this.t('fill')));
        color.addEventListener('input', () => (fill.checked = true));
        wrap.append(color, lbl);
        return { wrap, color, fill };
    }

    private setOrClear(el: HTMLElement, prop: string, val: string): void {
        if (val) el.style.setProperty(prop, /^(width|height)$/.test(prop) && /^\d+$/.test(val) ? val + 'px' : val);
        else el.style.removeProperty(prop);
    }

    private cellPropsDlg(): void {
        const cell = this.currentCell();
        if (!cell) {
            alert(this.t('nocell'));
            return;
        }
        let wIn: HTMLInputElement;
        let hIn: HTMLInputElement;
        let alignSel: HTMLSelectElement;
        let vSel: HTMLSelectElement;
        let bg: { wrap: HTMLElement; color: HTMLInputElement; fill: HTMLInputElement };
        this.dialog(
            this.t('cellprops').replace('…', ''),
            (body) => {
                wIn = this.formInput(cell.style.width, 'e.g. 120px / 25%');
                this.formRow(body, this.t('tblwidth'), wIn);
                hIn = this.formInput(cell.style.height, 'e.g. 40px');
                this.formRow(body, this.t('tblheight'), hIn);
                alignSel = this.formSelect(
                    [
                        ['', this.t('alignnone')],
                        ['left', this.t('alignleft')],
                        ['center', this.t('aligncenter')],
                        ['right', this.t('alignright')]
                    ],
                    cell.style.textAlign || ''
                );
                this.formRow(body, this.t('tblalign'), alignSel);
                vSel = this.formSelect(
                    [
                        ['', this.t('alignnone')],
                        ['top', this.t('valigntop')],
                        ['middle', this.t('valignmiddle')],
                        ['bottom', this.t('valignbottom')]
                    ],
                    cell.style.verticalAlign || ''
                );
                this.formRow(body, this.t('valign'), vSel);
                bg = this.formBg(cell.style.backgroundColor || '');
                this.formRow(body, this.t('backcolor'), bg.wrap);
            },
            [
                { label: this.t('cancel'), action: () => this.closeDlg() },
                {
                    label: this.t('save'),
                    primary: true,
                    action: () => {
                        this.setOrClear(cell, 'width', wIn.value.trim());
                        this.setOrClear(cell, 'height', hIn.value.trim());
                        this.setOrClear(cell, 'text-align', alignSel.value);
                        this.setOrClear(cell, 'vertical-align', vSel.value);
                        this.setOrClear(cell, 'background-color', bg.fill.checked ? bg.color.value : '');
                        this.closeDlg();
                        this.onChange();
                        this.positionTableHandles();
                    }
                }
            ]
        );
    }

    private rowPropsDlg(): void {
        const cell = this.currentCell();
        if (!cell) {
            alert(this.t('nocell'));
            return;
        }
        const row = cell.parentElement as HTMLTableRowElement;
        let hIn: HTMLInputElement;
        let bg: { wrap: HTMLElement; color: HTMLInputElement; fill: HTMLInputElement };
        this.dialog(
            this.t('rowprops').replace('…', ''),
            (body) => {
                hIn = this.formInput(row.style.height, 'e.g. 40px');
                this.formRow(body, this.t('tblheight'), hIn);
                bg = this.formBg(row.style.backgroundColor || '');
                this.formRow(body, this.t('backcolor'), bg.wrap);
            },
            [
                { label: this.t('cancel'), action: () => this.closeDlg() },
                {
                    label: this.t('save'),
                    primary: true,
                    action: () => {
                        this.setOrClear(row, 'height', hIn.value.trim());
                        this.setOrClear(row, 'background-color', bg.fill.checked ? bg.color.value : '');
                        this.closeDlg();
                        this.onChange();
                        this.positionTableHandles();
                    }
                }
            ]
        );
    }

    private colPropsDlg(): void {
        const cell = this.currentCell();
        if (!cell) {
            alert(this.t('nocell'));
            return;
        }
        const row = cell.parentElement as HTMLTableRowElement;
        const table = cell.closest('table') as HTMLTableElement;
        const idx = Array.from(row.children).indexOf(cell);
        const colCells = Array.from(table.rows)
            .map((r) => r.cells[idx])
            .filter(Boolean) as HTMLTableCellElement[];
        let wIn: HTMLInputElement;
        let bg: { wrap: HTMLElement; color: HTMLInputElement; fill: HTMLInputElement };
        this.dialog(
            this.t('colprops').replace('…', ''),
            (body) => {
                wIn = this.formInput(cell.style.width, 'e.g. 120px / 25%');
                this.formRow(body, this.t('tblwidth'), wIn);
                bg = this.formBg(cell.style.backgroundColor || '');
                this.formRow(body, this.t('backcolor'), bg.wrap);
            },
            [
                { label: this.t('cancel'), action: () => this.closeDlg() },
                {
                    label: this.t('save'),
                    primary: true,
                    action: () => {
                        colCells.forEach((c) => {
                            this.setOrClear(c, 'width', wIn.value.trim());
                            this.setOrClear(c, 'background-color', bg.fill.checked ? bg.color.value : '');
                        });
                        this.closeDlg();
                        this.onChange();
                        this.positionTableHandles();
                    }
                }
            ]
        );
    }

    /* ---------------------------------------------------------- dialogs */
    private closeDlg(): void {
        if (this.dlgOvl) {
            this.dlgOvl.remove();
            this.dlgOvl = null;
        }
    }

    private dialog(title: string, bodyBuild: (body: HTMLElement) => void, buttons?: DialogButton[]): void {
        this.closeDlg();
        this.closePop();
        this.dlgOvl = document.createElement('div');
        this.dlgOvl.className = 'ovl';
        const d = document.createElement('div');
        d.className = 'dlg';
        d.dir = this.dir();
        d.innerHTML = `<header><span>${title}</span><button type="button">×</button></header>
                   <div class="body"></div><footer></footer>`;
        (d.querySelector('header button') as HTMLButtonElement).onclick = () => this.closeDlg();
        bodyBuild(d.querySelector('.body') as HTMLElement);
        (buttons || [{ label: this.t('close'), primary: true, action: () => this.closeDlg() }]).forEach((b) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = b.label;
            if (b.primary) btn.className = 'pri';
            btn.onclick = b.action;
            d.querySelector('footer')!.appendChild(btn);
        });
        this.dlgOvl.appendChild(d);
        this.dlgOvl.addEventListener('mousedown', (e) => {
            if (e.target === this.dlgOvl) this.closeDlg();
        });
        document.body.appendChild(this.dlgOvl);
    }

    private sourceDlg(): void {
        let ta: HTMLTextAreaElement;
        this.dialog(
            this.t('srcttl'),
            (body) => {
                ta = document.createElement('textarea');
                ta.value = this.ed.innerHTML.replace(/></g, '>\n<');
                body.appendChild(ta);
            },
            [
                { label: this.t('cancel'), action: () => this.closeDlg() },
                {
                    label: this.t('save'),
                    primary: true,
                    action: () => {
                        this.ed.innerHTML = ta.value;
                        this.closeDlg();
                        this.onChange();
                    }
                }
            ]
        );
    }

    private helpDlg(): void {
        this.dialog(this.t('helpttl'), (body) => {
            const rows = [
                ['Ctrl+B', this.t('bold')],
                ['Ctrl+I', this.t('italic')],
                ['Ctrl+U', this.t('underline')],
                ['Ctrl+Z', this.t('undo')],
                ['Ctrl+Y', this.t('redo')],
                ['Ctrl+A', this.t('selectall')],
                ['Alt+0', this.t('helpttl')]
            ];
            body.innerHTML = `<p style="color:#556">${this.t('shortcuts')}</p>
        <table class="kbd">${rows.map((r) => `<tr><td>${r[1]}</td><td><kbd>${r[0]}</kbd></td></tr>`).join('')}</table>`;
        });
    }

    private wordCountDlg(): void {
        this.dialog(this.t('wcttl'), (body) => {
            body.innerHTML = `<table class="kbd">
        <tr><td>${this.t('wcwords')}</td><td>${this.countWords()}</td></tr>
        <tr><td>${this.t('wcchars')}</td><td>${this.ed.textContent?.replace(/\s/g, '').length ?? 0}</td></tr></table>`;
        });
    }

    private previewDlg(): void {
        this.dialog(this.t('previewttl'), (body) => {
            const box = document.createElement('div');
            box.style.cssText =
                'width:640px;max-width:78vw;max-height:52vh;overflow:auto;border:1px solid #e3e3e3;border-radius:6px;padding:14px;font-family:Helvetica,Arial,sans-serif;font-size:14px';
            box.innerHTML = this.ed.innerHTML;
            body.appendChild(box);
        });
    }

    private charMap(): void {
        this.dialog(
            this.t('charmap').replace('…', ''),
            (body) => {
                const g = document.createElement('div');
                g.className = 'chgrid';
                CHARS.forEach((ch) => {
                    const b = document.createElement('button');
                    b.textContent = ch;
                    b.onclick = () => {
                        this.closeDlg();
                        this.exec('insertText', ch);
                    };
                    g.appendChild(b);
                });
                body.appendChild(g);
            }
        );
    }

    private printDoc(): void {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(
            `<html dir="${this.dir()}"><body style="font-family:Helvetica,Arial,sans-serif;font-size:14px">${this.ed.innerHTML}</body></html>`
        );
        w.document.close();
        w.focus();
        w.print();
    }

    private pickImage(): void {
        this.imgInput.value = '';
        this.imgInput.click();
    }

    /* ---------------------------------------------- image upload placeholder */
    private insertImagePlaceholder(): void {
        this.restoreSel();
        const id = 'img-ph-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        document.execCommand(
            'insertHTML',
            false,
            `<div class="img-ph" id="${id}" contenteditable="false">${IC.image}<span>${this.t('dropimage')}</span></div>`
        );
        const ph = this.ed.querySelector('#' + id) as HTMLElement | null;
        if (ph) {
            ph.removeAttribute('id');
            this.selectImgPlaceholder(ph);
        }
        this.onChange();
    }

    private clearImgPlaceholderSel(): void {
        this.phCtx?.remove();
        this.phCtx = null;
        this.phActive?.classList.remove('active');
        this.phActive = null;
    }

    private removeImgPlaceholder(): void {
        const ph = this.phActive;
        if (!ph) return;
        this.clearImgPlaceholderSel();
        ph.remove();
        this.refreshState();
        this.onChange();
    }

    private selectImgPlaceholder(ph: HTMLElement): void {
        if (this.phActive === ph) return;
        this.clearImgPlaceholderSel();
        this.phActive = ph;
        ph.classList.add('active');
        this.phCtx = document.createElement('div');
        this.phCtx.className = 'imgctx img-ph-ctx';
        this.phCtx.dir = this.dir();
        document.body.appendChild(this.phCtx);
        this.renderPhCtxButtons();
    }

    private renderPhCtxButtons(): void {
        const el = this.phCtx;
        if (!el) return;
        el.innerHTML = '';
        el.append(
            this.ctxBtn(IC.uploadic, this.t('uploadimg'), () => {
                this.phUploadTarget = this.phActive;
                this.pickImage();
            }),
            this.ctxBtn(IC.link, this.t('imagelink'), () => this.renderPhCtxUrlInput()),
            this.ctxSep(),
            this.ctxBtn(IC.trash, this.t('deleteimg'), () => this.removeImgPlaceholder())
        );
        this.positionImgPhCtx();
    }

    private renderPhCtxUrlInput(): void {
        const el = this.phCtx;
        if (!el) return;
        el.innerHTML = '';
        const inp = document.createElement('input');
        inp.type = 'url';
        inp.className = 'urlinp';
        inp.placeholder = this.t('imageurlph');
        const ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'txtbtn';
        ok.textContent = this.t('insertimg');
        const submit = () => {
            const url = inp.value.trim();
            const ph = this.phActive;
            if (!ph) return;
            if (!/^(https?:|data:image\/|blob:)/i.test(url)) {
                inp.classList.add('err');
                inp.focus();
                return;
            }
            ok.disabled = true;
            inp.disabled = true;
            /* only place the image once the URL actually loads, so the user
               gets a working preview instead of a broken-image icon */
            const probe = new Image();
            probe.onload = () => this.replacePlaceholderWithImage(ph, url, '');
            probe.onerror = () => {
                ok.disabled = false;
                inp.disabled = false;
                inp.classList.add('err');
                inp.focus();
            };
            probe.src = url;
        };
        ok.addEventListener('click', submit);
        inp.addEventListener('input', () => inp.classList.remove('err'));
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submit();
            } else if (e.key === 'Escape') {
                e.stopPropagation();
                this.renderPhCtxButtons();
            }
        });
        el.append(inp, ok);
        this.positionImgPhCtx();
        inp.focus();
    }

    private readImageFileInto(file: File, ph: HTMLElement): void {
        if (ph.classList.contains('uploading')) return;
        if (this.imageUploadHandler) {
            this.uploadImageFile(file, ph);
            return;
        }
        const fr = new FileReader();
        fr.onload = () => {
            if (this.ed.contains(ph)) this.replacePlaceholderWithImage(ph, fr.result as string, file.name.replace(/"/g, ''));
        };
        fr.readAsDataURL(file);
    }

    /** Runs the host-supplied imageUploadHandler instead of inlining base64,
     *  so apps can route the file to S3 / Azure Blob / their own server. */
    private uploadImageFile(file: File, ph: HTMLElement): void {
        const title = file.name.replace(/"/g, '');
        ph.classList.remove('upload-error');
        ph.classList.add('uploading');
        const span = ph.querySelector('span');
        if (span) span.textContent = this.t('uploading');
        this.imageUploadHandler!(file)
            .then((url) => {
                if (!this.ed.contains(ph)) return;
                this.replacePlaceholderWithImage(ph, url, title);
            })
            .catch((err) => {
                if (!this.ed.contains(ph)) return;
                ph.classList.remove('uploading');
                ph.classList.add('upload-error');
                if (span) span.textContent = this.t('uploadfailed');
                this.onImageUploadError?.(err, file);
            });
    }

    private replacePlaceholderWithImage(ph: HTMLElement, src: string, title: string): void {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        if (title) img.title = title;
        ph.replaceWith(img);
        if (this.phActive === ph) this.clearImgPlaceholderSel();
        this.refreshState();
        this.onChange();
    }

    private positionImgPhCtx(): void {
        if (this.phActive && !document.body.contains(this.phActive)) {
            this.clearImgPlaceholderSel();
            return;
        }
        if (!this.phActive || !this.phCtx) return;
        const r = this.phActive.getBoundingClientRect();
        const cw = this.phCtx.offsetWidth;
        const ch = this.phCtx.offsetHeight;
        let cx = r.left + scrollX + (r.width - cw) / 2;
        cx = Math.max(8 + scrollX, Math.min(cx, scrollX + innerWidth - cw - 8));
        let cy = r.bottom + scrollY + 8;
        if (r.bottom + 8 + ch > innerHeight - 4) cy = Math.max(this.ctxMinTop(), r.top + scrollY - ch - 8);
        this.phCtx.style.left = cx + 'px';
        this.phCtx.style.top = cy + 'px';
    }

    private pickWordDoc(): void {
        this.docInput.value = '';
        this.docInput.click();
    }

    /* ---------------------------------------------------------- fullscreen */
    private toggleFullscreen(): void {
        this.shell.classList.toggle('fullscreen');
        const b = this.toolbar.querySelector('[data-id=fullscreen]') as HTMLElement | null;
        b?.classList.toggle('on', this.shell.classList.contains('fullscreen'));
        this.positionTableHandles();
    }

    /* ---------------------------------------------------------- table resize */
    private clearTableHandles(): void {
        this.tblCorner?.remove();
        this.tblCorner = null;
        this.tblColBars.forEach((b) => b.remove());
        this.tblColBars = [];
        this.tblCtx?.remove();
        this.tblCtx = null;
        this.tblCellMark?.remove();
        this.tblCellMark = null;
        this.tblOpMark?.remove();
        this.tblOpMark = null;
        this.tblOpMarkKind = null;
        this.tblActive?.classList.remove('tbl-selected');
        this.tblActive = null;
    }

    /** Blue outline around the cell that holds the caret, so it is clear
        which cell / row / column the table operations will target. */
    private positionCellMarker(): void {
        if (!this.tblCellMark) return;
        const cell = this.currentCell();
        if (!cell || !this.tblActive || cell.closest('table') !== this.tblActive) {
            this.tblCellMark.style.display = 'none';
            return;
        }
        const r = cell.getBoundingClientRect();
        this.tblCellMark.style.display = 'block';
        this.tblCellMark.style.left = r.left + scrollX + 'px';
        this.tblCellMark.style.top = r.top + scrollY + 'px';
        this.tblCellMark.style.width = r.width + 'px';
        this.tblCellMark.style.height = r.height + 'px';
    }

    /** Dashed highlight over the whole row / column an operation targets,
        shown while its button or menu item is hovered. */
    private setOpTarget(kind: 'row' | 'col' | null): void {
        this.tblOpMarkKind = kind;
        this.positionOpMark();
    }

    private positionOpMark(): void {
        const kind = this.tblOpMarkKind;
        const cell = kind ? this.currentCell() : null;
        if (!kind || !cell || !this.tblActive || cell.closest('table') !== this.tblActive) {
            this.tblOpMark?.remove();
            this.tblOpMark = null;
            return;
        }
        if (!this.tblOpMark) {
            this.tblOpMark = document.createElement('div');
            this.tblOpMark.className = 'tbl-opmark';
            document.body.appendChild(this.tblOpMark);
        }
        const tr = this.tblActive.getBoundingClientRect();
        const cr = cell.getBoundingClientRect();
        const rr = (cell.parentElement as HTMLElement).getBoundingClientRect();
        const left = kind === 'row' ? rr.left : cr.left;
        const top = kind === 'row' ? rr.top : tr.top;
        const width = kind === 'row' ? rr.width : cr.width;
        const height = kind === 'row' ? rr.height : tr.height;
        this.tblOpMark.style.left = left + scrollX + 'px';
        this.tblOpMark.style.top = top + scrollY + 'px';
        this.tblOpMark.style.width = width + 'px';
        this.tblOpMark.style.height = height + 'px';
    }

    /** Lowest allowed top for floating context toolbars — keeps them from
        covering the editor menubar/toolbar when the target sits on the first line. */
    private ctxMinTop(): number {
        return Math.max(scrollY + 4, this.ed.getBoundingClientRect().top + scrollY - 2);
    }

    private ctxBtn(icon: string, tip: string, fn: () => void, id?: string): HTMLButtonElement {
        const b = document.createElement('button');
        b.type = 'button';
        b.title = tip;
        b.innerHTML = icon;
        if (id) b.dataset.id = id;
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', fn);
        return b;
    }

    private ctxSep(): HTMLElement {
        const s = document.createElement('div');
        s.className = 'sep';
        return s;
    }

    private buildTableCtxToolbar(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'tblctx';
        el.dir = this.dir();
        /* hovering a row/column button highlights the row/column it targets */
        const hl = (b: HTMLButtonElement, kind: 'row' | 'col'): HTMLButtonElement => {
            b.addEventListener('mouseenter', () => this.setOpTarget(kind));
            b.addEventListener('mouseleave', () => this.setOpTarget(null));
            return b;
        };
        el.append(
            hl(this.ctxBtn(IC.rowbefore, this.t('rowabove'), () => this.tableOp('rowabove')), 'row'),
            hl(this.ctxBtn(IC.rowafter, this.t('rowbelow'), () => this.tableOp('rowbelow')), 'row'),
            hl(this.ctxBtn(IC.rowdelete, this.t('delrow'), () => this.tableOp('delrow')), 'row'),
            this.ctxSep(),
            hl(this.ctxBtn(IC.colbefore, this.t('colbefore'), () => this.tableOp('colbefore')), 'col'),
            hl(this.ctxBtn(IC.colafter, this.t('colafter'), () => this.tableOp('colafter')), 'col'),
            hl(this.ctxBtn(IC.coldelete, this.t('delcol'), () => this.tableOp('delcol')), 'col'),
            this.ctxSep(),
            this.ctxBtn(IC.trash, this.t('deltable'), () => this.tableOp('deltable')),
            this.ctxBtn(IC.tableic, this.t('tablepropsttl'), () => this.tablePropsDlg())
        );
        document.body.appendChild(el);
        return el;
    }

    private positionTableHandles(): void {
        if (!this.tblActive || !document.body.contains(this.tblActive)) {
            this.clearTableHandles();
            return;
        }
        const rtl = this.ed.getAttribute('dir') === 'rtl';
        const r = this.tblActive.getBoundingClientRect();
        const top = r.top + scrollY;
        const left = r.left + scrollX;
        const right = r.right + scrollX;
        const bottom = r.bottom + scrollY;
        if (this.tblCorner) {
            this.tblCorner.style.top = bottom - 5 + 'px';
            this.tblCorner.style.left = (rtl ? left - 5 : right - 5) + 'px';
            this.tblCorner.style.cursor = rtl ? 'nesw-resize' : 'nwse-resize';
        }
        if (this.tblCtx) {
            const cw = this.tblCtx.offsetWidth;
            const ch = this.tblCtx.offsetHeight;
            let cx = left + (right - left) / 2 - cw / 2;
            cx = Math.max(8 + scrollX, Math.min(cx, scrollX + innerWidth - cw - 8));
            let cy = top - ch - 8;
            if (cy < this.ctxMinTop()) cy = bottom + 8;
            this.tblCtx.style.left = cx + 'px';
            this.tblCtx.style.top = cy + 'px';
        }
        this.tblColBars.forEach((b) => b.remove());
        this.tblColBars = [];
        const row = this.tblActive.rows[0];
        if (row) {
            for (let i = 0; i < row.cells.length - 1; i++) {
                const rA = row.cells[i].getBoundingClientRect();
                const boundaryX = (rtl ? rA.left : rA.right) + scrollX;
                const bar = document.createElement('div');
                bar.className = 'tbl-colbar';
                bar.style.top = top + 'px';
                bar.style.left = boundaryX + 'px';
                bar.style.height = bottom - top + 'px';
                document.body.appendChild(bar);
                bar.addEventListener('mousedown', (e) => this.startColBarDrag(e, i));
                this.tblColBars.push(bar);
            }
        }
        this.positionCellMarker();
        this.positionOpMark();
    }

    private selectTableForResize(table: HTMLTableElement): void {
        if (this.tblActive === table) return;
        this.clearTableHandles();
        this.tblActive = table;
        table.classList.add('tbl-selected');
        this.tblCorner = document.createElement('div');
        this.tblCorner.className = 'tbl-handle';
        document.body.appendChild(this.tblCorner);
        this.tblCorner.addEventListener('mousedown', (e) => this.startTableCornerDrag(e));
        this.tblCellMark = document.createElement('div');
        this.tblCellMark.className = 'tbl-cellmark';
        this.tblCellMark.style.display = 'none';
        document.body.appendChild(this.tblCellMark);
        this.tblCtx = this.buildTableCtxToolbar();
        this.positionTableHandles();
    }

    private withNoTextSelect(fn: (restore: () => void) => void): void {
        const prev = document.body.style.userSelect;
        document.body.style.userSelect = 'none';
        fn(() => {
            document.body.style.userSelect = prev;
        });
    }

    private startTableCornerDrag(e: MouseEvent): void {
        e.preventDefault();
        const table = this.tblActive;
        if (!table) return;
        const rtl = this.ed.getAttribute('dir') === 'rtl';
        const startX = e.clientX;
        const startW = table.getBoundingClientRect().width;
        table.style.tableLayout = table.style.tableLayout || 'fixed';
        this.withNoTextSelect((restore) => {
            const mv = (ev: MouseEvent) => {
                const dx = rtl ? -(ev.clientX - startX) : ev.clientX - startX;
                table.style.width = Math.max(60, Math.round(startW + dx)) + 'px';
                this.positionTableHandles();
            };
            const up = () => {
                window.removeEventListener('mousemove', mv);
                window.removeEventListener('mouseup', up);
                restore();
                this.onChange();
            };
            window.addEventListener('mousemove', mv);
            window.addEventListener('mouseup', up);
        });
    }

    private startColBarDrag(e: MouseEvent, i: number): void {
        e.preventDefault();
        e.stopPropagation();
        const table = this.tblActive;
        if (!table) return;
        const rtl = this.ed.getAttribute('dir') === 'rtl';
        const rows = Array.from(table.rows);
        const colA = rows.map((r) => r.cells[i]).filter(Boolean) as HTMLTableCellElement[];
        const colB = rows.map((r) => r.cells[i + 1]).filter(Boolean) as HTMLTableCellElement[];
        if (!colA.length || !colB.length) return;
        const startX = e.clientX;
        const wA = colA[0].getBoundingClientRect().width;
        const wB = colB[0].getBoundingClientRect().width;
        table.style.tableLayout = 'fixed';
        this.withNoTextSelect((restore) => {
            const mv = (ev: MouseEvent) => {
                const dx = (rtl ? -1 : 1) * (ev.clientX - startX);
                colA.forEach((c) => (c.style.width = Math.max(24, Math.round(wA + dx)) + 'px'));
                colB.forEach((c) => (c.style.width = Math.max(24, Math.round(wB - dx)) + 'px'));
                this.positionTableHandles();
            };
            const up = () => {
                window.removeEventListener('mousemove', mv);
                window.removeEventListener('mouseup', up);
                restore();
                this.onChange();
            };
            window.addEventListener('mousemove', mv);
            window.addEventListener('mouseup', up);
        });
    }

    /* ---------------------------------------------------------- image toolbar / resize */
    private cancelImgHide(): void {
        if (this.imgHideTimer != null) {
            window.clearTimeout(this.imgHideTimer);
            this.imgHideTimer = null;
        }
    }

    private scheduleImgHide(): void {
        this.cancelImgHide();
        this.imgHideTimer = window.setTimeout(() => this.clearImageHandles(), 250);
    }

    private clearImageHandles(): void {
        this.cancelImgHide();
        this.imgHandles.forEach((h) => h.remove());
        this.imgHandles = [];
        this.imgCtx?.remove();
        this.imgCtx = null;
        this.imgActive?.classList.remove('img-selected');
        this.imgActive = null;
    }

    private selectImage(img: HTMLImageElement): void {
        if (this.imgActive === img) return;
        this.clearImageHandles();
        this.imgActive = img;
        img.classList.add('img-selected');
        this.imgHandles = IMG_CORNERS.map((corner) => {
            const h = document.createElement('div');
            h.className = 'img-handle img-handle-' + corner;
            h.dataset.corner = corner;
            h.addEventListener('mousedown', (e) => this.startImageResizeDrag(e, corner));
            h.addEventListener('mouseenter', () => this.cancelImgHide());
            h.addEventListener('mouseleave', () => this.scheduleImgHide());
            document.body.appendChild(h);
            return h;
        });
        this.imgCtx = this.buildImageCtxToolbar(img);
        this.positionImageHandles();
    }

    private buildImageCtxToolbar(img: HTMLImageElement): HTMLElement {
        const el = document.createElement('div');
        el.className = 'imgctx';
        el.dir = this.dir();
        const rebuild = () => {
            const rebuilt = this.buildImageCtxToolbar(img);
            this.imgCtx?.replaceWith(rebuilt);
            this.imgCtx = rebuilt;
            this.positionImageHandles();
        };
        const align = (a: 'left' | 'center' | 'right') => {
            this.setImageAlign(img, a);
            rebuild();
        };
        const isLeft = img.style.float === 'left';
        const isRight = img.style.float === 'right';
        const isCenter = !isLeft && !isRight && img.style.marginLeft === 'auto' && img.style.marginRight === 'auto';
        const mkBtn = (icon: string, tip: string, on: boolean, fn: () => void) => {
            const b = this.ctxBtn(icon, tip, fn);
            b.classList.toggle('on', on);
            return b;
        };
        el.append(
            mkBtn(IC.alignleft, this.t('alignleft'), isLeft, () => align('left')),
            mkBtn(IC.aligncenter, this.t('aligncenter'), isCenter, () => align('center')),
            mkBtn(IC.alignright, this.t('alignright'), isRight, () => align('right')),
            this.ctxSep(),
            mkBtn(IC.rotateleft, this.t('rotateleft'), false, () => {
                this.rotateImage(img, -90);
                rebuild();
            }),
            mkBtn(IC.rotateright, this.t('rotateright'), false, () => {
                this.rotateImage(img, 90);
                rebuild();
            }),
            this.ctxSep(),
            mkBtn(IC.fliphorizontal, this.t('fliphorizontal'), img.dataset.flipx === '1', () => {
                this.flipImage(img, 'x');
                rebuild();
            }),
            mkBtn(IC.flipvertical, this.t('flipvertical'), img.dataset.flipy === '1', () => {
                this.flipImage(img, 'y');
                rebuild();
            }),
            this.ctxSep(),
            mkBtn(IC.trash, this.t('deleteimg'), false, () => {
                img.remove();
                this.clearImageHandles();
                this.onChange();
            })
        );
        el.addEventListener('mousedown', (e) => e.preventDefault());
        el.addEventListener('mouseenter', () => this.cancelImgHide());
        el.addEventListener('mouseleave', () => this.scheduleImgHide());
        document.body.appendChild(el);
        return el;
    }

    private setImageAlign(img: HTMLImageElement, align: 'left' | 'center' | 'right'): void {
        img.style.float = '';
        img.style.display = '';
        img.style.marginLeft = '';
        img.style.marginRight = '';
        img.style.marginBottom = '';
        if (align === 'left') {
            img.style.float = 'left';
            img.style.marginInlineEnd = '1em';
            img.style.marginBottom = '0.5em';
        } else if (align === 'right') {
            img.style.float = 'right';
            img.style.marginInlineStart = '1em';
            img.style.marginBottom = '0.5em';
        } else {
            img.style.display = 'block';
            img.style.marginLeft = 'auto';
            img.style.marginRight = 'auto';
        }
        this.onChange();
    }

    private applyImgTransform(img: HTMLImageElement): void {
        const rot = parseInt(img.dataset.rotate || '0', 10);
        const fx = img.dataset.flipx === '1' ? -1 : 1;
        const fy = img.dataset.flipy === '1' ? -1 : 1;
        img.style.transform = rot || fx < 0 || fy < 0 ? `rotate(${rot}deg) scale(${fx}, ${fy})` : '';
    }

    private rotateImage(img: HTMLImageElement, delta: number): void {
        const rot = (((parseInt(img.dataset.rotate || '0', 10) + delta) % 360) + 360) % 360;
        img.dataset.rotate = String(rot);
        this.applyImgTransform(img);
        this.positionImageHandles();
        this.onChange();
    }

    private flipImage(img: HTMLImageElement, axis: 'x' | 'y'): void {
        const key = axis === 'x' ? 'flipx' : 'flipy';
        img.dataset[key] = img.dataset[key] === '1' ? '' : '1';
        this.applyImgTransform(img);
        this.positionImageHandles();
        this.onChange();
    }

    private positionImageHandles(): void {
        if (!this.imgActive || !document.body.contains(this.imgActive)) {
            this.clearImageHandles();
            return;
        }
        const r = this.imgActive.getBoundingClientRect();
        const top = r.top + scrollY;
        const left = r.left + scrollX;
        const right = r.right + scrollX;
        const bottom = r.bottom + scrollY;
        const cornerPos: Record<ImgCorner, [number, number]> = {
            nw: [left, top],
            ne: [right, top],
            sw: [left, bottom],
            se: [right, bottom]
        };
        this.imgHandles.forEach((h) => {
            const [x, y] = cornerPos[h.dataset.corner as ImgCorner];
            h.style.left = x - 5 + 'px';
            h.style.top = y - 5 + 'px';
        });
        if (this.imgCtx) {
            const cw = this.imgCtx.offsetWidth;
            const ch = this.imgCtx.offsetHeight;
            let cx = left + (right - left) / 2 - cw / 2;
            cx = Math.max(8 + scrollX, Math.min(cx, scrollX + innerWidth - cw - 8));
            let cy = top - ch - 8;
            if (cy < this.ctxMinTop()) cy = bottom + 8;
            this.imgCtx.style.left = cx + 'px';
            this.imgCtx.style.top = cy + 'px';
        }
    }

    private startImageResizeDrag(e: MouseEvent, corner: ImgCorner): void {
        e.preventDefault();
        const img = this.imgActive;
        if (!img) return;
        this.cancelImgHide();
        const startX = e.clientX;
        const startW = img.getBoundingClientRect().width;
        const sign = corner === 'nw' || corner === 'sw' ? -1 : 1;
        this.withNoTextSelect((restore) => {
            const mv = (ev: MouseEvent) => {
                img.style.width = Math.max(24, Math.round(startW + sign * (ev.clientX - startX))) + 'px';
                img.style.height = 'auto';
                this.positionImageHandles();
            };
            const up = () => {
                window.removeEventListener('mousemove', mv);
                window.removeEventListener('mouseup', up);
                restore();
                this.onChange();
            };
            window.addEventListener('mousemove', mv);
            window.addEventListener('mouseup', up);
        });
    }

    /* ---------------------------------------------------------- selection bubble toolbar */
    private toggleBlock(tag: string): void {
        this.exec('formatBlock', this.currentBlock() === tag ? '<p>' : '<' + tag + '>');
    }

    private clearSelToolbar(): void {
        this.selCtx?.remove();
        this.selCtx = null;
    }

    private updateSelToolbar(sel: Selection): void {
        if (this.options.readonly || sel.isCollapsed || !sel.rangeCount) {
            this.clearSelToolbar();
            return;
        }
        const range = sel.getRangeAt(0);
        const r = range.getBoundingClientRect();
        if (!r.width && !r.height) {
            this.clearSelToolbar();
            return;
        }
        if (!this.selCtx) this.selCtx = this.buildSelToolbar();
        this.positionSelToolbar(range);
    }

    private buildSelToolbar(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'selctx';
        el.dir = this.dir();
        const foreBtn = this.ctxBtn(
            '<b style="font:600 15px/1 Georgia,serif">A</b><span class="colorbar" data-cb="fore"></span>',
            this.t('forecolor'),
            () => this.colorMenu(foreBtn, 'fore')
        );
        const backBtn = this.ctxBtn(IC.backcolor, this.t('backcolor'), () => this.colorMenu(backBtn, 'back'));
        backBtn.querySelector('svg')?.insertAdjacentHTML('afterend', '<span class="colorbar" data-cb="back"></span>');
        const caseBtn = this.ctxBtn(IC.caseic, this.t('changecase'), () => this.caseMenu(caseBtn));
        const lhBtn = this.ctxBtn(IC.lineheight, this.t('lineheight'), () => this.lineHeightMenu(lhBtn));
        const wsBtn = this.ctxBtn(IC.wordspacing, this.t('wordspacing'), () => this.wordSpacingMenu(wsBtn));
        el.append(
            this.ctxBtn(IC.bold, this.t('bold'), () => this.exec('bold'), 'bold'),
            this.ctxBtn(IC.italic, this.t('italic'), () => this.exec('italic'), 'italic'),
            foreBtn,
            backBtn,
            this.ctxSep(),
            this.ctxBtn(IC.quote, this.t('quote'), () => this.toggleBlock('blockquote'), 'blockquote'),
            this.ctxBtn('<b style="font:700 12px/1 Arial,sans-serif">H2</b>', this.blockLabel('h2'), () => this.toggleBlock('h2'), 'h2'),
            this.ctxBtn('<b style="font:700 12px/1 Arial,sans-serif">H3</b>', this.blockLabel('h3'), () => this.toggleBlock('h3'), 'h3'),
            this.ctxSep(),
            this.ctxBtn(IC.link, this.t('linkttl'), () => this.linkDlg()),
            caseBtn,
            lhBtn,
            wsBtn
        );
        el.addEventListener('mousedown', (e) => e.preventDefault());
        document.body.appendChild(el);
        this.syncColorSwatches(el);
        return el;
    }

    private positionSelToolbar(range: Range): void {
        if (!this.selCtx) return;
        const r = range.getBoundingClientRect();
        const top = r.top + scrollY;
        const left = r.left + scrollX;
        const right = r.right + scrollX;
        const bottom = r.bottom + scrollY;
        const cw = this.selCtx.offsetWidth;
        const ch = this.selCtx.offsetHeight;
        let cx = left + (right - left) / 2 - cw / 2;
        cx = Math.max(8 + scrollX, Math.min(cx, scrollX + innerWidth - cw - 8));
        let cy = top - ch - 8;
        if (cy < this.ctxMinTop()) cy = bottom + 8;
        this.selCtx.style.left = cx + 'px';
        this.selCtx.style.top = cy + 'px';
    }

    private repositionSelToolbar(): void {
        if (!this.selCtx) return;
        const s = window.getSelection();
        if (s && s.rangeCount && !s.isCollapsed && this.ed.contains(s.anchorNode)) this.positionSelToolbar(s.getRangeAt(0));
    }

    /* ---------------------------------------------------------- state sync */
    private currentBlock(): string {
        const s = window.getSelection();
        if (!s || !s.anchorNode || !this.ed.contains(s.anchorNode)) return 'p';
        const b = this.closestBlock(s.anchorNode);
        return b ? b.tagName.toLowerCase().replace('div', 'p') : 'p';
    }

    /** Element whose computed font reflects the current caret, falling back to the editor root before any selection lands inside it. */
    private fontRefEl(): Element {
        const s = window.getSelection();
        if (s && s.anchorNode && this.ed.contains(s.anchorNode)) {
            return s.anchorNode.nodeType === 1 ? (s.anchorNode as Element) : (s.anchorNode.parentElement as Element);
        }
        return this.ed;
    }

    private currentFont(): string {
        const fam = getComputedStyle(this.fontRefEl()).fontFamily.toLowerCase();
        const hit = this.options.fontFamilyFormats.find(([n, v]) => fam.includes(v.split(',')[0].toLowerCase()));
        return hit ? hit[0] : '';
    }

    private currentSize(): string {
        const px = Math.round(parseFloat(getComputedStyle(this.fontRefEl()).fontSize));
        return px > 0 ? px + 'px' : '';
    }

    private refreshState(): void {
        const s = window.getSelection();
        const inEd = s ? this.ed.contains(s.anchorNode) : false;
        const blkTag = this.currentBlock();
        const containers = [this.toolbar, this.selCtx].filter(Boolean) as HTMLElement[];
        containers.forEach((container) => {
            (
                [
                    'bold',
                    'italic',
                    'underline',
                    'strikeThrough',
                    'justifyLeft',
                    'justifyCenter',
                    'justifyRight',
                    'justifyFull',
                    'insertOrderedList',
                    'insertUnorderedList'
                ] as const
            ).forEach((c) => {
                const b = container.querySelector(`[data-id=${c}]`) as HTMLElement | null;
                if (b) b.classList.toggle('on', inEd && document.queryCommandState(c));
            });
            (['h2', 'h3', 'blockquote'] as const).forEach((tag) => {
                const b = container.querySelector(`[data-id=${tag}]`) as HTMLElement | null;
                if (b) b.classList.toggle('on', inEd && blkTag === tag);
            });
        });
        const blk = s ? this.closestBlock(s.anchorNode) : null;
        const dir = blk?.closest('[dir]')?.getAttribute('dir') || this.ed.getAttribute('dir') || this.dir();
        this.toolbar.querySelector('[data-id=ltr]')?.classList.toggle('on', inEd && dir === 'ltr');
        this.toolbar.querySelector('[data-id=rtl]')?.classList.toggle('on', inEd && dir === 'rtl');
        const setLbl = (id: string, val: string, def?: string) => {
            const l = this.toolbar.querySelector(`[data-id=${id}] .lbl`) as HTMLElement | null;
            if (!l) return;
            l.textContent = val || def || '';
            l.classList.toggle('empty', !val);
        };
        setLbl('fontsel', this.currentFont());
        setLbl('sizesel', this.currentSize().replace('px', ''));
        if (inEd) {
            setLbl('blocksel', BLOCKS.some((b) => b[0] === blkTag) ? this.blockLabel(blkTag) : this.t('para'));
        }
        this.sbWords.textContent = this.countWords() + ' ' + this.t('words');
    }

    private countWords(): number {
        const txt = (this.ed.textContent || '').trim();
        return txt ? txt.split(/\s+/).length : 0;
    }

    /* ---------------------------------------------------------- paste */
    private handlePaste(e: ClipboardEvent): void {
        const cd = e.clipboardData;
        if (!cd) return;
        e.preventDefault();
        const html = cd.getData('text/html');
        const imgItem = Array.from(cd.items).find((i) => i.type.startsWith('image/'));
        if (imgItem && !html) {
            const fr = new FileReader();
            fr.onload = () => {
                document.execCommand('insertHTML', false, `<img src="${fr.result}" alt="">`);
                this.onChange();
            };
            fr.readAsDataURL(imgItem.getAsFile() as Blob);
            return;
        }
        if (html) {
            document.execCommand('insertHTML', false, cleanPastedHTML(html, this.dir()));
        } else {
            document.execCommand('insertHTML', false, normalizeTextPaste(cd.getData('text/plain')));
        }
        this.onChange();
    }

    /* ---------------------------------------------------------- init */
    private initUI(): void {
        this.closePop();
        this.closeDlg();
        this.clearTableHandles();
        this.clearImgPlaceholderSel();
        this.shell.dir = this.dir();
        this.ed.dir = this.dir();
        if (this.options.menubar) this.buildMenubar();
        else this.menubar.style.display = 'none';
        if (this.options.toolbar) this.buildToolbar();
        else this.toolbar.style.display = 'none';
        this.sbHelp.textContent = this.t('statushelp');
        this.refreshState();
    }
}

export default FableEditor;
