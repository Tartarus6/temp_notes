import { db } from './db';
import { z } from 'zod';
import { eq, isNull, and, or, SQL, sql } from 'drizzle-orm';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { publicProcedure, router } from './trpc';
import { notesTable, imagesTable } from './schema';
import { randomUUID } from 'crypto';

const listenPort = 3000;

// Helper function to get all child notes (recursive)
async function getAllChildrenIds(parentId: number): Promise<number[]> {
	const children = await db
		.select({ id: notesTable.id })
		.from(notesTable)
		.where(eq(notesTable.parentId, parentId));

	let childrenIds = children.map((child) => child.id);

	for (const child of children) {
		const nestedChildren = await getAllChildrenIds(child.id);
		childrenIds = [...childrenIds, ...nestedChildren];
	}

	return childrenIds;
}

const appRouter = router({
	noteList: publicProcedure.query(async () => {
		const notes = await db.select().from(notesTable);
		return notes;
	}),

	noteCreate: publicProcedure
		.input(
			z.object({
				name: z.string(),
				parentId: z.number().optional(),
				content: z.string()
			})
		)
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db
				.insert(notesTable)
				.values({
					name: input.name,
					parentId: input.parentId || null,
					content: input.content
				})
				.returning();
			return note[0];
		}),

	noteDelete: publicProcedure.input(z.object({ id: z.number() })).mutation(async (opts) => {
		const { input } = opts;

		// Get all child notes to delete as well
		const childrenIds = await getAllChildrenIds(input.id);

		// Delete the children first
		if (childrenIds.length > 0) {
			await db.delete(notesTable).where(
				sql`${notesTable.id} IN (${sql.join(
					childrenIds.map((id) => sql`${id}`),
					sql`, `
				)})`
			);
		}

		// Delete the parent note
		const note = await db.delete(notesTable).where(eq(notesTable.id, input.id)).returning();

		return note[0];
	}),

	noteById: publicProcedure.input(z.number()).query(async (opts) => {
		const { input } = opts;
		const note = await db.select().from(notesTable).where(eq(notesTable.id, input));
		return note[0];
	}),

	noteUpdate: publicProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string(),
				content: z.string()
			})
		)
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db
				.update(notesTable)
				.set({
					name: input.name,
					content: input.content
				})
				.where(eq(notesTable.id, input.id))
				.returning();
			return note;
		}),

	notesByParentId: publicProcedure.input(z.number().optional()).query(async (opts) => {
		const { input } = opts;
		let whereClause: SQL<unknown>;

		if (input === undefined) {
			// Get root notes (null parentId)
			whereClause = isNull(notesTable.parentId);
		} else {
			whereClause = eq(notesTable.parentId, input);
		}

		const notes = await db.select().from(notesTable).where(whereClause);

		return notes;
	}),

	// Search notes by name
	notesSearch: publicProcedure.input(z.string()).query(async (opts) => {
		const { input } = opts;
		const notes = await db
			.select()
			.from(notesTable)
			.where(sql`${notesTable.name} LIKE ${'%' + input + '%'}`);
		return notes;
	}),

	// Move a note to a new parent
	noteMove: publicProcedure
		.input(z.object({ id: z.number(), newParentId: z.number().nullable() }))
		.mutation(async (opts) => {
			const { input } = opts;

			// Check for circular references (can't move a note to be its own descendant)
			if (input.newParentId !== null) {
				let currentParent = input.newParentId;
				while (currentParent !== null) {
					if (currentParent === input.id) {
						throw new Error('Cannot move a note to be its own descendant');
					}
					const parent = await db.select().from(notesTable).where(eq(notesTable.id, currentParent));

					if (parent.length === 0 || parent[0].parentId === null) {
						break;
					}

					currentParent = parent[0].parentId;
				}
			}

			const note = await db
				.update(notesTable)
				.set({ parentId: input.newParentId })
				.where(eq(notesTable.id, input.id))
				.returning();

			return note[0];
		}),

	// Image handling
	imageUpload: publicProcedure
		.input(
			z.object({
				filename: z.string(),
				mimetype: z.string(),
				data: z.string() // Base64 encoded image data
			})
		)
		.mutation(async (opts) => {
			const { input } = opts;
			const imageId = randomUUID();

			const image = await db
				.insert(imagesTable)
				.values({
					id: imageId,
					filename: input.filename,
					mimetype: input.mimetype,
					data: input.data
				})
				.returning();

			return image[0];
		}),

	imageGet: publicProcedure
		.input(z.string()) // Image ID
		.query(async (opts) => {
			const { input } = opts;
			const image = await db.select().from(imagesTable).where(eq(imagesTable.id, input));

			return image[0];
		})
});

const server = createHTTPServer({
	router: appRouter
});

export type AppRouter = typeof appRouter;
export type Note = typeof notesTable.$inferInsert;
server.listen(listenPort);
console.log(`Server listening on port ${listenPort}`);
