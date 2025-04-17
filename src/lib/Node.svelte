<script lang="ts">
	import { removeNote, type FileNode, openNote } from './utils';
	import Node from '$lib/Node.svelte';
	import { contextMenuState, fileTreeState } from './variables.svelte';
	import { type ContextMenuItem } from './variables.svelte';
	import { createNote, renameNote, renameFolderAndUpdateFiles } from './client/client';

	// Props
	interface Props {
		node: FileNode;
		indent?: number;
	}

	let { node, indent = 0 }: Props = $props();

	// State
	let open = $state(false);
	let isHovered = $state(false);
	let isCreatingNewFile = $state(false);
	let isCreatingNewFolder = $state(false);
	let isRenaming = $state(false);
	let newFileName = $state('');
	let newFolderName = $state('');
	let newName = $state(node.name);

	// Context menu setup
	const contextMenuItems: ContextMenuItem[] = getContextMenuItems();

	function getContextMenuItems(): ContextMenuItem[] {
		const items: ContextMenuItem[] = [];

		if (node.type === 'directory') {
			items.push({ label: 'New File', onClick: handleCreateNewFile });
			items.push({ label: 'New Folder', onClick: handleCreateNewFolder });
			items.push({ label: 'Rename Folder', onClick: handleRename });
			items.push({ label: 'Delete Folder', onClick: handleDeleteFolder });
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

	function focusElement(id: string) {
		setTimeout(() => {
			const element = document.getElementById(id);
			if (element) (element as HTMLInputElement).focus();
		}, 0);
	}

	// File operations
	function handleCreateNewFile() {
		if (!open) toggleOpen();
		isCreatingNewFile = true;

		const inputId = `new-file-${node.path.replace(/\//g, '-')}`;
		focusElement(inputId);
	}

	function handleCreateNewFolder() {
		if (!open) toggleOpen();
		isCreatingNewFolder = true;

		const inputId = `new-folder-${node.path.replace(/\//g, '-')}`;
		focusElement(inputId);
	}

	function handleRename() {
		isRenaming = true;
		newName = node.name;

		const inputId = `rename-file-${node.path.replace(/\//g, '-')}`;
		focusElement(inputId);
	}

	// Keyboard event handlers
	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (newName.trim() && newName !== node.name) {
				saveRename();
			} else {
				cancelRename();
			}
		} else if (e.key === 'Escape') {
			cancelRename();
		}
	}

	function handleNewFileKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (newFileName.trim()) {
				saveNewFile();
			}
		} else if (e.key === 'Escape') {
			cancelNewFile();
		}
	}

	function handleNewFolderKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			console.log('Enter pressed');
			if (newFolderName.trim()) {
				console.log('saving new folder');
				saveNewFolder();
			}
		} else if (e.key === 'Escape') {
			cancelNewFolder();
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
					updateCurrentNoteReference();
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
			cancelRename();
		}
	}

	function updateCurrentNoteReference() {
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
	}

	function cancelRename() {
		isRenaming = false;
		newName = node.name;
	}

	async function saveNewFile() {
		try {
			const filePath = node.type === 'directory' ? node.path + node.name + '/' : node.path;

			const note = await createNote({
				path: filePath,
				name: newFileName
			});

			if (note) {
				isCreatingNewFile = false;
				newFileName = '';
				fileTreeState.isOld = true;
			}
		} catch (error) {
			console.error('Error creating file:', error);
		}
	}

	function cancelNewFile() {
		isCreatingNewFile = false;
		newFileName = '';
	}

	async function saveNewFolder() {
		try {
			// Create the folder path - folders in this app are represented by their path
			const folderPath = node.type === 'directory' ? node.path + node.name + '/' : node.path;

			// Create a placeholder file to establish the folder
			// The placeholder will have .folder extension to distinguish it
			const placeholderFileName = `.${newFolderName}.folder`;

			const note = await createNote({
				path: folderPath + newFolderName + '/',
				name: placeholderFileName
			});

			if (note) {
				isCreatingNewFolder = false;
				newFolderName = '';
				fileTreeState.isOld = true;
			}
		} catch (error) {
			console.error('Error creating folder:', error);
		}
	}

	function cancelNewFolder() {
		isCreatingNewFolder = false;
		newFolderName = '';
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

	function handleDeleteFolder() {
		if (!confirm(`Are you sure you want to delete the folder "${node.name}" and ALL its contents?`))
			return;

		try {
			const folderPath = node.path + node.name + '/';
			import('./client/client').then(async ({ deleteFolderAndContainedFiles }) => {
				const result = await deleteFolderAndContainedFiles(folderPath);

				if (result) {
					fileTreeState.isOld = true; // Force a rerender of the file tree
				}
			});
		} catch (error) {
			console.error('Error deleting folder:', error);
		}
	}
</script>

<div
	class="relative flex items-center text-sm select-none hover:bg-slate-700"
	style="padding-left: {indent}em"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	oncontextmenu={handleContextMenu}
	role="button"
	tabindex="0"
>
	{#if node.type === 'directory'}
		<!-- Directory node -->
		<button
			type="button"
			onmousedown={(e) => e.button !== 2 && toggleOpen()}
			onkeydown={(e) => e.key === 'Enter' && toggleOpen()}
			aria-expanded={open}
			class="flex w-full items-center py-[2px]"
		>
			<!-- Folder toggle icon -->
			<span class="flex min-w-[16px] items-center justify-center">
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
			<span class="flex min-w-[16px] items-center justify-center">
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

			<!-- Folder name/rename input -->
			{#if isRenaming}
				<input
					id="rename-file-{node.path.replace(/\//g, '-')}"
					type="text"
					bind:value={newName}
					onkeydown={handleRenameKeydown}
					onblur={cancelRename}
					class="ml-1 w-32 rounded border border-blue-500 bg-slate-600 px-1 py-[1px] text-sm focus:outline-none"
				/>
			{:else}
				<span class="ml-1 opacity-65">{node.name}</span>
			{/if}
		</button>
	{:else}
		<!-- File node -->
		<button
			class="flex w-full items-center py-[2px]"
			onmousedown={(e) =>
				!isRenaming && e.button !== 2 && openNote({ name: node.name, path: node.path })}
		>
			<!-- Spacer for alignment -->
			<span class="flex min-w-[16px] items-center justify-center opacity-0"></span>

			<!-- File icon -->
			<span class="flex min-w-[16px] items-center justify-center">
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

			<!-- File name/rename input -->
			{#if isRenaming}
				<input
					id="rename-file-{node.path.replace(/\//g, '-')}"
					type="text"
					bind:value={newName}
					onkeydown={handleRenameKeydown}
					onblur={cancelRename}
					class="ml-1 w-32 rounded border border-blue-500 bg-slate-600 px-1 py-[1px] text-sm focus:outline-none"
				/>
			{:else}
				<span class="ml-1">{node.name}</span>
			{/if}
		</button>
	{/if}
</div>

<!-- Child nodes (if directory is open) -->
{#if open && node.children}
	{#each node.children as child}
		{#if !child.name.startsWith('.')}
			<Node node={child} indent={indent + 1} />
		{/if}
	{/each}

	<!-- New file input (if creating new file) -->
	{#if isCreatingNewFile}
		<div class="flex items-center" style="padding-left: {indent + 1}em">
			<span class="flex min-w-[16px] items-center justify-center opacity-0"></span>
			<span class="flex min-w-[16px] items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="#519aba"
				>
					<path
						d="M13.85 4.44l-3.28-3.3-.35-.14H2.5l-.5.5v13l.5.5h11l.5-.5V4.8l-.15-.36zM13 5h-3V2l3 3zM3 14V2h6v3.5l.5.5H13v8H3z"
					/>
				</svg>
			</span>
			<input
				id="new-file-{node.path.replace(/\//g, '-')}"
				type="text"
				bind:value={newFileName}
				placeholder="new-file.md"
				onkeydown={handleNewFileKeydown}
				onblur={cancelNewFile}
				class="ml-1 w-32 rounded border border-blue-500 bg-slate-600 px-1 py-[1px] text-sm focus:outline-none"
			/>
		</div>
	{/if}

	<!-- New folder input (if creating new folder) -->
	{#if isCreatingNewFolder}
		<div class="flex items-center" style="padding-left: {indent + 1}em">
			<span class="flex min-w-[16px] items-center justify-center opacity-0"></span>
			<span class="flex min-w-[16px] items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="#519aba"
				>
					<path d="M2 2v12h12V4H8L6 2H2z" />
				</svg>
			</span>
			<input
				id="new-folder-{node.path.replace(/\//g, '-')}"
				type="text"
				bind:value={newFolderName}
				placeholder="new-folder"
				onkeydown={handleNewFolderKeydown}
				onblur={cancelNewFolder}
				class="ml-1 w-32 rounded border border-blue-500 bg-slate-600 px-1 py-[1px] text-sm focus:outline-none"
			/>
		</div>
	{/if}
{/if}

<style>
	button {
		cursor: pointer;
		outline: none;
	}
</style>
