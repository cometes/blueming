"use client";

import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMobile } from "@/hooks/use-mobile";
import WidgetSkeleton from "@/components/widgets/WidgetSkeleton";

type WidgetType = string;

// Helper to wrap dynamic imports and notify when ready
// isAsyncData: true if the widget has internal data fetching it waits for
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dynamicWidget = (importer: any, isAsyncData = false) =>
	dynamic(
		async () => {
			const mod = await importer();
			const Component = mod.default;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (props: any) => {
				useEffect(() => {
					// If not async (static), we are ready as soon as mounted
					if (!isAsyncData && props.onReady) {
						props.onReady();
					}
				}, []);
				// If async, the component itself must call onReady
				return <Component {...props} />;
			};
		},
		{
			ssr: false,
			loading: () => null, // We handle skeletons manually in the grid
		}
	);

const WidgetProfile = dynamicWidget(
	() => import("@/components/widgets/WidgetProfile")
);
const WidgetDday = dynamicWidget(() => import("@/components/widgets/WidgetDday"));
const WidgetMarquee = dynamicWidget(
	() => import("@/components/widgets/WidgetMarquee")
);
const WidgetNotice = dynamicWidget(
	() => import("@/components/widgets/WidgetNotice")
);
const WidgetSlide = dynamicWidget(
	() => import("@/components/widgets/WidgetSlide")
);
const WidgetLatestPosts = dynamicWidget(
	() => import("@/components/widgets/WidgetLatestPosts"),
	true // Async data
);
const WidgetStickerBoard = dynamicWidget(
	() => import("@/components/widgets/WidgetStickerBoard")
);
const WidgetImage = dynamicWidget(
	() => import("@/components/widgets/WidgetImage")
);
const WidgetWeatherClock = dynamicWidget(
	() => import("@/components/widgets/WidgetWeatherClock"),
	true // Async data
);

const IMAGE_WIDGET_IDS = [
	"이미지 위젯 1",
	"이미지 위젯 2",
	"이미지 위젯 3",
	"이미지 위젯 4",
];

export default function Home() {
	const { main } = useSettings();
	const isMobile = useMobile();
	const customLayout = main?.customLayout;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const legacyWidgets = (customLayout as { widgets?: Array<{ id: string }> })
		?.widgets;
	const layout = useMemo(
		() =>
			isMobile
				? customLayout?.mobileLayout || customLayout?.layout || []
				: customLayout?.layout || [],
		[customLayout, isMobile]
	);
	const widgetList = useMemo(
		() =>
			isMobile
				? customLayout?.mobileWidgets ||
				customLayout?.desktopWidgets ||
				legacyWidgets ||
				[]
				: customLayout?.desktopWidgets || legacyWidgets || [],
		[customLayout, isMobile, legacyWidgets]
	);
	const activeWidgetIds = useMemo(
		() => new Set(widgetList.map((widget) => widget.id)),
		[widgetList]
	);
	const activeLayout = useMemo(
		() => layout.filter((item) => activeWidgetIds.has(item.i)),
		[activeWidgetIds, layout]
	);

	// Coordinated Loading State
	const [readyWidgets, setReadyWidgets] = useState<Set<string>>(new Set());
	const [isAllReady, setIsAllReady] = useState(false);

	useEffect(() => {
		if (activeLayout.length === 0) {
			setIsAllReady(true);
			return;
		}
		if (readyWidgets.size >= activeLayout.length) {
			setIsAllReady(true);
		}
	}, [readyWidgets.size, activeLayout.length]);

	const handleWidgetReady = useCallback((id: string) => {
		setReadyWidgets((prev) => {
			const next = new Set(prev);
			next.add(id);
			return next;
		});
	}, []);

	const renderWidget = useCallback(
		(widgetType: WidgetType, instanceId: string) => {
			const props = { onReady: () => handleWidgetReady(instanceId) };
			const imageWidgetIndex = IMAGE_WIDGET_IDS.indexOf(widgetType);
			if (imageWidgetIndex !== -1) {
				return <WidgetImage slotIndex={imageWidgetIndex} {...props} />;
			}

			switch (widgetType) {
				case "슬라이드 배너":
					return <WidgetSlide {...props} />;
				case "프로필":
					return <WidgetProfile {...props} />;
				case "공지":
					return <WidgetNotice {...props} />;
				case "텍스트바":
					return <WidgetMarquee {...props} />;
				case "디데이":
					return <WidgetDday {...props} />;
				case "최신글":
					return <WidgetLatestPosts {...props} />;
				case "스티커보드":
					return <WidgetStickerBoard {...props} />;
				case "날씨&시계":
					return <WidgetWeatherClock {...props} />;
				// Add other widgets here as needed
				default:
					// Unknown widgets are considered ready immediately
					setTimeout(() => handleWidgetReady(instanceId), 0);
					return (
						<div className="p-4 bg-gray-100 rounded-lg text-center w-full h-full">
							<span className="text-gray-600">{widgetType}</span>
						</div>
					);
			}
		},
		[handleWidgetReady]
	);

	if (!activeLayout.length) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg text-gray-600">표시할 위젯이 없습니다.</div>
			</div>
		);
	}

	return (
		<main className="w-full h-full flex flex-col justify-center items-center p-7">
			<section
				className={`w-full grid grid-rows-12 gap-2.5 overflow-hidden ${isMobile ? "grid-cols-8" : "grid-cols-12"
					}`}
				style={{ aspectRatio: isMobile ? "2 / 3" : "5 / 4" }}
			>
				{activeLayout.map((item) => (
					<div
						key={item.i}
						className="widget-container w-full h-full relative"
						style={{
							gridColumn: `${item.x + 1} / span ${item.w}`,
							gridRow: `${item.y + 1} / span ${item.h}`,
						}}
					>
						{/* Overlay Skeleton: Visible until ALL widgets are ready */}
						{!isAllReady && (
							<div className="absolute inset-0 z-20 transition-opacity duration-300">
								<WidgetSkeleton />
							</div>
						)}
						{/* Actual Widget */}
						<div className={`w-full h-full ${!isAllReady ? "invisible" : "animate-in fade-in zoom-in-95 duration-500"}`}>
							{renderWidget(item.i, item.i)}
						</div>
					</div>
				))}
			</section>
		</main>
	);
}
