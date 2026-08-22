"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { createStickerAssetFromFile } from "@/features/stickerboard-editor/api/assets";
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

	// 탐색기 등에서 이미지 파일을 캔버스에 드롭하면 에셋으로 업로드 후 그 자리에 추가
	const dropImageFilesAt = async (
		files: File[],
		centerXPct: number,
		centerYPct: number,
	) => {
		const MAX_FILES = 10;
		const targets = files.slice(0, MAX_FILES);
		if (files.length > MAX_FILES) {
			toast.info(`한 번에 ${MAX_FILES}개까지 추가할 수 있어 앞의 ${MAX_FILES}개만 추가합니다.`);
		}
		let offsetPct = 0;
		for (const file of targets) {
			try {
				const asset = await createStickerAssetFromFile(file);
				await addImageStickerAt({
					url: asset.url,
					centerXPct: centerXPct + offsetPct,
					centerYPct: centerYPct + offsetPct,
					assetId: asset.id,
					assetName: asset.name,
					assetWidth: asset.width,
					assetHeight: asset.height,
					historyBase: cloneDraft(presentRef.current),
				});
				offsetPct += 3; // 여러 장이면 살짝 어긋나게 배치
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
				toast.error(message);
				break;
			}
		}
	};

	// 캔버스 밖에 파일을 놓쳤을 때 브라우저가 이미지 페이지로 이동해
	// 편집 내용이 날아가는 것을 방지 (편집 화면에 있는 동안만)
	useEffect(() => {
		const preventFileDrop = (e: DragEvent) => {
			if (e.dataTransfer?.types.includes("Files")) {
				e.preventDefault();
			}
		};
		window.addEventListener("dragover", preventFileDrop);
		window.addEventListener("drop", preventFileDrop);
		return () => {
			window.removeEventListener("dragover", preventFileDrop);
			window.removeEventListener("drop", preventFileDrop);
		};
	}, []);

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
		<div className="flex h-full min-h-0 flex-col rounded-card border-card bg-card blur-proxy p-4">
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

					// 1) OS 파일 드롭 (탐색기에서 이미지 끌어오기)
					const imageFiles = Array.from(e.dataTransfer.files ?? []).filter(
						(file) => file.type.startsWith("image/"),
					);
					if (imageFiles.length > 0) {
						const canvasEl = canvasRef.current;
						if (!canvasEl) return;
						const dropRect = canvasEl.getBoundingClientRect();
						const dropXPct = ((e.clientX - dropRect.left) / dropRect.width) * 100;
						const dropYPct = ((e.clientY - dropRect.top) / dropRect.height) * 100;
						void dropImageFilesAt(imageFiles, dropXPct, dropYPct);
						return;
					}

					// 2) 에셋 패널 내부 드래그
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
