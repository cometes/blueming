"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { STICKER_ASSET_DND_MIME } from "@/features/stickerboard-editor/model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelTopOpen, Search, X } from "lucide-react";

export function StickerBoardAssetsPanel({
	containerClassName = "mt-4",
	compactTrigger = false,
	triggerClassName,
	triggerVariant = "outline",
}: {
	containerClassName?: string;
	compactTrigger?: boolean;
	triggerClassName?: string;
	triggerVariant?: React.ComponentProps<typeof Button>["variant"];
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
	const [panelConstraints, setPanelConstraints] = useState({
		minWidth: 220,
		minHeight: 240,
	});
	const panelSizeRef = useRef(panelSize);
	const panelPositionRef = useRef(panelPosition);
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
		panelSizeRef.current = panelSize;
	}, [panelSize]);
	useEffect(() => {
		panelPositionRef.current = panelPosition;
	}, [panelPosition]);

	const clampPanelToViewport = useCallback(
		(useDefaultIfUnmoved: boolean) => {
			if (typeof window === "undefined") return;
			const margin = 30;
			const maxWidth = Math.max(1, window.innerWidth - margin * 2);
			const maxHeight = Math.max(1, window.innerHeight - margin * 2);
			const nextMinWidth = Math.min(220, maxWidth);
			const nextMinHeight = Math.min(240, maxHeight);
			setPanelConstraints({
				minWidth: nextMinWidth,
				minHeight: nextMinHeight,
			});

			const baseWidth = panelSizeRef.current.width;
			const baseHeight = panelSizeRef.current.height;
			const nextWidth = Math.min(baseWidth, maxWidth);
			const nextHeight = Math.min(baseHeight, maxHeight);
			if (nextWidth !== baseWidth || nextHeight !== baseHeight) {
				setPanelSize({ width: nextWidth, height: nextHeight });
			}

			const maxX = Math.max(margin, window.innerWidth - nextWidth - margin);
			const maxY = Math.max(margin, window.innerHeight - nextHeight - margin);
			let nextX = panelPositionRef.current.x;
			let nextY = panelPositionRef.current.y;
			if (useDefaultIfUnmoved && nextX === 24 && nextY === 120) {
				nextX = maxX;
				nextY = maxY;
			} else {
				nextX = Math.min(Math.max(nextX, margin), maxX);
				nextY = Math.min(Math.max(nextY, margin), maxY);
			}
			setPanelPosition({ x: nextX, y: nextY });
		},
		[]
	);

	useEffect(() => {
		if (!isMounted) return;
		clampPanelToViewport(true);
	}, [clampPanelToViewport, isMounted]);

	useEffect(() => {
		if (!isMounted || !isOpen) return;
		const handleResize = () => clampPanelToViewport(false);
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [clampPanelToViewport, isMounted, isOpen]);

	const panelBody = (
		<div className="rounded-card border border-card bg-card p-3 shadow-lg blur-proxy">
			<div className="asset-panel-handle flex items-center justify-between gap-2 cursor-move">
				<div className="text-xs font-semibold text-main-text">이미지 에셋</div>
				<button
					type="button"
					onClick={() => setIsOpen(false)}
					className="rounded p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100"
					aria-label="닫기"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
			<div className="mt-3">
				<Input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="에셋 검색"
					startIcon={Search}
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
					<div
						className="grid gap-1.5"
						style={{ gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))" }}
					>
						{filteredAssets.map((asset) => (
							<div
								key={asset.id}
								className="relative group rounded-card border border-card bg-background/30 overflow-hidden"
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
									title={asset.name ?? "이미지 에셋"}
									aria-label={asset.name ?? "이미지 에셋"}
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
				variant={triggerVariant}
				size={compactTrigger ? "icon" : "sm"}
				className={[
					compactTrigger ? "h-8 w-8" : undefined,
					isOpen ? "bg-stone-700 text-white" : undefined,
					triggerClassName,
				]
					.filter(Boolean)
					.join(" ")}
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
							minWidth={panelConstraints.minWidth}
							minHeight={panelConstraints.minHeight}
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
								requestAnimationFrame(() => clampPanelToViewport(false));
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
