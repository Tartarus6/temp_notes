import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/server';

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

export async function deleteNote(input: { path: string; name: string }) {
	const note = await trpc.noteDelete.mutate({
		path: input.path,
		name: input.name
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

export async function renameNote(input: { path: string; oldName: string; newName: string }) {
	// Get the note content first
	const note = (await trpc.noteByPath.query({ path: input.path, name: input.oldName })).at(0);
	if (!note) return null;

	// Create a new note with the new name and the same content
	const newNote = await trpc.noteCreate.mutate({
		path: input.path,
		name: input.newName,
		content: note.content
	});

	// Delete the old note
	if (newNote) {
		await trpc.noteDelete.mutate({
			path: input.path,
			name: input.oldName
		});
	}

	return newNote;
}

//TODO: might be smart to move things like localStorage out of here, i would want that in utils
export async function renameFolderAndUpdateFiles(input: { oldPath: string; newPath: string }) {
	// First get all notes
	const notes = await fetchNotes();

	// Find all notes that are within the old path
	const affectedNotes = notes.filter((note) => (note.path + note.name).startsWith(input.oldPath));

	// Check if current note is affected
	const currentNoteStr = localStorage.getItem('current-note');
	let currentNote = currentNoteStr ? JSON.parse(currentNoteStr) : null;
	const isCurrentNoteAffected =
		currentNote && (currentNote.path + currentNote.name).startsWith(input.oldPath);

	// Update each affected note
	for (const note of affectedNotes) {
		const newNotePath = note.path.replace(input.oldPath, input.newPath);

		// Create new note at new path
		const newNote = await trpc.noteCreate.mutate({
			path: newNotePath,
			name: note.name,
			content: note.content
		});

		// Delete old note if new note was created successfully
		if (newNote) {
			await trpc.noteDelete.mutate({
				path: note.path,
				name: note.name
			});

			// If this was the current note, update its path in localStorage
			if (currentNote && currentNote.name === note.name && currentNote.path === note.path) {
				currentNote = {
					name: note.name,
					path: newNotePath
				};
			}
		}
	}

	// If the current note was affected, update localStorage and reopen it
	if (isCurrentNoteAffected && currentNote) {
		localStorage.setItem('current-note', JSON.stringify(currentNote));
		// Import and call openNote from utils
		const { openNote } = await import('../utils');
		await openNote(currentNote);
	}

	return affectedNotes.length > 0;
}
