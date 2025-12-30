import React from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor } from "slate";
import { Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkButtonProps } from "./types";
import { CustomEditor } from "../../../types/slate";

// Underline 상태 확인 함수
const isUnderlineMarkActive = (editor: CustomEditor): boolean => {
  const marks = Editor.marks(editor); // 현재 커서의 스타일 가져오기
  return marks ? marks.underline === true : false; // Underline 상태 반환
};

// Underline 상태 토글 함수
const toggleUnderlineMark = (editor: CustomEditor): void => {
  const isActive = isUnderlineMarkActive(editor); // 현재 상태 확인
  if (isActive) {
    Editor.removeMark(editor, "underline"); // Underline 해제
  } else {
    Editor.addMark(editor, "underline", true); // Underline 활성화
  }
};

// Underline 버튼 컴포넌트
const UnderlineButton: React.FC<MarkButtonProps> = () => {
  const editor = useSlate(); // 현재 에디터 인스턴스 가져오기
  const isActive = isUnderlineMarkActive(editor); // 현재 Underline 상태 확인

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
        toggleUnderlineMark(editor); // Underline 스타일 토글
      }}
    >
      <Underline
        size={16}
        className={cn(
          "text-muted-foreground",
          isActive && "text-foreground"
        )}
      />
    </Button>
  );
};

export default UnderlineButton;
