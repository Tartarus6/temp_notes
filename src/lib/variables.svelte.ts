import { Editor } from '@tiptap/core';
import type { Note } from './server/server';
import type { SvelteComponent } from 'svelte';

/**
 * Represents an item in a context menu
 */
export type ContextMenuItem = {
	/** The label displayed in the context menu */
	label: string;
	/** Function to call when the menu item is clicked */
	onClick: () => void;
};

/**
 * Editor state containing the current editor instance and active note
 */
interface EditorState {
	/** The TipTap editor instance */
	editor: Editor | null;
	/** The currently active note */
	note: Note | null;
	/** Tracks if Heading 1 is active */
	isHeading1Active: boolean;
	/** Tracks if Heading 2 is active */
	isHeading2Active: boolean;
	/** Tracks if Paragraph is active */
	isParagraphActive: boolean;
	/** Tracks if text align left is active */
	isTextAlignLeftActive: boolean;
	/** Tracks if text align center is active */
	isTextAlignCenterActive: boolean;
	/** Tracks if text align right is active */
	isTextAlignRightActive: boolean;
	/** Tracks if text align justify is active */
	isTextAlignJustifyActive: boolean;
	// Add other states like isBoldActive, isItalicActive etc. if needed
}

/**
 * Context menu state for right-click menus throughout the application
 */
interface ContextMenuState {
	/** The context menu component instance */
	contextMenu: SvelteComponent | null;
	/** Items to show in the context menu */
	items: ContextMenuItem[];
	/** X position of the context menu */
	x: number;
	/** Y position of the context menu */
	y: number;
	/** Whether the context menu should be visible */
	show: boolean;
}

/**
 * Explorer tree state to track updates
 */
interface ExplorerTreeState {
	/** Flag to indicate explorer tree needs refresh */
	isOld: boolean;
}

/**
 * Main editor state - globally accessible
 */
export let editorState: EditorState = $state({
	editor: null,
	note: null,
	// Initialize boolean states
	isHeading1Active: false,
	isHeading2Active: false,
	isParagraphActive: false, // Or true if paragraph is the default
	isTextAlignLeftActive: true, // Assuming left is the default alignment
	isTextAlignCenterActive: false,
	isTextAlignRightActive: false,
	isTextAlignJustifyActive: false
});

/**
 * Context menu state - globally accessible
 */
export let contextMenuState: ContextMenuState = $state({
	contextMenu: null,
	items: [],
	x: 0,
	y: 0,
	show: false
});

/**
 * explorer tree state - globally accessible
 */
export const explorerTreeState: ExplorerTreeState = $state({
	isOld: false
});
