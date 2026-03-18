"use client";

import type { RefObject } from "react";

interface TextDraftState {
	mode: "insert" | "edit";
	id?: number;
	text: string;
	xPct: number;
	yPct: number;
	widthPct?: number;
	heightPct?: number;
	widthPx: number;
	fontSize: number;
	textColor: string;
	textAlign: "left" | "center" | "right";
	backgroundColor?: string;
}

interface StickerBoardTextDraftOverlayProps {
	textDraft: TextDraftState;
	textDraftRef: RefObject<HTMLDivElement | null>;
	onChange: (text: string) => void;
	onCommit: () => void;
	onCancel: () => void;
}

export function StickerBoardTextDraftOverlay({
	textDraft,
	textDraftRef,
	onChange,
	onCommit,
	onCancel,
}: StickerBoardTextDraftOverlayProps) {
	return (
		<div
			ref={textDraftRef}
			contentEditable
			suppressContentEditableWarning
			onInput={(e) => {
				onChange((e.target as HTMLDivElement).innerText);
			}}
			onKeyDown={(e) => {
				if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
					e.preventDefault();
					onCommit();
				}
				if (e.key === "Escape") {
					e.preventDefault();
					onCancel();
				}
			}}
			onBlur={onCommit}
			className={[
				"absolute z-40 outline-none whitespace-pre-wrap break-words",
				textDraft.mode === "edit"
					? "ring-2 ring-blue-500 ring-offset-0 rounded-md"
					: "",
			].join(" ")}
			style={
				textDraft.mode === "edit" && textDraft.widthPct !== undefined
					? {
						left: `${textDraft.xPct}%`,
						top: `${textDraft.yPct}%`,
						width: `${textDraft.widthPct}%`,
						minHeight: textDraft.heightPct
							? `${textDraft.heightPct}%`
							: undefined,
						color: textDraft.textColor,
						fontSize: `${textDraft.fontSize}px`,
						textAlign: textDraft.textAlign,
						backgroundColor: textDraft.backgroundColor ?? "transparent",
						padding: "4px",
						caretColor: textDraft.textColor,
					}
					: {
						left: `${textDraft.xPct}%`,
						top: `${textDraft.yPct}%`,
						minWidth: "2px",
						maxWidth: `${textDraft.widthPx}px`,
						color: textDraft.textColor,
						fontSize: `${textDraft.fontSize}px`,
						textAlign: textDraft.textAlign,
						backgroundColor: "transparent",
						caretColor: "#3b82f6",
					}
			}
		>
			{textDraft.mode === "edit" ? textDraft.text : ""}
		</div>
	);
}
