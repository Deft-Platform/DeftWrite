import { z } from 'zod';

// --- User ---
export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// --- Persona ---
export const createPersonaSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(50),
  emoji: z.string().length(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string(),
  systemPrompt: z.string().default(''),
  tone: z.string().max(50).default('professional'),
  styleNotes: z.string().default(''),
});

export const personaSchema = createPersonaSchema.extend({
  createdAt: z.coerce.date(),
});

export const updatePersonaSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  emoji: z.string().length(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().optional(),
  systemPrompt: z.string().optional(),
  tone: z.string().max(50).optional(),
  styleNotes: z.string().optional(),
});

// --- Draft ---
export const createDraftSchema = z.object({
  userId: z.string(),
  personaId: z.string(),
  title: z.string().max(200).default('Untitled'),
  content: z.string().default(''),
  contentType: z.enum(['article', 'book', 'social']).default('article'),
  status: z.enum(['not-started', 'outlining', 'draft', 'polish', 'published']).default('not-started'),
  currentFont: z.string().max(50).default('Lora'),
});

export const draftSchema = createDraftSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const updateDraftSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  contentType: z.enum(['article', 'book', 'social']).optional(),
  status: z.enum(['not-started', 'outlining', 'draft', 'polish', 'published']).optional(),
  currentFont: z.string().max(50).optional(),
});

// --- Idea ---
export const createIdeaSchema = z.object({
  userId: z.string(),
  personaId: z.string(),
  content: z.string().min(1).max(500),
  status: z.enum(['not-started', 'outlining', 'draft', 'polish', 'published']).default('not-started'),
  contentType: z.enum(['article', 'book', 'social']).default('article'),
  draftId: z.string().nullish(),
});

export const ideaSchema = createIdeaSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
});

export const updateIdeaSchema = z.object({
  content: z.string().min(1).max(500).optional(),
  status: z.enum(['not-started', 'outlining', 'draft', 'polish', 'published']).optional(),
  contentType: z.enum(['article', 'book', 'social']).optional(),
});

// --- Outline ---
export const createOutlineSchema = z.object({
  draftId: z.string(),
  title: z.string().min(1).max(200),
  level: z.number().int().min(1).max(3).default(1),
  order: z.number().int().default(0),
  content: z.string().default(''),
});

export const outlineSchema = createOutlineSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
});

export const updateOutlineSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  level: z.number().int().min(1).max(3).optional(),
  order: z.number().int().optional(),
  content: z.string().optional(),
});

// --- Comment ---
export const createCommentSchema = z.object({
  draftId: z.string(),
  userId: z.string(),
  text: z.string().min(1).max(2000),
  rangeStart: z.number().int().optional(),
  rangeEnd: z.number().int().optional(),
  parentId: z.string().nullish(),
});

export const commentSchema = createCommentSchema.extend({
  id: z.string(),
  resolved: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const updateCommentSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  resolved: z.boolean().optional(),
});

// --- Chat Message ---
export const createChatMessageSchema = z.object({
  draftId: z.string(),
  userId: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
});

export const chatMessageSchema = createChatMessageSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
});

// --- AI Config ---
export const createAiConfigSchema = z.object({
  userId: z.string(),
  personaId: z.string().nullish(),
  provider: z.enum(['platform', 'together', 'openai', 'local']).default('platform'),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
});

export const aiConfigSchema = createAiConfigSchema.extend({
  id: z.string(),
  updatedAt: z.coerce.date(),
});

export const updateAiConfigSchema = z.object({
  provider: z.enum(['platform', 'together', 'openai', 'local']).optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
});

// --- Suggestion ---
export const createSuggestionSchema = z.object({
  draftId: z.string(),
  userId: z.string().nullish(),
  oldText: z.string(),
  newText: z.string(),
  type: z.enum(['replace', 'insert']).default('replace'),
  author: z.enum(['AI', 'You']).default('AI'),
});

export const suggestionSchema = createSuggestionSchema.extend({
  id: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected']).default('pending'),
  createdAt: z.coerce.date(),
});

export const updateSuggestionSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
});

// --- Version ---
export const createVersionSchema = z.object({
  draftId: z.string(),
  userId: z.string().nullish(),
  content: z.string(),
  title: z.string(),
  wordCount: z.number().int().default(0),
  checkpointName: z.string().optional(),
});

export const versionSchema = createVersionSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
});

// --- Productivity Stats ---
export const createProductivityStatsSchema = z.object({
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wordsWritten: z.number().int().default(0),
  pomodoroSessions: z.number().int().default(0),
  pomodoroTarget: z.number().int().default(4),
  wordGoal: z.number().int().default(1000),
});

export const productivityStatsSchema = createProductivityStatsSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const updateProductivityStatsSchema = z.object({
  wordsWritten: z.number().int().optional(),
  pomodoroSessions: z.number().int().optional(),
  pomodoroTarget: z.number().int().optional(),
  wordGoal: z.number().int().optional(),
});

// --- Pagination ---
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  });

// --- Re-exports ---
export type User = z.infer<typeof userSchema>;
export type CreateDraft = z.infer<typeof createDraftSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type UpdateDraft = z.infer<typeof updateDraftSchema>;
export type Persona = z.infer<typeof personaSchema>;
export type CreatePersona = z.infer<typeof createPersonaSchema>;
export type UpdatePersona = z.infer<typeof updatePersonaSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type CreateIdea = z.infer<typeof createIdeaSchema>;
export type Outline = z.infer<typeof outlineSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export type Version = z.infer<typeof versionSchema>;
export type ProductivityStats = z.infer<typeof productivityStatsSchema>;
