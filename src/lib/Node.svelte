<script lang="ts">
	import { type FileNode } from './utils';
	import { fetchNotes, updateNote, createNote } from '$lib/client/client';
	import { editorInstance, noteInstance } from '$lib/editorStore';

	export let node: FileNode;
	export let indent = 0;

	let open = true;

	function toggleOpen() {
		open = !open;
	}
</script>

<div style="padding-left: {indent}px">
	{#if node.type === 'directory'}
		<span onclick={toggleOpen}>
			{node.name}
			{open ? '(open)' : '(closed)'}
		</span>
	{:else}
		<button
			onclick={() => console.log('sure do wish i could open', node.name, 'right now :/')}
			class=" w-full bg-blue-400 p-1 text-left"
		>
			<span>{node.name}</span>
		</button>
	{/if}
</div>

{#if open && node.children}
	{#each node.children as child}
		<svelte:self node={child} indent={indent + 24} />
	{/each}
{/if}

<style>
	span {
		cursor: pointer;
		user-select: none;
	}
</style>
