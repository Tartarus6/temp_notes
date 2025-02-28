import { writable } from 'svelte/store';
import type { Editor } from '@tiptap/core';
import type { Note } from './server/server';

// writable stores to hold variables, accessible from any component
export const editorInstance = writable<Editor | null>(null);
export const noteNameInstance = writable<string | null>(null);
export const noteInstance = writable<Note | null>(null);
