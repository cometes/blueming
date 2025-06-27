import React from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor } from "slate";
import { Bold } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomEditor extends Editor {
	// Slate editor 확장 타입
}

interface BoldButtonProps {
	// 추후 필요시 props 추가
}

// Bold 상태 확인 함수
const isBoldMarkActive = (editor: CustomEditor): boolean => {
	const marks = Editor.marks(editor); // 현재 커서의 스타일 가져오기
	return marks ? marks.bold === true : false; // Bold 상태 반환
};

// Bold 상태 토글 함수
const toggleBoldMark = (editor: CustomEditor): void => {
	const isActive = isBoldMarkActive(editor); // 현재 상태 확인
	if (isActive) {
		Editor.removeMark(editor, "bold"); // Bold 해제
	} else {
		Editor.addMark(editor, "bold", true); // Bold 활성화
	}
};

// Bold 버튼 컴포넌트
const BoldButton: React.FC<BoldButtonProps> = () => {
	const editor = useSlate(); // 현재 에디터 인스턴스 가져오기
	const isActive = isBoldMarkActive(editor); // 현재 Bold 상태 확인

	return (
		<Button
			variant="ghost"
			size="sm"
			className={cn(
				"w-8 h-8 p-0 hover:bg-muted",
				isActive && "bg-muted"
			)}
			onMouseDown={(event: React.MouseEvent) => {
				event.preventDefault(); // 기본 클릭 동작 방지
				event.stopPropagation();
				ReactEditor.focus(editor);
				toggleBoldMark(editor); // Bold 스타일 토글
			}}
		>
			<Bold
				size={16}
				className={cn(
					"text-muted-foreground",
					isActive && "text-foreground"
				)}
			/>
		</Button>
	);
};

export default BoldButton;
