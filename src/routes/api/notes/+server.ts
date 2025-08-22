import { json, type RequestHandler } from '@sveltejs/kit';
import { internalTrpc } from '$lib/server/internal-client';

// GET /api/notes - fetch all notes
export const GET: RequestHandler = async () => {
	try {
		const notes = await internalTrpc.noteList.query();
		return json(notes);
	} catch (error) {
		console.error('Error fetching notes:', error);
		return json({ error: 'Failed to fetch notes' }, { status: 500 });
	}
};

// POST /api/notes - create a new note
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { name, parentId, content } = body;
		
		const note = await internalTrpc.noteCreate.mutate({
			name,
			parentId: parentId || undefined,
			content: content || 'This is a new note'
		});
		
		return json(note);
	} catch (error) {
		console.error('Error creating note:', error);
		return json({ error: 'Failed to create note' }, { status: 500 });
	}
};
