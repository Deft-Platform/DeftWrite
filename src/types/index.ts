export type PersonaId = 'ethan' | 'tess' | 'piper';

export interface Persona {
  id: PersonaId;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  inbox: Idea[];
  drafts: Draft[];
  systemPrompt: string;
  channels: Channel[];
}

export interface Idea {
  id: string;
  content: string;
  createdAt: number;
}

export type DraftStatus = 'draft' | 'reviewing' | 'revising' | 'approved' | 'published';
export type ContentType = 'article' | 'book' | 'social';

export interface Draft {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  personaId: PersonaId;
  status: DraftStatus;
  createdAt: number;
  updatedAt: number;
  outline?: OutlineSection[];
  comments: Comment[];
}

export interface OutlineSection {
  id: string;
  title: string;
  visible: boolean;
}

export interface Comment {
  id: string;
  draftId: string;
  text: string;
  replies: CommentReply[];
  createdAt: number;
}

export interface CommentReply {
  id: string;
  text: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: Suggestion[];
}

export interface Suggestion {
  id: string;
  text: string;
  status: 'pending' | 'accepted' | 'rejected' | 'below';
}

export type AIProvider = 'platform' | 'together' | 'openai' | 'local';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  personaPrompts: Record<PersonaId, string>;
}

export type SidebarView = 'chat' | 'thread';

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isWork: boolean;
}

export type FontFamily = 'serif' | 'sans' | 'mono';
