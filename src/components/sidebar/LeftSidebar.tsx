import { useApp } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';

function PersonaSelector() {
  const { activePersonaId, personas, setActivePersona } = useApp();

  return (
    <div className="p-3 border-b border-slate-800">
      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Persona</label>
      <div className="space-y-0.5">
        {(Object.values(personas) as { id: string; name: string; emoji: string; color: string }[]).map(p => (
          <button
            key={p.id}
            onClick={() => setActivePersona(p.id as any)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              activePersonaId === p.id
                ? 'bg-slate-700/60 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full persona-active-indicator"
              style={{ backgroundColor: p.color, opacity: activePersonaId === p.id ? 1 : 0.6 }}
            />
            <span>{p.emoji} {p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LeftSidebar() {
  const { personas, ideas, activePersonaId, openDraft, drafts, createDraft } = useApp();
  const [showNewDraft, setShowNewDraft] = useState(false);
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [newDraftType, setNewDraftType] = useState<'article' | 'book' | 'social'>('article');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewDraft && inputRef.current) inputRef.current.focus();
  }, [showNewDraft]);

  const handleNewDraft = () => {
    if (newDraftTitle.trim()) {
      createDraft(newDraftTitle.trim(), newDraftType);
      setNewDraftTitle('');
      setShowNewDraft(false);
    }
  };

  const persona = personas[activePersonaId];
  const personaIdeas = ideas[activePersonaId] || [];
  const personaDrafts = drafts[activePersonaId] || [];

  return (
    <aside className="w-64 border-r border-slate-800 glass flex flex-col z-10 shrink-0">
      <PersonaSelector />

      {/* Inbox */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 flex items-center justify-between">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Inbox</label>
          <button className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors">
            <i data-lucide="plus" className="w-3.5 h-3.5" />
          </button>
        </div>
        <ScrollArea className="flex-1 px-3 pt-2 pb-2">
          <div className="space-y-1.5">
            {personaIdeas.map(idea => (
              <div key={idea.id} className="idea-item group flex items-start justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 text-xs text-slate-400 cursor-pointer">
                <span className="flex-1 truncate">{idea.content}</span>
                <button className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-slate-400 transition-all">
                  <i data-lucide="trash-2" className="w-3 h-3" />
                </button>
              </div>
            ))}
            {personaIdeas.length === 0 && (
              <div className="px-2 py-4 text-xs text-slate-700 text-center italic">No ideas yet</div>
            )}
          </div>
        </ScrollArea>

        {/* Drafts */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Drafts</label>
            <button
              className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setShowNewDraft(true)}
              title="New draft"
            >
              <i data-lucide="file-plus" className="w-3.5 h-3.5" />
            </button>
          </div>

          {showNewDraft && (
            <div className="mb-2 space-y-1.5">
              <input
                ref={inputRef}
                type="text"
                placeholder="Draft title..."
                value={newDraftTitle}
                onChange={e => setNewDraftTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNewDraft()}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
              />
              <div className="flex gap-1">
                {(['article', 'book', 'social'] as const).map(ct => (
                  <button
                    key={ct}
                    onClick={() => setNewDraftType(ct)}
                    className={`ct-btn flex-1 ${newDraftType === ct ? 'active' : ''}`}
                  >
                    {ct.charAt(0).toUpperCase() + ct.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleNewDraft}
                  className="flex-1 px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-[10px] transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewDraft(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {personaDrafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => openDraft(draft.id)}
                className="draft-item w-full text-left px-2 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 truncate transition-colors"
              >
                {draft.title}
              </button>
            ))}
            {personaDrafts.length === 0 && (
              <div className="text-[10px] text-slate-700 px-2 italic">No drafts</div>
            )}
          </div>
        </div>
      </div>

      {/* Publishing */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Publish</label>
          <button className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 transition-colors">
            <i data-lucide="share-2" className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-1">
          {(persona.channels || []).map(ch => (
            <button
              key={ch.name}
              onClick={() => ch.url && window.open(ch.url, '_blank')}
              disabled={!ch.url}
              className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${
                ch.url
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-700 cursor-default'
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
