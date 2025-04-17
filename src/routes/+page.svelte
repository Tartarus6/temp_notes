<script lang="ts">
	import { onMount } from 'svelte';
	import EditorComponent from '$lib/EditorComponent.svelte';
	import FileTreeComponent from '$lib/FileTreeComponent.svelte';
	import { openNote } from '$lib/utils';

	/**
	 * Restore the previously opened note from local storage
	 */
	function restoreLastOpenedNote(): void {
		try {
			const storedNote = localStorage.getItem('current-note');

			if (!storedNote) return;

			const { name, path } = JSON.parse(storedNote);

			if (name && path) {
				openNote({ name, path }).catch((err) => {
					console.error('Failed to restore note:', err);
				});
			}
		} catch (error) {
			console.error('Error restoring last note:', error);
		}
	}

	onMount(restoreLastOpenedNote);
</script>

<div class="grid h-screen grid-flow-row grid-cols-[auto_1fr]">
	<FileTreeComponent />
	<EditorComponent />
</div>
