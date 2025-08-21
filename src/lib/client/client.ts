import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/server';
import { browser } from '$app/environment';

// Determine the API URL based on environment
const getApiUrl = () => {
	if (browser) {
		// In browser, use the current host with port 3000
		return `${window.location.protocol}//${window.location.hostname}:3000`;
	}
	// Server-side, use localhost
	return 'http://localhost:3000';
};

const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: getApiUrl()
		})
	]
});

export async function fetchNotes() {
	const notes = await trpc.noteList.query();
	return await notes;
}

export async function createNote(input: {
	name: string;
	parentId: number | null;
	content?: string;
}) {
	const note = await trpc.noteCreate.mutate({
		name: input.name,
		parentId: input.parentId || undefined,
		content: input.content || 'This is a new note'
	});
	return await note;
}

export async function deleteNote(input: { id: number }) {
	const note = await trpc.noteDelete.mutate({
		id: input.id
	});
	return await note;
}

export async function getNote(input: { id: number }) {
	const note = await trpc.noteById.query(input.id);
	return await note;
}

export async function getNotesByParentId(parentId?: number) {
	return await trpc.notesByParentId.query(parentId);
}

export async function updateNote(input: { id: number; name: string; content: string }) {
	const note = await trpc.noteUpdate.mutate({
		id: input.id,
		name: input.name,
		content: input.content
	});
	return note[0];
}

export async function renameNote(input: { id: number; newName: string }) {
	// Get the note first
	const note = await getNote({ id: input.id });
	if (!note) return null;

	// Update with the new name
	return await updateNote({
		id: input.id,
		name: input.newName,
		content: note.content
	});
}

export async function moveNote(input: { id: number; newParentId: number | null }) {
	return await trpc.noteMove.mutate({
		id: input.id,
		newParentId: input.newParentId
	});
}

export async function searchNotes(searchText: string) {
	return await trpc.notesSearch.query(searchText);
}

// Helper function to get full path to a note (might be useful for breadcrumbs or navigation)
export async function getNotePath(noteId: number): Promise<Array<{ id: number; name: string }>> {
	const path: Array<{ id: number; name: string }> = [];
	let currentNote = await getNote({ id: noteId });

	while (currentNote) {
		path.unshift({ id: currentNote.id, name: currentNote.name });

		if (currentNote.parentId === null) break;

		currentNote = await getNote({ id: currentNote.parentId });
	}

	return path;
}

export async function uploadImageToServer(input: {
	filename: string;
	mimetype: string;
	data: string;
}) {
	return await trpc.imageUpload.mutate(input);
}

export async function getImageFromServer(imageId: string) {
	return await trpc.imageGet.query(imageId);
}

// Export TRPC client for direct use in other files
export const client = trpc;
