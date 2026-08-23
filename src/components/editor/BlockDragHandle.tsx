"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { findBlockAtY } from "@/components/editor/useRichEditor";
import { BLOCK_MOVE_MIME, setBlockDragSource } from "@/shared/lib/tiptapImage";

interface HandleTarget {
	pos: number;
	top: number;
	left: number;
}

/** 핸들이 블록 왼쪽 바깥으로 벗어나는 거리(px) */
const HANDLE_OFFSET_X = 26;
/** 에디터 좌우로 이만큼 벗어나면 핸들을 숨긴다 */
const HOVER_MARGIN_X = 48;

/**
 * 노션식 블록 드래그 핸들 (⋮⋮).
 * 본문 위에서 마우스가 머무는 최상위 블록의 왼쪽 바깥에 나타나며,
 * 끌면 blockDragSource 프로토콜로 기존 이미지 이동과 동일한 파이프라인
 * (가이드선·본문 밖 드롭 허용·블록 세로 기준 드롭)을 그대로 탄다.
 */
export default function BlockDragHandle({ editor }: { editor: Editor | null }) {
	const [target, setTarget] = React.useState<HandleTarget | null>(null);
	const [isDragging, setIsDragging] = React.useState(false);
	const frameRef = React.useRef<number | null>(null);

	React.useEffect(() => {
		if (!editor || !editor.isEditable) return;

		const update = (e: MouseEvent) => {
			if (frameRef.current != null) return;
			frameRef.current = requestAnimationFrame(() => {
				frameRef.current = null;
				const view = editor.view;
				if (view.isDestroyed) return;
				const editorRect = view.dom.getBoundingClientRect();
				const withinX =
					e.clientX >= editorRect.left - HOVER_MARGIN_X &&
					e.clientX <= editorRect.right + HOVER_MARGIN_X;
				const withinY =
					e.clientY >= editorRect.top && e.clientY <= editorRect.bottom;
				if (!withinX || !withinY) {
					setTarget(null);
					return;
				}
				const block = findBlockAtY(editor, e.clientY);
				if (!block) {
					setTarget(null);
					return;
				}
				setTarget((prev) =>
					prev &&
					prev.pos === block.pos &&
					prev.top === block.rect.top &&
					prev.left === editorRect.left
						? prev
						: {
								pos: block.pos,
								top: block.rect.top,
								left: editorRect.left,
							},
				);
			});
		};

		const hide = () => setTarget(null);

		window.addEventListener("mousemove", update);
		// 스크롤/리사이즈 시 좌표가 낡으므로 일단 숨긴다 (다음 mousemove에서 복원)
		window.addEventListener("scroll", hide, true);
		window.addEventListener("resize", hide);
		return () => {
			window.removeEventListener("mousemove", update);
			window.removeEventListener("scroll", hide, true);
			window.removeEventListener("resize", hide);
			if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
		};
	}, [editor]);

	if (!editor || !editor.isEditable || !target) return null;

	return (
		<button
			type="button"
			aria-label="블록 이동"
			draggable
			// 드래그 중에는 unmount 대신 숨긴다 — 드래그 소스 요소가 DOM에서
			// 제거되면 브라우저에 따라 dragend가 유실되어 추적 상태가 남는다.
			className={`fixed z-[55] flex h-6 w-5 cursor-grab items-center justify-center rounded-[4px] text-sub-text/60 transition-colors hover:bg-theme-primary/10 hover:text-theme-primary active:cursor-grabbing ${
				isDragging ? "pointer-events-none opacity-0" : ""
			}`}
			style={{ top: target.top + 2, left: target.left - HANDLE_OFFSET_X }}
			onDragStart={(e) => {
				setBlockDragSource(editor, target.pos);
				e.dataTransfer.setData(BLOCK_MOVE_MIME, String(target.pos));
				e.dataTransfer.effectAllowed = "move";
				// 끌리는 고스트는 블록 DOM 자체로 표시
				const dom = editor.view.nodeDOM(target.pos) as HTMLElement | null;
				if (dom) e.dataTransfer.setDragImage(dom, 0, 12);
				// 주의: dragstart 안에서 동기적으로 리렌더(스타일 변경)를 일으키면
				// 브라우저가 드래그를 즉시 취소한다 — 다음 틱으로 미룬다.
				setTimeout(() => setIsDragging(true), 0);
			}}
			onDragEnd={() => {
				// clearBlockDragSource는 useRichEditor의 window dragend 핸들러가 수행
				setIsDragging(false);
				setTarget(null);
			}}
		>
			<GripVertical size={15} />
		</button>
	);
}
