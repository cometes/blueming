import React from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor } from "slate";
import { Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkButtonProps } from "./types";
import { CustomEditor } from "../../../types/slate";

// Italic 상태 확인 함수
const isItalicMarkActive = (editor: CustomEditor): boolean => {
  const marks = Editor.marks(editor); // 현재 커서의 스타일 가져오기
  return marks ? marks.italic === true : false; // 이탤릭 상태 반환
};

// Italic 상태 토글 함수
const toggleItalicMark = (editor: CustomEditor): void => {
  const isActive = isItalicMarkActive(editor); // 현재 상태 확인
  if (isActive) {
    Editor.removeMark(editor, "italic"); // 이탤릭 해제
  } else {
    Editor.addMark(editor, "italic", true); // 이탤릭 활성화
  }
};

// Italic 버튼 컴포넌트
const ItalicButton: React.FC<MarkButtonProps> = () => {
  const editor = useSlate(); // 현재 에디터 인스턴스 가져오기
  const isActive = isItalicMarkActive(editor); // 현재 이탤릭 상태 확인

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
        toggleItalicMark(editor); // 스타일 토글
      }}
    >
      <Italic
        size={16}
        className={cn(
          "text-muted-foreground",
          isActive && "text-foreground"
        )}
      />
    </Button>
  );
};

export default ItalicButton;
