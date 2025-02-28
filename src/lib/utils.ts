import type { Note } from '$lib/server/server';

export type FileNode = {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileNode[];
	note?: Note; // Optional: Store the note object if it's a file
};

export function buildFileTree(notes: Note[]): FileNode[] {
	console.log('fetched noted D: ', notes);

	const root: FileNode = { name: 'root', path: '', type: 'directory', children: [] };
	const pathMap: { [path: string]: FileNode } = { '/': root };

	for (const note of notes) {
		console.log('note: ', note.path, note.name);

		const parts = (note.path + note.name).split('/').filter(Boolean); // Split the path into segments
		let currentPath = '/';
		let parent = root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const fullPath = currentPath + part;

			if (!pathMap[fullPath]) {
				const newNode: FileNode = {
					name: part,
					path: currentPath,
					type: i === parts.length - 1 ? 'file' : 'directory', // Last part is a file
					children: [],
					note: i === parts.length - 1 ? note : undefined // Assign note to file
				};
				pathMap[fullPath] = newNode;
				parent.children = parent.children || [];
				parent.children.push(newNode);
			}
			parent = pathMap[fullPath];
			currentPath = fullPath + '/';
		}
	}
	return root.children || [];
}
