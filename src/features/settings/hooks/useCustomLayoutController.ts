import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { setCustomLayout } from "@/features/settings/api/main";
import {
	useCollisionDetection,
	type LayoutItem,
} from "@/components/setting/customLayout/useCollisionDetection";
import type { CustomLayout, WidgetItem } from "@/features/settings/types";

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
const IMAGE_WIDGET_IDS = [
	"이미지 위젯 1",
	"이미지 위젯 2",
	"이미지 위젯 3",
	"이미지 위젯 4",
];
const MAX_IMAGE_WIDGETS = IMAGE_WIDGET_IDS.length;

export interface Widget {
	id: string;
	type: string;
	color: string;
}

export function useCustomLayoutController() {
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
	const [layoutMode, setLayoutMode] = useState<"desktop" | "mobile">("desktop");
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
		[customLayout],
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
		],
	);
	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		return JSON.stringify(currentLayout) !== JSON.stringify(baselineLayout);
	}, [currentLayout, baselineLayout, isSyncing]);
	useSettingStatus("mainLayout", isDirty ? "dirty" : "saved");

	useEffect(() => {
		setIsSyncing(true);
		if (customLayout) {
			setDesktopLayout(customLayout.layout || []);
			setMobileLayout(customLayout.mobileLayout || []);
			setDesktopWidgets((customLayout.desktopWidgets || []) as Widget[]);
			setMobileWidgets((customLayout.mobileWidgets || []) as Widget[]);
			setDesktopUsedColors(customLayout.desktopUsedColors || []);
			setMobileUsedColors(customLayout.mobileUsedColors || []);
		}
		setIsSyncing(false);
	}, [customLayout]);

	useEffect(() => {
		layoutChannelRef.current = new BroadcastChannel("layoutUpdated");
		return () => {
			layoutChannelRef.current?.close();
		};
	}, []);

	const getUniqueColor = useCallback(() => {
		const availableColors = widgetColors.filter(
			(color) => !activeUsedColors.includes(color),
		);

		if (availableColors.length === 0) {
			if (isDesktopMode) {
				setDesktopUsedColors([]);
			} else {
				setMobileUsedColors([]);
			}
			return widgetColors[0];
		}

		return availableColors[Math.floor(Math.random() * availableColors.length)];
	}, [activeUsedColors, isDesktopMode]);

	const handleAddWidget = useCallback(() => {
		if (!selectedWidget) {
			toast.warning("추가할 위젯을 선택해주세요!");
			return;
		}

		const isWidgetInActiveLayout = activeWidgets.some(
			(widget) => widget.id === selectedWidget,
		);

		if (isWidgetInActiveLayout) {
			toast.warning(`${selectedWidget} 위젯은 이미 추가되었습니다.`);
			return;
		}

		const isImageWidget = IMAGE_WIDGET_IDS.includes(selectedWidget);
		if (isImageWidget) {
			const imageWidgetCount = activeWidgets.filter((widget) =>
				IMAGE_WIDGET_IDS.includes(widget.id),
			).length;
			if (imageWidgetCount >= MAX_IMAGE_WIDGETS) {
				toast.warning("이미지 위젯은 최대 4개까지 추가할 수 있습니다.");
				return;
			}
		}

		const currentCollision = isDesktopMode ? desktopCollision : mobileCollision;
		const availablePosition = currentCollision.findAvailablePosition(
			activeLayout,
			2,
			2,
		);

		if (!availablePosition) {
			toast.warning("공간을 확보해주세요");
			return;
		}

		const existingWidget = activeWidgetList.find(
			(widget) => widget.id === selectedWidget,
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
			const widget = {
				id: newWidgetId,
				type: selectedWidget,
				color: newWidgetColor,
			};
			if (isDesktopMode) {
				setDesktopWidgets((prev) => [...prev, widget]);
				setDesktopUsedColors((prev) => [...prev, newWidgetColor]);
			} else {
				setMobileWidgets((prev) => [...prev, widget]);
				setMobileUsedColors((prev) => [...prev, newWidgetColor]);
			}
		}
		setSelectedWidget("");
		toast.success(`${selectedWidget} 위젯이 추가되었습니다.`);
	}, [
		selectedWidget,
		activeWidgets,
		activeLayout,
		activeWidgetList,
		getUniqueColor,
		isDesktopMode,
		desktopCollision,
		mobileCollision,
		desktopGrid.columns,
		desktopGrid.rows,
		mobileGrid.columns,
		mobileGrid.rows,
	]);

	const handleRemoveWidget = useCallback(
		(widgetId: string) => {
			const updateLayout = (prev: LayoutItem[]) =>
				prev.filter((item) => item.i !== widgetId);
			if (isDesktopMode) {
				setDesktopLayout(updateLayout);
				const removedWidget = desktopWidgets.find((widget) => widget.id === widgetId);
				setDesktopWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));
				if (removedWidget) {
					setDesktopUsedColors((prev) =>
						prev.filter((color) => color !== removedWidget.color),
					);
				}
			} else {
				setMobileLayout(updateLayout);
				const removedWidget = mobileWidgets.find((widget) => widget.id === widgetId);
				setMobileWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));
				if (removedWidget) {
					setMobileUsedColors((prev) =>
						prev.filter((color) => color !== removedWidget.color),
					);
				}
			}
			toast.success("위젯이 제거되었습니다.");
		},
		[desktopWidgets, isDesktopMode, mobileWidgets],
	);

	const handlePositionChange = useCallback(
		(widgetId: string, newPosition: { x: number; y: number; w: number; h: number }) => {
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
						: item,
				);
			if (isDesktopMode) {
				setDesktopLayout(updateLayout);
			} else {
				setMobileLayout(updateLayout);
			}
		},
		[isDesktopMode],
	);

	const saveLayout = useCallback(async (layoutData: CustomLayout) => {
		await setCustomLayout(layoutData);
		await refreshSettings?.({ broadcast: true });
		updateMain({ customLayout: layoutData });
		layoutChannelRef.current?.postMessage(layoutData);
	}, [refreshSettings, updateMain]);

	const handleSaveLayout = useCallback(async () => {
		try {
			const normalizeLayout = (
				layout: LayoutItem[],
				columns: number,
				rows: number,
			) =>
				layout.map((item) => ({
					i: item.i,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					maxW: item.maxW ?? columns,
					maxH: item.maxH ?? rows,
				}));
			const layoutData: CustomLayout = {
				layout: normalizeLayout(desktopLayout, desktopGrid.columns, desktopGrid.rows),
				mobileLayout: normalizeLayout(mobileLayout, mobileGrid.columns, mobileGrid.rows),
				desktopWidgets: desktopWidgets as WidgetItem[],
				mobileWidgets: mobileWidgets as WidgetItem[],
				desktopUsedColors,
				mobileUsedColors,
			};
			await saveLayout(layoutData);
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
		desktopGrid.columns,
		desktopGrid.rows,
		mobileGrid.columns,
		mobileGrid.rows,
		saveLayout,
	]);

	const handleClearLayout = useCallback(async () => {
		try {
			const emptyLayoutData: CustomLayout = {
				layout: [],
				mobileLayout: [],
				desktopWidgets: [],
				mobileWidgets: [],
				desktopUsedColors: [],
				mobileUsedColors: [],
			};
			await saveLayout(emptyLayoutData);
			setDesktopLayout([]);
			setMobileLayout([]);
			setDesktopWidgets([]);
			setMobileWidgets([]);
			setDesktopUsedColors([]);
			setMobileUsedColors([]);
			setSelectedWidget("");
			toast.success("레이아웃이 초기화되었습니다.");
			setShowClearDialog(false);
		} catch {
			toast.error("레이아웃 초기화 중 오류가 발생했습니다.");
		}
	}, [saveLayout]);

	return {
		state: {
			desktopLayout,
			mobileLayout,
			desktopWidgets,
			mobileWidgets,
			selectedWidget,
			desktopUsedColors,
			mobileUsedColors,
			showClearDialog,
			layoutMode,
			isDesktopMode,
			activeLayout,
			activeWidgets,
			containerRef,
			desktopGrid,
			mobileGrid,
			isDirty,
		},
		actions: {
			setSelectedWidget,
			setShowClearDialog,
			setLayoutMode,
			handleAddWidget,
			handleRemoveWidget,
			handlePositionChange,
			handleSaveLayout,
			handleClearLayout,
		},
	};
}
