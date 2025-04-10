<script lang="ts" module>
	import type { MathQuillStatic } from '$lib/mathquill-desmos/mathquill';

	declare const MathQuill: MathQuillStatic; // Use declare, but don't import
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	let mathFieldSpan: HTMLSpanElement;

	onMount(async () => {
		const MQ = MathQuill.getInterface(3);

		if (mathFieldSpan) {
			MQ.MathField(mathFieldSpan, {
				spaceBehavesLikeTab: true,
				autoCommands: 'pi theta sqrt sum choose int',
				handlers: {
					edit: () => {}
				}
			});
		}
	});
</script>

<span bind:this={mathFieldSpan}></span>
