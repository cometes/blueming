import type { MentionEntry } from "@/features/mention/types";

export type ThreadVisibility = "public" | "member";

export interface ThreadAuthor {
	id: string;
	name: string;
	avatarUrl: string;
}

export interface ThreadQuoteSnapshot {
	id: string;
	authorId: string | null;
	authorName: string;
	excerpt: string;
	imageUrl: string | null;
	visibility: ThreadVisibility;
}

export interface ThreadPost {
	id: string;
	/** locked(멤버 공개 + 비회원)면 null */
	content: string | null;
	author: ThreadAuthor | null;
	authorId: string | null;
	mentions: MentionEntry[];
	imageUrls: string[];
	youtubeVideoId: string | null;
	parentId: string | null;
	rootId: string | null;
	replyToAuthorName: string | null;
	quoteId: string | null;
	quote: ThreadQuoteSnapshot | null;
	visibility: ThreadVisibility;
	tags: string[];
	replyCount: number;
	quoteCount: number;
	locked: boolean;
	createdAt: string | null;
	updatedAt: string | null;
	/** 홈 피드 타래 미리보기 — 답글 ≤2개면 전부, ≥3개면 마지막 1개 */
	previewReplies?: ThreadPost[];
	/** 미리보기에서 생략된 답글 수 */
	hiddenReplyCount?: number;
}

export type ThreadTab = "all" | "roots" | "mine" | "tag";

export interface ThreadFeedResponse {
	items: ThreadPost[];
	nextCursor: string | null;
}

export interface CreateThreadPayload {
	content: string;
	imageUrls?: string[];
	tags?: string[];
	visibility?: ThreadVisibility;
	parentId?: string;
	quoteId?: string;
	mentions?: MentionEntry[];
}
