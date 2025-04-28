<script lang="ts">
	import e from 'cors';
	import Test from './Test.svelte';
	import { setContext, getContext } from 'svelte';

	interface Props {
		count?: number;
	}

	let { count }: Props = $props();

	interface Context {
		count: number;
	}

	let parentContext: null | Context = getContext('context');

	if (parentContext) {
		console.log('Parent context:', parentContext.count);
	}

	let context: Context = $state({
		count:
			count !== undefined
				? count
				: parentContext && parentContext.count
					? parentContext.count - 1
					: 0
	});

	$effect(() => {
		if (parentContext) {
			context.count = parentContext.count - 1;
		}
	});

	setContext('context', context);
</script>

<button
	onmousedown={() => {
		if (parentContext) {
			parentContext.count += 1;
		}
	}}
>
	hello
</button>
<button
	onmousedown={() => {
		if (parentContext) {
			parentContext.count -= 1;
		}
	}}
>
	{context.count}
</button>

<br />

{#if context.count > 1}
	<Test />
{/if}

<style>
	button {
		background-color: var(--color-blue-600);
		padding: 0.5rem;
	}
	button:hover {
		background-color: var(--color-blue-400);
	}
</style>
