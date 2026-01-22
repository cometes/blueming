"use client";

import { useMemo, useState } from "react";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { STICKER_ASSET_DND_MIME } from "@/types/stickerBoard";

export function StickerBoardAssetsPanel() {
	const {
		state: { assets, assetsLoading, assetsError },
		refs: { presentRef },
		actions: {
			addImageStickerAt,
			cloneDraft,
		},
	} = useStickerBoardEditorContext();
	const [query, setQuery] = useState("");
	const filteredAssets = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return assets;
		return assets.filter((asset) => {
			const label = asset.name ?? asset.url ?? "";
			return label.toLowerCase().includes(q);
		});
	}, [assets, query]);

	return (
		<div className="mt-4 rounded-card border border-card bg-card-bg p-3 backdrop-blur-card">
			<div className="flex items-center justify-between gap-2">
				<div className="text-xs font-semibold text-main-text">이미지 에셋</div>
			</div>
			<div className="mt-3">
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="에셋 검색"
					className="w-full rounded-md border border-card bg-background/40 px-2 py-1 text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:border-card-active"
				/>
			</div>

			<div className="mt-3">
				{assetsLoading ? (
					<div className="py-6 flex flex-col items-center justify-center text-xs text-gray-400">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-card border-r-transparent" />
						<div className="mt-2">불러오는 중...</div>
					</div>
				) : assetsError ? (
					<div className="py-3 text-xs text-red-500">{assetsError}</div>
				) : filteredAssets.length === 0 ? (
					<div className="py-6 text-center text-xs text-gray-400">
						에셋이 없습니다.
					</div>
				) : (
					<div className="grid grid-cols-3 gap-2">
						{filteredAssets.map((asset) => (
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
										className="h-full w-full object-contain"
									/>
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
