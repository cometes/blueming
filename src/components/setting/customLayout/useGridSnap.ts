import { useCallback, useRef, useEffect, useState } from "react";

export interface GridPosition {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface PixelPosition {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const useGridSnap = (containerRef: React.RefObject<HTMLElement>) => {
	const [cellSize, setCellSize] = useState({ width: 0, height: 0 });

	// Calculate cell size based on container dimensions
	useEffect(() => {
		const updateCellSize = () => {
			if (!containerRef.current) return;

			const rect = containerRef.current.getBoundingClientRect();
			const gap = 10; // gap-2.5 = 10px

			// Calculate available space after gaps
			const availableWidth = rect.width - gap * 11; // 11 gaps between 12 columns
			const availableHeight = rect.height - gap * 11; // 11 gaps between 12 rows

			setCellSize({
				width: availableWidth / 12,
				height: availableHeight / 12,
			});
		};

		updateCellSize();

		const resizeObserver = new ResizeObserver(updateCellSize);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => resizeObserver.disconnect();
	}, [containerRef]);

	// Convert pixel position to grid coordinates
	const pixelToGrid = useCallback(
		(pixelPos: PixelPosition): GridPosition => {
			const gap = 10;
			const cellWithGap = cellSize.width + gap;
			const cellHeightWithGap = cellSize.height + gap;

			// Calculate grid position accounting for gaps
			const gridX = Math.round(pixelPos.x / cellWithGap);
			const gridY = Math.round(pixelPos.y / cellHeightWithGap);
			const gridW = Math.max(1, Math.round(pixelPos.width / cellWithGap));
			const gridH = Math.max(1, Math.round(pixelPos.height / cellHeightWithGap));

			// Ensure within bounds
			return {
				x: Math.max(0, Math.min(12 - gridW, gridX)),
				y: Math.max(0, Math.min(12 - gridH, gridY)),
				w: Math.min(12, gridW),
				h: Math.min(12, gridH),
			};
		},
		[cellSize]
	);

	// Convert grid coordinates to pixel position
	const gridToPixel = useCallback(
		(gridPos: GridPosition): PixelPosition => {
			const gap = 10;
			const cellWithGap = cellSize.width + gap;
			const cellHeightWithGap = cellSize.height + gap;

			return {
				x: gridPos.x * cellWithGap,
				y: gridPos.y * cellHeightWithGap,
				width: gridPos.w * cellWithGap - gap,
				height: gridPos.h * cellHeightWithGap - gap,
			};
		},
		[cellSize]
	);

	// Snap pixel position to nearest grid cell
	const snapToGrid = useCallback(
		(pixelPos: PixelPosition): PixelPosition => {
			const gridPos = pixelToGrid(pixelPos);
			return gridToPixel(gridPos);
		},
		[pixelToGrid, gridToPixel]
	);

	return {
		cellSize,
		pixelToGrid,
		gridToPixel,
		snapToGrid,
	};
};

