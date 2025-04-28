<script lang="ts">
	import { fetchNotes } from '$lib/client/client';
	import type { Note } from '$lib/server/server';
	import { buildFileTree, type FileNode, handleContextMenu } from '$lib/utils';
	import Node from '$lib/Node.svelte';
	import { fileTreeState, type ContextMenuItem } from '$lib/variables.svelte';
	import { type NewTracking } from '$lib/Node.svelte';
	import { setContext } from 'svelte';

	// Context management
	let newTracking: NewTracking = $state({
		isCreatingNew: null
	});
	setContext('newTracking', newTracking);

	// State management
	let notesList: Note[] = $state([]);
	let fileTree: FileNode[] = $state([]);

	// Initialize file tree
	async function refreshFileTree() {
		notesList = await fetchNotes();
		fileTree = buildFileTree(notesList);
	}

	// Load initial data
	refreshFileTree();

	// Context menu setup for empty area
	const contextMenuItems: ContextMenuItem[] = [
		{ label: 'New File', onClick: handleCreateNewFile },
		{ label: 'New Folder', onClick: handleCreateNewFolder }
	];

	// File operations
	function handleCreateNewFile() {
		newTracking.isCreatingNew = 'file';
	}

	function handleCreateNewFolder() {
		newTracking.isCreatingNew = 'directory';
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
		<span class="font-bold">TempNotes</span>
	</div>

	<!-- File tree content -->
	<div class="w-fit min-w-full flex-1">
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
		>
			{#if fileTree.length === 0 && !newTracking.isCreatingNew}
				<div class="px-4 py-6 text-center text-sm text-slate-400 select-none">
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
		</div>
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
