import type { Note } from '$lib/server/server';
import { editorState, contextMenuState, type ContextMenuItem } from './variables.svelte';
import { deleteNote, getNote, renameNote, updateNote } from './client/client';

/**
 * Represents a node in the file system tree
 */
export type FileNode = {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileNode[];
	note?: Note;
};

/**
 * Builds a file tree structure from a list of notes
 */
export function buildFileTree(notes: Note[]): FileNode[] {
	// Initialize root node and path mapping for quick lookups
	const root: FileNode = { name: 'root', path: '', type: 'directory', children: [] };
	const pathMap: Record<string, FileNode> = { '/': root };

	// Create all nodes in the tree
	for (const note of notes) {
		// Split path into segments and build tree incrementally
		const parts = (note.path + note.name).split('/').filter(Boolean);
		let currentPath = '/';
		let parent = root;

		// Process each path segment
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const fullPath = currentPath + part;
			const isFile = i === parts.length - 1;

			// Create node if it doesn't exist
			if (!pathMap[fullPath]) {
				const newNode: FileNode = {
					name: part,
					path: currentPath,
					type: isFile ? 'file' : 'directory',
					children: isFile ? undefined : [],
					note: isFile ? note : undefined
				};

				// Add to path map and parent's children
				pathMap[fullPath] = newNode;
				parent.children?.push(newNode);
			}

			// Update parent and current path for next iteration
			parent = pathMap[fullPath];
			currentPath = fullPath + '/';
		}
	}

	// Sort the tree (directories first, then alphabetically)
	sortFileTree(root);

	return root.children || [];
}

/**
 * Sorts a file tree node recursively
 */
function sortFileTree(node: FileNode): void {
	if (!node.children?.length) return;

	// Sort children: directories first, then alphabetically
	node.children.sort((a, b) => {
		if (a.type === b.type) {
			return a.name.localeCompare(b.name);
		}
		return a.type === 'directory' ? -1 : 1;
	});

	// Sort children's children recursively
	node.children.forEach(sortFileTree);
}

/**
 * Opens a note in the editor
 */
export async function openNote(input: { path: string; name: string }): Promise<Note | null> {
	try {
		// Save current note before opening a new one
		await saveNote();

		const note = await getNote(input);

		if (!note) {
			console.warn(`Note not found: ${input.path}/${input.name}`);
			return null;
		}

		if (editorState.editor) {
			// Update editor content and state
			editorState.editor.commands.setContent(note.content);
			editorState.note = note;

			// Save reference in local storage
			localStorage.setItem(
				'current-note',
				JSON.stringify({
					name: note.name,
					path: note.path
				})
			);

			return note;
		}
	} catch (error) {
		console.error('Error opening note:', error);
	}

	return null;
}

/**
 * Saves the currently open note
 */
export async function saveNote(): Promise<Note | null> {
	try {
		const { editor, note } = editorState;

		if (!editor || !note?.path) {
			return null;
		}

		return await updateNote({
			path: note.path,
			name: note.name,
			content: editor.getHTML()
		});
	} catch (error) {
		console.error('Error saving note:', error);
		return null;
	}
}

/**
 * Deletes a note and clears editor if it's currently open
 */
export async function removeNote(input: { path: string; name: string }): Promise<boolean> {
	try {
		await deleteNote(input);

		// Clear editor if deleted note was open
		const { editor, note } = editorState;

		if (editor && note?.name === input.name && note?.path === input.path) {
			editorState.note = null;
			editor.commands.setContent('');
			localStorage.removeItem('current-note');
		}

		return true;
	} catch (error) {
		console.error('Error removing note:', error);
		return false;
	}
}

/**
 * Handles context menu events in a consistent way across components
 * @param e The mouse event from the context menu trigger
 * @param items The context menu items to display
 */
export function handleContextMenu(e: MouseEvent, items: ContextMenuItem[]): void {
	e.preventDefault();
	contextMenuState.show = true;
	contextMenuState.x = e.clientX;
	contextMenuState.y = e.clientY;
	contextMenuState.items = items;
}
