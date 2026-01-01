"use client";

import { useCallback, useEffect, useState } from "react";
import { Rnd, DraggableData, ResizableDelta, Position } from "react-rnd";
import { cn } from "@/lib/utils";
import { GridPosition, PixelPosition, useGridSnap } from "./useGridSnap";
import { LayoutItem, useCollisionDetection } from "./useCollisionDetection";

interface DraggableWidgetProps {
	id: string;
	gridPosition: GridPosition;
	color: string;
	label: string;
	layout: LayoutItem[];
	containerRef: React.RefObject<HTMLDivElement>;
	onPositionChange: (id: string, position: GridPosition) => void;
	onRemove: (id: string) => void;
}

export const DraggableWidget = ({
	id,
	gridPosition,
	color,
	label,
	layout,
	containerRef,
	onPositionChange,
	onRemove,
}: DraggableWidgetProps) => {
	const { cellSize, pixelToGrid, gridToPixel } = useGridSnap(containerRef);
	const { getValidPosition } = useCollisionDetection();

	const [pixelPosition, setPixelPosition] = useState<PixelPosition>({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	});

	// Update pixel position when grid position or cell size changes
	useEffect(() => {
		if (cellSize.width > 0 && cellSize.height > 0) {
			const newPixelPos = gridToPixel(gridPosition);
			setPixelPosition(newPixelPos);
		}
	}, [gridPosition, cellSize, gridToPixel]);

	const handleDragStop = useCallback(
		(e: any, data: DraggableData) => {
			const newPixelPos: PixelPosition = {
				x: data.x,
				y: data.y,
				width: pixelPosition.width,
				height: pixelPosition.height,
			};

			const newGridPos = pixelToGrid(newPixelPos);
			const validPos = getValidPosition(newGridPos, layout, id);

			if (validPos) {
				onPositionChange(id, validPos);
			} else {
				// Revert to original position if invalid
				setPixelPosition(gridToPixel(gridPosition));
			}
		},
		[
			id,
			layout,
			gridPosition,
			pixelPosition.width,
			pixelPosition.height,
			pixelToGrid,
			gridToPixel,
			getValidPosition,
			onPositionChange,
		]
	);

	const handleResizeStop = useCallback(
		(
			e: MouseEvent | TouchEvent,
			dir: any,
			ref: HTMLElement,
			delta: ResizableDelta,
			position: Position
		) => {
			const newPixelPos: PixelPosition = {
				x: position.x,
				y: position.y,
				width: ref.offsetWidth,
				height: ref.offsetHeight,
			};

			const newGridPos = pixelToGrid(newPixelPos);
			const validPos = getValidPosition(newGridPos, layout, id);

			if (validPos) {
				onPositionChange(id, validPos);
			} else {
				// Revert to original size/position if invalid
				setPixelPosition(gridToPixel(gridPosition));
			}
		},
		[
			id,
			layout,
			gridPosition,
			pixelToGrid,
			gridToPixel,
			getValidPosition,
			onPositionChange,
		]
	);

	// Don't render until cell size is calculated
	if (cellSize.width === 0 || cellSize.height === 0) {
		return null;
	}

	const gap = 10;
	const cellWithGap = cellSize.width + gap;
	const cellHeightWithGap = cellSize.height + gap;

	return (
		<Rnd
			size={{
				width: pixelPosition.width,
				height: pixelPosition.height,
			}}
			position={{
				x: pixelPosition.x,
				y: pixelPosition.y,
			}}
			bounds="parent"
			dragGrid={[cellWithGap, cellHeightWithGap]}
			resizeGrid={[cellWithGap, cellHeightWithGap]}
			minWidth={cellSize.width}
			minHeight={cellSize.height}
			enableResizing={{
				top: true,
				right: true,
				bottom: true,
				left: true,
				topRight: true,
				bottomRight: true,
				bottomLeft: true,
				topLeft: true,
			}}
			onDragStop={handleDragStop}
			onResizeStop={handleResizeStop}
			className={cn(
				"!absolute z-10 cursor-grab active:cursor-grabbing",
				"rounded-card shadow-sm",
				"flex items-center justify-center",
				"font-medium text-gray-700",
				"select-none",
				"transition-shadow hover:shadow-md",
				"overflow-hidden p-1"
			)}
			style={{
				backgroundColor: color,
			}}
		>
			<span className="text-xs text-center w-full overflow-hidden text-ellipsis line-clamp-2 break-keep leading-tight">
				{label}
			</span>
		</Rnd>
	);
};

