<script lang="ts">
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
	import { onDestroy, onMount, tick } from 'svelte';
	import { Editor } from '@tiptap/core';

	import { editorInstance, noteInstance } from '$lib/editorStore';

	import Document from '@tiptap/extension-document';
	import Paragraph from '@tiptap/extension-paragraph';
	import Text from '@tiptap/extension-text';
	import Heading from '@tiptap/extension-heading';
	import BulletList from '@tiptap/extension-bullet-list';
	import OrderedList from '@tiptap/extension-ordered-list';
	import ListItem from '@tiptap/extension-list-item';

	import Bold from '@tiptap/extension-bold';
	import Code from '@tiptap/extension-code';
	import Italic from '@tiptap/extension-italic';

	import HorizontalRule from '@tiptap/extension-horizontal-rule';

	import TextAlign from '@tiptap/extension-text-align';

	import { common, createLowlight } from 'lowlight';

	import 'highlight.js/styles/github-dark.css';

	const lowlight = createLowlight(common);

	let editorElement: HTMLDivElement;

	onMount(() => {
		// Check local storage for a previously saved note, open that note if it exists
		if (typeof window !== 'undefined') {
			const storedNoteName = localStorage.getItem('noteName');
			const storedNotePath = localStorage.getItem('notePath');
			if (storedNoteName && storedNotePath) {
				// noteNameInstance.set(storedNoteName);
			}
		}

		// creating the editor instance
		let editor = new Editor({
			element: editorElement,
			extensions: [
				Document,
				Paragraph,
				Text,
				Heading,
				HorizontalRule,
				Bold,
				Code.configure({
					HTMLAttributes: {
						class: 'p-1 bg-[#212325] rounded-md text-sm'
					}
				}),
				Italic,
				TextAlign.configure({
					defaultAlignment: 'left',
					types: ['heading', 'paragraph'] // Define which node types can be aligned
				}),
				CodeBlockLowlight.configure({
					lowlight,

					HTMLAttributes: {
						class: 'p-2 bg-[#212325] rounded-md'
					}
				}),
				BulletList.configure({
					itemTypeName: 'listItem'
				}),
				OrderedList,
				ListItem
			],
			content: '<p>Hello World!</p>', // Initial content
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editorInstance.set(editor);
			}
		});

		editorInstance.set(editor);

		return () => {
			editor.destroy();
		};
	});
</script>

<div class="sticky-container">
	{#if $noteInstance}
		<span>current note: {$noteInstance.name}</span>
	{/if}
	<div class="sticky top-0 m-2 grid rounded-full bg-gray-800 p-2">
		<div class="w-fit place-self-center">
			{#if $editorInstance}
				<button
					onclick={() => $editorInstance.chain().focus().toggleHeading({ level: 1 }).run()}
					class:active={$editorInstance.isActive('heading', { level: 1 })}
				>
					H1
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().toggleHeading({ level: 2 }).run()}
					class:active={$editorInstance.isActive('heading', { level: 2 })}
				>
					H2
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setParagraph().run()}
					class:active={$editorInstance.isActive('paragraph')}
				>
					P
				</button>

				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('left').run()}
					class:active={$editorInstance.isActive({ textAlign: 'left' })}
				>
					Left
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('center').run()}
					class:active={$editorInstance.isActive({ textAlign: 'center' })}
				>
					Center
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('right').run()}
					class:active={$editorInstance.isActive({ textAlign: 'right' })}
				>
					Right
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('justify').run()}
					class:active={$editorInstance.isActive({ textAlign: 'justify' })}
				>
					Justify
				</button>
			{/if}
		</div>
	</div>

	<div
		class="container mx-auto rounded-md border-1 border-red-400 bg-[#121212] focus-within:border-green-400"
	>
		<div bind:this={editorElement}></div>
	</div>
</div>

<style>
	.sticky-container {
		display: flex;
		flex-direction: column; /* Ensure buttons are above the editor */
	}

	button {
		background-color: lightgray;
		color: black;
	}

	button.active {
		background-color: black;
		color: white;
	}

	button {
		margin-right: 5px; /* Add spacing between buttons */
		padding: 5px 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
