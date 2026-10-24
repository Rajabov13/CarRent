import type { ReceiptModel } from '@/hooks/useReceiptModel';

/** Roboto (bundled with pdfmake) covers Latin + Cyrillic; map Uzbek modifier letters to safe quotes. */
const safe = (s: string) => s.replace(/ʻ/g, '‘').replace(/ʼ/g, '’');

function docDefinition(m: ReceiptModel) {
  const ink = '#121725';
  const muted = '#657089';
  const accent = '#b45309';
  return {
    pageSize: 'A4' as const,
    pageMargins: [40, 40, 40, 48] as [number, number, number, number],
    info: { title: safe(`${m.title} ${m.reference?.value ?? ''}`.trim()), author: m.platform },
    defaultStyle: { font: 'Roboto', fontSize: 9, color: ink, lineHeight: 1.2 },
    footer: (page: number, count: number) => ({
      text: `${safe(m.platform)} · ${page}/${count}`,
      alignment: 'center' as const,
      fontSize: 7,
      color: muted,
      margin: [0, 16, 0, 0] as [number, number, number, number],
    }),
    content: [
      {
        columns: [
          [
            { text: safe(m.platform), fontSize: 15, bold: true },
            { text: safe(m.title), fontSize: 11, margin: [0, 2, 0, 0] },
          ],
          {
            width: 'auto',
            stack: [
              { text: safe(m.stamp), bold: true, color: accent, fontSize: 11, alignment: 'right' as const },
              ...(m.reference ? [{ text: safe(`${m.reference.label}: ${m.reference.value}`), alignment: 'right' as const, margin: [0, 4, 0, 0] }] : []),
              ...(m.issued ? [{ text: safe(`${m.issued.label}: ${m.issued.value}`), alignment: 'right' as const }] : []),
            ],
          },
        ],
      },
      {
        table: { widths: ['*'], body: [[{ text: safe(m.notConfirmed), color: '#78350f', fontSize: 8.5 }]] },
        layout: { fillColor: () => '#fef3c7', hLineWidth: () => 0, vLineWidth: () => 0, paddingTop: () => 5, paddingBottom: () => 5 },
        margin: [0, 12, 0, 12],
      },
      {
        columns: m.parties.slice(0, 3).map((p) => ({
          stack: [
            { text: safe(p.label).toUpperCase(), fontSize: 7, bold: true, color: muted, margin: [0, 0, 0, 2] },
            ...p.lines.map((line, i) => ({ text: safe(line), bold: i === 0 })),
          ],
        })),
        columnGap: 14,
      },
      {
        columns: m.parties.slice(3).map((p) => ({
          stack: [
            { text: safe(p.label).toUpperCase(), fontSize: 7, bold: true, color: muted, margin: [0, 0, 0, 2] },
            ...p.lines.map((line, i) => ({ text: safe(line), bold: i === 0 })),
          ],
        })),
        columnGap: 14,
        margin: [0, 10, 0, 0],
      },
      {
        columns: m.facts.map((x) => ({
          stack: [
            { text: safe(x.label), fontSize: 7.5, color: muted },
            { text: safe(x.value), bold: true },
          ],
        })),
        columnGap: 14,
        margin: [0, 12, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 40, 90, 90],
          body: [
            m.itemHeaders.map((h, i) => ({ text: safe(h), bold: true, fontSize: 8, color: muted, alignment: i ? ('right' as const) : ('left' as const) })),
            ...m.items.map((it) => [
              { text: safe(it.label) },
              { text: it.qty, alignment: 'right' as const },
              { text: safe(it.unit), alignment: 'right' as const },
              { text: safe(it.amount), alignment: 'right' as const, italics: it.muted, color: it.muted ? muted : ink },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },
      {
        margin: [220, 10, 0, 0] as [number, number, number, number],
        table: {
          widths: ['*', 'auto'],
          body: m.totals.map((x) => [
            {
              stack: [
                { text: safe(x.label), bold: x.strong, fontSize: x.strong ? 10 : 9 },
                ...(x.note ? [{ text: safe(x.note), fontSize: 7, color: muted }] : []),
              ],
            },
            { text: safe(x.value), bold: x.strong, fontSize: x.strong ? 10 : 9, alignment: 'right' as const },
          ]),
        },
        layout: {
          hLineWidth: (i: number) => (i > 0 && m.totals[i - 1]?.strong === false && m.totals[i]?.strong ? 0.6 : 0),
          vLineWidth: () => 0,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },
      ...(m.notes.length
        ? [{ ul: m.notes.map((n) => ({ text: safe(n), fontSize: 8, color: '#41485b' })), margin: [0, 14, 0, 0] as [number, number, number, number] }]
        : []),
      { text: safe(m.termsTitle).toUpperCase(), fontSize: 7, bold: true, color: muted, margin: [0, 14, 0, 4] as [number, number, number, number] },
      ...m.terms.map((x) => ({
        text: [{ text: `${safe(x.label)}: `, bold: true }, { text: safe(x.value) }],
        fontSize: 8,
        margin: [0, 0, 0, 3] as [number, number, number, number],
      })),
      { text: safe(m.footer), fontSize: 7, color: muted, margin: [0, 10, 0, 0] as [number, number, number, number] },
    ],
  };
}

/** Builds the receipt PDF in the browser (pdfmake is loaded on demand) and downloads it. */
export async function downloadReceiptPdf(model: ReceiptModel, filename: string): Promise<void> {
  const [{ default: pdfMake }, { default: vfs }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  (pdfMake as unknown as { vfs: unknown }).vfs = vfs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfMake.createPdf(docDefinition(model) as any).download(filename);
}

export const __test = { docDefinition, safe };
