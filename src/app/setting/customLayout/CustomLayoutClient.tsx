"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { useSettingStatus } from "@/hooks/useSettingStatus";

interface Widget {
	id: string;
	type: string;
	color: string;
}

interface LayoutPayloadItem {
	i: string;
	x: number;
	y: number;
	w: number;
	h: number;
	maxW: number;
	maxH: number;
}

interface CustomLayoutData {
	layout: LayoutPayloadItem[];
	mobileLayout?: LayoutPayloadItem[];
	desktopWidgets: Widget[];
	mobileWidgets: Widget[];
	desktopUsedColors: string[];
	mobileUsedColors: string[];
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

const DESKTOP_GRID = { columns: 12, rows: 12 };
const MOBILE_GRID = { columns: 8, rows: 12 };

export default function CustomLayoutClient() {
	const { main, updateMain, refreshSettings } = useSettings();
	const customLayout = main?.customLayout;

	const [desktopLayout, setDesktopLayout] = useState<LayoutItem[]>([]);
	const [mobileLayout, setMobileLayout] = useState<LayoutItem[]>([]);
	const [desktopWidgets, setDesktopWidgets] = useState<Widget[]>([]);
	const [mobileWidgets, setMobileWidgets] = useState<Widget[]>([]);
	const [selectedWidget, setSelectedWidget] = useState<string>("");
	const [desktopUsedColors, setDesktopUsedColors] = useState<string[]>([]);
	const [mobileUsedColors, setMobileUsedColors] = useState<string[]>([]);
	const [showClearDialog, setShowClearDialog] = useState(false);
	const [layoutMode, setLayoutMode] = useState<"desktop" | "mobile">(
		"desktop"
	);
	const [isSyncing, setIsSyncing] = useState(true);

	const containerRef = useRef<HTMLDivElement>(null);
	const layoutChannelRef = useRef<BroadcastChannel | null>(null);

	const desktopGrid = DESKTOP_GRID;
	const mobileGrid = MOBILE_GRID;
	const desktopCollision = useCollisionDetection(desktopGrid);
	const mobileCollision = useCollisionDetection(mobileGrid);
	const isDesktopMode = layoutMode === "desktop";
	const activeLayout = isDesktopMode ? desktopLayout : mobileLayout;
	const activeWidgetList = isDesktopMode ? desktopWidgets : mobileWidgets;
	const activeUsedColors = isDesktopMode ? desktopUsedColors : mobileUsedColors;
	const activeWidgets = activeLayout
		.map((item) => activeWidgetList.find((widget) => widget.id === item.i))
		.filter((widget): widget is Widget => Boolean(widget));
	const baselineLayout = useMemo(
		() => ({
			layout: customLayout?.layout ?? [],
			mobileLayout: customLayout?.mobileLayout ?? [],
			desktopWidgets: customLayout?.desktopWidgets ?? [],
			mobileWidgets: customLayout?.mobileWidgets ?? [],
			desktopUsedColors: customLayout?.desktopUsedColors ?? [],
			mobileUsedColors: customLayout?.mobileUsedColors ?? [],
		}),
		[customLayout]
	);
	const currentLayout = useMemo(
		() => ({
			layout: desktopLayout,
			mobileLayout,
			desktopWidgets,
			mobileWidgets,
			desktopUsedColors,
			mobileUsedColors,
		}),
		[
			desktopLayout,
			mobileLayout,
			desktopWidgets,
			mobileWidgets,
			desktopUsedColors,
			mobileUsedColors,
		]
	);
	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		return JSON.stringify(currentLayout) !== JSON.stringify(baselineLayout);
	}, [currentLayout, baselineLayout, isSyncing]);
	useSettingStatus("mainLayout", isDirty ? "dirty" : "saved");

	// Load saved layout from settings
	useEffect(() => {
		setIsSyncing(true);
		if (customLayout) {
			const legacyWidgets =
				"widgets" in customLayout
					? (customLayout as { widgets?: Widget[] }).widgets
					: undefined;
			const legacyUsedColors =
				"usedColors" in customLayout
					? (customLayout as { usedColors?: string[] }).usedColors
					: undefined;

			setDesktopLayout(customLayout.layout || []);
			setMobileLayout(customLayout.mobileLayout || []);
			setDesktopWidgets(customLayout.desktopWidgets || legacyWidgets || []);
			setMobileWidgets(customLayout.mobileWidgets || []);
			setDesktopUsedColors(customLayout.desktopUsedColors || legacyUsedColors || []);
			setMobileUsedColors(customLayout.mobileUsedColors || []);
		}
		setIsSyncing(false);
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
			(color) => !activeUsedColors.includes(color)
		);

		if (availableColors.length === 0) {
			// Reset if all colors are used
			if (isDesktopMode) {
				setDesktopUsedColors([]);
			} else {
				setMobileUsedColors([]);
			}
			return widgetColors[0];
		}

		// Random selection
		const randomColor =
			availableColors[Math.floor(Math.random() * availableColors.length)];
		return randomColor;
	}, [activeUsedColors, isDesktopMode]);

	// Add a new widget
	const handleAddWidget = useCallback(() => {
		if (!selectedWidget) {
			toast.warning("추가할 위젯을 선택해주세요!");
			return;
		}

		// Check if widget already exists in current layout
		const isWidgetInActiveLayout = activeLayout.some(
			(item) => item.i === selectedWidget
		);

		if (isWidgetInActiveLayout) {
			toast.warning(`${selectedWidget} 위젯은 이미 추가되었습니다.`);
			return;
		}

		if (activeLayout.length >= 9) {
			toast.warning("최대 9개의 위젯만 추가할 수 있습니다.");
			return;
		}

		const currentCollision = isDesktopMode ? desktopCollision : mobileCollision;
		const availablePosition = currentCollision.findAvailablePosition(
			activeLayout,
			2,
			2
		);

		if (!availablePosition) {
			toast.warning("공간을 확보해주세요");
			return;
		}

		const existingWidget = activeWidgetList.find(
			(widget) => widget.id === selectedWidget
		);
		const newWidgetColor = existingWidget?.color || getUniqueColor();
		const newWidgetId = selectedWidget;
		const newWidget: LayoutItem = {
			i: newWidgetId,
			x: availablePosition.x,
			y: availablePosition.y,
			w: availablePosition.w,
			h: availablePosition.h,
			maxW: isDesktopMode ? desktopGrid.columns : mobileGrid.columns,
			maxH: isDesktopMode ? desktopGrid.rows : mobileGrid.rows,
		};

		if (isDesktopMode) {
			setDesktopLayout((prev) => [...prev, newWidget]);
		} else {
			setMobileLayout((prev) => [...prev, newWidget]);
		}

		if (!existingWidget) {
			const newWidget = {
				id: newWidgetId,
				type: selectedWidget,
				color: newWidgetColor,
			};

			if (isDesktopMode) {
				setDesktopWidgets((prev) => [...prev, newWidget]);
				setDesktopUsedColors((prev) => [...prev, newWidgetColor]);
			} else {
				setMobileWidgets((prev) => [...prev, newWidget]);
				setMobileUsedColors((prev) => [...prev, newWidgetColor]);
			}
		}
		setSelectedWidget("");
		toast.success(`${selectedWidget} 위젯이 추가되었습니다.`);
	}, [
		selectedWidget,
		activeLayout,
		activeWidgetList,
		isDesktopMode,
		desktopCollision,
		mobileCollision,
		desktopGrid.columns,
		desktopGrid.rows,
		mobileGrid.columns,
		mobileGrid.rows,
		getUniqueColor,
	]);

	// Remove a widget
	const handleRemoveWidget = useCallback(
		(widgetId: string) => {
			const updateLayout = (prev: LayoutItem[]) =>
				prev.filter((item) => item.i !== widgetId);

			if (isDesktopMode) {
				setDesktopLayout(updateLayout);
				const removedWidget = desktopWidgets.find(
					(widget) => widget.id === widgetId
				);
				setDesktopWidgets((prev) =>
					prev.filter((widget) => widget.id !== widgetId)
				);
				if (removedWidget) {
					setDesktopUsedColors((prev) =>
						prev.filter((color) => color !== removedWidget.color)
					);
				}
			} else {
				setMobileLayout(updateLayout);
				const removedWidget = mobileWidgets.find(
					(widget) => widget.id === widgetId
				);
				setMobileWidgets((prev) =>
					prev.filter((widget) => widget.id !== widgetId)
				);
				if (removedWidget) {
					setMobileUsedColors((prev) =>
						prev.filter((color) => color !== removedWidget.color)
					);
				}
			}

			toast.success("위젯이 제거되었습니다.");
		},
		[desktopWidgets, isDesktopMode, mobileWidgets]
	);

	// Update widget position
	const handlePositionChange = useCallback(
		(widgetId: string, newPosition: GridPosition) => {
			const updateLayout = (prev: LayoutItem[]) =>
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
				);

			if (isDesktopMode) {
				setDesktopLayout(updateLayout);
			} else {
				setMobileLayout(updateLayout);
			}
		},
		[isDesktopMode]
	);


	// Save layout
	const handleSaveLayout = useCallback(async () => {
		try {
			const normalizeLayout = (
				layout: LayoutItem[],
				columns: number,
				rows: number
			): LayoutPayloadItem[] =>
				layout.map((item) => ({
					i: item.i,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					maxW: item.maxW ?? columns,
					maxH: item.maxH ?? rows,
				}));

			const layoutData: CustomLayoutData = {
				layout: normalizeLayout(
					desktopLayout,
					desktopGrid.columns,
					desktopGrid.rows
				),
				mobileLayout: normalizeLayout(
					mobileLayout,
					mobileGrid.columns,
					mobileGrid.rows
				),
				desktopWidgets,
				mobileWidgets,
				desktopUsedColors,
				mobileUsedColors,
			};

			await setCustomLayout(layoutData);
			await refreshSettings?.({ broadcast: true });

			// Update context and broadcast
			updateMain({ customLayout: layoutData });
			layoutChannelRef.current?.postMessage(layoutData);

			toast.success("저장되었습니다.");
		} catch {
			toast.error("저장에 실패했습니다.");
		}
	}, [
		desktopLayout,
		mobileLayout,
		desktopWidgets,
		mobileWidgets,
		desktopUsedColors,
		mobileUsedColors,
		desktopGrid,
		mobileGrid,
		updateMain,
		refreshSettings,
	]);

	// Clear layout
	const handleClearLayout = useCallback(async () => {
		try {
			const emptyLayoutData: CustomLayoutData = {
				layout: [],
				mobileLayout: [],
				desktopWidgets: [],
				mobileWidgets: [],
				desktopUsedColors: [],
				mobileUsedColors: [],
			};

			await setCustomLayout(emptyLayoutData);
			await refreshSettings?.({ broadcast: true });

			// Reset state
			setDesktopLayout([]);
			setMobileLayout([]);
			setDesktopWidgets([]);
			setMobileWidgets([]);
			setDesktopUsedColors([]);
			setMobileUsedColors([]);
			setSelectedWidget("");

			// Update context and broadcast
			updateMain({ customLayout: emptyLayoutData });
			layoutChannelRef.current?.postMessage(emptyLayoutData);

			toast.success("레이아웃이 초기화되었습니다.");
			setShowClearDialog(false);
		} catch {
			toast.error("레이아웃 초기화 중 오류가 발생했습니다.");
		}
	}, [updateMain, refreshSettings]);

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
							<li>• 데스크톱/모바일 레이아웃을 전환해 각각 배치할 수 있습니다.</li>
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
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">편집 모드</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								데스크톱/모바일 레이아웃을 전환합니다.
							</p>
						</div>
						<div className="flex flex-1 items-center">
							<div className="inline-flex rounded-card border-card bg-card-bg p-1">
								<button
									type="button"
									onClick={() => setLayoutMode("desktop")}
									className={`px-3 py-2 rounded-card text-sm font-medium transition-colors ${
										isDesktopMode
											? "bg-theme-primary text-white"
											: "text-sub-text hover:bg-card-bg/70"
									}`}
								>
									데스크톱 12×12
								</button>
								<button
									type="button"
									onClick={() => setLayoutMode("mobile")}
									className={`px-3 py-2 rounded-card text-sm font-medium transition-colors ${
										!isDesktopMode
											? "bg-theme-primary text-white"
											: "text-sub-text hover:bg-card-bg/70"
									}`}
								>
									모바일 8×12
								</button>
							</div>
						</div>
					</div>

					<div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-4">
						<div className="w-full lg:w-3/4 flex justify-center">
							<GridContainer
								ref={containerRef}
								showGrid={true}
								columns={isDesktopMode ? desktopGrid.columns : mobileGrid.columns}
								rows={isDesktopMode ? desktopGrid.rows : mobileGrid.rows}
								aspectRatio={isDesktopMode ? "5 / 4" : "2 / 3"}
								maxHeight={isDesktopMode ? undefined : "600px"}
								maxWidth={isDesktopMode ? undefined : "400px"}
							>
								{activeLayout.map((item) => {
									const widget = activeWidgetList.find((w) => w.id === item.i);
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
											layout={activeLayout}
											containerRef={containerRef}
											onPositionChange={handlePositionChange}
											columns={
												isDesktopMode
													? desktopGrid.columns
													: mobileGrid.columns
											}
											rows={
												isDesktopMode ? desktopGrid.rows : mobileGrid.rows
											}
										/>
									);
								})}
							</GridContainer>
						</div>

						<WidgetList widgets={activeWidgets} onRemove={handleRemoveWidget} />
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
				<Button onClick={handleSaveLayout} disabled={!isDirty}>
					저장하기
				</Button>
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
