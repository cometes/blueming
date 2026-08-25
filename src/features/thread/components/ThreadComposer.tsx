"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useState } from "react";
import { CornerUpLeft, Globe, ImagePlus, Lock, Send, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/common/Avatar";
import MentionTextarea from "@/components/common/MentionTextarea";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import {
	useCommentImageManager,
	revokeCommentImageUrls,
} from "@/features/comment/hooks/useCommentImageManager";
import {
	createImageId,
	type CommentImage,
} from "@/features/comment/hooks/useCommentForm";
import type { MentionEntry } from "@/features/mention/types";
import {
	createThreadPost,
	updateThreadPost,
	uploadThreadImages,
} from "@/features/thread/api/client";
import type { ThreadPost, ThreadVisibility } from "@/features/thread/types";
import { extractFirstYouTubeVideoIdFromContent } from "@/shared/lib/youtube";
import { YouTubeEmbed } from "@/features/thread/components/ThreadPostCard";
import ThreadQuoteCard from "@/features/thread/components/ThreadQuoteCard";

const MAX_CONTENT = 500;
const MAX_IMAGES = 4;

interface ThreadComposerProps {
	/** 답글 모드: 대상 글 id (공개범위는 루트값 고정) */
	parentId?: string;
	parentVisibility?: ThreadVisibility;
	/** 인용 모드: 인용할 대상 글 (parentId와 배타) */
	quoteTarget?: ThreadPost | null;
	onClearQuote?: () => void;
	/** 답글 모드에서 루트가 아닌 특정 답글에 다는 분기 답글이면 대상 이름 표시 */
	replyToName?: string | null;
	onClearReplyTarget?: () => void;
	/** 수정 모드: 기존 글 내용/이미지를 프리필하고 PATCH로 저장 (공개범위 수정 불가) */
	editTarget?: ThreadPost | null;
	onUpdated?: (post: ThreadPost) => void;
	onCancelEdit?: () => void;
	placeholder?: string;
	onPosted?: (post: ThreadPost) => void;
}

/** 스레드 작성 컴포저 — 피드 상단(루트) / 상세 하단(답글) 겸용 */
export default function ThreadComposer({
	parentId,
	parentVisibility,
	quoteTarget = null,
	onClearQuote,
	replyToName = null,
	onClearReplyTarget,
	editTarget = null,
	onUpdated,
	onCancelEdit,
	placeholder = "무슨 일이 일어나고 있나요?",
	onPosted,
}: ThreadComposerProps) {
	const user = useAuthStore((state) => state.user);
	const isEdit = Boolean(editTarget);
	const [content, setContent] = useState(editTarget?.content ?? "");
	const [mentions, setMentions] = useState<MentionEntry[]>(
		editTarget?.mentions ?? [],
	);
	const [visibility, setVisibility] = useState<ThreadVisibility>("public");
	const [images, setImages] = useState<CommentImage[]>(() =>
		(editTarget?.imageUrls ?? []).map((url) => ({
			id: createImageId(),
			url,
		})),
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const imageManager = useCommentImageManager({ maxImageCount: MAX_IMAGES });
	const { imageDialog, assets } = imageManager;

	const isReply = Boolean(parentId);
	// member 글 인용 시 새 글도 member 강제 (서버에서도 강제하지만 UI에 미리 반영)
	const quoteForcesMember = quoteTarget?.visibility === "member";
	const effectiveVisibility = isReply
		? (parentVisibility ?? "public")
		: quoteForcesMember
			? "member"
			: visibility;
	const remaining = MAX_CONTENT - content.length;
	// 이미지만 있는 글도 허용 — 내용·이미지 둘 다 없을 때만 비활성
	const canSubmit =
		(content.trim().length > 0 || images.length > 0) &&
		remaining >= 0 &&
		!isSubmitting;
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
			if (editTarget) {
				const updated = await updateThreadPost(editTarget.id, {
					content: content.trim(),
					imageUrls,
					tags: tags.length > 0 ? tags : undefined,
					mentions: mentions.length > 0 ? mentions : undefined,
				});
				onUpdated?.(updated);
				revokeCommentImageUrls(images);
				toast.success("수정되었습니다.");
			} else {
				const post = await createThreadPost({
					content: content.trim(),
					imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
					tags: tags.length > 0 ? tags : undefined,
					visibility: effectiveVisibility,
					parentId,
					quoteId: quoteTarget?.id,
					mentions: mentions.length > 0 ? mentions : undefined,
				});
				onPosted?.(post);
				onClearQuote?.();
				setContent("");
				setMentions([]);
				revokeCommentImageUrls(images);
				setImages([]);
				toast.success(
					isReply ? "답글이 등록되었습니다." : "글이 등록되었습니다.",
				);
			}
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
		editTarget,
		effectiveVisibility,
		imageManager,
		images,
		isReply,
		mentions,
		onClearQuote,
		onPosted,
		onUpdated,
		parentId,
		quoteTarget,
		tags,
	]);

	return (
		<div className="border-b border-card-border px-4 py-3">
			<div className="flex items-start gap-3">
				<Avatar
					src={user?.photoURL}
					name={user?.displayName}
					className="mt-1"
				/>

				<div className="min-w-0 flex-1">
					{replyToName && (
						<div className="mb-1 flex items-center gap-1.5 text-xs text-sub-text">
							<CornerUpLeft size={12} />
							<span>
								<span className="text-theme-primary">{replyToName}</span>
								님에게 답글
							</span>
							{onClearReplyTarget && (
								<button
									type="button"
									onClick={onClearReplyTarget}
									className="rounded-full p-0.5 hover:bg-card-bg/60"
									aria-label="답글 대상 해제"
								>
									<X size={11} />
								</button>
							)}
						</div>
					)}
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

			{quoteTarget && (
				<div className="relative">
					<ThreadQuoteCard
						quote={{
							id: quoteTarget.id,
							authorId: quoteTarget.authorId,
							authorName: quoteTarget.author?.name || "사용자",
							excerpt: (quoteTarget.content ?? "").slice(0, 80),
							imageUrl: quoteTarget.imageUrls[0] ?? null,
							visibility: quoteTarget.visibility,
						}}
						interactive={false}
					/>
					<button
						type="button"
						onClick={onClearQuote}
						className="absolute right-1.5 top-3.5 rounded-full bg-black/50 p-0.5 text-white"
						aria-label="인용 해제"
					>
						<X size={11} />
					</button>
				</div>
			)}

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
							// 다이얼로그 내부 상한(8)과 별개로 스레드 상한 4를 직접 강제
							if (
								images.length >= MAX_IMAGES ||
								!imageManager.openDialog("create", images.length)
							) {
								toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`);
							}
						}}
						disabled={isSubmitting}
						className="flex h-8 w-8 items-center justify-center rounded-full text-theme-primary hover:bg-theme-primary/10"
						aria-label="사진 첨부"
					>
						<ImagePlus size={15} />
					</button>

					{!isReply && !quoteForcesMember && !isEdit && (
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
					{!isReply && quoteForcesMember && (
						<span className="flex items-center gap-1 text-[11px] text-sub-text">
							<Lock size={11} /> 멤버 공개 글 인용 — 멤버 공개로 게시됩니다
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
					{isEdit && onCancelEdit && (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={onCancelEdit}
							className="h-8 rounded-full px-3 text-sub-text"
						>
							취소
						</Button>
					)}
					<Button
						type="button"
						size="sm"
						onClick={() => void handleSubmit()}
						disabled={!canSubmit}
						className="h-8 gap-1.5 rounded-full px-3.5"
					>
						<Send size={13} />
						{isEdit ? "수정" : isReply ? "답글" : "게시"}
					</Button>
				</div>
			</div>
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
					// 남은 슬롯만큼만 받는다 (최대 4장)
					const room = Math.max(0, MAX_IMAGES - images.length);
					if (files.length > room) {
						toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`);
					}
					imageDialog.setMultipleFiles(
						files.slice(0, room),
						previewUrls.slice(0, room),
					);
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
