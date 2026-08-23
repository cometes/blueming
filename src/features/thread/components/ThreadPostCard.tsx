"use client";

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { CornerUpLeft, Lock, MessageCircle, Quote } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatRelativeTime, dateTimeConvert } from "@/shared/lib/date";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { renderContentWithMentions } from "@/features/mention/lib/renderMentions";
import ThreadQuoteCard from "@/features/thread/components/ThreadQuoteCard";
import type { ThreadPost } from "@/features/thread/types";

/** 유튜브 lazy 임베드 — 클릭 전엔 썸네일만 */
export function YouTubeEmbed({ videoId }: { videoId: string }) {
	return (
		<div className="mt-2 overflow-hidden rounded-card border border-card aspect-video">
			<iframe
				src={`https://www.youtube-nocookie.com/embed/${videoId}`}
				title="YouTube video"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
				loading="lazy"
				className="h-full w-full"
			/>
		</div>
	);
}

export function ThreadImageGrid({
	imageUrls,
	onOpenImage,
}: {
	imageUrls: string[];
	onOpenImage?: (urls: string[], index: number) => void;
}) {
	if (imageUrls.length === 0) return null;
	return (
		<div
			className={cn(
				"grid gap-1.5 mt-2",
				imageUrls.length === 1 && "grid-cols-1",
				imageUrls.length === 2 && "grid-cols-2",
				imageUrls.length >= 3 && "grid-cols-2 grid-rows-2",
			)}
		>
			{imageUrls.slice(0, 4).map((url, index) => (
				<button
					key={`${url}-${index}`}
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onOpenImage?.(imageUrls, index);
					}}
					className={cn(
						"relative overflow-hidden rounded-card border border-card text-left",
						imageUrls.length === 1 ? "aspect-[4/3]" : "aspect-square",
						imageUrls.length === 3 && index === 0 && "row-span-2",
					)}
					aria-label={`이미지 ${index + 1} 확대 보기`}
				>
					<img
						src={url}
						alt="첨부 이미지"
						className="absolute inset-0 h-full w-full object-cover"
					/>
				</button>
			))}
		</div>
	);
}

interface ThreadPostCardProps {
	post: ThreadPost;
	onSelectTag?: (tag: string) => void;
	onOpenImage?: (urls: string[], index: number) => void;
	/** 인용 버튼 노출 + 클릭 콜백 (피드에서만 전달) */
	onQuote?: (post: ThreadPost) => void;
	/** 상세 페이지에서 현재 보고 있는 글이면 강조 + 카드 클릭 이동 비활성 */
	isFocused?: boolean;
	/** 타래 연결선 — 카드 상단에서 아바타까지 (그룹 내 이어지는 글) */
	connectTop?: boolean;
	/** 타래 연결선 — 아바타 아래에서 카드 하단까지 (다음 글로 이어짐) */
	connectBottom?: boolean;
	/** 그룹 렌더링 시 개별 카드 하단 보더 제거 (그룹 래퍼가 보더 담당) */
	noBorder?: boolean;
	/** "OO님의 글에 답글" 라벨 숨김 (상세 타임라인 — 연결선으로 문맥 표현) */
	hideReplyLabel?: boolean;
}

/** 트위터식 피드 카드 — 카드 클릭 시 스레드 상세로 이동, 내부 요소는 stopPropagation */
export default function ThreadPostCard({
	post,
	onSelectTag,
	onOpenImage,
	onQuote,
	isFocused = false,
	connectTop = false,
	connectBottom = false,
	noBorder = false,
	hideReplyLabel = false,
}: ThreadPostCardProps) {
	const router = useRouter();
	const threadLink = `/thread/${post.rootId ?? post.id}`;

	const handleCardClick = () => {
		if (isFocused) return;
		router.push(threadLink);
	};

	return (
		<article
			onClick={handleCardClick}
			className={cn(
				"relative px-4 py-3.5 transition-colors",
				!noBorder && "border-b border-card-border",
				!isFocused && "cursor-pointer hover:bg-card-bg/40",
				isFocused && "bg-card-bg/30",
			)}
		>
			{/* 타래 연결선 — 아바타 중심(left 16px 패딩 + 18px = 34px, 2px 선은 33px) */}
			{connectTop && (
				<span className="absolute left-[33px] top-0 h-3.5 w-0.5 bg-card-border" />
			)}
			{connectBottom && (
				<span className="absolute bottom-0 left-[33px] top-[50px] w-0.5 bg-card-border" />
			)}

			{post.replyToAuthorName && !connectTop && !hideReplyLabel && (
				<p className="mb-1 flex items-center gap-1 text-xs text-sub-text">
					<CornerUpLeft size={12} />
					{post.replyToAuthorName}님의 글에 답글
				</p>
			)}

			<div className="flex items-start gap-3">
				<span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-card bg-card-bg flex items-center justify-center text-xs text-sub-text">
					{(post.author?.avatarUrl ?? "") ? (
						<img
							src={post.author?.avatarUrl}
							alt=""
							className="h-full w-full object-cover"
						/>
					) : (
						(post.author?.name || "?").charAt(0)
					)}
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5 text-sm">
						<span className="font-medium text-main-text truncate">
							{post.author?.name || "사용자"}
						</span>
						{post.visibility === "member" && (
							<Lock size={11} className="shrink-0 text-sub-text" />
						)}
						{/* 상세 강조 글은 절대시각을 본문 아래에 표기(트위터식)하므로 헤더 시간 생략 */}
						{!isFocused && (
							<>
								<span className="text-sub-text">·</span>
								<TooltipProvider delayDuration={150}>
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="shrink-0 text-xs text-sub-text">
												{formatRelativeTime(post.createdAt)}
											</span>
										</TooltipTrigger>
										{post.createdAt && (
											<TooltipContent>
												{dateTimeConvert(post.createdAt)}
											</TooltipContent>
										)}
									</Tooltip>
								</TooltipProvider>
							</>
						)}
					</div>

					{post.locked ? (
						<p className="mt-1.5 flex items-center gap-1.5 rounded-card border border-dashed border-card px-3 py-2.5 text-xs text-sub-text">
							<Lock size={12} />
							멤버 공개 게시글입니다. 로그인 후 볼 수 있어요.
						</p>
					) : (
						<>
							<div
								className={cn(
									"mt-0.5 whitespace-pre-wrap break-words text-main-text leading-relaxed",
									isFocused ? "text-[17px]" : "text-sm",
								)}
							>
								{renderContentWithMentions(post.content ?? "", post.mentions)}
							</div>

							<ThreadImageGrid
								imageUrls={post.imageUrls}
								onOpenImage={onOpenImage}
							/>
							{post.youtubeVideoId && (
								<div onClick={(e) => e.stopPropagation()}>
									<YouTubeEmbed videoId={post.youtubeVideoId} />
								</div>
							)}

							{post.quote && <ThreadQuoteCard quote={post.quote} />}

							{post.tags.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1.5">
									{post.tags.map((tag) => (
										<button
											key={tag}
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onSelectTag?.(tag);
											}}
											className="rounded-full border border-card bg-card-bg px-2 py-0.5 text-[11px] text-sub-text hover:border-theme-primary hover:text-theme-primary"
										>
											#{tag}
										</button>
									))}
								</div>
							)}
						</>
					)}

					{/* 상세 강조 글엔 트위터식 절대시각 표기 */}
					{isFocused && post.createdAt && (
						<p className="mt-3 text-xs text-sub-text">
							{dateTimeConvert(post.createdAt)}
						</p>
					)}

					{/* 액션 바 — 답글 수 + 인용 (onQuote 전달 시 버튼, 아니면 수 표시만) */}
					<div
						className={cn(
							"-mb-1 flex items-center gap-12 text-sub-text",
							isFocused
								? "mt-3 border-t border-card-border pt-2.5"
								: "mt-1.5",
						)}
					>
						<span className="-ml-1.5 flex items-center text-xs">
							<span className="flex h-7 w-7 items-center justify-center rounded-full">
								<MessageCircle size={15} />
							</span>
							{post.replyCount > 0 ? post.replyCount : ""}
						</span>
						{onQuote && !post.locked ? (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onQuote(post);
								}}
								className="group flex items-center text-xs hover:text-theme-primary"
								aria-label="인용하기"
							>
								<span className="flex h-7 w-7 items-center justify-center rounded-full group-hover:bg-theme-primary/10">
									<Quote size={14} />
								</span>
								{post.quoteCount > 0 ? post.quoteCount : ""}
							</button>
						) : (
							post.quoteCount > 0 && (
								<span className="flex items-center text-xs">
									<span className="flex h-7 w-7 items-center justify-center rounded-full">
										<Quote size={14} />
									</span>
									{post.quoteCount}
								</span>
							)
						)}
					</div>
				</div>
			</div>
		</article>
	);
}
