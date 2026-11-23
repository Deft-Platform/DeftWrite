import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
} from 'docx';

// Serialize a Tiptap/ProseMirror doc (StarterKit node set) into a real .docx.

interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: { type: string }[];
}

const HEADING: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

function runs(nodes: PMNode[] | undefined): TextRun[] {
  return (nodes ?? [])
    .filter((n) => n.type === 'text' || n.type === 'hardBreak')
    .map((n) => {
      if (n.type === 'hardBreak') return new TextRun({ text: '', break: 1 });
      const m = (n.marks ?? []).map((x) => x.type);
      return new TextRun({
        text: n.text ?? '',
        bold: m.includes('bold'),
        italics: m.includes('italic'),
        strike: m.includes('strike'),
        font: m.includes('code') ? 'Consolas' : undefined,
      });
    });
}

function blocks(n: PMNode): Paragraph[] {
  switch (n.type) {
    case 'heading':
      return [new Paragraph({ heading: HEADING[Number(n.attrs?.level) || 1] ?? HeadingLevel.HEADING_1, children: runs(n.content) })];
    case 'paragraph':
      return [new Paragraph({ children: runs(n.content) })];
    case 'blockquote':
      return (n.content ?? []).map((c) => new Paragraph({ children: runs(c.content), indent: { left: 720 } }));
    case 'codeBlock':
      return [new Paragraph({ children: [new TextRun({ text: (n.content ?? []).map((c) => c.text ?? '').join(''), font: 'Consolas' })] })];
    case 'horizontalRule':
      return [new Paragraph({ thematicBreak: true, children: [] })];
    case 'visual': {
      const p = (n.attrs?.prompt as string) || 'visual';
      return [new Paragraph({ children: [new TextRun({ text: `[Visual: ${p}]`, italics: true })] })];
    }
    case 'bulletList':
      return (n.content ?? []).flatMap((li) =>
        (li.content ?? []).map((c) => new Paragraph({ children: runs(c.content), bullet: { level: 0 } }))
      );
    case 'orderedList':
      return (n.content ?? []).flatMap((li) =>
        (li.content ?? []).map((c) => new Paragraph({ children: runs(c.content), numbering: { reference: 'ol', level: 0 } }))
      );
    default:
      return [new Paragraph({ children: runs(n.content) })];
  }
}

export async function draftToDocxBlob(title: string, doc: PMNode | null | undefined): Promise<Blob> {
  const children: Paragraph[] = [];
  if (title?.trim()) {
    children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: title.trim() })] }));
  }
  for (const n of doc?.content ?? []) children.push(...blocks(n));
  if (children.length === 0) children.push(new Paragraph({ children: [] }));

  const document = new Document({
    numbering: {
      config: [
        { reference: 'ol', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] },
      ],
    },
    sections: [{ children }],
  });
  return Packer.toBlob(document);
}
