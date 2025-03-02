<script lang="ts">
	import { type FileNode } from './utils';
	import { openNote } from './utils';

	export let node: FileNode;
	export let indent = 0;

	let open = true;

	function toggleOpen() {
		open = !open;
	}
</script>

<div style="padding-left: {indent}px">
	{#if node.type === 'directory'}
		<button
			type="button"
			onclick={toggleOpen}
			onkeydown={(e) => e.key === 'Enter' && toggleOpen()}
			aria-expanded={open}
		>
			{node.name}
			{open ? '(open)' : '(closed)'}
		</button>
	{:else}
		<button
			onclick={() => openNote({ name: node.name, path: node.path })}
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
