"use client";

import { useCallback } from "react";
import type { PendingImage } from "@/features/settings/hooks/useSettingsImagePicker";

export function usePendingImageUpload<Field extends string>(
	uploadFile: (file: File) => Promise<string>,
) {
	return useCallback(
		async (pendingImages: Record<Field, PendingImage | null>) => {
			const uploadedUrls: Partial<Record<Field, string>> = {};

			for (const field of Object.keys(pendingImages) as Field[]) {
				const pending = pendingImages[field];
				if (!pending) continue;
				uploadedUrls[field] = await uploadFile(pending.file);
			}

			return uploadedUrls;
		},
		[uploadFile],
	);
}
