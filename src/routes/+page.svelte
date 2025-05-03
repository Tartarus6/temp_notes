<script lang="ts">
	import { onMount } from 'svelte';
	import EditorComponent from '$lib/EditorComponent.svelte';
	import ExplorerTreeComponent from '$lib/ExplorerTreeComponent.svelte';
	import { openNote } from '$lib/utils';

	/**
	 * Restore the previously opened note from local storage
	 */
	function restoreLastOpenedNote(): void {
		try {
			const storedNote = localStorage.getItem('current-note');

			if (!storedNote) return;

			const { id } = JSON.parse(storedNote);

			if (id) {
				openNote({ id }).catch((err) => {
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
	<ExplorerTreeComponent />
	<div class="overflow-hidden">
		<EditorComponent />
	</div>
</div>
