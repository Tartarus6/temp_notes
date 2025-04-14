<script lang="ts">
	import { contextMenuState } from './variables.svelte';

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.context-menu')) {
			contextMenuState.show = false;
		}
	}

	$effect(() => {
		if (contextMenuState.show) {
			document.addEventListener('click', handleClickOutside);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

{#if contextMenuState.show}
	<div
		class="context-menu fixed z-50 min-w-[120px] rounded border border-slate-500 shadow-lg"
		style="left: {contextMenuState.x}px; top: {contextMenuState.y}px"
	>
		{#each contextMenuState.items as item}
			<button
				class="w-full bg-slate-800 px-4 py-2 text-left text-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
				onclick={() => {
					item.onClick();
					contextMenuState.show = false;
				}}
			>
				{item.label}
			</button>
		{/each}
	</div>
{/if}

<style>
	.context-menu {
		max-height: calc(100vh - 32px);
		overflow-y: auto;
	}
</style>
