"use client";

import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import {
	isGroupSticker,
	isImageSticker,
	isPctSticker,
	isTextSticker,
} from "@/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/types/stickerBoard";

export function StickerRenderer({
	component,
}: {
	component: StickerBoardComponent;
}) {
	const {
		state: { selectedId, selectedIds },
		refs: {
			presentRef,
			selectedIdsRef,
			canvasRef,
			dragRef,
			groupDragRef,
			groupTransformRef,
			transformRef,
			interactionHistoryBaseRef,
		},
		actions: {
			setSelection,
			enterGroupEdit,
			setGroupRotatePreviewDeg,
			cloneDraft,
			getGroupMemberIds,
			toggleIds,
		},
		computed: { selectedGroupMeta, editingGroup },
	} = useStickerBoardEditorContext();

	const rotation = component.rotation ?? 0;
	const opacity = (component.opacity ?? 100) / 100;
	const scaleX = component.flipX ? -1 : 1;
	const scaleY = component.flipY ? -1 : 1;
	const transform = `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
	const isSelected = selectedId === component.id || selectedIds.has(component.id);
	const isLocked = component.isLocked === true;
	const isGroupSelected =
		!!selectedGroupMeta && selectedGroupMeta.ids.has(component.id);
	const showPerStickerOutline = isSelected && !isGroupSelected;
	const showPerStickerHandles = isSelected && !isLocked && !isGroupSelected;

	return (
		<div
			className="absolute"
			data-sticker-root="true"
			style={{
				left: `${component.xPct}%`,
				top: `${component.yPct}%`,
				width: `${component.widthPct}%`,
				height: `${component.heightPct}%`,
				opacity,
				mixBlendMode:
					(component.blendMode as React.CSSProperties["mixBlendMode"]) ??
					"normal",
				zIndex: component.zIndex,
				transform,
				touchAction: "none",
				cursor: isLocked ? "not-allowed" : "grab",
			}}
			onDoubleClick={() => {
				if (isGroupSticker(component)) {
					enterGroupEdit(component.id);
				}
			}}
			onPointerDown={(e) => {
				e.stopPropagation();
				// selection: group is treated as a single sticker in normal mode
				if (!editingGroup && isGroupSticker(component)) {
					setSelection(new Set([component.id]), component.id);
					if (component.isLocked === true) return;
					interactionHistoryBaseRef.current = cloneDraft(presentRef.current);
					dragRef.current = {
						id: component.id,
						startClientX: e.clientX,
						startClientY: e.clientY,
						startXPct: component.xPct,
						startYPct: component.yPct,
						widthPct: component.widthPct,
						heightPct: component.heightPct,
					};
					return;
				}

				// legacy multi-select (non-group objects)
				const groupIds = getGroupMemberIds(component.id);
				if (e.shiftKey) {
					const next = toggleIds(selectedIdsRef.current, groupIds);
					setSelection(next, component.id);
				} else {
					setSelection(new Set(groupIds), component.id);
				}
				if (isLocked) return;
				interactionHistoryBaseRef.current = cloneDraft(presentRef.current);
				const canvas = canvasRef.current;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return;
				// Use the same "effective selection" used above (group-aware)
				const selection = new Set(groupIds);

				if (selection.size > 1) {
					groupDragRef.current = {
						startClientX: e.clientX,
						startClientY: e.clientY,
						items: Array.from(selection)
							.map((id) => {
								const found = presentRef.current.find((c) => c.id === id);
								if (!found) return null;
								return {
									id,
									startXPct: found.xPct,
									startYPct: found.yPct,
									widthPct: found.widthPct,
									heightPct: found.heightPct,
								};
							})
							.filter(
								(item): item is NonNullable<typeof item> => item !== null
							),
					};
					return;
				}

				dragRef.current = {
					id: component.id,
					startClientX: e.clientX,
					startClientY: e.clientY,
					startXPct: component.xPct,
					startYPct: component.yPct,
					widthPct: component.widthPct,
					heightPct: component.heightPct,
				};
			}}
		>
			{/* selection outline layer */}
			<div
				className="absolute inset-0 rounded-md"
				style={{
					outline: showPerStickerOutline
						? "2px solid rgba(59, 130, 246, 0.9)"
						: isSelected
						? "none"
						: "1px solid rgba(0,0,0,0.08)",
					outlineOffset: "-1px",
					boxShadow: showPerStickerOutline
						? "0 0 0 2px rgba(59, 130, 246, 0.2)"
						: "none",
					pointerEvents: "none",
				}}
			/>
			{/* transform handles (selected only) */}
			{showPerStickerHandles && (
				<div className="absolute inset-0 pointer-events-none">
					{/* rotate handle */}
					<div
						className="absolute left-1/2 -top-6 -translate-x-1/2 pointer-events-auto"
						style={{
							cursor: "url(/cursor-rotate.png) 10 10, grab",
						}}
					>
						<div className="absolute left-1/2 top-3 h-3 w-px -translate-x-1/2 bg-blue-500/70" />
						<button
							type="button"
							className="h-4 w-4 rounded-full bg-blue-500 shadow-sm ring-2 ring-white"
							style={{
								cursor: "url(/cursor-rotate.png) 10 10, grab",
							}}
							onPointerDown={(e) => {
								e.stopPropagation();
								interactionHistoryBaseRef.current = cloneDraft(
									presentRef.current
								);
								const canvas = canvasRef.current;
								if (!canvas) return;
								const rect = canvas.getBoundingClientRect();
								const groupIds = getGroupMemberIds(component.id);
								const groupItems = presentRef.current
									.filter((c) => groupIds.includes(c.id))
									.filter(isPctSticker)
									.filter((c) => c.isLocked !== true);

								const useGroup = groupIds.length >= 2 && groupItems.length >= 2;

								const groupBBox = (() => {
									if (!useGroup) return null;
									const minX = Math.min(...groupItems.map((it) => it.xPct));
									const minY = Math.min(...groupItems.map((it) => it.yPct));
									const maxX = Math.max(
										...groupItems.map((it) => it.xPct + it.widthPct)
									);
									const maxY = Math.max(
										...groupItems.map((it) => it.yPct + it.heightPct)
									);
									return {
										centerXPct: minX + (maxX - minX) / 2,
										centerYPct: minY + (maxY - minY) / 2,
									};
								})();

								const centerXPct = useGroup
									? groupBBox!.centerXPct
									: component.xPct + component.widthPct / 2;
								const centerYPct = useGroup
									? groupBBox!.centerYPct
									: component.yPct + component.heightPct / 2;

								const centerClientX =
									rect.left + (centerXPct / 100) * rect.width;
								const centerClientY =
									rect.top + (centerYPct / 100) * rect.height;
								const startAngleDeg =
									(Math.atan2(
										e.clientY - centerClientY,
										e.clientX - centerClientX
									) *
										180) /
									Math.PI;

								if (useGroup) {
									setGroupRotatePreviewDeg(0);
									const startGroupRotationDeg =
										groupItems[0].groupRotationDeg ?? 0;
									const groupId =
										groupItems[0].groupId ?? `g_${Date.now()}`;
									const minX = Math.min(...groupItems.map((it) => it.xPct));
									const minY = Math.min(...groupItems.map((it) => it.yPct));
									const maxX = Math.max(
										...groupItems.map((it) => it.xPct + it.widthPct)
									);
									const maxY = Math.max(
										...groupItems.map((it) => it.yPct + it.heightPct)
									);
									groupTransformRef.current = {
										kind: "rotate",
										groupId,
										startGroupRotationDeg,
										startMinX: minX,
										startMinY: minY,
										startW: maxX - minX,
										startH: maxY - minY,
										centerXPct,
										centerYPct,
										centerClientX,
										centerClientY,
										startAngleDeg,
										items: groupItems.map((it) => ({
											id: it.id,
											startCenterXPct: it.xPct + it.widthPct / 2,
											startCenterYPct: it.yPct + it.heightPct / 2,
											startWidthPct: it.widthPct,
											startHeightPct: it.heightPct,
											startRotationDeg: it.rotation ?? 0,
										})),
									};
									return;
								}

								transformRef.current = {
									kind: "rotate",
									id: component.id,
									centerClientX,
									centerClientY,
									startAngleDeg,
									startRotationDeg: component.rotation ?? 0,
								};
							}}
							aria-label="회전"
							title="회전"
						/>
					</div>

					{/* resize handles */}
					<>
						{(
							[
								{
									k: "nw",
									cls: "-left-1.5 -top-1.5 cursor-nwse-resize",
								},
								{
									k: "ne",
									cls: "-right-1.5 -top-1.5 cursor-nesw-resize",
								},
								{
									k: "sw",
									cls: "-left-1.5 -bottom-1.5 cursor-nesw-resize",
								},
								{
									k: "se",
									cls: "-right-1.5 -bottom-1.5 cursor-nwse-resize",
								},
							] as const
						).map((h) => (
							<button
								key={h.k}
								type="button"
								className={[
									"absolute h-3 w-3 rounded-sm bg-white ring-2 ring-blue-500 shadow-sm pointer-events-auto",
									h.cls,
								].join(" ")}
								onPointerDown={(e) => {
									e.stopPropagation();
									interactionHistoryBaseRef.current = cloneDraft(
										presentRef.current
									);
									const groupIds = getGroupMemberIds(component.id);
									const groupItems = presentRef.current
										.filter((c) => groupIds.includes(c.id))
										.filter(isPctSticker)
										.filter((c) => c.isLocked !== true);
									const useGroup =
										groupIds.length >= 2 && groupItems.length >= 2;

									if (useGroup) {
										const groupId =
											groupItems[0].groupId ?? `g_${Date.now()}`;
										const rotationDeg =
											groupItems[0].groupRotationDeg ?? 0;
										const rad = (rotationDeg * Math.PI) / 180;
										const cos = Math.cos(rad);
										const sin = Math.sin(rad);

										const fallbackMinX = Math.min(
											...groupItems.map((it) => it.xPct)
										);
										const fallbackMinY = Math.min(
											...groupItems.map((it) => it.yPct)
										);
										const fallbackMaxX = Math.max(
											...groupItems.map((it) => it.xPct + it.widthPct)
										);
										const fallbackMaxY = Math.max(
											...groupItems.map((it) => it.yPct + it.heightPct)
										);
										const centerXPct =
											groupItems[0].groupCenterXPct ??
											fallbackMinX +
												(fallbackMaxX - fallbackMinX) / 2;
										const centerYPct =
											groupItems[0].groupCenterYPct ??
											fallbackMinY +
												(fallbackMaxY - fallbackMinY) / 2;

										const toLocal = (x: number, y: number) => {
											const dx = x - centerXPct;
											const dy = y - centerYPct;
											return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
										};

										let minLx = Infinity;
										let minLy = Infinity;
										let maxLx = -Infinity;
										let maxLy = -Infinity;
										groupItems.forEach((it) => {
											const x1 = it.xPct;
											const y1 = it.yPct;
											const x2 = it.xPct + it.widthPct;
											const y2 = it.yPct + it.heightPct;
											[
												toLocal(x1, y1),
												toLocal(x2, y1),
												toLocal(x1, y2),
												toLocal(x2, y2),
											].forEach((p) => {
												minLx = Math.min(minLx, p.x);
												minLy = Math.min(minLy, p.y);
												maxLx = Math.max(maxLx, p.x);
												maxLy = Math.max(maxLy, p.y);
											});
										});

										const anchor = (() => {
											switch (h.k) {
												case "nw":
													return { x: maxLx, y: maxLy };
												case "ne":
													return { x: minLx, y: maxLy };
												case "sw":
													return { x: maxLx, y: minLy };
												case "se":
													return { x: minLx, y: minLy };
											}
										})();
										groupTransformRef.current = {
											kind: "resize",
											groupId,
											groupRotationDeg: rotationDeg,
											startCenterXPct: centerXPct,
											startCenterYPct: centerYPct,
											anchorLocalX: anchor.x,
											anchorLocalY: anchor.y,
											startMinLocalX: minLx,
											startMinLocalY: minLy,
											startMaxLocalX: maxLx,
											startMaxLocalY: maxLy,
											handle: h.k,
											startClientX: e.clientX,
											startClientY: e.clientY,
											items: groupItems.map((it) => ({
												id: it.id,
												startCenterLocalX: toLocal(
													it.xPct + it.widthPct / 2,
													it.yPct + it.heightPct / 2
												).x,
												startCenterLocalY: toLocal(
													it.xPct + it.widthPct / 2,
													it.yPct + it.heightPct / 2
												).y,
												startWidthPct: it.widthPct,
												startHeightPct: it.heightPct,
											})),
										};
										return;
									}

									transformRef.current = {
										kind: "resize",
										id: component.id,
										handle: h.k,
										startClientX: e.clientX,
										startClientY: e.clientY,
										startXPct: component.xPct,
										startYPct: component.yPct,
										startWidthPct: component.widthPct,
										startHeightPct: component.heightPct,
										lockAspectRatio: component.lockAspectRatio === true,
									};
								}}
								aria-label="리사이즈"
								title="리사이즈"
							/>
						))}
					</>
				</div>
			)}
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
											(child.blendMode as React.CSSProperties["mixBlendMode"]) ??
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
											<div className="w-full h-full px-1 py-1 text-[13px] leading-snug overflow-hidden">
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
					<div className="w-full h-full px-1 py-1 text-[13px] leading-snug overflow-hidden">
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
