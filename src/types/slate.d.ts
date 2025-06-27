import { BaseEditor, BaseElement, BaseText } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

export type BlockType = 
  | "paragraph"
  | "heading-one"
  | "heading-two"
  | "bulleted-list"
  | "list-item"
  | "quote"
  | "code"
  | "image"
  | "video"
  | "button";

export type AlignType = "left" | "center" | "right" | "justify";

export type MarkType = "bold" | "italic" | "underline" | "code";

// Custom Element 타입 정의
export interface CustomElement extends BaseElement {
  type: BlockType;
  align?: AlignType;
  url?: string; // 이미지, 비디오용
  width?: number;
  height?: number;
  children: CustomText[];
}

// Custom Text 타입 정의
export interface CustomText extends BaseText {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
}

// Custom Editor 타입 정의
export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

// Slate 모듈 확장
declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}