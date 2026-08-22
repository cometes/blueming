"use client";

import { useEffect } from "react";
import { useEditor, type Content } from "@tiptap/react";
import { extensions } from "@/components/editor/TiptapEditor";

/**
 * 라이브러리 글쓰기 에디터 설정.
 * 일반 텍스트 붙여넣기를 줄 단위 <p>로 변환하는 핸들러 포함.
 */
export function useLibraryEditor(initialContent: Content) {
	const editor = useEditor({
		extensions: extensions,
		content: initialContent,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "prose max-w-none focus:outline-none min-h-[400px] p-0",
			},
			handlePaste: (_view, event) => {
				const html = event.clipboardData?.getData("text/html");
				if (html) return false; // HTML이 있으면 Tiptap 기본 처리

				const text = event.clipboardData?.getData("text/plain");
				if (!text) return false;

				const escapeHtml = (str: string) =>
					str
						.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/>/g, "&gt;");

				const paragraphs = text
					.split(/\r?\n/)
					.map((line) => `<p>${line ? escapeHtml(line) : "<br>"}</p>`)
					.join("");

				editor?.commands.insertContent(paragraphs);
				return true;
			},
		},
	});

	useEffect(() => {
		if (!editor) return;
		if (!initialContent) return;
		editor.commands.setContent(initialContent);
	}, [editor, initialContent]);

	return editor;
}
