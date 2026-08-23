/**
 * 댓글/방명록 엔트리 공통 베이스 타입.
 * GuestbookEntry, LibraryComment가 이를 extends함.
 */
export interface BaseCommentEntry {
	id: string;
	mentions?: Array<{ uid: string; name: string }>;
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
