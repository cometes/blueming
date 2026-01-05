"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { GridContainer } from "@/components/setting/customLayout/GridContainer";
import { DraggableWidget } from "@/components/setting/customLayout/DraggableWidget";
import { WidgetList } from "@/components/setting/customLayout/WidgetList";
import { useCollisionDetection, LayoutItem } from "@/components/setting/customLayout/useCollisionDetection";
import { GridPosition } from "@/components/setting/customLayout/useGridSnap";
import { setCustomLayout } from "@/queries/set/setCustomLayout";
import { useSettings } from "@/contexts/SettingsContext";

interface Widget {
	id: string;
	type: string;
	color: string;
}

interface CustomLayoutData {
	layout: LayoutItem[];
	widgets: Widget[];
	usedColors: string[];
}

const widgetOptions = [
	{ label: "공지", value: "공지" },
	{ label: "슬라이드 배너", value: "슬라이드 배너" },
	{ label: "텍스트바", value: "텍스트바" },
	{ label: "프로필", value: "프로필" },
	{ label: "디데이", value: "디데이" },
	{ label: "최신글", value: "최신글" },
	{ label: "뮤직플레이어", value: "뮤직플레이어" },
];

const widgetColors = [
	"#FFC2D2",
	"#FFE5CC",
	"#FFF1B4",
	"#E9FAB6",
	"#C9F1FF",
	"#A6BCEB",
	"#D5D4FC",
	"#FFE0DD",
	"#EDF0FF",
];

export default function CustomLayoutClient() {
	const { main, updateMain } = useSettings();
	const customLayout = main?.customLayout;

	const [layout, setLayout] = useState<LayoutItem[]>([]);
	const [widgets, setWidgets] = useState<Widget[]>([]);
	const [selectedWidget, setSelectedWidget] = useState<string>("");
	const [usedColors, setUsedColors] = useState<string[]>([]);
	const [showClearDialog, setShowClearDialog] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const layoutChannelRef = useRef<BroadcastChannel | null>(null);

	const { findAvailablePosition } = useCollisionDetection();

	// Load saved layout from settings
	useEffect(() => {
		if (customLayout) {
			setLayout(customLayout.layout || []);
			setWidgets(customLayout.widgets || []);
			setUsedColors(customLayout.usedColors || []);
		}
	}, [customLayout]);

	// Setup broadcast channel for live updates
	useEffect(() => {
		layoutChannelRef.current = new BroadcastChannel("layoutUpdated");
		return () => {
			layoutChannelRef.current?.close();
		};
	}, []);

	// Get a unique color for new widgets
	const getUniqueColor = useCallback(() => {
		const availableColors = widgetColors.filter(
			(color) => !usedColors.includes(color)
		);

		if (availableColors.length === 0) {
			// Reset if all colors are used
			setUsedColors([]);
			return widgetColors[0];
		}

		// Random selection
		const randomColor =
			availableColors[Math.floor(Math.random() * availableColors.length)];
		return randomColor;
	}, [usedColors]);

	// Add a new widget
	const handleAddWidget = useCallback(() => {
		if (!selectedWidget) {
			toast.warning("추가할 위젯을 선택해주세요!");
			return;
		}

		// Check if widget already exists
		const isWidgetAlreadyExists = widgets.some(
			(widget) => widget.type === selectedWidget
		);

		if (isWidgetAlreadyExists) {
			toast.warning(`${selectedWidget} 위젯은 이미 추가되었습니다.`);
			return;
		}

		if (layout.length >= 9) {
			toast.warning("최대 9개의 위젯만 추가할 수 있습니다.");
			return;
		}

		const availablePosition = findAvailablePosition(layout, 2, 2);

		if (!availablePosition) {
			toast.warning("공간을 확보해주세요");
			return;
		}

		const newWidgetColor = getUniqueColor();
		const newWidgetId = selectedWidget;
		const newWidget: LayoutItem = {
			i: newWidgetId,
			x: availablePosition.x,
			y: availablePosition.y,
			w: availablePosition.w,
			h: availablePosition.h,
			maxW: 12,
			maxH: 12,
		};

		setLayout((prev) => [...prev, newWidget]);
		setWidgets((prev) => [
			...prev,
			{
				id: newWidgetId,
				type: selectedWidget,
				color: newWidgetColor,
			},
		]);
		setUsedColors((prev) => [...prev, newWidgetColor]);
		setSelectedWidget("");
		toast.success(`${selectedWidget} 위젯이 추가되었습니다.`);
	}, [selectedWidget, widgets, layout, findAvailablePosition, getUniqueColor]);

	// Remove a widget
	const handleRemoveWidget = useCallback(
		(widgetId: string) => {
			const removedWidget = widgets.find((widget) => widget.id === widgetId);

			setLayout((prev) => prev.filter((item) => item.i !== widgetId));
			setWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));

			if (removedWidget) {
				setUsedColors((prev) =>
					prev.filter((color) => color !== removedWidget.color)
				);
			}

			toast.success("위젯이 제거되었습니다.");
		},
		[widgets]
	);

	// Update widget position
	const handlePositionChange = useCallback(
		(widgetId: string, newPosition: GridPosition) => {
			setLayout((prev) =>
				prev.map((item) =>
					item.i === widgetId
						? {
								...item,
								x: newPosition.x,
								y: newPosition.y,
								w: newPosition.w,
								h: newPosition.h,
						  }
						: item
				)
			);
		},
		[]
	);


	// Save layout
	const handleSaveLayout = useCallback(async () => {
		try {
			const layoutData: CustomLayoutData = {
				layout,
				widgets,
				usedColors,
			};

			await setCustomLayout(layoutData);

			// Update context and broadcast
			updateMain({ customLayout: layoutData });
			layoutChannelRef.current?.postMessage(layoutData);

			toast.success("레이아웃이 성공적으로 저장되었습니다.");
		} catch (error) {
			console.error("Layout save error:", error);
			toast.error("레이아웃 저장 중 오류가 발생했습니다.");
		}
	}, [layout, widgets, usedColors, updateMain]);

	// Clear layout
	const handleClearLayout = useCallback(async () => {
		try {
			const emptyLayoutData: CustomLayoutData = {
				layout: [],
				widgets: [],
				usedColors: [],
			};

			await setCustomLayout(emptyLayoutData);

			// Reset state
			setLayout([]);
			setWidgets([]);
			setUsedColors([]);
			setSelectedWidget("");

			// Update context and broadcast
			updateMain({ customLayout: emptyLayoutData });
			layoutChannelRef.current?.postMessage(emptyLayoutData);

			toast.success("레이아웃이 초기화되었습니다.");
			setShowClearDialog(false);
		} catch (error) {
			console.error("Layout clear error:", error);
			toast.error("레이아웃 초기화 중 오류가 발생했습니다.");
		}
	}, [updateMain]);

	return (
		<div className="space-y-8">
			<section>
				<h2 className="text-[20px] font-semibold">커스텀 레이아웃 편집</h2>
				<div className="section-wrap mt-6">
					<div className="rounded-card border-card bg-card-bg p-6 backdrop-blur-sm">
						<ul className="space-y-1 text-sm text-sub-text">
							<li>• 위젯을 선택하고 추가하세요.</li>
							<li>• 드래그로 위치를 변경하고 크기를 조정할 수 있습니다.</li>
							<li>• 충분한 공간이 확보되어야 새로운 위젯을 추가할 수 있습니다.</li>
							<li>• 화면 크기에 따라 레이아웃이 자동으로 조정됩니다.</li>
						</ul>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			<section>
				<h2 className="text-[20px] font-semibold">위젯 추가</h2>
				<div className="section-wrap mt-6">
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">추가할 위젯</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								추가할 위젯을 선택하세요.
							</p>
						</div>
						<div className="flex flex-1 flex-col sm:flex-row gap-3">
							<Select value={selectedWidget} onValueChange={setSelectedWidget}>
								<SelectTrigger className="w-full sm:w-[200px] rounded-card border-card bg-card-bg">
									<SelectValue placeholder="위젯 선택" />
								</SelectTrigger>
								<SelectContent>
									{widgetOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button type="button" onClick={handleAddWidget}>
								추가하기
							</Button>
						</div>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			<section>
				<h2 className="text-[20px] font-semibold">레이아웃 편집</h2>
				<div className="section-wrap mt-6">
					<div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
						<div className="w-full lg:w-3/4">
							<GridContainer ref={containerRef} showGrid={true}>
								{layout.map((item) => {
									const widget = widgets.find((w) => w.id === item.i);
									if (!widget) return null;

									return (
										<DraggableWidget
											key={item.i}
											id={item.i}
											gridPosition={{
												x: item.x,
												y: item.y,
												w: item.w,
												h: item.h,
											}}
											color={widget.color}
											label={widget.type}
											layout={layout}
											containerRef={containerRef}
											onPositionChange={handlePositionChange}
											onRemove={handleRemoveWidget}
										/>
									);
								})}
							</GridContainer>
						</div>

						<WidgetList widgets={widgets} onRemove={handleRemoveWidget} />
					</div>
				</div>
			</section>

			<div className="flex justify-end gap-3 pt-6">
				<Button
					variant="destructive"
					onClick={() => setShowClearDialog(true)}
				>
					초기화하기
				</Button>
				<Button onClick={handleSaveLayout}>저장하기</Button>
			</div>

			<Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>레이아웃 초기화</DialogTitle>
						<DialogDescription>
							정말 레이아웃을 초기화할까요? 모든 위젯이 제거됩니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowClearDialog(false)}
						>
							취소
						</Button>
						<Button variant="destructive" onClick={handleClearLayout}>
							초기화
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
