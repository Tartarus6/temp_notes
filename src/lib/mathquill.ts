import { Node, mergeAttributes } from '@tiptap/core';
import type { MathQuillStatic } from '$lib/mathquill-desmos/mathquill';
import type MathQuillMathField from '$lib/mathquill-desmos/mathquill';

import { nodeInputRule } from '@tiptap/core';

declare const MathQuill: MathQuillStatic; // Use declare, but don't import

export const backtickInputRegex = /\$ /;

export interface MathInlineOptions {
	HTMLAttributes: {
		[key: string]: any;
	};
	spaceBehavesLikeTab: boolean;
	autoCommands: string;
	getNavigationDirection: () => 'left' | 'right';
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		mathInline: {
			setMathInline: () => ReturnType;
			toggleMathInline: () => ReturnType;
			unsetMathInline: () => ReturnType;
		};
	}
}

export const MathInline = Node.create<MathInlineOptions>({
	name: 'mathInline',
	inline: true,
	group: 'inline',
	selectable: true,
	atom: true,

	addAttributes() {
		return {
			content: {
				default: ''
			}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'math-inline'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['math-inline', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
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

	addCommands() {
		return {
			setMathInline:
				() =>
				({ commands }) => {
					return commands.insertContent({ type: this.name });
				},
			toggleMathInline:
				() =>
				({ commands }) => {
					return commands.toggleNode(this.name, this.name);
				},
			unsetMathInline:
				() =>
				({ commands }) => {
					return commands.deleteNode(this.name);
				}
		};
	},

	addNodeView() {
		return (props) => {
			const dom = document.createElement('math-inline');

			// Set the HTMLAttributes from the extension options onto the dom element.
			const { HTMLAttributes } = this.options;
			for (const [attr, value] of Object.entries(HTMLAttributes)) {
				dom.setAttribute(attr, value);
			}

			const MQ = MathQuill.getInterface(3); // Get the MathQuill interface

			let mathField: typeof MathQuillMathField; // store the field instance

			const updateContent = () => {
				const content = props.node.attrs.content || '';
				// If the mathField already exists, update its latex without recreating it.
				if (mathField) {
					if (mathField.latex() !== content) {
						mathField.latex(content);
					}
				} else {
					if (content) {
						dom.innerHTML = content;
					}
					mathField = MQ.MathField(dom, {
						spaceBehavesLikeTab: this.options.spaceBehavesLikeTab,
						autoCommands: this.options.autoCommands,
						handlers: {
							edit: () => {
								/*
								const pos = props.getPos();
								if (pos === undefined) {
									return;
								}
								const newContent = mathField.latex();
								props.view.dispatch(
									props.view.state.tr.setNodeMarkup(pos, undefined, {
										...props.node.attrs,
										content: newContent
									})
								);
								*/
							}
						}
					});
				}
			};

			updateContent(); // initial render

			dom.addEventListener('keydown', (event) => {
				if (event.key === 'ArrowRight') {
					console.log('right pressed');
					event.preventDefault();
					event.stopPropagation();
				}
			});

			return {
				dom,
				update: (updatedNode) => {
					if (updatedNode.type.name !== this.name) {
						return false;
					}
					props.node = updatedNode;
					updateContent();
					return true;
				},
				selectNode: () => {
					console.log('node selected');
					const direction = this.options.getNavigationDirection?.() || 'right';

					console.log(`direction: ${direction}`);

					mathField?.focus();
					if (direction === 'left') {
						mathField?.moveToRightEnd();
					} else if (direction === 'right') {
						mathField?.moveToLeftEnd();
					}
					dom.classList.add('ProseMirror-selectednode');
				},
				deselectNode: () => {
					console.log('node deselected');
					dom.classList.remove('ProseMirror-selectednode');
				},
				stopEvent: (event) => {
					// Allow arrow keys to bubble out so that the ProseMirror selection can update.
					if (event instanceof KeyboardEvent) {
						if (
							event.key === 'ArrowLeft' ||
							event.key === 'ArrowRight' ||
							event.key === 'ArrowUp' ||
							event.key === 'ArrowDown'
						) {
							return false;
						}
					}
					return true;
				},
				ignoreMutation: () => true
			};
		};
	}
});
