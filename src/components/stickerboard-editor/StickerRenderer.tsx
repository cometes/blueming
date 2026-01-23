"use client";

import type { CSSProperties } from "react";
import { isGroupSticker, isImageSticker, isTextSticker } from "@/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/types/stickerBoard";

export function StickerRenderer({
	component,
	onDoubleClick,
	isEditing,
}: {
	component: StickerBoardComponent;
	onDoubleClick?: () => void;
	isEditing?: boolean;
}) {
	// 편집 중인 텍스트 스티커는 숨김 (textarea가 대신 표시됨)
	if (isEditing && isTextSticker(component)) {
		return null;
	}
	const rotation = component.rotation ?? 0;
	const opacity = (component.opacity ?? 100) / 100;
	const scaleX = component.flipX ? -1 : 1;
	const scaleY = component.flipY ? -1 : 1;
	const transform = `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
	const isLocked = component.isLocked === true;

	return (
		<div
			className="absolute sticker-item"
			data-sticker-id={component.id}
			data-sticker-root="true"
			data-sticker-locked={isLocked ? "true" : "false"}
			data-sticker-flip-x={component.flipX ? "true" : "false"}
			data-sticker-flip-y={component.flipY ? "true" : "false"}
			onDoubleClick={onDoubleClick}
			style={{
				left: `${component.xPct}%`,
				top: `${component.yPct}%`,
				width: `${component.widthPct}%`,
				height: `${component.heightPct}%`,
				opacity,
				mixBlendMode:
					(component.blendMode as CSSProperties["mixBlendMode"]) ??
					"normal",
				zIndex: component.zIndex,
				transform,
				touchAction: "none",
				cursor: isLocked ? "not-allowed" : "grab",
			}}
		>
			{/* selection outline layer */}
			<div
				className="absolute inset-0 rounded-md"
				style={{
					boxSizing: "border-box",
					border: "1px solid rgba(0,0,0,0.08)",
					boxShadow: "none",
					pointerEvents: "none",
				}}
			/>
			{isGroupSticker(component) ? (
				<div className="relative w-full h-full">
					{(component.children ?? [])
						.filter((c) => c.isVisible !== false)
						.slice()
						.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
						.map((child) => {
							const childRotation = child.rotation ?? 0;
							const childOpacity = (child.opacity ?? 100) / 100;
							const childScaleX = child.flipX ? -1 : 1;
							const childScaleY = child.flipY ? -1 : 1;
							const childTransform = `rotate(${childRotation}deg) scaleX(${childScaleX}) scaleY(${childScaleY})`;
							return (
								<div
									key={child.id}
									className="absolute"
									style={{
										left: `${child.xPct}%`,
										top: `${child.yPct}%`,
										width: `${child.widthPct}%`,
										height: `${child.heightPct}%`,
										opacity: childOpacity,
										mixBlendMode:
											(child.blendMode as CSSProperties["mixBlendMode"]) ??
											"normal",
										zIndex: child.zIndex,
										transform: childTransform,
									}}
								>
									{child.type === "text" ? (
										<div
											className="w-full h-full rounded-md bg-transparent text-gray-800"
											style={{
												backgroundColor:
													child.style?.backgroundColor ?? "transparent",
												color: child.style?.textColor ?? "#1f2937",
												fontSize: child.style?.fontSize
													? `${child.style.fontSize}px`
													: undefined,
												fontWeight: child.style?.fontWeight,
												fontFamily: child.style?.fontFamily,
												textAlign: child.style?.textAlign,
											}}
										>
											<div className="w-full h-full px-0 py-1 text-[13px] leading-snug overflow-hidden">
												<div
													className="w-full h-full"
													style={{ whiteSpace: "pre-wrap" }}
												>
													{child.text || " "}
												</div>
											</div>
										</div>
									) : child.type === "image" ? (
										<img
											src={child.imageUrl}
											alt="sticker"
											className={[
												"w-full h-full",
												child.imageFit === "cover"
													? "object-cover"
													: "object-contain",
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
						})}
				</div>
			) : isTextSticker(component) ? (
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
					<div className="w-full h-full px-0 py-1 text-[13px] leading-snug overflow-hidden">
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
}
