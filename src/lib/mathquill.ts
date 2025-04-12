import { Node, mergeAttributes } from '@tiptap/core';
import type { MathQuillStatic } from '$lib/mathquill-desmos/mathquill';
import type MathQuillMathField from '$lib/mathquill-desmos/mathquill';

import { nodeInputRule } from '@tiptap/core';

import type { NodeViewRendererProps } from '@tiptap/core';

declare const MathQuill: MathQuillStatic; // Use declare, but don't import

export const inputRegex = /\$ /;

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
				find: inputRegex,
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
					// if the content already exists, just load it
					if (content) {
						dom.innerHTML = content;
					}
					mathField = MQ.MathField(dom, {
						spaceBehavesLikeTab: this.options.spaceBehavesLikeTab,
						autoCommands: this.options.autoCommands,
						handlers: {
							edit: () => {
								const pos = props.getPos();
								if (pos === undefined) {
									return;
								}
								// allowing for the math content to be saved
								const newContent = mathField.latex();
								props.view.dispatch(
									props.view.state.tr.setNodeMarkup(pos, undefined, {
										...props.node.attrs,
										content: newContent
									})
								);
							}
						}
					});
				}
			};

			updateContent(); // initial render

			// Add event listener in capture phase to intercept before MathQuill
			dom.addEventListener(
				'keydown',
				(event) => {
					if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
						const cursor = mathField.__controller.cursor;

						// preventing escaping if inside of something like a fraction rather than the root
						const inRoot = cursor.parent._el?.classList.contains('mq-root-block');
						if (!inRoot) return;

						// cursor[1] is 0 if no elements to the right of the cursor
						// cursor[-1] is 0 if no elements to the left of the cursor
						if (event.key === 'ArrowRight' && cursor[1] === 0) {
							event.preventDefault();
							event.stopPropagation();
							props.editor.commands.focus(props.getPos() + 1);
						} else if (event.key === 'ArrowLeft' && cursor[-1] === 0) {
							event.preventDefault();
							event.stopPropagation();
							props.editor.commands.focus(props.getPos());
						}
					}
				},
				true // true enables capture phase, so event runs before cursor moves
			);

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
					// Get direction immediately when the node is selected
					requestAnimationFrame(() => {
						const direction = this.options.getNavigationDirection?.() || 'right';

						mathField?.focus();
						if (direction === 'left') {
							mathField?.moveToRightEnd();
						} else if (direction === 'right') {
							mathField?.moveToLeftEnd();
						}
					});
					dom.classList.add('ProseMirror-selectednode');
				},
				deselectNode: () => {
					dom.classList.remove('ProseMirror-selectednode');
				},
				stopEvent: (event) => {
					return true;
				},
				ignoreMutation: () => true
			};
		};
	}
});
