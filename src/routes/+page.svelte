<script lang="ts">
	import { onMount } from 'svelte';
	import EditorComponent from '$lib/EditorComponent.svelte';
	import FileTreeComponent from '$lib/FileTreeComponent.svelte';

	import { openNote } from '$lib/utils';

	onMount(() => {
		const storedNote = localStorage.getItem('current-note');
		console.log('storedNote: ', storedNote);
		if (storedNote) {
			const { name, path } = JSON.parse(storedNote);
			openNote({ name, path });
		}
	});
</script>

<div class="grid h-screen grid-flow-row grid-cols-[auto_1fr]">
	<FileTreeComponent />
	<EditorComponent />
</div>
