import type { Note } from '$lib/server/server';
import { editorState } from './variables.svelte';
import { deleteNote, getNote, updateNote } from './client/client';

export type FileNode = {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileNode[];
	note?: Note; // Optional: Store the note object if it's a file
};

// builds a file tree from the notes
export function buildFileTree(notes: Note[]): FileNode[] {
	const root: FileNode = { name: 'root', path: '', type: 'directory', children: [] };
	const pathMap: { [path: string]: FileNode } = { '/': root };

	// First pass: create all nodes
	for (const note of notes) {
		const parts = (note.path + note.name).split('/').filter(Boolean);
		let currentPath = '/';
		let parent = root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const fullPath = currentPath + part;

			if (!pathMap[fullPath]) {
				const newNode: FileNode = {
					name: part,
					path: currentPath,
					type: i === parts.length - 1 ? 'file' : 'directory',
					children: [],
					note: i === parts.length - 1 ? note : undefined
				};
				pathMap[fullPath] = newNode;
				parent.children = parent.children || [];
				parent.children.push(newNode);
			}
			parent = pathMap[fullPath];
			currentPath = fullPath + '/';
		}
	}

	// Second pass: sort children arrays
	const sortNodes = (node: FileNode) => {
		if (node.children) {
			// Sort children: directories first, then by name
			node.children.sort((a, b) => {
				if (a.type === b.type) {
					return a.name.localeCompare(b.name);
				}
				return a.type === 'directory' ? -1 : 1;
			});
			// Recursively sort children's children
			node.children.forEach(sortNodes);
		}
	};

	sortNodes(root);
	return root.children || [];
}

// opens a note in the editor and sets the editor state
export async function openNote(input: { name: string; path: string }) {
	saveNote().then(async () => {
		const note = await getNote({ path: input.path, name: input.name });
		if (editorState.editor && note) {
			editorState.editor.commands.setContent(note.content);
			editorState.note = note;
			// Save the currently open note in local storage
			localStorage.setItem('current-note', JSON.stringify({ name: note.name, path: note.path }));
		}
	});
}

// saves the currently open note
export async function saveNote() {
	if (editorState.editor && editorState.note && editorState.note.path) {
		const note = await updateNote({
			path: editorState.note.path,
			name: editorState.note.name,
			content: editorState.editor.getHTML()
		});
		return note;
	}
	return null;
}

// deletes note and unsets the editor state if the note is currently open
export async function removeNote(input: { name: string; path: string }) {
	deleteNote({ path: input.path, name: input.name });

	// if deleted note is currently open
	if (
		editorState.editor &&
		editorState.note &&
		editorState.note.path &&
		editorState.note.name === input.name &&
		editorState.note.path === input.path
	) {
		editorState.note = null;
		editorState.editor.commands.setContent('');
		localStorage.removeItem('current-note');
	}
	return null;
}
