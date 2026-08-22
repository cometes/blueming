"use client";

import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";
import type { useSettingsImagePicker } from "@/features/settings/hooks/useSettingsImagePicker";

interface MenuAssetPickerProps<F extends string> {
	picker: ReturnType<typeof useSettingsImagePicker<F>>;
	onUpload: (url: string) => void;
}

/** useSettingsImagePicker 상태를 AssetPickerDialog에 연결하는 공통 래퍼 */
export default function MenuAssetPicker<F extends string>({
	picker,
	onUpload,
}: MenuAssetPickerProps<F>) {
	const {
		state: {
			activeField,
			dialogThumbnail,
			assets,
			assetsLoading,
			assetsError,
			assetSearchQuery,
		},
		actions: {
			setDialogThumbnail,
			setAssetSearchQuery,
			handleImageFileSelect,
			closeImageDialog,
			handleSelectAsset,
		},
	} = picker;

	return (
		<AssetPickerDialog
			isOpen={activeField !== null}
			onOpenChange={(open) => {
				if (!open) closeImageDialog();
			}}
			thumbnail={dialogThumbnail}
			setThumbnail={setDialogThumbnail}
			onUpload={onUpload}
			onFileSelect={handleImageFileSelect}
			assets={assets}
			assetsLoading={assetsLoading}
			assetsError={assetsError}
			assetSearchQuery={assetSearchQuery}
			onAssetSearchChange={setAssetSearchQuery}
			onSelectAsset={handleSelectAsset}
			className="gap-1.5"
		/>
	);
}
