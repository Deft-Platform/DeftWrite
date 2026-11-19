import { Icon } from '@/components/ui/icon';
import { useApp } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect } from 'react';
import { DraftManagementPanel } from './DraftManagementPanel';
import type { Draft, ChatMessage } from '@/types';
import { chatComplete, type ChatMsg } from '@/lib/ai';
import { draftToMarkdown } from '@/lib/markdown';

const CONTENT_TYPES = [
  { id: 'article', label: 'Article', icon: 'file-text', placeholder: 'Start writing your article...' },
  { id: 'book', label: 'Book', icon: 'book', placeholder: 'Begin your book...' },
  { id: 'social', label: 'Social', icon: 'share-2', placeholder: 'Draft your social post...' },
] as const;

const QUICK_ACTIONS = [
  { prompt: 'Give a short, specific critique of this draft: what is working and the two or three most impactful things to change.', label: 'Critique' },
  { prompt: 'Suggest how to expand this draft with concrete additions — sections, examples, or evidence it is missing.', label: 'Expand' },
  { prompt: 'Rewrite this draft to be simpler and clearer without losing meaning. Return the rewrite.', label: 'Simplify' },
  { prompt: 'Improve the flow and transitions of this draft. Point out specific rough spots and how to smooth them.', label: 'Improve Flow' },
  { prompt: 'Suggest where this draft needs supporting evidence or citations, and what kind of source would strengthen each claim.', label: 'Find Evidence' },
];

const AI_ERROR_RESPONSE = "I couldn't reach the writing model.\n\nThe AI runs through the halo gateway, which is only reachable on the Tailscale network while the dev server is running. Check your connection and try again.";

const STATUS_FLOW: Record<string, string> = {
  'not-started': 'outlining',
  'outlining': 'draft',
  'draft': 'polish',
  'polish': 'published',
};

const STATUS_LABELS: Record<string, string> = {
  'not-started': 'Not Started',
  'outlining': 'Outlining',
  'draft': 'Draft',
  'polish': 'Polish',
  'published': 'Published',
};

// ECD-4: live table of contents, auto-generated from the document's headings.
function OutlinePanel() {
  const { documentHeadings } = useApp();

  const goToHeading = (index: number) => {
    const nodes = document.querySelectorAll('.ProseMirror :is(h1, h2, h3)');
    const el = nodes[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="px-3 py-3 border-t border-slate-800/50">
      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Outline</label>
      {documentHeadings.length === 0 ? (
        <div className="text-[10px] text-slate-700 italic text-center py-3">
          Add H1–H3 headings and they'll appear here
        </div>
      ) : (
        <div className="space-y-0.5">
          {documentHeadings.map((h, i) => (
            <button
              key={`${i}-${h.text}`}
              onClick={() => goToHeading(i)}
              className="w-full text-left truncate text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded px-1.5 py-1 transition-colors"
              style={{ paddingLeft: `${(h.level - 1) * 12 + 6}px` }}
              title={h.text}
            >
              {h.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookOutlinePanel() {
  const { outlineSections, addOutlineSection } = useApp();
  const [newSection, setNewSection] = useState('');
  const [mode, setMode] = useState<'chapters' | 'parts'>('chapters');

  const handleAdd = () => {
    if (newSection.trim()) {
      addOutlineSection(newSection.trim());
      setNewSection('');
    }
  };

  return (
    <div className="px-3 py-3 border-t border-slate-800/50">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Book Outline</label>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('chapters')}
            className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
              mode === 'chapters' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            Chapters
          </button>
          <button
            onClick={() => setMode('parts')}
            className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
              mode === 'parts' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            Parts
          </button>
        </div>
      </div>
      <div className="space-y-1 mb-2">
        {outlineSections.length === 0 && (
          <div className="text-[10px] text-slate-700 italic text-center py-3">No outline sections yet</div>
        )}
        {outlineSections.map(section => (
          <div key={section.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/40 text-[11px] text-slate-400 group">
            <Icon name={mode === 'chapters' ? 'file-text' : 'book-open'} className="w-3 h-3 shrink-0" />
            <span className="truncate flex-1">{section.title}</span>
            <button className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-slate-400 transition-all">
              <Icon name="eye" className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newSection}
          onChange={e => setNewSection(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`Add ${mode}...`}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
        />
        <button
          onClick={handleAdd}
          className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-[10px] transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function SocialPostPanel() {
  const [postMode, setPostMode] = useState<'single' | 'thread' | 'cross-platform'>('single');

  const PLATFORMS = [
    { id: 'twitter', label: 'X / Twitter', icon: 'twitter', maxLength: 280 },
    { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', maxLength: 3000 },
    { id: 'mastodon', label: 'Mastodon', icon: 'message-circle', maxLength: 500 },
  ];

  return (
    <div className="px-3 py-3 border-t border-slate-800/50">
      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Social Post Mode</label>
      <div className="flex gap-1 mb-3">
        {[
          { id: 'single' as const, label: 'Single', icon: 'file-text' },
          { id: 'thread' as const, label: 'Thread', icon: 'list' },
          { id: 'cross-platform' as const, label: 'Multi', icon: 'share-2' },
        ].map(pm => (
          <button
            key={pm.id}
            onClick={() => setPostMode(pm.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-md text-[10px] transition-all ${
              postMode === pm.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Icon name={pm.icon} className="w-3.5 h-3.5" />
            <span className="font-medium">{pm.label}</span>
          </button>
        ))}
      </div>

      {postMode === 'thread' && (
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Thread tweets</span>
            <span className="text-slate-600">1 / 10 max</span>
          </div>
          {[1].map(i => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-[9px] text-slate-600 w-4 shrink-0 flex justify-end pt-1">{i}</span>
              <textarea
                placeholder={`Tweet ${i}...`}
                rows={2}
                maxLength={280}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5 text-xs outline-none focus:border-indigo-500/50 placeholder:text-slate-600 resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {postMode === 'cross-platform' && (
        <div className="space-y-2 mb-3">
          {PLATFORMS.map(plat => (
            <div key={plat.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800/40 group">
              <Icon name={plat.icon} className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400">{plat.label}</div>
                <div className="text-[9px] text-slate-600">{plat.maxLength} chars</div>
              </div>
              <button className="p-0.5 text-slate-700 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                <Icon name="edit-3" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {postMode === 'single' && (
        <div className="text-[10px] text-slate-600 italic text-center py-3">Select a platform from your persona settings to publish</div>
      )}
    </div>
  );
}

 export function RightSidebar() {
   const {
     sidebarView, activeThreadId, chatMessages, activeDraftId,
     addChatMessage, setSidebarView, setActiveThread,
     comments, dismissComment, activeContentType, updateDraft, setActiveContentType,
     activeDraft, forceSaveContent, personas, activePersonaId, aiConfig,
   } = useApp();

   const [saveFlash, setSaveFlash] = useState(false);
   const [showDrafts, setShowDrafts] = useState(false);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const draftKey = activeDraftId || 'no-draft';
  const messages = chatMessages[draftKey] || [];
  const threadComments = comments[draftKey] || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Build the system prompt from the active persona and current draft so the
  // assistant answers in the right voice and with the draft as context.
  const buildSystemPrompt = (): string => {
    const persona = personas[activePersonaId];
    const personaPrompt =
      aiConfig.personaPrompts?.[activePersonaId]?.trim() ||
      persona?.systemPrompt?.trim() ||
      'You are a sharp, concise writing assistant.';
    const parts = [
      personaPrompt,
      `You are the writing assistant inside DeftWrite, helping with a ${activeContentType}. Be concise and practical. When asked to rewrite, return the rewritten text only.`,
    ];
    if (activeDraft) {
      let body = '';
      try {
        body = draftToMarkdown(activeDraft.title, JSON.parse(activeDraft.content || '{}'));
      } catch {
        body = activeDraft.title || '';
      }
      body = body.trim().slice(0, 6000);
      if (body) parts.push(`Current draft:\n"""\n${body}\n"""`);
    }
    return parts.join('\n\n');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addChatMessage(draftKey, userMsg);
    setInput('');
    setIsTyping(true);

    const history: ChatMsg[] = messages
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));
    const payload: ChatMsg[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...history,
      { role: 'user', content: text },
    ];

    try {
      const reply = await chatComplete(payload, { model: aiConfig.model || undefined });
      addChatMessage(draftKey, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      });
    } catch {
      addChatMessage(draftKey, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: AI_ERROR_RESPONSE,
        timestamp: Date.now(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  if (sidebarView === 'thread' && activeThreadId) {
    const thread = threadComments.find(c => c.id === activeThreadId);
    if (!thread) {
      setSidebarView('chat');
      return null;
    }

    return (
      <aside className="w-72 border-l border-slate-800 glass flex flex-col z-10 shrink-0">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSidebarView('chat'); setActiveThread(null); }}
              className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 rounded transition-colors"
            >
              <Icon name="arrow-left" className="w-3 h-3 inline mr-0.5" /> Back
            </button>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Comment Thread</span>
          </div>
          <span className="text-[9px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-full">Discussion</span>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px]">
          <div className="space-y-2">
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
              <div className="text-slate-300 font-medium mb-1">You</div>
              <p className="text-slate-400 leading-relaxed">{thread.text}</p>
            </div>
            {thread.replies.map(reply => (
              <div key={reply.id} className="bg-slate-800/20 p-2.5 rounded-lg ml-4 border border-slate-800/30">
                <div className="text-slate-500 text-[10px] mb-0.5">{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <p className="text-slate-400 leading-relaxed">{reply.text}</p>
              </div>
            ))}
            {thread.replies.length === 0 && (
              <div className="text-center text-slate-700 text-[10px] italic py-4">No replies yet</div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-slate-800 shrink-0">
          <ReplyInput onReply={(text) => {}} />
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => dismissComment(draftKey, thread.id)}
              className="flex-1 px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Chat view
  return (
    <aside className="w-72 border-l border-slate-800 glass flex flex-col z-10 shrink-0">
      {/* Header with Content Type Selector */}
      <div className="p-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Chat</span>
            <span className="text-[9px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-full">AI</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                showDrafts
                  ? 'bg-slate-700 text-slate-200'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="View drafts"
            >
              <Icon name="folder-tree" className="w-3 h-3" />
            </button>
            <button
              onClick={async () => {
                if (!activeDraftId || !activeDraft) return;
                forceSaveContent();
                const nextStatus = STATUS_FLOW[activeDraft.status];
                if (nextStatus) {
                  updateDraft(activeDraftId, { status: nextStatus as Draft['status'] });
                }
                setSaveFlash(true);
                setTimeout(() => setSaveFlash(false), 1200);
              }}
              disabled={!activeDraftId}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all ${
                saveFlash
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300'
              } ${!activeDraftId ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon name={saveFlash ? 'check' : 'save'} className="w-3 h-3" />
              <span>{saveFlash ? 'Saved' : 'Save / File It'}</span>
            </button>
          </div>
        </div>
        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">Content Type</label>
        <div className="flex gap-1">
          {CONTENT_TYPES.map(ct => (
            <button
              key={ct.id}
              onClick={() => setActiveContentType(ct.id as 'article' | 'book' | 'social')}
              className={`flex-1 flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-md text-[10px] transition-all ${
                activeContentType === ct.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
              title={ct.placeholder.split('\n')[0]}
            >
              <Icon name={ct.icon} className="w-3.5 h-3.5" />
              <span>{ct.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic panel based on content type */}
      {(activeContentType === 'article' || activeContentType === 'book') && <OutlinePanel />}
      {activeContentType === 'book' && <BookOutlinePanel />}
      {activeContentType === 'social' && <SocialPostPanel />}

      {/* Draft Management Panel */}
      {showDrafts && <DraftManagementPanel />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar text-sm">
          <div className="bg-slate-800/40 p-2.5 rounded-lg text-slate-400 text-xs leading-relaxed border border-slate-700/30">
            Start writing. I'll watch your draft and suggest improvements, counterpoints, or expansions when you ask.
          </div>
          {messages.map(msg => (
            <div key={msg.id} className={`chat-msg-new ${msg.role === 'assistant' ? 'bg-slate-800/40' : 'bg-indigo-500/10'} p-2.5 rounded-lg text-xs leading-relaxed border ${
              msg.role === 'assistant' ? 'border-slate-700/30' : 'border-indigo-500/20'
            }`}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0">{line}</p>
              ))}
            </div>
          ))}
          {isTyping && (
            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-3 pb-2">
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.prompt}
                onClick={() => sendMessage(qa.prompt)}
                className="quick-act px-2 py-1 text-[10px] bg-slate-800/50 hover:bg-slate-700/60 text-slate-500 hover:text-slate-300 rounded-full transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex gap-1.5 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('Suggest an edit to improve this draft.')}
              className="flex-1 px-2 py-1.5 text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded transition-colors border border-amber-500/20 flex items-center justify-center gap-1"
            >
              <Icon name="pencil" className="w-3 h-3" />
              Suggest Edit
            </Button>
          </div>
          <div className="relative">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              rows={2}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 pr-9 text-xs outline-none focus:border-purple-500/50 transition-colors resize-none placeholder:text-slate-600"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 top-2 p-1 text-purple-500/60 hover:text-purple-400 transition-colors"
            >
              <Icon name="arrow-up" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ReplyInput({ onReply }: { onReply: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="relative">
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onReply(text);
            setText('');
          }
        }}
        placeholder="Reply..."
        rows={2}
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 pr-9 text-xs outline-none focus:border-purple-500/50 transition-colors resize-none placeholder:text-slate-600"
      />
      <button
        onClick={() => { if (text.trim()) { onReply(text); setText(''); } }}
        className="absolute right-2 top-2 p-1 text-purple-500/60 hover:text-purple-400 transition-colors"
      >
        <Icon name="arrow-up" className="w-4 h-4" />
      </button>
    </div>
  );
}
