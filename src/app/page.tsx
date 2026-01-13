"use client";

import WidgetProfile from "@/components/widgets/WidgetProfile";
import WidgetDday from "@/components/widgets/WidgetDday";
import WidgetMarquee from "@/components/widgets/WidgetMarquee";
import WidgetNotice from "@/components/widgets/WidgetNotice";
import WidgetSlide from "@/components/widgets/WidgetSlide";
import WidgetLatestPosts from "@/components/widgets/WidgetLatestPosts";
import WidgetStickerBoard from "@/components/widgets/WidgetStickerBoard";
import WidgetImage from "@/components/widgets/WidgetImage";
import WidgetWeatherClock from "@/components/widgets/WidgetWeatherClock";
import { useSettings } from "@/contexts/SettingsContext";
import { useCallback } from "react";
import { useMobile } from "@/hooks/use-mobile";

type WidgetType = string;

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
	const legacyWidgets = (customLayout as { widgets?: Array<{ id: string }> })?.widgets;
	const layout = isMobile
		? customLayout?.mobileLayout || customLayout?.layout || []
		: customLayout?.layout || [];
	const widgetList = isMobile
		? customLayout?.mobileWidgets ||
		  customLayout?.desktopWidgets ||
		  legacyWidgets ||
		  []
		: customLayout?.desktopWidgets || legacyWidgets || [];
	const activeWidgetIds = new Set(widgetList.map((widget) => widget.id));
	const activeLayout = layout.filter((item) => activeWidgetIds.has(item.i));

	const renderWidget = useCallback((widgetType: WidgetType) => {
		const imageWidgetIndex = IMAGE_WIDGET_IDS.indexOf(widgetType);
		if (imageWidgetIndex !== -1) {
			return <WidgetImage slotIndex={imageWidgetIndex} />;
		}

		switch (widgetType) {
			case "슬라이드 배너":
				return <WidgetSlide />;
			case "프로필":
				return <WidgetProfile />;
			case "공지":
				return <WidgetNotice />;
			case "텍스트바":
				return <WidgetMarquee />;
			case "디데이":
				return <WidgetDday />;
		case "최신글":
			return <WidgetLatestPosts />;
		case "스티커보드":
			return <WidgetStickerBoard />;
		case "날씨&시계":
			return <WidgetWeatherClock />;
		// Add other widgets here as needed
		default:
				return (
					<div className="p-4 bg-gray-100 rounded-lg text-center w-full h-full">
						<span className="text-gray-600">{widgetType}</span>
					</div>
				);
		}
	}, []);
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
				className={`w-full grid grid-rows-12 gap-2.5 overflow-hidden ${
					isMobile ? "grid-cols-8" : "grid-cols-12"
				}`}
				style={{ aspectRatio: isMobile ? "2 / 3" : "5 / 4" }}
			>
				{activeLayout.map((item) => (
					<div
						key={item.i}
						className="widget-container w-full h-full"
						style={{
							gridColumn: `${item.x + 1} / span ${item.w}`,
							gridRow: `${item.y + 1} / span ${item.h}`,
						}}
					>
						{renderWidget(item.i)}
					</div>
				))}
			</section>
		</main>
	);
}
