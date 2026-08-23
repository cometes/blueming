"use client";

import { useEffect, useRef, useState } from "react";
import {
	useEditor,
	type AnyExtension,
	type Content,
	type Editor,
} from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import { toast } from "sonner";
import { extensions as defaultExtensions } from "@/components/editor/TiptapEditor";
import { handleImageUpload } from "@/shared/lib/tiptap-utils";
import {
	clearBlockDragSource,
	blockDragSource,
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
export const resolveInsertPos = (editor: Editor, insertPos?: number | "end") => {
	if (insertPos === "end") {
		// "문서 끝" = 트레일링 빈 문단이 있으면 그 앞.
		// doc.content.size(빈 문단 뒤)에 넣으면 그 빈 문단이 이미지 위에 남는다.
		const { doc } = editor.state;
		const last = doc.lastChild;
		if (last && last.isTextblock && last.content.size === 0) {
			return doc.content.size - last.nodeSize;
		}
		return doc.content.size;
	}
	if (typeof insertPos === "number") return insertPos;
	return editor.state.selection.to;
};

/**
 * 노션 방식 블록 드롭 위치 계산: 마우스의 "세로 위치"만 사용한다.
 * 각 최상위 블록의 세로 중앙과 비교해 — 위쪽 절반이면 그 블록 앞,
 * 아래쪽 절반이면 다음 블록 앞(=그 블록 뒤)에 놓는다. 가로 위치는 무시.
 * 마지막 트레일링 빈 문단은 "문서 끝 영역"으로 취급해 그 앞에 놓는다.
 */
export const getBlockDrop = (
	editor: Editor,
	clientY: number,
): { pos: number; lineY: number } => {
	const view = editor.view;
	const { doc } = view.state;
	const editorRect = view.dom.getBoundingClientRect();
	let result: { pos: number; lineY: number } | null = null;
	let lastBottom = editorRect.top;
	let endPos = doc.content.size;
	let endLineY = editorRect.top;

	doc.forEach((node, offset) => {
		const isTrailingEmpty =
			node.isTextblock &&
			node.content.size === 0 &&
			offset + node.nodeSize === doc.content.size;
		const dom = view.nodeDOM(offset) as HTMLElement | null;
		const rect = dom?.getBoundingClientRect?.();
		if (!rect) return;
		if (isTrailingEmpty) {
			// 트레일링 빈 문단은 후보에서 제외하고, "맨 아래" 위치를 그 앞으로 정의
			endPos = offset;
			endLineY = lastBottom;
			return;
		}
		if (!result && clientY < rect.top + rect.height / 2) {
			result = { pos: offset, lineY: rect.top };
		}
		lastBottom = rect.bottom;
		endPos = offset + node.nodeSize;
		endLineY = rect.bottom;
	});

	return result ?? { pos: endPos, lineY: endLineY };
};

/**
 * 마우스 세로 위치가 속한 "최상위 블록"을 찾는다 (블록 드래그 핸들 배치용).
 * getBlockDrop과 동일한 기하 순회 — 트레일링 빈 문단은 대상에서 제외한다.
 */
export const findBlockAtY = (
	editor: Editor,
	clientY: number,
): { pos: number; node: PMNode; rect: DOMRect } | null => {
	const view = editor.view;
	const { doc } = view.state;
	let found: { pos: number; node: PMNode; rect: DOMRect } | null = null;

	doc.forEach((node, offset) => {
		if (found) return;
		const isTrailingEmpty =
			node.isTextblock &&
			node.content.size === 0 &&
			offset + node.nodeSize === doc.content.size;
		if (isTrailingEmpty) return;
		const dom = view.nodeDOM(offset) as HTMLElement | null;
		const rect = dom?.getBoundingClientRect?.();
		if (!rect) return;
		if (clientY >= rect.top && clientY <= rect.bottom) {
			found = { pos: offset, node, rect };
		}
	});

	return found;
};

/** 추적 중인 블록(blockDragSource)을 clientY 기준 블록 위치로 이동 (한 트랜잭션) */
export const moveTrackedBlockTo = (editor: Editor, clientY: number) => {
	const from = blockDragSource.from;
	const view = editor.view;
	const node = from >= 0 ? view.state.doc.nodeAt(from) : null;
	// 최상위 블록만 이동 대상 (이미지·문단·제목·리스트 전체 등)
	if (!node || !node.isBlock) return false;
	if (view.state.doc.resolve(from).depth !== 0) return false;
	const { pos: target } = getBlockDrop(editor, clientY);

	// 자기 자신 범위 안으로의 이동은 no-op — 트랜잭션을 만들지 않는다
	if (target >= from && target <= from + node.nodeSize) {
		view.dragging = null;
		clearBlockDragSource();
		return true;
	}

	const tr = view.state.tr;
	tr.delete(from, from + node.nodeSize);
	const mapped = tr.mapping.map(target);
	// replaceRangeWith는 빈 텍스트블록을 자동으로 교체한다 (PM 내장 동작)
	tr.replaceRangeWith(mapped, mapped, node);
	view.dispatch(tr.setMeta("uiEvent", "drop"));
	view.dragging = null;
	clearBlockDragSource();
	editor.commands.focus(Math.min(mapped + 1, editor.state.doc.content.size));
	return true;
};

/**
 * 블록 노드(이미지 등)를 pos에 삽입하되, pos가 "빈 문단" 내부라면
 * 그 문단을 통째로 교체한다 — 빈 에디터/빈 줄에 드롭했을 때
 * 이미지 위에 빈 줄이 남는 문제 방지. 삽입된 시작 위치를 반환.
 */
export const insertBlockAt = (
	editor: Editor,
	content: Record<string, unknown>,
	pos: number,
): number => {
	const { doc } = editor.state;
	const clamped = Math.min(Math.max(0, pos), doc.content.size);
	const $pos = doc.resolve(clamped);
	if (
		$pos.depth > 0 &&
		$pos.parent.isTextblock &&
		$pos.parent.content.size === 0
	) {
		const from = $pos.before();
		const to = $pos.after();
		editor.chain().focus().insertContentAt({ from, to }, content).run();
		return from;
	}
	editor.chain().focus().insertContentAt(clamped, content).run();
	return clamped;
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
			const insertedAt = insertBlockAt(editor, { type: "image", attrs }, pos);
			// 다음 삽입 위치 = 방금 넣은 이미지 노드 바로 뒤.
			// (문서 크기 증가분으로 계산하면 TrailingNode가 덧붙인 문단까지
			//  포함되어 다음 이미지가 빈 줄 뒤에 삽입되는 문제가 있었음)
			pos = insertedAt + (editor.state.doc.nodeAt(insertedAt)?.nodeSize ?? 1);
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
 * - 에디터 내 블록 드래그 = 이동 (blockDragSource 프로토콜, 이미지·블록 핸들 공용)
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
	// 노션 스타일 드롭 가이드선의 viewport Y (드래그 중에만 값 존재)
	const [dropIndicatorY, setDropIndicatorY] = useState<number | null>(null);
	const indicatorYRef = useRef<number | null>(null);
	const setIndicator = (y: number | null) => {
		if (indicatorYRef.current === y) return;
		indicatorYRef.current = y;
		setDropIndicatorY(y);
	};
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
				setIndicator(null);

				// 1) 에디터 내 이미지 이동: 노션 방식(세로 위치 기준 블록 드롭)으로 직접 처리.
				//    PM 기본은 텍스트 커서 위치 기반이라 같은 줄에서도 가로 위치에 따라
				//    위/아래가 갈리는 이질적인 감각을 준다.
				if (blockDragSource.editor === editor && editor) {
					event.preventDefault();
					moveTrackedBlockTo(editor, event.clientY);
					return true;
				}

				// 다른 내부 드래그(텍스트 선택 이동 등)는 PM 기본 동작
				if (moved) return false;
				// Chrome은 <img> 드래그에 Files를 포함시키므로 내부 이동이
				// 파일 업로드 브랜치로 새지 않게 가드
				if (blockDragSource.editor !== null) return false;

				// 2) 이미지 파일 드롭: 동일한 블록 로직으로 삽입 위치 결정
				const files = Array.from(event.dataTransfer?.files ?? []).filter(
					(file) => file.type.startsWith("image/"),
				);
				if (files.length === 0) return false;

				event.preventDefault();
				if (editor) {
					const { pos } = getBlockDrop(editor, event.clientY);
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

	// 노션처럼: 드래그 중 전체 폭 가이드선을 세로 위치 기준으로 표시하고,
	// 본문 밖으로 끌어도 금지 커서 없이 드롭을 허용하며, 놓으면 가이드선 위치로 이동.
	useEffect(() => {
		if (!editor) return;

		const isOwnImageDrag = () => blockDragSource.editor === editor;

		const onWindowDragOver = (e: DragEvent) => {
			if (isOwnImageDrag()) {
				// 내부 이미지 이동: 어디서든 드롭 허용 + 가이드선 갱신
				e.preventDefault();
				if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
				setIndicator(getBlockDrop(editor, e.clientY).lineY);
			}
			// 파일 드래그에는 가이드선을 표시하지 않는다
			// (드롭존 오버레이가 이미 안내 역할을 하므로 이중 표시 방지)
		};

		const onWindowDrop = (e: DragEvent) => {
			setIndicator(null);
			// 드롭 처리(문서 변경)는 드래그를 시작한 소스 에디터만 수행
			if (blockDragSource.editor !== editor) return;
			// 본문(view.dom) 위 드롭은 handleDrop이 이미 처리함
			if (e.defaultPrevented) return;
			e.preventDefault();
			moveTrackedBlockTo(editor, e.clientY);
		};

		const onWindowDragEnd = () => {
			setIndicator(null);
			clearBlockDragSource();
		};
		const onWindowDragLeave = (e: DragEvent) => {
			// 창 밖으로 나가면(relatedTarget 없음) 가이드선 제거
			if (!e.relatedTarget) setIndicator(null);
		};

		// capture 단계: 중간 요소의 stopPropagation 영향 없이 항상 수신.
		// dragenter도 함께 차단해야 요소 경계를 넘을 때 금지 커서가 번쩍이지 않는다.
		window.addEventListener("dragover", onWindowDragOver, true);
		window.addEventListener("dragenter", onWindowDragOver, true);
		window.addEventListener("drop", onWindowDrop);
		window.addEventListener("dragend", onWindowDragEnd);
		window.addEventListener("dragleave", onWindowDragLeave);
		return () => {
			window.removeEventListener("dragover", onWindowDragOver, true);
			window.removeEventListener("dragenter", onWindowDragOver, true);
			window.removeEventListener("drop", onWindowDrop);
			window.removeEventListener("dragend", onWindowDragEnd);
			window.removeEventListener("dragleave", onWindowDragLeave);
		};
	}, [editor]);

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
		dropIndicatorY,
	};
}
