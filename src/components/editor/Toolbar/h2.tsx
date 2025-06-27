import React, { useCallback } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element as SlateElement } from "slate";
import { Heading2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomEditor extends Editor {
	// Slate editor 확장 타입
}

interface H2ButtonProps {
	// 추후 필요시 props 추가
}

// H2 블록 상태 확인 함수
const isBlockActive = (editor: CustomEditor, format: string): boolean => {
	const { selection } = editor;
	if (!selection) return false;

	const [match] = Array.from(
		Editor.nodes(editor, {
			at: Editor.unhangRange(editor, selection),
			match: (n) =>
				!Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
		})
	);

	return !!match;
};

// H2 블록 토글 함수
const toggleBlock = (editor: CustomEditor, format: string): void => {
	const isActive = isBlockActive(editor, format);
	const newType = isActive ? "paragraph" : format; // H2 활성화 또는 Paragraph로 해제

	Transforms.setNodes(editor, { type: newType });
};

// H2 버튼 컴포넌트
const H2Button: React.FC<H2ButtonProps> = () => {
	const editor = useSlate();
	const isActive = isBlockActive(editor, "heading-two");

	const handleClick = useCallback(
		(event: React.MouseEvent): void => {
			event.preventDefault();
			event.stopPropagation();
			ReactEditor.focus(editor);
			toggleBlock(editor, "heading-two");
		},
		[editor]
	);

	return (
		<Button
			variant="ghost"
			size="sm"
			className={cn(
				"w-8 h-8 p-0 hover:bg-muted",
				isActive && "bg-muted"
			)}
			onMouseDown={handleClick}
		>
			<Heading2
				size={16}
				className={cn(
					"text-muted-foreground",
					isActive && "text-foreground"
				)}
			/>
		</Button>
	);
};

export default H2Button;
