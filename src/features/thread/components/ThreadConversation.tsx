"use client";

import { useRouter } from "next/navigation";
import ThreadPostCard from "@/features/thread/components/ThreadPostCard";
import type { ThreadPost } from "@/features/thread/types";

interface ThreadConversationProps {
	post: ThreadPost;
	onSelectTag?: (tag: string) => void;
	onOpenImage?: (urls: string[], index: number) => void;
	onQuote?: (post: ThreadPost) => void;
	onToggleLike?: (post: ThreadPost) => void;
}

/**
 * 트위터 타임라인식 타래 그룹 — 루트+답글 총 3개까지는 연결선으로 전부 표시,
 * 그 이상이면 루트와 마지막 답글 사이를 "더 많은 답글 보기"(⋮)로 접는다.
 * previewReplies가 없으면 단일 카드로 폴백.
 */
export default function ThreadConversation({
	post,
	onSelectTag,
	onOpenImage,
	onQuote,
	onToggleLike,
}: ThreadConversationProps) {
	const router = useRouter();
	const replies = post.previewReplies ?? [];
	const hiddenCount = post.hiddenReplyCount ?? 0;

	if (replies.length === 0) {
		return (
			<ThreadPostCard
				post={post}
				onSelectTag={onSelectTag}
				onOpenImage={onOpenImage}
				onQuote={onQuote}
				onToggleLike={onToggleLike}
			/>
		);
	}

	return (
		<div className="border-b border-card-border">
			<ThreadPostCard
				post={post}
				onSelectTag={onSelectTag}
				onOpenImage={onOpenImage}
				onQuote={onQuote}
				onToggleLike={onToggleLike}
				noBorder
				connectBottom
			/>

			{hiddenCount > 0 && (
				<button
					type="button"
					onClick={() => router.push(`/thread/${post.id}`)}
					className="flex w-full items-center gap-3 px-4 py-1 text-left hover:bg-card-bg/40"
				>
					{/* 아바타 열과 정렬된 점선(⋮) */}
					<span className="flex w-9 shrink-0 flex-col items-center gap-[3px]">
						<span className="h-1 w-0.5 rounded-full bg-card-border" />
						<span className="h-1 w-0.5 rounded-full bg-card-border" />
						<span className="h-1 w-0.5 rounded-full bg-card-border" />
					</span>
					<span className="text-[13px] text-theme-primary hover:underline">
						더 많은 답글 보기
					</span>
				</button>
			)}

			{replies.map((reply, index) => (
				<ThreadPostCard
					key={reply.id}
					post={reply}
					onSelectTag={onSelectTag}
					onOpenImage={onOpenImage}
					onQuote={onQuote}
					onToggleLike={onToggleLike}
					noBorder
					connectTop
					connectBottom={index < replies.length - 1}
				/>
			))}
		</div>
	);
}
