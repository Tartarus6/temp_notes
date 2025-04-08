export interface MathQuillStatic {
	getInterface(version: number): MathQuillInterface;
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

interface MathQuillMathField {
	// Add any methods you use from the MathField object here
}

declare var MathQuill: MathQuillStatic;

export default MathQuill;
