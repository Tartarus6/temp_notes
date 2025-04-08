<script lang="ts" module>
	import type { MathQuillStatic } from '$lib/mathquill-desmos/mathquill';

	declare const MathQuill: MathQuillStatic; // Use declare, but don't import
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import type { NodeViewProps } from '@tiptap/core';
	import cx from 'clsx';
	import { NodeViewWrapper } from 'svelte-tiptap';

	let { node, updateAttributes }: NodeViewProps = $props();

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

<NodeViewWrapper class="inline-block">
	<span bind:this={mathFieldSpan}></span>
</NodeViewWrapper>
