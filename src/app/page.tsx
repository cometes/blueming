"use client";

import dynamicImport from "next/dynamic";
import type React from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMobile } from "@/hooks/use-mobile";
import WidgetSkeleton from "@/components/widgets/WidgetSkeleton";

type WidgetType = string;
type WidgetProps = { onReady?: () => void; [key: string]: unknown };
type WidgetImporter = () => Promise<unknown>;

// Helper to wrap dynamic imports and notify when ready
// isAsyncData: true if the widget has internal data fetching it waits for
const dynamicWidget = (importer: WidgetImporter, isAsyncData = false) =>
	dynamicImport(
		async () => {
			const mod = (await importer()) as { default: React.ComponentType<WidgetProps> };
			const Component = mod.default;
			function WrappedWidget(props: WidgetProps) {
				useEffect(() => {
					// If not async (static), we are ready as soon as mounted
					if (!isAsyncData && props.onReady) {
						props.onReady();
					}
					// eslint-disable-next-line react-hooks/exhaustive-deps
				}, []);
				// If async, the component itself must call onReady
				return <Component {...props} />;
			}
			WrappedWidget.displayName = `DynamicWidget(${Component.displayName || Component.name || "Unknown"})`;
			return WrappedWidget;
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

// onReady를 호출하는 위젯 타입 목록 — 여기 없는 타입(알 수 없는 위젯)은
// ready 게이트 없이 즉시 표시한다.
const KNOWN_WIDGET_TYPES = new Set([
	"슬라이드 배너",
	"프로필",
	"공지",
	"텍스트바",
	"디데이",
	"최신글",
	"스티커보드",
	"날씨&시계",
	...IMAGE_WIDGET_IDS,
]);

export default function Home() {
	const { main } = useSettings();
	const isMobile = useMobile();
	const customLayout = main?.customLayout;
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

	// 위젯별 개별 로딩 상태 — 준비된 위젯부터 순서대로 표시한다.
	// (전역 all-or-nothing 게이트는 가장 느린 위젯(외부 API를 타는 날씨 등)이
	//  전체 그리드를 붙잡는 문제가 있어 제거. 셀 크기는 grid span으로 확정되어
	//  있고 스켈레톤이 absolute 오버레이라 개별 전환해도 레이아웃 이동은 없다.)
	const [readyWidgets, setReadyWidgets] = useState<Set<string>>(new Set());

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
					// 알 수 없는 위젯은 KNOWN_WIDGET_TYPES에 없으므로 게이트 없이 즉시 표시됨
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
				{activeLayout.map((item) => {
					const isReady =
						readyWidgets.has(item.i) || !KNOWN_WIDGET_TYPES.has(item.i);
					return (
						<div
							key={item.i}
							className="widget-container w-full h-full relative"
							style={{
								gridColumn: `${item.x + 1} / span ${item.w}`,
								gridRow: `${item.y + 1} / span ${item.h}`,
							}}
						>
							{/* Overlay Skeleton: 해당 위젯이 준비될 때까지만 표시 */}
							{!isReady && (
								<div className="absolute inset-0 z-20 transition-opacity duration-300">
									<WidgetSkeleton />
								</div>
							)}
							{/* Actual Widget */}
							<div
								className={`w-full h-full ${!isReady ? "invisible" : "animate-in fade-in duration-300"}`}
							>
								{renderWidget(item.i, item.i)}
							</div>
						</div>
					);
				})}
			</section>
		</main>
	);
}
