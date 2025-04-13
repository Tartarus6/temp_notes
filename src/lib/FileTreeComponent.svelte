<script lang="ts">
	import { fetchNotes, updateNote, createNote } from '$lib/client/client';
	import type { Note } from '$lib/server/server';
	import { buildFileTree, saveNote, type FileNode } from './utils';

	import Node from './Node.svelte';

	let newNoteName = $state('');
	let newNotePath = $state('/'); // Add newNotePath state

	let notesList: Note[] = $state([]);
	let fileTree: FileNode[] = $state([]);

	async function updateTree() {
		notesList = await fetchNotes();

		fileTree = buildFileTree(await notesList);
	}

	updateTree();

	async function newNote(input: { name: string; path: string }) {
		const note = await createNote({ path: input.path, name: input.name });
		if (note) {
			updateTree();
		}
	}
</script>

<div
	class="grid h-full w-48 grid-cols-1 place-items-start content-start gap-2 bg-slate-800 p-1 text-start"
>
	<button onmousedown={() => saveNote()} class=" my-1 w-full bg-green-400 p-1 text-left">
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
