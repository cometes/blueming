import { Editor } from "slate";

export const withInlines = (editor) => {
	const {
		insertText,
		isInline,
		isElementReadOnly,
		isSelectable,
	} = editor;

	editor.isInline = (element) =>
		["link", "button", "badge"].includes(element.type) || isInline(element);

	editor.isElementReadOnly = (element) =>
		element.type === "badge" || isElementReadOnly(element);

	editor.isSelectable = (element) =>
		element.type !== "badge" && isSelectable(element);

	// 텍스트 삽입 시 기본 폰트 크기 적용
	editor.insertText = (text) => {
		if (editor.selection) {
			const currentMarks: Record<string, unknown> = Editor.marks(editor) || {}; // 현재 마크 확인
			const currentFontSize = (currentMarks.fontSize as number | undefined) || 16; // 현재 폰트 크기 유지
			Editor.addMark(editor, "fontSize", currentFontSize); // 현재 폰트 크기 적용
		}
		insertText(text); // 원래 동작 호출
	};

	return editor;
};
