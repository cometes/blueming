import React, { useCallback } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element as SlateElement } from "slate";
import { Heading1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockButtonProps } from "./types";
import { CustomEditor, BlockType } from "../../../types/slate";

// H1 블록 상태 확인 함수
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

// H1 블록 토글 함수
const toggleBlock = (editor: CustomEditor, format: BlockType): void => {
	const isActive = isBlockActive(editor, format);
	const newType = isActive ? "paragraph" : format; // H1 활성화 또는 Paragraph로 해제

	Transforms.setNodes(editor, { type: newType });
};

// H1 버튼 컴포넌트
const H1Button: React.FC<BlockButtonProps> = () => {
	const editor = useSlate();
	const isActive = isBlockActive(editor, "heading-one");

	const handleClick = useCallback(
		(event: React.MouseEvent): void => {
			event.preventDefault();
			event.stopPropagation();
			ReactEditor.focus(editor);
			toggleBlock(editor, "heading-one");
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
			<Heading1
				size={16}
				className={cn(
					"text-muted-foreground",
					isActive && "text-foreground"
				)}
			/>
		</Button>
	);
};

export default H1Button;
