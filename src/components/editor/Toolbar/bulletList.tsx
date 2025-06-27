import React from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Transforms, Editor, Element as SlateElement } from "slate";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockButtonProps } from "./types";
import { CustomEditor } from "../../../types/slate";

const BulletListButton: React.FC<BlockButtonProps> = () => {
	const editor = useSlate();

	// 현재 블록이 불릿 리스트인지 확인하는 함수
	const isBulletListActive = (): boolean => {
		// Array.from을 사용하여 Generator를 배열로 변환
		const matches = Array.from(
			Editor.nodes(editor, {
				match: (n) => SlateElement.isElement(n) && n.type === "bulleted-list",
			})
		);
		return matches.length > 0; // 불릿 리스트 활성화 여부 반환
	};

	// 불릿 리스트 토글 함수
	const toggleBulletList = (): void => {
		const isActive = isBulletListActive();

		if (isActive) {
			// 불릿 리스트 해제, 정렬 속성 유지
			Transforms.unwrapNodes(editor, {
				match: (n) => SlateElement.isElement(n) && n.type === "bulleted-list",
				split: true,
			});
			Transforms.setNodes(
				editor,
				{ type: "paragraph" }, // 블록을 문단으로 변경
				{ match: (n) => SlateElement.isElement(n) }
			);
		} else {
			// 블록을 불릿 리스트로 변환
			Transforms.setNodes(editor, { type: "list-item" });
			Transforms.wrapNodes(editor, { type: "bulleted-list", children: [] });
		}
	};

	const isActive = isBulletListActive();

	return (
		<Button
			variant="ghost"
			size="sm"
			className={cn("w-8 h-8 p-0 hover:bg-muted", isActive && "bg-muted")}
			onMouseDown={(event: React.MouseEvent) => {
				event.preventDefault(); // 기본 클릭 동작 방지
				event.stopPropagation();
				ReactEditor.focus(editor);
				toggleBulletList(); // 불릿 리스트 토글
			}}
		>
			<List
				size={16}
				className={cn("text-muted-foreground", isActive && "text-foreground")}
			/>
		</Button>
	);
};

export default BulletListButton;
