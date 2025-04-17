<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { common, createLowlight } from 'lowlight';

	// Core extensions
	import Document from '@tiptap/extension-document';
	import Paragraph from '@tiptap/extension-paragraph';
	import Text from '@tiptap/extension-text';
	import Heading from '@tiptap/extension-heading';

	// List extensions
	import BulletList from '@tiptap/extension-bullet-list';
	import OrderedList from '@tiptap/extension-ordered-list';
	import ListItem from '@tiptap/extension-list-item';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';

	// Formatting extensions
	import Bold from '@tiptap/extension-bold';
	import Code from '@tiptap/extension-code';
	import Italic from '@tiptap/extension-italic';
	import HorizontalRule from '@tiptap/extension-horizontal-rule';
	import TextAlign from '@tiptap/extension-text-align';
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';

	// App imports
	import { editorState } from '$lib/variables.svelte';
	import { saveNote } from '$lib/utils';
	import { MathInline } from '$lib/mathquill';

	// Styles
	import 'highlight.js/styles/github-dark.css';

	// =========================================
	// Configuration
	// =========================================

	// Configure syntax highlighting
	const lowlight = createLowlight(common);

	// Enhanced CodeBlock with tab support
	const EnhancedCodeBlock = CodeBlockLowlight.extend({
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

	// =========================================
	// Component state
	// =========================================

	// UI Elements
	let editorElement: HTMLDivElement;

	// Save state tracking
	let saveStatus: 'saved' | 'saving' | 'error' = $state('saved');
	let saveTimeout: ReturnType<typeof setTimeout>;

	// Math input tracking
	let lastArrowKeyDirection: 'left' | 'right' = $state('right');

	// =========================================
	// Functions
	// =========================================

	/**
	 * Debounced save function for autosaving notes while typing
	 */
	function debouncedSave(): void {
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
		}, 1000);
	}

	/**
	 * Track arrow key direction for math mode navigation
	 */
	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'ArrowLeft') {
			lastArrowKeyDirection = 'left';
		} else if (event.key === 'ArrowRight') {
			lastArrowKeyDirection = 'right';
		}
	}

	/**
	 * Initialize editor on component mount
	 */
	onMount(() => {
		// Create editor instance
		const editor = new Editor({
			element: editorElement,
			extensions: [
				// Core document structure
				Document,
				Paragraph,
				Text,
				Heading,
				HorizontalRule,

				// Text formatting
				Bold,
				Italic,
				Code.configure({
					HTMLAttributes: {
						class: 'p-1 bg-slate-600 rounded-md text-sm'
					}
				}),

				// Text alignment
				TextAlign.configure({
					defaultAlignment: 'left',
					types: ['heading', 'paragraph']
				}),

				// Code blocks
				EnhancedCodeBlock.configure({
					lowlight,
					exitOnTripleEnter: false,
					exitOnArrowDown: false,
					HTMLAttributes: {
						class: 'p-2 bg-slate-950 rounded-md'
					}
				}),

				// Lists
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

				// Math input
				MathInline.configure({
					HTMLAttributes: {
						class: 'p-1 border-slate-700 border-[0.1em] rounded-sm'
					},
					spaceBehavesLikeTab: true,
					autoCommands: 'pi theta sqrt sum choose int',
					getNavigationDirection: () => lastArrowKeyDirection
				})
			],
			content: editorState.note?.content || '<p>Hello World!</p>',
			onUpdate: ({ editor }) => {
				// Trigger save when content changes
				debouncedSave();
				// Optionally update reactive states here too if needed on content change specifically
				// updateButtonStates(editor); // Not strictly needed if onTransaction covers it
			},
			onTransaction: ({ editor }) => {
				// Update the editor reference AND the specific boolean states
				editorState.editor = editor; // Keep this if other parts rely on the editor instance directly
				updateButtonStates(editor);
			}
		});

		// Function to update reactive boolean states
		function updateButtonStates(currentEditor: Editor) {
			editorState.isHeading1Active = currentEditor.isActive('heading', { level: 1 });
			editorState.isHeading2Active = currentEditor.isActive('heading', { level: 2 });
			editorState.isParagraphActive = currentEditor.isActive('paragraph');
			editorState.isTextAlignLeftActive = currentEditor.isActive({ textAlign: 'left' });
			editorState.isTextAlignCenterActive = currentEditor.isActive({ textAlign: 'center' });
			editorState.isTextAlignRightActive = currentEditor.isActive({ textAlign: 'right' });
			editorState.isTextAlignJustifyActive = currentEditor.isActive({ textAlign: 'justify' });
			// Update other states (Bold, Italic, etc.) here if you add buttons for them
		}

		// Set up event handlers
		editorElement.addEventListener('keydown', handleKeyDown);

		// Store editor reference in global state
		editorState.editor = editor;

		// Initial state update right after editor creation
		updateButtonStates(editor);

		// Cleanup on component unmount
		return () => {
			editor.destroy();
			editorElement.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<!-- We use editorUpdateCounter in a reactive block to force reactivity -->
<!-- This block will re-render whenever editorUpdateCounter changes -->

<div class="mx-4 flex flex-col gap-2 {editorState.note ? '' : 'hidden'}">
	<!-- Note info and save status -->
	<div class="flex items-center justify-between">
		{#if editorState.note}
			<span class="text-sm font-medium">
				{editorState.note.path}{editorState.note.name}
			</span>
		{:else}
			<span class="text-sm text-slate-400">No note selected</span>
		{/if}

		<!-- Save status indicator -->
		<div class="flex items-center">
			{#if saveStatus === 'saving'}
				<span class="flex items-center gap-1 text-yellow-400" title="Saving...">
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
				<span class="flex items-center gap-1 text-green-400" title="Saved">
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
				<span class="flex items-center gap-1 text-red-400" title="Error saving">
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

	<!-- Editor toolbar -->
	<div
		class="sticky top-0 my-2 grid rounded-md border-1 border-slate-500 bg-gray-800 p-2 select-none"
	>
		<div class="w-fit place-self-center">
			{#if editorState.editor}
				<button
					onmousedown={() =>
						editorState.editor &&
						editorState.editor.chain().focus().toggleHeading({ level: 1 }).run()}
					class:active={editorState.isHeading1Active}
				>
					H1
				</button>
				<button
					onmousedown={() =>
						editorState.editor &&
						editorState.editor.chain().focus().toggleHeading({ level: 2 }).run()}
					class:active={editorState.isHeading2Active}
				>
					H2
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setParagraph().run()}
					class:active={editorState.isParagraphActive}
				>
					P
				</button>

				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('left').run()}
					class:active={editorState.isTextAlignLeftActive}
				>
					Left
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('center').run()}
					class:active={editorState.isTextAlignCenterActive}
				>
					Center
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('right').run()}
					class:active={editorState.isTextAlignRightActive}
				>
					Right
				</button>
				<button
					onmousedown={() =>
						editorState.editor && editorState.editor.chain().focus().setTextAlign('justify').run()}
					class:active={editorState.isTextAlignJustifyActive}
				>
					Justify
				</button>
			{/if}
		</div>
	</div>

	<!-- Editor content area -->
	<div
		class="rounded-md border border-slate-600 bg-slate-800 p-4 transition-colors focus-within:border-blue-400"
	>
		<div bind:this={editorElement} class="prose prose-invert max-w-none"></div>
	</div>
</div>

<style lang="postcss">
	@import 'tailwindcss';

	button {
		@apply rounded bg-slate-700 px-3 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600;
	}

	button.active {
		@apply bg-blue-500 text-white;
	}
</style>
