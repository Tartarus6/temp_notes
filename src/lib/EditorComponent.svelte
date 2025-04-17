<script lang="ts">
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';

	import { editorState } from '$lib/variables.svelte';
	import { saveNote } from '$lib/utils';

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

	let saveStatus: 'saved' | 'saving' | 'error' = $state('saved');
	let saveTimeout: NodeJS.Timeout;

	// debounced save function for live note saving
	async function saveLive() {
		if (!editorState.editor || !editorState.note) return;

		clearTimeout(saveTimeout);
		saveStatus = 'saving';

		saveTimeout = setTimeout(async () => {
			try {
				await saveNote();
				saveStatus = 'saved';
			} catch (err) {
				saveStatus = 'error';
				console.error('Failed to save:', err);
			}
		}, 1000); // Save after 1 second of no typing
	}

	// tracking for entering and exiting math mode
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
						class: 'p-1 bg-slate-600 rounded-md text-sm'
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
			content: editorState.note?.content || '<p>Hello World!</p>', // Use existing content if available
			onUpdate: ({ editor }) => {
				// Trigger save when content changes
				saveLive();
			},
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
	<div class="flex items-center justify-between px-2">
		{#if editorState.note}
			<span>current note: {editorState.note.path}{editorState.note.name}</span>
		{:else}
			<span>No note selected</span>
		{/if}

		<div class="flex items-center gap-2">
			{#if saveStatus === 'saving'}
				<span class="flex items-center gap-1 text-yellow-400">
					<svg
						class="size-5 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</span>
			{:else if saveStatus === 'saved'}
				<span class="flex items-center gap-1 text-green-400">
					<svg
						class="size-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
			{:else}
				<span class="flex items-center gap-1 text-red-400">
					<svg
						class="size-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
			{/if}
		</div>
	</div>

	<div class="sticky top-0 m-2 grid rounded-full bg-gray-800 p-2 select-none">
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
