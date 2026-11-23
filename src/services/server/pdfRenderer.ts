import PDFDocument from 'pdfkit';

export interface RenderMarkdownPdfOptions {
  title: string;
  subtitle: string;
  codigoProyecto: string;
  estadoAuditoria: string;
  brandHeader?: string;
  markdown: string;
}

function toWinAnsiSafeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[—–]/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\t]/g, '');
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
}

/**
 * Renders Markdown documentation into a clean PDF buffer using PDFKit (no Chromium).
 */
export function renderMarkdownToPdf(
  options: RenderMarkdownPdfOptions,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: toWinAnsiSafeText(options.title),
        Author: toWinAnsiSafeText(options.brandHeader || 'DocuFlow AI'),
        Subject: toWinAnsiSafeText(
          `${options.codigoProyecto} - ${options.subtitle}`,
        ),
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Optional Enterprise White-Label header bar
    if (options.brandHeader) {
      doc
        .rect(doc.page.margins.left, doc.y, contentWidth, 26)
        .fill('#23478D');
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
          toWinAnsiSafeText(options.brandHeader),
          doc.page.margins.left + 12,
          doc.y + 7,
          { width: contentWidth - 24 },
        );
      doc.moveDown(1.4);
    }

    // Document Title & Metadata Header
    doc
      .fillColor('#0D253F')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(toWinAnsiSafeText(options.title));

    doc.moveDown(0.3);
    doc
      .fillColor('#5A6B7C')
      .font('Helvetica')
      .fontSize(10)
      .text(
        toWinAnsiSafeText(
          `Proyecto: ${options.codigoProyecto} | ${options.subtitle} | Estado: ${options.estadoAuditoria}`,
        ),
      );

    doc.moveDown(0.6);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#DCEAF7')
      .lineWidth(1.5)
      .stroke();
    doc.moveDown(0.8);

    const lines = toWinAnsiSafeText(options.markdown).split('\n');
    let inCodeBlock = false;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();

      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        doc.moveDown(0.3);
        continue;
      }

      if (inCodeBlock) {
        doc
          .fillColor('#23478D')
          .font('Courier')
          .fontSize(8.5)
          .text(rawLine || ' ', { indent: 12 });
        continue;
      }

      if (!trimmed) {
        doc.moveDown(0.45);
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        doc.moveDown(0.3);
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .strokeColor('#E8EEF5')
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.5);
        continue;
      }

      if (trimmed.startsWith('# ')) {
        doc.moveDown(0.4);
        doc
          .fillColor('#0D253F')
          .font('Helvetica-Bold')
          .fontSize(15)
          .text(stripInlineMarkdown(trimmed.slice(2)));
        doc.moveDown(0.3);
        continue;
      }

      if (trimmed.startsWith('## ')) {
        doc.moveDown(0.4);
        doc
          .fillColor('#23478D')
          .font('Helvetica-Bold')
          .fontSize(12.5)
          .text(stripInlineMarkdown(trimmed.slice(3)));
        doc.moveDown(0.25);
        continue;
      }

      if (trimmed.startsWith('### ')) {
        doc.moveDown(0.3);
        doc
          .fillColor('#1E60B8')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(stripInlineMarkdown(trimmed.slice(4)));
        doc.moveDown(0.2);
        continue;
      }

      if (trimmed.startsWith('|')) {
        doc
          .fillColor('#0D253F')
          .font('Courier')
          .fontSize(8)
          .text(stripInlineMarkdown(trimmed));
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        doc
          .fillColor('#0D253F')
          .font('Helvetica')
          .fontSize(10)
          .text(`* ${stripInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}`, {
            indent: 14,
            lineGap: 2,
          });
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        doc
          .fillColor('#0D253F')
          .font('Helvetica')
          .fontSize(10)
          .text(stripInlineMarkdown(trimmed), {
            indent: 14,
            lineGap: 2,
          });
        continue;
      }

      doc
        .fillColor('#0D253F')
        .font('Helvetica')
        .fontSize(10)
        .text(stripInlineMarkdown(trimmed), {
          lineGap: 2.5,
        });
    }

    doc.end();
  });
}
