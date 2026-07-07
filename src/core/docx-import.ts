/* Minimal .docx → HTML converter with no dependencies.
   Parses the ZIP container manually and inflates entries with the browser's
   DecompressionStream, then maps WordprocessingML to editor-friendly HTML:
   headings, run formatting, colors, hyperlinks, lists, tables and images. */

interface ZipEntry {
  name: string;
  method: number;
  compSize: number;
  localOffset: number;
}

function parseZip(buf: ArrayBuffer): Map<string, ZipEntry> {
  const d = new DataView(buf);
  const entries = new Map<string, ZipEntry>();
  // find End Of Central Directory record (sig 0x06054b50), scanning back over the comment
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 22 - 0xffff); i--) {
    if (d.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('EOCD not found');
  const count = d.getUint16(eocd + 10, true);
  let p = d.getUint32(eocd + 16, true);
  const utf8 = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (d.getUint32(p, true) !== 0x02014b50) break;
    const method = d.getUint16(p + 10, true);
    const compSize = d.getUint32(p + 20, true);
    const nameLen = d.getUint16(p + 28, true);
    const extraLen = d.getUint16(p + 30, true);
    const commentLen = d.getUint16(p + 32, true);
    const localOffset = d.getUint32(p + 42, true);
    const name = utf8.decode(new Uint8Array(buf, p + 46, nameLen));
    entries.set(name, { name, method, compSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function readEntry(buf: ArrayBuffer, e: ZipEntry): Promise<Uint8Array> {
  const d = new DataView(buf, e.localOffset);
  if (d.getUint32(0, true) !== 0x04034b50) throw new Error('Bad local header');
  const nameLen = d.getUint16(26, true);
  const extraLen = d.getUint16(28, true);
  const start = e.localOffset + 30 + nameLen + extraLen;
  const comp = new Uint8Array(buf.slice(start, start + e.compSize));
  if (e.method === 0) return comp;
  if (e.method !== 8) throw new Error('Unsupported compression method ' + e.method);
  const stream = new Blob([comp as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* ------------------------------------------------------------- helpers */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const kids = (el: Element, name: string): Element[] =>
  Array.from(el.children).filter((c) => c.localName === name);

const kid = (el: Element, ...path: string[]): Element | null => {
  let cur: Element | null = el;
  for (const name of path) {
    if (!cur) return null;
    cur = Array.from(cur.children).find((c) => c.localName === name) || null;
  }
  return cur;
};

const val = (el: Element | null, attrName = 'val'): string => {
  if (!el) return '';
  for (const a of Array.from(el.attributes)) {
    if (a.localName === attrName) return a.value;
  }
  return '';
};

/** A toggle property like <w:b/> is on unless val is explicitly false/0. */
const flagOn = (rPr: Element | null, name: string): boolean => {
  const el = rPr ? kid(rPr, name) : null;
  if (!el) return false;
  const v = val(el);
  return v !== 'false' && v !== '0';
};

const HIGHLIGHTS: Record<string, string> = {
  yellow: '#FFFF00',
  green: '#00FF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  blue: '#0000FF',
  red: '#FF0000',
  darkBlue: '#00008B',
  darkCyan: '#008B8B',
  darkGreen: '#006400',
  darkMagenta: '#8B008B',
  darkRed: '#8B0000',
  darkYellow: '#808000',
  darkGray: '#A9A9A9',
  lightGray: '#D3D3D3',
  black: '#000000',
  white: '#FFFFFF'
};

const IMG_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp'
};

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/* ------------------------------------------------------------- converter */
class DocxConverter {
  constructor(
    private rels: Map<string, string>,
    private images: Map<string, string>,
    private numFmt: Map<string, 'ul' | 'ol'>
  ) {}

  convertBody(body: Element): string {
    let html = '';
    // stack of open lists for nested numbering
    let listStack: Array<'ul' | 'ol'> = [];
    const closeLists = (depth: number) => {
      while (listStack.length > depth) html += `</${listStack.pop()}>`;
    };
    for (const child of Array.from(body.children)) {
      if (child.localName === 'p') {
        const list = this.paraList(child);
        if (list) {
          const depth = list.ilvl + 1;
          while (listStack.length > depth) html += `</${listStack.pop()}>`;
          if (listStack.length === depth && listStack[depth - 1] !== list.type) {
            html += `</${listStack.pop()}>`;
          }
          while (listStack.length < depth) {
            html += `<${list.type}>`;
            listStack.push(list.type);
          }
          html += `<li>${this.runsOf(child) || '<br>'}</li>`;
          continue;
        }
        closeLists(0);
        html += this.convertPara(child);
      } else if (child.localName === 'tbl') {
        closeLists(0);
        html += this.convertTable(child);
      } else if (child.localName === 'sectPr') {
        // section properties — no visual content
      }
    }
    closeLists(0);
    return html || '<p><br></p>';
  }

  private paraList(p: Element): { type: 'ul' | 'ol'; ilvl: number } | null {
    const numPr = kid(p, 'pPr', 'numPr');
    if (!numPr) return null;
    const numId = val(kid(numPr, 'numId'));
    if (!numId || numId === '0') return null;
    const ilvl = parseInt(val(kid(numPr, 'ilvl')) || '0', 10) || 0;
    return { type: this.numFmt.get(numId) || 'ul', ilvl: Math.min(ilvl, 8) };
  }

  private convertPara(p: Element): string {
    const pPr = kid(p, 'pPr');
    const style = val(kid(p, 'pPr', 'pStyle'));
    let tag = 'p';
    const m = /^Heading([1-6])$/i.exec(style);
    if (m) tag = 'h' + m[1];
    else if (/^Title$/i.test(style)) tag = 'h1';
    const css: string[] = [];
    const jc = val(kid(p, 'pPr', 'jc'));
    if (jc === 'center') css.push('text-align:center');
    else if (jc === 'right' || jc === 'end') css.push('text-align:right');
    else if (jc === 'both' || jc === 'distribute') css.push('text-align:justify');
    if (pPr && kid(pPr, 'bidi')) css.push('direction:rtl');
    const inner = this.runsOf(p);
    const attrs = css.length ? ` style="${css.join(';')}"` : '';
    return `<${tag}${attrs}>${inner || '<br>'}</${tag}>`;
  }

  private runsOf(el: Element): string {
    let html = '';
    for (const child of Array.from(el.children)) {
      if (child.localName === 'r') html += this.convertRun(child);
      else if (child.localName === 'hyperlink') {
        let href = this.rels.get(val(child, 'id')) || '';
        const anchor = val(child, 'anchor');
        if (!href && anchor) href = '#' + anchor;
        const inner = this.runsOf(child);
        html += href ? `<a href="${esc(href)}">${inner}</a>` : inner;
      } else if (child.localName === 'smartTag' || child.localName === 'ins') {
        html += this.runsOf(child);
      }
    }
    return html;
  }

  private convertRun(r: Element): string {
    const rPr = kid(r, 'rPr');
    let text = '';
    for (const child of Array.from(r.children)) {
      if (child.localName === 't') text += esc(child.textContent || '');
      else if (child.localName === 'br' || child.localName === 'cr') text += '<br>';
      else if (child.localName === 'tab') text += '&emsp;';
      else if (child.localName === 'drawing' || child.localName === 'pict' || child.localName === 'object') {
        text += this.convertImage(child);
      }
    }
    if (!text) return '';
    const css: string[] = [];
    const color = val(rPr ? kid(rPr, 'color') : null);
    if (color && color !== 'auto') css.push('color:#' + color);
    const highlight = val(rPr ? kid(rPr, 'highlight') : null);
    if (highlight && HIGHLIGHTS[highlight]) css.push('background-color:' + HIGHLIGHTS[highlight]);
    const sz = parseFloat(val(rPr ? kid(rPr, 'sz') : null));
    if (sz) css.push('font-size:' + Math.round((sz / 2) * (4 / 3)) + 'px');
    const font = rPr ? kid(rPr, 'rFonts') : null;
    const fontName = val(font, 'ascii') || val(font, 'cs');
    if (fontName) css.push(`font-family:'${fontName}'`);
    if (css.length) text = `<span style="${css.join(';')}">${text}</span>`;
    if (flagOn(rPr, 'b')) text = `<strong>${text}</strong>`;
    if (flagOn(rPr, 'i')) text = `<em>${text}</em>`;
    if (flagOn(rPr, 'u') && val(kid(rPr!, 'u')) !== 'none') text = `<u>${text}</u>`;
    if (flagOn(rPr, 'strike')) text = `<s>${text}</s>`;
    const vert = val(rPr ? kid(rPr, 'vertAlign') : null);
    if (vert === 'superscript') text = `<sup>${text}</sup>`;
    else if (vert === 'subscript') text = `<sub>${text}</sub>`;
    return text;
  }

  private convertImage(holder: Element): string {
    // find any blip (DrawingML) or imagedata (VML) descendant regardless of depth
    let relId = '';
    let widthPx = 0;
    const walk = (el: Element) => {
      if (el.localName === 'blip') relId = relId || val(el, 'embed') || val(el, 'link');
      if (el.localName === 'imagedata') relId = relId || val(el, 'id');
      if (el.localName === 'extent') {
        const cx = parseFloat(el.getAttribute('cx') || '0');
        if (cx) widthPx = Math.round(cx / 9525); // EMU → px
      }
      for (const c of Array.from(el.children)) walk(c);
    };
    walk(holder);
    if (!relId) return '';
    const src = this.images.get(relId);
    if (!src) return '';
    const w = widthPx ? ` width="${widthPx}"` : '';
    return `<img src="${src}" alt=""${w}>`;
  }

  private convertTable(tbl: Element): string {
    let html = '<table style="border-collapse:collapse;width:100%"><tbody>';
    for (const tr of kids(tbl, 'tr')) {
      html += '<tr>';
      for (const tc of kids(tr, 'tc')) {
        const span = parseInt(val(kid(tc, 'tcPr', 'gridSpan')) || '1', 10) || 1;
        const spanAttr = span > 1 ? ` colspan="${span}"` : '';
        let inner = '';
        for (const child of Array.from(tc.children)) {
          if (child.localName === 'p') inner += this.convertPara(child);
          else if (child.localName === 'tbl') inner += this.convertTable(child);
        }
        html += `<td style="border:1px solid #b9c2cc"${spanAttr}>${inner || '<br>'}</td>`;
      }
      html += '</tr>';
    }
    return html + '</tbody></table>';
  }
}

/* ------------------------------------------------------------- entry point */
export async function importDocxToHtml(input: File | Blob | ArrayBuffer): Promise<string> {
  const buf = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
  const entries = parseZip(buf);
  const decoder = new TextDecoder();
  const readXml = async (name: string): Promise<Document | null> => {
    const e = entries.get(name);
    if (!e) return null;
    return new DOMParser().parseFromString(decoder.decode(await readEntry(buf, e)), 'application/xml');
  };

  const doc = await readXml('word/document.xml');
  const body = doc?.getElementsByTagName('*');
  let bodyEl: Element | null = null;
  if (body) {
    for (const el of Array.from(body)) {
      if (el.localName === 'body') {
        bodyEl = el;
        break;
      }
    }
  }
  if (!bodyEl) throw new Error('word/document.xml missing or invalid');

  // relationships: id → target (hyperlinks are absolute, images relative to word/)
  const rels = new Map<string, string>();
  const imageTargets = new Map<string, string>();
  const relsDoc = await readXml('word/_rels/document.xml.rels');
  if (relsDoc) {
    for (const rel of Array.from(relsDoc.getElementsByTagName('*'))) {
      if (rel.localName !== 'Relationship') continue;
      const id = rel.getAttribute('Id') || '';
      const target = rel.getAttribute('Target') || '';
      const type = rel.getAttribute('Type') || '';
      if (/hyperlink/i.test(type)) rels.set(id, target);
      else if (/image/i.test(type)) imageTargets.set(id, target);
    }
  }

  // load referenced images as data URLs
  const images = new Map<string, string>();
  for (const [id, target] of imageTargets) {
    const path = target.startsWith('/') ? target.slice(1) : 'word/' + target.replace(/^\.\//, '');
    const entry = entries.get(path);
    if (!entry) continue;
    const ext = (path.split('.').pop() || '').toLowerCase();
    const mime = IMG_MIME[ext];
    if (!mime) continue; // skip unsupported formats like emf/wmf
    try {
      images.set(id, `data:${mime};base64,${toBase64(await readEntry(buf, entry))}`);
    } catch {
      /* skip broken image */
    }
  }

  // numbering: numId → ul/ol (from level-0 numFmt of the abstract definition)
  const numFmt = new Map<string, 'ul' | 'ol'>();
  const numDoc = await readXml('word/numbering.xml');
  if (numDoc) {
    const abstractFmt = new Map<string, 'ul' | 'ol'>();
    const all = Array.from(numDoc.getElementsByTagName('*'));
    for (const el of all) {
      if (el.localName !== 'abstractNum') continue;
      const id = val(el, 'abstractNumId');
      const lvl0 = kids(el, 'lvl').find((l) => val(l, 'ilvl') === '0') || kids(el, 'lvl')[0];
      const fmt = lvl0 ? val(kid(lvl0, 'numFmt')) : '';
      abstractFmt.set(id, fmt === 'bullet' ? 'ul' : 'ol');
    }
    for (const el of all) {
      if (el.localName !== 'num') continue;
      const numId = val(el, 'numId');
      const absId = val(kid(el, 'abstractNumId'));
      numFmt.set(numId, abstractFmt.get(absId) || 'ul');
    }
  }

  return new DocxConverter(rels, images, numFmt).convertBody(bodyEl);
}
