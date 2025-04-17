<script lang="ts">
	import { fetchNotes, createNote } from '$lib/client/client';
	import type { Note } from '$lib/server/server';
	import { buildFileTree, type FileNode } from './utils';
	import Node from './Node.svelte';
	import { fileTreeState } from './variables.svelte';

	let newNoteName = $state('');
	let newNotePath = $state('/');
	let notesList: Note[] = $state([]);
	let fileTree: FileNode[] = $state([]);
	let isCreatingNew = $state(false);

	async function updateTree() {
		notesList = await fetchNotes();
		fileTree = buildFileTree(await notesList);
	}

	updateTree();

	async function handleNewNote(input: { name: string; path: string }) {
		const note = await createNote({ path: input.path, name: input.name });
		if (note) {
			updateTree();
			isCreatingNew = false;
			newNoteName = '';
			newNotePath = '';
		}
	}

	function handleNewNoteKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleNewNote({ path: newNotePath, name: newNoteName });
		} else if (e.key === 'Escape') {
			isCreatingNew = false;
			newNoteName = '';
			newNotePath = '/';
		}
	}

	$effect(() => {
		if (fileTreeState.isOld) {
			updateTree();
			fileTreeState.isOld = false;
		}
	});
</script>

<div class="flex h-full w-64 flex-col bg-slate-800">
	<div class="flex items-center justify-between px-2 py-1">
		<span class="font-bold">TempNotes</span>
		<div class="w-full text-right text-sm">temporary -></div>
		<button
			onmousedown={() => (isCreatingNew = true)}
			class="rounded bg-slate-700 p-1 hover:bg-slate-600"
			title="New Note"
			aria-label="Create a new note"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="currentColor"
			>
				<path d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z" />
			</svg>
		</button>
	</div>

	<div class="flex-1 overflow-auto">
		{#if isCreatingNew}
			<div class="px-2 py-1">
				<input
					type="text"
					bind:value={newNoteName}
					placeholder="new note name"
					onkeydown={handleNewNoteKeydown}
					class="w-full rounded border border-blue-500 bg-slate-500 px-2 py-1 text-sm focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newNotePath}
					placeholder="path (e.g., /folder)"
					onkeydown={handleNewNoteKeydown}
					class="mt-1 w-full rounded border border-slate-500 bg-slate-500 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
				/>
			</div>
		{/if}

		{#each fileTree as node}
			<Node {node} />
		{/each}
	</div>
</div>

<style>
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: var(--color-slate-500) transparent;
	}

	:global(*::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(*::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(*::-webkit-scrollbar-thumb) {
		background-color: var(--color-slate-500);
		border-radius: 4px;
	}
</style>
