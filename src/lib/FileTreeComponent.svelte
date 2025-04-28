<script lang="ts">
	import { fetchNotes, createNote } from '$lib/client/client';
	import type { Note } from '$lib/server/server';
	import { buildFileTree, type FileNode, handleContextMenu } from './utils';
	import Node from './Node.svelte';
	import { fileTreeState, type ContextMenuItem } from './variables.svelte';
	import { type NewTracking } from './Node.svelte';
	import { setContext } from 'svelte';

	let newTracking: NewTracking = $state({
		isCreatingNew: null
	});

	setContext('newTracking', newTracking);

	// State management
	let newNoteName = $state('');
	let newNotePath = $state('/');
	let notesList: Note[] = $state([]);
	let fileTree: FileNode[] = $state([]);
	let isCreatingNew = $state(false);
	let isCreatingNewFile = $state(false);
	let isCreatingNewFolder = $state(false);

	// Initialize file tree
	async function refreshFileTree() {
		notesList = await fetchNotes();
		fileTree = buildFileTree(notesList);
	}

	// Load initial data
	refreshFileTree();

	// Create new note handler
	async function handleNewNote() {
		if (!newNoteName.trim()) return;

		const note = await createNote({
			path: newNotePath,
			name: newNoteName
		});

		if (note) {
			refreshFileTree();
			resetNewNoteForm();
		}
	}

	// Reset form helper
	function resetNewNoteForm() {
		isCreatingNew = false;
		newNoteName = '';
		newNotePath = '/';
	}

	// Keyboard event handler
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleNewNote();
		} else if (e.key === 'Escape') {
			resetNewNoteForm();
		}
	}

	// Context menu setup for empty area
	const contextMenuItems: ContextMenuItem[] = [
		{ label: 'New File', onClick: handleCreateNewFile },
		{ label: 'New Folder', onClick: handleCreateNewFolder }
	];

	// File operations
	function handleCreateNewFile() {
		isCreatingNewFile = true;
		focusElement('new-root-file');
	}

	function handleCreateNewFolder() {
		isCreatingNewFolder = true;
		focusElement('new-root-folder');
	}

	function focusElement(id: string) {
		setTimeout(() => {
			const element = document.getElementById(id);
			if (element) (element as HTMLInputElement).focus();
		}, 0);
	}

	// Watch for tree update requests
	$effect(() => {
		if (fileTreeState.isOld) {
			refreshFileTree();
			fileTreeState.isOld = false;
		}
	});
</script>

<div class="flex h-full w-64 flex-col overflow-x-scroll bg-slate-800">
	<!-- Header -->
	<div class="flex items-center justify-between px-2 py-1">
		<span class="font-bold">TempNotes {fileTreeState.isOld}</span>
	</div>

	<!-- File tree content -->
	<div class="w-fit min-w-full flex-1">
		{#if isCreatingNew}
			<div class="px-2 py-1">
				<input
					type="text"
					bind:value={newNoteName}
					placeholder="new note name"
					onkeydown={handleKeydown}
					class="w-full rounded border border-blue-500 bg-slate-500 px-2 py-1 text-sm focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newNotePath}
					placeholder="path (e.g., /folder)"
					onkeydown={handleKeydown}
					class="mt-1 w-full rounded border border-slate-500 bg-slate-500 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
				/>
			</div>
		{/if}

		{#if fileTree.length === 0 && !isCreatingNewFile && !isCreatingNewFolder}
			<div class="px-4 py-6 text-center text-sm text-slate-400">
				<div class="mb-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-8 w-8 opacity-60"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>
				<p class="font-medium">No notes or folders yet</p>
				<p class="mt-1 text-xs">Right-click here to create a new note or folder</p>
			</div>
		{/if}

		{#each fileTree as node}
			<Node {node} />
		{/each}

		<!-- New input (if creating new file) -->
		{#if newTracking.isCreatingNew}
			<Node node={{ name: '', path: '/', type: newTracking.isCreatingNew }} isNew={true} />
		{/if}

		<!-- Empty space with context menu -->
		<div
			class="h-full w-full"
			oncontextmenu={(e) => handleContextMenu(e, contextMenuItems)}
			role="region"
			aria-label="File tree empty area"
		></div>
	</div>
</div>

<style>
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: var(--color-slate-500) transparent;
	}

	:global(*::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(*::-webkit-scrollbar-thumb) {
		background-color: var(--color-slate-500);
	}
</style>
