import { Editor } from '@tiptap/core';
import type { Note } from './server/server';
import type { SvelteComponent } from 'svelte';

// writable stores to hold variables, accessible from any component

interface editorState {
	editor: Editor | null;
	note: Note | null;
}

interface contextMenuState {
	contextMenu: SvelteComponent | null;
	items: ContextMenuItem[];
	x: number;
	y: number;
	show: boolean;
}

export type ContextMenuItem = {
	label: string;
	onClick: () => void;
};

export const editorState: editorState = $state({
	editor: null,
	note: null
});

export const contextMenuState: contextMenuState = $state({
	contextMenu: null,
	items: [],
	x: 0,
	y: 0,
	show: false
});

export const fileTreeState = $state({
	isOld: false
});
