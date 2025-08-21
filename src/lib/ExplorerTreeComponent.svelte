<script lang="ts">
	import { fetchNotes } from '$lib/client/client';
	import type { Note } from '$lib/server/server';
	import { buildExplorerTree, type ExplorerNode, handleContextMenu, handleDrop } from '$lib/utils';
	import Node from '$lib/Node.svelte';
	import { explorerTreeState, type ContextMenuItem } from '$lib/variables.svelte';
	import { type NewTracking } from '$lib/Node.svelte';
	import { setContext, onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Context management
	let newTracking: NewTracking = $state({
		isCreatingNew: false
	});
	setContext('newTracking', newTracking);

	// State management
	let notesList: Note[] = $state([]);
	let explorerTree: ExplorerNode[] = $state([]);
	let isDragOver = $state(false);

	// Initialize explorer tree
	async function refreshExplorerTree() {
		if (!browser) return; // Only run in browser, not during SSR/build
		notesList = await fetchNotes();
		explorerTree = buildExplorerTree(notesList);
	}

	// Load initial data only in browser
	onMount(() => {
		refreshExplorerTree();
	});

	// Context menu setup for empty area
	const contextMenuItems: ContextMenuItem[] = [{ label: 'New Note', onClick: handleCreateNewNote }];

	// Note operations
	function handleCreateNewNote() {
		newTracking.isCreatingNew = true;
	}

	// Drag and drop handlers
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	// Watch for tree update requests
	$effect(() => {
		if (explorerTreeState.isOld) {
			refreshExplorerTree();
			explorerTreeState.isOld = false;
		}
	});
</script>

<div class="flex h-full w-64 flex-col overflow-x-scroll bg-slate-800">
	<!-- Header -->
	<div class="flex items-center justify-between px-2 py-1">
		<span class="font-bold">TempNotes</span>
	</div>

	<!-- Explorer tree content -->
	<div class="w-fit min-w-full flex-1">
		{#each explorerTree as node}
			<Node {node} />
		{/each}

		<!-- New input (if creating new note) -->
		{#if newTracking.isCreatingNew}
			<Node node={{ id: -1, name: '', children: [], parentId: null }} isNew={true} />
		{/if}

		<!-- Empty space with context menu -->
		<div
			class="h-full w-full {isDragOver ? 'border-2 border-blue-500 bg-blue-800' : ''}"
			oncontextmenu={(e) => handleContextMenu(e, contextMenuItems)}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={(e) => {
				isDragOver = false;
				handleDrop(e, null);
			}}
			role="region"
			aria-label="Explorer tree empty area"
		>
			{#if explorerTree.length === 0 && !newTracking.isCreatingNew}
				<div class="px-4 py-6 text-center text-sm text-slate-400 select-none">
					<button
						onclick={() => handleCreateNewNote()}
						class="mb-2 w-full cursor-pointer rounded-md bg-blue-500 p-2 text-slate-100 active:bg-blue-600"
						aria-label="new note button"
					>
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
					</button>
					<p class="font-medium">No notes yet</p>
					<p class="mt-1 text-xs">Right-click here to create a new note</p>
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
