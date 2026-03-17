"use client";

import { forwardRef } from "react";
import { cn } from "@/shared/lib/utils";

interface GridContainerProps {
	children: React.ReactNode;
	showGrid?: boolean;
	className?: string;
	columns?: number;
	rows?: number;
	aspectRatio?: string;
	maxHeight?: string;
	maxWidth?: string;
}

export const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
	(
		{
			children,
			showGrid = true,
			className,
			columns = 12,
			rows = 12,
			aspectRatio = "5 / 4",
			maxHeight,
			maxWidth,
		},
		ref
	) => {
		return (
		<div
			className={cn(
				"relative w-full overflow-hidden rounded-card border-card p-2",
				"bg-card-bg backdrop-blur-sm",
				className
			)}
			style={{ aspectRatio, maxHeight, maxWidth }}
		>
				{/* Inner grid container (ref points here) */}
				<div
					ref={ref}
					className="relative w-full h-full grid gap-2.5"
					style={{
						gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
						gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
					}}
				>
					{/* Grid guidelines for editing mode */}
					{showGrid && (
						<div
							className="absolute inset-0 pointer-events-none grid gap-2.5"
							style={{
								gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
								gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
							}}
						>
							{Array.from({ length: columns * rows }).map((_, i) => (
								<div
									key={i}
									className="border border-dashed border-muted-foreground/10"
								/>
							))}
						</div>
					)}

					{/* Widgets */}
					{children}
				</div>
			</div>
		);
	}
);

GridContainer.displayName = "GridContainer";
