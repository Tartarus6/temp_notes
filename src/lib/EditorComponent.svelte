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
	import Image from '@tiptap/extension-image';

	// Functional extensions
	import History from '@tiptap/extension-history';
	import Link from '@tiptap/extension-link';

	// App imports
	import { editorState } from '$lib/variables.svelte';
	import { saveNote, uploadImage } from '$lib/utils';
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
	let editorTitleElement: HTMLDivElement;

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
	 * Handle dropped images
	 */
	async function handleDrop(event: DragEvent): Promise<void> {
		if (!event.dataTransfer?.files || !editorState.editor) return;

		const files = Array.from(event.dataTransfer.files);
		const imageFiles = files.filter((file) => file.type.startsWith('image/'));

		if (imageFiles.length === 0) return;

		// Prevent default browser behavior completely
		event.preventDefault();
		event.stopPropagation();

		// Process each image
		for (const file of imageFiles) {
			console.log('File:', file);

			// Upload the image in the background
			const uploadedImage = await uploadImage(file);

			// If upload was successful, replace the placeholder with the actual image
			if (uploadedImage) {
				// Create a data URL from the base64 image data
				const imageUrl = `data:${uploadedImage.mimetype};base64,${uploadedImage.data}`;

				editorState.editor.commands.setImage({
					src: imageUrl,
					alt: 'image'
				});
			}
		}
	}

	/**
	 * Handle pasted images
	 */
	async function handlePaste(event: ClipboardEvent): Promise<void> {
		if (!event.clipboardData?.items || !editorState.editor) return;
		// Check for images in clipboard
		const items = Array.from(event.clipboardData.items);
		const imageItems = items.filter((item) => item.type.startsWith('image/'));
		if (imageItems.length === 0) return;

		// We're handling the image, so prevent default paste behavior - prevent at the highest level
		// This is crucial to prevent the browser's default paste behavior
		event.preventDefault();
		event.stopPropagation();

		const files = Array.from(event.clipboardData.files);

		for (const file of files) {
			console.log('File:', file);

			// Upload the image in the background
			const uploadedImage = await uploadImage(file);

			// If upload was successful, replace the placeholder with the actual image
			if (uploadedImage) {
				// Create a data URL from the base64 image data
				const imageUrl = `data:${uploadedImage.mimetype};base64,${uploadedImage.data}`;

				editorState.editor.commands.setImage({
					src: imageUrl,
					alt: 'image'
				});
			}
		}
	}

	/**
	 * Handle image upload via file input
	 */
	async function handleImageFileInput(): Promise<void> {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'image/*';
		fileInput.onchange = async (e) => {
			const target = e.target as HTMLInputElement;
			const file = target.files?.[0];
			if (!file || !editorState.editor) return;

			// Upload the image in the background
			const uploadedImage = await uploadImage(file);

			// If upload was successful, replace the placeholder with the actual image
			if (uploadedImage) {
				// Create a data URL from the base64 image data
				const imageUrl = `data:${uploadedImage.mimetype};base64,${uploadedImage.data}`;

				editorState.editor.commands.setImage({
					src: imageUrl,
					alt: 'image'
				});
			}
		};
		fileInput.click();
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
				}),

				// Image support
				Image.configure({
					allowBase64: true,
					HTMLAttributes: {
						class: 'max-w-full rounded-md'
					}
				}),
				Link.configure({
					HTMLAttributes: {
						class: 'text-blue-400 underline hover:text-blue-300',
						rel: 'noopener noreferrer',
						target: '_blank'
					}
				}),
				History
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
		editorElement.addEventListener('dragover', (e) => e.preventDefault());
		editorElement.addEventListener('drop', handleDrop);
		editorElement.addEventListener('paste', handlePaste, true);

		// Store editor reference in global state
		editorState.editor = editor;

		// Initial state update right after editor creation
		updateButtonStates(editor);

		// Cleanup on component unmount
		return () => {
			editor.destroy();
			editorElement.removeEventListener('keydown', handleKeyDown);
			editorElement.removeEventListener('dragover', (e) => e.preventDefault());
			editorElement.removeEventListener('drop', handleDrop);
			editorElement.removeEventListener('paste', handlePaste, true);
		};
	});
</script>

<!-- We use editorUpdateCounter in a reactive block to force reactivity -->
<!-- This block will re-render whenever editorUpdateCounter changes -->

<div class="mx-4 flex flex-col gap-2 {editorState.note ? '' : 'hidden'} h-full overflow-y-scroll">
	<!-- Editor toolbar -->
	<div
		class="sticky top-0 z-10 my-2 grid grid-cols-[1fr_auto] items-center rounded-md border-1 border-slate-500 bg-gray-800 p-2 select-none"
	>
		<div class="place-self-center">
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

				<!-- Divider -->
				<span class="mx-2 inline-block"></span>

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

				<!-- Divider -->
				<span class="mx-2 inline-block"></span>

				<!-- Image insert button -->
				<button onmousedown={handleImageFileInput}> Image </button>

				<!-- Link button -->
				<button
					onmousedown={() => {
						const regex = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//; // checks if url starts with a protocol
						let url = prompt('URL') || '';

						if (!regex.test(url)) {
							// If the URL doesn't start with a protocol, add https://
							url = 'https://' + url;
						}

						if (editorState.editor) {
							editorState.editor.chain().focus().setLink({ href: url }).run();
						}
					}}
				>
					Link
				</button>

				<!-- Divider -->
				<span class="mx-2 inline-block"></span>

				<button onmousedown={() => editorState.editor && editorState.editor.commands.undo()}>
					Undo
				</button>

				<button onmousedown={() => editorState.editor && editorState.editor.commands.redo()}>
					Redo
				</button>
			{/if}
		</div>

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

	<!-- Editor content area -->
	<div
		class="rounded-md border border-slate-600 bg-slate-800 transition-colors focus-within:border-blue-400"
	>
		<div
			class="break-after-all overflow-hidden border-b-2 border-b-slate-600 px-1 text-center break-words"
		>
			<h1
				bind:this={editorTitleElement}
				spellcheck="false"
				contenteditable="{/* TODO: set to true and make stuff work */ ''}false"
			>
				{editorState.note?.name}
			</h1>
		</div>
		<div bind:this={editorElement} class="overflow-y-scroll"></div>
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

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 1rem 0;
		border-radius: 0.375rem;
	}

	:global(.ProseMirror img.image-uploading) {
		opacity: 0.6;
		filter: grayscale(50%);
		border: 0.1em dashed var(--color-slate-500);
		/* Add a pulsing animation */
		animation: pulse 1.5s infinite alternate;
	}

	@keyframes pulse {
		0% {
			opacity: 0.4;
		}
		100% {
			opacity: 0.7;
		}
	}
</style>
