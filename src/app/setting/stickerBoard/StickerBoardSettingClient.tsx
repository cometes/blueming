/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { fitToGrid12 } from "@/lib/stickerboard";
import type {
	StickerBoardComponent,
	StickerBoardGroupComponent,
	StickerBoardSettings,
	StickerBoardTextComponent,
} from "@/types/stickerBoard";

const LAYOUT_ITEM_ID = "스티커보드";
const CANVAS_RATIO_BASE = 12;

const defaultStickerBoard: StickerBoardSettings = {
	title: "스티커보드",
	description: "스티커로 한마디를 남겨주세요.",
};

const calculateRatio = (width: number, height: number) => fitToGrid12(width, height);

const isTextSticker = (
	component: StickerBoardComponent
): component is StickerBoardTextComponent =>
	(component as StickerBoardTextComponent).type === "text";

const isGroupSticker = (
	component: StickerBoardComponent
): component is StickerBoardGroupComponent =>
	(component as StickerBoardGroupComponent).type === "group";

const isImageSticker = (
	component: StickerBoardComponent
): component is StickerBoardComponent & {
	imageUrl: string;
} => typeof (component as { imageUrl?: unknown }).imageUrl === "string";


const renderSticker = (component: StickerBoardComponent) => {
	if (component.isVisible === false) return null;

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
					mixBlendMode: (component.blendMode as React.CSSProperties["mixBlendMode"]) ?? "normal",
					zIndex: component.zIndex,
					transform,
					transformOrigin: "center",
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
			) : isImageSticker(component) ? (
				<img
					src={component.imageUrl}
					alt="sticker"
					className={[
						"w-full h-full",
						component.imageFit === "cover" ? "object-cover" : "object-contain",
					].join(" ")}
					draggable={false}
				/>
			) : (
				<div className="w-full h-full rounded-md border border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center text-[11px] text-gray-400">
					알 수 없는 스티커
				</div>
			)}
		</div>
	);
};

export default function StickerBoardSettingClient() {
	const { main } = useSettings();
	const settings = useMemo(
		() => ({
			...defaultStickerBoard,
			...(main?.stickerBoard || {}),
		}),
		[main?.stickerBoard]
	);
	const [ratio, setRatio] = useState({
		w: CANVAS_RATIO_BASE,
		h: CANVAS_RATIO_BASE,
	});

	useSettingStatus("stickerBoard", "saved");

	useEffect(() => {
		const customLayout = main?.customLayout?.layout as
			| Array<{ i: string; w: number; h: number }>
			| undefined;
		if (customLayout) {
			const stickerWidget = customLayout.find((el) => el.i === LAYOUT_ITEM_ID);
			if (stickerWidget) {
				setRatio(calculateRatio(stickerWidget.w, stickerWidget.h));
			}
		}
	}, [main?.customLayout?.layout]);

	useEffect(() => {
		const channel = new BroadcastChannel("layoutUpdated");
		channel.onmessage = (event) => {
			const layout = event.data?.layout as
				| Array<{ i: string; w: number; h: number }>
				| undefined;
			if (!layout) return;
			const stickerWidget = layout.find((el) => el.i === LAYOUT_ITEM_ID);
			if (stickerWidget) {
				setRatio(calculateRatio(stickerWidget.w, stickerWidget.h));
			}
		};
		return () => channel.close();
	}, []);

	const components = settings.components ?? [];
	const pctVisible = components.filter((c) => c.isVisible !== false);

	return (
		<section className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-[20px] font-semibold">스티커보드 설정</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						스티커보드 미리보기
					</p>
					
				</div>
				<Button asChild>
					<Link href="/setting/stickerBoard/edit">스티커보드 편집하기</Link>
				</Button>
			</div>

			<div className="section-wrap">
				<div className="relative w-full aspect-[5/4] grid grid-cols-12 grid-rows-12 rounded-card border border-card bg-card-bg overflow-visible p-2">
					<div
						className="canvas relative overflow-visible border border-widget-border rounded-widget bg-clip-padding w-full h-full"
						style={{
							gridColumn: (() => {
								const totalColumns = 12;
								const span = Math.max(1, Math.min(totalColumns, ratio.w || 1));
								const start = Math.floor((totalColumns - span) / 2) + 1;
								return `${start} / span ${span}`;
							})(),
							gridRow: `span ${Math.max(1, Math.min(12, ratio.h || 1))}`,
						}}
					>
						{pctVisible.length > 0 ? (
							pctVisible
								.slice()
								.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
								.map((component) => renderSticker(component))
						) : settings.capture ? (
							<img
								src={settings.capture}
								alt="stickerboard capture"
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
								저장된 스티커가 없습니다.
							</div>
						)}
					</div>
				</div>

				
			</div>
		</section>
	);
}
