import { db } from './db';
import { z } from 'zod';
import { eq, like } from 'drizzle-orm';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { publicProcedure, router } from './trpc';
import { notesTable } from './schema';

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
			return note;
		}),

	noteByPath: publicProcedure
		.input(z.object({ path: z.string(), name: z.string() }))
		.query(async (opts) => {
			const { input } = opts;
			const note = await db
				.select()
				.from(notesTable)
				.where(eq(notesTable.path, input.path) && eq(notesTable.name, input.name));
			return note;
		}),

	noteUpdate: publicProcedure
		.input(z.object({ path: z.string(), name: z.string(), content: z.string() }))
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db
				.update(notesTable)
				.set({ name: input.name, content: input.content })
				.where(eq(notesTable.path, input.path) && eq(notesTable.name, input.name))
				.returning();
			return note;
		}),

	//TODO: why is the input in some whacky characters?
	notesByPath: publicProcedure.input(z.string()).query(async (opts) => {
		const { input } = opts;
		const notes = await db
			.select()
			.from(notesTable)
			.where(like(notesTable.path, `${input}%`));
		return notes;
	})
});

const server = createHTTPServer({
	router: appRouter
});

export type AppRouter = typeof appRouter;
export type Note = typeof notesTable.$inferInsert;
server.listen(listenPort);
console.log(`Server listening on port ${listenPort}`);
