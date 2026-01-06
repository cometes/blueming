"use client";

import { Trash2 } from "lucide-react";

interface Widget {
	id: string;
	type: string;
	color: string;
}

interface WidgetListProps {
	widgets: Widget[];
	onRemove: (id: string) => void;
}

export const WidgetList = ({ widgets, onRemove }: WidgetListProps) => {
	if (widgets.length === 0) {
		return (
			<div className="w-full lg:w-1/4">
				<h3 className="text-lg font-semibold text-foreground mb-4">
					추가된 위젯
				</h3>
				<p className="text-sm text-muted-foreground">
					위젯을 추가하면 여기에 표시됩니다.
				</p>
			</div>
		);
	}

	return (
		<div className="w-full lg:w-1/4">
			<h3 className="text-base font-semibold text-foreground mb-3">
				위젯 목록
			</h3>
			<div className="space-y-2">
				{widgets.map((widget) => (
					<div
						key={widget.id}
						className="flex items-center gap-2 px-2 py-1.5 rounded-card border-card bg-card-bg/50 hover:bg-card-bg transition-colors"
					>
						{/* Color Indicator - Small Circle */}
						<div
							className="w-3 h-3 rounded-full flex-shrink-0"
							style={{ backgroundColor: widget.color }}
							aria-label="위젯 색상"
						/>

						{/* Widget Name */}
						<span className="flex-1 text-xs font-medium truncate">
							{widget.type}
						</span>

						{/* Remove Button - Smaller */}
						<button
							onClick={() => onRemove(widget.id)}
							className="flex-shrink-0 p-1 hover:bg-destructive/10 rounded transition-colors group"
							aria-label="위젯 제거"
						>
							<Trash2 className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
						</button>
					</div>
				))}
			</div>
		</div>
	);
};
