/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import type {
	StickerBoardComponent,
	StickerBoardGroupComponent,
	StickerBoardTextComponent,
} from "@/types/stickerBoard";

const isTextSticker = (
	component: StickerBoardComponent
): component is StickerBoardTextComponent =>
	(component as StickerBoardTextComponent).type === "text";

const isGroupSticker = (
	component: StickerBoardComponent
): component is StickerBoardGroupComponent =>
	(component as StickerBoardGroupComponent).type === "group";

const isPctSticker = (
	component: StickerBoardComponent
): component is StickerBoardComponent & {
	xPct: number;
	yPct: number;
	widthPct: number;
	heightPct: number;
} => typeof (component as { xPct?: unknown }).xPct === "number";

const renderSticker = (component: StickerBoardComponent) => {
	if (!isPctSticker(component) || component.isVisible === false) return null;

	const rotation = component.rotation ?? 0;
	const opacity = (component.opacity ?? 100) / 100;
	const scaleX = component.flipX ? -1 : 1;
	const scaleY = component.flipY ? -1 : 1;
	const transform = `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;

	if (isGroupSticker(component)) {
		const children = (component.children ?? [])
			.filter((c) => c.isVisible !== false)
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
		return (
			<div
				key={component.id}
				className="absolute"
				style={{
					left: `${component.xPct}%`,
					top: `${component.yPct}%`,
					width: `${component.widthPct}%`,
					height: `${component.heightPct}%`,
					opacity,
					zIndex: component.zIndex,
					transform,
					transformOrigin: "center",
					mixBlendMode: (component.blendMode as React.CSSProperties["mixBlendMode"]) ?? "normal",
				}}
			>
				{children.map((child) => renderSticker(child as StickerBoardComponent))}
			</div>
		);
	}

	return (
		<div
			key={component.id}
			className="absolute"
			style={{
				left: `${component.xPct}%`,
				top: `${component.yPct}%`,
				width: `${component.widthPct}%`,
				height: `${component.heightPct}%`,
				opacity,
				mixBlendMode: (component.blendMode as React.CSSProperties["mixBlendMode"]) ?? "normal",
				zIndex: component.zIndex,
				transform,
			}}
		>
			{isTextSticker(component) ? (
				<div
					className="w-full h-full rounded-md bg-transparent text-gray-800"
					style={{
						backgroundColor: component.style?.backgroundColor ?? "transparent",
						color: component.style?.textColor ?? "#1f2937",
						fontSize: component.style?.fontSize
							? `${component.style.fontSize}px`
							: undefined,
						fontWeight: component.style?.fontWeight,
						fontFamily: component.style?.fontFamily,
						textAlign: component.style?.textAlign,
					}}
				>
					<div className="w-full h-full px-1 py-1 text-[13px] leading-snug overflow-visible">
						<div className="w-full h-full" style={{ whiteSpace: "pre-wrap" }}>
							{component.text || " "}
						</div>
					</div>
				</div>
			) : (
				<img
					src={component.imageUrl}
					alt="sticker"
					className={[
						"w-full h-full",
						component.imageFit === "cover" ? "object-cover" : "object-contain",
					].join(" ")}
					draggable={false}
				/>
			)}
		</div>
	);
};

export default function WidgetStickerBoard() {
	const { main } = useSettings();
	const stickerBoard = main?.stickerBoard;

	const visible = useMemo(
		() =>
			(stickerBoard?.components ?? [])
				.filter((c) => c.isVisible !== false && isPctSticker(c))
				.slice()
				.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
		[stickerBoard?.components]
	);

	return (
		<div className="widget-wrapper w-full h-full">
			{/* NOTE: 메인 페이지에서는 \"위젯 자체 = 캔버스\". 12x12 내부 캔버스 생성/센터링을 하지 않습니다. */}
			<div className="relative w-full h-full">
				<div className="relative w-full h-full">
					{visible.length > 0 ? (
						visible.map((component) => renderSticker(component))
					) : (
						<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
							스티커 없음
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
