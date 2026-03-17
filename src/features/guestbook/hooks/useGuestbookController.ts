"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import {
	createGuestbookEntry,
	deleteGuestbookEntry,
	fetchGuestbookList,
	updateGuestbookEntry,
	uploadGuestbookImages,
	verifyGuestbookSecret,
} from "@/features/guestbook/api/client";
import type { GuestbookEntry } from "@/features/guestbook/types";
import {
	useGuestbookForm,
	type GuestbookImage,
} from "@/features/guestbook/hooks/useGuestbookForm";
import { useCooldown } from "@/features/guestbook/hooks/useCooldown";
import { useImageDialog } from "@/features/guestbook/hooks/useImageDialog";
import { useAssets } from "@/features/comment/hooks/useAssets";
import { resolveUploadedImageUrls } from "@/shared/lib/http/uploads";

const MAX_IMAGE_COUNT = 8;

interface UseGuestbookControllerArgs {
	initialEntries: GuestbookEntry[];
	total: number;
	pageSize: number;
}

export function useGuestbookController({
	initialEntries,
	total,
	pageSize,
}: UseGuestbookControllerArgs) {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
	const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
	const [totalCount, setTotalCount] = useState(total);
	const [currentPage, setCurrentPage] = useState(1);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");
	const [dialogPin, setDialogPin] = useState("");
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogImages, setDialogImages] = useState<GuestbookImage[]>([]);
	const [dialogSecret, setDialogSecret] = useState(false);
	const [activeEntry, setActiveEntry] = useState<GuestbookEntry | null>(null);
	const [secretDialogOpen, setSecretDialogOpen] = useState(false);
	const [secretDialogPin, setSecretDialogPin] = useState("");
	const [secretDialogEntry, setSecretDialogEntry] =
		useState<GuestbookEntry | null>(null);
	const [isVerifyingSecret, setIsVerifyingSecret] = useState(false);

	const resolvedMode: "user" | "anon" = isAuthenticated ? "user" : "anon";
	const form = useGuestbookForm({ mode: resolvedMode });
	const { cooldownRemaining, startCooldown } = useCooldown();
	const imageDialog = useImageDialog();
	const assets = useAssets(imageDialog.isOpen);
	const canSubmit = form.canSubmit && cooldownRemaining === 0;
	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	const loadPage = useCallback(async () => {
		try {
			const data = await fetchGuestbookList({
				page: currentPage,
				limit: pageSize,
			});
			setEntries(data.items);
			setTotalCount(data.total);
		} catch {
			// no-op
		}
	}, [currentPage, pageSize]);

	const uploadImages = useCallback(async (images: GuestbookImage[]) => {
		const fileImages = images.filter((image) => image.file);
		const uploadedUrls =
			fileImages.length > 0
				? await uploadGuestbookImages(
						fileImages.map((image) => image.file as File),
					)
				: [];
		return resolveUploadedImageUrls(images, uploadedUrls);
	}, []);

	const handleCreate = useCallback(async () => {
		if (!canSubmit) return;
		form.setIsSubmitting(true);
		try {
			const finalImageUrls = await uploadImages(form.images);
			await createGuestbookEntry({
				message: form.message,
				displayName: resolvedMode === "anon" ? form.displayName : undefined,
				pin: resolvedMode === "anon" ? form.pin : undefined,
				isSecret: form.isSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("저장되었습니다.");
			form.resetForm();
			startCooldown();
			setCurrentPage(1);
			await loadPage();
		} catch (error) {
			if (isAxiosError(error)) {
				const serverMessage =
					typeof error.response?.data?.error === "string"
						? error.response?.data?.error
						: null;
				if (serverMessage) {
					toast.error(serverMessage);
					return;
				}
			}
			toast.error("저장에 실패했습니다.");
		} finally {
			form.setIsSubmitting(false);
		}
	}, [canSubmit, form, loadPage, resolvedMode, startCooldown, uploadImages]);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
		setActiveEntry(null);
		dialogImages.forEach((image) => {
			if (image.url.startsWith("blob:")) {
				URL.revokeObjectURL(image.url);
			}
		});
		setDialogImages([]);
	}, [dialogImages]);

	const handleUpdate = useCallback(async () => {
		if (!activeEntry || !dialogMessage.trim()) return;
		try {
			const finalImageUrls = await uploadImages(dialogImages);
			await updateGuestbookEntry(activeEntry.id, {
				message: dialogMessage,
				pin: activeEntry.authorType === "anon" ? dialogPin : undefined,
				isSecret: dialogSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("저장되었습니다.");
			await loadPage();
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
		loadPage,
		uploadImages,
	]);

	const handleDelete = useCallback(async () => {
		if (!activeEntry) return;
		try {
			await deleteGuestbookEntry(activeEntry.id, {
				pin: activeEntry.authorType === "anon" ? dialogPin : undefined,
			});
			toast.success("삭제되었습니다.");
			await loadPage();
		} catch {
			toast.error("삭제에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [activeEntry, closeDialog, dialogPin, loadPage]);

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

	const openSecretDialog = useCallback((entry: GuestbookEntry) => {
		setSecretDialogEntry(entry);
		setSecretDialogPin("");
		setSecretDialogOpen(true);
	}, []);

	const closeSecretDialog = useCallback(() => {
		setSecretDialogOpen(false);
		setSecretDialogEntry(null);
		setSecretDialogPin("");
	}, []);

	const handleSecretToggle = useCallback(
		(entry: GuestbookEntry) => {
			if (entry.masked !== true) return;
			if (!entry.canViewSecret) return;
			openSecretDialog(entry);
		},
		[openSecretDialog],
	);

	const handleVerifySecret = useCallback(async () => {
		if (!secretDialogEntry || !/^\d{4}$/.test(secretDialogPin)) return;
		setIsVerifyingSecret(true);
		try {
			const data = await verifyGuestbookSecret(secretDialogEntry.id, {
				pin: secretDialogPin,
			});
			const resolvedImageUrls = data.imageUrls ?? [];
			setEntries((prev) =>
				prev.map((entry) =>
					entry.id === secretDialogEntry.id
						? {
								...entry,
								message: data.message ?? entry.message,
								imageUrls: resolvedImageUrls,
								displayMessage: data.message ?? entry.displayMessage ?? "",
								displayImageUrls:
									data.imageUrls ?? entry.displayImageUrls ?? [],
								masked: false,
							}
						: entry,
				),
			);
			closeSecretDialog();
		} catch {
			toast.error("비밀번호가 올바르지 않습니다.");
		} finally {
			setIsVerifyingSecret(false);
		}
	}, [closeSecretDialog, secretDialogEntry, secretDialogPin]);

	const removeImageFromTarget = useCallback(
		(target: "create" | "edit", id: string) => {
			const remove = (prev: GuestbookImage[]) => {
				const targetImage = prev.find((image) => image.id === id);
				if (targetImage?.url.startsWith("blob:")) {
					URL.revokeObjectURL(targetImage.url);
				}
				return prev.filter((image) => image.id !== id);
			};

			if (target === "edit") {
				setDialogImages(remove);
			} else {
				form.setImages(remove);
			}
		},
		[form],
	);

	const handleImageDialogOpen = useCallback(
		(target: "create" | "edit") => {
			const currentCount =
				target === "edit" ? dialogImages.length : form.images.length;
			if (!imageDialog.openDialog(target, currentCount)) {
				toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
			}
		},
		[dialogImages.length, form.images.length, imageDialog],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;
			const setter =
				imageDialog.target === "edit" ? setDialogImages : form.setImages;

			if (
				imageDialog.previewFiles.length > 0 &&
				imageDialog.previewUrls.length > 0
			) {
				if (imageDialog.addImagesToTarget(setter)) {
					toast.success("이미지가 추가되었습니다.");
				}
			} else {
				imageDialog.addSingleImageToTarget(setter, url);
				toast.success("이미지가 추가되었습니다.");
			}
		},
		[form, imageDialog],
	);

	useEffect(() => {
		if (resolvedMode === "user") {
			form.setDisplayName("");
			form.setPin("");
		}
	}, [form, resolvedMode]);

	useEffect(() => {
		if (isAuthLoading) return;
		void loadPage();
	}, [isAuthLoading, loadPage]);

	useEffect(() => {
		return () => {
			form.images.forEach((image) => {
				if (image.url.startsWith("blob:")) {
					URL.revokeObjectURL(image.url);
				}
			});
		};
	}, [form.images]);

	return {
		isAuthLoading,
		resolvedMode,
		entries,
		totalCount,
		currentPage,
		setCurrentPage,
		totalPages,
		canSubmit,
		cooldownRemaining,
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
		secretDialogOpen,
		setSecretDialogOpen,
		secretDialogPin,
		setSecretDialogPin,
		secretDialogEntry,
		isVerifyingSecret,
		form,
		imageDialog,
		assets,
		maxImageCount: MAX_IMAGE_COUNT,
		handleCreate,
		handleUpdate,
		handleDelete,
		openDialog,
		closeDialog,
		handleSecretToggle,
		handleVerifySecret,
		closeSecretDialog,
		removeImageFromTarget,
		handleImageDialogOpen,
		handleImageUpload,
	};
}
