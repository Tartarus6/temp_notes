import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { notesTable, imagesTable } from './schema';

// Create SQLite database connection
const sqlite = new Database('notes.db');

// Create drizzle instance
export const db = drizzle(sqlite);

// Initialize database with tables if they don't exist
export async function initializeDatabase() {
	try {
		// Run migrations if they exist
		try {
			migrate(db, { migrationsFolder: './drizzle' });
			console.log('Database migrations completed');
		} catch (migrationError) {
			console.log('No migrations found, creating tables manually...');
			
			// Create tables manually if migrations don't exist
			sqlite.exec(`
				CREATE TABLE IF NOT EXISTS notes_table (
					id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
					name TEXT NOT NULL,
					parentId INTEGER,
					content TEXT NOT NULL
				)
			`);
			
			sqlite.exec(`
				CREATE TABLE IF NOT EXISTS images_table (
					id TEXT PRIMARY KEY NOT NULL,
					filename TEXT NOT NULL,
					mimetype TEXT NOT NULL,
					data TEXT NOT NULL,
					createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
				)
			`);
			
			console.log('Database tables created successfully');
		}
	} catch (error) {
		console.error('Database initialization error:', error);
		throw error;
	}
}
