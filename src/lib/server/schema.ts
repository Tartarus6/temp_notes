import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notesTable = sqliteTable('notes_table', {
	id: int().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	path: text().notNull().default('/'),
	content: text().notNull()
});

export const imagesTable = sqliteTable('images_table', {
	id: text().primaryKey().notNull(), // Will use UUID for image IDs
	filename: text().notNull(),
	mimetype: text().notNull(),
	data: text().notNull(), // Base64 encoded image data
	createdAt: int()
		.notNull()
		.default(Math.floor(Date.now() / 1000)) // Unix timestamp
});
