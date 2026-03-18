export type MemoVisibility = "public" | "secret" | "protected";

export interface MemoAuthor {
	id?: string | null;
	name?: string | null;
	avatarUrl?: string | null;
}

export interface MemoReply {
	id: string;
	content: string;
	author?: MemoAuthor | null;
	createdAt: string | null;
	updatedAt: string | null;
	imageUrls?: string[];
}

export interface MemoItem {
	id: string;
	title: string;
	content: string | null;
	visibility: MemoVisibility;
	author?: MemoAuthor | null;
	authorId?: string | null;
	tags?: string[];
	imageUrls?: string[];
	replyCount?: number;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface MemoDetail extends MemoItem {
	replies: MemoReply[];
	requiresPassword?: boolean;
	requiresSecretAccess?: boolean;
}

export interface MemoListResponse {
	items: MemoItem[];
	total: number;
	page: number;
	limit: number;
}

export interface MemoListParams {
	page?: number;
	limit?: number;
	query?: string;
}

