import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useApp } from '@/contexts/AppContext';
import { useCallback, useEffect, useState } from 'react';

const PLACEHOLDERS: Record<string, string> = {
  article: 'Start writing your article...\n\nTip: Use H2 and H3 headings to create sections. The outline panel will auto-generate from your headings.',
  book: 'Begin your book...\n\nTip: Create parts and chapters in the outline panel on the right. Each chapter can be expanded into sections.',
  social: 'Draft your social post...\n\nChoose between single post, thread, or cross-platform mode below.',
};

interface EditorToolbarProps {
  onAddComment: () => void;
  onFocusMode: () => void;
  onToggleFormat: (action: string) => void;
  activeFormats: string[];
}

function EditorToolbar({ onAddComment, onFocusMode, onToggleFormat, activeFormats }: EditorToolbarProps) {
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
          {a.icon ? <i data-lucide={a.icon} className="w-4 h-4" /> : <span className="text-xs font-bold">{a.text}</span>}
        </button>
      ))}
      <div className="w-px h-5 bg-slate-700/60 mx-1" />
      <button
        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
        onClick={onAddComment}
        title="Comment on selection"
      >
        <i data-lucide="message-circle" className="w-4 h-4" />
      </button>
      <div className="flex-1" />
      <button
        className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
        onClick={onFocusMode}
        title="Focus Mode (Ctrl+Shift+F)"
      >
        <i data-lucide="maximize" className="w-4 h-4" />
      </button>
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
}

function EditorContentInner({ editor, title, onTitleChange, wordCount, charCount, fontFamily, contentType }: EditorContentProps) {
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const fontMap: Record<string, string> = {
    serif: "'Playfair Display', serif",
    sans: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  };

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
            style={{ fontFamily: fontMap[fontFamily] || fontMap.serif }}
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
          <span className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" title="Switch font">
            {fontMap[fontFamily]?.replace(/['"]/g, '') || 'Lora'}
          </span>
        </div>
      </div>
    </>
  );
}

export function MainEditor() {
  const { aiConfig, fontFamily, updateDraft, focusMode, toggleFocusMode, activeContentType } = useApp();
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: PLACEHOLDERS[activeContentType] || PLACEHOLDERS.article }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (!editor) return;
      const json = editor.getJSON();
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      setCharCount(text.length);
      updateDraft('draft-temp', { content: JSON.stringify(json) });
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror',
      },
    },
  });

  // Sync content when draft opens
  useEffect(() => {
    if (editor) {
      // Could load from activeDraft.content here
    }
  }, [editor]);

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
            onAddComment={() => {}}
            onFocusMode={toggleFocusMode}
            onToggleFormat={handleToggleFormat}
            activeFormats={activeFormats}
          />
          <EditorContentInner
            editor={editor}
            title={title}
            onTitleChange={setTitle}
            wordCount={wordCount}
            charCount={charCount}
            fontFamily={fontFamily}
            contentType={activeContentType}
          />
        </>
      )}
      {/* Focus mode: show only content + pomodoro */}
      {focusMode && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Untitled"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-4xl font-bold outline-none mb-8 placeholder:text-slate-800 text-center"
          />
          <div className="ProseMirror prose-invert w-full min-h-[60vh]" />
          <EditorContent editor={editor} />
        </div>
      )}
    </section>
  );
}
