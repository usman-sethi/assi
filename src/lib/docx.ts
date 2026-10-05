import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  Footer,
  PageNumber,
  UnderlineType,
  ShadingType,
} from 'docx';
import { AssignmentData } from '../types/assignment.js';

interface DocxRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  size?: number;
}

/**
 * Parses simple inline formatting (bold, italic, underline) from an HTML chunk
 */
function parseInlineHtml(html: string): DocxRun[] {
  // Strip block tags if any leaked in
  const clean = html.replace(/<\/?(div|p|h[1-6]|ul|ol|li|blockquote)[^>]*>/gi, '');
  const runs: DocxRun[] = [];

  // Match tags or plain text tokens
  const tokenRegex = /(<b>|<strong>|<\/b>|<\/strong>|<i>|<em>|<\/i>|<\/em>|<u>|<\/u>|[^<]+|<[^>]+>)/gi;
  let match: RegExpExecArray | null;

  let bold = false;
  let italic = false;
  let underline = false;

  while ((match = tokenRegex.exec(clean)) !== null) {
    const token = match[1];
    const lower = token.toLowerCase();

    if (lower === '<b>' || lower === '<strong>') {
      bold = true;
    } else if (lower === '</b>' || lower === '</strong>') {
      bold = false;
    } else if (lower === '<i>' || lower === '<em>') {
      italic = true;
    } else if (lower === '</i>' || lower === '</em>') {
      italic = false;
    } else if (lower === '<u>') {
      underline = true;
    } else if (lower === '</u>') {
      underline = false;
    } else if (!token.startsWith('<')) {
      const decoded = decodeHtmlEntities(token);
      if (decoded.length > 0) {
        runs.push({
          text: decoded,
          bold,
          italic,
          underline,
        });
      }
    }
  }

  if (runs.length === 0 && clean.length > 0) {
    runs.push({ text: decodeHtmlEntities(clean) });
  }

  return runs;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Converts editor HTML into DOCX Paragraphs and Tables
 */
function parseHtmlToDocxElements(html: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Extract major blocks (h1, h2, h3, h4, p, blockquote, li, table)
  const blockRegex = /<(h[1-6]|p|blockquote|li|table|tr)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    lastIndex = blockRegex.lastIndex;

    if (tag === 'h1') {
      elements.push(
        new Paragraph({
          text: decodeHtmlEntities(content.replace(/<[^>]+>/g, '').trim()),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 120 },
        })
      );
    } else if (tag === 'h2') {
      elements.push(
        new Paragraph({
          text: decodeHtmlEntities(content.replace(/<[^>]+>/g, '').trim()),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
        })
      );
    } else if (tag === 'h3') {
      elements.push(
        new Paragraph({
          text: decodeHtmlEntities(content.replace(/<[^>]+>/g, '').trim()),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
        })
      );
    } else if (tag === 'h4') {
      elements.push(
        new Paragraph({
          text: decodeHtmlEntities(content.replace(/<[^>]+>/g, '').trim()),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 140, after: 60 },
        })
      );
    } else if (tag === 'li') {
      const runs = parseInlineHtml(content);
      elements.push(
        new Paragraph({
          children: runs.map(
            (r) =>
              new TextRun({
                text: r.text,
                bold: r.bold,
                italics: r.italic,
                underline: r.underline ? { type: UnderlineType.SINGLE } : undefined,
              })
          ),
          bullet: { level: 0 },
          spacing: { before: 40, after: 60 },
        })
      );
    } else if (tag === 'blockquote') {
      const runs = parseInlineHtml(content);
      elements.push(
        new Paragraph({
          children: runs.map(
            (r) =>
              new TextRun({
                text: r.text,
                italics: true,
                bold: r.bold,
                color: '475569',
              })
          ),
          indent: { left: 720 },
          spacing: { before: 140, after: 140 },
        })
      );
    } else if (tag === 'table') {
      const table = parseHtmlTable(content);
      if (table) {
        elements.push(table);
      }
    } else if (tag === 'p') {
      const trimmed = content.trim();
      if (!trimmed || trimmed === '<br>' || trimmed === '&nbsp;') {
        continue;
      }
      const runs = parseInlineHtml(trimmed);
      elements.push(
        new Paragraph({
          children: runs.map(
            (r) =>
              new TextRun({
                text: r.text,
                bold: r.bold,
                italics: r.italic,
                underline: r.underline ? { type: UnderlineType.SINGLE } : undefined,
                size: 22, // 11pt
              })
          ),
          spacing: { before: 60, after: 120, line: 320 },
        })
      );
    }
  }

  // If no block tags were matched (plain text), split by newlines
  if (elements.length === 0 && html.trim().length > 0) {
    const rawParagraphs = html.replace(/<[^>]+>/g, '').split(/\n\n+/);
    rawParagraphs.forEach((p) => {
      if (p.trim()) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: decodeHtmlEntities(p.trim()), size: 22 })],
            spacing: { before: 60, after: 120, line: 320 },
          })
        );
      }
    });
  }

  return elements;
}

function parseHtmlTable(tableInnerHtml: string): Table | null {
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: TableRow[] = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tableInnerHtml)) !== null) {
    const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
    const cells: TableCell[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const isHeader = cellMatch[1].toLowerCase() === 'th';
      const cellText = decodeHtmlEntities(cellMatch[2].replace(/<[^>]+>/g, '').trim());
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  bold: isHeader,
                  size: 20,
                }),
              ],
              spacing: { before: 40, after: 40 },
            }),
          ],
          shading: isHeader
            ? { fill: 'E2E8F0', type: ShadingType.CLEAR }
            : undefined,
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
        })
      );
    }

    if (cells.length > 0) {
      rows.push(new TableRow({ children: cells }));
    }
  }

  if (rows.length === 0) return null;

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    },
  });
}

/**
 * Generate a complete, professionally formatted Microsoft Word (.docx) document
 */
export async function generateDocxDocument(assignment: AssignmentData): Promise<Buffer> {
  const univName = assignment.universityName?.trim() || 'UNIVERSITY / INSTITUTION';
  const deptName = assignment.department?.trim() || 'DEPARTMENT OF ACADEMIC STUDIES';

  let logoImageRun: ImageRun | null = null;

  try {
    let logoBuffer: Buffer | null = null;
    if (assignment.logoUrl && assignment.logoUrl.startsWith('data:image/')) {
      const base64Data = assignment.logoUrl.split(',')[1];
      if (base64Data) {
        logoBuffer = Buffer.from(base64Data, 'base64');
      }
    } else {
      const defaultLogoPath = path.resolve(process.cwd(), 'public/university-logo.png');
      if (fs.existsSync(defaultLogoPath)) {
        logoBuffer = fs.readFileSync(defaultLogoPath);
      }
    }

    if (logoBuffer && logoBuffer.length > 0) {
      logoImageRun = new ImageRun({
        data: logoBuffer,
        transformation: {
          width: 90,
          height: 90,
        },
      } as any);
    }
  } catch (err) {
    console.warn('Failed to load logo image for DOCX:', err);
  }

  // Cover / Header elements
  const headerElements: (Paragraph | Table)[] = [];

  if (logoImageRun) {
    headerElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [logoImageRun],
        spacing: { before: 100, after: 120 },
      })
    );
  }

  headerElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: univName.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: '0F172A',
        }),
      ],
      spacing: { before: 60, after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: deptName,
          bold: true,
          size: 22, // 11pt
          color: '475569',
        }),
      ],
      spacing: { before: 20, after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `ASSIGNMENT NO. ${assignment.assignmentNumber || '1'}`,
          bold: true,
          size: 26, // 13pt
          color: '1D4ED8',
        }),
      ],
      spacing: { before: 60, after: 240 },
    })
  );

  // Student and Academic Information Table
  const submissionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const metadataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    },
    rows: [
      new TableRow({
        children: [
          createMetaCell('Student Name:', true, 'F8FAFC', 25),
          createMetaCell(assignment.studentName, false, 'F8FAFC', 25),
          createMetaCell('Roll Number:', true, 'F8FAFC', 25),
          createMetaCell(assignment.rollNumber, false, 'F8FAFC', 25),
        ],
      }),
      new TableRow({
        children: [
          createMetaCell('Subject / Course:', true, 'FFFFFF', 25),
          createMetaCell(assignment.subject, false, 'FFFFFF', 25),
          createMetaCell('Submitted To:', true, 'FFFFFF', 25),
          createMetaCell(assignment.submittedTo, false, 'FFFFFF', 25),
        ],
      }),
      new TableRow({
        children: [
          createMetaCell('Semester:', true, 'F8FAFC', 25),
          createMetaCell(assignment.semester || 'N/A', false, 'F8FAFC', 25),
          createMetaCell('Submission Date:', true, 'F8FAFC', 25),
          createMetaCell(submissionDate, false, 'F8FAFC', 25),
        ],
      }),
    ],
  });

  headerElements.push(metadataTable);

  // Divider paragraph
  headerElements.push(
    new Paragraph({
      spacing: { before: 280, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      },
    })
  );

  // Parse assignment body from editorContent (or questions if editorContent is empty)
  let bodyElements: (Paragraph | Table)[] = [];

  if (assignment.editorContent && assignment.editorContent.trim().length > 0) {
    // Strip the outer header table and title if it was generated inside editorContent
    // so we don't duplicate the cover header
    let contentToParse = assignment.editorContent;
    const headerEndIdx = contentToParse.indexOf('</table');
    if (headerEndIdx !== -1 && contentToParse.includes('Student Name:')) {
      const hrIdx = contentToParse.indexOf('<hr', headerEndIdx);
      if (hrIdx !== -1) {
        contentToParse = contentToParse.substring(contentToParse.indexOf('>', hrIdx) + 1);
      } else {
        contentToParse = contentToParse.substring(headerEndIdx + 8);
      }
    }

    bodyElements = parseHtmlToDocxElements(contentToParse);
  }

  // If bodyElements is still empty, format questions directly
  if (bodyElements.length === 0 && assignment.questions?.length > 0) {
    assignment.questions.forEach((q, idx) => {
      bodyElements.push(
        new Paragraph({
          text: `Question ${idx + 1}: ${q.question}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
      if (q.answer) {
        bodyElements.push(
          new Paragraph({
            children: [new TextRun({ text: q.answer, size: 22 })],
            spacing: { before: 60, after: 140, line: 320 },
          })
        );
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `${univName} | Page `, size: 18, color: '64748B' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '64748B' }),
                  new TextRun({ text: ' of ', size: 18, color: '64748B' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '64748B' }),
                ],
              }),
            ],
          }),
        },
        children: [...headerElements, ...bodyElements],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function createMetaCell(
  text: string,
  isHeader: boolean,
  bgHex: string,
  widthPercent: number
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: bgHex, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || '',
            bold: isHeader,
            size: 20,
            color: isHeader ? '0F172A' : '334155',
          }),
        ],
        spacing: { before: 20, after: 20 },
      }),
    ],
  });
}
