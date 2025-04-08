import { Node, mergeAttributes } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import { nodeInputRule } from '@tiptap/core';

import { Selection } from '@tiptap/pm/state';

import MathquillComponent from './MathquillComponent.svelte';

/**
 * Matches a dollar sign followed by a space.
 */
export const backtickInputRegex = /\$ /;

export const Mathquill = Node.create({
	name: 'mathquill',
	group: 'inline', // inline node
	inline: true,
	defining: true,

	addOptions() {
		return {
			HTMLAttributes: {}
		};
	},

	addAttributes() {
		return {
			count: {
				default: 0
			}
		};
	},

	parseHTML() {
		// Use a span with a distinguishing class
		return [{ tag: 'span.mathquill-inline' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', mergeAttributes(HTMLAttributes, { class: 'mathquill-inline' })];
	},

	addNodeView() {
		// Your Svelte component should now provide a contentDOM element.
		return SvelteNodeViewRenderer(MathquillComponent);
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: backtickInputRegex,
				type: this.type,
				getAttributes: (match) => ({
					language: match[1]
				})
			})
		];
	},

	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }) => {
				const { state } = editor;
				const { selection } = state;
				const { $from, empty } = selection;

				console.log($from.parent.type);
				if (!empty || $from.parent.type !== this.type) {
					console.log('Not empty or not mathquill');
					return false;
				}
				console.log('Enter pressed');
				return true;
			}
		};
	}
});
