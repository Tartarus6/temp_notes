<script lang="ts">
	import '../app.css';
	import ContextMenu from '$lib/ContextMenu.svelte';
	import { contextMenuState } from '$lib/variables.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="stylesheet" href="/src/lib/mathquill-desmos/mathquill.css" />
	<script src="/src/lib/mathquill-desmos/mathquill.js"></script>
</svelte:head>

<ContextMenu bind:this={contextMenuState.contextMenu} />

{@render children()}
