import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/contexts/AppContext';

export type VisualStatus = 'empty' | 'suggested' | 'generating' | 'done' | 'failed';

function newVisualId(): string {
  try {
    return `vis-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

const STATUS_LABEL: Record<VisualStatus, string> = {
  empty: 'Empty',
  suggested: 'Suggested',
  generating: 'Generating',
  done: 'Visual',
  failed: 'Failed',
};

function VisualView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { registerVisual, unregisterVisual, selectedVisualId, setSelectedVisualId, syncVisual } = useApp();
  const id: string = node.attrs.visualId;
  const status: VisualStatus = node.attrs.status || 'empty';
  const prompt: string = node.attrs.prompt || '';
  const svg: string = node.attrs.svg || '';
  const role: string = node.attrs.role || 'illustration';
  const isSelected = selectedVisualId === id;

  // Expose this node's updater to the sidebar/co-pilot, keyed by id.
  useEffect(() => {
    if (!id) return;
    registerVisual(id, { updateAttributes, deleteNode });
    return () => unregisterVisual(id);
  }, [id, registerVisual, unregisterVisual, updateAttributes, deleteNode]);

  // Keep the selected-visual snapshot (read by the right sidebar) in sync.
  useEffect(() => {
    if (isSelected) syncVisual(id, { prompt, status, svg, role });
  }, [isSelected, id, prompt, status, svg, role, syncVisual]);

  return (
    <NodeViewWrapper
      data-visual-id={id}
      data-visual-status={status}
      className={`my-4 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected ? 'border-indigo-500/60 ring-2 ring-indigo-500/30' : 'border-slate-700/60 hover:border-slate-600'
      } ${status === 'done' ? 'bg-slate-900/40' : 'bg-slate-900/60 border-dashed'}`}
      onClick={() => setSelectedVisualId(id)}
      contentEditable={false}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/60 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        <Icon name="image" className="w-3.5 h-3.5" />
        <span>{STATUS_LABEL[status]}</span>
        <span className="text-slate-600 normal-case tracking-normal font-normal">· {role}</span>
        <span className="flex-1" />
        {status === 'suggested' && (
          <span className="normal-case tracking-normal font-medium text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded-full">AI idea</span>
        )}
      </div>

      {status === 'done' && svg ? (
        <div
          className="visual-svg p-2 [&_svg]:w-full [&_svg]:h-auto [&_svg]:rounded-lg"
          // Model-generated SVG for the author's own draft (single-user, local).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="px-4 py-6 flex flex-col items-center gap-2 text-center">
          {status === 'generating' ? (
            <>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-xs text-slate-400">Generating visual…</p>
            </>
          ) : (
            <Icon name="image" className={`w-6 h-6 ${status === 'failed' ? 'text-rose-400' : 'text-slate-700'}`} />
          )}
          <p className={`text-xs ${prompt ? 'text-slate-400' : 'text-slate-600 italic'}`}>
            {prompt || 'Click, then describe this visual in the right panel'}
          </p>
          {status === 'failed' && <p className="text-[10px] text-rose-400">Generation failed — try again from the panel</p>}
        </div>
      )}
      {status === 'done' && prompt && (
        <div className="px-3 pb-2 text-[10px] text-slate-600 truncate">{prompt}</div>
      )}
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    visual: {
      insertVisual: (attrs?: { visualId?: string; prompt?: string; status?: string; role?: string }) => ReturnType;
    };
  }
}

export const VisualNode = Node.create({
  name: 'visual',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      visualId: { default: null },
      prompt: { default: '' },
      status: { default: 'empty' },
      svg: { default: '' },
      role: { default: 'illustration' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-visual]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-visual': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VisualView);
  },

  addCommands() {
    return {
      insertVisual:
        (attrs: { visualId?: string; prompt?: string; status?: string; role?: string } = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: 'visual',
            attrs: {
              visualId: attrs.visualId ?? newVisualId(),
              prompt: attrs.prompt ?? '',
              status: attrs.status ?? 'empty',
              role: attrs.role ?? 'illustration',
              svg: '',
            },
          }),
    };
  },
});
