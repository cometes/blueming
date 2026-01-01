"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GridContainerProps {
	children: React.ReactNode;
	showGrid?: boolean;
	className?: string;
}

export const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
	({ children, showGrid = true, className }, ref) => {
		return (
			<div
				className={cn(
					"relative w-full aspect-[5/4] overflow-hidden rounded-card border-card p-2",
					"bg-card-bg backdrop-blur-sm",
					className
				)}
			>
				{/* Inner grid container (ref points here) */}
				<div
					ref={ref}
					className="relative w-full h-full grid grid-cols-12 grid-rows-12 gap-2.5"
				>
					{/* Grid guidelines for editing mode */}
					{showGrid && (
						<div className="absolute inset-0 pointer-events-none grid grid-cols-12 grid-rows-12 gap-2.5">
							{Array.from({ length: 144 }).map((_, i) => (
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
