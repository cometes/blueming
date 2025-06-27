import React, { useCallback } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element as SlateElement } from "slate";
import { SquareCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomEditor, CustomElement } from "../../types/slate";

interface CodeButtonProps {
	// 추후 필요시 props 추가
}

const CodeButton: React.FC<CodeButtonProps> = () => {
	const editor = useSlate();

	// 현재 블록이 "code"인지 확인
	const isBlockActive = useCallback(
		(editor: CustomEditor, format: string): boolean => {
			// Array.from을 사용하여 Generator를 배열로 변환
			const matches = Array.from(
				Editor.nodes(editor, {
					match: (n): n is CustomElement =>
						SlateElement.isElement(n) && (n as CustomElement).type === format,
				})
			);
			return matches.length > 0;
		},
		[]
	);

	// 코드 블록 상태 토글
	const toggleBlock = useCallback(
		(editor: CustomEditor, format: string): void => {
			const isActive = isBlockActive(editor, format);
			const newProperties = {
				type: isActive ? "paragraph" : format, // 이미 "code"면 "paragraph"로 복구
			} as Partial<CustomElement>;
			Transforms.setNodes(editor, newProperties);
		},
		[isBlockActive]
	);

	const isActive = isBlockActive(editor, "code"); // 코드 블록 상태 확인

	const handleClick = useCallback(
		(event: React.MouseEvent): void => {
			event.preventDefault();
			event.stopPropagation();
			ReactEditor.focus(editor);
			toggleBlock(editor, "code");
		},
		[editor, toggleBlock]
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
			<SquareCode
				size={16}
				className={cn(
					"text-muted-foreground",
					isActive && "text-foreground"
				)}
			/>
		</Button>
	);
};

export default CodeButton;
