"use client";

import { useEffect, useRef, useState } from "react";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import type { StickerBoardComponent } from "@/features/stickerboard-editor/model";

export interface StickerTextDraft {
	mode: "insert" | "edit";
	id?: number;
	text: string;
	xPct: number;
	yPct: number;
	widthPct?: number; // 편집 모드에서 사용
	heightPct?: number; // 편집 모드에서 사용
	widthPx: number; // 삽입 모드에서 사용
	fontSize: number;
	textColor: string;
	textAlign: "left" | "center" | "right";
	backgroundColor?: string;
}

const DEFAULT_TEXT_COLOR = "#1f2937";

/**
 * 캔버스 위 텍스트 스티커의 삽입/인라인 편집 드래프트 상태.
 * contentEditable 오버레이의 열기·포커스·커밋·취소를 담당한다.
 */
export function useStickerTextDraft() {
	const {
		refs: { canvasRef, presentRef },
		actions: {
			cloneDraft,
			addTextStickerAt,
			updateComponent,
			requestAutoSize,
			setIsTextInsertMode,
		},
	} = useStickerBoardEditorContext();

	const [textDraft, setTextDraft] = useState<StickerTextDraft | null>(null);
	const textDraftRef = useRef<HTMLDivElement | null>(null);

	// 드래프트가 열리면 포커스 + 커서를 텍스트 끝으로 이동
	useEffect(() => {
		const el = textDraftRef.current;
		if (!el) return;
		el.focus();
		const range = document.createRange();
		const selection = window.getSelection();
		if (el.childNodes.length > 0) {
			const lastNode = el.childNodes[el.childNodes.length - 1];
			range.setStartAfter(lastNode);
		} else {
			range.setStart(el, 0);
		}
		range.collapse(true);
		selection?.removeAllRanges();
		selection?.addRange(range);
	}, [textDraft]);

	const getCanvasRect = () => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const rect = canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;
		return rect;
	};

	const openTextDraftAt = (xPct: number, yPct: number, text = "") => {
		const rect = getCanvasRect();
		const widthPx = rect ? Math.min(240, rect.width * 0.5) : 240;
		const maxXPct =
			rect && rect.width > 0
				? Math.max(0, 100 - (widthPx / rect.width) * 100)
				: 100;
		const xClamped = Math.min(Math.max(0, xPct), maxXPct);
		setTextDraft({
			mode: "insert",
			text,
			xPct: xClamped,
			yPct: Math.max(0, Math.min(100, yPct)),
			widthPx,
			fontSize: 14,
			textColor: DEFAULT_TEXT_COLOR,
			textAlign: "left",
		});
	};

	const openTextDraftForEdit = (component: StickerBoardComponent) => {
		if (component.type !== "text") return;
		const rect = getCanvasRect();
		const widthPx = rect ? (component.widthPct / 100) * rect.width : 240;
		setTextDraft({
			mode: "edit",
			id: component.id,
			text: component.text ?? "",
			xPct: component.xPct,
			yPct: component.yPct,
			widthPct: component.widthPct,
			heightPct: component.heightPct,
			widthPx,
			fontSize: component.style?.fontSize ?? 14,
			textColor: component.style?.textColor ?? DEFAULT_TEXT_COLOR,
			textAlign: component.style?.textAlign ?? "left",
			backgroundColor: component.style?.backgroundColor,
		});
	};

	const cancelTextDraft = () => {
		setTextDraft(null);
	};

	const commitTextDraft = () => {
		if (!textDraft) return;
		const text = textDraft.text.replace(/\s+$/u, "");
		if (!text.trim()) {
			cancelTextDraft();
			return;
		}
		if (textDraft.mode === "insert") {
			const base = cloneDraft(presentRef.current);
			addTextStickerAt({
				text,
				xPct: textDraft.xPct,
				yPct: textDraft.yPct,
				historyBase: base,
			});
		} else if (textDraft.mode === "edit" && textDraft.id) {
			updateComponent(textDraft.id, (prev) => {
				if (prev.type !== "text") return prev;
				const next = {
					...prev,
					text,
					style: {
						...(prev.style ?? {}),
						textAlign: textDraft.textAlign,
						textColor: textDraft.textColor,
						fontSize: textDraft.fontSize,
					},
				};
				if (next.autoSize !== false) requestAutoSize(next);
				return next;
			});
		}
		setIsTextInsertMode(false);
		cancelTextDraft();
	};

	const changeTextDraftText = (text: string) => {
		setTextDraft((prev) => (prev ? { ...prev, text } : prev));
	};

	return {
		textDraft,
		textDraftRef,
		openTextDraftAt,
		openTextDraftForEdit,
		cancelTextDraft,
		commitTextDraft,
		changeTextDraftText,
	};
}
