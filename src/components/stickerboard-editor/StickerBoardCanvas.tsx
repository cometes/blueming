"use client";

import { useEffect } from "react";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { useStickerMoveableInteractions } from "@/features/stickerboard-editor/hooks/useStickerMoveableInteractions";
import { useStickerTextDraft } from "@/features/stickerboard-editor/hooks/useStickerTextDraft";
import { StickerBoardCanvasToolbar } from "@/components/stickerboard-editor/StickerBoardCanvasToolbar";
import { StickerBoardCanvasStage } from "@/components/stickerboard-editor/StickerBoardCanvasStage";

export function StickerBoardCanvas({
	ratio,
}: {
	ratio: { w: number; h: number } | null;
}) {
	const {
		state: { isTextInsertMode, isImageDialogOpen, selectedIds },
		refs: { boundsRef, canvasRef, setCanvasRef, presentRef },
		actions: {
			setSelection,
			addImageStickerAt,
			cloneDraft,
			setIsTextInsertMode,
			setIsImageDialogOpen,
		},
		computed: { visibleDraft },
	} = useStickerBoardEditorContext();

	const moveable = useStickerMoveableInteractions();
	const {
		textDraft,
		textDraftRef,
		openTextDraftAt,
		openTextDraftForEdit,
		cancelTextDraft,
		commitTextDraft,
		changeTextDraftText,
	} = useStickerTextDraft();

	// 텍스트 삽입 모드는 Escape로 종료
	useEffect(() => {
		if (!isTextInsertMode) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsTextInsertMode(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isTextInsertMode, setIsTextInsertMode]);

	return (
		<div className="rounded-card border-card bg-card blur-proxy p-4">
			<StickerBoardCanvasToolbar
				isImageDialogOpen={isImageDialogOpen}
				isTextInsertMode={isTextInsertMode}
				onToggleImageDialog={() => setIsImageDialogOpen((prev) => !prev)}
				onToggleTextInsertMode={() => setIsTextInsertMode((prev) => !prev)}
			/>
			<StickerBoardCanvasStage
				ratio={ratio}
				boundsRef={boundsRef}
				setCanvasRef={setCanvasRef}
				visibleDraft={visibleDraft}
				textDraft={textDraft}
				textDraftRef={textDraftRef}
				moveableRef={moveable.moveableRef}
				moveableTargets={moveable.moveableTargets}
				isSelectionLocked={moveable.isSelectionLocked}
				keepRatio={moveable.keepRatio}
				selectedIds={selectedIds}
				setSelection={setSelection}
				startMoveableInteraction={moveable.startMoveableInteraction}
				endMoveableInteraction={moveable.endMoveableInteraction}
				previewDrag={moveable.previewDrag}
				commitDrag={moveable.commitDrag}
				previewResize={moveable.previewResize}
				commitResize={moveable.commitResize}
				applyRotate={moveable.applyRotate}
				commitRotate={moveable.commitRotate}
				onPointerInsertText={(e) => {
					if (!isTextInsertMode) return;
					if (
						(e.target as HTMLElement)?.closest?.('[data-sticker-root="true"]')
					) {
						return;
					}
					const rect = canvasRef.current?.getBoundingClientRect();
					if (!rect || rect.width <= 0 || rect.height <= 0) return;
					const xPct = ((e.clientX - rect.left) / rect.width) * 100;
					const yPct = ((e.clientY - rect.top) / rect.height) * 100;
					e.preventDefault();
					e.stopPropagation();
					setIsTextInsertMode(false);
					setSelection(new Set(), null);
					openTextDraftAt(xPct, yPct);
				}}
				onDropAsset={(e) => {
					e.preventDefault();
					e.stopPropagation();
					const raw = e.dataTransfer.getData("application/x-sticker-asset");
					if (!raw) return;
					let payload = null;
					try {
						payload = JSON.parse(raw);
					} catch {
						payload = null;
					}
					if (!payload?.url) return;

					const canvas = canvasRef.current;
					if (!canvas) return;
					const rect = canvas.getBoundingClientRect();
					const centerXPct = ((e.clientX - rect.left) / rect.width) * 100;
					const centerYPct = ((e.clientY - rect.top) / rect.height) * 100;
					const base = cloneDraft(presentRef.current);

					void addImageStickerAt({
						url: payload.url,
						centerXPct,
						centerYPct,
						assetId: payload.assetId,
						assetName: payload.name,
						assetWidth: payload.width,
						assetHeight: payload.height,
						historyBase: base,
					});
				}}
				onChangeTextDraft={changeTextDraftText}
				onCommitTextDraft={commitTextDraft}
				onCancelTextDraft={cancelTextDraft}
				onDoubleClickComponent={openTextDraftForEdit}
				isEditingComponent={(componentId) =>
					textDraft?.mode === "edit" && textDraft?.id === componentId
				}
			/>
		</div>
	);
}
