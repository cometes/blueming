"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import {
	ArrowLeft,
	Heart,
	ImagePlus,
	Lock,
	ThumbsUp,
	MessageCircle,
	Send,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCommentImageDialog } from "@/hooks/comment/useImageDialog";
import type { CommentImage } from "@/hooks/comment/useCommentForm";
import { useAssets } from "@/hooks/guestbook/useAssets";

type MemoReply = {
	id: string;
	content: string;
	author: string;
	createdAt: string;
	reactions?: {
		hearts: number;
		likes: number;
		comments: number;
	};
};

type Memo = {
	id: string;
	title: string;
	content: string;
	author: string;
	tags?: string[];
	createdAt: string;
	replies: MemoReply[];
};

interface MemoDetailClientProps {
	memo: Memo;
}

export default function MemoDetailClient({ memo }: MemoDetailClientProps) {
	const router = useRouter();
	const [isRepliesExpanded, setIsRepliesExpanded] = useState(true);
	const [message, setMessage] = useState("");
	const [images, setImages] = useState<CommentImage[]>([]);
	const [isSecret, setIsSecret] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const cooldownRemaining = 0;
	const MAX_IMAGE_COUNT = 8;
	const canSubmit = message.trim().length > 0 && !isSubmitting;
	const imageDialog = useCommentImageDialog();
	const assets = useAssets(imageDialog.isOpen);

	const handleCreate = () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		setTimeout(() => {
			setMessage("");
			setIsSubmitting(false);
		}, 0);
	};

	const handleImageDialogOpen = useCallback(() => {
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
			if (
				imageDialog.previewFiles.length > 0 &&
				imageDialog.previewUrls.length > 0
			) {
				imageDialog.addImagesToTarget(setImages);
				return;
			}
			imageDialog.addSingleImageToTarget(setImages, url);
		},
		[imageDialog],
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

	return (
		<div className="shrink-0 w-full max-w-xl mt-[90px] mb-[40px] mx-auto">
			{/* 뒤로가기 버튼 */}
			<Button
				variant="default"
				size="sm"
				onClick={() => router.back()}
				className="mb-8 gap-2"
			>
				<ArrowLeft size={16} />
				목록으로
			</Button>

			<section className="bg-card rounded-card  border-card backdrop-blur-card ">
				{/* 메인 메모 카드 */}
				<article className="p-5">
					{/* 작성자 및 날짜 */}
					<div className="flex items-center justify-between text-sm text-sub-text ">
						<div className="flex gap-2.5">
							<div>
								{/* <img src="" alt="" /> 여기에 작성자 프로필 사진 36x36 */}
								<span>{memo.author}</span>
							</div>

							<span>{memo.createdAt}</span>
						</div>
						{/* 여기에 ... 아이콘 버튼 */}
					</div>

					{/* 제목 */}
					<h1 className="text-xl font-bold text-main-text mt-2.5 font-title">
						{memo.title}
					</h1>

					{/* 본문 */}
					<div className="text-sm text-main-text whitespace-pre-line leading-relaxed mt-2.5">
						{memo.content}
					</div>

					{/* 태그 배지 */}
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

				{/* 답글 섹션 */}
				{memo.replies.length > 0 && (
					<>
						<div className="overflow-hidden ">
							{/* 답글 목록 */}
							{isRepliesExpanded && (
								<div className="">
									{memo.replies.map((reply) => (
										<>
											<hr className="border-card-border" />
											<div key={reply.id} className="p-5">
												{/* 답글 작성자 및 날짜 */}
												<div className="flex items-center justify-between text-sm text-sub-text ">
													<div className="flex gap-2.5">
														<div>
															{/* <img src="" alt="" /> 여기에 작성자 프로필 사진 36x36 */}
															<span>{memo.author}</span>
														</div>

														<span>{memo.createdAt}</span>
													</div>
													{/* 여기에 ... 아이콘 버튼 */}
												</div>
												{/* 제목 */}
												<h1 className="text-xl font-bold text-main-text mt-2.5 font-title">
													{memo.title}
												</h1>

												{/* 본문 */}
												<div className="text-sm text-main-text whitespace-pre-line leading-relaxed mt-2.5">
													{memo.content}
												</div>

												{/* 답글 반응 */}
												{reply.reactions && (
													<div className="flex items-center gap-4 mt-2.5">
														<button className="flex items-center gap-1.5 text-xs text-sub-text hover:text-red-500 transition-colors">
															<Heart size={14} />
															<span>{reply.reactions.hearts}</span>
														</button>
														<button className="flex items-center gap-1.5 text-xs text-sub-text hover:text-blue-500 transition-colors">
															<ThumbsUp size={14} />
															<span>{reply.reactions.likes}</span>
														</button>
														<button className="flex items-center gap-1.5 text-xs text-sub-text hover:text-green-500 transition-colors">
															<MessageCircle size={14} />
															<span>{reply.reactions.comments}</span>
														</button>
													</div>
												)}
											</div>
										</>
									))}
								</div>
							)}
						</div>
					</>
				)}

				{/* 답글이 없는 경우 */}
				{memo.replies.length === 0 && (
					<>
						<hr className="border-card-border" />
						<div className=" p-6 text-center text-sub-text">
							아직 답글이 없습니다.
						</div>
					</>
				)}

				<>
					<div className="border-t border-card-border p-3">
						<div className="space-y-2">
							<Input
								type="text"
								placeholder="댓글 제목 (옵션)"
								className="h-8 text-sm"
							/>

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
										onClick={handleImageDialogOpen}
										disabled={isSubmitting || images.length >= MAX_IMAGE_COUNT}
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
					</div>
				</>
				{images.length > 0 && (
					<div className="px-3 pb-3 bg-card border-t border-card-border">
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
										onClick={() => removeImage(image.id)}
										className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white text-[8px] px-1.5 py-0.5"
									>
										X
									</button>
								</div>
							))}
						</div>
					</div>
				)}
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
			</section>
		</div>
	);
}
