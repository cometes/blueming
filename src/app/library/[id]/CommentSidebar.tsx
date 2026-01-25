"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth/store";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
	createComment,
	deleteComment,
	updateComment,
	fetchCommentList,
	verifyCommentSecret,
	uploadCommentImages,
	type Comment,
} from "@/queries/comment";
import { ImagePlus, Lock, Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import CommentItem from "@/components/items/CommentItem";
import CommentEditDialog from "@/components/comment/CommentEditDialog";
import CommentSecretDialog from "@/components/comment/CommentSecretDialog";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import {
	useCommentForm,
	type CommentImage,
} from "@/hooks/comment/useCommentForm";
import { useCommentCooldown } from "@/hooks/comment/useCooldown";
import { useCommentImageDialog } from "@/hooks/comment/useImageDialog";
import { useAssets } from "@/hooks/guestbook/useAssets";

const PIN_REGEX = /^\d{4}$/;
const DEFAULT_PAGE_SIZE = 20;
const MAX_IMAGE_COUNT = 8;

interface CommentSidebarProps {
	postId: string;
}

export default function CommentSidebar({ postId }: CommentSidebarProps) {
	const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
	const { isAdmin } = useAdmin();
	const [comments, setComments] = useState<Comment[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [hasMore, setHasMore] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const resolvedMode: "user" | "anon" = isAuthenticated ? "user" : "anon";

	// 폼 상태 관리
	const form = useCommentForm({ mode: resolvedMode });
	const { cooldownRemaining, startCooldown } = useCommentCooldown();

	// 다이얼로그 상태
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<"edit" | "delete">("edit");
	const [dialogPin, setDialogPin] = useState("");
	const [dialogMessage, setDialogMessage] = useState("");
	const [dialogImages, setDialogImages] = useState<CommentImage[]>([]);
	const [dialogSecret, setDialogSecret] = useState(false);
	const [activeComment, setActiveComment] = useState<Comment | null>(null);

	// 비밀글 관리
	const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>(
		{},
	);
	const [secretOverrides, setSecretOverrides] = useState<
		Record<string, { message: string; imageUrls: string[] }>
	>({});
	const [secretDialogOpen, setSecretDialogOpen] = useState(false);
	const [secretDialogPin, setSecretDialogPin] = useState("");
	const [secretDialogComment, setSecretDialogComment] =
		useState<Comment | null>(null);
	const [isVerifyingSecret, setIsVerifyingSecret] = useState(false);

	// 이미지 다이얼로그
	const imageDialog = useCommentImageDialog();
	const assets = useAssets(imageDialog.isOpen);

	const canSubmit = form.canSubmit && cooldownRemaining === 0;

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
			} finally {
				setIsLoading(false);
			}
		},
		[postId],
	);

	const uploadImages = useCallback(async (images: CommentImage[]) => {
		const fileImages = images.filter((image) => image.file);
		const uploadedUrls =
			fileImages.length > 0
				? await uploadCommentImages(
						fileImages.map((image) => image.file as File),
					)
				: [];

		let uploadIndex = 0;
		return images.reduce<string[]>((acc, image) => {
			if (image.file) {
				const nextUrl = uploadedUrls[uploadIndex];
				uploadIndex += 1;
				if (nextUrl) {
					acc.push(nextUrl);
				}
			} else if (image.url && !image.url.startsWith("blob:")) {
				acc.push(image.url);
			}
			return acc;
		}, []);
	}, []);

	const handleCreate = useCallback(async () => {
		if (!canSubmit) return;
		form.setIsSubmitting(true);
		try {
			const finalImageUrls = await uploadImages(form.images);
			await createComment(postId, {
				message: form.message,
				displayName: resolvedMode === "anon" ? form.displayName : undefined,
				pin: resolvedMode === "anon" ? form.pin : undefined,
				isSecret: form.isSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("댓글이 등록되었습니다.");
			form.resetForm();
			startCooldown();
			setCurrentPage(1);
			await loadComments(1);
			// 스크롤을 맨 위로
			if (scrollContainerRef.current) {
				scrollContainerRef.current.scrollTop = 0;
			}
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
			toast.error("댓글 등록에 실패했습니다.");
		} finally {
			form.setIsSubmitting(false);
		}
	}, [
		canSubmit,
		form,
		postId,
		resolvedMode,
		uploadImages,
		startCooldown,
		loadComments,
	]);

	const handleUpdate = useCallback(async () => {
		if (!activeComment || !dialogMessage.trim()) return;

		try {
			const finalImageUrls = await uploadImages(dialogImages);
			await updateComment(postId, activeComment.id, {
				message: dialogMessage,
				pin: activeComment.authorType === "anon" ? dialogPin : undefined,
				isSecret: dialogSecret,
				imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
			});
			toast.success("댓글이 수정되었습니다.");
			await loadComments(1);
		} catch {
			toast.error("댓글 수정에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [
		activeComment,
		dialogMessage,
		dialogPin,
		dialogSecret,
		dialogImages,
		postId,
		uploadImages,
		loadComments,
	]);

	const handleDelete = useCallback(async () => {
		if (!activeComment) return;
		try {
			await deleteComment(postId, activeComment.id, {
				pin: activeComment.authorType === "anon" ? dialogPin : undefined,
			});
			toast.success("댓글이 삭제되었습니다.");
			await loadComments(1);
		} catch {
			toast.error("댓글 삭제에 실패했습니다.");
		} finally {
			closeDialog();
		}
	}, [activeComment, dialogPin, postId, loadComments]);

	const canEditComment = useCallback(
		(comment: Comment) => {
			if (isAdmin) return comment.isAdmin === true;
			if (comment.authorType === "anon") return true;
			if (comment.uid && user?.uid) return comment.uid === user.uid;
			return false;
		},
		[isAdmin, user?.uid],
	);

	const canDeleteComment = useCallback(
		(comment: Comment) => {
			if (isAdmin) return true;
			if (comment.authorType === "anon") return true;
			if (comment.uid && user?.uid) return comment.uid === user.uid;
			return false;
		},
		[isAdmin, user?.uid],
	);

	const canViewSecretDirectly = useCallback(
		(comment: Comment) => {
			if (!comment.isSecret) return true;
			if (isAdmin) return true;
			if (comment.authorType === "user") {
				return comment.uid !== undefined && comment.uid === user?.uid;
			}
			return false;
		},
		[isAdmin, user?.uid],
	);

	const canViewSecret = useCallback(
		(comment: Comment) => {
			if (!comment.isSecret) return false;
			if (canViewSecretDirectly(comment)) return true;
			return comment.authorType === "anon";
		},
		[canViewSecretDirectly],
	);

	const isOwnComment = useCallback(
		(comment: Comment) => {
			if (!user?.uid) return false;
			return comment.uid === user.uid;
		},
		[user?.uid],
	);

	const openDialog = useCallback(
		(comment: Comment, modeType: "edit" | "delete") => {
			const commentImages = comment.imageUrls ?? [];
			setActiveComment(comment);
			setDialogMode(modeType);
			setDialogPin("");
			setDialogMessage(comment.message);
			setDialogImages(
				commentImages.map((url) => ({
					id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
					url,
				})),
			);
			setDialogSecret(comment.isSecret === true);
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

	const openSecretDialog = useCallback((comment: Comment) => {
		setSecretDialogComment(comment);
		setSecretDialogPin("");
		setSecretDialogOpen(true);
	}, []);

	const closeSecretDialog = useCallback(() => {
		setSecretDialogOpen(false);
		setSecretDialogComment(null);
		setSecretDialogPin("");
	}, []);

	const handleSecretToggle = useCallback(
		async (comment: Comment) => {
			const isVisible = !!visibleSecrets[comment.id];
			if (isVisible) {
				setVisibleSecrets((prev) => ({ ...prev, [comment.id]: false }));
				return;
			}

			if (canViewSecretDirectly(comment)) {
				try {
					const data = await verifyCommentSecret(postId, comment.id, {});
					const resolvedImageUrls = data.imageUrls ?? [];
					setComments((prev) =>
						prev.map((c) =>
							c.id === comment.id
								? {
										...c,
										message: data.message ?? c.message,
										imageUrls: resolvedImageUrls,
									}
								: c,
						),
					);
					setSecretOverrides((prev) => ({
						...prev,
						[comment.id]: {
							message: data.message ?? "",
							imageUrls: resolvedImageUrls,
						},
					}));
					setVisibleSecrets((prev) => ({ ...prev, [comment.id]: true }));
				} catch {
					toast.error("비밀 댓글을 불러올 수 없습니다.");
				}
				return;
			}

			if (comment.authorType === "anon") {
				openSecretDialog(comment);
			}
		},
		[visibleSecrets, canViewSecretDirectly, postId, openSecretDialog],
	);

	const handleVerifySecret = useCallback(async () => {
		if (!secretDialogComment || !PIN_REGEX.test(secretDialogPin)) return;
		setIsVerifyingSecret(true);
		try {
			const data = await verifyCommentSecret(postId, secretDialogComment.id, {
				pin: secretDialogPin,
			});
			const resolvedImageUrls = data.imageUrls ?? [];
			setComments((prev) =>
				prev.map((comment) =>
					comment.id === secretDialogComment.id
						? {
								...comment,
								message: data.message ?? comment.message,
								imageUrls: resolvedImageUrls,
							}
						: comment,
				),
			);
			setSecretOverrides((prev) => ({
				...prev,
				[secretDialogComment.id]: {
					message: data.message ?? "",
					imageUrls: resolvedImageUrls,
				},
			}));
			setVisibleSecrets((prev) => ({
				...prev,
				[secretDialogComment.id]: true,
			}));
			closeSecretDialog();
		} catch {
			toast.error("비밀번호가 올바르지 않습니다.");
		} finally {
			setIsVerifyingSecret(false);
		}
	}, [secretDialogComment, secretDialogPin, postId, closeSecretDialog]);

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
		[imageDialog, dialogImages.length, form.images.length],
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
		[imageDialog, form],
	);

	const handleLoadMore = useCallback(() => {
		if (!hasMore || isLoading) return;
		const nextPage = currentPage + 1;
		setCurrentPage(nextPage);
		loadComments(nextPage, true);
	}, [hasMore, isLoading, currentPage, loadComments]);

	// 모드 변경 시 폼 초기화
	useEffect(() => {
		if (resolvedMode === "user") {
			form.setDisplayName("");
			form.setPin("");
		}
	}, [resolvedMode, form]);

	// 초기 로드
	useEffect(() => {
		console.log("CommentSidebar: Loading comments for postId:", postId);
		loadComments(1);
	}, [loadComments, postId]);

	// 컴포넌트 언마운트 시 blob URL 정리
	useEffect(() => {
		return () => {
			form.images.forEach((image) => {
				if (image.url.startsWith("blob:")) {
					URL.revokeObjectURL(image.url);
				}
			});
		};
	}, [form.images]);

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
						{comments.map((comment) => {
							const override = secretOverrides[comment.id];
							const resolvedComment = override
								? { ...comment, ...override }
								: comment;
							return (
								<CommentItem
									key={comment.id}
									comment={resolvedComment}
									isOwn={isOwnComment(comment)}
									visibleSecret={!!visibleSecrets[comment.id]}
									canViewSecret={canViewSecret(comment)}
									canEdit={canEditComment(comment)}
									canDelete={canDeleteComment(comment)}
									onToggleSecret={() => handleSecretToggle(comment)}
									onEdit={() => openDialog(comment, "edit")}
									onDelete={() => openDialog(comment, "delete")}
								/>
							);
						})}
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
									value={form.displayName}
									onChange={(e) => form.setDisplayName(e.target.value)}
									className="flex-1 h-8 text-sm"
								/>
								<Input
									type="password"
									placeholder="비밀번호"
									inputMode="numeric"
									value={form.pin}
									onChange={(e) => form.setPin(e.target.value)}
									className="w-24 h-8 text-sm"
								/>
							</div>
						)}

						{/* 메시지 입력 */}
						<div className="relative">
							<textarea
								value={form.message}
								onChange={(e) => form.setMessage(e.target.value)}
								placeholder="메시지를 입력하세요..."
								maxLength={500}
								rows={2}
								className="w-full rounded-card border-card bg-card px-3 py-2 pr-10 text-sm text-main-text resize-none"
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey && canSubmit) {
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
								disabled={!canSubmit || form.isSubmitting}
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
										form.isSubmitting || form.images.length >= MAX_IMAGE_COUNT
									}
									className={cn(
										"inline-flex items-center justify-center w-8 h-8 rounded-card border border-card bg-card text-main-text",
										form.isSubmitting || form.images.length >= MAX_IMAGE_COUNT
											? "opacity-60 pointer-events-none"
											: "",
									)}
									aria-label="사진 첨부"
								>
									<ImagePlus size={14} />
								</button>
								{form.images.length > 0 && (
									<span className="text-xs text-sub-text">
										{form.images.length}/{MAX_IMAGE_COUNT}
									</span>
								)}
								<label className="inline-flex items-center gap-1.5 text-xs text-sub-text">
									<Switch
										checked={form.isSecret}
										onCheckedChange={form.setIsSecret}
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

						{/* 첨부 이미지 미리보기 */}
						{form.images.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{form.images.map((image) => (
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
						)}
					</div>
				)}
			</div>

			{/* 다이얼로그들 */}
			<CommentEditDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				mode={dialogMode}
				isAnon={activeComment?.authorType === "anon"}
				isAdmin={isAdmin}
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

			<CommentSecretDialog
				open={secretDialogOpen}
				onOpenChange={setSecretDialogOpen}
				pin={secretDialogPin}
				onPinChange={setSecretDialogPin}
				isVerifying={isVerifyingSecret}
				onClose={closeSecretDialog}
				onConfirm={handleVerifySecret}
			/>

			<ImageUploadDialog
				isOpen={imageDialog.isOpen}
				onOpenChange={imageDialog.setIsOpen}
				thumbnail={imageDialog.previewUrl}
				setThumbnail={imageDialog.setPreview}
				uploadMode="deferred"
				onFileSelect={(file, previewUrl) => {
					imageDialog.setMultipleFiles([file], [previewUrl]);
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
		</div>
	);
}
