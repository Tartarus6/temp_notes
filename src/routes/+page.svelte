<script lang="ts">
	import Editor from '$lib/Editor.svelte';
	import FileTree from '$lib/FileTree.svelte';
</script>

<div class="grid h-screen grid-flow-row grid-cols-[auto_1fr]">
	<FileTree />
	<Editor />
</div>
