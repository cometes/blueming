"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import {
	createMemoReply,
	deleteMemo,
	deleteMemoReply,
	fetchMemoDetail,
	updateMemo,
	updateMemoReply,
	uploadMemoImages,
} from "@/features/memo/api/client";
import type { MemoDetail } from "@/features/memo/types";
import { useAssets } from "@/features/comment/hooks/useAssets";
import { useCommentImageDialog } from "@/features/comment/hooks/useCommentImageDialog";
import { createImageId, type CommentImage } from "@/features/comment/hooks/useCommentForm";
import { resolveUploadedImageUrls } from "@/shared/lib/http/uploads";

interface UseMemoDetailControllerArgs {
	memoId: string;
	initialMemo?: MemoDetail | null;
}

export const useMemoDetailController = ({
	memoId,
	initialMemo,
}: UseMemoDetailControllerArgs) => {
	const router = useRouter();
	const { user, isLoading: isAuthLoading } = useAuthStore();
	const [memo, setMemo] = useState<MemoDetail | null>(initialMemo ?? null);
	const [isLoading, setIsLoading] = useState(!initialMemo);
	const [password, setPassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [message, setMessage] = useState("");
	const [images, setImages] = useState<CommentImage[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isReplyEditOpen, setIsReplyEditOpen] = useState(false);
	const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
	const [replyMessage, setReplyMessage] = useState("");
	const [replyImages, setReplyImages] = useState<CommentImage[]>([]);
	const [isReplySubmitting, setIsReplySubmitting] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const messageRef = useRef<HTMLTextAreaElement | null>(null);
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [imageModalIndex, setImageModalIndex] = useState(0);
	const [imageModalImages, setImageModalImages] = useState<string[]>([]);

	const imageDialog = useCommentImageDialog();
	const assets = useAssets(imageDialog.isOpen);

	const isOwner = Boolean(memo?.authorId && user?.uid === memo.authorId);
	const requiresPassword = memo?.requiresPassword === true;
	const requiresSecretAccess = memo?.requiresSecretAccess === true;
	const canSubmit = isOwner && message.trim().length > 0 && !isSubmitting;

	const loadDetail = useCallback(
		async (options: { password?: string } = {}) => {
			try {
				setIsLoading(true);
				const data = await fetchMemoDetail(memoId, {
					password: options.password,
					includeAuth: true,
				});
				setMemo(data);
				return data;
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "메모를 불러오지 못했습니다.";
				toast.error(message);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[memoId],
	);

	useEffect(() => {
		loadDetail().catch(() => undefined);
	}, [loadDetail, user?.uid]);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const handleVerifyPassword = useCallback(async () => {
		if (isVerifying) return;
		if (!password.trim()) {
			setPasswordError("비밀번호를 입력해주세요.");
			return;
		}
		setIsVerifying(true);
		setPasswordError("");
		try {
			await loadDetail({ password: password.trim() });
			setPassword("");
		} catch {
			setPasswordError("비밀번호가 올바르지 않습니다.");
		} finally {
			setIsVerifying(false);
		}
	}, [isVerifying, loadDetail, password]);

	const handleImageDialogOpen = useCallback(
		(target: "create" | "edit") => {
			const currentImages = target === "create" ? images : replyImages;
			if (currentImages.length >= 4) {
				toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
				return;
			}
			imageDialog.openDialog(target, currentImages.length);
		},
		[imageDialog, images, replyImages],
	);

	const removeImage = useCallback((id: string) => {
		setImages((prev) => {
			const targetImage = prev.find((image) => image.id === id);
			if (targetImage?.url.startsWith("blob:")) URL.revokeObjectURL(targetImage.url);
			return prev.filter((image) => image.id !== id);
		});
	}, []);

	const removeReplyImage = useCallback((id: string) => {
		setReplyImages((prev) => {
			const targetImage = prev.find((image) => image.id === id);
			if (targetImage?.url.startsWith("blob:")) URL.revokeObjectURL(targetImage.url);
			return prev.filter((image) => image.id !== id);
		});
	}, []);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;
			const isCreateTarget = imageDialog.target === "create";
			const currentImages = isCreateTarget ? images : replyImages;
			const setTargetImages = isCreateTarget ? setImages : setReplyImages;
			if (currentImages.length >= 4) {
				toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
				return;
			}
			if (imageDialog.previewFiles.length > 0 && imageDialog.previewUrls.length > 0) {
				if (imageDialog.addImagesToTarget(setTargetImages)) {
					toast.success("이미지가 추가되었습니다.");
				}
				return;
			}
			imageDialog.addSingleImageToTarget(setTargetImages, url);
			toast.success("이미지가 추가되었습니다.");
		},
		[imageDialog, images, replyImages],
	);

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

	const uploadReplyImages = useCallback(async (targetImages: CommentImage[]) => {
		const fileImages = targetImages.filter((img) => img.file);
		const uploadedUrls =
			fileImages.length > 0
				? await uploadMemoImages(fileImages.map((img) => img.file as File))
				: [];
		return resolveUploadedImageUrls(targetImages, uploadedUrls);
	}, []);

	const handleUpdateReply = useCallback(async () => {
		if (!memo?.id || !editingReplyId || !replyMessage.trim()) {
			toast.error("내용을 입력해주세요.");
			return;
		}
		if (isReplySubmitting) return;
		setIsReplySubmitting(true);
		try {
			const finalImageUrls = await uploadReplyImages(replyImages);
			await updateMemoReply(memo.id, editingReplyId, {
				content: replyMessage.trim(),
				imageUrls: finalImageUrls,
			});
			await loadDetail();
			closeEditReply();
			toast.success("답글이 수정되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "답글 수정에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsReplySubmitting(false);
		}
	}, [
		closeEditReply,
		editingReplyId,
		isReplySubmitting,
		loadDetail,
		memo?.id,
		replyImages,
		replyMessage,
		uploadReplyImages,
	]);

	const handleDeleteReply = useCallback(
		async (replyId: string) => {
			if (!memo?.id) return;
			const confirmed = window.confirm("답글을 삭제할까요? 삭제 후 복구할 수 없습니다.");
			if (!confirmed) return;
			try {
				await deleteMemoReply(memo.id, replyId);
				await loadDetail();
				toast.success("답글이 삭제되었습니다.");
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "답글 삭제에 실패했습니다.";
				toast.error(message);
			}
		},
		[loadDetail, memo?.id],
	);

	useEffect(() => {
		return () => {
			images.forEach((image) => {
				if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url);
			});
		};
	}, [images]);

	useEffect(() => {
		return () => {
			replyImages.forEach((image) => {
				if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url);
			});
		};
	}, [replyImages]);

	const openImageModal = useCallback((urls: string[], index: number) => {
		setImageModalImages(urls);
		setImageModalIndex(index);
		setIsImageModalOpen(true);
	}, []);

	const handleMessageChange = useCallback((value: string) => {
		setMessage(value);
		if (!messageRef.current) return;
		messageRef.current.style.height = "auto";
		messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
	}, []);

	const handleCreateReply = useCallback(async () => {
		if (!canSubmit || !memo?.id) return;
		setIsSubmitting(true);
		try {
			const finalImageUrls = await uploadReplyImages(images);
			await createMemoReply(memo.id, {
				content: message.trim(),
				imageUrls: finalImageUrls,
			});
			setMessage("");
			setImages([]);
			if (messageRef.current) messageRef.current.style.height = "auto";
			await loadDetail();
			toast.success("답글이 추가되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "답글 작성에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	}, [canSubmit, images, loadDetail, memo?.id, message, uploadReplyImages]);

	const handleUpdateMemo = useCallback(
		async (payload: {
			title: string;
			content: string;
			tags: string[];
			visibility: "public" | "secret" | "protected";
			password?: string;
			images: CommentImage[];
		}) => {
			if (!memo?.id) return;
			const finalImageUrls = await uploadReplyImages(payload.images);
			await updateMemo(memo.id, {
				title: payload.title,
				content: payload.content,
				tags: payload.tags,
				visibility: payload.visibility,
				password: payload.password,
				imageUrls: finalImageUrls,
			});
			await loadDetail();
			toast.success("메모가 수정되었습니다.");
		},
		[loadDetail, memo?.id, uploadReplyImages],
	);

	const handleDeleteMemo = useCallback(async () => {
		if (!memo?.id || isDeleting) return;
		const confirmed = window.confirm("메모를 삭제할까요? 삭제 후 복구할 수 없습니다.");
		if (!confirmed) return;
		setIsDeleting(true);
		try {
			await deleteMemo(memo.id);
			toast.success("메모가 삭제되었습니다.");
			router.push("/memo");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "메모 삭제에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsDeleting(false);
		}
	}, [isDeleting, memo?.id, router]);

	const replies = useMemo(() => memo?.replies ?? [], [memo?.replies]);

	return {
		router,
		user,
		isAuthLoading,
		memo,
		isLoading,
		password,
		setPassword,
		passwordError,
		isVerifying,
		message,
		images,
		isSubmitting,
		isEditOpen,
		setIsEditOpen,
		isDeleting,
		isReplyEditOpen,
		setIsReplyEditOpen,
		replyMessage,
		setReplyMessage,
		replyImages,
		isReplySubmitting,
		isMounted,
		messageRef,
		isImageModalOpen,
		setIsImageModalOpen,
		imageModalIndex,
		imageModalImages,
		imageDialog,
		assets,
		isOwner,
		requiresPassword,
		requiresSecretAccess,
		canSubmit,
		replies,
		loadDetail,
		handleVerifyPassword,
		handleImageDialogOpen,
		removeImage,
		removeReplyImage,
		handleImageUpload,
		openEditReply,
		closeEditReply,
		handleUpdateReply,
		handleDeleteReply,
		openImageModal,
		handleMessageChange,
		handleCreateReply,
		handleUpdateMemo,
		handleDeleteMemo,
	};
};
