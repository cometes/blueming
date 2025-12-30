import React from "react";
import { Node } from "slate";
import { 
  CustomEditor, 
  CustomElement, 
  CustomText, 
  AlignType, 
  BlockType, 
  MarkType 
} from "../../../types/slate";

// 기본 툴바 버튼 Props
export interface BaseToolbarButtonProps {
  className?: string;
  disabled?: boolean;
}

// 마크 버튼 공통 Props
export interface MarkButtonProps extends BaseToolbarButtonProps {}

// 배경색 버튼 Props (색상 선택 관련 특화)
export interface BackgroundColorButtonProps extends MarkButtonProps {
  defaultColor?: string;
  onColorChange?: (color: string) => void;
}

// 텍스트 색상 버튼 Props
export interface TextColorButtonProps extends MarkButtonProps {
  defaultColor?: string;
  onColorChange?: (color: string) => void;
}

// 블록 버튼 공통 Props
export interface BlockButtonProps extends BaseToolbarButtonProps {}

// 정렬 버튼 Props
export interface AlignButtonProps extends BaseToolbarButtonProps {
  currentAlign?: AlignType;
  setCurrentAlign?: (align: AlignType) => void;
}

// 아이콘 컴포넌트 타입
export type IconComponent = React.ComponentType<{
  size?: number;
  className?: string;
}>;

// 정렬 옵션 타입
export interface AlignOption {
  key: AlignType;
  icon: IconComponent;
  label: string;
}

// 마크 유틸리티 함수 타입
export type MarkUtilityFunction = {
  isActive: (editor: CustomEditor) => boolean;
  toggle: (editor: CustomEditor) => void;
};

// 블록 유틸리티 함수 타입
export type BlockUtilityFunction = {
  isActive: (editor: CustomEditor, format: BlockType) => boolean;
  toggle: (editor: CustomEditor, format: BlockType) => void;
};

// 에디터 노드 타입 가드
export const isCustomElement = (node: Node): node is CustomElement => {
  return 'type' in node && typeof (node as any).type === 'string';
};

// 에디터 텍스트 타입 가드
export const isCustomText = (node: Node): node is CustomText => {
  return 'text' in node && typeof (node as any).text === 'string';
};

// 마크 상태 확인 함수 타입
export type MarkStateChecker = (editor: CustomEditor, mark: MarkType) => boolean;

// 블록 상태 확인 함수 타입
export type BlockStateChecker = (editor: CustomEditor, blockType: BlockType) => boolean;

// 툴바 컴포넌트 제네릭 타입
export interface ToolbarComponent<T extends BaseToolbarButtonProps = BaseToolbarButtonProps> {
  (props: T): React.ReactElement;
}