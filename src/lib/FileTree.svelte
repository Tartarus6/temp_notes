<script lang="ts">
	import { fetchNotes, updateNote, createNote } from '$lib/client/client';
	import { editorInstance, noteInstance } from '$lib/editorStore';
	import type { Note } from '$lib/server/server';

	let newNoteName = $state('');

	let notesList: Note[] = $state([]);

	async function updateTree() {
		notesList = await fetchNotes();
	}

	updateTree();

	async function newNote(name: string) {
		const note = await createNote(name);
		if (note) {
			updateTree();
		}
	}

	async function openNote(note: Note) {
		saveNote().then(() => {
			if ($editorInstance) {
				$editorInstance.commands.setContent(note.content);
				noteInstance.set(note);
			}
		});
	}

	async function saveNote() {
		if ($editorInstance && $noteInstance && $noteInstance.id) {
			const content = $editorInstance.getHTML();
			const note = await updateNote($noteInstance.id, $noteInstance.name, content);
			if (note) {
				updateTree();
			}
		}
	}
</script>

<div class="flex h-full w-48 flex-col place-items-start bg-red-400 text-start">
	<button onclick={() => saveNote()} class=" my-1 w-full bg-blue-400 p-1 text-left">
		<span>save note</span>
	</button>
	<input
		type="text"
		bind:value={newNoteName}
		placeholder="new note name"
		onkeydown={(e) => e.key === 'Enter' && newNote(newNoteName)}
	/>
	{#each notesList as note}
		<button onclick={() => openNote(note)} class=" my-1 w-full bg-blue-400 p-1 text-left">
			<span>{note.name}</span>
		</button>
	{/each}
</div>
