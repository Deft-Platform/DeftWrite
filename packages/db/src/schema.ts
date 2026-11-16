import { pgTable, text, varchar, boolean, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const personas = pgTable('personas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  emoji: varchar('emoji', { length: 2 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  icon: text('icon').notNull(),
  systemPrompt: text('system_prompt').default(''),
  tone: varchar('tone', { length: 50 }).default('professional'),
  styleNotes: text('style_notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contentTypes = pgTable('content_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  icon: text('icon').notNull(),
  desc: text('desc'),
});

export const drafts = pgTable('drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  personaId: uuid('persona_id').references(() => personas.id).notNull(),
  title: text('title').default('Untitled'),
  content: text('content').default(''),
  contentType: varchar('content_type', { length: 20 }).default('article'),
  status: varchar('status', { length: 20 }).default('not-started'),
  currentFont: varchar('current_font', { length: 50 }).default('Lora'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  personaId: uuid('persona_id').references(() => personas.id).notNull(),
  content: text('content').notNull(),
  status: varchar('status', { length: 20 }).default('not-started'),
  contentType: varchar('content_type', { length: 20 }).default('article'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  draftId: uuid('draft_id').references(() => drafts.id),
});

export const outlines = pgTable('outlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  title: text('title').notNull(),
  level: integer('level').default(1),
  order: integer('order').default(0),
  content: text('content').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// @ts-ignore - self-referential table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  text: text('text').notNull(),
  rangeStart: integer('range_start'),
  rangeEnd: integer('range_end'),
  // @ts-ignore - self-referential FK
  parentId: uuid('parent_id').references(() => comments.id),
  resolved: boolean('resolved').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 10 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiConfigs = pgTable('ai_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  personaId: uuid('persona_id').references(() => personas.id),
  provider: varchar('provider', { length: 20 }).default('platform'),
  apiKey: text('api_key'),
  model: text('model'),
  baseUrl: text('base_url'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const suggestions = pgTable('suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  oldText: text('old_text').notNull(),
  newText: text('new_text').notNull(),
  type: varchar('type', { length: 10 }).default('replace'),
  status: varchar('status', { length: 10 }).default('pending'),
  author: varchar('author', { length: 10 }).default('AI'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const versions = pgTable('versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  content: text('content').notNull(),
  title: text('title').notNull(),
  wordCount: integer('word_count').default(0),
  checkpointName: text('checkpoint_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productivityStats = pgTable('productivity_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  wordsWritten: integer('words_written').default(0),
  pomodoroSessions: integer('pomodoro_sessions').default(0),
  pomodoroTarget: integer('pomodoro_target').default(4),
  wordGoal: integer('word_goal').default(1000),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Sections (materialized from outlines for stable agent addressing) ---
export const sections = pgTable('sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  outlineId: uuid('outline_id').references(() => outlines.id),
  parentId: uuid('parent_id'),
  title: text('title').notNull().default(''),
  level: integer('level').default(1),
  order: integer('order').default(0),
  charStart: integer('char_start').default(0),
  charEnd: integer('char_end'),
  content: text('content').default(''),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Change Requests (agent/human edit workflow per section) ---
export const changeRequests = pgTable('change_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id),
  userId: uuid('user_id').references(() => users.id),
  author: varchar('author', { length: 20 }).default('human'),
  type: varchar('type', { length: 20 }).default('edit'),
  title: text('title').notNull(),
  description: text('description'),
  oldContent: text('old_content'),
  newContent: text('new_content'),
  status: varchar('status', { length: 20 }).default('pending'),
  reviewNotes: text('review_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Section Versions (granular version history) ---
export const sectionVersions = pgTable('section_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  draftId: uuid('draft_id').references(() => drafts.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  content: text('content').notNull(),
  wordCount: integer('word_count').default(0),
  checkpointName: text('checkpoint_name'),
  changeRequestId: uuid('change_request_id').references(() => changeRequests.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

