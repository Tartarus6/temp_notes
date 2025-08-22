import { json, type RequestHandler } from '@sveltejs/kit';
import { internalTrpc } from '$lib/server/internal-client';

// POST /api/notes/[id]/move - move a note to a new parent
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const noteId = parseInt(params.id!);
		if (isNaN(noteId)) {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}
		
		const body = await request.json();
		const { newParentId } = body;
		
		const note = await internalTrpc.noteMove.mutate({
			id: noteId,
			newParentId: newParentId || null
		});
		
		return json(note);
	} catch (error) {
		console.error('Error moving note:', error);
		return json({ error: 'Failed to move note' }, { status: 500 });
	}
};
