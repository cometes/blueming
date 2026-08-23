"use client";

import { useCallback, useEffect } from "react";
import { isHttpError } from "@/shared/lib/http/client";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import { createGuestbookEntry, uploadGuestbookImages } from "@/features/guestbook/api/client";
import { useGuestbookForm } from "@/features/guestbook/hooks/useGuestbookForm";
import { useCooldown } from "@/features/guestbook/hooks/useCooldown";
import { useGuestbookList } from "@/features/guestbook/hooks/useGuestbookList";
import { useGuestbookDialog } from "@/features/guestbook/hooks/useGuestbookDialog";
import { useGuestbookSecretDialog } from "@/features/guestbook/hooks/useGuestbookSecretDialog";
import {
	useCommentImageManager,
	revokeCommentImageUrls,
} from "@/features/comment/hooks/useCommentImageManager";
import type { GuestbookEntry } from "@/features/guestbook/types";

const MAX_IMAGE_COUNT = 8;

interface UseGuestbookControllerArgs {
	initialEntries: GuestbookEntry[];
	total: number;
	pageSize: number;
}

/**
 * 방명록 페이지 오케스트레이터.
 * useGuestbookList + useGuestbookDialog + useGuestbookSecretDialog를 조합.
 */
export function useGuestbookController({
	initialEntries,
	total,
	pageSize,
}: UseGuestbookControllerArgs) {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
	const resolvedMode: "user" | "anon" = isAuthenticated ? "user" : "anon";

	// ── 하위 훅 ───────────────────────────────────────────────────────────────
	const list = useGuestbookList({ initialEntries, total, pageSize });

	const dialog = useGuestbookDialog({ onSuccess: list.loadPage });

	const secretDialog = useGuestbookSecretDialog({
		onVerified: (id, message, imageUrls) => {
			list.setEntries((prev) =>
				prev.map((entry) =>
					entry.id === id
						? {
								...entry,
								message,
								imageUrls,
								displayMessage: message,
								displayImageUrls: imageUrls,
								masked: false,
							}
						: entry,
				),
			);
		},
	});

	const form = useGuestbookForm({ mode: resolvedMode });
	const { cooldownRemaining, startCooldown } = useCooldown();

	// ── 작성 폼 이미지 매니저 ─────────────────────────────────────────────────
	const formImageManager = useCommentImageManager({ maxImageCount: MAX_IMAGE_COUNT });

	const canSubmit = form.canSubmit && cooldownRemaining === 0;

	// ── Blob URL 정리 (작성 폼) ────────────────────────────────────────────────
	useEffect(() => {
		return () => revokeCommentImageUrls(form.images);
	}, [form.images]);

	// ── 초기 로드 ─────────────────────────────────────────────────────────────
	const { loadPage } = list;
	useEffect(() => {
		if (isAuthLoading) return;
		void loadPage();
	}, [isAuthLoading, loadPage]);

	// ── 인증 상태 변경 시 폼 초기화 ──────────────────────────────────────────
	useEffect(() => {
		if (resolvedMode === "user") {
			form.setDisplayName("");
			form.setPin("");
		}
	}, [form, resolvedMode]);

	// ── 작성 ─────────────────────────────────────────────────────────────────
	const handleCreate = useCallback(async () => {
		if (!canSubmit) return;
		form.setIsSubmitting(true);
		try {
			const finalImageUrls = await formImageManager.resolveImageUrls(
				form.images,
				uploadGuestbookImages,
			);
			await createGuestbookEntry({
				message: form.message,
				mentions: form.mentions.length > 0 ? form.mentions : undefined,
				displayName: resolvedMode === "anon" ? form.displayName : undefined,
				pin: resolvedMode === "anon" ? form.pin : undefined,
				isSecret: form.isSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("저장되었습니다.");
			form.resetForm();
			startCooldown();
			list.setCurrentPage(1);
			await list.loadPage();
		} catch (error) {
			if (isHttpError(error)) {
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
	}, [canSubmit, form, formImageManager, list, resolvedMode, startCooldown]);

	// ── 작성 폼 이미지 핸들러 ────────────────────────────────────────────────
	const handleFormImageDialogOpen = useCallback(() => {
		if (!formImageManager.openDialog("create", form.images.length)) {
			toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
		}
	}, [form.images.length, formImageManager]);

	const handleFormImageUpload = useCallback(
		(url: string) => {
			if (!url) return;
			if (formImageManager.addUploadedImages(url, form.setImages)) {
				toast.success("이미지가 추가되었습니다.");
			}
		},
		[form.setImages, formImageManager],
	);

	const removeFormImage = useCallback(
		(id: string) => formImageManager.removeImage(form.setImages, id),
		[form.setImages, formImageManager],
	);

	// ── 통합 이미지 핸들러 (기존 consumer 인터페이스 유지) ───────────────────
	const removeImageFromTarget = useCallback(
		(target: "create" | "edit", id: string) => {
			if (target === "edit") {
				dialog.removeDialogImage(id);
			} else {
				removeFormImage(id);
			}
		},
		[dialog, removeFormImage],
	);

	const handleImageDialogOpen = useCallback(
		(target: "create" | "edit") => {
			if (target === "edit") {
				dialog.handleImageDialogOpen(dialog.dialogImages.length);
			} else {
				handleFormImageDialogOpen();
			}
		},
		[dialog, handleFormImageDialogOpen],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			const activeTarget = formImageManager.imageDialog.isOpen
				? "create"
				: "edit";
			if (activeTarget === "edit") {
				dialog.handleImageUpload(url);
			} else {
				handleFormImageUpload(url);
			}
		},
		[dialog, formImageManager.imageDialog.isOpen, handleFormImageUpload],
	);

	// ── return: 기존 consumer 코드와 동일한 인터페이스 유지 ──────────────────
	return {
		isAuthLoading,
		resolvedMode,
		// list
		entries: list.entries,
		totalCount: list.totalCount,
		currentPage: list.currentPage,
		setCurrentPage: list.setCurrentPage,
		totalPages: list.totalPages,
		// form
		canSubmit,
		cooldownRemaining,
		form,
		// dialog (수정/삭제)
		dialogOpen: dialog.dialogOpen,
		setDialogOpen: dialog.setDialogOpen,
		dialogMode: dialog.dialogMode,
		dialogPin: dialog.dialogPin,
		setDialogPin: dialog.setDialogPin,
		dialogMessage: dialog.dialogMessage,
		setDialogMessage: dialog.setDialogMessage,
		dialogImages: dialog.dialogImages,
		setDialogImages: dialog.setDialogImages,
		dialogSecret: dialog.dialogSecret,
		setDialogSecret: dialog.setDialogSecret,
		activeEntry: dialog.activeEntry,
		// secret dialog
		secretDialogOpen: secretDialog.secretDialogOpen,
		setSecretDialogOpen: secretDialog.setSecretDialogOpen,
		secretDialogPin: secretDialog.secretDialogPin,
		setSecretDialogPin: secretDialog.setSecretDialogPin,
		secretDialogEntry: secretDialog.secretDialogEntry,
		isVerifyingSecret: secretDialog.isVerifyingSecret,
		// 이미지
		imageDialog: formImageManager.imageDialog,
		assets: formImageManager.assets,
		maxImageCount: MAX_IMAGE_COUNT,
		// 핸들러
		handleCreate,
		handleUpdate: dialog.handleUpdate,
		handleDelete: dialog.handleDelete,
		openDialog: dialog.openDialog,
		closeDialog: dialog.closeDialog,
		handleSecretToggle: secretDialog.handleSecretToggle,
		handleVerifySecret: secretDialog.handleVerifySecret,
		closeSecretDialog: secretDialog.closeSecretDialog,
		removeImageFromTarget,
		handleImageDialogOpen,
		handleImageUpload,
	};
}
