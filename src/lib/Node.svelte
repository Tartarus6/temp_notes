<script lang="ts">
	import { removeNote, type FileNode, type FileNodeTypes, openNote, handleDrop } from '$lib/utils';
	import Node from '$lib/Node.svelte';
	import { contextMenuState, editorState, fileTreeState } from '$lib/variables.svelte';
	import { type ContextMenuItem } from '$lib/variables.svelte';
	import {
		createNote,
		renameNote,
		deleteNote,
		moveNote,
		getNote,
		getNotesByParentId
	} from '$lib/client/client';
	import { onMount, setContext, getContext } from 'svelte';

	// Props
	interface Props {
		node: FileNode;
		indent?: number;
		isNew?: boolean;
	}
	let { node, indent = 0, isNew }: Props = $props();

	// Context management
	export interface NewTracking {
		isCreatingNew: null | FileNodeTypes;
	}
	let newTracking: NewTracking = $state({
		isCreatingNew: null
	});
	let parentNewTracking: undefined | NewTracking = getContext('newTracking');
	setContext('newTracking', newTracking);

	// State
	let nameInput: HTMLInputElement | null = $state(null);
	let open = $state(false);
	let isRenaming = $state(false);
	let newName = $state('');
	let isDragging = $state(false);
	let isDragOver = $state(false);

	// Context menu setup
	let contextMenuItems: ContextMenuItem[] = getContextMenuItems();

	function getContextMenuItems(): ContextMenuItem[] {
		const items: ContextMenuItem[] = [];

		if (node.type === 'folder') {
			items.push(
				{ label: 'New File', onClick: handleCreateNewFile },
				{ label: 'New Folder', onClick: handleCreateNewFolder },
				{ label: 'Rename Folder', onClick: handleRename },
				{ label: 'Delete Folder', onClick: handleDeleteFolder }
			);
		} else if (node.type === 'file') {
			items.push(
				{ label: 'Rename', onClick: handleRename },
				{ label: 'Delete File', onClick: handleDeleteFile }
			);
		}

		return items;
	}

	// UI event handlers
	function toggleOpen() {
		open = !open;
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenuState.show = true;
		contextMenuState.x = e.clientX;
		contextMenuState.y = e.clientY;
		contextMenuState.items = contextMenuItems;
	}

	function handleRename() {
		isRenaming = true;
		newName = node.name;
		requestAnimationFrame(() => {
			focusInput();
		});
	}

	// File operations
	function handleCreateNewFile() {
		if (!open) toggleOpen();
		newTracking.isCreatingNew = 'file';
	}

	function handleCreateNewFolder() {
		if (!open) toggleOpen();
		newTracking.isCreatingNew = 'folder';
	}

	function handleDeleteFile() {
		if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;

		try {
			removeNote({ id: node.id });
			fileTreeState.isOld = true; // Force a rerender of the file tree
		} catch (error) {
			console.error('Error deleting file:', error);
		}
	}

	async function handleDeleteFolder() {
		if (!confirm(`Are you sure you want to delete the folder "${node.name}" and ALL its contents?`))
			return;

		try {
			// The new API automatically deletes all children
			await deleteNote({ id: node.id });
			fileTreeState.isOld = true; // Force a rerender of the file tree
		} catch (error) {
			console.error('Error deleting folder:', error);
		}
	}

	// Event handlers
	function HandleNodeOnmousedown(e: MouseEvent) {
		if (isRenaming || isNew || newTracking.isCreatingNew) return;

		if (node.type === 'folder') {
			if (e.button === 2) {
				handleContextMenu(e);
			} else if (e.button === 0) {
				toggleOpen();
			}
		} else if (node.type === 'file') {
			if (e.button === 2) {
				handleContextMenu(e);
			} else if (e.button === 0) {
				openNote({ id: node.id });
			}
		}
	}

	function handleNodeKeydown(e: KeyboardEvent) {
		if (isNew || isRenaming) return;

		if (e.key === 'Enter') {
			if (node.type === 'file') {
				openNote({ id: node.id });
			} else if (node.type === 'folder') {
				toggleOpen();
			}
		} else if (e.key === 'Delete') {
			if (node.type === 'file') {
				handleDeleteFile();
			} else if (node.type === 'folder') {
				handleDeleteFolder();
			}
		}
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (isRenaming && newName !== node.name) {
				saveRename();
			} else if (isNew && node.type === 'file') {
				saveNewFile();
			} else if (isNew && node.type === 'folder') {
				saveNewFolder();
			} else {
				cancelName();
			}
		} else if (e.key === 'Escape') {
			cancelName();
		}
	}

	// Save and cancel operations
	async function saveRename() {
		try {
			let result;

			// Both files and folders use the same renameNote function now
			result = await renameNote({
				id: node.id,
				newName: newName
			});

			if (result) {
				// If this is the currently open note, update it
				const currentNoteStr = localStorage.getItem('current-note');
				if (currentNoteStr) {
					const parsedNote = JSON.parse(currentNoteStr);
					if (parsedNote.id === node.id) {
						localStorage.setItem(
							'current-note',
							JSON.stringify({
								id: node.id
							})
						);
						// Reopen the note with the new name
						openNote({ id: node.id });
					}
				}

				isRenaming = false;
				fileTreeState.isOld = true; // Force a rerender of the file tree
			}
		} catch (error) {
			console.error('Error renaming:', error);
			cancelName();
		}
	}

	async function saveNewFile() {
		try {
			// Create note with parent ID from current node if it's a folder
			const parentId = node.type === 'folder' ? node.id : node.parentId;

			const note = await createNote({
				name: newName,
				parentId: parentId,
				isFolder: false
			});

			if (note) {
				if (parentNewTracking) {
					parentNewTracking.isCreatingNew = null;
				}
				newName = '';
				fileTreeState.isOld = true;
			}
		} catch (error) {
			console.error('Error creating file:', error);
		}
		cancelName();
	}

	async function saveNewFolder() {
		try {
			// Create folder with parent ID from current node if it's a folder
			const parentId = node.type === 'folder' ? node.id : node.parentId;

			const folder = await createNote({
				name: newName,
				parentId: parentId,
				content: '',
				isFolder: true
			});

			if (folder) {
				if (parentNewTracking) {
					parentNewTracking.isCreatingNew = null;
				}
				newName = '';
				fileTreeState.isOld = true;
			}
		} catch (error) {
			console.error('Error creating folder:', error);
		}
		cancelName();
	}

	function cancelName() {
		if (isRenaming) {
			isRenaming = false;
			newName = node.name;
		} else if (isNew) {
			fileTreeState.isOld = true;
			if (parentNewTracking) {
				parentNewTracking.isCreatingNew = null;
			}
			newName = '';
		}
	}

	function focusInput() {
		if (nameInput) {
			nameInput.focus();
			nameInput.select();
		}
	}

	// Drag and drop handlers
	function handleDragStart(e: DragEvent) {
		// Don't allow drag if we're editing or creating new items
		if (isRenaming || isNew || newTracking.isCreatingNew) {
			e.preventDefault();
			return;
		}

		isDragging = true;

		// Set the drag data with ID instead of path
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData(
				'application/json',
				JSON.stringify({
					id: node.id,
					type: node.type
				})
			);
		}
	}

	function handleDragEnd() {
		isDragging = false;
	}

	function handleDragOver(e: DragEvent) {
		// Only folders can be drop targets
		if (node.type !== 'folder') return;

		// Prevent default to allow drop
		e.preventDefault();

		// Set the dropEffect to move
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}

		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	onMount(() => {
		// Set focus on the input field if it's a new file/folder
		if (isNew || newTracking.isCreatingNew) {
			focusInput();
		}
	});

	$effect(() => {
		// Update context menu items when node changes
		contextMenuItems = getContextMenuItems();
	});
</script>

<div
	class="relative flex items-center border-2 border-transparent text-sm select-none focus-within:border-slate-400 hover:bg-slate-600 {editorState
		.note?.id === node.id
		? 'bg-slate-700'
		: ''} {isDragOver ? 'border-blue-500 bg-blue-800' : ''} {isDragging ? 'opacity-50' : ''}"
	style="padding-left: {indent}em"
	oncontextmenu={handleContextMenu}
	role="button"
	tabindex="0"
	draggable={!isRenaming && !isNew && !newTracking.isCreatingNew}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	onkeydown={handleNodeKeydown}
	onmousedown={HandleNodeOnmousedown}
	ondrop={(e) => {
		isDragOver = false;
		handleDrop(e, node);
	}}
>
	<button type="button" aria-expanded={open} class="flex w-full items-center py-0.5">
		{#if node.type === 'folder'}
			<!-- Directory node -->
			<!-- Folder toggle icon -->
			<span class="flex min-w-4 items-center justify-center">
				<svg
					class="transform transition-transform {open ? 'rotate-90' : ''}"
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="currentColor"
				>
					<path d="M6 4L10 8L6 12L5.3 11.3L8.6 8L5.3 4.7L6 4Z" />
				</svg>
			</span>

			<!-- Folder icon -->
			<span class="flex min-w-4 items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill={open ? 'transparent' : 'var(--color-blue-500)'}
					stroke="var(--color-blue-500)"
				>
					<path d="M2 2v12h12V4H8L6 2H2z" />
				</svg>
			</span>
		{:else}
			<!-- File node -->
			<!-- Spacer for alignment -->
			<span class="flex min-w-4 items-center justify-center opacity-0"></span>

			<!-- File icon -->
			<span class="flex min-w-4 items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="var(--color-blue-500)"
				>
					<path
						d="M13.85 4.44l-3.28-3.3-.35-.14H2.5l-.5.5v13l.5.5h11l.5-.5V4.8l-.15-.36zM13 5h-3V2l3 3zM3 14V2h6v3.5l.5.5H13v8H3z"
					/>
				</svg>
			</span>
		{/if}
		<!-- name/rename input -->
		<div class="flex w-full pr-4 pl-2">
			{#if isRenaming || isNew}
				<input
					bind:this={nameInput}
					id="rename-file-{node.id}"
					type="text"
					bind:value={newName}
					onkeydown={handleNameKeydown}
					onblur={cancelName}
					class="w-full rounded border border-blue-500 bg-slate-600 px-1 text-sm focus:outline-none"
				/>
			{:else}
				<span class="text-left break-all opacity-65">{node.name}</span>
			{/if}
		</div>
	</button>
</div>

<!-- Child nodes (if directory is open) -->
{#if open && node.children}
	{#each node.children as child}
		<Node node={child} indent={indent + 1} />
	{/each}

	<!-- New input (if creating new file) -->
	{#if newTracking.isCreatingNew}
		<Node
			node={{
				id: -1, // Temporary ID for new node
				name: '',
				parentId: node.id,
				type: newTracking.isCreatingNew,
				note: {} as any
			}}
			isNew={true}
			indent={indent + 1}
		/>
	{/if}
{/if}

<style>
	button {
		cursor: pointer;
		outline: none;
	}
</style>
