import { db } from './db';
import { z } from 'zod';
import { eq, like, and } from 'drizzle-orm';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { publicProcedure, router } from './trpc';
import { notesTable, imagesTable } from './schema';
import { randomUUID } from 'crypto';

const listenPort = 3000;

const appRouter = router({
	noteList: publicProcedure.query(async () => {
		const notes = await db.select().from(notesTable);
		return notes;
	}),

	noteCreate: publicProcedure
		.input(
			z.object({
				name: z.string(),
				path: z.string().startsWith('/').endsWith('/'),
				content: z.string()
			})
		)
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db
				.insert(notesTable)
				.values({
					name: input.name,
					path: input.path,
					content: input.content
				})
				.returning();
			return note[0];
		}),

	noteDelete: publicProcedure
		.input(z.object({ path: z.string(), name: z.string() }))
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db
				.delete(notesTable)
				.where(and(eq(notesTable.path, input.path), eq(notesTable.name, input.name)))
				.returning();
			return note[0];
		}),

	noteByPath: publicProcedure
		.input(z.object({ path: z.string(), name: z.string() }))
		.query(async (opts) => {
			const { input } = opts;
			const note = await db
				.select()
				.from(notesTable)
				.where(and(eq(notesTable.path, input.path), eq(notesTable.name, input.name)));
			return note;
		}),

	noteUpdate: publicProcedure
		.input(z.object({ path: z.string(), name: z.string(), content: z.string() }))
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db
				.update(notesTable)
				.set({ name: input.name, content: input.content })
				.where(and(eq(notesTable.path, input.path), eq(notesTable.name, input.name)))
				.returning();
			return note;
		}),

	notesByPath: publicProcedure.input(z.string()).query(async (opts) => {
		const { input } = opts;
		const notes = await db
			.select()
			.from(notesTable)
			.where(like(notesTable.path, `${input}%`));
		return notes;
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
