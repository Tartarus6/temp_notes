export interface MathQuillStatic {
	getInterface(version: number): MathQuillInterface;
	latex(latex: string | null = null): string;
	focus(): void;
	blur(): void;
	moveToLeftEnd(): void;
	moveToRightEnd(): void;
	__controller: {
		cursor: MathQuillCursor;
	};
}

interface MathQuillCursor {
	'-1': Element | number;
	'1': Element | number;
	cursorElement: Element | null;
	_el: Element | null;
	parent: MathQuillCursor;
}

interface MathQuillInterface {
	MathField(element: Element, config: MathQuillConfig): MathQuillMathField;
}

interface MathQuillConfig {
	spaceBehavesLikeTab: boolean;
	autoCommands: string;
	handlers: {
		edit: () => void;
	};
}

interface MathQuillMathField extends MathQuillStatic {
	// additional methods and properties can be added here
}

declare var MathQuill: MathQuillStatic;

export default MathQuill;
