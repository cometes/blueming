"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
	createComment,
	deleteComment,
	fetchCommentList,
	uploadCommentImages,
	updateComment,
	verifyCommentSecret,
} from "@/features/library/api/comments";
import CommentEditDialog from "@/components/comment/CommentEditDialog";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import { createImageId, type CommentImage } from "@/features/comment/hooks/useCommentForm";
import {
	revokeCommentImageUrls,
	useCommentImageManager,
} from "@/features/comment/hooks/useCommentImageManager";
import type { LibraryComment as Comment } from "@/features/library/types";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

interface CommentSidebarProps {
	postId: string;
}

const MAX_IMAGE_COUNT = 8;
const DEFAULT_PAGE_SIZE = 20;

export default function CommentSidebar({ postId }: CommentSidebarProps) {
	const { isLoading: isAuthLoading, isAuthenticated } = useAuthStore();
	const [comments, setComments] = useState<Comment[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [hasMore, setHasMore] = useState(false);
	const cooldownRemaining = 0;
	const resolvedMode: "user" | "anon" = isAuthenticated ? "user" : "anon";

	const [displayName, setDisplayName] = useState("");
	const [pin, setPin] = useState("");
	const [message, setMessage] = useState("");
	const [images, setImages] = useState<CommentImage[]>([]);
	const [isSecret, setIsSecret] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");
	const [dialogPin, setDialogPin] = useState("");
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogSecret, setDialogSecret] = useState(false);
	const [dialogImages, setDialogImages] = useState<CommentImage[]>([]);
	const [activeComment, setActiveComment] = useState<Comment | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const imageManager = useCommentImageManager({
		maxImageCount: MAX_IMAGE_COUNT,
	});
	const { imageDialog, assets } = imageManager;

	const loadComments = useCallback(
		async (page: number = 1, append: boolean = false) => {
			try {
				setIsLoading(true);
				const data = await fetchCommentList(postId, {
					page,
					limit: DEFAULT_PAGE_SIZE,
				});
				if (append) {
					setComments((prev) => [...prev, ...data.items]);
				} else {
					setComments(data.items);
				}
				setTotalCount(data.total);
				setHasMore(page * DEFAULT_PAGE_SIZE < data.total);
			} catch (error) {
				console.error("Failed to load comments:", error);
				toast.error("댓글을 불러오지 못했습니다.");
			} finally {
				setIsLoading(false);
			}
		},
		[postId],
	);

	useEffect(() => {
		if (isAuthLoading) return;
		loadComments(1);
	}, [isAuthLoading, loadComments]);

	useEffect(() => {
		if (resolvedMode === "user") {
			setDisplayName("");
			setPin("");
		}
	}, [resolvedMode]);

	useEffect(() => {
		return () => {
			revokeCommentImageUrls(images);
		};
	}, [images]);

	const handleToggleSecret = useCallback(
		async (comment: Comment, pinValue: string) => {
			if (comment.masked !== true) return;
			if (!comment.canViewSecret) return;
			if (!/^\d{4}$/.test(pinValue)) return;
			try {
				const data = await verifyCommentSecret(postId, comment.id, {
					pin: pinValue,
				});
				setComments((prev) =>
					prev.map((item) =>
						item.id === comment.id
							? {
									...item,
									message: data.message ?? item.message,
									imageUrls: data.imageUrls ?? item.imageUrls ?? [],
									displayMessage: data.message ?? item.displayMessage ?? "",
									displayImageUrls:
										data.imageUrls ?? item.displayImageUrls ?? [],
									masked: false,
								}
							: item,
					),
				);
			} catch {
				toast.error("비밀번호가 올바르지 않습니다.");
			}
		},
		[postId],
	);

	const openDialog = useCallback(
		(comment: Comment, modeType: "edit" | "delete") => {
			const commentImages =
				comment.displayImageUrls ?? comment.imageUrls ?? [];
			setActiveComment(comment);
			setDialogMode(modeType);
			setDialogPin("");
			setDialogMessage(comment.displayMessage ?? comment.message ?? "");
			setDialogSecret(comment.isSecret === true);
			setDialogImages(
				commentImages.map((url) => ({
					id: createImageId(),
					url,
				})),
			);
			setDialogOpen(true);
		},
		[],
	);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
		setActiveComment(null);
		revokeCommentImageUrls(dialogImages);
		setDialogImages([]);
	}, [dialogImages]);

	const handleDialogOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				closeDialog();
				return;
			}
			setDialogOpen(true);
		},
		[closeDialog],
	);

	const canSubmit = useMemo(() => {
		if (!message.trim()) return false;
		if (resolvedMode === "anon") {
			return displayName.trim().length > 0 && /^\d{4}$/.test(pin);
		}
		return true;
	}, [displayName, message, pin, resolvedMode]);

	const handleCreate = useCallback(async () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		try {
			const finalImageUrls = await imageManager.resolveImageUrls(
				images,
				uploadCommentImages,
			);
			await createComment(postId, {
				message,
				displayName: resolvedMode === "anon" ? displayName : undefined,
				pin: resolvedMode === "anon" ? pin : undefined,
				isSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("댓글이 등록되었습니다.");
			setMessage("");
			setIsSecret(false);
			revokeCommentImageUrls(images);
			setImages([]);
			if (resolvedMode === "anon") {
				setDisplayName("");
				setPin("");
			}
			setCurrentPage(1);
			await loadComments(1);
			if (scrollContainerRef.current) {
				scrollContainerRef.current.scrollTop = 0;
			}
		} catch (error) {
			console.error("Failed to create comment:", error);
			toast.error("댓글 등록에 실패했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	}, [
		canSubmit,
		displayName,
		isSecret,
		imageManager,
		loadComments,
		message,
		images,
		pin,
		postId,
		resolvedMode,
	]);

	const handleUpdate = useCallback(async () => {
		if (!activeComment || !dialogMessage.trim()) return;
		try {
			const finalImageUrls = await imageManager.resolveImageUrls(
				dialogImages,
				uploadCommentImages,
			);
			await updateComment(postId, activeComment.id, {
				message: dialogMessage,
				pin: activeComment.authorType === "anon" ? dialogPin : undefined,
				isSecret: dialogSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("댓글이 수정되었습니다.");
			await loadComments(1);
		} catch (error) {
			console.error("Failed to update comment:", error);
			toast.error("댓글 수정에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [
		activeComment,
		closeDialog,
		dialogImages,
		dialogMessage,
		dialogPin,
		dialogSecret,
		imageManager,
		loadComments,
		postId,
	]);

	const handleDelete = useCallback(async () => {
		if (!activeComment) return;
		try {
			await deleteComment(postId, activeComment.id, {
				pin: activeComment.authorType === "anon" ? dialogPin : undefined,
			});
			toast.success("댓글이 삭제되었습니다.");
			await loadComments(1);
		} catch (error) {
			console.error("Failed to delete comment:", error);
			toast.error("댓글 삭제에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [activeComment, closeDialog, dialogPin, loadComments, postId]);

	const removeImageFromTarget = useCallback(
		(target: "create" | "edit", id: string) => {
			const setter = target === "edit" ? setDialogImages : setImages;
			imageManager.removeImage(setter, id);
		},
		[imageManager],
	);

	const handleImageDialogOpen = useCallback(
		(target: "create" | "edit") => {
			const currentCount =
				target === "edit" ? dialogImages.length : images.length;
			if (!imageManager.openDialog(target, currentCount)) {
				toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
			}
		},
		[dialogImages.length, imageManager, images.length],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;
			const setter =
				imageDialog.target === "edit" ? setDialogImages : setImages;
			if (imageManager.addUploadedImages(url, setter)) {
				toast.success("이미지가 추가되었습니다.");
			}
		},
		[imageDialog.target, imageManager],
	);

	const handleLoadMore = useCallback(() => {
		if (!hasMore || isLoading) return;
		const nextPage = currentPage + 1;
		setCurrentPage(nextPage);
		loadComments(nextPage, true);
	}, [currentPage, hasMore, isLoading, loadComments]);

	return (
		<div className="flex flex-col h-full">
			{/* 헤더 */}
			<div className="flex items-center gap-2 p-4 border-b border-card-border">
				<MessageCircle size={18} className="text-theme-primary" />
				<h3 className="text-main-text font-semibold">
					댓글 {totalCount > 0 && `(${totalCount})`}
				</h3>
			</div>

			{/* 댓글 목록 */}
			<div
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto p-4 space-y-1"
			>
				<CommentList
					comments={comments}
					isLoading={isLoading}
					hasMore={hasMore}
					onLoadMore={handleLoadMore}
					onToggleSecret={handleToggleSecret}
					onEdit={(comment) => openDialog(comment, "edit")}
					onDelete={(comment) => openDialog(comment, "delete")}
				/>
			</div>

			<CommentForm
				isAuthLoading={isAuthLoading}
				resolvedMode={resolvedMode}
				displayName={displayName}
				onDisplayNameChange={setDisplayName}
				pin={pin}
				onPinChange={setPin}
				message={message}
				onMessageChange={setMessage}
				isSecret={isSecret}
				onIsSecretChange={setIsSecret}
				images={images}
				isSubmitting={isSubmitting}
				canSubmit={canSubmit}
				cooldownRemaining={cooldownRemaining}
				onSubmit={handleCreate}
				onOpenImageDialog={() => handleImageDialogOpen("create")}
				onRemoveImage={(id) => removeImageFromTarget("create", id)}
			/>

			<CommentEditDialog
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
				mode={dialogMode}
				isAnon={activeComment?.authorType === "anon"}
				isAdmin={activeComment?.isAdmin === true}
				dialogPin={dialogPin}
				onDialogPinChange={setDialogPin}
				dialogMessage={dialogMessage}
				onDialogMessageChange={setDialogMessage}
				dialogSecret={dialogSecret}
				onDialogSecretChange={setDialogSecret}
				dialogImages={dialogImages}
				onRemoveDialogImage={(id) => removeImageFromTarget("edit", id)}
				onOpenImageDialog={() => handleImageDialogOpen("edit")}
				onClose={closeDialog}
				onConfirm={dialogMode === "edit" ? handleUpdate : handleDelete}
			/>
			<ImageUploadDialog
				isOpen={imageDialog.isOpen}
				onOpenChange={(open) => {
					if (!open) {
						imageDialog.closeDialog();
						return;
					}
					imageDialog.setIsOpen(true);
				}}
				thumbnail={imageDialog.previewUrl}
				setThumbnail={imageDialog.setPreview}
				uploadMode="deferred"
				onFileSelect={(file, previewUrl) => {
					imageDialog.setMultipleFiles([file], [previewUrl]);
				}}
				onFilesSelect={(files, previewUrls) => {
					imageDialog.setMultipleFiles(files, previewUrls);
				}}
				onUpload={handleImageUpload}
				rightContent={
					<AssetGrid
						assets={assets.assets}
						loading={assets.loading}
						error={assets.error}
						selectedUrl={imageDialog.previewUrl}
						onSelect={(asset) => imageDialog.setPreview(asset.url)}
						aspectClassName="aspect-square"
						imageClassName="w-full h-full object-contain"
						gridTemplateColumns="repeat(3, minmax(0, 1fr))"
					/>
				}
				enableAssetSearch={true}
				assetSearchQuery={assets.searchQuery}
				onAssetSearchChange={assets.setSearchQuery}
			/>
			<span className="sr-only">{postId}</span>
		</div>
	);
}
