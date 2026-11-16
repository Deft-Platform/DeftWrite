import { z } from 'zod';
import { publicProcedure, router } from '../index';
import { sections, drafts, sectionVersions, outlines } from '@deftwrite/db';
import { eq, and, asc, sql } from 'drizzle-orm';

export const sectionsRouter = router({
  list: publicProcedure
    .input(z.object({
      draftId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.select()
        .from(sections)
        .where(eq(sections.draftId, input.draftId))
        .orderBy(asc(sections.order), asc(sections.createdAt));
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.select().from(sections).where(eq(sections.id, input.id)).limit(1);
      return result[0] ?? null;
    }),

  getByDraft: publicProcedure
    .input(z.object({
      draftId: z.string(),
      status: z.enum(['active', 'archived', 'merged']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const whereClause = and(
        eq(sections.draftId, input.draftId),
        input.status ? eq(sections.status, input.status) : undefined,
      );
      return await ctx.db.select()
        .from(sections)
        .where(whereClause)
        .orderBy(asc(sections.order), asc(sections.createdAt));
    }),

  create: publicProcedure
    .input(z.object({
      draftId: z.string(),
      outlineId: z.string().nullish(),
      parentId: z.string().nullish(),
      title: z.string().min(1).max(200).default('Untitled'),
      level: z.number().int().min(1).max(3).default(1),
      order: z.number().int().default(0),
      content: z.string().default(''),
    }))
    .mutation(async ({ input, ctx }) => {
      // Auto-assign char positions based on order if not provided
      const existingSections = await ctx.db.select()
        .from(sections)
        .where(eq(sections.draftId, input.draftId))
        .orderBy(asc(sections.order));

      let charStart = 0;
      if (existingSections.length > 0) {
        const last = existingSections[existingSections.length - 1] as typeof sections.$inferSelect;
        charStart = (last.charEnd ?? 0);
      }

      const [row] = await ctx.db.insert(sections).values({
        ...input,
        charStart,
        charEnd: charStart + (input.content ? input.content.length : 0),
      }).returning();
      return row;
    }),

  patch: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().optional(),
      level: z.number().int().min(1).max(3).optional(),
      order: z.number().int().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Save version snapshot before patching
      const [currentSection] = await ctx.db.select()
        .from(sections)
        .where(eq(sections.id, input.id))
        .limit(1);

      if (currentSection && input.content !== undefined) {
        await ctx.db.insert(sectionVersions).values({
          sectionId: currentSection.id,
          draftId: currentSection.draftId,
          userId: ctx.userId || null,
          content: currentSection.content ?? '',
          wordCount: (currentSection.content ?? '').split(/\s+/).filter(Boolean).length,
          checkpointName: `pre-patch-${new Date().toISOString()}`,
        } as typeof sectionVersions.$inferInsert);
      }

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) {
        updateData.content = input.content;
        const newEnd = (currentSection?.charStart ?? 0) + input.content.length;
        updateData.charEnd = newEnd;
      }
      if (input.level !== undefined) updateData.level = input.level;
      if (input.order !== undefined) updateData.order = input.order;

      const [row] = await ctx.db.update(sections)
        .set(updateData)
        .where(eq(sections.id, input.id))
        .returning();
      return row;
    }),

  regenerate: publicProcedure
    .input(z.object({
      draftId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get full draft content and existing outlines to materialize sections
      const [draft] = await ctx.db.select()
        .from(drafts)
        .where(eq(drafts.id, input.draftId))
        .limit(1);

      if (!draft) return null;

      // Remove existing active sections for this draft
      await ctx.db.update(sections)
        .set({ status: 'archived' })
        .where(and(eq(sections.draftId, input.draftId), eq(sections.status, 'active')));

      // Create a single section representing the full document
      const [newSection] = await ctx.db.insert(sections).values({
        draftId: input.draftId,
        title: draft.title || 'Document',
        level: 1,
        order: 0,
        content: draft.content ?? '',
        charStart: 0,
        charEnd: (draft.content ?? '').length,
        status: 'active',
      }).returning();

      return newSection;
    }),

  merge: publicProcedure
    .input(z.object({
      sourceId: z.string(),
      targetId: z.string(),
      userId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Merge source section content into target section
      const [targetSection] = await ctx.db.select()
        .from(sections)
        .where(eq(sections.id, input.targetId))
        .limit(1);

      if (!targetSection) return null;

      // Fetch source section content to actually merge it
      let sourceContent = '';
      if (input.sourceId !== input.targetId) {
        const [sourceSection] = await ctx.db.select()
          .from(sections)
          .where(eq(sections.id, input.sourceId))
          .limit(1);
        sourceContent = sourceSection?.content ?? '';
      }

      const mergedContent = (targetSection.content || '') + '\n\n' + sourceContent;
      const [updatedTarget] = await ctx.db.update(sections)
        .set({
          content: mergedContent,
          charEnd: 0 + mergedContent.length,
        })
        .where(eq(sections.id, input.targetId))
        .returning();

      // Archive source section
      await ctx.db.update(sections)
        .set({ status: 'merged' })
        .where(eq(sections.id, input.sourceId));

      // Save version
      const targetContent = (updatedTarget as any)?.content ?? mergedContent;
      await ctx.db.insert(sectionVersions).values({
        sectionId: input.targetId,
        draftId: targetSection.draftId,
        userId: input.userId || null,
        content: targetContent as string,
        wordCount: targetContent.split(/\s+/).filter(Boolean).length,
        checkpointName: 'post-merge',
      } as typeof sectionVersions.$inferInsert);

      return updatedTarget;
    }),
});
