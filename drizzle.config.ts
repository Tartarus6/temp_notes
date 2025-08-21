import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: './src/lib/server/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: 'notes.db'
	}
});
