"use client";

import { useEffect } from "react";
import type { Content } from "@tiptap/react";
import { useRichEditor } from "@/components/editor/useRichEditor";

export type { UrlPasteInfo } from "@/components/editor/useRichEditor";
export { uploadAndInsertImages } from "@/components/editor/useRichEditor";

/**
 * 라이브러리 글쓰기 에디터. 공용 useRichEditor(이미지 드롭/이동, URL 전환 메뉴,
 * 텍스트 붙여넣기, 노드 선택 해제)에 초기 콘텐츠 동기화만 얹는다.
 */
export function useLibraryEditor(initialContent: Content) {
	const rich = useRichEditor({ content: initialContent });
	const { editor } = rich;

	useEffect(() => {
		if (!editor) return;
		if (!initialContent) return;
		editor.commands.setContent(initialContent);
	}, [editor, initialContent]);

	return rich;
}
