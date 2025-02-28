import { db } from './db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { publicProcedure, router } from './trpc';
import { usersTable, notesTable } from './schema';

const listenPort = 3000;

const appRouter = router({
	userList: publicProcedure.query(async () => {
		// Retrieve users from a datasource, this is an imaginary database
		const users = await db.select().from(usersTable);

		return users;
	}),

	userById: publicProcedure.input(z.string()).query(async (opts) => {
		const { input } = opts;
		const user = await db.select().from(usersTable).where(eq(usersTable.name, input));
		return user;
	}),

	userCreate: publicProcedure
		.input(z.object({ name: z.string(), age: z.number(), email: z.string() }))
		.mutation(async (opts) => {
			const { input } = opts;
			const user = await db.insert(usersTable).values({
				name: input.name,
				age: input.age,
				email: input.email
			});
			return user;
		}),

	noteList: publicProcedure.query(async () => {
		const notes = await db.select().from(notesTable);
		return notes;
	}),

	noteCreate: publicProcedure
		.input(z.object({ name: z.string(), content: z.string() }))
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db.insert(notesTable).values({
				name: input.name,
				content: input.content
			});
			return note;
		}),

	noteById: publicProcedure.input(z.number()).query(async (opts) => {
		const { input } = opts;
		const note = await db.select().from(notesTable).where(eq(notesTable.id, input));
		return note;
	}),

	noteUpdate: publicProcedure
		.input(z.object({ id: z.number(), name: z.string(), content: z.string() }))
		.mutation(async (opts) => {
			const { input } = opts;
			const note = await db
				.update(notesTable)
				.set({ name: input.name, content: input.content })
				.where(eq(notesTable.id, input.id))
				.returning();
			return note;
		})
});

const server = createHTTPServer({
	router: appRouter
});

export type AppRouter = typeof appRouter;
export type Note = typeof notesTable.$inferInsert;
server.listen(listenPort);
console.log(`Server listening on port ${listenPort}`);
