"use client";

import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { STICKER_ASSET_DND_MIME } from "@/types/stickerBoard";
import { StickerRenderer } from "@/components/stickerboard-editor/StickerRenderer";

const GRID_BASE = 12;

export function StickerBoardCanvas({
	ratio,
}: {
	ratio: { w: number; h: number } | null;
}) {
	const {
		state: { groupRotatePreviewDeg, marquee },
		refs: {
			boundsRef,
			canvasRef,
			marqueeRef,
			groupTransformRef,
			interactionHistoryBaseRef,
			presentRef,
		},
		actions: {
			setSelection,
			setMarquee,
			addImageStickerAt,
			cloneDraft,
			setGroupRotatePreviewDeg,
		},
		computed: { visibleDraft, selectedGroupMeta },
	} = useStickerBoardEditorContext();

	return (
		<div className="rounded-card border border-card bg-card-bg/60 p-4 backdrop-blur-card">
			<div className="text-sm font-semibold text-main-text">캔버스</div>
			<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
				고정 폭 768px 캔버스 영역
			</p>
			<div
				ref={boundsRef}
				className="mt-4 w-full overflow-hidden rounded-card border border-card bg-card-bg p-2"
			>
				<div
					className="relative grid grid-cols-12 grid-rows-12 aspect-[5/4] w-full overflow-visible"
					onPointerDown={(e) => {
						// Start marquee selection when clicking empty area (inside canvas bounds box)
						const canvas = canvasRef.current;
						if (!canvas) {
							setSelection(new Set(), null);
							return;
						}
						const rect = canvas.getBoundingClientRect();
						if (rect.width <= 0 || rect.height <= 0) {
							setSelection(new Set(), null);
							return;
						}

						// only start marquee if clicking on the background (not a sticker)
						if (
							(e.target as HTMLElement)?.closest?.(
								'[data-sticker-root="true"]'
							)
						)
							return;

						const xPct = ((e.clientX - rect.left) / rect.width) * 100;
						const yPct = ((e.clientY - rect.top) / rect.height) * 100;
						marqueeRef.current = {
							startClientX: e.clientX,
							startClientY: e.clientY,
							startXPct: xPct,
							startYPct: yPct,
						};
						setMarquee({ xPct, yPct, widthPct: 0, heightPct: 0 });

						// If shift is not pressed, start a fresh selection
						if (!e.shiftKey) {
							setSelection(new Set(), null);
						}
					}}
				>
					{/* 12x12 grid background */}
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							backgroundImage:
								"linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
							backgroundSize: "calc(100% / 12) calc(100% / 12)",
						}}
					/>

					{/* fitted canvas (ratio) */}
					{ratio ? (
						<div
							className="relative bg-widget-bg backdrop-blur-widget rounded-widget border-widget overflow-visible shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
							style={{
								gridColumn: (() => {
									const span = Math.max(1, Math.min(GRID_BASE, ratio.w || 1));
									const start = Math.floor((GRID_BASE - span) / 2) + 1;
									return `${start} / span ${span}`;
								})(),
								gridRow: (() => {
									const span = Math.max(1, Math.min(GRID_BASE, ratio.h || 1));
									const start = Math.floor((GRID_BASE - span) / 2) + 1;
									return `${start} / span ${span}`;
								})(),
							}}
							ref={canvasRef}
							onDragOver={(e) => {
								e.preventDefault();
								e.dataTransfer.dropEffect = "copy";
							}}
							onDrop={(e) => {
								e.preventDefault();
								e.stopPropagation();
								const raw = e.dataTransfer.getData(STICKER_ASSET_DND_MIME);
								if (!raw) return;
								let payload: {
									assetId?: string;
									url?: string;
									width?: number;
									height?: number;
								} | null = null;
								try {
									payload = JSON.parse(raw);
								} catch {
									payload = null;
								}
								if (!payload?.url) return;
								const canvas = canvasRef.current;
								if (!canvas) return;
								const rect = canvas.getBoundingClientRect();
								if (rect.width <= 0 || rect.height <= 0) return;
								const centerXPct =
									((e.clientX - rect.left) / rect.width) * 100;
								const centerYPct =
									((e.clientY - rect.top) / rect.height) * 100;
								const base = cloneDraft(presentRef.current);
								void addImageStickerAt({
									url: payload.url,
									centerXPct,
									centerYPct,
									assetId: payload.assetId,
									assetWidth: payload.width,
									assetHeight: payload.height,
									historyBase: base,
								});
							}}
						>
							{/* marquee selection box */}
							{marquee && (
								<div
									className="absolute border border-blue-400/80 bg-blue-400/15"
									style={{
										left: `${marquee.xPct}%`,
										top: `${marquee.yPct}%`,
										width: `${marquee.widthPct}%`,
										height: `${marquee.heightPct}%`,
										pointerEvents: "none",
										zIndex: 9999,
									}}
								/>
							)}
							{visibleDraft.length > 0 ? (
								<>
									{visibleDraft.map((component) => (
										<StickerRenderer
											key={component.id}
											component={component}
										/>
									))}

									{/* group selection outline (single box) */}
									{selectedGroupMeta && (
										<div
											className="absolute pointer-events-none rounded-md"
											style={{
												left: `${(
													groupTransformRef.current?.kind === "rotate"
														? groupTransformRef.current.centerXPct
														: selectedGroupMeta.centerX
												).toFixed(6)}%`,
												top: `${(
													groupTransformRef.current?.kind === "rotate"
														? groupTransformRef.current.centerYPct
														: selectedGroupMeta.centerY
												).toFixed(6)}%`,
												width: `${(
													groupTransformRef.current?.kind === "rotate"
														? groupTransformRef.current.startW
														: selectedGroupMeta.w
												).toFixed(6)}%`,
												height: `${(
													groupTransformRef.current?.kind === "rotate"
														? groupTransformRef.current.startH
														: selectedGroupMeta.h
												).toFixed(6)}%`,
												outline: "2px solid rgba(59, 130, 246, 0.95)",
												outlineOffset: "-1px",
												boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
												zIndex: selectedGroupMeta.zIndex,
												transform:
													groupTransformRef.current?.kind === "rotate"
														? `translate(-50%, -50%) rotate(${(
															selectedGroupMeta.rotationDeg +
															groupRotatePreviewDeg
														).toFixed(6)}deg)`
														: `translate(-50%, -50%) rotate(${selectedGroupMeta.rotationDeg.toFixed(
															6
														)}deg)`,
												transformOrigin: "center",
											}}
										>
											{/* group transform handles */}
											<div className="absolute inset-0 pointer-events-none">
												{/* rotate handle */}
												<div
													className="absolute left-1/2 -top-6 -translate-x-1/2 pointer-events-auto"
													style={{
														cursor:
															"url(/cursor-rotate.png) 10 10, grab",
													}}
												>
													<div className="absolute left-1/2 top-3 h-3 w-px -translate-x-1/2 bg-blue-500/70" />
													<button
														type="button"
														className="h-4 w-4 rounded-full bg-blue-500 shadow-sm ring-2 ring-white"
														style={{
															cursor:
																"url(/cursor-rotate.png) 10 10, grab",
														}}
														onPointerDown={(e) => {
														e.stopPropagation();
														interactionHistoryBaseRef.current = cloneDraft(
															presentRef.current
														);
														const canvas = canvasRef.current;
														if (!canvas) return;
														const rect = canvas.getBoundingClientRect();
														if (rect.width <= 0 || rect.height <= 0) return;

														const centerClientX =
															rect.left + (selectedGroupMeta.centerX / 100) * rect.width;
														const centerClientY =
															rect.top + (selectedGroupMeta.centerY / 100) * rect.height;
														const startAngleDeg =
															(Math.atan2(
																e.clientY - centerClientY,
																e.clientX - centerClientX
															) *
																180) /
															Math.PI;

														const groupItems = selectedGroupMeta.items.filter(
															(it) => it.isLocked !== true
														);
														if (groupItems.length < 2) return;

														setGroupRotatePreviewDeg(0);
														groupTransformRef.current = {
															kind: "rotate",
															groupId: selectedGroupMeta.groupId,
															startGroupRotationDeg: selectedGroupMeta.rotationDeg ?? 0,
															startMinX: selectedGroupMeta.minX,
															startMinY: selectedGroupMeta.minY,
															startW: selectedGroupMeta.w,
															startH: selectedGroupMeta.h,
															centerXPct: selectedGroupMeta.centerX,
															centerYPct: selectedGroupMeta.centerY,
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
													}}
														aria-label="그룹 회전"
														title="그룹 회전"
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

															const groupItems = selectedGroupMeta.items.filter(
																(it) => it.isLocked !== true
															);
															if (groupItems.length < 2) return;

															const rotationDeg =
																selectedGroupMeta.rotationDeg ?? 0;
															const rad = (rotationDeg * Math.PI) / 180;
															const cos = Math.cos(rad);
															const sin = Math.sin(rad);
															const toLocal = (x: number, y: number) => {
																const dx = x - selectedGroupMeta.centerX;
																const dy = y - selectedGroupMeta.centerY;
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
																groupId: selectedGroupMeta.groupId,
																groupRotationDeg: rotationDeg,
																startCenterXPct: selectedGroupMeta.centerX,
																startCenterYPct: selectedGroupMeta.centerY,
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
														}}
														aria-label="그룹 리사이즈"
														title="그룹 리사이즈"
													/>
												))}
												</>
											</div>
										</div>
									)}
								</>
							) : (
								<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
									저장된 스티커가 없습니다.
								</div>
							)}
						</div>
					) : (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="text-center py-10">
								<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-theme-primary border-r-transparent" />
								<div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
									캔버스를 불러오는 중입니다...
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
