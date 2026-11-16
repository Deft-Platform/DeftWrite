import { z } from 'zod';
import { publicProcedure, router } from '../index';
import { changeRequests, sections, drafts, sectionVersions } from '@deftwrite/db';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export const changesRouter = router({
  listByDraft: publicProcedure
    .input(z.object({
      draftId: z.string(),
      status: z.enum(['pending', 'approved', 'rejected', 'applied', 'cancelled']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.select()
        .from(changeRequests)
        .where(and(
          eq(changeRequests.draftId, input.draftId),
          input.status ? eq(changeRequests.status, input.status) : undefined,
        ))
        .orderBy(desc(changeRequests.createdAt));
    }),

  listBySection: publicProcedure
    .input(z.object({
      sectionId: z.string(),
      status: z.enum(['pending', 'approved', 'rejected', 'applied', 'cancelled']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.select()
        .from(changeRequests)
        .where(and(
          eq(changeRequests.sectionId, input.sectionId || ''),
          input.status ? eq(changeRequests.status, input.status) : undefined,
        ))
        .orderBy(desc(changeRequests.createdAt));
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.select()
        .from(changeRequests)
        .where(eq(changeRequests.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: publicProcedure
    .input(z.object({
      draftId: z.string(),
      sectionId: z.string().nullish(),
      author: z.enum(['human', 'AI']).default('human'),
      type: z.enum(['edit', 'rewrite', 'add_section', 'remove_section', 'review']).default('edit'),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      oldContent: z.string().optional(),
      newContent: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.insert(changeRequests).values({
        ...input,
        userId: ctx.userId || null,
      }).returning();
      return row;
    }),

  review: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['approved', 'rejected']),
      reviewNotes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.update(changeRequests)
        .set({
          status: input.status,
          reviewNotes: input.reviewNotes || null,
          reviewedBy: ctx.userId || null,
          reviewedAt: new Date(),
        })
        .where(eq(changeRequests.id, input.id))
        .returning();
      return row;
    }),

  apply: publicProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get the change request with its section/draft info
      const [changeReq] = await ctx.db.select()
        .from(changeRequests)
        .where(eq(changeRequests.id, input.id))
        .limit(1);

      if (!changeReq || !changeReq.newContent) {
        return null;
      }

      let result = null;

      if (changeReq.type === 'add_section' && changeReq.sectionId) {
        // Insert new section after the target section
        const [targetSection] = await ctx.db.select()
          .from(sections)
          .where(eq(sections.id, changeReq.sectionId))
          .limit(1);

        if (targetSection) {
          const nextOrder = (targetSection.order as number | null) ?? 0;
          const [newSection] = await ctx.db.insert(sections).values({
            draftId: changeReq.draftId,
            title: changeReq.title,
            content: changeReq.newContent,
            level: 2,
            order: nextOrder + 1,
            charStart: targetSection.charEnd ?? 0,
            charEnd: targetSection.charEnd ? targetSection.charEnd + changeReq.newContent.length : changeReq.newContent.length,
            status: 'active',
          }).returning();

          // Update subsequent section orders
          await ctx.db.execute(sql`UPDATE sections SET "order" = "order" + 1 WHERE "draft_id" = ${changeReq.draftId}`);

          result = newSection;
        }
      } else if (changeReq.sectionId && changeReq.newContent) {
        // Edit or rewrite existing section
        const updatedSections = await ctx.db.execute(
          sql`UPDATE sections SET content = ${changeReq.newContent}, title = COALESCE(${changeReq.title}, title), "char_end" = COALESCE("char_start", 0) + ${changeReq.newContent.length} WHERE id = ${changeReq.sectionId} RETURNING *`,
        );
        const updatedSection = (updatedSections as any).rows?.[0] ?? null;

        result = updatedSection;

        // Save version snapshot
        if (updatedSection && changeReq.oldContent) {
          await ctx.db.insert(sectionVersions).values({
            sectionId: changeReq.sectionId!,
            draftId: changeReq.draftId,
            userId: input.userId,
            content: changeReq.oldContent,
            wordCount: changeReq.oldContent.split(/\s+/).filter(Boolean).length,
            checkpointName: `pre-${changeReq.type}`,
            changeRequestId: changeReq.id,
          } as typeof sectionVersions.$inferInsert);
        }
      } else if (!changeReq.sectionId && changeReq.newContent) {
        // Full draft replacement
        await ctx.db.update(drafts)
          .set({
            content: changeReq.newContent,
            updatedAt: new Date(),
          })
          .where(eq(drafts.id, changeReq.draftId));
      }

      // Update change request status
      await ctx.db.update(changeRequests)
        .set({ status: 'applied' })
        .where(eq(changeRequests.id, input.id));

      return result;
    }),

  rollback: publicProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get all versions for this change request's section
      const [changeReq] = await ctx.db.select()
        .from(changeRequests)
        .where(eq(changeRequests.id, input.id))
        .limit(1);

      if (!changeReq) return null;

      if (changeReq.oldContent && changeReq.sectionId) {
        // Restore previous section content
        const [updatedSection] = await ctx.db.update(sections)
          .set({
            content: changeReq.oldContent,
            charEnd: changeReq.sectionId.length + changeReq.oldContent.length,
          })
          .where(eq(sections.id, changeReq.sectionId))
          .returning();

        // Save as version
        const secContent = (updatedSection as any)?.content ?? changeReq.oldContent;
        await ctx.db.insert(sectionVersions).values({
          sectionId: changeReq.sectionId!,
          draftId: changeReq.draftId,
          userId: input.userId || null,
          content: secContent as string,
          wordCount: secContent.split(/\s+/).filter(Boolean).length,
          checkpointName: `post-rollback`,
        } as typeof sectionVersions.$inferInsert);

        return updatedSection;
      } else if (changeReq.oldContent) {
        // Full draft rollback
        const [updatedDraft] = await ctx.db.update(drafts)
          .set({
            content: changeReq.oldContent,
            updatedAt: new Date(),
          })
          .where(eq(drafts.id, changeReq.draftId))
          .returning();

        return updatedDraft;
      }

      return null;
    }),

  cancel: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db.update(changeRequests)
        .set({ status: 'cancelled' })
        .where(eq(changeRequests.id, input.id))
        .returning();
      return row;
    }),
});
