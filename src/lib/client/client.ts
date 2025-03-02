import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/server';

//     👆 **type-only** import
// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.

const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: 'http://localhost:3000'
		})
	]
});

export async function fetchNotes() {
	const notes = await trpc.noteList.query();

	return await notes;
}

export async function createNote(input: { path: string; name: string }) {
	const note = await trpc.noteCreate.mutate({
		path: input.path,
		name: input.name,
		content: 'This is a new note'
	});
	return await note;
}

export async function getNote(input: { path: string; name: string }) {
	const note = (await trpc.noteByPath.query({ path: input.path, name: input.name })).at(0);
	return await note;
}

export async function updateNote(input: { path: string; name: string; content: string }) {
	const note = await trpc.noteUpdate.mutate({
		path: input.path,
		name: input.name,
		content: input.content
	});
	return await note[0];
}
