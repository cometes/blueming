import { useState, useCallback, useRef } from "react";
import type { GuestbookImage } from "./useGuestbookForm";
import { createImageId } from "./useGuestbookForm";

const MAX_IMAGE_COUNT = 8;

export const useImageDialog = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [target, setTarget] = useState<"create" | "edit" | null>(null);
	const [previewUrl, setPreviewUrl] = useState("");
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [previewFiles, setPreviewFiles] = useState<File[]>([]);
	const skipPreviewRevokeRef = useRef(false);

	const revokeBlobUrl = useCallback((url: string) => {
		if (url.startsWith("blob:")) {
			URL.revokeObjectURL(url);
		}
	}, []);

	const openDialog = useCallback(
		(dialogTarget: "create" | "edit", currentCount: number) => {
			if (currentCount >= MAX_IMAGE_COUNT) {
				return false;
			}
			setTarget(dialogTarget);
			setPreviewUrl("");
			setPreviewUrls([]);
			setPreviewFiles([]);
			setIsOpen(true);
			return true;
		},
		[],
	);

	const closeDialog = useCallback(() => {
		if (!skipPreviewRevokeRef.current) {
			revokeBlobUrl(previewUrl);
			previewUrls.forEach((url) => revokeBlobUrl(url));
		}
		skipPreviewRevokeRef.current = false;
		setPreviewUrl("");
		setPreviewUrls([]);
		setPreviewFiles([]);
		setIsOpen(false);
		setTarget(null);
	}, [previewUrl, previewUrls, revokeBlobUrl]);

	const setPreview = useCallback(
		(url: string) => {
			if (!url) return;
			if (previewUrl.startsWith("blob:") && previewUrl !== url) {
				revokeBlobUrl(previewUrl);
			}
			previewUrls.forEach((pUrl) => revokeBlobUrl(pUrl));
			setPreviewUrl(url);
			setPreviewUrls([url]);
			setPreviewFiles([]);
		},
		[previewUrl, previewUrls, revokeBlobUrl],
	);

	const setMultipleFiles = useCallback(
		(files: File[], urls: string[]) => {
			if (previewUrl.startsWith("blob:")) {
				revokeBlobUrl(previewUrl);
			}
			previewUrls.forEach((pUrl) => revokeBlobUrl(pUrl));
			setPreviewUrls(urls);
			setPreviewFiles(files);
			setPreviewUrl(urls[0] ?? "");
		},
		[previewUrl, previewUrls, revokeBlobUrl],
	);

	const addImagesToTarget = useCallback(
		(
			setter: React.Dispatch<React.SetStateAction<GuestbookImage[]>>,
		): boolean => {
			if (!target) return false;

			let added = false;
			setter((prev) => {
				if (prev.length >= MAX_IMAGE_COUNT) {
					return prev;
				}

				const newImages: GuestbookImage[] = [];
				if (previewFiles.length > 0 && previewUrls.length > 0) {
					previewUrls.forEach((url, index) => {
						if (prev.length + newImages.length >= MAX_IMAGE_COUNT) return;
						const file = previewFiles[index];
						newImages.push({
							id: createImageId(),
							url,
							file,
						});
					});
				}

				if (newImages.length > 0) {
					added = true;
					skipPreviewRevokeRef.current = true;
					return [...prev, ...newImages];
				}
				return prev;
			});

			return added;
		},
		[target, previewFiles, previewUrls],
	);

	const addSingleImageToTarget = useCallback(
		(
			setter: React.Dispatch<React.SetStateAction<GuestbookImage[]>>,
			url: string,
			file?: File,
		) => {
			setter((prev) => {
				if (prev.length >= MAX_IMAGE_COUNT) {
					return prev;
				}
				skipPreviewRevokeRef.current = true;
				return [
					...prev,
					{
						id: createImageId(),
						url,
						file,
					},
				];
			});
		},
		[],
	);

	return {
		isOpen,
		target,
		previewUrl,
		previewUrls,
		previewFiles,
		openDialog,
		closeDialog,
		setPreview,
		setMultipleFiles,
		addImagesToTarget,
		addSingleImageToTarget,
		setIsOpen,
	};
};
