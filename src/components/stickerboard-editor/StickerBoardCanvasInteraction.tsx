"use client";

import Moveable from "react-moveable";
import Selecto from "react-selecto";

interface StickerBoardCanvasInteractionProps {
	moveableRef: React.RefObject<Moveable | null>;
	moveableTargets: HTMLElement[];
	isSelectionLocked: boolean;
	keepRatio: boolean;
	selectedIds: Set<number>;
	setSelection: (next: Set<number>, primaryId?: number | null) => void;
	startMoveableInteraction: (ids: number[]) => void;
	endMoveableInteraction: () => void;
	previewDrag: (
		id: number,
		target: HTMLElement,
		delta: [number, number],
	) => void;
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
}

const getStickerIds = (targets: HTMLElement[]) =>
	targets
		.map((target) => Number(target.getAttribute("data-sticker-id")))
		.filter((id) => !Number.isNaN(id));

const getStickerId = (target: HTMLElement) =>
	Number(target.getAttribute("data-sticker-id"));

export function StickerBoardCanvasInteraction({
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
}: StickerBoardCanvasInteractionProps) {
	return (
		<>
			<Selecto
				dragContainer=".stickerboard-canvas"
				selectableTargets={[".sticker-item"]}
				selectByClick
				selectFromInside={false}
				toggleContinueSelect="shift"
				hitRate={0}
				onDragStart={(e) => {
					const moveable = moveableRef.current;
					const target = e.inputEvent.target as HTMLElement | null;
					if (!target) return;
					if (
						moveable?.isMoveableElement(target) ||
						target.closest(".moveable-control-box")
					) {
						e.stop();
					}
				}}
				onSelect={(e) => {
					const next = new Set<number>();
					e.selected.forEach((el) => {
						const id = Number(el.getAttribute("data-sticker-id"));
						if (Number.isNaN(id)) return;
						next.add(id);
					});
					const added = e.added[e.added.length - 1];
					const primaryId = added
						? Number(added.getAttribute("data-sticker-id"))
						: next.size
							? Array.from(next)[0]
							: null;
					setSelection(next, Number.isNaN(primaryId) ? null : primaryId);
				}}
			/>
			<Moveable
				ref={moveableRef}
				target={moveableTargets.length === 1 ? moveableTargets[0] : null}
				targets={moveableTargets.length > 1 ? moveableTargets : undefined}
				origin={false}
				draggable={!isSelectionLocked && moveableTargets.length > 0}
				resizable={!isSelectionLocked && moveableTargets.length > 0}
				rotatable={!isSelectionLocked && moveableTargets.length > 0}
				keepRatio={keepRatio}
				throttleDrag={0}
				throttleResize={0}
				throttleRotate={0}
				onDragStart={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (Number.isNaN(id)) return;
					if (selectedIds.size !== 1 || !selectedIds.has(id)) {
						setSelection(new Set([id]), id);
					}
					startMoveableInteraction([id]);
				}}
				onDrag={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (Number.isNaN(id)) return;
					previewDrag(id, e.target as HTMLElement, e.beforeTranslate as [number, number]);
				}}
				onDragEnd={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (!Number.isNaN(id)) commitDrag([id]);
					endMoveableInteraction();
				}}
				onDragGroupStart={(e) => {
					const ids = getStickerIds(e.targets as HTMLElement[]);
					if (ids.length === 0) return;
					startMoveableInteraction(ids);
				}}
				onDragGroup={(e) => {
					e.events.forEach((ev) => {
						const id = getStickerId(ev.target as HTMLElement);
						if (Number.isNaN(id)) return;
						previewDrag(id, ev.target as HTMLElement, ev.beforeTranslate as [number, number]);
					});
				}}
				onDragGroupEnd={(e) => {
					commitDrag(getStickerIds(e.targets as HTMLElement[]));
					endMoveableInteraction();
				}}
				onResizeStart={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (Number.isNaN(id)) return;
					if (selectedIds.size !== 1 || !selectedIds.has(id)) {
						setSelection(new Set([id]), id);
					}
					startMoveableInteraction([id]);
				}}
				onResize={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (Number.isNaN(id)) return;
					previewResize(
						id,
						e.target as HTMLElement,
						{ width: e.width, height: e.height },
						e.drag.beforeTranslate as [number, number],
					);
				}}
				onResizeEnd={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (!Number.isNaN(id)) commitResize([id]);
					endMoveableInteraction();
				}}
				onResizeGroupStart={(e) => {
					const ids = getStickerIds(e.targets as HTMLElement[]);
					if (ids.length === 0) return;
					startMoveableInteraction(ids);
				}}
				onResizeGroup={(e) => {
					e.events.forEach((ev) => {
						const id = getStickerId(ev.target as HTMLElement);
						if (Number.isNaN(id)) return;
						previewResize(
							id,
							ev.target as HTMLElement,
							{ width: ev.width, height: ev.height },
							ev.drag.beforeTranslate as [number, number],
						);
					});
				}}
				onResizeGroupEnd={(e) => {
					commitResize(getStickerIds(e.targets as HTMLElement[]));
					endMoveableInteraction();
				}}
				onRotateStart={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (Number.isNaN(id)) return;
					if (selectedIds.size !== 1 || !selectedIds.has(id)) {
						setSelection(new Set([id]), id);
					}
					startMoveableInteraction([id]);
				}}
				onRotate={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (Number.isNaN(id)) return;
					const dragDelta = (e.drag?.beforeTranslate ?? [0, 0]) as [number, number];
					applyRotate(id, e.target as HTMLElement, e.beforeRotate, dragDelta);
				}}
				onRotateEnd={(e) => {
					const id = getStickerId(e.target as HTMLElement);
					if (!Number.isNaN(id)) commitRotate([id]);
					endMoveableInteraction();
				}}
				onRotateGroupStart={(e) => {
					const ids = getStickerIds(e.targets as HTMLElement[]);
					if (ids.length === 0) return;
					startMoveableInteraction(ids);
				}}
				onRotateGroup={(e) => {
					e.events.forEach((ev) => {
						const id = getStickerId(ev.target as HTMLElement);
						if (Number.isNaN(id)) return;
						const dragDelta = (ev.drag?.beforeTranslate ?? [0, 0]) as [number, number];
						applyRotate(id, ev.target as HTMLElement, ev.beforeRotate, dragDelta);
					});
				}}
				onRotateGroupEnd={(e) => {
					commitRotate(getStickerIds(e.targets as HTMLElement[]));
					endMoveableInteraction();
				}}
			/>
		</>
	);
}
