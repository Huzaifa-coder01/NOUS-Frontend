/**
 * A tiny, valid, single page PDF generated in the browser.
 *
 * The demo catalog needs real PDF bytes so that "open" / "download" behave the
 * way they will once files come from a real server. Nothing here is used for
 * files a user actually uploads - those keep their original bytes.
 */

const BACKSLASH = String.fromCharCode(92);

function escapeText(value) {
  return String(value)
    .replace(/[^\x20-\x7E]/g, ' ')
    .split(BACKSLASH)
    .join(BACKSLASH + BACKSLASH)
    .split('(')
    .join(`${BACKSLASH}(`)
    .split(')')
    .join(`${BACKSLASH})`);
}

export function createPdfBlob(title, lines = []) {
  const content = [
    `BT /F1 18 Tf 56 780 Td (${escapeText(title)}) Tj ET`,
    ...lines.map(
      (line, index) => `BT /F1 11 Tf 56 ${744 - index * 20} Td (${escapeText(line)}) Tj ET`
    ),
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';

  const offsets = [];

  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const startxref = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return new Blob([pdf], { type: 'application/pdf' });
}
