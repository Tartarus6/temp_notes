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
			const MQ = MathQuill.getInterface(3); // Get the MathQuill interface

			let mathField: typeof MathQuillMathField; // store the field instance

			const updateContent = () => {
				const content = props.node.attrs.content || '';
				// If the mathField already exists, update its latex without recreating it.
				if (mathField) {
					// Only update if the current content differs.
					if (mathField.latex() !== content) {
						mathField.latex(content);
					}
				} else {
					// Initial render: set the container HTML if content provided
					if (content) {
						dom.innerHTML = content;
					}
					// Create the MathField once and assign to mathField.
					mathField = MQ.MathField(dom, {
						spaceBehavesLikeTab: true,
						autoCommands: 'pi theta sqrt sum choose int',
						handlers: {
							edit: () => {
								const pos = props.getPos();
								if (pos === undefined) {
									return;
								}
								// Read latest latex value
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
					dom.classList.add('ProseMirror-selectednode');
				},
				deselectNode: () => {
					dom.classList.remove('ProseMirror-selectednode');
				},
				stopEvent: () => {
					return true;
				},
				ignoreMutation: () => {
					return true;
				}
			};
		};
	}
});
