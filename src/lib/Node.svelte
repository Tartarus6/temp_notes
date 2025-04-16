<script lang="ts">
	import { removeNote, type FileNode } from './utils';
	import { openNote } from './utils';
	import Node from '$lib/Node.svelte';
	import { contextMenuState } from './variables.svelte';
	import { type ContextMenuItem, fileTreeState } from './variables.svelte';
	import { createNote } from './client/client';

	interface Props {
		node: FileNode;
		indent?: number;
	}

	let { node, indent = 0 }: Props = $props();

	let open = $state(false);
	let isHovered = $state(false);
	let isCreatingNewFile = $state(false);
	let newFileName = $state('');

	let contextMenuItems: ContextMenuItem[] = [{ label: 'New File', onClick: handleCreateNewFile }];
	if (node.type === 'file') {
		contextMenuItems.push({ label: 'Delete File', onClick: handleDeleteFile });
	}

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

	function handleCreateNewFile() {
		// If directory is not open, open it to show the new file
		if (!open) toggleOpen();
		isCreatingNewFile = true;
		// Make sure to focus the input after the DOM updates
		setTimeout(() => {
			const input = document.getElementById(`new-file-${node.path.replace(/\//g, '-')}`);
			if (input) (input as HTMLInputElement).focus();
		}, 0);
	}

	function handleNewFileKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (newFileName.trim()) {
				// Create the actual file
				saveNewFile();
			}
		} else if (e.key === 'Escape') {
			cancelNewFile();
		}
	}

	async function saveNewFile() {
		try {
			// Create new note with empty content
			let filePath;
			if (node.type === 'directory') {
				filePath = node.path + node.name + '/';
			} else {
				filePath = node.path;
			}

			const note = await createNote({
				path: filePath,
				name: newFileName
			});

			if (note) {
				// Reset the state and refresh the tree
				isCreatingNewFile = false;
				newFileName = '';
				fileTreeState.isOld = true; // Force a rerender of the file tree
			}
		} catch (error) {
			console.error('Error creating file:', error);
		}
	}

	function cancelNewFile() {
		isCreatingNewFile = false;
		newFileName = '';
	}

	function handleDeleteFile() {
		try {
			if (node.path && confirm(`Are you sure you want to delete ${node.name}?`)) {
				removeNote({ name: node.name, path: node.path });
				const event = new CustomEvent('fileDeleted', {
					bubbles: true,
					detail: { path: node.path, name: node.name }
				});
				document.dispatchEvent(event);
			}
		} catch (error) {
			console.log('Error deleting file:', error);
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
		<button
			type="button"
			onclick={toggleOpen}
			onkeydown={(e) => e.key === 'Enter' && toggleOpen()}
			aria-expanded={open}
			class="py-[2px]} flex w-full items-center"
		>
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
			<span class="flex min-w-[16px] items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="#dcb67a"
				>
					<path d={open ? 'M2 2v12h12V4H8L6 2H2z' : 'M2 2v12h12V4H8L6 2H2z'} />
				</svg>
			</span>
			<span class="ml-1">{node.name}</span>
		</button>
	{:else}
		<button
			onmousedown={() => openNote({ name: node.name, path: node.path })}
			class="flex w-full items-center py-[2px]"
		>
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
			<span class="ml-1">{node.name}</span>
		</button>
	{/if}
</div>

{#if open && node.children}
	{#each node.children as child}
		<Node node={child} indent={indent + 1} />
	{/each}

	{#if isCreatingNewFile}
		<div
			class="flex items-center"
			style="padding-left: {node.type === 'directory' ? indent + 1 : 0}em"
		>
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
{/if}

<style>
	button {
		cursor: pointer;
		outline: none;
	}
</style>
