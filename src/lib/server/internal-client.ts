import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/server';

// Shared internal tRPC client for server-side API calls to the standalone server
export const internalTrpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: 'http://localhost:3001'
		})
	]
});
