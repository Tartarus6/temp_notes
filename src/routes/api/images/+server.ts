import { json, type RequestHandler } from '@sveltejs/kit';
import { internalTrpc } from '$lib/server/internal-client';

// POST /api/images - upload image
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { filename, mimetype, data } = body;
		
		const image = await internalTrpc.imageUpload.mutate({
			filename,
			mimetype,
			data
		});
		
		return json(image);
	} catch (error) {
		console.error('Error uploading image:', error);
		return json({ error: 'Failed to upload image' }, { status: 500 });
	}
};
