import type { Book } from '../types';

export function buildPDF(book: Book): string {
  const PW = 595;
  const PH = 842;
  const ML = 62;
  const MT = 72;
  const MB = 68;
  const TW = PW - ML * 2;

  const CWM: Record<string, number> = {
    ' ': 278,
    '!': 278,
    '"': 355,
    '#': 556,
    '$': 556,
    '%': 889,
    '&': 667,
    "'": 222,
    '(': 333,
    ')': 333,
    '*': 389,
    '+': 584,
    ',': 278,
    '-': 333,
    '.': 278,
    '/': 278,
    '0': 556,
    '1': 556,
    '2': 556,
    '3': 556,
    '4': 556,
    '5': 556,
    '6': 556,
    '7': 556,
    '8': 556,
    '9': 556,
    ':': 278,
    ';': 278,
    '<': 584,
    '=': 584,
    '>': 584,
    '?': 556,
    A: 667,
    B: 667,
    C: 722,
    D: 722,
    E: 667,
    F: 611,
    G: 778,
    H: 722,
    I: 278,
    J: 500,
    K: 667,
    L: 611,
    M: 833,
    N: 722,
    O: 778,
    P: 667,
    Q: 778,
    R: 722,
    S: 667,
    T: 611,
    U: 722,
    V: 667,
    W: 944,
    X: 667,
    Y: 667,
    Z: 611,
    '[': 278,
    ']': 278,
    _: 556,
    a: 556,
    b: 556,
    c: 500,
    d: 556,
    e: 556,
    f: 278,
    g: 556,
    h: 556,
    i: 222,
    j: 222,
    k: 500,
    l: 222,
    m: 833,
    n: 556,
    o: 556,
    p: 556,
    q: 556,
    r: 333,
    s: 500,
    t: 278,
    u: 556,
    v: 500,
    w: 722,
    x: 500,
    y: 500,
    z: 500,
  };

  const cw = (c: string, sz: number) => ((CWM[c] ?? 556) / 1000) * sz;
  const sw = (s: string, sz: number) => {
    let w = 0;
    for (const c of s) w += cw(c, sz);
    return w;
  };

  function wrapText(str: string, maxW: number, sz: number): string[] {
    str = str.replace(/\s+/g, ' ').trim();
    if (!str) return [''];
    const words = str.split(' ');
    const lines: string[] = [];
    let cur = '';

    for (const w of words) {
      if (!w) continue;
      const t = cur ? `${cur} ${w}` : w;
      if (sw(t, sz) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = t;
      }
    }

    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  function pe(s: string): string {
    return String(s)
      .replace(/[^\x20-\xFF]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[\r\n]/g, ' ');
  }

  const streams: string[] = [];
  let buf: string[] = [];
  let Y = PH - MT;

  const flush = () => {
    if (buf.length) {
      streams.push(buf.join('\n'));
      buf = [];
    }
  };

  const np = () => {
    flush();
    Y = PH - MT;
  };

  const need = (h: number) => {
    if (Y - h < MB) np();
  };

  function put(text: string, x: number, y: number, sz: number, bold = false, gray: number | null = null) {
    if (gray !== null) buf.push(`${gray.toFixed(2)} g`);
    buf.push(`BT /${bold ? 'F2' : 'F1'} ${sz} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${pe(text)}) Tj ET`);
    if (gray !== null) buf.push('0.00 g');
  }

  function writePara(text: string, sz: number, indent = 0) {
    const lines = wrapText(text.replace(/\n/g, ' ').trim(), TW - indent, sz);
    for (let i = 0; i < lines.length; i += 1) {
      need(sz * 1.55);
      put(lines[i], ML + (i === 0 ? indent : 0), Y, sz);
      Y -= sz * 1.55;
    }
    Y -= sz * 0.45;
  }

  np();
  Y = PH / 2 + 90;
  put(`${book.genre} / ${book.language}`.toUpperCase(), ML, Y, 8, false, 0.65);
  Y -= 22;

  wrapText(book.title, TW, 26).forEach((l) => {
    put(l, ML, Y, 26, true);
    Y -= 32;
  });

  Y -= 12;
  put('------------------------------------------------', ML, Y, 9, false, 0.8);
  Y -= 20;
  put(book.authorName || 'Author', ML, Y, 13, false, 0.25);
  Y -= 14;

  if (book.wordCount > 0) {
    put(`${book.wordCount.toLocaleString()} words - ${book.chapters?.length || 0} chapters`, ML, Y, 9, false, 0.6);
  }

  np();
  put('TABLE OF CONTENTS', ML, Y, 9, true, 0.55);
  Y -= 18;
  put('------------------------------------------------', ML, Y, 7, false, 0.85);
  Y -= 12;

  for (const ch of book.chapters || []) {
    need(14);
    put(`${String(ch.number).padStart(2, '0')}   ${ch.title}`, ML, Y, 11);
    Y -= 14;
  }

  for (const ch of book.chapters || []) {
    np();
    put(`CHAPTER ${ch.number}`, ML, Y, 8, true, 0.6);
    Y -= 15;

    wrapText(ch.title, TW, 20).forEach((l) => {
      need(26);
      put(l, ML, Y, 20, true);
      Y -= 26;
    });

    Y -= 8;
    put('- - - - - - - - - - - - - - - - - - - - - - -', ML, Y, 8, false, 0.82);
    Y -= 14;

    (ch.content || '[No content]')
      .split(/\n{2,}/)
      .filter((p) => p.trim().length > 5)
      .forEach((p) => writePara(p, 11, 12));
  }

  flush();

  const N = streams.length;
  const OC = 1;
  const OP = 2;
  const OF = 3;
  const OB = 4;
  const P0 = 5;
  const S0 = 5 + N;
  const TOT = 5 + N * 2;
  const off = new Array(TOT + 1).fill(0);
  let pdf = '%PDF-1.4\n';

  function obj(id: number, hdr: string, body: string | null = null) {
    off[id] = pdf.length;
    if (body !== null) {
      pdf += `${id} 0 obj\n${hdr}\nstream\n${body}\nendstream\nendobj\n`;
    } else {
      pdf += `${id} 0 obj\n${hdr}\nendobj\n`;
    }
  }

  obj(OC, `<< /Type /Catalog /Pages ${OP} 0 R >>`);
  obj(OP, `<< /Type /Pages /Kids [${Array.from({ length: N }, (_, i) => `${P0 + i} 0 R`).join(' ')}] /Count ${N} >>`);
  obj(OF, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  obj(OB, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  for (let i = 0; i < N; i += 1) {
    obj(
      P0 + i,
      `<< /Type /Page /Parent ${OP} 0 R /MediaBox [0 0 ${PW} ${PH}] /Contents ${S0 + i} 0 R /Resources << /Font << /F1 ${OF} 0 R /F2 ${OB} 0 R >> >> >>`,
    );
  }

  for (let i = 0; i < N; i += 1) {
    obj(S0 + i, `<< /Length ${streams[i].length} >>`, streams[i]);
  }

  const xp = pdf.length;
  pdf += `xref\n0 ${TOT + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= TOT; i += 1) pdf += `${String(off[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${TOT + 1} /Root ${OC} 0 R >>\nstartxref\n${xp}\n%%EOF\n`;

  return pdf;
}

export function pdfToBytes(str: string): Uint8Array {
  const b = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) b[i] = str.charCodeAt(i) & 0xff;
  return b;
}

export function downloadBookPDF(book: Book) {
  const pdfStr = buildPDF(book);
  const bytes = pdfToBytes(pdfStr);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1000);
}
