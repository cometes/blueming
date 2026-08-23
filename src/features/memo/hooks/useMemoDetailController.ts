"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import { deleteMemo, updateMemo, uploadMemoImages } from "@/features/memo/api/client";
import { useMemoData } from "@/features/memo/hooks/useMemoData";
import { useMemoReply } from "@/features/memo/hooks/useMemoReply";
import { useCommentImageManager } from "@/features/comment/hooks/useCommentImageManager";
import type { CommentImage } from "@/features/comment/hooks/useCommentForm";

interface UseMemoDetailControllerArgs {
	memoId: string;
	initialMemo?: import("@/features/memo/types").MemoDetail | null;
}

/**
 * 메모 상세 페이지 오케스트레이터.
 * useMemoData + useMemoReply를 조합하고, 메모 수정/삭제를 추가로 담당.
 */
export const useMemoDetailController = ({
	memoId,
	initialMemo,
}: UseMemoDetailControllerArgs) => {
	const router = useRouter();
	const { user, isLoading: isAuthLoading } = useAuthStore();
	const [isMounted, setIsMounted] = useState(false);

	// ── 이미지 뷰어 모달 상태 ─────────────────────────────────────────────────
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [imageModalIndex, setImageModalIndex] = useState(0);
	const [imageModalImages, setImageModalImages] = useState<string[]>([]);

	// ── 메모 수정 다이얼로그 ──────────────────────────────────────────────────
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// ── 하위 훅 조합 ──────────────────────────────────────────────────────────
	const memoData = useMemoData({ memoId, initialMemo });
	const isOwner = Boolean(memoData.memo?.authorId && user?.uid === memoData.memo.authorId);

	const memoReply = useMemoReply({
		memoId: memoData.memo?.id,
		isOwner,
		onReplyChange: memoData.loadDetail,
	});

	// 메모 수정 시 이미지 업로드
	const memoImageManager = useCommentImageManager({ maxImageCount: 4 });

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// ── 이미지 뷰어 ───────────────────────────────────────────────────────────
	const openImageModal = useCallback((urls: string[], index: number) => {
		setImageModalImages(urls);
		setImageModalIndex(index);
		setIsImageModalOpen(true);
	}, []);

	// ── 메모 수정 ────────────────────────────────────────────────────────────
	const handleUpdateMemo = useCallback(
		async (payload: {
			title: string;
			content: string;
			tags: string[];
			visibility: "public" | "secret" | "protected";
			password?: string;
			images: CommentImage[];
		}) => {
			if (!memoData.memo?.id) return;
			const finalImageUrls = await memoImageManager.resolveImageUrls(
				payload.images,
				uploadMemoImages,
			);
			await updateMemo(memoData.memo.id, {
				title: payload.title,
				content: payload.content,
				tags: payload.tags,
				visibility: payload.visibility,
				password: payload.password,
				imageUrls: finalImageUrls,
			});
			await memoData.loadDetail();
			toast.success("메모가 수정되었습니다.");
		},
		[memoData, memoImageManager],
	);

	// ── 메모 삭제 ────────────────────────────────────────────────────────────
	const handleDeleteMemo = useCallback(async () => {
		if (!memoData.memo?.id || isDeleting) return;
		const confirmed = window.confirm("메모를 삭제할까요? 삭제 후 복구할 수 없습니다.");
		if (!confirmed) return;
		setIsDeleting(true);
		try {
			await deleteMemo(memoData.memo.id);
			toast.success("메모가 삭제되었습니다.");
			router.push("/memo");
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "메모 삭제에 실패했습니다.";
			toast.error(msg);
		} finally {
			setIsDeleting(false);
		}
	}, [isDeleting, memoData.memo?.id, router]);

	const replies = useMemo(() => memoData.memo?.replies ?? [], [memoData.memo?.replies]);

	// ── return: 기존 consumer 코드와 동일한 인터페이스 유지 ──────────────────
	return {
		router,
		user,
		isAuthLoading,
		isMounted,
		// memoData
		memo: memoData.memo,
		isLoading: memoData.isLoading,
		password: memoData.password,
		setPassword: memoData.setPassword,
		passwordError: memoData.passwordError,
		isVerifying: memoData.isVerifying,
		requiresPassword: memoData.requiresPassword,
		requiresSecretAccess: memoData.requiresSecretAccess,
		loadDetail: memoData.loadDetail,
		handleVerifyPassword: memoData.handleVerifyPassword,
		// memoReply
		message: memoReply.message,
		mentions: memoReply.mentions,
		setMentions: memoReply.setMentions,
		images: memoReply.images,
		isSubmitting: memoReply.isSubmitting,
		canSubmit: memoReply.canSubmit,
		messageRef: memoReply.messageRef,
		isReplyEditOpen: memoReply.isReplyEditOpen,
		setIsReplyEditOpen: memoReply.setIsReplyEditOpen,
		replyMessage: memoReply.replyMessage,
		setReplyMessage: memoReply.setReplyMessage,
		replyImages: memoReply.replyImages,
		isReplySubmitting: memoReply.isReplySubmitting,
		imageDialog: memoReply.imageDialog,
		assets: memoReply.assets,
		handleMessageChange: memoReply.handleMessageChange,
		handleCreateReply: memoReply.handleCreateReply,
		openEditReply: memoReply.openEditReply,
		closeEditReply: memoReply.closeEditReply,
		handleUpdateReply: memoReply.handleUpdateReply,
		handleDeleteReply: memoReply.handleDeleteReply,
		handleImageDialogOpen: memoReply.handleImageDialogOpen,
		removeImage: memoReply.removeImage,
		removeReplyImage: memoReply.removeReplyImage,
		handleImageUpload: memoReply.handleImageUpload,
		// 메모 수정/삭제
		isEditOpen,
		setIsEditOpen,
		isDeleting,
		isOwner,
		replies,
		handleUpdateMemo,
		handleDeleteMemo,
		// 이미지 뷰어
		isImageModalOpen,
		setIsImageModalOpen,
		imageModalIndex,
		imageModalImages,
		openImageModal,
	};
};
