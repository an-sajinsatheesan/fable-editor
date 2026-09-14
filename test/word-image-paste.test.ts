import { describe, it, expect } from 'vitest';
import {
  countUnresolvedImages,
  dataUrlToFile,
  extractRtfImages,
  injectImages,
  injectRtfImages
} from '../src/core/word-image-paste';
import { cleanPastedHTML } from '../src/core/paste-engine';

const PNG_1x1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9];

const toHex = (bytes: number[]) => bytes.map((b) => b.toString(16).padStart(2, '0')).join('');

const base64ToHex = (b64: string) => {
  const bin = atob(b64);
  const bytes: number[] = [];
  for (let i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
  return toHex(bytes);
};

const bytesToBase64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes));

const pngPict = `{\\*\\shppict{\\pict{\\*\\picprop\\shplid1025}\\pngblip\\picw417\\pich125\\picwgoal1500\\pichgoal1500
${base64ToHex(PNG_1x1).replace(/(.{60})/g, '$1\n')}}}`;

const jpegPict = `{\\*\\shppict{\\pict\\jpegblip\\picw50\\pich50
${toHex(JPEG_BYTES)}}}`;

/* the legacy duplicate Word writes next to \\*\\shppict — must not take a slot */
const nonShpPict = `{\\nonshppict{\\pict\\wmetafile8\\picw417\\pich125 0100090000ffff0000}}`;

const rtfDoc = (...parts: string[]) => `{\\rtf1\\ansi\\deff0\n${parts.join('\n')}\n}`;

const wordImg = (name: string, extra = '') =>
  `<img ${extra}src="file:///C:/Users/x/AppData/Local/Temp/msohtmlclip1/01/${name}">`;

describe('extractRtfImages', () => {
  it('decodes a \\pngblip picture back to the exact bytes', () => {
    const imgs = extractRtfImages(rtfDoc(pngPict));
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toBe('data:image/png;base64,' + PNG_1x1);
  });

  it('decodes a \\jpegblip picture back to the exact bytes', () => {
    const imgs = extractRtfImages(rtfDoc(jpegPict));
    expect(imgs[0]).toBe('data:image/jpeg;base64,' + bytesToBase64(JPEG_BYTES));
  });

  it('drops the \\nonshppict duplicate so picture order still matches the HTML', () => {
    const imgs = extractRtfImages(rtfDoc(pngPict, nonShpPict, jpegPict));
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toContain('image/png');
    expect(imgs[1]).toContain('image/jpeg');
  });

  it('keeps a slot (as null) for a vector metafile it cannot render', () => {
    const vector = `{\\*\\shppict{\\pict\\wmetafile8\\picw100\\pich100 0100090000ffff0000}}`;
    expect(extractRtfImages(rtfDoc(vector))).toEqual([null]);
  });

  it('pulls the bitmap out of a metafile-wrapped picture', () => {
    const wrapped = `{\\*\\shppict{\\pict\\wmetafile8\\picw100\\pich100 0100090000${base64ToHex(PNG_1x1)}}}`;
    expect(extractRtfImages(rtfDoc(wrapped))).toEqual(['data:image/png;base64,' + PNG_1x1]);
  });

  it('returns nothing for RTF without pictures', () => {
    expect(extractRtfImages(rtfDoc('\\par plain text\\par'))).toEqual([]);
  });

  it('keeps the leading bytes when a \\bliptag uid group abuts the payload', () => {
    /* Word's own header: {\*\blipuid …} sits hard against the hex, so removing it
       must not let \bliptag's numeric parameter run on into 89504e47… */
    const asWordWritesIt =
      `{\\*\\shppict{\\pict{\\*\\picprop\\shplid1025}\\pngblip\\picw417\\pich125` +
      `\\bliptag-1141652157{\\*\\blipuid bbe19bc3aa11223344556677}${base64ToHex(PNG_1x1)}}}`;
    expect(extractRtfImages(rtfDoc(asWordWritesIt))).toEqual(['data:image/png;base64,' + PNG_1x1]);
  });
});

describe('injectRtfImages', () => {
  it('replaces a Word file:// src with the picture from the RTF flavor', () => {
    const html = `<p>Before</p><p>${wordImg('clip_image001.png', 'width=417 height=125 ')}</p><p>After</p>`;
    const res = injectRtfImages(html, rtfDoc(pngPict));
    expect(res.html).toContain('src="data:image/png;base64,' + PNG_1x1 + '"');
    expect(res.injected).toEqual(['data:image/png;base64,' + PNG_1x1]);
    expect(res.html).toContain('width=417');
  });

  it('leaves an already-usable src alone without consuming a picture slot', () => {
    const html =
      `<p><img src="https://cdn.example.com/keep.png"></p>` +
      `<p>${wordImg('clip_image001.png')}</p>`;
    const res = injectRtfImages(html, rtfDoc(pngPict));
    expect(res.html).toContain('src="https://cdn.example.com/keep.png"');
    expect(res.html).toContain('data:image/png;base64,' + PNG_1x1);
    expect(res.injected).toHaveLength(1);
  });

  it('handles unquoted src attributes', () => {
    const html = `<p><img width=417 src=file:///C:/Temp/clip_image001.png></p>`;
    expect(injectRtfImages(html, rtfDoc(pngPict)).html).toContain('src="data:image/png;base64,');
  });

  it('leaves the HTML untouched when there is no RTF flavor', () => {
    const html = `<p>${wordImg('clip_image001.png')}</p>`;
    expect(injectRtfImages(html, '').html).toBe(html);
    expect(injectRtfImages(html, '').injected).toEqual([]);
  });

  it('leaves the HTML untouched when the RTF holds no pictures', () => {
    const html = `<p>${wordImg('clip_image001.png')}</p>`;
    expect(injectRtfImages(html, rtfDoc('\\par text\\par')).html).toBe(html);
  });

  it('keeps the original tag when the matching picture is undecodable', () => {
    const vector = `{\\*\\shppict{\\pict\\wmetafile8\\picw100\\pich100 0100090000ffff0000}}`;
    const html = `<p>${wordImg('clip_image001.wmf')}</p>`;
    expect(injectRtfImages(html, rtfDoc(vector)).html).toBe(html);
  });

  it('maps several pictures onto several images in document order', () => {
    const html = `<p>${wordImg('clip_image001.png')}</p><p>${wordImg('clip_image002.jpg')}</p>`;
    const res = injectRtfImages(html, rtfDoc(pngPict, nonShpPict, jpegPict));
    const srcs = [...res.html.matchAll(/src="(data:[^;]+);/g)].map((m) => m[1]);
    expect(srcs).toEqual(['data:image/png', 'data:image/jpeg']);
  });
});

describe('injectImages', () => {
  it('fills the single unresolved image from a clipboard bitmap', () => {
    const html = `<p>${wordImg('clip_image001.png')}</p>`;
    const res = injectImages(html, ['data:image/png;base64,' + PNG_1x1]);
    expect(res.html).toContain('data:image/png;base64,');
    expect(res.injected).toHaveLength(1);
  });
});

describe('countUnresolvedImages', () => {
  it('counts only images the engine could not resolve', () => {
    const html =
      `<img src="https://a/b.png">` +
      `<img src="data:image/png;base64,${PNG_1x1}">` +
      `${wordImg('clip_image001.png')}` +
      `<img src="cid:image001@01D9">`;
    expect(countUnresolvedImages(html)).toBe(2);
  });

  it('is zero for HTML with no images', () => {
    expect(countUnresolvedImages('<p>text</p>')).toBe(0);
  });
});

describe('dataUrlToFile', () => {
  it('rebuilds a File with the extension matching the MIME type', () => {
    const file = dataUrlToFile('data:image/png;base64,' + PNG_1x1, 'pasted-image-1');
    expect(file).not.toBeNull();
    expect(file!.name).toBe('pasted-image-1.png');
    expect(file!.type).toBe('image/png');
    expect(file!.size).toBeGreaterThan(0);
  });

  it('maps image/jpeg to a .jpg name', () => {
    const file = dataUrlToFile('data:image/jpeg;base64,' + bytesToBase64(JPEG_BYTES), 'shot');
    expect(file!.name).toBe('shot.jpg');
  });

  it('returns null for anything that is not a base64 data URI', () => {
    expect(dataUrlToFile('https://example.com/a.png', 'x')).toBeNull();
  });
});

describe('paste pipeline end to end', () => {
  const wordHtml =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office"><body>` +
    `<p class=MsoNormal>Before the picture<o:p></o:p></p>` +
    `<p class=MsoNormal><span style='mso-no-proof:yes'>${wordImg('clip_image001.png', 'width=417 height=125 ')}</span></p>` +
    `<p class=MsoNormal>After the picture</p></body></html>`;

  it('keeps the image and its Word size once the RTF pre-pass has run', () => {
    const out = cleanPastedHTML(injectRtfImages(wordHtml, rtfDoc(pngPict)).html, 'ltr');
    expect(out).toMatch(/<img[^>]+src="data:image\/png;base64,/);
    expect(out).toContain('width="417"');
    expect(out).toContain('height="125"');
    expect(out).not.toContain('[local image');
  });

  it('still falls back to the engine placeholder when nothing can be recovered', () => {
    const out = cleanPastedHTML(injectRtfImages(wordHtml, '').html, 'ltr');
    expect(out).toContain('[local image — paste it separately]');
    expect(out).not.toMatch(/<img/);
  });

  /* A cropped picture makes Word turn RelyOnVML on: it then describes the picture
     only as a VML shape inside a conditional comment, with no <img> fallback. */
  const vmlOnlyHtml =
    `<html xmlns:v="urn:schemas-microsoft-com:vml"><body>` +
    `<p class=MsoNormal>Before the picture</p>` +
    `<p class=MsoNormal><!--[if gte vml 1]><v:shape id="Picture_x0020_1" ` +
    `style='width:312.75pt;height:152.25pt'><v:imagedata ` +
    `src="file:///C:/Users/x/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png" ` +
    `o:title="" croptop="5120f" cropbottom="3605f"/></v:shape><![endif]--></p>` +
    `<p class=MsoNormal>After the picture</p></body></html>`;

  it('recovers a picture Word described only as a VML shape', () => {
    const res = injectRtfImages(vmlOnlyHtml, rtfDoc(pngPict));
    expect(res.injected).toEqual(['data:image/png;base64,' + PNG_1x1]);
    const out = cleanPastedHTML(res.html, 'ltr');
    expect(out).toMatch(/<img[^>]+src="data:image\/png;base64,/);
    expect(out).toContain('width="417"'); /* 312.75pt */
    expect(out).toContain('height="203"'); /* 152.25pt */
    expect(out).not.toContain('[local image');
  });

  /* …and with RelyOnVML it writes that shape as live markup instead, inside a
     downlevel-revealed conditional the parser drops. */
  const vmlLiveHtml =
    `<html xmlns:v="urn:schemas-microsoft-com:vml"><head>` +
    `<!--[if !mso]><style>v\\:* {behavior:url(#default#VML);}</style><![endif]-->` +
    `<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:RelyOnVML/></o:OfficeDocumentSettings></xml><![endif]-->` +
    `</head><body><p class=MsoNormal>Before the picture</p>` +
    `<p class=MsoNormal><![if gte vml 1]><v:shapetype id="_x0000_t75" coordsize="21600,21600" ` +
    `o:spt="75"><v:stroke joinstyle="miter"/></v:shapetype>` +
    `<v:shape id="Picture_x0020_1" o:spid="_x0000_i1025" type="#_x0000_t75" ` +
    `style='width:312.75pt;height:152.25pt;visibility:visible;mso-wrap-style:square'>` +
    `<v:imagedata src="file:///C:/Users/x/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png" ` +
    `o:title="" croptop="5120f" cropbottom="3605f"/></v:shape><![endif]></p>` +
    `<p class=MsoNormal>After the picture</p></body></html>`;

  it('recovers a picture Word wrote as a live VML shape (RelyOnVML)', () => {
    const res = injectRtfImages(vmlLiveHtml, rtfDoc(pngPict));
    expect(res.injected).toEqual(['data:image/png;base64,' + PNG_1x1]);
    const out = cleanPastedHTML(res.html, 'ltr');
    expect(out).toMatch(/<img[^>]+src="data:image\/png;base64,/);
    expect(out).toContain('width="417"');
    expect(out).toContain('height="203"');
    expect(out).not.toContain('[local image');
  });

  it('recovers a bare <v:imagedata> with no shape around it', () => {
    const bare = vmlLiveHtml.replace(/<v:shape\b[^>]*>/i, '').replace('</v:shape>', '');
    const out = cleanPastedHTML(injectRtfImages(bare, rtfDoc(pngPict)).html, 'ltr');
    expect(out).toMatch(/<img[^>]+src="data:image\/png;base64,/);
  });

  it('does not duplicate the picture when Word also wrote the <img> fallback', () => {
    const both =
      vmlOnlyHtml.replace(
        '<![endif]-->',
        `<![endif]--><![if !vml]>${wordImg('clip_image001.png', 'width=417 height=125 ')}<![endif]>`
      );
    const out = cleanPastedHTML(injectRtfImages(both, rtfDoc(pngPict)).html, 'ltr');
    expect(out.match(/<img/g)).toHaveLength(1);
    expect(out).toContain('height="125"'); /* the fallback's size, not the shape's */
  });
});
