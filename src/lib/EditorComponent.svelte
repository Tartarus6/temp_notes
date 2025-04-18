<script lang="ts">
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';

	import { editorState } from '$lib/editorStore.svelte';

	import Document from '@tiptap/extension-document';
	import Paragraph from '@tiptap/extension-paragraph';
	import Text from '@tiptap/extension-text';
	import Heading from '@tiptap/extension-heading';
	import BulletList from '@tiptap/extension-bullet-list';
	import OrderedList from '@tiptap/extension-ordered-list';
	import ListItem from '@tiptap/extension-list-item';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';

	import Bold from '@tiptap/extension-bold';
	import Code from '@tiptap/extension-code';
	import Italic from '@tiptap/extension-italic';

	import HorizontalRule from '@tiptap/extension-horizontal-rule';
	import TextAlign from '@tiptap/extension-text-align';

	import { MathInline } from '$lib/mathquill';

	import { common, createLowlight } from 'lowlight';

	import 'highlight.js/styles/github-dark.css';

	// extends CodeBlockLowlight to add tab behaviour
	export const CoderBlockLowlight = CodeBlockLowlight.extend({
		addKeyboardShortcuts() {
			return {
				Tab: () => {
					if (this.editor.isActive('codeBlock')) {
						this.editor.commands.insertContent('\t');
						return true;
					}
					return false;
				}
			};
		}
	});

	const lowlight = createLowlight(common);

	let editorElement: HTMLDivElement;
	let lastArrowKeyDirection: 'left' | 'right' = 'right'; // Default to right

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			lastArrowKeyDirection = 'left';
		} else if (event.key === 'ArrowRight') {
			lastArrowKeyDirection = 'right';
		}
	}

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
				CoderBlockLowlight.configure({
					lowlight,
					exitOnTripleEnter: false,
					exitOnArrowDown: false,

					HTMLAttributes: {
						class: 'p-2 bg-slate-950 rounded-md'
					}
				}),
				BulletList.configure({
					itemTypeName: 'listItem',

					HTMLAttributes: {
						class: 'bullet-list'
					}
				}),
				OrderedList,
				ListItem,
				TaskList,
				TaskItem.configure({
					nested: true
				}),
				MathInline.configure({
					HTMLAttributes: {
						class: 'p-1 border-slate-700 border-[0.1em] rounded-sm'
					},

					spaceBehavesLikeTab: true,
					autoCommands: 'pi theta sqrt sum choose int',
					getNavigationDirection: () => lastArrowKeyDirection
				})
			],
			content: '<p>Hello World!</p>', // Initial content
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editorState.editor = editor;
			}
		});

		// Add keydown listener to the editor's DOM element
		editorElement.addEventListener('keydown', handleKeyDown);

		editorState.editor = editor;

		return () => {
			editor.destroy();
			editorElement.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div class="sticky-container">
	{#if editorState.note}
		<span>current note: {editorState.note.path}{editorState.note.name}</span>
	{/if}
	<div class="sticky top-0 m-2 grid rounded-full bg-gray-800 p-2">
		<div class="w-fit place-self-center">
			{#if editorState.editor}
				<button
					onmousedown={() =>
						editorState.editor &&
						editorState.editor.chain().focus().toggleHeading({ level: 1 }).run()}
					class:active={editorState.editor.isActive('heading', { level: 1 })}
				>
					H1
				</button>
				<button
					onmousedown={() =>
						editorState.editor &&
						editorState.editor.chain().focus().toggleHeading({ level: 2 }).run()}
					class:active={editorState.editor.isActive('heading', { level: 2 })}
				>
					H2
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setParagraph().run()}
					class:active={editorState.editor.isActive('paragraph')}
				>
					P
				</button>

				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('left').run()}
					class:active={editorState.editor.isActive({ textAlign: 'left' })}
				>
					Left
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('center').run()}
					class:active={editorState.editor.isActive({ textAlign: 'center' })}
				>
					Center
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('right').run()}
					class:active={editorState.editor.isActive({ textAlign: 'right' })}
				>
					Right
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('justify').run()}
					class:active={editorState.editor.isActive({ textAlign: 'justify' })}
				>
					Justify
				</button>
			{/if}
		</div>
	</div>

	<div class="mx-4 rounded-md border-1 border-red-400 bg-slate-800 focus-within:border-green-400">
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
