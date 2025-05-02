import type { Note } from '$lib/server/server';
import {
	editorState,
	contextMenuState,
	type ContextMenuItem,
	explorerTreeState
} from './variables.svelte';
import {
	deleteNote,
	getNote,
	uploadImageToServer,
	updateNote,
	moveNote,
	getNotePath
} from './client/client';

/**
 * Represents a node in the explorer tree
 */
export type ExplorerNode = {
	id: number;
	name: string;
	children: ExplorerNode[];
	note?: Note;
	parentId: number | null;
};

/**
 * Builds a file tree structure from a list of notes
 */
export function buildExplorerTree(notes: Note[]): ExplorerNode[] {
	// Create a map for quick lookups
	const noteMap: Record<string, ExplorerNode> = {}; // Changed from number to string for index

	// First pass: Create all explorer nodes
	for (const note of notes) {
		noteMap[note.id!] = {
			id: note.id!,
			name: note.name,
			children: [],
			note: note,
			parentId: note.parentId!
		};
	}

	// Second pass: Build the tree structure
	const rootNodes: ExplorerNode[] = [];

	for (const noteId in noteMap) {
		const node = noteMap[noteId];

		if (node.parentId === null) {
			// This is a root node
			rootNodes.push(node);
		} else if (node.parentId !== undefined && noteMap[String(node.parentId)]) {
			// Add as child to parent (use string key)
			const parent = noteMap[String(node.parentId)];
			if (parent.children) {
				parent.children.push(node);
			}
		} else {
			// Orphaned node (parent doesn't exist), add to root
			rootNodes.push(node);
		}
	}

	// Sort the tree (notes with children first, then alphabetically)
	sortExplorerTree({ children: rootNodes } as ExplorerNode);

	return rootNodes;
}

/**
 * Sorts an explorer tree node recursively
 */
function sortExplorerTree(node: ExplorerNode): void {
	if (!node.children.length) return;

	// Sort children: notes with children first, then alphabetically
	node.children.sort((a, b) => {
		if ((a.children.length !== 0) === (b.children.length !== 0)) {
			return a.name.localeCompare(b.name);
		}
		return a.children.length !== 0 ? -1 : 1;
	});

	// Sort children's children recursively
	node.children.forEach(sortExplorerTree);
}

/**
 * Opens a note in the editor
 */
export async function openNote(input: { id: number }): Promise<Note | null> {
	try {
		// Save current note before opening a new one
		await saveNote();

		const note = await getNote(input);

		if (!note) {
			console.warn(`Note not found with id: ${input.id}`);
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
					id: note.id
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

		if (!editor || !note?.id) {
			return null;
		}

		return await updateNote({
			id: note.id,
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
export async function removeNote(input: { id: number }): Promise<boolean> {
	try {
		await deleteNote(input);

		// Clear editor if deleted note was open
		const { editor, note } = editorState;

		if (editor && note?.id === input.id) {
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

// Image handling functions
export async function uploadImage(file: File) {
	try {
		// Convert file to base64
		const base64 = await fileToBase64(file);

		// Upload image to server
		const image = await uploadImageToServer({
			filename: file.name,
			mimetype: file.type,
			data: base64.split(',')[1] // Remove data URL prefix
		});

		return image;
	} catch (error) {
		console.error('Error uploading image:', error);
		throw error;
	}
}

export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
}

export async function handleDrop(e: DragEvent, targetNode: null | ExplorerNode): Promise<void> {
	e.preventDefault();

	// Get the dragged data
	if (!e.dataTransfer) return;

	const data = e.dataTransfer.getData('application/json');
	if (!data) return;

	const draggedItem = JSON.parse(data) as { id: number };
	const targetParentId = targetNode?.id || null; // null means root level

	// Don't allow drop on itself
	if (targetNode && draggedItem.id === targetNode.id) return;

	// Check circular reference (can't drop parent into its own child)
	if (targetNode) {
		// If target node is a descendant of dragged item, we can't move
		const targetAncestors = await getNodeAncestors(targetNode.id);
		if (targetAncestors.some((ancestor) => ancestor.id === draggedItem.id)) {
			console.log('Cannot move a note into its own descendant');
			return;
		}
	}

	// Move the note to new parent
	await moveNote({
		id: draggedItem.id,
		newParentId: targetParentId
	});

	// Update explorer tree
	explorerTreeState.isOld = true;
}

/**
 * Gets all ancestor nodes of a given node
 */
export async function getNodeAncestors(nodeId: number): Promise<Note[]> {
	const ancestors: Note[] = [];
	const path = await getNotePath(nodeId);

	// The path includes the node itself, so we remove the last element
	return path.length > 1
		? path.slice(0, -1).map((item) => ({ id: item.id, name: item.name }) as Note)
		: [];
}
