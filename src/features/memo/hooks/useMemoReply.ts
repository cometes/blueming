"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	createMemoReply,
	deleteMemoReply,
	updateMemoReply,
	uploadMemoImages,
} from "@/features/memo/api/client";
import {
	useCommentImageManager,
	revokeCommentImageUrls,
} from "@/features/comment/hooks/useCommentImageManager";
import { createImageId, type CommentImage } from "@/features/comment/hooks/useCommentForm";

interface UseMemoReplyArgs {
	memoId: string | undefined;
	isOwner: boolean;
	onReplyChange: () => Promise<unknown>;
}

/**
 * 메모 답글 CRUD + 이미지 관리 담당.
 */
export function useMemoReply({ memoId, isOwner, onReplyChange }: UseMemoReplyArgs) {
	// ── 답글 작성 폼 ─────────────────────────────────────────────────────────
	const [message, setMessage] = useState("");
	const [images, setImages] = useState<CommentImage[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const messageRef = useRef<HTMLTextAreaElement | null>(null);

	// ── 답글 수정 폼 ─────────────────────────────────────────────────────────
	const [isReplyEditOpen, setIsReplyEditOpen] = useState(false);
	const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
	const [replyMessage, setReplyMessage] = useState("");
	const [replyImages, setReplyImages] = useState<CommentImage[]>([]);
	const [isReplySubmitting, setIsReplySubmitting] = useState(false);

	// ── 이미지 매니저 ─────────────────────────────────────────────────────────
	const imageManager = useCommentImageManager({ maxImageCount: 4 });

	const canSubmit = isOwner && message.trim().length > 0 && !isSubmitting;

	// ── Blob URL 정리 ─────────────────────────────────────────────────────────
	useEffect(() => {
		return () => revokeCommentImageUrls(images);
	}, [images]);

	useEffect(() => {
		return () => revokeCommentImageUrls(replyImages);
	}, [replyImages]);

	// ── 공통: 이미지 업로드 후 URL 목록 해결 ─────────────────────────────────
	const resolveImages = useCallback(
		(targetImages: CommentImage[]) =>
			imageManager.resolveImageUrls(targetImages, uploadMemoImages),
		[imageManager],
	);

	// ── 이미지 다이얼로그 ─────────────────────────────────────────────────────
	const handleImageDialogOpen = useCallback(
		(target: "create" | "edit") => {
			const currentCount = target === "create" ? images.length : replyImages.length;
			if (!imageManager.openDialog(target, currentCount)) {
				toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
			}
		},
		[imageManager, images.length, replyImages.length],
	);

	const removeImage = useCallback(
		(id: string) => imageManager.removeImage(setImages, id),
		[imageManager],
	);

	const removeReplyImage = useCallback(
		(id: string) => imageManager.removeImage(setReplyImages, id),
		[imageManager],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageManager.imageDialog.target || !url) return;
			const setter =
				imageManager.imageDialog.target === "create" ? setImages : setReplyImages;
			if (imageManager.addUploadedImages(url, setter)) {
				toast.success("이미지가 추가되었습니다.");
			}
		},
		[imageManager],
	);

	// ── 텍스트 핸들러 ─────────────────────────────────────────────────────────
	const handleMessageChange = useCallback((value: string) => {
		setMessage(value);
		if (!messageRef.current) return;
		messageRef.current.style.height = "auto";
		messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
	}, []);

	// ── 답글 작성 ────────────────────────────────────────────────────────────
	const handleCreateReply = useCallback(async () => {
		if (!canSubmit || !memoId) return;
		setIsSubmitting(true);
		try {
			const finalImageUrls = await resolveImages(images);
			await createMemoReply(memoId, {
				content: message.trim(),
				imageUrls: finalImageUrls,
			});
			setMessage("");
			setImages([]);
			if (messageRef.current) messageRef.current.style.height = "auto";
			await onReplyChange();
			toast.success("답글이 추가되었습니다.");
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "답글 작성에 실패했습니다.";
			toast.error(msg);
		} finally {
			setIsSubmitting(false);
		}
	}, [canSubmit, images, memoId, message, onReplyChange, resolveImages]);

	// ── 답글 수정 ─────────────────────────────────────────────────────────────
	const openEditReply = useCallback((reply: {
		id: string;
		content: string;
		imageUrls?: string[];
	}) => {
		setEditingReplyId(reply.id);
		setReplyMessage(reply.content || "");
		setReplyImages(
			Array.isArray(reply.imageUrls)
				? reply.imageUrls.map((url) => ({ id: createImageId(), url }))
				: [],
		);
		setIsReplyEditOpen(true);
	}, []);

	const closeEditReply = useCallback(() => {
		setIsReplyEditOpen(false);
		setEditingReplyId(null);
		setReplyMessage("");
		setReplyImages([]);
	}, []);

	const handleUpdateReply = useCallback(async () => {
		if (!memoId || !editingReplyId || !replyMessage.trim()) {
			toast.error("내용을 입력해주세요.");
			return;
		}
		if (isReplySubmitting) return;
		setIsReplySubmitting(true);
		try {
			const finalImageUrls = await resolveImages(replyImages);
			await updateMemoReply(memoId, editingReplyId, {
				content: replyMessage.trim(),
				imageUrls: finalImageUrls,
			});
			await onReplyChange();
			closeEditReply();
			toast.success("답글이 수정되었습니다.");
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "답글 수정에 실패했습니다.";
			toast.error(msg);
		} finally {
			setIsReplySubmitting(false);
		}
	}, [
		closeEditReply,
		editingReplyId,
		isReplySubmitting,
		memoId,
		onReplyChange,
		replyImages,
		replyMessage,
		resolveImages,
	]);

	// ── 답글 삭제 ─────────────────────────────────────────────────────────────
	const handleDeleteReply = useCallback(
		async (replyId: string) => {
			if (!memoId) return;
			const confirmed = window.confirm("답글을 삭제할까요? 삭제 후 복구할 수 없습니다.");
			if (!confirmed) return;
			try {
				await deleteMemoReply(memoId, replyId);
				await onReplyChange();
				toast.success("답글이 삭제되었습니다.");
			} catch (error) {
				const msg =
					error instanceof Error ? error.message : "답글 삭제에 실패했습니다.";
				toast.error(msg);
			}
		},
		[memoId, onReplyChange],
	);

	return {
		// 작성 폼
		message,
		images,
		isSubmitting,
		canSubmit,
		messageRef,
		// 수정 폼
		isReplyEditOpen,
		setIsReplyEditOpen,
		editingReplyId,
		replyMessage,
		setReplyMessage,
		replyImages,
		isReplySubmitting,
		// 이미지 다이얼로그
		imageDialog: imageManager.imageDialog,
		assets: imageManager.assets,
		// 핸들러
		handleMessageChange,
		handleCreateReply,
		openEditReply,
		closeEditReply,
		handleUpdateReply,
		handleDeleteReply,
		handleImageDialogOpen,
		removeImage,
		removeReplyImage,
		handleImageUpload,
	};
}
