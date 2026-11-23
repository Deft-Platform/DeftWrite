import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { playPomodoroSound } from '@/lib/pomodoraudio';
import { DEFAULT_VISUAL_STYLE } from '@/lib/visual';

interface VisualSnapshot {
  id: string;
  prompt: string;
  status: string;
  svg: string;
  role: string;
}
interface VisualInsertAttrs {
  visualId?: string;
  prompt?: string;
  status?: string;
  role?: string;
}
interface VisualNodeApi {
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}
import type {
  Persona, Idea, Draft, Comment, ChatMessage, AIConfig, FontFamily,
  SidebarView, PersonaId, DraftStatus, ContentType, PomodoroState
} from '@/types';

// ── Persistence layer ──────────────────────────────────────────────────────

const STORAGE_KEY_DRAFTS = 'deftwrite-drafts';
const STORAGE_KEY_IDEAS = 'deftwrite-ideas';
const STORAGE_KEY_SETTINGS = 'deftwrite-settings';
const STORAGE_KEY_AI = 'deftwrite-ai-config';
const STORAGE_KEY_FONT = 'deftwrite-font-family';
const STORAGE_KEY_VISUAL_STYLE = 'deftwrite-visual-style';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — continue without persistence.
  }
}

interface PersistedSettings {
  activePersonaId?: string;
  activeContentType?: string;
}

interface AppState extends PomodoroState {
  // Personas
  activePersonaId: PersonaId;
  personas: Record<PersonaId, Persona>;
  updatePersona: (id: PersonaId, updates: Partial<Persona>) => void;
  setActivePersona: (id: PersonaId) => void;

  // Drafts
  activeDraftId: string | null;
  drafts: Record<PersonaId, Draft[]>;
  activeDraft: Draft | null;
  openDraft: (draftId: string) => void;
  createDraft: (title: string, type: ContentType) => void;
  updateDraft: (draftId: string, updates: Partial<Draft>) => void;
  deleteDraft: (draftId: string) => void;

  // Ideas
  ideas: Record<PersonaId, Idea[]>;
  addIdea: (content: string) => void;
  deleteIdea: (ideaId: string) => void;
  startDraftFromIdea: (ideaId: string) => void;

  // Editor
  activeContentType: ContentType;
  setActiveContentType: (type: ContentType) => void;
  outlineSections: { id: string; title: string; visible: boolean }[];
  addOutlineSection: (title: string) => void;
  // Live table of contents, derived from the editor's headings (ECD-4).
  documentHeadings: { level: number; text: string }[];
  setDocumentHeadings: (headings: { level: number; text: string }[]) => void;

  // Visuals: inline AI-generated figure boxes.
  visualStyle: string;
  setVisualStyle: (s: string) => void;
  selectedVisualId: string | null;
  setSelectedVisualId: (id: string | null) => void;
  selectedVisual: VisualSnapshot | null;
  syncVisual: (id: string, data: Omit<VisualSnapshot, 'id'>) => void;
  registerVisual: (id: string, api: VisualNodeApi) => void;
  unregisterVisual: (id: string) => void;
  updateVisual: (id: string, attrs: Record<string, unknown>) => void;
  removeVisual: (id: string) => void;
  insertVisualRef: React.MutableRefObject<((attrs?: VisualInsertAttrs) => void) | null>;
  insertVisual: (attrs?: VisualInsertAttrs) => void;

  // AI Chat
  chatMessages: Record<string, ChatMessage[]>; // key: draftId
  addChatMessage: (draftId: string, message: ChatMessage) => void;
  clearChat: (draftId: string) => void;

  // Comments
  comments: Record<string, Comment[]>; // key: draftId
  addComment: (draftId: string, text: string) => string;
  addReply: (draftId: string, commentId: string, text: string) => void;
  dismissComment: (draftId: string, commentId: string) => void;

  // Sidebar
  sidebarView: SidebarView;
  activeThreadId: string | null;
  setSidebarView: (view: SidebarView) => void;
  setActiveThread: (threadId: string | null) => void;

  // AI Config
  aiConfig: AIConfig;
  setAIConfig: (config: Partial<AIConfig>) => void;

  // Font
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;

  // Pomodoro actions
  togglePomodoro: () => void;
  resetPomodoro: () => void;

  // Settings
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Focus mode
  focusMode: boolean;
  toggleFocusMode: () => void;

  // Draft management
  draftsPanelOpen: boolean;
  closeDrafts: () => void;
  allDrafts: Draft[];
  allDraftsMap: Record<string, Draft>;

  // Content save
  forceSaveRef: React.MutableRefObject<(() => void) | null>;
  forceSaveContent: () => void;
}

const defaultPersonas: Record<PersonaId, Persona> = {
  ethan: {
    id: 'ethan',
    name: 'Ethan',
    shortName: 'Ethan',
    emoji: '🧑‍💻',
    color: '#f472b6',
    inbox: [],
    drafts: [],
    systemPrompt: 'You are a helpful writing assistant for the DeftWrite platform founder.',
    channels: [
      { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', url: 'https://linkedin.com' },
    ],
  },
  tess: {
    id: 'tess',
    name: 'Tess',
    shortName: 'Tess',
    emoji: '👩‍🔬',
    color: '#38bdf8',
    inbox: [],
    drafts: [],
    systemPrompt: 'You are a helpful writing assistant for Tess.',
    channels: [
      { id: 'medium', name: 'Medium', icon: 'file-text', url: 'https://medium.com' },
    ],
  },
  piper: {
    id: 'piper',
    name: 'Piper',
    shortName: 'Piper',
    emoji: '🐕',
    color: '#a3e635',
    inbox: [],
    drafts: [],
    systemPrompt: 'You are a playful writing assistant for Piper.',
    channels: [
      { id: 'twitter', name: 'X / Twitter', icon: 'twitter', url: 'https://x.com' },
    ],
  },
  biz: {
    id: 'biz',
    name: 'Business',
    shortName: 'Biz',
    emoji: '💼',
    color: '#60a5fa',
    inbox: [
      { id: '1', content: 'Q4 Revenue Strategy', createdAt: Date.now() },
      { id: '2', content: 'Hiring Plan', createdAt: Date.now() - 3600000 },
    ],
    drafts: [],
    systemPrompt: 'You are a business writing assistant. Help refine professional, data-driven content for LinkedIn, Substack, and internal business documents. Tone: authoritative, clear, evidence-based.',
    channels: [
      { id: 'linkedin', name: 'LinkedIn Profile', icon: 'linkedin', url: 'https://www.linkedin.com/feed/' },
      { id: 'substack', name: 'Substack', icon: 'mail', url: 'https://substack.com/inbox' },
      { id: 'draft', name: 'Draft (Internal)', icon: 'file-text', url: undefined },
    ],
  },
  ent: {
    id: 'ent',
    name: 'Entrepreneur',
    shortName: 'Entre',
    emoji: '🚀',
    color: '#34d399',
    inbox: [
      { id: '3', content: 'SaaS Pivot Idea', createdAt: Date.now() - 7200000 },
    ],
    drafts: [],
    systemPrompt: 'You are an entrepreneur writing assistant. Help with bold, contrarian takes for X/Twitter, IndieHackers, and startup content. Tone: direct, opinionated, actionable.',
    channels: [
      { id: 'twitter', name: 'X / Twitter', icon: 'twitter', url: 'https://x.com/compose/post' },
      { id: 'indiehackers', name: 'IndieHackers', icon: 'globe', url: 'https://www.indiehackers.com/post/write-a-new-post' },
      { id: 'draft', name: 'Draft (Internal)', icon: 'file-text', url: undefined },
    ],
  },
  pseudo: {
    id: 'pseudo',
    name: 'Pseudonym',
    shortName: 'Pseudo',
    emoji: '👻',
    color: '#a78bfa',
    inbox: [],
    drafts: [],
    systemPrompt: 'You are a pseudonymous writer assistant. Help craft thoughtful, literary content for Medium and Substack. Tone: reflective, nuanced, accessible.',
    channels: [
      { id: 'medium', name: 'Medium', icon: 'file-text', url: 'https://medium.com/write' },
      { id: 'substack', name: 'Substack', icon: 'mail', url: 'https://substack.com/inbox' },
      { id: 'draft', name: 'Draft (Internal)', icon: 'file-text', url: undefined },
    ],
  },
};

const POMODORO_KEY = 'deftwrite-pomodoro-daily';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadDailyPomodoro(): { sessions: number; date: string; streak: number } {
  try {
    const raw = localStorage.getItem(POMODORO_KEY);
    if (!raw) return { sessions: 0, date: getTodayKey(), streak: 0 };
    const parsed = JSON.parse(raw);
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (parsed.date === today) {
      return { sessions: parsed.sessions || 0, date: today, streak: parsed.streak || 0 };
    }
    if (parsed.date === yesterday) {
      return { sessions: 0, date: today, streak: parsed.streak || 0 };
    }
    // Streak broken
    return { sessions: 0, date: today, streak: 0 };
  } catch {
    return { sessions: 0, date: getTodayKey(), streak: 0 };
  }
}

function saveDailyPomodoro(sessions: number, date: string, streak: number): void {
  try {
    localStorage.setItem(POMODORO_KEY, JSON.stringify({ sessions, date, streak }));
  } catch {
    // Storage unavailable — continue without persistence.
  }
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activePersonaId, setActivePersonaState] = useState<PersonaId>(() => {
    const saved = loadJSON<PersistedSettings>(STORAGE_KEY_SETTINGS, {});
    return (saved.activePersonaId as PersonaId) || 'biz';
  });
  const [personas, setPersonas] = useState<Record<PersonaId, Persona>>(defaultPersonas);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<PersonaId, Draft[]>>(() => {
    return loadJSON<Record<PersonaId, Draft[]>>(STORAGE_KEY_DRAFTS, {
      ethan: [], tess: [], piper: [], biz: [], ent: [], pseudo: [],
    });
  });
  const [ideas, setIdeas] = useState<Record<PersonaId, Idea[]>>(() => {
    return loadJSON<Record<PersonaId, Idea[]>>(STORAGE_KEY_IDEAS, {
      ethan: defaultPersonas.ethan.inbox,
      tess: defaultPersonas.tess.inbox,
      piper: defaultPersonas.piper.inbox,
      biz: defaultPersonas.biz.inbox,
      ent: defaultPersonas.ent.inbox,
      pseudo: defaultPersonas.pseudo.inbox,
    });
  });
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [sidebarView, setSidebarView] = useState<SidebarView>('chat');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [aiConfig, setAIConfigState] = useState<AIConfig>(() => {
    const saved = loadJSON<Partial<AIConfig>>(STORAGE_KEY_AI, {});
    return {
      provider: 'platform',
      model: '',
      personaPrompts: {
        ethan: '',
        tess: '',
        piper: '',
        biz: '',
        ent: '',
        pseudo: '',
      },
      ...saved,
    };
  });
  const [fontFamily, setFontFamily] = useState<FontFamily>(() =>
    loadJSON<FontFamily>(STORAGE_KEY_FONT, 'serif')
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeContentType, setActiveContentTypeState] = useState<ContentType>(() => {
    const saved = loadJSON<PersistedSettings>(STORAGE_KEY_SETTINGS, {});
    return (saved.activeContentType as ContentType) || 'article';
  });
  const [outlineSections, setOutlineSections] = useState<{ id: string; title: string; visible: boolean }[]>([]);
  const [documentHeadings, setDocumentHeadings] = useState<{ level: number; text: string }[]>([]);

  // ── Visuals ────────────────────────────────────────────────────────────
  const [visualStyle, setVisualStyle] = useState<string>(() =>
    loadJSON<string>(STORAGE_KEY_VISUAL_STYLE, DEFAULT_VISUAL_STYLE)
  );
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [selectedVisual, setSelectedVisual] = useState<VisualSnapshot | null>(null);
  const visualRegistry = useRef<Map<string, VisualNodeApi>>(new Map());
  const insertVisualRef = useRef<((attrs?: VisualInsertAttrs) => void) | null>(null);

  const registerVisual = useCallback((id: string, api: VisualNodeApi) => {
    visualRegistry.current.set(id, api);
  }, []);
  const unregisterVisual = useCallback((id: string) => {
    visualRegistry.current.delete(id);
  }, []);
  const updateVisual = useCallback((id: string, attrs: Record<string, unknown>) => {
    visualRegistry.current.get(id)?.updateAttributes(attrs);
  }, []);
  const removeVisual = useCallback((id: string) => {
    visualRegistry.current.get(id)?.deleteNode();
    setSelectedVisualId(null);
  }, []);
  const syncVisual = useCallback((id: string, data: Omit<VisualSnapshot, 'id'>) => {
    setSelectedVisual({ id, ...data });
  }, []);
  const insertVisual = useCallback((attrs?: VisualInsertAttrs) => {
    let visualId: string;
    try {
      visualId = `vis-${crypto.randomUUID().slice(0, 8)}`;
    } catch {
      visualId = `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    insertVisualRef.current?.({ ...attrs, visualId });
    setSelectedVisualId(visualId);
  }, []);

  // ── Persistence: drafts ────────────────────────────────────────────────
  useEffect(() => {
    saveJSON(STORAGE_KEY_DRAFTS, drafts);
  }, [drafts]);

  // ── Persistence: ideas ─────────────────────────────────────────────────
  useEffect(() => {
    saveJSON(STORAGE_KEY_IDEAS, ideas);
  }, [ideas]);

  // ── Persistence: settings (persona, content type) ──────────────────────
  useEffect(() => {
    saveJSON(STORAGE_KEY_SETTINGS, {
      activePersonaId,
      activeContentType,
    });
  }, [activePersonaId, activeContentType]);

  // ── Persistence: AI config ─────────────────────────────────────────────
  useEffect(() => {
    saveJSON(STORAGE_KEY_AI, aiConfig);
  }, [aiConfig]);

  // ── Persistence: font family ───────────────────────────────────────────
  useEffect(() => {
    saveJSON(STORAGE_KEY_FONT, fontFamily);
  }, [fontFamily]);

  // ── Persistence: visual house style ────────────────────────────────────
  useEffect(() => {
    saveJSON(STORAGE_KEY_VISUAL_STYLE, visualStyle);
  }, [visualStyle]);

  // Clear the selected-visual snapshot when nothing is selected.
  useEffect(() => {
    if (selectedVisualId === null) setSelectedVisual(null);
  }, [selectedVisualId]);

  const activeDraft = activeDraftId ? drafts[activePersonaId]?.find(d => d.id === activeDraftId) ?? null : null;

  // Pomodoro state — initialized from localStorage or defaults
  const dailyData = useRef(loadDailyPomodoro());
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    timeLeft: 25 * 60,
    isRunning: false,
    isWork: true,
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    sessionsCompletedInCycle: 0,
    dailySessions: dailyData.current.sessions,
    sessionStreak: dailyData.current.streak,
  });

  const pomodoroRef = useRef(pomodoro);
  pomodoroRef.current = pomodoro;

  // Interval-based countdown
  useEffect(() => {
    if (!pomodoro.isRunning) return;

    const interval = setInterval(() => {
      const current = pomodoroRef.current;
      const newTimeLeft = current.timeLeft - 1;

      if (newTimeLeft <= 0) {
        // Session complete
        playPomodoroSound();

        if (current.isWork) {
          const nextSessions = current.dailySessions + 1;
          const nextCycle = current.sessionsCompletedInCycle + 1;
          let newState: PomodoroState = {
            ...current,
            timeLeft: nextCycle >= 4 ? current.longBreakDuration : current.breakDuration,
            isRunning: false,
            isWork: false,
            dailySessions: nextSessions,
            sessionsCompletedInCycle: nextCycle,
          };
          dailyData.current = { ...dailyData.current, sessions: nextSessions };
          saveDailyPomodoro(nextSessions, dailyData.current.date, nextSessions > 0 ? current.sessionStreak + 1 : current.sessionStreak);
          setPomodoro(newState);
        } else {
          // Break ends — start new work session
          setPomodoro(prev => ({
            ...prev,
            timeLeft: prev.workDuration,
            isWork: true,
            isRunning: false,
          }));
        }
      } else {
        setPomodoro(prev => ({ ...prev, timeLeft: newTimeLeft }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoro.isRunning]);

  const setActivePersona = useCallback((id: PersonaId) => {
    setActivePersonaState(id);
    setActiveDraftId(null);
    setSidebarView('chat');
    setActiveThreadId(null);
  }, []);

  const updatePersona = useCallback((id: PersonaId, updates: Partial<Persona>) => {
    setPersonas(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }, []);

  const openDraft = useCallback((draftId: string) => {
    setActiveDraftId(draftId);
  }, []);

  const createDraft = useCallback((title: string, type: ContentType) => {
    const newDraft: Draft = {
      id: `draft-${Date.now()}`,
      title,
      content: '',
      type,
      personaId: activePersonaId,
      status: 'draft',
      priority: 'med',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      comments: [],
    };
    setDrafts(prev => ({
      ...prev,
      [activePersonaId]: [newDraft, ...(prev[activePersonaId] || [])],
    }));
    setActiveDraftId(newDraft.id);
    setSidebarView('chat');
  }, [activePersonaId]);

  const updateDraft = useCallback((draftId: string, updates: Partial<Draft>) => {
    setDrafts(prev => ({
      ...prev,
      [activePersonaId]: (prev[activePersonaId] || []).map(d =>
        d.id === draftId ? { ...d, ...updates, updatedAt: Date.now() } : d
      ),
    }));
  }, [activePersonaId]);

  const deleteDraft = useCallback((draftId: string) => {
    setDrafts(prev => ({
      ...prev,
      [activePersonaId]: (prev[activePersonaId] || []).filter(d => d.id !== draftId),
    }));
    if (activeDraftId === draftId) setActiveDraftId(null);
  }, [activePersonaId, activeDraftId]);

  const addIdea = useCallback((content: string) => {
    const newIdea: Idea = { id: `idea-${Date.now()}`, content, createdAt: Date.now() };
    setIdeas(prev => ({
      ...prev,
      [activePersonaId]: [newIdea, ...(prev[activePersonaId] || [])],
    }));
  }, [activePersonaId]);

  const deleteIdea = useCallback((ideaId: string) => {
    setIdeas(prev => ({
      ...prev,
      [activePersonaId]: (prev[activePersonaId] || []).filter(i => i.id !== ideaId),
    }));
  }, [activePersonaId]);

  const startDraftFromIdea = useCallback((ideaId: string) => {
    const idea = (ideas[activePersonaId] || []).find(i => i.id === ideaId);
    if (!idea) return;
    const newDraft: Draft = {
      id: `draft-${Date.now()}`,
      title: idea.content.slice(0, 50),
      content: '',
      type: activeContentType,
      personaId: activePersonaId,
      status: 'draft',
      priority: 'med',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      comments: [],
    };
    setDrafts(prev => ({
      ...prev,
      [activePersonaId]: [...(prev[activePersonaId] || []), newDraft],
    }));
    setActiveDraftId(newDraft.id);
    setIdeas(prev => ({
      ...prev,
      [activePersonaId]: (prev[activePersonaId] || []).filter(i => i.id !== ideaId),
    }));
  }, [activePersonaId, activeContentType, ideas]);

  const addChatMessage = useCallback((draftId: string, message: ChatMessage) => {
    setChatMessages(prev => ({
      ...prev,
      [draftId]: [...(prev[draftId] || []), message],
    }));
  }, []);

  const clearChat = useCallback((draftId: string) => {
    setChatMessages(prev => {
      const next = { ...prev };
      delete next[draftId];
      return next;
    });
  }, []);

  const addComment = useCallback((draftId: string, text: string): string => {
    const commentId = `comment-${Date.now()}`;
    const newComment: Comment = {
      id: commentId,
      draftId,
      text,
      replies: [],
      createdAt: Date.now(),
    };
    setComments(prev => ({
      ...prev,
      [draftId]: [...(prev[draftId] || []), newComment],
    }));
    return commentId;
  }, []);

  const addReply = useCallback((draftId: string, commentId: string, text: string) => {
    setComments(prev => ({
      ...prev,
      [draftId]: (prev[draftId] || []).map(c =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, { id: `reply-${Date.now()}`, text, createdAt: Date.now() }] }
          : c
      ),
    }));
  }, []);

  const dismissComment = useCallback((draftId: string, commentId: string) => {
    setComments(prev => ({
      ...prev,
      [draftId]: (prev[draftId] || []).filter(c => c.id !== commentId),
    }));
  }, []);

  const togglePomodoro = useCallback(() => {
    setPomodoro(prev => {
      if (!prev.isRunning) {
        // Start or resume — ensure we have the right timeLeft for current session type
        if (prev.isWork && prev.timeLeft === prev.workDuration && prev.sessionsCompletedInCycle === 0 && prev.dailySessions === 0) {
          return { ...prev, isRunning: true };
        }
        // If resuming after session end, set proper duration
        if (!prev.isWork) {
          const longBreak = prev.sessionsCompletedInCycle >= 4;
          return {
            ...prev,
            isRunning: true,
            timeLeft: longBreak ? prev.longBreakDuration : prev.breakDuration,
          };
        }
        return { ...prev, isRunning: true };
      }
      return { ...prev, isRunning: false };
    });
  }, []);

  const resetPomodoro = useCallback(() => {
    setPomodoro({
      timeLeft: 25 * 60,
      isRunning: false,
      isWork: true,
      workDuration: 25 * 60,
      breakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      sessionsCompletedInCycle: 0,
      dailySessions: 0,
      sessionStreak: 0,
    });
    dailyData.current = { sessions: 0, date: getTodayKey(), streak: 0 };
    saveDailyPomodoro(0, getTodayKey(), 0);
  }, []);

  const setAIConfig = useCallback((config: Partial<AIConfig>) => {
    setAIConfigState(prev => ({ ...prev, ...config }));
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const [draftsPanelOpen, setDraftsPanelOpen] = useState(false);
  const closeDrafts = useCallback(() => { setDraftsPanelOpen(false); }, []);
  const toggleFocusMode = useCallback(() => setFocusMode(prev => !prev), []);

  // Flatten all drafts across personas for the management panel
  const allDrafts = Object.values(drafts).flatMap(ds => ds);
  const allDraftsMap = Object.fromEntries(allDrafts.map(d => [d.id, d])) as Record<string, Draft>;

  // Forced save callback — signals editor to flush immediately
  const forceSaveRef = useRef<(() => void) | null>(null);
  const forceSaveContent = useCallback(() => {
    if (forceSaveRef.current) forceSaveRef.current();
  }, []);

  return (
    <AppContext.Provider value={{
      activePersonaId, personas, updatePersona, setActivePersona,
      activeDraftId, drafts, allDrafts, allDraftsMap, activeDraft, openDraft, createDraft, updateDraft, deleteDraft,
      ideas, addIdea, deleteIdea, startDraftFromIdea,
      activeContentType, setActiveContentType: setActiveContentTypeState,
      outlineSections, addOutlineSection: (title: string) => {
        setOutlineSections(prev => [...prev, { id: `section-${Date.now()}`, title, visible: true }]);
      },
      documentHeadings, setDocumentHeadings,
      visualStyle, setVisualStyle,
      selectedVisualId, setSelectedVisualId, selectedVisual,
      syncVisual, registerVisual, unregisterVisual, updateVisual, removeVisual,
      insertVisualRef, insertVisual,
      chatMessages, addChatMessage, clearChat,
      comments, addComment, addReply, dismissComment,
      sidebarView, activeThreadId, setSidebarView, setActiveThread: setActiveThreadId,
      aiConfig, setAIConfig,
      fontFamily, setFontFamily,
      ...pomodoro,
      togglePomodoro, resetPomodoro,
      settingsOpen, openSettings, closeSettings,
      focusMode, toggleFocusMode,
      forceSaveRef,
      draftsPanelOpen, closeDrafts, forceSaveContent,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
