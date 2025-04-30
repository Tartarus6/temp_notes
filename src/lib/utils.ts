import type { Note } from '$lib/server/server';
import {
	editorState,
	contextMenuState,
	type ContextMenuItem,
	fileTreeState
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
 * Represents a node in the file system tree
 */
export type FileNode = {
	id: number;
	name: string;
	type: FileNodeTypes;
	children?: FileNode[];
	note?: Note;
	parentId: number | null;
};

export type FileNodeTypes = 'file' | 'folder';

/**
 * Builds a file tree structure from a list of notes
 */
export function buildFileTree(notes: Note[]): FileNode[] {
	// Create a map for quick lookups
	const noteMap: Record<string, FileNode> = {}; // Changed from number to string for index

	// First pass: Create all file nodes
	for (const note of notes) {
		noteMap[note.id!] = {
			id: note.id!,
			name: note.name,
			type: note.isFolder === 1 ? 'folder' : 'file',
			children: note.isFolder === 1 ? [] : undefined,
			note: note,
			parentId: note.parentId!
		};
	}

	// Second pass: Build the tree structure
	const rootNodes: FileNode[] = [];

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

	// Sort the tree (folders first, then alphabetically)
	sortFileTree({ children: rootNodes } as FileNode);

	return rootNodes;
}

/**
 * Sorts a file tree node recursively
 */
function sortFileTree(node: FileNode): void {
	if (!node.children?.length) return;

	// Sort children: folders first, then alphabetically
	node.children.sort((a, b) => {
		if (a.type === b.type) {
			return a.name.localeCompare(b.name);
		}
		return a.type === 'folder' ? -1 : 1;
	});

	// Sort children's children recursively
	node.children.forEach(sortFileTree);
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
			content: editor.getHTML(),
			isFolder: note.isFolder === 1
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

export async function handleDrop(e: DragEvent, targetNode: null | FileNode): Promise<void> {
	// Only folders can be drop targets
	if (targetNode && targetNode.type !== 'folder') return;

	e.preventDefault();

	// Get the dragged data
	if (!e.dataTransfer) return;

	const data = e.dataTransfer.getData('application/json');
	if (!data) return;

	const draggedItem = JSON.parse(data) as { id: number; type: FileNodeTypes };
	const targetParentId = targetNode?.id || null; // null means root level

	// Don't allow drop on itself
	if (targetNode && draggedItem.id === targetNode.id) return;

	// Check circular reference (can't drop parent into its own child)
	if (targetNode && draggedItem.type === 'folder') {
		// If target node is a descendant of dragged item, we can't move
		const targetAncestors = await getNodeAncestors(targetNode.id);
		if (targetAncestors.some((ancestor) => ancestor.id === draggedItem.id)) {
			console.log('Cannot move a folder into its own descendant');
			return;
		}
	}

	// Move the note to new parent
	await moveNote({
		id: draggedItem.id,
		newParentId: targetParentId
	});

	// Update file tree
	fileTreeState.isOld = true;
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
