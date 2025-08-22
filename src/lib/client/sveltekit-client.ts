import type { Note } from '$lib/server/server';

// Base fetch wrapper with error handling
async function apiFetch(url: string, options: RequestInit = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'API request failed');
	}

	return response.json();
}

export async function fetchNotes(): Promise<Note[]> {
	return await apiFetch('/api/notes');
}

export async function createNote(input: {
	name: string;
	parentId: number | null;
	content?: string;
}): Promise<Note> {
	return await apiFetch('/api/notes', {
		method: 'POST',
		body: JSON.stringify({
			name: input.name,
			parentId: input.parentId,
			content: input.content || 'This is a new note'
		}),
	});
}

export async function deleteNote(input: { id: number }): Promise<Note> {
	return await apiFetch(`/api/notes/${input.id}`, {
		method: 'DELETE',
	});
}

export async function getNote(input: { id: number }): Promise<Note> {
	return await apiFetch(`/api/notes/${input.id}`);
}

export async function getNotesByParentId(parentId?: number): Promise<Note[]> {
	const parentParam = parentId !== undefined ? parentId : 'null';
	return await apiFetch(`/api/notes/by-parent/${parentParam}`);
}

export async function updateNote(input: { id: number; name: string; content: string }): Promise<Note> {
	const notes = await apiFetch(`/api/notes/${input.id}`, {
		method: 'PUT',
		body: JSON.stringify({
			name: input.name,
			content: input.content
		}),
	});
	return notes[0];
}

export async function renameNote(input: { id: number; newName: string }): Promise<Note | null> {
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

export async function moveNote(input: { id: number; newParentId: number | null }): Promise<Note> {
	return await apiFetch(`/api/notes/${input.id}/move`, {
		method: 'POST',
		body: JSON.stringify({
			newParentId: input.newParentId
		}),
	});
}

export async function searchNotes(searchText: string): Promise<Note[]> {
	return await apiFetch(`/api/search?q=${encodeURIComponent(searchText)}`);
}

// Helper function to get full path to a note (might be useful for breadcrumbs or navigation)
export async function getNotePath(noteId: number): Promise<Array<{ id: number; name: string }>> {
	const path: Array<{ id: number; name: string }> = [];
	let currentNote = await getNote({ id: noteId });

	while (currentNote) {
		path.unshift({ id: currentNote.id!, name: currentNote.name });

		if (currentNote.parentId === null) break;

		currentNote = await getNote({ id: currentNote.parentId! });
	}

	return path;
}

export async function uploadImageToServer(input: {
	filename: string;
	mimetype: string;
	data: string;
}) {
	return await apiFetch('/api/images', {
		method: 'POST',
		body: JSON.stringify(input),
	});
}

export async function getImageFromServer(imageId: string) {
	return await apiFetch(`/api/images/${imageId}`);
}
