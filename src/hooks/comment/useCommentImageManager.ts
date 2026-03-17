import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { resolveUploadedImageUrls } from "@/shared/lib/http/uploads";
import { useCommentImageDialog } from "@/hooks/comment/useImageDialog";
import { useAssets } from "@/hooks/guestbook/useAssets";
import type { CommentImage } from "@/hooks/comment/useCommentForm";

interface CommentImageManagerOptions {
	maxImageCount?: number;
}

export const revokeCommentImageUrls = (images: CommentImage[]) => {
	images.forEach((image) => {
		if (image.url.startsWith("blob:")) {
			URL.revokeObjectURL(image.url);
		}
	});
};

export function useCommentImageManager(
	options: CommentImageManagerOptions = {},
) {
	const { maxImageCount = 8 } = options;
	const imageDialog = useCommentImageDialog();
	const assets = useAssets(imageDialog.isOpen);

	const removeImage = useCallback(
		(
			setter: Dispatch<SetStateAction<CommentImage[]>>,
			id: string,
		) => {
			setter((prev) => {
				const targetImage = prev.find((image) => image.id === id);
				if (targetImage?.url.startsWith("blob:")) {
					URL.revokeObjectURL(targetImage.url);
				}
				return prev.filter((image) => image.id !== id);
			});
		},
		[],
	);

	const openDialog = useCallback(
		(target: "create" | "edit", currentCount: number) =>
			imageDialog.openDialog(target, Math.min(currentCount, maxImageCount)),
		[imageDialog, maxImageCount],
	);

	const addUploadedImages = useCallback(
		(
			url: string,
			setter: Dispatch<SetStateAction<CommentImage[]>>,
		) => {
			if (!imageDialog.target || !url) return false;
			if (
				imageDialog.previewFiles.length > 0 &&
				imageDialog.previewUrls.length > 0
			) {
				return imageDialog.addImagesToTarget(setter);
			}
			imageDialog.addSingleImageToTarget(setter, url);
			return true;
		},
		[imageDialog],
	);

	const resolveImageUrls = useCallback(
		async (
			images: CommentImage[],
			uploadFn: (files: File[]) => Promise<string[]>,
		) => {
			const fileImages = images.filter((img) => img.file);
			const uploadedUrls =
				fileImages.length > 0
					? await uploadFn(fileImages.map((img) => img.file as File))
					: [];
			return resolveUploadedImageUrls(images, uploadedUrls);
		},
		[],
	);

	return {
		imageDialog,
		assets,
		openDialog,
		addUploadedImages,
		removeImage,
		resolveImageUrls,
		maxImageCount,
	};
}
