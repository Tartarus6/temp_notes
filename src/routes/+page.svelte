<script lang="ts">
	import { Editor } from '@tiptap/core';
	import EditorComponent from '$lib/EditorComponent.svelte';
	import FileTreeComponent from '$lib/FileTreeComponent.svelte';

	import { editorState } from '$lib/editorStore.svelte';
</script>

<div class="grid h-screen grid-flow-row grid-cols-[auto_1fr]">
	<FileTreeComponent />
	<EditorComponent />
</div>
