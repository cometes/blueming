"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { STICKER_ASSET_DND_MIME } from "@/types/stickerBoard";
import { Button } from "@/components/ui/button";
import { PanelTopOpen } from "lucide-react";

export function StickerBoardAssetsPanel({
	containerClassName = "mt-4",
	compactTrigger = false,
}: {
	containerClassName?: string;
	compactTrigger?: boolean;
}) {
	const {
		state: { assets, assetsLoading, assetsError },
		refs: { presentRef },
		actions: {
			addImageStickerAt,
			cloneDraft,
		},
	} = useStickerBoardEditorContext();
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [panelSize, setPanelSize] = useState({ width: 280, height: 360 });
	const [panelPosition, setPanelPosition] = useState({ x: 24, y: 120 });
	const filteredAssets = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return assets;
		return assets.filter((asset) => {
			const label = asset.name ?? asset.url ?? "";
			return label.toLowerCase().includes(q);
		});
	}, [assets, query]);
	useEffect(() => {
		setIsMounted(true);
	}, []);
	useEffect(() => {
		if (!isMounted) return;
		const margin = 30;
		const width = panelSize.width;
		const height = panelSize.height;
		const x = Math.max(margin, window.innerWidth - width - margin);
		const y = Math.max(margin, window.innerHeight - height - margin);
		setPanelPosition((prev) =>
			prev.x === 24 && prev.y === 120 ? { x, y } : prev
		);
	}, [isMounted, panelSize.height, panelSize.width]);

	const panelBody = (
		<div className="rounded-card border border-card bg-card-bg/90 p-3 shadow-lg blur-proxy">
			<div className="asset-panel-handle flex items-center justify-between gap-2 cursor-move">
				<div className="text-xs font-semibold text-main-text">이미지 에셋</div>
				<button
					type="button"
					onClick={() => setIsOpen(false)}
					className="rounded px-2 py-0.5 text-[11px] text-gray-600 hover:text-gray-900"
				>
					닫기
				</button>
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
												name: asset.name,
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
											assetName: asset.name,
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

	return (
		<div className={containerClassName}>
			<Button
				type="button"
				variant="outline"
				size={compactTrigger ? "icon" : "sm"}
				onClick={() => setIsOpen((prev) => !prev)}
				aria-label={isOpen ? "이미지 에셋 닫기" : "이미지 에셋 열기"}
				title={isOpen ? "이미지 에셋 닫기" : "이미지 에셋 열기"}
			>
				<PanelTopOpen className="h-4 w-4" />
				{compactTrigger ? null : (
					<span className="text-xs">
						이미지 에셋 {isOpen ? "닫기" : "열기"}
					</span>
				)}
			</Button>
			{isOpen && isMounted
				? createPortal(
						<Rnd
							size={panelSize}
							position={panelPosition}
							minWidth={220}
							minHeight={240}
							bounds="window"
							enableResizing={{
								top: true,
								right: true,
								bottom: true,
								left: true,
								topRight: true,
								bottomRight: true,
								bottomLeft: true,
								topLeft: true,
							}}
							className="fixed z-[9999]"
							dragHandleClassName="asset-panel-handle"
							onDragStop={(_e, data) => {
								setPanelPosition({ x: data.x, y: data.y });
							}}
							onResizeStop={(_e, _direction, ref, _delta, position) => {
								setPanelSize({
									width: ref.offsetWidth,
									height: ref.offsetHeight,
								});
								setPanelPosition({ x: position.x, y: position.y });
							}}
						>
							{panelBody}
						</Rnd>,
						document.body
					)
				: null}
		</div>
	);
}
