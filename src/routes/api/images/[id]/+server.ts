import { json, type RequestHandler } from '@sveltejs/kit';
import { internalTrpc } from '$lib/server/internal-client';

// GET /api/images/[id] - get image
export const GET: RequestHandler = async ({ params }) => {
	try {
		const imageId = params.id!;
		
		const image = await internalTrpc.imageGet.query(imageId);
		return json(image);
	} catch (error) {
		console.error('Error fetching image:', error);
		return json({ error: 'Failed to fetch image' }, { status: 500 });
	}
};
