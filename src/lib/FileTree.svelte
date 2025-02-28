<script lang="ts">
	import { fetchNotes, updateNote, createNote } from '$lib/client/client';
	import { editorInstance, noteInstance } from '$lib/editorStore';
	import type { Note } from '$lib/server/server';
	import { buildFileTree, type FileNode } from './utils';

	import Node from './Node.svelte';

	let newNoteName = $state('');
	let newNotePath = $state('/'); // Add newNotePath state

	let notesList: Note[] = $state([]);
	let fileTree: FileNode[] = $state([]);

	async function updateTree() {
		notesList = await fetchNotes();

		console.log('fetched notes C: ', notesList);

		fileTree = buildFileTree(await notesList);
	}

	updateTree();

	async function newNote(input: { name: string; path: string }) {
		console.log('new note input: ', input);
		const note = await createNote({ path: input.path, name: input.name });
		console.log('new note: ', await note);
		if (note) {
			updateTree();
		}
	}

	async function openNote(node: FileNode) {
		if (node.type === 'file' && node.note) {
			// Check if it's a file
			saveNote().then(() => {
				if ($editorInstance && node.note) {
					$editorInstance.commands.setContent(node.note.content);
					noteInstance.set(node.note);
				}
			});
		}
	}

	async function saveNote() {
		if ($editorInstance && $noteInstance && $noteInstance.path) {
			const note = await updateNote({
				path: $noteInstance.path,
				name: $noteInstance.name,
				content: $editorInstance.getHTML()
			});
			if (note) {
				updateTree();
			}
		}
	}
</script>

<div
	class="grid h-full w-48 grid-cols-1 place-items-start content-start gap-2 bg-red-400 p-1 text-start"
>
	<button
		onclick={() => console.log('file tree: ', fileTree)}
		class=" my-1 w-full bg-yellow-400 p-1 text-left"
	>
		<span>log tree</span>
	</button>
	<button onclick={() => saveNote()} class=" my-1 w-full bg-green-400 p-1 text-left">
		<span>save note</span>
	</button>
	<input
		type="text"
		bind:value={newNoteName}
		placeholder="new note name"
		onkeydown={(e) => e.key === 'Enter' && newNote({ path: newNotePath, name: newNoteName })}
		class="w-full"
	/>
	<input type="text" bind:value={newNotePath} placeholder="new note path" class="w-full" />

	{#each fileTree as node}
		<Node {node} />
	{/each}
</div>
