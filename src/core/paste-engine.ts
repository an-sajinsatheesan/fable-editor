const ALLOWED_TAGS = new Set([
  'p',
  'div',
  'span',
  'br',
  'hr',
  'a',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'sub',
  'sup',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'colgroup',
  'col',
  'img',
  'figure',
  'figcaption',
  'mark'
]);

const ALLOWED_STYLES = new Set([
  'text-align',
  'direction',
  'unicode-bidi',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-decoration-line',
  'color',
  'background-color',
  'background',
  'background-image',
  'background-position',
  'background-repeat',
  'background-size',
  'font-size',
  'font-family',
  'line-height',
  'letter-spacing',
  'vertical-align',
  'text-indent',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-inline-start',
  'margin-inline-end',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-color',
  'border-style',
  'border-width',
  'border-radius',
  'border-collapse',
  'border-spacing',
  'table-layout',
  'float',
  'display',
  'box-sizing',
  'list-style-type',
  'white-space'
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  '*': ['dir', 'lang', 'colspan', 'rowspan'],
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'width', 'height', 'title'],
  col: ['span', 'width'],
  td: ['width', 'valign'],
  th: ['width', 'valign'],
  table: ['width', 'cellpadding', 'cellspacing']
};

export interface StyleMap {
  [key: string]: string;
}

export function styleMap(el: Element): StyleMap {
  const map: StyleMap = {};
  const raw = el.getAttribute && el.getAttribute('style');
  if (!raw) return map;
  raw.split(';').forEach((p) => {
    const i = p.indexOf(':');
    if (i < 1) return;
    map[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim();
  });
  return map;
}

function preClean(html: string): string {
  return html
    .replace(/<!--\[if !supportLists\]-->([\s\S]*?)<!--\[endif\]-->/gi, '$1')
    .replace(/<!--\[if !supportLists\]>([\s\S]*?)<!\[endif\]-->/gi, '$1')
    .replace(/<!\[if !supportLists\]>([\s\S]*?)<!\[endif\]>/gi, '$1')
    .replace(/<!--\[if [\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|xml|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(meta|link)[^>]*>/gi, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<\/?(o|v|w|m|st1):[^>]*>/gi, '');
}

interface MarkerInfo {
  ordered: boolean;
  style?: string;
}

function markerType(mt: string): MarkerInfo {
  if (/^[0-9]+[\.\)،]/.test(mt)) return { ordered: true };
  if (/^[٠-٩۰-۹]+/.test(mt)) return { ordered: true, style: 'arabic-indic' };
  if (/^[ivxlc]{2,}[\.\)]/.test(mt)) return { ordered: true, style: 'lower-roman' };
  if (/^[IVXLC]{2,}[\.\)]/.test(mt)) return { ordered: true, style: 'upper-roman' };
  if (/^[a-z][\.\)]/.test(mt)) return { ordered: true, style: 'lower-alpha' };
  if (/^[A-Z][\.\)]/.test(mt)) return { ordered: true, style: 'upper-alpha' };
  if (/^[ء-ي][\.\)،-]/.test(mt)) return { ordered: true, style: 'arabic-indic' };
  return { ordered: false };
}

function rebuildWordLists(doc: Document): void {
  const isListP = (p: Element) => {
    const s = (p.getAttribute('style') || '') + ' ' + (p.className || '');
    return /mso-list\s*:(?!\s*ignore)/i.test(s) || /MsoListParagraph/i.test(s);
  };
  const groups: HTMLParagraphElement[][] = [];
  let cur: HTMLParagraphElement[] | null = null;
  Array.from(doc.body.querySelectorAll('p')).forEach((p) => {
    if (!isListP(p)) {
      cur = null;
      return;
    }
    const prev = p.previousElementSibling;
    if (cur && prev && cur[cur.length - 1] === prev) cur.push(p);
    else {
      cur = [p];
      groups.push(cur);
    }
  });
  groups.forEach((group) => {
    const stack: { list: HTMLOListElement | HTMLUListElement; level: number }[] = [];
    const rootAnchor = group[0];
    group.forEach((p) => {
      const style = p.getAttribute('style') || '';
      const level = +(style.match(/level(\d+)/i)?.[1] || 1);
      const marker = Array.from(p.querySelectorAll('span')).find((sp) =>
        /mso-list\s*:\s*ignore/i.test(sp.getAttribute('style') || '')
      );
      const mt = marker
        ? marker.textContent?.trim() || ''
        : (p.textContent?.trim().match(/^\S{1,4}/) || [''])[0];
      const { ordered, style: listStyle } = markerType(mt);
      if (marker) marker.remove();
      while (stack.length && stack[stack.length - 1].level > level) stack.pop();
      if (!stack.length || stack[stack.length - 1].level < level) {
        const list = doc.createElement(ordered ? 'ol' : 'ul');
        if (ordered && listStyle) list.style.listStyleType = listStyle;
        if (stack.length) {
          const par = stack[stack.length - 1].list;
          (par.lastElementChild || par).appendChild(list);
        } else {
          rootAnchor.parentNode!.insertBefore(list, rootAnchor);
        }
        stack.push({ list, level });
      }
      const li = doc.createElement('li');
      const keep = styleMap(p);
      const kept = ['text-align', 'direction', 'unicode-bidi', 'color', 'font-size', 'font-family', 'background-color']
        .filter((k) => keep[k])
        .map((k) => k + ':' + keep[k])
        .join(';');
      if (kept) li.setAttribute('style', kept);
      if (p.getAttribute('dir')) li.setAttribute('dir', p.getAttribute('dir')!);
      while (p.firstChild) li.appendChild(p.firstChild);
      stack[stack.length - 1].list.appendChild(li);
      p.remove();
    });
  });
}

function fixGoogleDocs(doc: Document): void {
  doc.querySelectorAll('b[id^="docs-internal-guid"]').forEach((b) => {
    while (b.firstChild) b.parentNode!.insertBefore(b.firstChild, b);
    b.remove();
  });
}

function fixLegacyAttrs(doc: Document): void {
  doc.querySelectorAll('table').forEach((tb) => {
    const htmlTb = tb as HTMLElement;
    if (!styleMap(htmlTb)['border-collapse']) htmlTb.style.borderCollapse = 'collapse';
  });
  doc.querySelectorAll('[align]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const v = htmlEl.getAttribute('align')!.toLowerCase();
    if (htmlEl.tagName.toLowerCase() === 'table') {
      if (v === 'center') {
        htmlEl.style.marginLeft = htmlEl.style.marginLeft || 'auto';
        htmlEl.style.marginRight = htmlEl.style.marginRight || 'auto';
      } else if (v === 'right') htmlEl.style.marginLeft = htmlEl.style.marginLeft || 'auto';
      else if (v === 'left') htmlEl.style.marginRight = htmlEl.style.marginRight || 'auto';
    } else if (['left', 'right', 'center', 'justify'].includes(v)) {
      htmlEl.style.textAlign = htmlEl.style.textAlign || v;
      // Word aligns tables by wrapping them in <div align=...>; text-align
      // does not move a table box, so mirror the alignment onto the table.
      Array.from(htmlEl.children).forEach((ch) => {
        if (ch.tagName.toLowerCase() !== 'table') return;
        const tb = ch as HTMLElement;
        if (v === 'center') {
          tb.style.marginLeft = tb.style.marginLeft || 'auto';
          tb.style.marginRight = tb.style.marginRight || 'auto';
        } else if (v === 'right') tb.style.marginLeft = tb.style.marginLeft || 'auto';
        else if (v === 'left') tb.style.marginRight = tb.style.marginRight || 'auto';
      });
    }
    htmlEl.removeAttribute('align');
  });
  doc.querySelectorAll('center table').forEach((tb) => {
    const htmlTb = tb as HTMLElement;
    htmlTb.style.marginLeft = htmlTb.style.marginLeft || 'auto';
    htmlTb.style.marginRight = htmlTb.style.marginRight || 'auto';
  });
  doc.querySelectorAll('[bgcolor]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.backgroundColor = htmlEl.style.backgroundColor || htmlEl.getAttribute('bgcolor')!;
    htmlEl.removeAttribute('bgcolor');
  });
}

function sanitize(node: Node, doc: Document): void {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      if (tag === 'font') {
        const span = doc.createElement('span');
        if (el.getAttribute('style')) span.setAttribute('style', el.getAttribute('style')!);
        if (el.getAttribute('color')) span.style.color = el.getAttribute('color')!;
        if (el.getAttribute('face')) span.style.fontFamily = el.getAttribute('face')!;
        const sz = el.getAttribute('size');
        if (sz && !span.style.fontSize) {
          const szMap: Record<string, string> = {
            '1': '8pt',
            '2': '10pt',
            '3': '12pt',
            '4': '14pt',
            '5': '18pt',
            '6': '24pt',
            '7': '36pt'
          };
          if (szMap[sz]) span.style.fontSize = szMap[sz];
        }
        while (el.firstChild) span.appendChild(el.firstChild);
        el.replaceWith(span);
        sanitize(span, doc);
        return;
      }
      sanitize(el, doc);
      while (el.firstChild) el.parentNode!.insertBefore(el.firstChild, el);
      el.remove();
      return;
    }
    const allowed = new Set([...(ALLOWED_ATTRS['*'] || []), ...(ALLOWED_ATTRS[tag] || [])]);
    Array.from(el.attributes).forEach((a) => {
      const n = a.name.toLowerCase();
      if (n !== 'style' && !allowed.has(n)) el.removeAttribute(a.name);
    });
    if (tag === 'a') {
      const href = el.getAttribute('href') || '';
      if (!/^(https?:|mailto:|tel:|#)/i.test(href)) el.removeAttribute('href');
    }
    if (tag === 'img') {
      const src = el.getAttribute('src') || '';
      if (!/^(https?:|data:image\/|blob:)/i.test(src)) {
        const ph = doc.createElement('span');
        ph.textContent = '[local image — paste it separately]';
        ph.setAttribute('style', 'color:#a33;font-style:italic;font-size:12px');
        el.replaceWith(ph);
        return;
      }
    }
    const styles = styleMap(el);
    const kept: string[] = [];
    for (const [k, v] of Object.entries(styles)) {
      if (!ALLOWED_STYLES.has(k)) continue;
      if (/expression|javascript|url\s*\(\s*['"]?\s*file:/i.test(v)) continue;
      if (k === 'font-weight' && /^(400|normal)$/i.test(v)) continue;
      if (k === 'font-style' && /^normal$/i.test(v)) continue;
      if (k === 'text-decoration' && /^none$/i.test(v)) continue;
      kept.push(k + ':' + v);
    }
    if (kept.length) el.setAttribute('style', kept.join(';'));
    else el.removeAttribute('style');
    el.removeAttribute('class');
    sanitize(el, doc);
    if (tag === 'span' && !el.attributes.length) {
      while (el.firstChild) el.parentNode!.insertBefore(el.firstChild, el);
      el.remove();
    }
  });
}

interface StyleRule {
  sel: string;
  decls: [string, string][];
}

function extractStyleRules(raw: string): StyleRule[] {
  const rules: StyleRule[] = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    let css = m[1].replace(/<!--|-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    css = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gi, '');
    css = css.replace(/@[\w-]+[^{]*\{[^{}]*\}/g, '');
    let rm: RegExpExecArray | null;
    const rre = /([^{}]+)\{([^}]*)\}/g;
    while ((rm = rre.exec(css))) {
      const decls = rm[2]
        .split(';')
        .map((d) => {
          const i = d.indexOf(':');
          if (i < 1) return null;
          return [d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()] as [string, string];
        })
        .filter((d): d is [string, string] => !!d && !!d[1]);
      if (!decls.length) continue;
      rm[1]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('@'))
        .forEach((sel) => rules.push({ sel, decls }));
    }
  }
  return rules;
}

function applyStyleRules(doc: Document, rules: StyleRule[]): void {
  if (!rules.length) return;
  const addMap = new Map<Element, { [k: string]: string }>();
  rules.forEach(({ sel, decls }) => {
    let els: NodeListOf<Element>;
    try {
      els = doc.querySelectorAll(sel);
    } catch (e) {
      return;
    }
    els.forEach((el) => {
      let m = addMap.get(el);
      if (!m) {
        m = {};
        addMap.set(el, m);
      }
      decls.forEach(([k, v]) => {
        m![k] = v;
      });
    });
  });
  addMap.forEach((m, el) => {
    const have = styleMap(el);
    const hasDir = el.hasAttribute('dir');
    const hasAlign = el.hasAttribute('align');
    const add = Object.entries(m).filter(([k]) => {
      if (k in have) return false;
      if ((k === 'direction' || k === 'unicode-bidi') && hasDir) return false;
      if (k === 'text-align' && (hasAlign || hasDir)) return false;
      if ((k === 'background' || k === 'background-color') && el.hasAttribute('bgcolor')) return false;
      return true;
    });
    if (!add.length) return;
    const prefix = add.map(([k, v]) => k + ':' + v).join(';');
    const cur = el.getAttribute('style');
    el.setAttribute('style', cur ? prefix + ';' + cur : prefix);
  });
}

function normalizeArabicPresentation(s: string): string {
  return s.replace(/[ﭐ-﷿ﹰ-ﻼ]+/g, (m) => m.normalize('NFKC'));
}

function normalizeArabicText(doc: Document): void {
  const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  let n: Node | null;
  while ((n = w.nextNode()))
    if (/[ﭐ-﷿ﹰ-ﻼ]/.test(n.nodeValue || '')) n.nodeValue = normalizeArabicPresentation(n.nodeValue || '');
}

export function cleanPastedHTML(raw: string, editorDir: 'ltr' | 'rtl' = 'ltr'): string {
  const cssRules = extractStyleRules(raw);
  const doc = new DOMParser().parseFromString(preClean(raw), 'text/html');
  applyStyleRules(doc, cssRules);
  if (/class="?Mso|mso-|urn:schemas-microsoft-com/i.test(doc.body.innerHTML)) rebuildWordLists(doc);
  fixGoogleDocs(doc);
  fixLegacyAttrs(doc);
  sanitize(doc.body, doc);
  normalizeArabicText(doc);
  const emptyP = (el: Element | null) => el && el.tagName === 'P' && !el.textContent?.trim() && !el.querySelector('img,table');
  while (emptyP(doc.body.firstElementChild)) doc.body.firstElementChild!.remove();
  while (emptyP(doc.body.lastElementChild)) doc.body.lastElementChild!.remove();
  return doc.body.innerHTML.trim();
}

export function normalizeTextPaste(raw: string): string {
  const txt = normalizeArabicPresentation(raw).replace(/\r/g, '');
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (/\n/.test(txt)) {
    return txt
      .split(/\n{2,}/)
      .map((par) => `<p dir="auto">${esc(par).replace(/\n/g, '<br>') || '<br>'}</p>`)
      .join('');
  }
  return esc(txt);
}
