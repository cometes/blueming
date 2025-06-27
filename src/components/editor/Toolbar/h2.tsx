import React, { useCallback } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element as SlateElement } from "slate";
import { Heading2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockButtonProps } from "./types";
import { CustomEditor, BlockType } from "../../../types/slate";

// H2 블록 상태 확인 함수
const isBlockActive = (editor: CustomEditor, format: BlockType): boolean => {
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
const toggleBlock = (editor: CustomEditor, format: BlockType): void => {
	const isActive = isBlockActive(editor, format);
	const newType: BlockType = isActive ? "paragraph" : format; // H2 활성화 또는 Paragraph로 해제

	Transforms.setNodes(editor, { type: newType });
};

// H2 버튼 컴포넌트
const H2Button: React.FC<BlockButtonProps> = () => {
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
