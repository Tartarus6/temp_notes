<script lang="ts">
	import { type FileNode } from './utils';
	import { openNote } from './utils';

	export let node: FileNode;
	export let indent = 0;

	let open = false;
	let isHovered = false;

	function toggleOpen() {
		open = !open;
	}
</script>

<div
	class="relative flex items-center text-sm select-none"
	style="padding-left: {indent}px"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	role="button"
	tabindex="0"
>
	{#if node.type === 'directory'}
		<button
			type="button"
			onclick={toggleOpen}
			onkeydown={(e) => e.key === 'Enter' && toggleOpen()}
			aria-expanded={open}
			class="flex w-full items-center py-[2px] hover:bg-[#37373d] {isHovered ? 'bg-[#37373d]' : ''}"
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
			class="flex w-full items-center py-[2px] hover:bg-[#37373d] {isHovered ? 'bg-[#37373d]' : ''}"
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
		<svelte:self node={child} indent={indent + 8} />
	{/each}
{/if}

<style>
	button {
		cursor: pointer;
		outline: none;
	}
</style>
