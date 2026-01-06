import { useCallback } from "react";
import { GridPosition } from "./useGridSnap";

export interface LayoutItem {
	i: string;
	x: number;
	y: number;
	w: number;
	h: number;
	maxW?: number;
	maxH?: number;
}

interface GridConfig {
	columns?: number;
	rows?: number;
}

export const useCollisionDetection = ({
	columns = 12,
	rows = 12,
}: GridConfig = {}) => {
	// Check if two grid positions overlap
	const checkCollision = useCallback(
		(pos1: GridPosition, pos2: GridPosition): boolean => {
			// Check if rectangles overlap
			const noOverlap =
				pos1.x + pos1.w <= pos2.x ||
				pos2.x + pos2.w <= pos1.x ||
				pos1.y + pos1.h <= pos2.y ||
				pos2.y + pos2.h <= pos1.y;

			return !noOverlap;
		},
		[]
	);

	// Check if a position collides with any item in the layout
	const hasCollision = useCallback(
		(position: GridPosition, layout: LayoutItem[], excludeId?: string): boolean => {
			return layout.some((item) => {
				if (excludeId && item.i === excludeId) return false;
				return checkCollision(position, {
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
				});
			});
		},
		[checkCollision]
	);

	// Find all occupied cells in the grid
	const getOccupiedCells = useCallback((layout: LayoutItem[]): Set<string> => {
		const occupied = new Set<string>();

		layout.forEach((widget) => {
			for (let x = widget.x; x < widget.x + widget.w; x++) {
				for (let y = widget.y; y < widget.y + widget.h; y++) {
					occupied.add(`${x},${y}`);
				}
			}
		});

		return occupied;
	}, []);

	// Find an available position for a widget of given size
	const findAvailablePosition = useCallback(
		(
			layout: LayoutItem[],
			width: number = 2,
			height: number = 2
		): GridPosition | null => {
			// Try to find a spot, scanning from top-left to bottom-right
			for (let y = 0; y <= rows - height; y++) {
				for (let x = 0; x <= columns - width; x++) {
					const testPosition: GridPosition = { x, y, w: width, h: height };

					if (!hasCollision(testPosition, layout)) {
						return testPosition;
					}
				}
			}

			return null; // No available position found
		},
		[hasCollision, columns, rows]
	);

	// Validate if a position is within grid bounds
	const isWithinBounds = useCallback((position: GridPosition): boolean => {
		return (
			position.x >= 0 &&
			position.y >= 0 &&
			position.x + position.w <= columns &&
			position.y + position.h <= rows
		);
	}, [columns, rows]);

	// Get a valid position (within bounds and no collision)
	const getValidPosition = useCallback(
		(
			position: GridPosition,
			layout: LayoutItem[],
			excludeId?: string
		): GridPosition | null => {
			// First check if within bounds
			if (!isWithinBounds(position)) {
				// Try to constrain to bounds
				position = {
					...position,
					x: Math.max(0, Math.min(columns - position.w, position.x)),
					y: Math.max(0, Math.min(rows - position.h, position.y)),
					w: Math.min(columns - position.x, position.w),
					h: Math.min(rows - position.y, position.h),
				};
			}

			// Check for collision
			if (hasCollision(position, layout, excludeId)) {
				return null; // Invalid position due to collision
			}

			return position;
		},
		[isWithinBounds, hasCollision, columns, rows]
	);

	return {
		checkCollision,
		hasCollision,
		getOccupiedCells,
		findAvailablePosition,
		isWithinBounds,
		getValidPosition,
	};
};
