<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="stylesheet" href="/src/lib/mathquill-desmos/mathquill.css" />
	<script src="/src/lib/mathquill-desmos/mathquill.js"></script>
</svelte:head>

{@render children()}
