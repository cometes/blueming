"use client";

import type { Editor } from "@tiptap/react";

/**
 * 노션 스타일 블록 드롭 가이드선.
 * 본문 전체 폭으로 블록 사이에 그어지며, useRichEditor가 계산한
 * 세로 위치(viewport Y)에 표시된다.
 */
export default function BlockDropIndicator({
	editor,
	y,
}: {
	editor: Editor | null;
	y: number;
}) {
	if (!editor) return null;
	const rect = editor.view.dom.getBoundingClientRect();
	return (
		<div
			className="pointer-events-none fixed z-[60] rounded-full bg-theme-primary"
			style={{
				left: rect.left,
				width: rect.width,
				top: y - 1.5,
				height: 3,
			}}
		/>
	);
}
