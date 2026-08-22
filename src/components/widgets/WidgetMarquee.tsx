import { useLayoutEffect, useRef, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export default function WidgetMarquee() {
	const { main } = useSettings();
	const noticeData = main?.notice;
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const updateSize = () => {
			const { width, height } = el.getBoundingClientRect();
			setContainerSize({
				width: Math.max(0, width),
				height: Math.max(0, height),
			});
		};

		const observer = new ResizeObserver(updateSize);
		observer.observe(el);
		updateSize();

		return () => observer.disconnect();
	}, []);

	const marqueeSettings = noticeData?.marqueeSettings;
	const bannerText = noticeData?.bannerText || "";
	if (!marqueeSettings) {
		return (
			<div
				ref={containerRef}
				className="relative w-full h-full overflow-hidden bg-clip-padding"
			/>
		);
	}

	const isVertical = containerSize.height > containerSize.width;
	const thickness = Math.min(
		36,
		isVertical ? containerSize.width : containerSize.height
	);

	return (
		<div
			ref={containerRef}
			className="relative w-full h-full overflow-hidden bg-clip-padding"
		>
			<div
				className="w-full h-full flex items-center justify-center"
				style={{
					background: `linear-gradient(${isVertical ? "180deg" : "90deg"},
    rgba(255, 255, 255, 0) 0%,
    ${marqueeSettings.backgroundColor} 30%,
    ${marqueeSettings.backgroundColor} 70%,
    rgba(255, 255, 255, 0) 100%
  )`,
					width: isVertical ? `${thickness}px` : "100%",
					height: isVertical ? "100%" : `${thickness}px`,
				}}
			>
				{isVertical ? (
					<div className="marquee-vertical-track">
						<div className="marquee-vertical-segment">
							<div
								className="marquee-vertical-item"
								style={{ color: marqueeSettings.textColor }}
							>
								{bannerText}
							</div>
						</div>
						<div className="marquee-vertical-segment">
							<div
								className="marquee-vertical-item font-title"
								style={{ color: marqueeSettings.textColor }}
							>
								{bannerText}
							</div>
						</div>
					</div>
				) : (
					<div className="relative w-full h-full overflow-hidden">
						<div
							className="marquee-horizontal-track"
							style={
								{
									// 기존 라이브러리의 기본 속도(50px/s)에 맞춰 트랙 길이 기반으로 계산
									"--marquee-h-duration": `${Math.max(
										(containerSize.width * 2) / 50,
										6,
									)}s`,
								} as React.CSSProperties
							}
						>
							{[0, 1].map((segment) => (
								<div key={segment} className="marquee-horizontal-segment">
									<div
										className="min-h-6 flex items-center px-2 font-title"
										style={{ color: marqueeSettings.textColor }}
									>
										{bannerText}
									</div>
								</div>
							))}
						</div>
						{marqueeSettings.marqueeType === "컬러" && (
							<>
								<div
									aria-hidden="true"
									className="absolute inset-y-0 left-0 z-10 pointer-events-none"
									style={{
										width:
											typeof marqueeSettings.gradientWidth === "number"
												? `${marqueeSettings.gradientWidth}px`
												: marqueeSettings.gradientWidth,
										background: `linear-gradient(90deg, ${marqueeSettings.gradientColor}, transparent)`,
									}}
								/>
								<div
									aria-hidden="true"
									className="absolute inset-y-0 right-0 z-10 pointer-events-none"
									style={{
										width:
											typeof marqueeSettings.gradientWidth === "number"
												? `${marqueeSettings.gradientWidth}px`
												: marqueeSettings.gradientWidth,
										background: `linear-gradient(270deg, ${marqueeSettings.gradientColor}, transparent)`,
									}}
								/>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
