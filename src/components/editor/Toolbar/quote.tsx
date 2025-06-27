import React, { useCallback } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element as SlateElement } from "slate";
import { Quote, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BlockButtonProps } from "./types";
import { CustomEditor, CustomElement, BlockType, QuoteStyle } from "../../../types/slate";

const QuoteButton: React.FC<BlockButtonProps> = () => {
  const editor = useSlate();

  // 현재 블록이 "quote"인지 확인하는 함수
  const isBlockActive = useCallback((editor: CustomEditor, format: BlockType): boolean => {
    const matches = Array.from(Editor.nodes(editor, {
      match: (n): n is CustomElement => SlateElement.isElement(n) && (n as CustomElement).type === format
    }));
    return matches.length > 0;
  }, []);

  // 현재 quote 스타일 가져오기
  const getCurrentQuoteStyle = useCallback((): QuoteStyle => {
    const [match] = Editor.nodes(editor, {
      match: (n): n is CustomElement => SlateElement.isElement(n) && (n as CustomElement).type === "quote"
    });
    
    if (match && match[0]) {
      const element = match[0] as CustomElement;
      return (element.quoteStyle as QuoteStyle) || "classic";
    }
    return "classic";
  }, [editor]);

  // quote 블록 토글 함수
  const toggleQuote = useCallback((style: QuoteStyle): void => {
    const isActive = isBlockActive(editor, "quote");
    const currentStyle = getCurrentQuoteStyle();
    
    if (isActive && currentStyle === style) {
      // 같은 스타일이면 quote 해제
      Transforms.setNodes(editor, { 
        type: "paragraph",
        quoteStyle: undefined 
      } as Partial<CustomElement>);
    } else {
      // 다른 스타일이거나 quote가 아니면 해당 스타일로 설정
      Transforms.setNodes(editor, { 
        type: "quote",
        quoteStyle: style 
      } as Partial<CustomElement>);
    }
  }, [editor, isBlockActive, getCurrentQuoteStyle]);

  const isActive = isBlockActive(editor, "quote");
  const currentStyle = getCurrentQuoteStyle();

  const quoteOptions = [
    { key: "classic", icon: Quote, label: "클래식 인용구" },
    { key: "slashes", icon: Code2, label: "슬래시 인용구" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-8 h-8 p-0 hover:bg-muted",
            isActive && "bg-muted"
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            ReactEditor.focus(editor);
          }}
        >
          <Quote
            size={16}
            className={cn(
              "text-muted-foreground",
              isActive && "text-foreground"
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {quoteOptions.map(({ key, icon: Icon, label }) => (
          <DropdownMenuItem
            key={key}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              isActive && currentStyle === key && "bg-muted"
            )}
            onSelect={(event) => {
              event.preventDefault();
              ReactEditor.focus(editor);
              toggleQuote(key as QuoteStyle);
            }}
          >
            <Icon size={16} className="text-muted-foreground" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuoteButton;
