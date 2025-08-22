import { json, type RequestHandler } from '@sveltejs/kit';
import { internalTrpc } from '$lib/server/internal-client';

// GET /api/notes/by-parent/[parentId] - get notes by parent ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		let parentId: number | undefined = undefined;
		
		if (params.parentId && params.parentId !== 'null') {
			parentId = parseInt(params.parentId);
			if (isNaN(parentId)) {
				return json({ error: 'Invalid parent ID' }, { status: 400 });
			}
		}
		
		const notes = await internalTrpc.notesByParentId.query(parentId);
		return json(notes);
	} catch (error) {
		console.error('Error fetching notes by parent:', error);
		return json({ error: 'Failed to fetch notes' }, { status: 500 });
	}
};
