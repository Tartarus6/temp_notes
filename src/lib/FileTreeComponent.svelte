<script lang="ts">
	import { fetchNotes, updateNote, createNote } from '$lib/client/client';
	import type { Note } from '$lib/server/server';
	import { buildFileTree, saveNote, type FileNode } from './utils';
	import Node from './Node.svelte';

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

	async function newNote(input: { name: string; path: string }) {
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
			newNote({ path: newNotePath, name: newNoteName });
		} else if (e.key === 'Escape') {
			isCreatingNew = false;
			newNoteName = '';
			newNotePath = '/';
		}
	}
</script>

<div class="flex h-full w-64 flex-col bg-[#252526] text-[#cccccc]">
	<div class="p-2 text-xs font-semibold tracking-wide text-[#bbbbbb] uppercase">Explorer</div>

	<div class="flex items-center justify-between px-2 py-1">
		<span class="text-sm">Notes</span>
		<button
			on:click={() => (isCreatingNew = true)}
			class="rounded p-1 hover:bg-[#2d2d2d]"
			title="New Note"
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
					on:keydown={handleNewNoteKeydown}
					class="w-full rounded border border-[#007fd4] bg-[#3c3c3c] px-2 py-1 text-sm text-[#cccccc] focus:outline-none"
					autofocus
				/>
				<input
					type="text"
					bind:value={newNotePath}
					placeholder="path (e.g., /folder)"
					on:keydown={handleNewNoteKeydown}
					class="mt-1 w-full rounded border border-[#3c3c3c] bg-[#3c3c3c] px-2 py-1 text-sm text-[#cccccc] focus:border-[#007fd4] focus:outline-none"
				/>
			</div>
		{/if}

		{#each fileTree as node}
			<Node {node} />
		{/each}
	</div>

	<button
		on:click={() => saveNote()}
		class="m-2 rounded-sm bg-[#007fd4] px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-[#1a8cd8]"
	>
		Save Note
	</button>
</div>

<style>
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: #424242 transparent;
	}

	:global(*::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(*::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(*::-webkit-scrollbar-thumb) {
		background-color: #424242;
		border-radius: 4px;
	}
</style>
