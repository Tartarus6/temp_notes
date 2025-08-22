import { json, type RequestHandler } from '@sveltejs/kit';
import { internalTrpc } from '$lib/server/internal-client';

// GET /api/notes/[id] - get a specific note
export const GET: RequestHandler = async ({ params }) => {
	try {
		const noteId = parseInt(params.id!);
		if (isNaN(noteId)) {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}
		
		const note = await internalTrpc.noteById.query(noteId);
		return json(note);
	} catch (error) {
		console.error('Error fetching note:', error);
		return json({ error: 'Failed to fetch note' }, { status: 500 });
	}
};

// PUT /api/notes/[id] - update a note
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const noteId = parseInt(params.id!);
		if (isNaN(noteId)) {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}
		
		const body = await request.json();
		const { name, content } = body;
		
		const note = await internalTrpc.noteUpdate.mutate({
			id: noteId,
			name,
			content
		});
		
		return json(note);
	} catch (error) {
		console.error('Error updating note:', error);
		return json({ error: 'Failed to update note' }, { status: 500 });
	}
};

// DELETE /api/notes/[id] - delete a note
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const noteId = parseInt(params.id!);
		if (isNaN(noteId)) {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}
		
		const note = await internalTrpc.noteDelete.mutate({ id: noteId });
		return json(note);
	} catch (error) {
		console.error('Error deleting note:', error);
		return json({ error: 'Failed to delete note' }, { status: 500 });
	}
};
