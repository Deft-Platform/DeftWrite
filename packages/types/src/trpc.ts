import { z } from 'zod';

// --- Shared tRPC router types ---
export const personaCreateSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(50),
  emoji: z.string().length(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string(),
  systemPrompt: z.string().default(''),
  tone: z.string().max(50).default('professional'),
  styleNotes: z.string().default(''),
});

export const personaUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  emoji: z.string().length(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().optional(),
  systemPrompt: z.string().optional(),
  tone: z.string().max(50).optional(),
  styleNotes: z.string().optional(),
});

export const draftCreateSchema = z.object({
  userId: z.string(),
  personaId: z.string(),
  title: z.string().max(200).default('Untitled'),
  content: z.string().default(''),
  contentType: z.enum(['article', 'book', 'social']).default('article'),
  status: z.enum(['not-started', 'outlining', 'draft', 'polish', 'published']).default('not-started'),
});

export const draftUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  contentType: z.enum(['article', 'book', 'social']).optional(),
  status: z.enum(['not-started', 'outlining', 'draft', 'polish', 'published']).optional(),
  currentFont: z.string().max(50).optional(),
});

export const ideaCreateSchema = z.object({
  userId: z.string(),
  personaId: z.string(),
  content: z.string().min(1).max(500),
});

export const ideaUpdateSchema = z.object({
  content: z.string().min(1).max(500).optional(),
  status: z.enum(['not-started', 'outlining', 'draft', 'polish', 'published']).optional(),
  contentType: z.enum(['article', 'book', 'social']).optional(),
});

export const commentCreateSchema = z.object({
  draftId: z.string(),
  text: z.string().min(1).max(2000),
  rangeStart: z.number().int().optional(),
  rangeEnd: z.number().int().optional(),
  parentId: z.string().nullish(),
});

export const chatMessageSendSchema = z.object({
  draftId: z.string(),
  content: z.string().min(1).max(10000),
});

export const aiConfigUpdateSchema = z.object({
  provider: z.enum(['platform', 'together', 'openai', 'local']).optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
});

export const suggestionActionSchema = z.object({
  id: z.string(),
  status: z.enum(['accepted', 'rejected']),
});

// --- Shared types ---
export type Persona = {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  icon: string;
  systemPrompt: string;
  tone: string;
  styleNotes: string;
  createdAt: Date;
};

export type Draft = {
  id: string;
  userId: string;
  personaId: string;
  title: string;
  content: string;
  contentType: string;
  status: string;
  currentFont: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Idea = {
  id: string;
  userId: string;
  personaId: string;
  content: string;
  status: string;
  contentType: string;
  createdAt: Date;
  draftId: string | null;
};

export type Comment = {
  id: string;
  draftId: string;
  userId: string;
  text: string;
  rangeStart: number | null;
  rangeEnd: number | null;
  parentId: string | null;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessage = {
  id: string;
  draftId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
};

export type AiConfig = {
  id: string;
  userId: string;
  personaId: string | null;
  provider: string;
  apiKey: string | null;
  model: string | null;
  baseUrl: string | null;
  updatedAt: Date;
};

export type Suggestion = {
  id: string;
  draftId: string;
  userId: string | null;
  oldText: string;
  newText: string;
  type: 'replace' | 'insert';
  status: 'pending' | 'accepted' | 'rejected';
  author: 'AI' | 'You';
  createdAt: Date;
};

export type Version = {
  id: string;
  draftId: string;
  userId: string | null;
  content: string;
  title: string;
  wordCount: number;
  checkpointName: string | null;
  createdAt: Date;
};

export type ProductivityStats = {
  id: string;
  userId: string;
  date: string;
  wordsWritten: number;
  pomodoroSessions: number;
  pomodoroTarget: number;
  wordGoal: number;
  createdAt: Date;
  updatedAt: Date;
};

