<script lang="ts">
	import { removeNote, type FileNode, type FileNodeTypes, openNote } from './utils';
	import Node from '$lib/Node.svelte';
	import { contextMenuState, fileTreeState } from './variables.svelte';
	import { type ContextMenuItem } from './variables.svelte';
	import {
		createNote,
		renameNote,
		renameFolderAndUpdateFiles,
		deleteFolderAndContainedFiles
	} from './client/client';
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

	// Context menu setup
	let contextMenuItems: ContextMenuItem[] = getContextMenuItems();

	function getContextMenuItems(): ContextMenuItem[] {
		const items: ContextMenuItem[] = [];

		if (node.type === 'directory') {
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
		newTracking.isCreatingNew = 'directory';
	}

	function handleDeleteFile() {
		if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;

		try {
			removeNote({ name: node.name, path: node.path });

			fileTreeState.isOld = true; // Force a rerender of the file tree
		} catch (error) {
			console.error('Error deleting file:', error);
		}
	}

	async function handleDeleteFolder() {
		if (!confirm(`Are you sure you want to delete the folder "${node.name}" and ALL its contents?`))
			return;

		try {
			const folderPath = node.path + node.name + '/';
			const result = await deleteFolderAndContainedFiles(folderPath);

			if (result) {
				fileTreeState.isOld = true; // Force a rerender of the file tree
			}
		} catch (error) {
			console.error('Error deleting folder:', error);
		}
	}

	// Keyboard event handlers
	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (isRenaming && newName !== node.name) {
				saveRename();
			} else if (isNew && node.type === 'file') {
				saveNewFile();
			} else if (isNew && node.type === 'directory') {
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

			if (node.type === 'file') {
				result = await renameNote({
					path: node.path,
					oldName: node.name,
					newName: newName
				});

				if (result) {
					const currentNote = localStorage.getItem('current-note');
					if (!currentNote) return;

					const parsedNote = JSON.parse(currentNote);
					if (parsedNote.name === node.name && parsedNote.path === node.path) {
						localStorage.setItem(
							'current-note',
							JSON.stringify({
								name: newName,
								path: node.path
							})
						);
					}
					openNote({ name: newName, path: node.path });
				}
			} else if (node.type === 'directory') {
				const oldPath = node.path + node.name;
				const newPath = node.path + newName;

				result = await renameFolderAndUpdateFiles({
					oldPath,
					newPath
				});
			}

			if (result) {
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
			const filePath = node.type === 'directory' ? node.path + node.name + '/' : node.path;

			const note = await createNote({
				path: filePath,
				name: newName
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
			// Create the folder path - folders in this app are represented by their path
			const folderPath = node.type === 'directory' ? node.path : node.path;

			// Create a placeholder file to establish the folder
			// The placeholder will have .folder extension to distinguish it
			const placeholderFileName = `.${newName}.folder`;

			const note = await createNote({
				path: folderPath + newName + '/',
				name: placeholderFileName
			});

			if (note) {
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

	function HandleNodeOnmousedown(e: MouseEvent) {
		if (isRenaming || isNew || newTracking.isCreatingNew) return;

		if (node.type === 'directory') {
			if (e.button === 2) {
				handleContextMenu(e);
			} else if (e.button === 0) {
				toggleOpen();
			}
		} else if (node.type === 'file') {
			if (e.button === 2) {
				handleContextMenu(e);
			} else if (e.button === 0) {
				openNote({ name: node.name, path: node.path });
			}
		}
	}

	function focusInput() {
		if (nameInput) {
			nameInput.focus();
			nameInput.select();
		}
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
	class="relative flex items-center text-sm select-none hover:bg-slate-700"
	style="padding-left: {indent}em"
	oncontextmenu={handleContextMenu}
	role="button"
	tabindex="0"
>
	<button
		type="button"
		onmousedown={HandleNodeOnmousedown}
		aria-expanded={open}
		class="flex w-full items-center py-0.5"
	>
		{#if node.type === 'directory'}
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
					id="rename-file-{node.path.replace(/\//g, '-')}"
					type="text"
					bind:value={newName}
					onkeydown={handleNameKeydown}
					onblur={cancelName}
					class="w-full rounded border border-blue-500 bg-slate-600 px-1 text-sm focus:outline-none"
				/>
			{:else}
				<span class="opacity-65">{node.name}</span>
			{/if}
		</div>
	</button>
</div>

<!-- Child nodes (if directory is open) -->
{#if open && node.children}
	{#each node.children as child}
		{#if !child.name.startsWith('.')}
			<Node node={child} indent={indent + 1} />
		{/if}
	{/each}

	<!-- New input (if creating new file) -->
	{#if newTracking.isCreatingNew}
		<Node
			node={{ name: '', path: node.path + node.name + '/', type: newTracking.isCreatingNew }}
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
