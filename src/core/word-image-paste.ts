/* Recovers the pictures that desktop Word leaves out of the HTML clipboard flavor.
   Word writes <img src="file:///…/msohtmlclip1/01/clip_image001.png"> — a local temp
   file the browser cannot read — but the same paste also carries a text/rtf flavor
   with every picture embedded as hex inside a {\pict} group. Pairing the two is how
   TinyMCE PowerPaste implements powerpaste_allow_local_images.

   This runs on the RAW html string BEFORE cleanPastedHTML() sees it: the paste engine
   already allows data: URIs, so it needs no change and its behaviour is unaffected.
   Anything this module cannot recover is left exactly as it was, and still ends up on
   the engine's existing "[local image — paste it separately]" placeholder. */

/** Decoded pictures in document order. A slot is null when the picture exists but
 *  cannot be turned into something the browser can show (a true vector metafile). */
export type RtfImages = (string | null)[];

/** Total decoded bytes we are willing to inline from one paste. A Word document full
 *  of full-page screenshots can run to tens of MB; past this we leave the placeholders
 *  rather than freeze the editor building base64 strings. */
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

const USABLE_SRC = /^(https?:|data:image\/|blob:)/i;

/** Scans for `{\keyword …}` groups, tracking brace depth so nested groups such as
 *  `{\*\picprop …}` inside a picture do not terminate the match early (a lazy
 *  `/\{\\pict[\s\S]*?\}/` regex gets this wrong and truncates the hex payload). */
function findGroups(rtf: string, keyword: string): { start: number; end: number; body: string }[] {
  const out: { start: number; end: number; body: string }[] = [];
  const needle = '{\\' + keyword;
  let i = 0;
  while ((i = rtf.indexOf(needle, i)) !== -1) {
    /* the char after the control word must be a delimiter, so \pict does not also
       match \pictscalex and friends */
    const after = rtf[i + needle.length];
    if (after && /[a-z0-9]/i.test(after)) {
      i += needle.length;
      continue;
    }
    let depth = 0;
    let j = i;
    for (; j < rtf.length; j++) {
      const c = rtf[j];
      if (c === '\\') {
        j++;
        continue;
      }
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (!depth) break;
      }
    }
    out.push({ start: i, end: j + 1, body: rtf.slice(i + needle.length, j) });
    i = j + 1;
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function indexOfSig(bytes: Uint8Array, sig: number[]): number {
  outer: for (let i = 0; i + sig.length <= bytes.length; i++) {
    for (let j = 0; j < sig.length; j++) if (bytes[i + j] !== sig[j]) continue outer;
    return i;
  }
  return -1;
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];
const JPG_SIG = [0xff, 0xd8, 0xff];

function decodePict(body: string): string | null {
  let kind: 'image/png' | 'image/jpeg' | 'metafile' | null = null;
  if (/\\pngblip/.test(body)) kind = 'image/png';
  else if (/\\jpegblip/.test(body)) kind = 'image/jpeg';
  else if (/\\wmetafile\d*/.test(body) || /\\emfblip/.test(body)) kind = 'metafile';
  if (!kind) return null;

  /* Each removal leaves a space behind. Deleting outright would glue what surrounded
     it together, and Word ends the picture header with `\bliptagN{\*\blipuid …}`
     hard against the payload: dropping the uid group would let the \bliptag
     parameter's `\d*` run straight on into the hex and eat its leading digits
     (89504e47… -> e470…), which silently corrupts every picture Word sends. */
  let hex = body
    .replace(/\{[^{}]*\}/g, ' ') // nested property groups
    .replace(/\\[a-z]+-?\d*\s?/gi, ' ') // control words
    .replace(/[^0-9a-fA-F]/g, '');
  if (hex.length % 2) hex = hex.slice(0, -1);
  if (!hex) return null;

  const bytes = hexToBytes(hex);
  if (kind === 'metafile') {
    /* Word wraps a bitmap in a metafile for compatibility; when there is a real
       PNG/JPEG inside we can use it. A genuine vector metafile we cannot render. */
    const png = indexOfSig(bytes, PNG_SIG);
    if (png >= 0) return 'data:image/png;base64,' + toBase64(bytes.slice(png));
    const jpg = indexOfSig(bytes, JPG_SIG);
    if (jpg >= 0) return 'data:image/jpeg;base64,' + toBase64(bytes.slice(jpg));
    return null;
  }
  return 'data:' + kind + ';base64,' + toBase64(bytes);
}

/** Every picture in the RTF flavor, in document order. */
export function extractRtfImages(rtf: string): RtfImages {
  if (!rtf || rtf.indexOf('\\pict') === -1) return [];
  /* Word emits {\*\shppict{\pict …}}{\nonshppict{\pict …}} — the second group is a
     legacy duplicate of the first. Dropping it keeps picture order aligned with the
     <img> tags in the HTML flavor. */
  let cleaned = rtf;
  findGroups(rtf, 'nonshppict')
    .reverse()
    .forEach((g) => {
      cleaned = cleaned.slice(0, g.start) + cleaned.slice(g.end);
    });

  let budget = MAX_TOTAL_BYTES;
  return findGroups(cleaned, 'pict').map((g) => {
    if (budget <= 0) return null;
    const data = decodePict(g.body);
    if (data) budget -= data.length * 0.75; // base64 -> approximate byte count
    return data;
  });
}

export interface InjectResult {
  html: string;
  /** The data URIs this call put into the HTML, in the order they were used. Only
   *  these are candidates for the host's imageUploadHandler — data URIs that were
   *  already in the pasted HTML are left alone, so existing paste behaviour is
   *  unchanged. */
  injected: string[];
}

/** CSS length -> px, so a VML shape's size survives as the <img> width/height the
 *  paste engine allows. Unknown units are left for the caller to skip. */
function cssPx(value: string): number | null {
  const m = value.match(/^\s*(-?[\d.]+)\s*(pt|px|in|cm|mm)?\s*$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!isFinite(n) || n <= 0) return null;
  const unit = (m[2] || 'px').toLowerCase();
  const px =
    unit === 'pt' ? (n * 4) / 3 : unit === 'in' ? n * 96 : unit === 'cm' ? (n * 96) / 2.54 : unit === 'mm' ? (n * 96) / 25.4 : n;
  return Math.round(px);
}

function attrOf(tag: string, name: string): string {
  const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'));
  return m ? m[1] ?? m[2] ?? m[3] ?? '' : '';
}

/** Word describes a picture twice: as a VML shape inside a downlevel-hidden
 *  conditional comment, and as a plain <img> fallback after it. With RelyOnVML on —
 *  which is what a cropped picture gets — it writes only the shape, and the paste
 *  engine drops conditional comments, so the picture has no tag left to land on and
 *  disappears. Give those shapes the <img> Word withheld, keeping the shape's size.
 *  Pictures that do have the fallback are recognised by their src and left alone.
 *
 *  The shape's crop attributes are not applied: the picture appears uncropped. */
export function unwrapVmlImages(html: string): string {
  if (!/<v:imagedata\b/i.test(html)) return html;

  /** The <img> Word withheld, or null when it did supply one (recognised by its src)
   *  and the shape is therefore only the duplicate description of the same picture.
   *  `sizing` is whatever markup the shape's style attribute can be read from. */
  const imgFor = (imagedata: string, sizing: string): string | null => {
    const src = attrOf(imagedata, 'src');
    if (!src) return null;
    const quoted = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp('<img\\b[^>]*\\bsrc\\s*=\\s*["\']?' + quoted, 'i').test(html)) return null;
    const style = (sizing.match(/<v:shape\b[^>]*\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i) || []).slice(1).find(Boolean) || '';
    const w = cssPx((style.match(/(?:^|;)\s*width\s*:\s*([^;]+)/i) || [])[1] || '');
    const h = cssPx((style.match(/(?:^|;)\s*height\s*:\s*([^;]+)/i) || [])[1] || '');
    return (
      '<img src="' +
      src.replace(/"/g, '&quot;') +
      '"' +
      (w ? ' width="' + w + '"' : '') +
      (h ? ' height="' + h + '"' : '') +
      '>'
    );
  };

  /* Downlevel-hidden shape: an <img> put inside would stay inside a comment and never
     reach the DOM, so the whole block has to go. */
  let out = html.replace(/<!--\[if [^\]]*\]>([\s\S]*?)<!\[endif\]-->/gi, (block, inner: string) => {
    const data = inner.match(/<v:imagedata\b[^>]*>/i);
    return (data && imgFor(data[0], inner)) || block;
  });

  /* Live shape: with RelyOnVML on, Word writes the shape into the document itself
     (bare, or inside a downlevel-revealed <![if gte vml 1]> that the parser drops),
     counting on the v\:*{behavior:url(#default#VML)} rule it ships in <head>. */
  out = out.replace(/<v:shape\b[^>]*>[\s\S]*?<\/v:shape\s*>/gi, (shape) => {
    const data = shape.match(/<v:imagedata\b[^>]*>/i);
    return (data && imgFor(data[0], shape)) || shape;
  });

  /* An imagedata with no shape left to take its size from. */
  return out.replace(/<v:imagedata\b[^>]*>/gi, (data) => imgFor(data, '') || data);
}

/** Rewrites unusable <img src> values in raw pasted HTML with the pictures given, in
 *  document order. Images that already have a usable src are left alone and do not
 *  consume a slot, so a mixed paste (webmail image + Word image) stays aligned.
 *  Anything without a matching picture keeps its original tag. */
export function injectImages(html: string, imgs: RtfImages): InjectResult {
  if (!html || !imgs.length) return { html, injected: [] };
  const injected: string[] = [];
  let next = 0;
  const out = unwrapVmlImages(html).replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (tag.match(/\ssrc\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
    if (USABLE_SRC.test(src)) return tag;
    const data = imgs[next++];
    if (!data) return tag;
    injected.push(data);
    return /\ssrc\s*=\s*["']/i.test(tag)
      ? tag.replace(/(\ssrc\s*=\s*)(["'])[^"']*\2/i, '$1"' + data + '"')
      : tag.replace(/(\ssrc\s*=\s*)[^\s>]+/i, '$1"' + data + '"');
  });
  return { html: out, injected };
}

/** Pairs the HTML flavor of a Word paste with the pictures in its RTF flavor. */
export function injectRtfImages(html: string, rtf: string): InjectResult {
  if (!html || !rtf) return { html, injected: [] };
  return injectImages(html, extractRtfImages(rtf));
}

/** True when the cleaned HTML still holds images the engine could not resolve — used
 *  to decide whether a bitmap sitting in the clipboard is worth falling back to. */
export function countUnresolvedImages(html: string): number {
  const tags = html.match(/<img\b[^>]*>/gi);
  if (!tags) return 0;
  return tags.filter((tag) => {
    const src = (tag.match(/\ssrc\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
    return !USABLE_SRC.test(src);
  }).length;
}

/** data: URI -> File, so recovered pictures can go through the host's
 *  imageUploadHandler exactly like a picked file does. `baseName` gets the extension
 *  that matches the URI's MIME type. */
export function dataUrlToFile(dataUrl: string, baseName: string): File | null {
  const m = dataUrl.match(/^data:([^;,]+);base64,(.*)$/);
  if (!m) return null;
  const ext = (m[1].split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '') || 'png';
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], baseName + '.' + (ext === 'jpeg' ? 'jpg' : ext), { type: m[1] });
  } catch (e) {
    return null;
  }
}
