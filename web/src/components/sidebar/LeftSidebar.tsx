import { Icon } from '@/components/ui/icon';
import { useApp } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
import { CONTENT_TYPE_ORDER, CONTENT_TYPE_LABEL, type ContentType, type Draft } from '@/types';

const TYPE_ICON: Record<string, string> = {
  post: 'message-square', email: 'mail', article: 'file-text',
  whitepaper: 'newspaper', course: 'graduation-cap', book: 'book',
};
const typeLabel = (t?: string) => CONTENT_TYPE_LABEL[(t as ContentType)] ?? 'Draft';

// An idea = captured but untouched (not-started, empty). Everything else with
// content is a draft.
const isIdea = (d: Draft): boolean => d.status === 'not-started';

function PersonaSelector() {
  const { activePersonaId, personas, setActivePersona } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const active = personas[activePersonaId];
  return (
    <div className="p-3 border-b border-slate-800 relative" ref={ref}>
      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 block">Persona</label>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs bg-slate-700/40 hover:bg-slate-700/60 text-white transition-all">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active.color }} />
        <span className="flex-1 text-left truncate">{active.emoji} {active.name}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} className="w-3 h-3 text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {(Object.values(personas) as { id: string; name: string; emoji: string; color: string }[]).map(p => (
            <button key={p.id} onClick={() => { setActivePersona(p.id as never); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-all ${activePersonaId === p.id ? 'bg-indigo-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'}`}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.emoji} {p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// One capture box with a compact type picker; a line becomes an item in the queue.
function CaptureBox() {
  const { createDraft } = useApp();
  const [text, setText] = useState('');
  const [type, setType] = useState<ContentType>('article');
  const add = () => { if (text.trim()) { createDraft(text.trim(), type); setText(''); } };
  return (
    <div className="px-3 pt-2 pb-2 space-y-1.5">
      <div className="flex gap-1.5">
        <input
          type="text" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Capture an idea…"
          className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
        />
        <button onClick={add} title="Add to queue" className="px-2 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition-colors">
          <Icon name="plus" className="w-3.5 h-3.5" />
        </button>
      </div>
      <select
        value={type} onChange={e => setType(e.target.value as ContentType)}
        aria-label="Content type"
        className="w-full bg-slate-900/40 border border-slate-700/40 rounded-md px-2 py-1 text-[11px] text-slate-400 outline-none focus:border-indigo-500/40"
      >
        {CONTENT_TYPE_ORDER.map(t => <option key={t} value={t}>{CONTENT_TYPE_LABEL[t]}</option>)}
      </select>
    </div>
  );
}

// Delete with inline confirm (no one-click permanent delete).
function DeleteControl({ onDelete, big }: { onDelete: () => void; big?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-[9px] text-slate-400">Delete?</span>
        <button onClick={() => { onDelete(); setConfirming(false); }} title="Confirm delete" className="p-0.5 text-red-400 hover:text-red-300"><Icon name="check" className="w-3 h-3" /></button>
        <button onClick={() => setConfirming(false)} title="Cancel" className="p-0.5 text-slate-500 hover:text-slate-300"><Icon name="x" className="w-3 h-3" /></button>
      </div>
    );
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); setConfirming(true); }} title="Delete"
      className={`${big ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'} p-1 text-slate-600 hover:text-red-400 transition-all shrink-0`}>
      <Icon name="trash" className="w-3 h-3" />
    </button>
  );
}

// The single thing you're working on now.
function NowCard({ draft, onDelete }: { draft: Draft | null; onDelete: (id: string) => void }) {
  if (!draft) {
    return (
      <div className="mx-3 mb-2 rounded-lg border border-dashed border-slate-700/60 px-3 py-3 text-center">
        <p className="text-[11px] text-slate-600">Nothing in focus</p>
        <p className="text-[10px] text-slate-700">Capture an idea or open one below</p>
      </div>
    );
  }
  return (
    <div
      data-active-draft="true"
      data-idea={isIdea(draft) ? 'true' : undefined}
      className="mx-3 mb-2 group rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2.5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Icon name={TYPE_ICON[draft.type] || 'file-text'} className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
        <span className="text-[8px] uppercase tracking-widest text-indigo-300/80 font-bold">Now</span>
        <span className="flex-1" />
        <DeleteControl onDelete={() => onDelete(draft.id)} big />
      </div>
      <div className="text-sm font-medium text-white truncate mt-1">{draft.title || 'Untitled'}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{isIdea(draft) ? 'Idea' : 'Draft'} · {typeLabel(draft.type)}</div>
    </div>
  );
}

function CollapsibleSection({ label, items, activeId, onOpen, onDelete, defaultOpen = false }: {
  label: string; items: Draft[]; activeId: string | null;
  onOpen: (id: string) => void; onDelete: (id: string) => void; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;
  return (
    <div className="px-3 pb-1">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-1.5 py-1.5 text-[9px] uppercase tracking-widest text-slate-500 font-bold hover:text-slate-400 transition-colors">
        <Icon name={open ? 'chevron-down' : 'chevron-up'} className="w-3 h-3" />
        {label} <span className="text-slate-600">({items.length})</span>
      </button>
      {open && (
        <div className="space-y-0.5 pb-1">
          {items.map(d => (
            <div key={d.id} onClick={() => onOpen(d.id)} data-active-draft={activeId === d.id ? 'true' : undefined}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
              <Icon name={TYPE_ICON[d.type] || 'file-text'} className="w-3 h-3 shrink-0 opacity-60" />
              <span className="flex-1 text-[11px] truncate">{d.title || 'Untitled'}</span>
              <DeleteControl onDelete={() => onDelete(d.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeftSidebar() {
  const { personas, activePersonaId, openDraft, drafts, deleteDraft, activeDraftId } = useApp();
  const persona = personas[activePersonaId];

  const all = drafts[activePersonaId] || [];
  const now = all.find(d => d.id === activeDraftId) ?? null;
  const rest = all.filter(d => d.id !== activeDraftId).sort((a, b) => b.updatedAt - a.updatedAt);
  const draftItems = rest.filter(d => !isIdea(d));
  const ideaItems = rest.filter(d => isIdea(d));

  return (
    <aside className="w-64 border-r border-slate-800 glass flex flex-col z-10 shrink-0">
      <PersonaSelector />
      <CaptureBox />

      <ScrollArea className="flex-1">
        <NowCard draft={now} onDelete={deleteDraft} />
        <CollapsibleSection label="Drafts" items={draftItems} activeId={activeDraftId} onOpen={openDraft} onDelete={deleteDraft} />
        <CollapsibleSection label="Ideas" items={ideaItems} activeId={activeDraftId} onOpen={openDraft} onDelete={deleteDraft} />
        {!now && draftItems.length === 0 && ideaItems.length === 0 && (
          <p className="px-3 text-[10px] text-slate-700 text-center mt-2">Your queue is empty.</p>
        )}
      </ScrollArea>

      {/* Publishing */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Publish</label>
          <button className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors"><Icon name="share-2" className="w-3.5 h-3.5" /></button>
        </div>
        <div className="space-y-1">
          {(persona.channels || []).map(ch => (
            <button key={ch.name} onClick={() => ch.url && window.open(ch.url, '_blank')} disabled={!ch.url}
              className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${ch.url ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-700 cursor-default'}`}>
              {ch.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
