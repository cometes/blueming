"use client";

import { cn } from "@/lib/utils";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { isGroupSticker } from "@/lib/stickerboard-utils";
import type {
	StickerBoardComponent,
	StickerBoardGroupComponent,
} from "@/types/stickerBoard";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
	Eye,
	EyeOff,
	GripVertical,
	Layers,
	Lock,
	Trash2,
	Unlock,
} from "lucide-react";

export function StickerBoardLayersPanel() {
	const {
		state: { selectedId, expandedGroupIds, editingGroupId },
		refs: { interactionHistoryBaseRef, presentRef },
		actions: {
			setExpandedGroupIds,
			setSelection,
			enterGroupEdit,
			toggleVisibility,
			toggleLock,
			deleteSticker,
			reorderLayersByIndex,
			commitHistoryBase,
			cloneDraft,
		},
		computed: { layerItems },
	} = useStickerBoardEditorContext();

	const getImageName = (name?: string, url?: string) => {
		if (name?.trim()) return name.trim();
		if (!url) return "이미지";
		const clean = url.split("?")[0] ?? "";
		const last = clean.split("/").pop() ?? "";
		return last.trim() || "이미지";
	};

	const getBaseLabel = (item: StickerBoardComponent) => {
		if (isGroupSticker(item as StickerBoardGroupComponent)) {
			const group = item as StickerBoardGroupComponent;
			return group.name
				? String(group.name)
				: `그룹 (${group.children?.length ?? 0})`;
		}
		if (item.type === "text") {
			return item.text?.trim() ? item.text.trim().slice(0, 20) : "텍스트";
		}
		if (item.type === "image") {
			return getImageName(item.name, item.imageUrl);
		}
		return "스티커";
	};

	return (
		<aside className="rounded-card border-card bg-card p-4 blur-proxy">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Layers className="h-4 w-4 text-gray-500" />
					<div className="text-sm font-semibold text-main-text">레이어</div>
				</div>
				<div className="text-[11px] text-gray-500">
					{layerItems.length}개
				</div>
			</div>
			<p className="mt-2 text-xs text-gray-500">
				레이어 목록/정렬/숨김/잠금 영역
			</p>

			<div className="mt-4 space-y-1">
				{layerItems.length > 0 ? (
					<DragDropContext
						onDragStart={() => {
							interactionHistoryBaseRef.current = cloneDraft(
								presentRef.current,
							);
						}}
						onDragEnd={(result) => {
							const base = interactionHistoryBaseRef.current;
							interactionHistoryBaseRef.current = null;

							const destination = result.destination;
							if (!destination) return;
							if (destination.index === result.source.index) return;

							reorderLayersByIndex(result.source.index, destination.index);

							// Commit history as a single step
							if (base) commitHistoryBase(base);
						}}
					>
						<Droppable droppableId="stickerboard-layers">
							{(provided) => (
								<div
									ref={provided.innerRef}
									{...provided.droppableProps}
									className="space-y-1"
								>
									{(() => {
										const counts = new Map<string, number>();
										return layerItems.map((layer, index) => {
											const isSelected = selectedId === layer.id;
											const isVisible = layer.isVisible !== false;
											const isLocked = layer.isLocked === true;
											const isGroup = isGroupSticker(
												layer as StickerBoardGroupComponent,
											);
											const baseLabel = getBaseLabel(layer);
											const nextCount = (counts.get(baseLabel) ?? 0) + 1;
											counts.set(baseLabel, nextCount);
											const label = isGroup
												? baseLabel
												: nextCount > 1
													? `${baseLabel} ${nextCount}`
													: baseLabel;

											return (
												<Draggable
													key={layer.id}
													draggableId={String(layer.id)}
													index={index}
												>
													{(provided, snapshot) => (
														<div
															ref={provided.innerRef}
															{...provided.draggableProps}
															className={[
																"flex items-center gap-2 rounded-md border px-1 py-1",
																snapshot.isDragging ? "opacity-80" : "",
																isSelected
																	? "border-theme-primary bg-theme-primary "
																	: "border-card bg-card hover:bg-theme-primary/60",
															].join(" ")}
															onClick={() => {
																setSelection(new Set([layer.id]), layer.id);
															}}
															onDoubleClick={() => {
																if (!isGroup) return;
																enterGroupEdit(layer.id);
															}}
															role="button"
															tabIndex={0}
														>
															{/* drag handle */}
															<div
																className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
																onClick={(e) => e.stopPropagation()}
																{...provided.dragHandleProps}
															>
																<GripVertical className={cn("h-4 w-4", isSelected ? "text-main-text" : "")} />
															</div>

															<div className="min-w-0 flex-1">
																<div className="flex items-center gap-2">
																	{isGroup && (
																		<button
																			type="button"
																			className="p-1 -ml-1 rounded hover:bg-black/5 text-gray-500"
																			onClick={(e) => {
																				e.stopPropagation();
																				setExpandedGroupIds((prev) => {
																					const next = new Set(prev);
																					if (next.has(layer.id))
																						next.delete(layer.id);
																					else next.add(layer.id);
																					return next;
																				});
																			}}
																			aria-label="그룹 펼치기/접기"
																			title="그룹 펼치기/접기"
																		>
																			<span className="inline-block w-3 text-center">
																				{expandedGroupIds.has(layer.id)
																					? "▾"
																					: "▸"}
																			</span>
																		</button>
																	)}
																	<span
																		className="text-xs font-medium text-main-text truncate"
																		title={label}
																		aria-label={label}
																	>
																		{label}
																	</span>
																	{layer.groupId && (
																		<span className="shrink-0 rounded-full border border-gray-300/70 bg-background/50 px-1.5 py-0.5 text-[10px] leading-none text-gray-500">
																			G{String(layer.groupId).slice(-4)}
																		</span>
																	)}
																</div>
																{isGroup && expandedGroupIds.has(layer.id) && (
																	<div className="mt-1 space-y-1 pl-4">
																		{(() => {
																			const childCounts = new Map<
																				string,
																				number
																			>();
																			return (
																				(layer as StickerBoardGroupComponent)
																					.children ?? []
																			)
																				.slice()
																				.sort(
																					(
																						a: StickerBoardComponent,
																						b: StickerBoardComponent,
																					) =>
																						(b.zIndex ?? 0) - (a.zIndex ?? 0),
																				)
																				.map((child: StickerBoardComponent) => {
																					const baseChildLabel =
																						getBaseLabel(child);
																					const nextChildCount =
																						(childCounts.get(baseChildLabel) ??
																							0) + 1;
																					childCounts.set(
																						baseChildLabel,
																						nextChildCount,
																					);
																					const childLabel =
																						nextChildCount > 1
																							? `${baseChildLabel} ${nextChildCount}`
																							: baseChildLabel;
																					const isChildSelected =
																						editingGroupId === layer.id &&
																						selectedId === child.id;
																					return (
																						<div
																							key={child.id}
																							className={[
																								"flex items-center gap-2 rounded border px-2 py-1",
																								isChildSelected
																									? "border-blue-300 bg-blue-50/60"
																									: "border-transparent bg-transparent hover:bg-black/5",
																							].join(" ")}
																							onClick={(e) => {
																								e.stopPropagation();
																								enterGroupEdit(layer.id);
																								setSelection(
																									new Set([child.id]),
																									child.id,
																								);
																							}}
																							role="button"
																							tabIndex={0}
																						>
																							<span
																								className="text-[11px] text-gray-500 truncate"
																								title={childLabel}
																								aria-label={childLabel}
																							>
																								{childLabel}
																							</span>
																						</div>
																					);
																				});
																		})()}
																	</div>
																)}
															</div>

															<button
																type="button"
																className="p-1 rounded hover:bg-black/5"
																onClick={(e) => {
																	e.stopPropagation();
																	toggleVisibility(layer.id);
																}}
																aria-label={isVisible ? "숨기기" : "표시"}
																title={isVisible ? "숨기기" : "표시"}
															>
																{isVisible ? (
																	<Eye className={cn("h-4 w-4", isSelected ? "text-main-text" : "text-gray-600")} />
																) : (
																	<EyeOff className={cn("h-4 w-4", isSelected ? "text-main-text" : "text-gray-500")} />
																)}
															</button>

															<button
																type="button"
																className="p-1 rounded hover:bg-black/5"
																onClick={(e) => {
																	e.stopPropagation();
																	toggleLock(layer.id);
																}}
																aria-label={isLocked ? "잠금 해제" : "잠금"}
																title={isLocked ? "잠금 해제" : "잠금"}
															>
																{isLocked ? (
																	<Lock className={cn("h-4 w-4", isSelected ? "text-main-text" : "text-amber-600")} />
																) : (
																	<Unlock className={cn("h-4 w-4", isSelected ? "text-main-text" : "text-gray-600")} />
																)}
															</button>

															<button
																type="button"
																className={[
																	"group p-1 rounded",
																	isLocked
																		? "opacity-40 cursor-not-allowed"
																		: "hover:bg-black/5",
																].join(" ")}
																onClick={(e) => {
																	e.stopPropagation();
																	if (isLocked) return;
																	deleteSticker(layer.id);
																}}
																disabled={isLocked}
																aria-label="삭제"
																title={
																	isLocked
																		? "잠긴 스티커는 삭제할 수 없습니다"
																		: "삭제"
																}
															>
																<Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-500" />
															</button>
														</div>
													)}
												</Draggable>
											);
										});
									})()}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				) : (
					<div className="rounded-md border border-dashed border-gray-300/70 bg-background/40 p-3 text-xs text-gray-400">
						레이어가 없습니다.
					</div>
				)}
			</div>
		</aside>
	);
}
