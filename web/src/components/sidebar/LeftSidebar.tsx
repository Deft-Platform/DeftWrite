import { Icon } from '@/components/ui/icon';
import { useApp } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
import type { Priority } from '@/types';

const PRIORITY_RANK: Record<Priority, number> = { high: 0, med: 1, low: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { high: 'High', med: 'Med', low: 'Low' };
const PRIORITY_STYLE: Record<Priority, string> = {
  high: 'bg-rose-500/20 text-rose-300',
  med: 'bg-amber-500/20 text-amber-300',
  low: 'bg-slate-600/40 text-slate-400',
};
const NEXT_PRIORITY: Record<Priority, Priority> = { high: 'med', med: 'low', low: 'high' };
const prio = (p?: Priority): Priority => p ?? 'med';

function PersonaSelector() {
  const { activePersonaId, personas, setActivePersona } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = personas[activePersonaId];

  return (
    <div className="p-3 border-b border-slate-800 relative" ref={ref}>
      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 block">Persona</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs bg-slate-700/40 hover:bg-slate-700/60 text-white transition-all"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active.color }} />
        <span className="flex-1 text-left truncate">{active.emoji} {active.name}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} className="w-3 h-3 text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {(Object.values(personas) as { id: string; name: string; emoji: string; color: string }[]).map(p => (
            <button
              key={p.id}
              onClick={() => { setActivePersona(p.id as never); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-all ${
                activePersonaId === p.id ? 'bg-indigo-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.emoji} {p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The Inbox: capture raw ideas, then promote the best one into a draft.
function InboxSection() {
  const { ideas, activePersonaId, addIdea, deleteIdea, startDraftFromIdea } = useApp();
  const [text, setText] = useState('');
  const items = ideas[activePersonaId] || [];

  const add = () => {
    if (text.trim()) {
      addIdea(text.trim());
      setText('');
    }
  };

  return (
    <div className="p-3 border-b border-slate-800">
      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 block">Inbox</label>
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Capture an idea..."
          className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
        />
        <button
          onClick={add}
          title="Add idea"
          className="px-2 rounded-md bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
          {items.map(idea => (
            <div key={idea.id} className="group flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/40 text-[11px] text-slate-400">
              <span className="truncate flex-1">{idea.content}</span>
              <button
                onClick={() => startDraftFromIdea(idea.id)}
                title="Start a draft from this idea"
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-indigo-400 transition-all shrink-0"
              >
                <Icon name="arrow-right" className="w-3 h-3" />
              </button>
              <button
                onClick={() => deleteIdea(idea.id)}
                title="Delete idea"
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all shrink-0"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewDraftButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'article' | 'book' | 'social'>('article');
  const inputRef = useRef<HTMLInputElement>(null);
  const { createDraft } = useApp();

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleCreate = () => {
    if (title.trim()) {
      createDraft(title.trim(), type);
      setTitle('');
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-colors"
      >
        <Icon name="plus" className="w-3.5 h-3.5" />
        <span>New draft</span>
      </button>
      {open && (
        <div className="absolute left-3 top-24 z-50 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Draft title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
          />
          <div className="flex gap-1">
            {(['article', 'book', 'social'] as const).map(ct => (
              <button
                key={ct}
                onClick={() => setType(ct)}
                className={`flex-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  type === ct ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {ct.charAt(0).toUpperCase() + ct.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 pt-1">
            <button
              onClick={handleCreate}
              className="flex-1 px-2 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-[10px] font-medium transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setOpen(false); setTitle(''); }}
              className="px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded text-[10px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function QueueItem({
  draft, isActive, isTop, onOpen, onDelete, onCyclePriority,
}: {
  draft: { id: string; title: string; status: string; type: string; priority?: Priority };
  isActive: boolean;
  isTop: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onCyclePriority: () => void;
}) {
  const statusColors: Record<string, string> = {
    'draft': 'bg-blue-500/20 text-blue-400',
    'outlining': 'bg-amber-500/20 text-amber-400',
    'polish': 'bg-purple-500/20 text-purple-400',
    'published': 'bg-emerald-500/20 text-emerald-400',
    'not-started': 'bg-slate-500/20 text-slate-400',
  };
  const p = prio(draft.priority);

  return (
    <div
      onClick={onOpen}
      data-active-draft={isActive ? 'true' : undefined}
      data-priority={p}
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-indigo-500/15 border border-indigo-500/30 shadow-sm' : 'hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
            {draft.title || 'Untitled'}
          </div>
          {isTop && (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-indigo-500/20 text-indigo-300">Up Next</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onCyclePriority(); }}
            title="Cycle priority (High / Med / Low)"
            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-colors ${PRIORITY_STYLE[p]}`}
          >
            {PRIORITY_LABEL[p]}
          </button>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${statusColors[draft.status] || statusColors['not-started']}`}>
            {draft.status.replace('-', ' ')}
          </span>
          <span className="text-[9px] text-slate-600 capitalize">{draft.type}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete draft"
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
      >
        <Icon name="x" className="w-3 h-3" />
      </button>
    </div>
  );
}

export function LeftSidebar() {
  const { personas, activePersonaId, openDraft, drafts, deleteDraft, updateDraft, activeDraftId } = useApp();

  const persona = personas[activePersonaId];
  // Priority first (High -> Low), then most-recently-updated within a priority.
  const personaDrafts = [...(drafts[activePersonaId] || [])].sort((a, b) => {
    const r = PRIORITY_RANK[prio(a.priority)] - PRIORITY_RANK[prio(b.priority)];
    return r !== 0 ? r : b.updatedAt - a.updatedAt;
  });
  const hasDrafts = personaDrafts.length > 0;

  return (
    <aside className="w-64 border-r border-slate-800 glass flex flex-col z-10 shrink-0">
      <PersonaSelector />
      <InboxSection />

      {/* Writing Queue */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Writing Queue</label>
          <NewDraftButton />
        </div>

        <ScrollArea className="flex-1 px-3 pb-3">
          {!hasDrafts ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Icon name="file-plus" className="w-5 h-5 text-slate-700" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-medium">No drafts yet</p>
                <p className="text-[10px] text-slate-700">Capture an idea above or create a draft</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {personaDrafts.map((draft, i) => (
                <QueueItem
                  key={draft.id}
                  draft={draft}
                  isActive={activeDraftId === draft.id}
                  isTop={i === 0}
                  onOpen={() => openDraft(draft.id)}
                  onDelete={() => deleteDraft(draft.id)}
                  onCyclePriority={() => updateDraft(draft.id, { priority: NEXT_PRIORITY[prio(draft.priority)] })}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Publishing */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Publish</label>
          <button className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors">
            <Icon name="share-2" className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-1">
          {(persona.channels || []).map(ch => (
            <button
              key={ch.name}
              onClick={() => ch.url && window.open(ch.url, '_blank')}
              disabled={!ch.url}
              className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${
                ch.url ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-700 cursor-default'
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
