import { describe, it, expect } from 'vitest';
import { importDocxToHtml } from '../src/core/docx-import';

/* Builds an uncompressed (method 0) ZIP so the test does not depend on
   DecompressionStream being available in the test runtime. */
function zipStore(files: Record<string, string>): ArrayBuffer {
  const enc = new TextEncoder();
  const chunks: number[] = [];
  const central: number[] = [];
  const u16 = (arr: number[], v: number) => arr.push(v & 0xff, (v >> 8) & 0xff);
  const u32 = (arr: number[], v: number) => arr.push(v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff);

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(content);
    const offset = chunks.length;
    u32(chunks, 0x04034b50);
    u16(chunks, 20); // version needed
    u16(chunks, 0); // flags
    u16(chunks, 0); // method: stored
    u32(chunks, 0); // time+date
    u32(chunks, 0); // crc (not validated by the importer)
    u32(chunks, data.length);
    u32(chunks, data.length);
    u16(chunks, nameBytes.length);
    u16(chunks, 0); // extra len
    chunks.push(...nameBytes, ...data);

    u32(central, 0x02014b50);
    u16(central, 20); // version made by
    u16(central, 20); // version needed
    u16(central, 0); // flags
    u16(central, 0); // method
    u32(central, 0); // time+date
    u32(central, 0); // crc
    u32(central, data.length);
    u32(central, data.length);
    u16(central, nameBytes.length);
    u16(central, 0); // extra
    u16(central, 0); // comment
    u16(central, 0); // disk
    u16(central, 0); // internal attrs
    u32(central, 0); // external attrs
    u32(central, offset);
    central.push(...nameBytes);
  }

  const cdOffset = chunks.length;
  chunks.push(...central);
  u32(chunks, 0x06054b50);
  u16(chunks, 0);
  u16(chunks, 0);
  u16(chunks, Object.keys(files).length);
  u16(chunks, Object.keys(files).length);
  u32(chunks, central.length);
  u32(chunks, cdOffset);
  u16(chunks, 0); // comment len
  return new Uint8Array(chunks).buffer;
}

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

describe('importDocxToHtml', () => {
  it('converts headings, formatting, alignment and hyperlinks', async () => {
    const docx = zipStore({
      'word/document.xml': `<?xml version="1.0"?>
        <w:document ${W} ${R}><w:body>
          <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Title</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>BoldItalic</w:t></w:r>
            <w:r><w:rPr><w:color w:val="FF0000"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve"> red</w:t></w:r>
          </w:p>
          <w:p><w:hyperlink r:id="rId1"><w:r><w:t>site</w:t></w:r></w:hyperlink></w:p>
        </w:body></w:document>`,
      'word/_rels/document.xml.rels': `<?xml version="1.0"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com" TargetMode="External"/>
        </Relationships>`
    });
    const html = await importDocxToHtml(docx);
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('text-align:center');
    expect(html).toContain('<strong>');
    expect(html).toContain('<em>');
    expect(html).toContain('color:#FF0000');
    expect(html).toContain('font-size:16px'); // 24 half-points = 12pt = 16px
    expect(html).toContain('<a href="https://example.com">site</a>');
  });

  it('converts bullet and numbered lists', async () => {
    const docx = zipStore({
      'word/document.xml': `<?xml version="1.0"?>
        <w:document ${W}><w:body>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>one</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>two</w:t></w:r></w:p>
          <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>first</w:t></w:r></w:p>
        </w:body></w:document>`,
      'word/numbering.xml': `<?xml version="1.0"?>
        <w:numbering ${W}>
          <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum>
          <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum>
          <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
          <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
        </w:numbering>`
    });
    const html = await importDocxToHtml(docx);
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>');
    expect(html).toContain('<ol><li>first</li></ol>');
  });

  it('converts tables', async () => {
    const docx = zipStore({
      'word/document.xml': `<?xml version="1.0"?>
        <w:document ${W}><w:body>
          <w:tbl><w:tr>
            <w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc>
          </w:tr></w:tbl>
        </w:body></w:document>`
    });
    const html = await importDocxToHtml(docx);
    expect(html).toContain('<table');
    expect(html).toContain('A1');
    expect(html).toContain('B1');
    expect((html.match(/<td/g) || []).length).toBe(2);
  });

  it('rejects files without word/document.xml', async () => {
    const notDocx = zipStore({ 'hello.txt': 'hi' });
    await expect(importDocxToHtml(notDocx)).rejects.toThrow();
  });
});
