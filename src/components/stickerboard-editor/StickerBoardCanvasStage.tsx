"use client";

import type { RefObject } from "react";
import type Moveable from "react-moveable";
import { StickerRenderer } from "@/components/stickerboard-editor/StickerRenderer";
import { StickerBoardCanvasInteraction } from "@/components/stickerboard-editor/StickerBoardCanvasInteraction";
import { StickerBoardTextDraftOverlay } from "@/components/stickerboard-editor/StickerBoardTextDraftOverlay";
import {
	STICKER_ASSET_DND_MIME,
	type StickerBoardComponent,
} from "@/types/stickerBoard";

const GRID_BASE = 12;

interface TextDraft {
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

interface StickerBoardCanvasStageProps {
	ratio: { w: number; h: number } | null;
	boundsRef: RefObject<HTMLDivElement | null>;
	setCanvasRef: (element: HTMLDivElement | null) => void;
	visibleDraft: StickerBoardComponent[];
	textDraft: TextDraft | null;
	textDraftRef: RefObject<HTMLDivElement | null>;
	moveableRef: RefObject<Moveable | null>;
	moveableTargets: HTMLElement[];
	isSelectionLocked: boolean;
	keepRatio: boolean;
	selectedIds: Set<number>;
	setSelection: (ids: Set<number>, id: number | null) => void;
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
	return (
		<div
			ref={boundsRef}
			className="mt-4 w-full overflow-hidden rounded-card border border-card bg-card-bg p-2"
		>
			<div className="relative grid grid-cols-12 grid-rows-12 aspect-[5/4] w-full overflow-visible">
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						backgroundImage:
							"linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
						backgroundSize: "calc(100% / 12) calc(100% / 12)",
					}}
				/>

				{ratio ? (
					<div
						className="relative bg-widget-bg rounded-widget border-widget overflow-visible shadow-[0_10px_25px_rgba(0,0,0,0.08)] stickerboard-canvas"
						style={{
							gridColumn: (() => {
								const span = Math.max(1, Math.min(GRID_BASE, ratio.w || 1));
								const start = Math.floor((GRID_BASE - span) / 2) + 1;
								return `${start} / span ${span}`;
							})(),
							gridRow: (() => {
								const span = Math.max(1, Math.min(GRID_BASE, ratio.h || 1));
								const start = Math.floor((GRID_BASE - span) / 2) + 1;
								return `${start} / span ${span}`;
							})(),
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
				) : (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="text-center py-10">
							<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-theme-primary border-r-transparent" />
							<div className="mt-4 text-xs text-gray-500">
								캔버스를 불러오는 중...
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
