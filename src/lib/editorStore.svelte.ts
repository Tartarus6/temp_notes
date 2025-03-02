import { Editor } from '@tiptap/core';
import type { Note } from './server/server';

// writable stores to hold variables, accessible from any component

type editorState = {
	editor: Editor | null;
	note: Note | null;
};

export const editorState: editorState = $state({
	editor: null,
	note: null
});
