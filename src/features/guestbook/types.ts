export interface GuestbookEntry {
	id: string;
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

export interface GuestbookListResponse {
	items: GuestbookEntry[];
	total: number;
	page: number;
	limit: number;
}

export interface GuestbookListParams {
	page?: number;
	limit?: number;
}

