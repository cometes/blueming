"use client";

import { useEffect } from "react";
import { useEditor, type Content, type Editor } from "@tiptap/react";
import { toast } from "sonner";
import { extensions } from "@/components/editor/TiptapEditor";
import { handleImageUpload } from "@/shared/lib/tiptap-utils";
import {
	filenameFromUrl,
	isImageUrl,
	resolveImageAttrs,
} from "@/shared/lib/tiptapImage";

const MAX_DROP_IMAGES = 5;

// 드롭/붙여넣기로 받은 이미지 파일들을 순서대로 업로드해 현재 커서 위치에 삽입
// (insertPos: 숫자 = 해당 위치, "end" = 문서 끝)
export const uploadAndInsertImages = async (
	editor: Editor,
	files: File[],
	insertPos?: number | "end",
) => {
	if (insertPos !== undefined) {
		editor.commands.focus(insertPos);
	}
	const targets = files.slice(0, MAX_DROP_IMAGES);
	if (files.length > MAX_DROP_IMAGES) {
		toast.info(`이미지는 한 번에 ${MAX_DROP_IMAGES}개까지 삽입됩니다.`);
	}
	for (const file of targets) {
		try {
			const url = await handleImageUpload(file);
			const attrs = await resolveImageAttrs(
				url,
				file.name.replace(/\.[^/.]+$/, "") || "이미지",
			);
			editor
				.chain()
				.focus()
				.insertContent({ type: "image", attrs })
				.run();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
			toast.error(message);
			break;
		}
	}
};

/**
 * 라이브러리 글쓰기 에디터 설정.
 * - 일반 텍스트 붙여넣기를 줄 단위 <p>로 변환
 * - 이미지 파일을 에디터 아무 곳에나 드롭하면 그 위치에 업로드·삽입
 * - 이미지 파일/이미지 URL 붙여넣기도 이미지로 삽입
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
			handleDrop: (view, event, _slice, moved) => {
				// moved = 에디터 내부 콘텐츠 이동(드래그) — 기본 동작 유지
				if (moved) return false;
				const files = Array.from(event.dataTransfer?.files ?? []).filter(
					(file) => file.type.startsWith("image/"),
				);
				if (files.length === 0) return false;

				event.preventDefault();
				const coords = view.posAtCoords({
					left: event.clientX,
					top: event.clientY,
				});
				const pos = coords?.pos ?? view.state.selection.to;
				if (editor) {
					void uploadAndInsertImages(editor, files, pos);
				}
				return true;
			},
			handlePaste: (_view, event) => {
				// 1) 클립보드의 이미지 파일 (스크린샷 붙여넣기 등)
				const files = Array.from(event.clipboardData?.files ?? []).filter(
					(file) => file.type.startsWith("image/"),
				);
				if (files.length > 0) {
					if (editor) {
						void uploadAndInsertImages(editor, files);
					}
					return true;
				}

				const html = event.clipboardData?.getData("text/html");
				if (html) return false; // HTML이 있으면 Tiptap 기본 처리

				const text = event.clipboardData?.getData("text/plain");
				if (!text) return false;

				// 2) 이미지 URL 단독 붙여넣기 → 이미지로 변환
				if (isImageUrl(text)) {
					const url = text.trim();
					void (async () => {
						const attrs = await resolveImageAttrs(url, filenameFromUrl(url));
						editor
							?.chain()
							.focus()
							.insertContent({ type: "image", attrs })
							.run();
					})();
					return true;
				}

				// 3) 일반 텍스트: 줄 단위 <p> 변환
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
