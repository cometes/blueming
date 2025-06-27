import React from "react";
import { Transforms, Text, Element } from "slate";
import { useSlate, ReactEditor } from "slate-react";
import { BrushCleaning } from "lucide-react";
import { Button } from "@/components/ui/button";

const clearFormatting = (editor) => {
	if (editor.selection) {
		Transforms.unsetNodes(
			editor,
			["italic", "bold", "underline", "color", "backgroundColor", "fontSize"],
			{
				match: (n) => Text.isText(n), // 텍스트 노드에만 적용
				split: true, // 선택된 부분만 적용
			}
		);

		Transforms.unwrapNodes(editor, {
			match: (n) => Element.isElement(n) && n.type === "button",
			split: true,
			mode: "lowest", // 가장 낮은 레벨의 노드까지 처리
		});
	}
};

const BroomButton = () => {
	const editor = useSlate();

	return (
		<Button
			variant="ghost"
			size="sm"
			className="w-8 h-8 p-0 hover:bg-muted"
			onMouseDown={(event) => {
				event.preventDefault();
				clearFormatting(editor);
				ReactEditor.focus(editor); // 에디터 포커스 유지
			}}
		>
			<BrushCleaning
				size={16}
				className="text-muted-foreground"
			/>
		</Button>
	);
};

export default BroomButton;
