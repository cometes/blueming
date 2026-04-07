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
