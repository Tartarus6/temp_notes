import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notesTable = sqliteTable('notes_table', {
	id: int().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	path: text().notNull().default('/'),
	content: text().notNull()
});
