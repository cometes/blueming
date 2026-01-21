"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { STICKER_ASSET_DND_MIME } from "@/types/stickerBoard";
import type { StickerAssetTab } from "@/types/stickerBoard";
import {
	createStickerAssetFromFile,
	deleteStickerAsset,
	setStickerAssetFavorite,
} from "@/queries/stickerAssets";
import { toast } from "sonner";
import { Star, Trash2, Upload } from "lucide-react";

export function StickerBoardAssetsPanel() {
	const {
		state: { assetTab, assets, assetsLoading, assetsError },
		refs: { presentRef },
		actions: {
			setAssetTab,
			setAssets,
			setAssetsLoading,
			setAssetsError,
			refreshAssets,
			addImageStickerAt,
			cloneDraft,
		},
	} = useStickerBoardEditorContext();

	return (
		<div className="mt-4 rounded-card border border-card bg-card-bg p-3 backdrop-blur-card">
			<div className="flex items-center justify-between gap-2">
				<div className="text-xs font-semibold text-main-text">이미지 에셋</div>
				<label className="inline-flex items-center gap-2 rounded-md border border-card bg-background/40 px-2 py-1 text-xs text-gray-700 hover:bg-background/60 cursor-pointer">
					<Upload className="h-3.5 w-3.5" />
					업로드
					<input
						type="file"
						accept="image/*"
						className="hidden"
						onChange={async (e) => {
							const file = e.target.files?.[0];
							e.target.value = "";
							if (!file) return;
							try {
								setAssetsError(null);
								setAssetsLoading(true);
								await createStickerAssetFromFile(file);
								await refreshAssets(assetTab);
							} catch (err) {
								const msg =
									err instanceof Error
										? err.message
										: "업로드에 실패했습니다.";
								toast.error(msg);
								setAssetsError(msg);
							} finally {
								setAssetsLoading(false);
							}
						}}
					/>
				</label>
			</div>

			<div className="mt-3">
				<Tabs value={assetTab} onValueChange={(v) => setAssetTab(v as StickerAssetTab)}>
					<TabsList className="w-full">
						<TabsTrigger value="all" className="flex-1 text-xs">
							전체
						</TabsTrigger>
						<TabsTrigger value="favorites" className="flex-1 text-xs">
							즐겨찾기
						</TabsTrigger>
						<TabsTrigger value="recent" className="flex-1 text-xs">
							최근
						</TabsTrigger>
					</TabsList>

					{(["all", "favorites", "recent"] as StickerAssetTab[]).map(
						(tab) => (
							<TabsContent key={tab} value={tab} className="mt-3">
								{assetsLoading ? (
									<div className="py-6 flex flex-col items-center justify-center text-xs text-gray-400">
										<div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-card border-r-transparent" />
										<div className="mt-2">불러오는 중...</div>
									</div>
								) : assetsError ? (
									<div className="py-3 text-xs text-red-500">{assetsError}</div>
								) : assets.length === 0 ? (
									<div className="py-6 text-center text-xs text-gray-400">
										에셋이 없습니다.
									</div>
								) : (
									<div className="grid grid-cols-3 gap-2">
										{assets.map((asset) => {
											const isFav = asset.favorite === true;
											return (
												<div
													key={asset.id}
													className="relative group rounded-md border border-card bg-background/30 overflow-hidden"
												>
													<button
														type="button"
														className="block w-full aspect-square"
														draggable
														onDragStart={(e) => {
															e.dataTransfer.effectAllowed = "copy";
															e.dataTransfer.setData(
																STICKER_ASSET_DND_MIME,
																JSON.stringify({
																	assetId: asset.id,
																	url: asset.url,
																	width: asset.width,
																	height: asset.height,
																}),
															);
															e.dataTransfer.setData("text/uri-list", asset.url);
														}}
														onClick={() => {
															const base = cloneDraft(presentRef.current);
															void addImageStickerAt({
																url: asset.url,
																centerXPct: 50,
																centerYPct: 50,
																assetId: asset.id,
																assetWidth: asset.width,
																assetHeight: asset.height,
																historyBase: base,
															});
														}}
														title="클릭: 가운데 추가 / 드래그: 캔버스에 드롭"
													>
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img
															src={asset.url}
															alt={asset.name ?? "asset"}
															className="h-full w-full object-cover"
														/>
													</button>

													<button
														type="button"
														className="absolute top-1 left-1 inline-flex h-7 w-7 items-center justify-center rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition"
														onClick={async (e) => {
															e.stopPropagation();
															try {
																setAssets((prev) =>
																	prev.map((a) =>
																		a.id === asset.id
																			? { ...a, favorite: !isFav }
																			: a
																	)
																);
																await setStickerAssetFavorite(asset.id, !isFav);
																if (assetTab === "favorites")
																	await refreshAssets("favorites");
															} catch (err) {
																const msg =
																	err instanceof Error
																		? err.message
																		: "즐겨찾기 변경 실패";
																toast.error(msg);
																void refreshAssets(assetTab);
															}
														}}
														aria-label="즐겨찾기"
														title="즐겨찾기"
													>
														<Star className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
													</button>

													<button
														type="button"
														className="absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition"
														onClick={async (e) => {
															e.stopPropagation();
															try {
																setAssets((prev) =>
																	prev.filter((a) => a.id !== asset.id)
																);
																await deleteStickerAsset({
																	id: asset.id,
																	storagePath: asset.storagePath,
																});
																await refreshAssets(assetTab);
															} catch (err) {
																const msg =
																	err instanceof Error
																		? err.message
																		: "삭제 실패";
																toast.error(msg);
																void refreshAssets(assetTab);
															}
														}}
														aria-label="삭제"
														title="삭제"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											);
										})}
									</div>
								)}
							</TabsContent>
						)
					)}
				</Tabs>
			</div>
		</div>
	);
}
