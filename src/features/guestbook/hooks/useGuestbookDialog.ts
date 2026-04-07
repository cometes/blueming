"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	deleteGuestbookEntry,
	updateGuestbookEntry,
	uploadGuestbookImages,
} from "@/features/guestbook/api/client";
import {
	useCommentImageManager,
	revokeCommentImageUrls,
} from "@/features/comment/hooks/useCommentImageManager";
import type { GuestbookEntry } from "@/features/guestbook/types";
import type { GuestbookImage } from "@/features/guestbook/hooks/useGuestbookForm";

interface UseGuestbookDialogArgs {
	onSuccess: () => Promise<void>;
}

/**
 * 방명록 수정/삭제 다이얼로그 상태 + CRUD 담당.
 */
export function useGuestbookDialog({ onSuccess }: UseGuestbookDialogArgs) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");
	const [dialogPin, setDialogPin] = useState("");
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogImages, setDialogImages] = useState<GuestbookImage[]>([]);
	const [dialogSecret, setDialogSecret] = useState(false);
	const [activeEntry, setActiveEntry] = useState<GuestbookEntry | null>(null);

	const imageManager = useCommentImageManager({ maxImageCount: 8 });

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
		setActiveEntry(null);
		revokeCommentImageUrls(dialogImages);
		setDialogImages([]);
	}, [dialogImages]);

	const openDialog = useCallback(
		(entry: GuestbookEntry, modeType: "edit" | "delete") => {
			const entryImages = entry.displayImageUrls ?? entry.imageUrls ?? [];
			setActiveEntry(entry);
			setDialogMode(modeType);
			setDialogPin("");
			setDialogMessage(entry.displayMessage ?? entry.message ?? "");
			setDialogImages(
				entryImages.map((url) => ({
					id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
					url,
				})),
			);
			setDialogSecret(entry.isSecret === true);
			setDialogOpen(true);
		},
		[],
	);

	const handleUpdate = useCallback(async () => {
		if (!activeEntry || !dialogMessage.trim()) return;
		try {
			const finalImageUrls = await imageManager.resolveImageUrls(
				dialogImages,
				uploadGuestbookImages,
			);
			await updateGuestbookEntry(activeEntry.id, {
				message: dialogMessage,
				pin: activeEntry.authorType === "anon" ? dialogPin : undefined,
				isSecret: dialogSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("저장되었습니다.");
			await onSuccess();
		} catch {
			toast.error("저장에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [
		activeEntry,
		closeDialog,
		dialogImages,
		dialogMessage,
		dialogPin,
		dialogSecret,
		imageManager,
		onSuccess,
	]);

	const handleDelete = useCallback(async () => {
		if (!activeEntry) return;
		try {
			await deleteGuestbookEntry(activeEntry.id, {
				pin: activeEntry.authorType === "anon" ? dialogPin : undefined,
			});
			toast.success("삭제되었습니다.");
			await onSuccess();
		} catch {
			toast.error("삭제에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [activeEntry, closeDialog, dialogPin, onSuccess]);

	const removeDialogImage = useCallback(
		(id: string) => imageManager.removeImage(setDialogImages, id),
		[imageManager],
	);

	const handleImageDialogOpen = useCallback(
		(currentCount: number) => {
			if (!imageManager.openDialog("edit", currentCount)) {
				toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
			}
		},
		[imageManager],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!url) return;
			if (imageManager.addUploadedImages(url, setDialogImages)) {
				toast.success("이미지가 추가되었습니다.");
			}
		},
		[imageManager],
	);

	return {
		dialogOpen,
		setDialogOpen,
		dialogMode,
		dialogPin,
		setDialogPin,
		dialogMessage,
		setDialogMessage,
		dialogImages,
		setDialogImages,
		dialogSecret,
		setDialogSecret,
		activeEntry,
		imageDialog: imageManager.imageDialog,
		openDialog,
		closeDialog,
		handleUpdate,
		handleDelete,
		removeDialogImage,
		handleImageDialogOpen,
		handleImageUpload,
	};
}
