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

export interface LibraryComment {
	id: string;
	postId: string;
	authorType: "user" | "anon";
	displayName: string;
	uid?: string | null;
	photoURL?: string | null;
	imageUrls: string[];
	message: string;
	isSecret?: boolean;
	isAdmin?: boolean;
	canEdit?: boolean;
	canDelete?: boolean;
	canViewSecret?: boolean;
	masked?: boolean;
	isOwn?: boolean;
	displayMessage?: string;
	displayImageUrls?: string[];
	authorLabel?: string;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface LibraryCommentListResponse {
	items: LibraryComment[];
	total: number;
	page: number;
	limit: number;
}

export interface FetchLibraryCommentListParams {
	page?: number;
	limit?: number;
}
