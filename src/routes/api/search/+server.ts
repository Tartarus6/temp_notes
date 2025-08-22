import { json, type RequestHandler } from '@sveltejs/kit';
import { internalTrpc } from '$lib/server/internal-client';

// GET /api/search?q=searchText - search notes
export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchText = url.searchParams.get('q');
		
		if (!searchText) {
			return json({ error: 'Search query is required' }, { status: 400 });
		}
		
		const notes = await internalTrpc.notesSearch.query(searchText);
		return json(notes);
	} catch (error) {
		console.error('Error searching notes:', error);
		return json({ error: 'Failed to search notes' }, { status: 500 });
	}
};
