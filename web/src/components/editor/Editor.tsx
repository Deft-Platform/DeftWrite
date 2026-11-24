import { Icon } from '@/components/ui/icon';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { VisualNode } from './VisualNode';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useApp } from '@/contexts/AppContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { draftToMarkdown } from '@/lib/markdown';

// Drafts are persisted as JSON.stringify(editor.getJSON()). Tiptap's
// setContent treats a bare string as HTML, so we must parse stored JSON back
// into an object before loading — otherwise raw JSON leaks into the editor (or
// content is lost). Falls back to treating the value as HTML/plain text for
// any legacy or non-JSON content.
// Pull top-level headings out of a Tiptap doc for the live outline (ECD-4).
interface PMNodeLite { type: string; attrs?: Record<string, unknown>; content?: PMNodeLite[]; text?: string }
function extractHeadings(doc: unknown): { level: number; text: string }[] {
  const nodes = (doc as { content?: PMNodeLite[] })?.content ?? [];
  const out: { level: number; text: string }[] = [];
  for (const n of nodes) {
    if (n.type === 'heading') {
      const text = (n.content ?? []).map((c) => c.text ?? '').join('').trim();
      if (text) out.push({ level: Number(n.attrs?.level) || 1, text });
    }
  }
  return out;
}

function parseDraftContent(raw: string | undefined): unknown {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      /* fall through to string handling */
    }
  }
  return raw;
}

const PLACEHOLDERS: Record<string, string> = {
  article: 'Start writing your article...\n\nTip: Use H2 and H3 headings to create sections. The outline panel will auto-generate from your headings.',
  book: 'Begin your book...\n\nTip: Create parts and chapters in the outline panel on the right. Each chapter can be expanded into sections.',
  social: 'Draft your social post...\n\nChoose between single post, thread, or cross-platform mode below.',
};

const FONT_MAP: Record<string, string> = {
  serif: "'Playfair Display', serif",
  sans: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface EditorToolbarProps {
  onFocusMode: () => void;
  onToggleFormat: (action: string) => void;
  onInsertVisual: () => void;
  activeFormats: string[];
}

function EditorToolbar({ onFocusMode, onToggleFormat, onInsertVisual, activeFormats }: EditorToolbarProps) {
  const btnClass = (action: string) =>
    `p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors ${
      activeFormats.includes(action) ? 'tb-active' : ''
    }`;

  const actions = [
    { id: 'bold', icon: 'bold', label: 'Bold (Ctrl+B)' },
    { id: 'italic', icon: 'italic', label: 'Italic (Ctrl+I)' },
    { id: 'strike', icon: 'strikethrough', label: 'Strikethrough' },
    { id: 'heading1', icon: null, label: 'Heading 1', text: 'H1' },
    { id: 'heading2', icon: null, label: 'Heading 2', text: 'H2' },
    { id: 'heading3', icon: null, label: 'Heading 3', text: 'H3' },
    { id: 'blockquote', icon: 'quote', label: 'Quote' },
    { id: 'code', icon: 'code', label: 'Inline Code' },
    { id: 'ul', icon: 'list', label: 'Bullet List' },
    { id: 'ol', icon: 'list-ordered', label: 'Numbered List' },
    { id: 'hr', icon: 'minus', label: 'Horizontal Rule' },
  ];

  return (
    <div className="h-10 border-b border-slate-800/50 glass flex items-center px-4 gap-0.5 shrink-0">
      {actions.map(a => (
        <button
          key={a.id}
          className={btnClass(a.id)}
          onClick={() => onToggleFormat(a.id)}
          title={a.label}
        >
          {a.icon ? <Icon name={a.icon} className="w-4 h-4" /> : <span className="text-xs font-bold">{a.text}</span>}
        </button>
      ))}
      <div className="w-px h-5 bg-slate-700/60 mx-1" />
      <button
        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors flex items-center gap-1"
        onClick={onInsertVisual}
        title="Insert a visual (AI-generated figure)"
      >
        <Icon name="image" className="w-4 h-4" />
        <span className="text-[10px] font-medium">Visual</span>
      </button>
      <div className="flex-1" />
      <button
        className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
        onClick={onFocusMode}
        title="Focus Mode (Ctrl+Shift+F)"
      >
        <Icon name="maximize" className="w-4 h-4" />
      </button>
    </div>
  );
}

const FONT_LABELS: Record<string, string> = {
  serif: 'Playfair',
  sans: 'Inter',
  mono: 'JetBrains Mono',
};

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

function ExportMenu({ editor, title }: { editor: TiptapEditor | null; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const buildMarkdown = () => draftToMarkdown(title, (editor?.getJSON() as never) ?? null);

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(title || 'untitled')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const downloadMd = () => triggerDownload(new Blob([buildMarkdown()], { type: 'text/markdown' }), 'md');

  const downloadDocx = async () => {
    const { draftToDocxBlob } = await import('@/lib/docx');
    const blob = await draftToDocxBlob(title, (editor?.getJSON() as never) ?? null);
    triggerDownload(blob, 'docx');
  };

  const printPdf = () => {
    setOpen(false);
    const body = editor?.getHTML() ?? '';
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) { iframe.remove(); return; }
    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || 'Untitled')}</title>` +
      `<style>body{font-family:Georgia,'Times New Roman',serif;max-width:720px;margin:2.5rem auto;padding:0 1.25rem;color:#111;line-height:1.65}` +
      `h1,h2,h3{font-family:Georgia,serif;line-height:1.25}blockquote{border-left:3px solid #ccc;margin:1rem 0;padding:.2rem 0 .2rem 1rem;color:#555}` +
      `pre,code{font-family:ui-monospace,Menlo,Consolas,monospace;background:#f4f4f5}pre{padding:.75rem;border-radius:6px;overflow:auto}hr{border:0;border-top:1px solid #ddd;margin:1.5rem 0}</style></head>` +
      `<body><h1>${esc(title || 'Untitled')}</h1>${body}</body></html>`
    );
    doc.close();
    const win = iframe.contentWindow;
    const cleanup = () => setTimeout(() => iframe.remove(), 1000);
    if (win) {
      win.onafterprint = cleanup;
      win.focus();
      win.print();
    }
    cleanup();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Export Markdown"
        className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Icon name="download" className="w-3.5 h-3.5" />
        Export
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-1 z-50">
          <button
            onClick={copyMd}
            className="w-full text-left px-2 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700/60 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
          <button
            onClick={downloadMd}
            className="w-full text-left px-2 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700/60 rounded transition-colors"
          >
            Download .md
          </button>
          <button
            onClick={downloadDocx}
            className="w-full text-left px-2 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700/60 rounded transition-colors"
          >
            Download .docx
          </button>
          <button
            onClick={printPdf}
            className="w-full text-left px-2 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700/60 rounded transition-colors"
          >
            Print / PDF
          </button>
        </div>
      )}
    </div>
  );
}

interface EditorContentProps {
  editor: TiptapEditor | null;
  title: string;
  onTitleChange: (title: string) => void;
  wordCount: number;
  charCount: number;
  fontFamily: string;
  contentType: string;
  onCycleFont: () => void;
}

function EditorContentInner({ editor, title, onTitleChange, wordCount, charCount, fontFamily, onCycleFont }: EditorContentProps) {
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="py-10 lg:py-16 px-8 lg:px-16 max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Untitled"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            className="w-full bg-transparent text-4xl font-bold outline-none mb-8 placeholder:text-slate-800"
            style={{ fontFamily: FONT_MAP[fontFamily] || FONT_MAP.serif }}
          />
          <EditorContent editor={editor} />
        </div>
      </div>
      <div className="h-9 border-t border-slate-800 glass flex items-center px-4 justify-between text-[11px] text-slate-600 shrink-0">
        <div className="flex gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          <span>{readTime} min read</span>
        </div>
        <div className="flex gap-3 items-center">
          <ExportMenu editor={editor} title={title} />
          <button
            onClick={onCycleFont}
            className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
            title="Switch font"
          >
            {FONT_LABELS[fontFamily] || 'Serif'}
          </button>
        </div>
      </div>
    </>
  );
}

export function MainEditor() {
  const { aiConfig, fontFamily, setFontFamily, updateDraft, focusMode, toggleFocusMode, activeContentType, activeDraftId, activeDraft, setDocumentHeadings, insertVisualRef, insertVisual, setFocusedSelection, replaceRangeRef } = useApp();
  const cycleFont = useCallback(() => {
    const order = ['serif', 'sans', 'mono'] as const;
    const next = order[(order.indexOf(fontFamily as typeof order[number]) + 1) % order.length];
    setFontFamily(next);
  }, [fontFamily, setFontFamily]);
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<TiptapEditor | null>(null);

  // Sync title when a draft opens
  useEffect(() => {
    if (activeDraft) {
      setTitle(activeDraft.title);
    } else {
      setTitle('');
    }
  }, [activeDraft?.id]);

  // Trailing debounce: fire 400ms after the last change, reading the LATEST
  // content at fire time (not a stale closure captured on the first keystroke).
  const scheduleContentSave = useCallback(() => {
    if (!activeDraftId) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      if (activeDraftId && editorRef.current) {
        updateDraft(activeDraftId, { content: JSON.stringify(editorRef.current.getJSON()) });
      }
      saveRef.current = null;
    }, 400);
  }, [activeDraftId, updateDraft]);

  // Force immediate save — bypasses the debounce and flushes current content.
  const { forceSaveRef } = useApp();
  const forceFlushSave = useCallback(() => {
    if (!activeDraftId || !editorRef.current) return;
    if (saveRef.current) {
      clearTimeout(saveRef.current);
      saveRef.current = null;
    }
    updateDraft(activeDraftId, { content: JSON.stringify(editorRef.current.getJSON()) });
  }, [activeDraftId, updateDraft]);

  // Register force save callback so RightSidebar can trigger it.
  useEffect(() => {
    forceSaveRef.current = forceFlushSave;
  }, [forceSaveRef, forceFlushSave]);

  // Expose a visual inserter so the toolbar and co-pilot can drop in boxes.
  useEffect(() => {
    insertVisualRef.current = (attrs) => {
      editorRef.current?.chain().focus().insertVisual(attrs ?? {}).run();
    };
  }, [insertVisualRef]);

  // Expose a range replacer so an accepted co-pilot suggestion can edit the doc.
  useEffect(() => {
    replaceRangeRef.current = (from, to, text) => {
      const html = text
        .split(/\n{2,}/)
        .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`)
        .join('');
      editorRef.current?.chain().focus().insertContentAt({ from, to }, html).run();
    };
  }, [replaceRangeRef]);

  // Flush any pending save before the tab is hidden or unloaded, so a quick
  // reload/close can't lose the last few seconds of writing.
  useEffect(() => {
    const flush = () => {
      if (saveRef.current && activeDraftId && editorRef.current) {
        clearTimeout(saveRef.current);
        saveRef.current = null;
        updateDraft(activeDraftId, { content: JSON.stringify(editorRef.current.getJSON()) });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeDraftId, updateDraft]);

  // Persist title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (activeDraftId) {
      updateDraft(activeDraftId, { title: newTitle });
    }
  }, [activeDraftId, updateDraft]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      VisualNode,
      Placeholder.configure({ placeholder: PLACEHOLDERS[activeContentType] || PLACEHOLDERS.article }),
    ],
    content: parseDraftContent(activeDraft?.content) as string,
    onSelectionUpdate: ({ editor: te }) => {
      const { from, to } = te.state.selection;
      if (to > from) {
        const text = te.state.doc.textBetween(from, to, ' ').trim();
        if (text) setFocusedSelection({ text, from, to });
      }
    },
    onUpdate: ({ editor: te }) => {
      if (!te) return;
      editorRef.current = te;
      const text = te.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      setCharCount(text.length);
      setDocumentHeadings(extractHeadings(te.getJSON()));
      scheduleContentSave();
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror',
      },
    },
  });

  // Load content when a draft opens/switches or the editor initializes.
  // `false` = don't emit an update, so loading doesn't trigger a save loop.
  useEffect(() => {
    if (!editor) return;
    const next = activeDraft ? parseDraftContent(activeDraft.content) : '';
    editor.commands.setContent(next as string, false);
    editorRef.current = editor;
    const text = editor.getText();
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    setCharCount(text.length);
    setDocumentHeadings(extractHeadings(editor.getJSON()));
  }, [editor, activeDraftId]);

  // Writing into a captured idea promotes it to a draft (so it rises in the queue).
  useEffect(() => {
    if (activeDraft && activeDraft.status === 'not-started' && wordCount > 0) {
      updateDraft(activeDraft.id, { status: 'draft' });
    }
  }, [wordCount, activeDraft, updateDraft]);

  // Esc key to exit focus mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.code === 'Escape') && focusMode) {
        e.preventDefault();
        toggleFocusMode();
      }
      // Ctrl+Shift+F to enter focus mode
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [focusMode, toggleFocusMode]);

  const handleToggleFormat = useCallback((action: string) => {
    if (!editor) return;
    const map: Record<string, () => void> = {
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      strike: () => editor.chain().focus().toggleStrike().run(),
      heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      heading3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
      code: () => editor.chain().focus().toggleCode().run(),
      ul: () => editor.chain().focus().toggleBulletList().run(),
      ol: () => editor.chain().focus().toggleOrderedList().run(),
      hr: () => editor.chain().focus().setHorizontalRule().run(),
    };
    map[action]?.();
  }, [editor]);

  const activeFormats = editor
    ? ([
      editor.isActive('bold') && 'bold',
      editor.isActive('italic') && 'italic',
      editor.isActive('strike') && 'strike',
      editor.isActive('heading', { level: 1 }) && 'heading1',
      editor.isActive('heading', { level: 2 }) && 'heading2',
      editor.isActive('heading', { level: 3 }) && 'heading3',
      editor.isActive('blockquote') && 'blockquote',
      editor.isActive('code') && 'code',
      editor.isActive('codeBlock') && 'codeBlock',
      editor.isActive('bulletList') && 'ul',
      editor.isActive('orderedList') && 'ol',
    ].filter((v): v is string => !!v))
    : [];

  return (
    <section className={`flex-1 flex flex-col relative bg-slate-950 transition-all duration-500 ${
      focusMode ? 'items-center justify-center' : ''
    }`}>
      {/* Focus mode exit hint */}
      {focusMode && (
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <span className="text-xs text-slate-700 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
            Press Esc to exit focus mode
          </span>
        </div>
      )}
      {!focusMode && (
        <>
          <EditorToolbar
            onFocusMode={toggleFocusMode}
            onToggleFormat={handleToggleFormat}
            onInsertVisual={() => insertVisual()}
            activeFormats={activeFormats}
          />
          <EditorContentInner
            editor={editor}
            title={title}
            onTitleChange={handleTitleChange}
            wordCount={wordCount}
            charCount={charCount}
            fontFamily={fontFamily}
            contentType={activeContentType}
            onCycleFont={cycleFont}
          />
        </>
      )}
      {/* Focus mode: show only content + pomodoro */}
      {focusMode && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-8">
          <EditorContent editor={editor} />
        </div>
      )}
    </section>
  );
}
