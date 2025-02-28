import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users_table', {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	age: int().notNull(),
	email: text().notNull()
});

export const notesTable = sqliteTable('notes_table', {
	id: int().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	content: text().notNull()
});
