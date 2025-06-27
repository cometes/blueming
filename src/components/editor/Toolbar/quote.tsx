import React, { useCallback } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element as SlateElement } from "slate";
import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockButtonProps } from "./types";
import { CustomEditor, CustomElement, BlockType } from "../../../types/slate";

const QuoteButton: React.FC<BlockButtonProps> = () => {
  const editor = useSlate();

  // 현재 블록이 "quote"인지 확인하는 함수
  const isBlockActive = useCallback((editor: CustomEditor, format: BlockType): boolean => {
    // Array.from을 사용하여 Generator를 배열로 변환
    const matches = Array.from(Editor.nodes(editor, {
      match: (n): n is CustomElement => SlateElement.isElement(n) && (n as CustomElement).type === format
    }));
    return matches.length > 0;
  }, []);

  // "quote" 블록 상태를 토글하는 함수
  const toggleBlock = useCallback((editor: CustomEditor, format: BlockType): void => {
    const isActive = isBlockActive(editor, format);
    const newType: BlockType = isActive ? "paragraph" : format; // 이미 "quote"면 "paragraph"로 복구
    const newProperties = {
      type: newType
    } as Partial<CustomElement>;
    Transforms.setNodes(editor, newProperties);
  }, [isBlockActive]);

  const isActive = isBlockActive(editor, "quote"); // "quote" 상태 확인

  const handleClick = useCallback((event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    ReactEditor.focus(editor);
    toggleBlock(editor, "quote");
  }, [editor, toggleBlock]);

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
      <Quote
        size={16}
        className={cn(
          "text-muted-foreground",
          isActive && "text-foreground"
        )}
      />
    </Button>
  );
};

export default QuoteButton;
