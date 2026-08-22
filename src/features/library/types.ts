import type { BaseCommentEntry } from "@/shared/types/comment";
import type { PaginatedResponse, PaginatedParams } from "@/shared/types/api";

export interface FetchLibraryListParams {
	page?: number;
	limit?: number;
	sort?: "latest" | "oldest" | "title";
	tag?: string;
	query?: string;
}

export interface FetchLibraryListOptions {
	useCache?: boolean;
	staleTimeMs?: number;
}

export interface CreateLibraryPayload {
	title: string;
	subtitle?: string;
	content: string;
	slug?: string;
	tags?: string[];
	series?: string;
	backgroundType?: "default" | "color" | "image";
	backgroundColor?: string;
	backgroundImage?: string;
	enableBackdrop?: boolean;
	visibility: "all" | "password" | "secret";
	password?: string;
	thumbnail?: string;
	pinned?: boolean;
}

export interface CreateLibraryResponse {
	postId: string;
	createdAt: string | null;
	slug?: string | null;
}

export interface UpdateLibraryResponse {
	postId: string;
	updatedAt?: string | null;
	slug?: string | null;
}

export interface DeleteLibraryResponse {
	postId: string;
	deletedAt?: string | null;
}

export interface LibraryPinResponse {
	id: string;
	pinned: boolean;
}

export interface LibraryDetailAccessOptions {
	password?: string;
	includeAuth?: boolean;
}

/** 목록 API가 반환하는 게시글 요약. 각 화면의 로컬 LibraryItem 인터페이스들의 상위 집합. */
export interface LibraryItemSummary {
	id: string;
	title: string;
	createdAt: string;
	subtitle?: string;
	author?: string;
	slug?: string;
	tags?: string[];
	thumbnail?: string;
	pinned?: boolean;
	commentCount?: number;
	viewCount?: number;
	allow?: "all" | "password" | "secret";
	series?: string;
	postLength?: number;
	lastUpdatedThumbnail?: string;
	lastUpdatedDate?: string;
}

export interface LibraryListResponseData {
	items?: LibraryItemSummary[];
	pinnedItems?: LibraryItemSummary[];
	total?: number;
}

export interface LibraryDetailData extends Partial<LibraryPinResponse> {
	id?: string;
	slug?: string;
	title?: string;
	subtitle?: string;
	content?: unknown;
	allow?: string;
	requiresPassword?: boolean;
	viewCount?: number;
	authorId?: string | null;
	author?: string | { id?: string | null } | null;
	authorPhotoURL?: string | null;
	uid?: string | null;
	createdAt?: string | null;
	tags?: string[];
	backgroundType?: string;
	backgroundColor?: string;
	backgroundImage?: string;
	enableBackdrop?: boolean;
	prevPost?: {
		id?: string;
		slug?: string;
		title?: string;
	} | null;
	nextPost?: {
		id?: string;
		slug?: string;
		title?: string;
	} | null;
}

export interface RecordViewResponse {
	counted: boolean;
	viewCount: number;
}

// LibraryComment는 BaseCommentEntry에 postId가 추가된 형태
export interface LibraryComment extends BaseCommentEntry {
	postId: string;
}

export type LibraryCommentListResponse = PaginatedResponse<LibraryComment>;

export type FetchLibraryCommentListParams = PaginatedParams;
