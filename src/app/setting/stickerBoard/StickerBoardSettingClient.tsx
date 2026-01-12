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

const isPctSticker = (
	component: StickerBoardComponent
): component is StickerBoardComponent & {
	xPct: number;
	yPct: number;
	widthPct: number;
	heightPct: number;
} => true;

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
					mixBlendMode: (component.blendMode as any) ?? "normal",
					zIndex: component.zIndex,
					transform,
					transformOrigin: "center",
				}}
			>
				{children.map((child) => renderSticker(child as any))}
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
				mixBlendMode: (component.blendMode as any) ?? "normal",
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
	const visibleCount = pctVisible.length;
	const totalCount = components.length;

	const canvasWidth = (ratio.w / CANVAS_RATIO_BASE) * 100;
	const canvasHeight = (ratio.h / CANVAS_RATIO_BASE) * 100;

	return (
		<section className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-[20px] font-semibold">스티커보드 설정</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						12x12 컨테이너 안에서 스티커보드 캔버스를 미리봅니다.
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
						<span className="inline-flex items-center rounded-full border border-card bg-background/60 px-2 py-0.5 text-gray-600 dark:text-gray-300">
							캔버스 {ratio.w}×{ratio.h}
						</span>
						<span className="inline-flex items-center rounded-full border border-card bg-background/60 px-2 py-0.5 text-gray-600 dark:text-gray-300">
							스티커 {visibleCount}/{totalCount}
						</span>
						{settings.enabled !== undefined && (
							<span
								className={[
									"inline-flex items-center rounded-full border px-2 py-0.5",
									settings.enabled
										? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
										: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
								].join(" ")}
							>
								{settings.enabled ? "노출 중" : "숨김"}
							</span>
						)}
					</div>
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

				<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
					<span>
						캔버스 비율: {ratio.w} x {ratio.h}
					</span>
					<span>· 표시 중 {visibleCount}개</span>
					{settings.maxStickers !== undefined && (
						<span>· 최대 스티커 {settings.maxStickers}개</span>
					)}
					{settings.allowGuest !== undefined && (
						<span>· 비회원 {settings.allowGuest ? "허용" : "미허용"}</span>
					)}
				</div>
			</div>
		</section>
	);
}
