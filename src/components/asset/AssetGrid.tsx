/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { StickerAsset } from "@/features/stickerboard-editor/model";
import { Input } from "@/components/ui/input";

interface AssetGridProps {
	assets: StickerAsset[];
	loading?: boolean;
	error?: string | null;
	emptyMessage?: string;
	emptySearchMessage?: string;
	selectedUrl?: string;
	onSelect: (asset: StickerAsset) => void;
	enableSearch?: boolean;
	searchQuery?: string;
	onSearchChange?: (query: string) => void;
	searchPlaceholder?: string;
	gridTemplateColumns?: string;
	aspectClassName?: string;
	imageClassName?: string;
	itemClassName?: string;
	className?: string;
}

export default function AssetGrid({
	assets,
	loading = false,
	error = null,
	emptyMessage = "에셋이 없습니다.",
	emptySearchMessage = "검색 결과가 없습니다.",
	selectedUrl,
	onSelect,
	enableSearch = false,
	searchQuery,
	onSearchChange,
	searchPlaceholder = "에셋 검색...",
	gridTemplateColumns,
	aspectClassName = "aspect-square",
	imageClassName = "w-full h-full object-contain",
	itemClassName,
	className,
}: AssetGridProps) {
	const [internalQuery, setInternalQuery] = useState("");
	const isControlled = typeof onSearchChange === "function";
	const query = enableSearch
		? isControlled
			? searchQuery ?? ""
			: internalQuery
		: "";

	const filteredAssets = useMemo(() => {
		if (!query.trim()) return assets;
		const normalizedQuery = query.toLowerCase().trim().normalize("NFC");
		return assets.filter((asset) => {
			const name =
				asset.name?.trim() ||
				(() => {
					const last = asset.url.split("/").pop() || "";
					const clean = last.split("?")[0];
					try {
						return decodeURIComponent(clean);
					} catch {
						return clean;
					}
				})();
			const normalizedName = name.toLowerCase().normalize("NFC");
			const normalizedUrl = asset.url.toLowerCase().normalize("NFC");
			return (
				normalizedName.includes(normalizedQuery) ||
				normalizedUrl.includes(normalizedQuery)
			);
		});
	}, [assets, query]);

	const handleSearchChange = (value: string) => {
		if (!enableSearch) return;
		if (isControlled) {
			onSearchChange?.(value);
		} else {
			setInternalQuery(value);
		}
	};

	if (loading) {
		return (
			<div className="py-4 flex flex-col items-center justify-center text-xs text-sub-text">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-card border-r-transparent" />
				<div className="mt-2">불러오는 중...</div>
			</div>
		);
	}

	if (error) {
		return <div className="py-2 text-xs text-red-500">{error}</div>;
	}

	return (
		<div>
			{enableSearch ? (
				<div className="mb-3">
					<div className="relative">
						<Search
							size={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-sub-text"
						/>
						<Input
							type="text"
							placeholder={searchPlaceholder}
							value={query}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-9 rounded-card border-card bg-card-bg"
						/>
					</div>
				</div>
			) : null}
			{filteredAssets.length === 0 ? (
				<div className="py-4 text-center text-xs text-sub-text">
					{query.trim() ? emptySearchMessage : emptyMessage}
				</div>
			) : (
				<div
					className={cn(
						"grid gap-1 overflow-y-auto menu-modal-scroll pr-1",
						className
					)}
					style={{
						...(gridTemplateColumns ? { gridTemplateColumns } : {}),
						maxHeight: "120px",
					}}
				>
					{filteredAssets.map((asset) => {
						const assetName =
							asset.name?.trim() ||
							(() => {
								const last = asset.url.split("/").pop() || "";
								const clean = last.split("?")[0];
								try {
									return decodeURIComponent(clean);
								} catch {
									return clean;
								}
							})();
						return (
							<button
								key={asset.id}
								type="button"
								onClick={() => onSelect(asset)}
								title={assetName}
								aria-label={assetName}
								className={cn(
									"overflow-hidden rounded-card border bg-card-bg/60",
									selectedUrl === asset.url
										? "border-theme-primary"
										: "border-card",
									aspectClassName,
									itemClassName
								)}
							>
								<img
									src={asset.url}
									alt={assetName}
									className={imageClassName}
								/>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
