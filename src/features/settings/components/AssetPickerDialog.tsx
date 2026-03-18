"use client";

import AssetGrid from "@/components/asset/AssetGrid";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import type { StickerAsset } from "@/features/stickerboard-editor/model";

interface AssetPickerDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	thumbnail: string;
	setThumbnail: (url: string) => void;
	onUpload: (url: string) => void;
	onFileSelect: (file: File, previewUrl: string) => void;
	assets: StickerAsset[];
	assetsLoading: boolean;
	assetsError: string | null;
	assetSearchQuery: string;
	onAssetSearchChange: (query: string) => void;
	onSelectAsset: (asset: StickerAsset) => void;
	gridTemplateColumns?: string;
	className?: string;
}

export function AssetPickerDialog({
	isOpen,
	onOpenChange,
	thumbnail,
	setThumbnail,
	onUpload,
	onFileSelect,
	assets,
	assetsLoading,
	assetsError,
	assetSearchQuery,
	onAssetSearchChange,
	onSelectAsset,
	gridTemplateColumns = "repeat(4, minmax(0, 1fr))",
	className,
}: AssetPickerDialogProps) {
	return (
		<ImageUploadDialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			thumbnail={thumbnail}
			setThumbnail={setThumbnail}
			onUpload={onUpload}
			uploadMode="deferred"
			onFileSelect={onFileSelect}
			rightContent={
				<div>
					<div className="text-xs font-semibold text-main-text mb-2">
						에셋 목록
					</div>
					<AssetGrid
						assets={assets}
						loading={assetsLoading}
						error={assetsError}
						emptyMessage="에셋이 없습니다."
						emptySearchMessage="검색 결과가 없습니다."
						selectedUrl={thumbnail}
						onSelect={onSelectAsset}
						enableSearch
						searchQuery={assetSearchQuery}
						onSearchChange={onAssetSearchChange}
						aspectClassName="aspect-square"
						imageClassName="w-full h-full object-contain"
						gridTemplateColumns={gridTemplateColumns}
						className={className}
					/>
				</div>
			}
		/>
	);
}
