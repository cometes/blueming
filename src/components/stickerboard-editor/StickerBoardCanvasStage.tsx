"use client";

import type { RefObject } from "react";
import type Moveable from "react-moveable";
import { StickerRenderer } from "@/components/stickerboard-editor/StickerRenderer";
import { StickerBoardCanvasInteraction } from "@/components/stickerboard-editor/StickerBoardCanvasInteraction";
import { StickerBoardTextDraftOverlay } from "@/components/stickerboard-editor/StickerBoardTextDraftOverlay";
import {
	STICKER_ASSET_DND_MIME,
	type StickerBoardComponent,
} from "@/features/stickerboard-editor/model";
import type { StickerTextDraft } from "@/features/stickerboard-editor/hooks/useStickerTextDraft";

interface StickerBoardCanvasStageProps {
	ratio: { w: number; h: number } | null;
	boundsRef: RefObject<HTMLDivElement | null>;
	setCanvasRef: (element: HTMLDivElement | null) => void;
	visibleDraft: StickerBoardComponent[];
	textDraft: StickerTextDraft | null;
	textDraftRef: RefObject<HTMLDivElement | null>;
	moveableRef: RefObject<Moveable | null>;
	moveableTargets: HTMLElement[];
	isSelectionLocked: boolean;
	keepRatio: boolean;
	selectedIds: Set<number>;
	setSelection: (ids: Set<number>, id?: number | null) => void;
	startMoveableInteraction: (ids: number[]) => void;
	endMoveableInteraction: () => void;
	previewDrag: (id: number, target: HTMLElement, delta: [number, number]) => void;
	commitDrag: (ids: number[]) => void;
	previewResize: (
		id: number,
		target: HTMLElement,
		sizePx: { width: number; height: number },
		delta: [number, number],
	) => void;
	commitResize: (ids: number[]) => void;
	applyRotate: (
		id: number,
		target: HTMLElement,
		deltaDeg: number,
		delta: [number, number],
	) => void;
	commitRotate: (ids: number[]) => void;
	onPointerInsertText: (e: React.PointerEvent<HTMLDivElement>) => void;
	onDropAsset: (e: React.DragEvent<HTMLDivElement>) => void;
	onChangeTextDraft: (text: string) => void;
	onCommitTextDraft: () => void;
	onCancelTextDraft: () => void;
	onDoubleClickComponent: (component: StickerBoardComponent) => void;
	isEditingComponent: (componentId: number) => boolean;
}

export function StickerBoardCanvasStage({
	ratio,
	boundsRef,
	setCanvasRef,
	visibleDraft,
	textDraft,
	textDraftRef,
	moveableRef,
	moveableTargets,
	isSelectionLocked,
	keepRatio,
	selectedIds,
	setSelection,
	startMoveableInteraction,
	endMoveableInteraction,
	previewDrag,
	commitDrag,
	previewResize,
	commitResize,
	applyRotate,
	commitRotate,
	onPointerInsertText,
	onDropAsset,
	onChangeTextDraft,
	onCommitTextDraft,
	onCancelTextDraft,
	onDoubleClickComponent,
	isEditingComponent,
}: StickerBoardCanvasStageProps) {
	// 메인 페이지(데스크톱)는 12×12 그리드에 전체 5:4 비율이므로,
	// w×h 블록 위젯의 실제 화면 비율은 (w/h) × (5/4)가 된다.
	// 스티커 좌표가 모두 %(퍼센트) 기반이라 캔버스를 이 비율로만 유지하면
	// 어떤 크기로 스케일돼도 메인 페이지 위젯과 동일하게 보인다.
	const canvasAspect = ratio ? (ratio.w * 5) / (ratio.h * 4) : 1;

	return (
		<div
			ref={boundsRef}
			className="mt-4 w-full overflow-hidden rounded-card border border-card bg-card-bg p-2"
		>
			{ratio ? (
				<div className="flex w-full items-center justify-center">
					<div
						className="relative bg-widget-bg rounded-widget border-widget overflow-visible shadow-[0_10px_25px_rgba(0,0,0,0.08)] stickerboard-canvas"
						style={{
							aspectRatio: `${ratio.w * 5} / ${ratio.h * 4}`,
							// 가로는 컨테이너에 맞추되, 세로가 화면(70vh)을 넘으면 비율 유지한 채 축소
							width: `min(100%, calc(70vh * ${canvasAspect}))`,
						}}
						ref={setCanvasRef}
						onPointerDown={onPointerInsertText}
						onDragOver={(e) => {
							e.preventDefault();
							e.dataTransfer.dropEffect = "copy";
						}}
						onDrop={onDropAsset}
						data-drop-mime={STICKER_ASSET_DND_MIME}
					>
						<StickerBoardCanvasInteraction
							moveableRef={moveableRef}
							moveableTargets={moveableTargets}
							isSelectionLocked={isSelectionLocked}
							keepRatio={keepRatio}
							selectedIds={selectedIds}
							setSelection={setSelection}
							startMoveableInteraction={startMoveableInteraction}
							endMoveableInteraction={endMoveableInteraction}
							previewDrag={previewDrag}
							commitDrag={commitDrag}
							previewResize={previewResize}
							commitResize={commitResize}
							applyRotate={applyRotate}
							commitRotate={commitRotate}
						/>
						{textDraft ? (
							<StickerBoardTextDraftOverlay
								textDraft={textDraft}
								textDraftRef={textDraftRef}
								onChange={onChangeTextDraft}
								onCommit={onCommitTextDraft}
								onCancel={onCancelTextDraft}
							/>
						) : null}
						{visibleDraft.length > 0 ? (
							visibleDraft.map((component) => (
								<StickerRenderer
									key={component.id}
									component={component}
									onDoubleClick={() => onDoubleClickComponent(component)}
									isEditing={isEditingComponent(component.id)}
								/>
							))
						) : (
							<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
								저장된 스티커가 없습니다.
							</div>
						)}
					</div>
				</div>
			) : (
				<div className="flex min-h-[300px] items-center justify-center">
					<div className="text-center py-10">
						<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-theme-primary border-r-transparent" />
						<div className="mt-4 text-xs text-gray-500">
							캔버스를 불러오는 중...
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
