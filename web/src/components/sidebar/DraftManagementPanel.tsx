import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import type { Draft } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  'not-started': 'bg-slate-700 text-slate-400',
  'outlining': 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  'draft': 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  'polish': 'bg-purple-500/15 text-purple-300 border border-purple-500/20',
  'published': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  'not-started': 'Not Started',
  'outlining': 'Outlining',
  'draft': 'Draft',
  'polish': 'Polish',
  'published': 'Published',
};

const STATUS_FLOW: Record<string, string> = {
  'not-started': 'outlining',
  'outlining': 'draft',
  'draft': 'polish',
  'polish': 'published',
};

export function DraftManagementPanel() {
  const { allDraftsMap, updateDraft, closeDrafts } = useApp();
  const [filter, setFilter] = useState<'all' | string>('all');

  const filtered = filter === 'all'
    ? Object.values(allDraftsMap) as Draft[]
    : (Object.values(allDraftsMap) as Draft[]).filter(d => d.status === filter);

  const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleAdvance = (id: string) => {
    const draft = allDraftsMap[id];
    if (!draft) return;
    const next = STATUS_FLOW[draft.status];
    if (next) {
      updateDraft(id, { status: next as Draft['status'] });
    }
  };

  const handleSelect = (id: string) => {
    // Navigate to this draft — handled by opening it in AppContext
  };

  return (
    <div className="px-3 py-2 border-t border-slate-800/50">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Drafts</label>
        <button
          onClick={closeDrafts}
          className="p-0.5 text-slate-600 hover:text-slate-400 transition-colors"
          title="Close"
        >
          <i data-lucide="x" className="w-3 h-3" />
        </button>
      </div>

      {/* Filter */}
      <select
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-1.5 py-1 text-[9px] outline-none text-slate-400 mb-2"
      >
        <option value="all">All Drafts ({(Object.values(allDraftsMap) as Draft[]).length})</option>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label} {((Object.values(allDraftsMap) as Draft[]).filter(d => d.status === key).length)}
          </option>
        ))}
      </select>

      {/* Draft List */}
      <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
        {sorted.length === 0 && (
          <div className="text-[9px] text-slate-600 italic text-center py-2">No drafts found</div>
        )}
        {sorted.map(draft => (
          <div
            key={draft.id}
            className={`group flex items-start gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
              draft.id === 'active' ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-800/30 hover:bg-slate-800/60'
            }`}
            onClick={() => handleSelect(draft.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-300 truncate">{draft.title || 'Untitled'}</span>
                <Badge
                  variant="outline"
                  className={`text-[8px] px-1 py-0 h-[14px] leading-none ${STATUS_COLORS[draft.status] || ''}`}
                >
                  {STATUS_LABELS[draft.status]}
                </Badge>
              </div>
              <div className="text-[8px] text-slate-600 mt-0.5">
                {new Date(draft.updatedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Advance button */}
            {STATUS_FLOW[draft.status] && (
              <button
                onClick={e => { e.stopPropagation(); handleAdvance(draft.id); }}
                className="p-0.5 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title={`Advance to ${STATUS_LABELS[STATUS_FLOW[draft.status]]}`}
              >
                <i data-lucide="arrow-right" className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
