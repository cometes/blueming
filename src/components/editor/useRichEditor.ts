"use client";

import { useEffect, useRef, useState } from "react";
import {
	useEditor,
	type AnyExtension,
	type Content,
	type Editor,
} from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { toast } from "sonner";
import { extensions as defaultExtensions } from "@/components/editor/TiptapEditor";
import { handleImageUpload } from "@/shared/lib/tiptap-utils";
import {
	IMAGE_MOVE_MIME,
	isHttpUrl,
	resolveImageAttrs,
} from "@/shared/lib/tiptapImage";

const MAX_DROP_IMAGES = 5;

/** URL 붙여넣기 직후 표시할 선택 메뉴 정보 (노션 스타일 링크/임베드 전환) */
export interface UrlPasteInfo {
	url: string;
	/** 링크 텍스트로 삽입된 문서 범위 (임베드 선택 시 이 범위를 교체) */
	from: number;
	to: number;
}

/** 본문에 실질 콘텐츠가 있는지 — 텍스트 또는 이미지/동영상 임베드 */
export const editorHasContent = (editor: Editor) => {
	if (editor.getText().trim()) return true;
	let hasMedia = false;
	editor.state.doc.descendants((node) => {
		if (node.type.name === "image" || node.type.name === "youtube") {
			hasMedia = true;
			return false;
		}
		return !hasMedia;
	});
	return hasMedia;
};

/** 삽입 시작 위치 계산: 노드 선택(이미지 등)을 대체하지 않도록 항상 selection 끝 기준 */
const resolveInsertPos = (editor: Editor, insertPos?: number | "end") => {
	if (insertPos === "end") return editor.state.doc.content.size;
	if (typeof insertPos === "number") return insertPos;
	return editor.state.selection.to;
};

// 드롭/붙여넣기로 받은 이미지 파일들을 순서대로 업로드해 지정 위치에 삽입
// (insertPos: 숫자 = 해당 위치, "end" = 문서 끝, 생략 = 현재 커서 끝)
// insertContentAt + 위치 추적을 쓰는 이유:
// insertContent는 "선택 영역을 대체"하므로, 직전에 삽입된 이미지가
// 노드 선택 상태일 때 다음 이미지가 그 자리를 덮어써 유실되는 버그가 있었음.
export const uploadAndInsertImages = async (
	editor: Editor,
	files: File[],
	insertPos?: number | "end",
) => {
	const targets = files.slice(0, MAX_DROP_IMAGES);
	if (files.length > MAX_DROP_IMAGES) {
		toast.info(`이미지는 한 번에 ${MAX_DROP_IMAGES}개까지 삽입됩니다.`);
	}
	let pos = resolveInsertPos(editor, insertPos);
	for (const file of targets) {
		try {
			const url = await handleImageUpload(file);
			const attrs = await resolveImageAttrs(
				url,
				file.name.replace(/\.[^/.]+$/, "") || "이미지",
			);
			const clamped = Math.min(pos, editor.state.doc.content.size);
			const sizeBefore = editor.state.doc.content.size;
			editor
				.chain()
				.focus()
				.insertContentAt(clamped, { type: "image", attrs })
				.run();
			// 삽입된 만큼 다음 위치를 뒤로 이동 (여러 장이 순서대로 이어짐)
			pos = clamped + (editor.state.doc.content.size - sizeBefore);
			// 커서를 이미지 뒤로 이동 (TrailingNode가 마지막 문단을 보장)
			editor.commands.focus(Math.min(pos, editor.state.doc.content.size));
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
			toast.error(message);
			break;
		}
	}
};

interface UseRichEditorOptions {
	content?: Content;
	/** 미지정 시 공용 extensions 사용 (Profile처럼 placeholder를 덮어쓸 때 전달) */
	extensions?: AnyExtension[];
	/** editorProps.attributes.class */
	editorClass?: string;
}

/**
 * 사이트 공용 리치 에디터 훅. 모든 편집 가능한 Tiptap 에디터가 공유하는 동작:
 * - 이미지 파일 드롭(드롭 위치 삽입)·클립보드 이미지 붙여넣기 업로드
 * - 에디터 내 이미지 드래그 = 이동 (IMAGE_MOVE_MIME 프로토콜)
 * - URL 단독 붙여넣기 → 링크 삽입 + 전환 메뉴 상태(urlPaste) 노출
 * - 일반 텍스트 붙여넣기 → 줄 단위 <p> 변환
 * - 에디터 밖 클릭 시 노드 선택 해제 (정렬 플로팅/핸들 잔존 방지)
 */
export function useRichEditor({
	content = "",
	extensions = defaultExtensions,
	editorClass = "prose max-w-none focus:outline-none min-h-[400px] p-0",
}: UseRichEditorOptions = {}) {
	const [urlPaste, setUrlPaste] = useState<UrlPasteInfo | null>(null);
	// editorProps 클로저는 에디터 생성 시점에 고정되므로 ref로 최신 상태 전달
	const setUrlPasteRef = useRef(setUrlPaste);
	setUrlPasteRef.current = setUrlPaste;

	const editor = useEditor({
		extensions,
		content,
		immediatelyRender: false,
		// 에디터 밖을 클릭해 포커스가 떠나면 이미지 등 노드 선택을 해제해
		// 정렬 플로팅/리사이즈 핸들이 남아있지 않게 한다.
		onBlur: ({ editor: ed }) => {
			if (ed.state.selection instanceof NodeSelection) {
				ed.commands.setTextSelection(ed.state.selection.to);
			}
		},
		editorProps: {
			attributes: {
				class: editorClass,
			},
			handleDrop: (view, event, _slice, moved) => {
				// 0) 에디터 내 이미지 이동: dragstart에서 기록한 원본 위치를 삭제하고
				//    드롭 지점에 같은 노드를 삽입 (복제 방지, 한 트랜잭션 = 언두 1회)
				const moveData = event.dataTransfer?.getData(IMAGE_MOVE_MIME);
				if (moveData && editor) {
					const from = Number(moveData);
					const node = view.state.doc.nodeAt(from);
					const coords = view.posAtCoords({
						left: event.clientX,
						top: event.clientY,
					});
					if (node && coords) {
						event.preventDefault();
						let target = coords.pos;
						// 원본 삭제만큼 뒤쪽 좌표 보정
						if (target > from) {
							target = Math.max(from, target - node.nodeSize);
						}
						editor
							.chain()
							.focus()
							.deleteRange({ from, to: from + node.nodeSize })
							.insertContentAt(target, node.toJSON())
							.run();
						editor.commands.focus(
							Math.min(target + 1, editor.state.doc.content.size),
						);
						return true;
					}
				}

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

				// 2) URL 단독 붙여넣기 → 링크로 삽입 후 전환 메뉴(링크/임베드) 표시
				if (isHttpUrl(text)) {
					const url = text.trim();
					if (!editor) return false;
					const from = Math.min(
						resolveInsertPos(editor),
						editor.state.doc.content.size,
					);
					const sizeBefore = editor.state.doc.content.size;
					editor
						.chain()
						.focus()
						.insertContentAt(from, {
							type: "text",
							text: url,
							marks: [{ type: "link", attrs: { href: url } }],
						})
						.run();
					const to = from + (editor.state.doc.content.size - sizeBefore);
					setUrlPasteRef.current({ url, from, to });
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

	// 에디터 바깥을 클릭하면 이미지 등 노드 선택을 해제 (tiptap blur 이벤트가
	// 환경에 따라 불안정해서 document 레벨에서 직접 처리)
	useEffect(() => {
		if (!editor) return;
		const onDocMouseDown = (e: MouseEvent) => {
			if (!(editor.state.selection instanceof NodeSelection)) return;
			const target = e.target as Node | null;
			if (target && editor.view.dom.contains(target)) return;
			editor.commands.setTextSelection(editor.state.selection.to);
		};
		document.addEventListener("mousedown", onDocMouseDown);
		return () => document.removeEventListener("mousedown", onDocMouseDown);
	}, [editor]);

	return {
		editor,
		urlPaste,
		closeUrlPaste: () => setUrlPaste(null),
	};
}
