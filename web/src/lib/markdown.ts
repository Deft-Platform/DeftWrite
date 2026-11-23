// Minimal ProseMirror/Tiptap JSON -> Markdown serializer for the StarterKit
// node set DeftWrite uses (headings, paragraphs, lists, blockquote, code,
// horizontal rule, hard break) plus bold/italic/strike/code marks.

interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: { type: string }[];
}

function textWithMarks(node: PMNode): string {
  let t = node.text ?? '';
  const marks = (node.marks ?? []).map((m) => m.type);
  if (marks.includes('code')) t = '`' + t + '`';
  if (marks.includes('bold')) t = '**' + t + '**';
  if (marks.includes('italic')) t = '*' + t + '*';
  if (marks.includes('strike')) t = '~~' + t + '~~';
  return t;
}

function inline(nodes: PMNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type === 'text') return textWithMarks(n);
      if (n.type === 'hardBreak') return '  \n';
      return '';
    })
    .join('');
}

function listItem(li: PMNode, bullet: string, depth: number): string {
  const indent = '  '.repeat(depth);
  const children = li.content ?? [];
  return children
    .map((c, idx) =>
      idx === 0
        ? indent + bullet + block(c, depth + 1)
        : indent + '  ' + block(c, depth + 1)
    )
    .join('\n');
}

function block(n: PMNode, depth = 0): string {
  switch (n.type) {
    case 'paragraph':
      return inline(n.content);
    case 'heading':
      return '#'.repeat(Number(n.attrs?.level) || 1) + ' ' + inline(n.content);
    case 'blockquote':
      return (n.content ?? []).map((c) => '> ' + block(c, depth)).join('\n');
    case 'codeBlock':
      return '```\n' + inline(n.content) + '\n```';
    case 'horizontalRule':
      return '---';
    case 'visual': {
      const p = (n.attrs?.prompt as string) || 'visual';
      return `> **Visual:** ${p}`;
    }
    case 'bulletList':
      return (n.content ?? []).map((li) => listItem(li, '- ', depth)).join('\n');
    case 'orderedList':
      return (n.content ?? [])
        .map((li, i) => listItem(li, `${i + 1}. `, depth))
        .join('\n');
    default:
      return inline(n.content);
  }
}

export function docToMarkdown(doc: PMNode | null | undefined): string {
  return (doc?.content ?? [])
    .map((n) => block(n))
    .filter((s) => s !== '')
    .join('\n\n');
}

export function draftToMarkdown(title: string, doc: PMNode | null | undefined): string {
  const body = docToMarkdown(doc);
  const head = title?.trim() ? `# ${title.trim()}` : '';
  return [head, body].filter(Boolean).join('\n\n') + '\n';
}
