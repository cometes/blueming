"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Lock, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import {
	createMemoReply,
	fetchMemoDetail,
	uploadMemoImages,
	type MemoDetail,
} from "@/queries/memo";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { useAssets } from "@/hooks/guestbook/useAssets";
import { useCommentImageDialog } from "@/hooks/comment/useImageDialog";
import type { CommentImage } from "@/hooks/comment/useCommentForm";
import { dateTimeConvert } from "@/lib/date";
import ImageSlideModal from "@/components/modal/ImageSlideModal";

interface MemoDetailClientProps {
	memoId: string;
}

export default function MemoDetailClient({ memoId }: MemoDetailClientProps) {
	const router = useRouter();
	const { user, isLoading: isAuthLoading } = useAuthStore();
	const [memo, setMemo] = useState<MemoDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [password, setPassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);

	const [message, setMessage] = useState("");
	const [images, setImages] = useState<CommentImage[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
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
					error instanceof Error
						? error.message
						: "메모를 불러오지 못했습니다.";
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

	const handleVerifyPassword = async () => {
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
	};

	const handleImageDialogOpen = useCallback(() => {
		if (images.length >= 4) {
			toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
			return;
		}
		imageDialog.openDialog("create", images.length);
	}, [imageDialog, images.length]);

	const removeImage = useCallback((id: string) => {
		setImages((prev) => {
			const targetImage = prev.find((image) => image.id === id);
			if (targetImage?.url.startsWith("blob:")) {
				URL.revokeObjectURL(targetImage.url);
			}
			return prev.filter((image) => image.id !== id);
		});
	}, []);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;
			if (images.length >= 4) {
				toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
				return;
			}
			if (
				imageDialog.previewFiles.length > 0 &&
				imageDialog.previewUrls.length > 0
			) {
				if (imageDialog.addImagesToTarget(setImages)) {
					toast.success("이미지가 추가되었습니다.");
				}
				return;
			}
			imageDialog.addSingleImageToTarget(setImages, url);
			toast.success("이미지가 추가되었습니다.");
		},
		[imageDialog, images.length],
	);

	useEffect(() => {
		return () => {
			images.forEach((image) => {
				if (image.url.startsWith("blob:")) {
					URL.revokeObjectURL(image.url);
				}
			});
		};
	}, [images]);

	const openImageModal = useCallback((urls: string[], index: number) => {
		setImageModalImages(urls);
		setImageModalIndex(index);
		setIsImageModalOpen(true);
	}, []);

	const handleMessageChange = (value: string) => {
		setMessage(value);
		if (!messageRef.current) return;
		messageRef.current.style.height = "auto";
		messageRef.current.style.height = `${messageRef.current.scrollHeight}px`;
	};

	const handleCreateReply = async () => {
		if (!canSubmit || !memo?.id) return;
		setIsSubmitting(true);
		try {
			const fileImages = images.filter((img) => img.file);
			const uploadedUrls =
				fileImages.length > 0
					? await uploadMemoImages(fileImages.map((img) => img.file as File))
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

			await createMemoReply(memo.id, {
				content: message.trim(),
				imageUrls: finalImageUrls,
			});
			setMessage("");
			setImages([]);
			if (messageRef.current) {
				messageRef.current.style.height = "auto";
			}
			await loadDetail();
			toast.success("답글이 추가되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "답글 작성에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const replies = useMemo(() => memo?.replies ?? [], [memo?.replies]);

	const contentNode = (() => {
		if (!memo) {
			return null;
		}

		if (requiresSecretAccess) {
			return (
				<div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<div className="w-16 h-16 rounded-full bg-card border border-card flex items-center justify-center">
						<Lock size={24} className="text-sub-text" />
					</div>
					<h2 className="mt-4 text-lg font-semibold text-main-text">
						비공개 메모입니다.
					</h2>
					<p className="text-sm text-sub-text mt-2">
						작성자와 관리자만 열람할 수 있습니다.
					</p>
				</div>
			);
		}

		if (requiresPassword) {
			return (
				<div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
					<div className="w-16 h-16 rounded-full bg-card border border-card flex items-center justify-center">
						<Lock size={24} className="text-sub-text" />
					</div>
					<h2 className="mt-4 text-lg font-semibold text-main-text">
						보호된 메모입니다.
					</h2>
					<p className="text-sm text-sub-text mt-2">
						비밀번호를 입력하면 내용을 볼 수 있어요.
					</p>
					<div className="mt-4 flex items-center gap-2">
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleVerifyPassword();
								}
							}}
							placeholder="비밀번호"
							className="w-48"
						/>
						<Button
							type="button"
							onClick={handleVerifyPassword}
							disabled={isVerifying}
						>
							확인
						</Button>
					</div>
					{passwordError && (
						<p className="mt-2 text-xs text-red-500">{passwordError}</p>
					)}
				</div>
			);
		}

		return (
			<section className="bg-card rounded-card border-card backdrop-blur-card">
				<article className="p-5">
					<div className="flex items-center justify-between text-sm text-sub-text">
						<div className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-full overflow-hidden border border-card">
								{memo.author?.avatarUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={memo.author.avatarUrl}
										alt={memo.author?.name ?? "작성자"}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-xs font-medium">
										{memo.author?.name?.charAt(0) ?? "?"}
									</div>
								)}
							</div>
							<span>{memo.author?.name ?? "게스트"}</span>
							<span>
								{memo.createdAt ? dateTimeConvert(memo.createdAt) : ""}
							</span>
						</div>
					</div>

					<h1 className="text-xl font-bold text-main-text mt-2.5 font-title">
						{memo.title}
					</h1>

					<div className="text-sm text-main-text whitespace-pre-line leading-relaxed mt-2.5">
						{memo.content}
					</div>

					{memo.imageUrls && memo.imageUrls.length > 0 && (
						<div
							className={cn(
								"grid gap-2 mt-4",
								memo.imageUrls.length === 1 && "grid-cols-1",
								memo.imageUrls.length === 2 && "grid-cols-2",
								memo.imageUrls.length >= 3 && "grid-cols-2 grid-rows-2",
							)}
						>
							{memo.imageUrls.slice(0, 4).map((url, index) => (
								<button
									key={`${url}-${index}`}
									type="button"
									onClick={() => openImageModal(memo.imageUrls ?? [], index)}
									className={cn(
										"relative rounded-card border border-card overflow-hidden text-left",
										memo.imageUrls.length === 1
											? "aspect-[4/3]"
											: "aspect-square",
										memo.imageUrls.length === 3 && index === 0 && "row-span-2",
									)}
									aria-label={`이미지 ${index + 1} 확대 보기`}
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={url}
										alt="첨부 이미지"
										className="absolute inset-0 w-full h-full object-cover"
									/>
								</button>
							))}
						</div>
					)}

					{memo.tags && memo.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-2.5">
							{memo.tags.map((tag, idx) => (
								<span
									key={idx}
									className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</article>

				{replies.length > 0 && (
					<>
						<div>
							{replies.map((reply) => (
								<div key={reply.id} className="p-5 border-t border-card-border">
									<div className="flex items-center justify-between text-sm text-sub-text">
										<div className="flex items-center gap-2.5">
											<div className="w-8 h-8 rounded-full overflow-hidden border border-card">
												{reply.author?.avatarUrl ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														src={reply.author.avatarUrl}
														alt={reply.author?.name ?? "작성자"}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-xs font-medium">
														{reply.author?.name?.charAt(0) ?? "?"}
													</div>
												)}
											</div>
											<span>{reply.author?.name ?? "게스트"}</span>
											<span>
												{reply.createdAt ? dateTimeConvert(reply.createdAt) : ""}
											</span>
										</div>
									</div>
									<div className="text-sm text-main-text whitespace-pre-line leading-relaxed mt-2.5">
										{reply.content}
									</div>
									{reply.imageUrls && reply.imageUrls.length > 0 && (
										<div
											className={cn(
												"grid gap-2 mt-3",
												reply.imageUrls.length === 1 && "grid-cols-1",
												reply.imageUrls.length === 2 && "grid-cols-2",
												reply.imageUrls.length >= 3 &&
													"grid-cols-2 grid-rows-2",
											)}
										>
											{reply.imageUrls.slice(0, 4).map((url, index) => (
												<button
													key={`${reply.id}-${index}`}
													type="button"
													onClick={() => openImageModal(reply.imageUrls ?? [], index)}
													className={cn(
														"relative rounded-lg border border-card overflow-hidden text-left",
														reply.imageUrls.length === 1
															? "aspect-[4/3]"
															: "aspect-square",
														reply.imageUrls.length === 3 &&
															index === 0 &&
															"row-span-2",
													)}
													aria-label={`이미지 ${index + 1} 확대 보기`}
												>
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img
														src={url}
														alt="첨부 이미지"
														className="absolute inset-0 w-full h-full object-cover"
													/>
												</button>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</>
				)}

				{replies.length === 0 && !isOwner && (
					<>
						<hr className="border-card-border" />
						<div className="p-6 text-center text-sub-text">
							아직 답글이 없습니다.
						</div>
					</>
				)}

				{isOwner && (
					<>
						<div className="border-t border-card-border p-3 bg-card-bg">
							{isAuthLoading ? (
								<div className="text-xs text-sub-text">로딩 중...</div>
							) : (
								<div className="space-y-2">
									<div className="relative">
										<Textarea
											ref={messageRef}
											value={message}
											onChange={(e) => handleMessageChange(e.target.value)}
											placeholder="메시지를 입력하세요..."
											rows={2}
											className="w-full pr-10 resize-none overflow-hidden"
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey && canSubmit) {
													e.preventDefault();
													handleCreateReply();
												}
											}}
										/>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											onClick={handleCreateReply}
											disabled={!canSubmit || isSubmitting}
											className="absolute right-1 bottom-1 w-8 h-8 p-0"
										>
											<Send size={16} className="text-theme-primary" />
										</Button>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={handleImageDialogOpen}
												disabled={isSubmitting}
												className={cn(
													"inline-flex items-center justify-center w-8 h-8 rounded-card border border-card bg-card text-main-text",
													isSubmitting ? "opacity-60 pointer-events-none" : "",
												)}
												aria-label="사진 첨부"
											>
												<ImagePlus size={14} />
											</button>
											{images.length > 0 && (
												<span className="text-xs text-sub-text">
													{images.length}/4
												</span>
											)}
										</div>
									</div>

									{images.length > 0 && (
										<div className="flex flex-wrap gap-2">
											{images.slice(0, 4).map((image) => (
												<div
													key={image.id}
													className="relative w-12 h-12 rounded-card border border-card overflow-hidden"
												>
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img
														src={image.url}
														alt="첨부 이미지"
														className="absolute inset-0 w-full h-full object-cover"
													/>
													<button
														type="button"
														onClick={() => removeImage(image.id)}
														className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-1"
														aria-label="이미지 삭제"
													>
														<X size={10} />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					</>
				)}
			</section>
		);
	})();

	return (
		<div className="shrink-0 w-full max-w-xl mt-[90px] mb-[40px] mx-auto">
			{memo && (
				<Button
					variant="default"
					size="sm"
					onClick={() => router.back()}
					className="mb-8 gap-2"
				>
					<ArrowLeft size={16} />
					목록으로
				</Button>
			)}

			{contentNode}

			{isMounted && (
				<ImageUploadDialog
					isOpen={imageDialog.isOpen}
					onOpenChange={imageDialog.setIsOpen}
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
			)}
			{imageModalImages.length > 0 && (
				<ImageSlideModal
					isOpen={isImageModalOpen}
					onOpenChange={setIsImageModalOpen}
					images={imageModalImages}
					initialIndex={imageModalIndex}
				/>
			)}
		</div>
	);
}
