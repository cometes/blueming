"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useState } from "react";
import { Globe, ImagePlus, Lock, Send, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import MentionTextarea from "@/components/common/MentionTextarea";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import {
	useCommentImageManager,
	revokeCommentImageUrls,
} from "@/features/comment/hooks/useCommentImageManager";
import type { CommentImage } from "@/features/comment/hooks/useCommentForm";
import type { MentionEntry } from "@/features/mention/types";
import {
	createThreadPost,
	uploadThreadImages,
} from "@/features/thread/api/client";
import type { ThreadPost, ThreadVisibility } from "@/features/thread/types";
import { extractFirstYouTubeVideoIdFromContent } from "@/shared/lib/youtube";
import { YouTubeEmbed } from "@/features/thread/components/ThreadPostCard";

const MAX_CONTENT = 500;
const MAX_IMAGES = 4;

interface ThreadComposerProps {
	/** 답글 모드: 대상 글 id (공개범위는 루트값 고정) */
	parentId?: string;
	parentVisibility?: ThreadVisibility;
	placeholder?: string;
	onPosted: (post: ThreadPost) => void;
}

/** 스레드 작성 컴포저 — 피드 상단(루트) / 상세 하단(답글) 겸용 */
export default function ThreadComposer({
	parentId,
	parentVisibility,
	placeholder = "무슨 일이 일어나고 있나요?",
	onPosted,
}: ThreadComposerProps) {
	const [content, setContent] = useState("");
	const [mentions, setMentions] = useState<MentionEntry[]>([]);
	const [visibility, setVisibility] = useState<ThreadVisibility>("public");
	const [images, setImages] = useState<CommentImage[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const imageManager = useCommentImageManager({ maxImageCount: MAX_IMAGES });
	const { imageDialog, assets } = imageManager;

	const isReply = Boolean(parentId);
	const effectiveVisibility = isReply
		? (parentVisibility ?? "public")
		: visibility;
	const remaining = MAX_CONTENT - content.length;
	const canSubmit = content.trim().length > 0 && remaining >= 0 && !isSubmitting;
	// 본문에서 태그(#단어)와 유튜브 미리보기 파생
	const previewVideoId = extractFirstYouTubeVideoIdFromContent(content);
	const tags = Array.from(
		new Set(
			Array.from(content.matchAll(/#([^\s#@]{1,20})/g), (m) => m[1]),
		),
	).slice(0, 5);

	const handleSubmit = useCallback(async () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		try {
			const imageUrls = await imageManager.resolveImageUrls(
				images,
				uploadThreadImages,
			);
			const post = await createThreadPost({
				content: content.trim(),
				imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
				tags: tags.length > 0 ? tags : undefined,
				visibility: effectiveVisibility,
				parentId,
				mentions: mentions.length > 0 ? mentions : undefined,
			});
			onPosted(post);
			setContent("");
			setMentions([]);
			revokeCommentImageUrls(images);
			setImages([]);
			toast.success(isReply ? "답글이 등록되었습니다." : "글이 등록되었습니다.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "작성에 실패했습니다.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		canSubmit,
		content,
		effectiveVisibility,
		imageManager,
		images,
		isReply,
		mentions,
		onPosted,
		parentId,
		tags,
	]);

	return (
		<div className="border-b border-card-border px-4 py-3">
			<MentionTextarea
				value={content}
				onValueChange={setContent}
				mentions={mentions}
				onMentionsChange={setMentions}
				placeholder={placeholder}
				rows={isReply ? 2 : 3}
				maxLength={MAX_CONTENT + 50}
				className="w-full resize-none bg-transparent text-sm text-main-text placeholder:text-sub-text focus:outline-none"
				onKeyDown={(e) => {
					if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit) {
						e.preventDefault();
						void handleSubmit();
					}
				}}
			/>

			{images.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-1.5">
					{images.map((image) => (
						<div
							key={image.id}
							className="relative h-16 w-16 overflow-hidden rounded-card border border-card"
						>
							<img
								src={image.url}
								alt="첨부 이미지"
								className="absolute inset-0 h-full w-full object-cover"
							/>
							<button
								type="button"
								onClick={() => imageManager.removeImage(setImages, image.id)}
								className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
								aria-label="이미지 제거"
							>
								<X size={10} />
							</button>
						</div>
					))}
				</div>
			)}

			{previewVideoId && images.length === 0 && (
				<YouTubeEmbed videoId={previewVideoId} />
			)}

			<div className="mt-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => {
							if (!imageManager.openDialog("create", images.length)) {
								toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`);
							}
						}}
						disabled={isSubmitting}
						className="flex h-8 w-8 items-center justify-center rounded-card border border-card bg-card-bg text-sub-text hover:text-theme-primary"
						aria-label="사진 첨부"
					>
						<ImagePlus size={14} />
					</button>

					{!isReply && (
						<button
							type="button"
							onClick={() =>
								setVisibility((prev) =>
									prev === "public" ? "member" : "public",
								)
							}
							className={cn(
								"flex items-center gap-1 rounded-full border border-card bg-card-bg px-2.5 py-1 text-[11px]",
								visibility === "member"
									? "text-theme-primary border-theme-primary/50"
									: "text-sub-text",
							)}
							aria-label="공개 범위"
						>
							{visibility === "member" ? <Lock size={11} /> : <Globe size={11} />}
							{visibility === "member" ? "멤버 공개" : "전체 공개"}
						</button>
					)}
					{isReply && effectiveVisibility === "member" && (
						<span className="flex items-center gap-1 text-[11px] text-sub-text">
							<Lock size={11} /> 멤버 공개 스레드
						</span>
					)}
				</div>

				<div className="flex items-center gap-2.5">
					<span
						className={cn(
							"text-[11px]",
							remaining < 0
								? "text-red-400"
								: remaining <= 50
									? "text-theme-primary"
									: "text-sub-text",
						)}
					>
						{remaining}
					</span>
					<Button
						type="button"
						size="sm"
						onClick={() => void handleSubmit()}
						disabled={!canSubmit}
						className="h-8 gap-1.5 rounded-full px-3.5"
					>
						<Send size={13} />
						{isReply ? "답글" : "게시"}
					</Button>
				</div>
			</div>

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
				onUpload={(url) => {
					if (imageManager.addUploadedImages(url, setImages)) {
						toast.success("이미지가 추가되었습니다.");
					}
				}}
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
