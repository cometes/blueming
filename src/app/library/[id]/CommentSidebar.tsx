"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ImagePlus, Lock, MessageCircle, Send } from "lucide-react";
import {
	createComment,
	deleteComment,
	fetchCommentList,
	uploadCommentImages,
	updateComment,
	verifyCommentSecret,
	type Comment,
} from "@/queries/comment";
import CommentItem from "@/components/items/CommentItem";
import CommentEditDialog from "@/components/comment/CommentEditDialog";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import { useCommentImageDialog } from "@/hooks/comment/useImageDialog";
import { useAssets } from "@/hooks/guestbook/useAssets";
import { createImageId, type CommentImage } from "@/hooks/comment/useCommentForm";

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

	const imageDialog = useCommentImageDialog();
	const assets = useAssets(imageDialog.isOpen);

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
			images.forEach((image) => {
				if (image.url.startsWith("blob:")) {
					URL.revokeObjectURL(image.url);
				}
			});
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
		dialogImages.forEach((image) => {
			if (image.url.startsWith("blob:")) {
				URL.revokeObjectURL(image.url);
			}
		});
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
		[activeComment, closeDialog],
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
			const fileImages = images.filter((img) => img.file);
			const uploadedUrls =
				fileImages.length > 0
					? await uploadCommentImages(
							fileImages.map((img) => img.file as File),
						)
					: [];
			let uploadIndex = 0;
			const finalImageUrls = images.reduce<string[]>((acc, image) => {
				if (image.file) {
					const nextUrl = uploadedUrls[uploadIndex];
					uploadIndex += 1;
					if (nextUrl) acc.push(nextUrl);
				} else if (image.url && !image.url.startsWith("blob:")) {
					acc.push(image.url);
				}
				return acc;
			}, []);
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
			images.forEach((image) => {
				if (image.url.startsWith("blob:")) {
					URL.revokeObjectURL(image.url);
				}
			});
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
			const fileImages = dialogImages.filter((img) => img.file);
			const uploadedUrls =
				fileImages.length > 0
					? await uploadCommentImages(
							fileImages.map((img) => img.file as File),
						)
					: [];
			let uploadIndex = 0;
			const finalImageUrls = dialogImages.reduce<string[]>((acc, image) => {
				if (image.file) {
					const nextUrl = uploadedUrls[uploadIndex];
					uploadIndex += 1;
					if (nextUrl) acc.push(nextUrl);
				} else if (image.url && !image.url.startsWith("blob:")) {
					acc.push(image.url);
				}
				return acc;
			}, []);
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
		dialogMessage,
		dialogPin,
		dialogSecret,
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
			const remove = (prev: CommentImage[]) => {
				const targetImage = prev.find((image) => image.id === id);
				if (targetImage?.url.startsWith("blob:")) {
					URL.revokeObjectURL(targetImage.url);
				}
				return prev.filter((image) => image.id !== id);
			};

			if (target === "edit") {
				setDialogImages(remove);
			} else {
				setImages(remove);
			}
		},
		[],
	);

	const handleImageDialogOpen = useCallback(
		(target: "create" | "edit") => {
			const currentCount =
				target === "edit" ? dialogImages.length : images.length;
			if (!imageDialog.openDialog(target, currentCount)) {
				toast.error("이미지는 최대 8개까지 첨부할 수 있어요.");
			}
		},
		[dialogImages.length, imageDialog, images.length],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;

			const setter =
				imageDialog.target === "edit" ? setDialogImages : setImages;

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
		[imageDialog],
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
				{isLoading && comments.length === 0 ? (
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex gap-2">
								<Skeleton className="w-8 h-8 rounded-full bg-card" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-20 bg-card" />
									<Skeleton className="h-16 w-3/4 rounded-2xl bg-card" />
								</div>
							</div>
						))}
					</div>
				) : comments.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-sub-text">
						<MessageCircle size={40} className="mb-2 opacity-30" />
						<p className="text-sm">첫 번째 댓글을 남겨보세요.</p>
					</div>
				) : (
					<>
						{comments.map((comment) => (
							<CommentItem
								key={comment.id}
								comment={comment}
								isOwn={comment.isOwn === true}
								onToggleSecret={(pinValue) =>
									handleToggleSecret(comment, pinValue)
								}
								onEdit={
									comment.canEdit ? () => openDialog(comment, "edit") : undefined
								}
								onDelete={
									comment.canDelete
										? () => openDialog(comment, "delete")
										: undefined
								}
							/>
						))}
						{hasMore && (
							<div className="flex justify-center pt-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleLoadMore}
									disabled={isLoading}
								>
									{isLoading ? "로딩 중..." : "이전 댓글 더보기"}
								</Button>
							</div>
						)}
					</>
				)}
			</div>

			{/* 입력 영역 */}
			<div className="border-t border-card-border p-3 bg-card-bg">
				{isAuthLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-9 w-full rounded-card bg-card" />
						<Skeleton className="h-20 w-full rounded-card bg-card" />
					</div>
				) : (
					<div className="space-y-2">
						{/* 익명 입력 필드 */}
						{resolvedMode === "anon" && (
							<div className="flex gap-1.5">
								<Input
									type="text"
									placeholder="닉네임"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									className="flex-1 h-8 text-sm"
								/>
								<Input
									type="password"
									placeholder="비밀번호"
									inputMode="numeric"
									value={pin}
									onChange={(e) => setPin(e.target.value)}
									className="w-24 h-8 text-sm"
								/>
							</div>
						)}

						{/* 메시지 입력 */}
						<div className="relative">
							<textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="메시지를 입력하세요..."
								maxLength={500}
								rows={2}
								className="w-full rounded-card border-card bg-card px-3 py-2 pr-10 text-sm text-main-text resize-none"
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										(e.ctrlKey || e.metaKey) &&
										canSubmit
									) {
										e.preventDefault();
										handleCreate();
									}
								}}
							/>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={handleCreate}
								disabled={!canSubmit || isSubmitting}
								className="absolute right-1 bottom-1 w-8 h-8 p-0"
							>
								<Send size={16} className="text-theme-primary" />
							</Button>
						</div>

						{/* 하단 옵션 */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => handleImageDialogOpen("create")}
									disabled={
										isSubmitting || images.length >= MAX_IMAGE_COUNT
									}
									className={cn(
										"inline-flex items-center justify-center w-8 h-8 rounded-card border border-card bg-card text-main-text",
										isSubmitting || images.length >= MAX_IMAGE_COUNT
											? "opacity-60 pointer-events-none"
											: "",
									)}
									aria-label="사진 첨부"
								>
									<ImagePlus size={14} />
								</button>
								{images.length > 0 && (
									<span className="text-xs text-sub-text">
										{images.length}/{MAX_IMAGE_COUNT}
									</span>
								)}
								<label className="inline-flex items-center gap-1.5 text-xs text-sub-text">
									<Switch
										checked={isSecret}
										onCheckedChange={setIsSecret}
										className="scale-75"
									/>
									<Lock size={12} />
									비밀글
								</label>
							</div>
							{cooldownRemaining > 0 && (
								<span className="text-xs text-sub-text">
									{cooldownRemaining}초
								</span>
							)}
						</div>
					</div>
				)}
			</div>

			{images.length > 0 && (
				<div className="px-3 pb-3 bg-card-bg border-t border-card-border">
					<div className="flex flex-wrap gap-1.5">
						{images.map((image) => (
							<div
								key={image.id}
								className="relative w-14 h-14 rounded-lg border border-card overflow-hidden"
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={image.url}
									alt="첨부 이미지"
									className="absolute inset-0 w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() => removeImageFromTarget("create", image.id)}
									className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white text-[8px] px-1.5 py-0.5"
								>
									X
								</button>
							</div>
						))}
					</div>
				</div>
			)}

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
