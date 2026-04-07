/**
 * 페이지네이션 응답 공통 타입.
 * MemoListResponse, GuestbookListResponse, LibraryCommentListResponse 등에서 사용.
 */
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
}

/**
 * 페이지네이션 요청 파라미터 공통 타입.
 */
export interface PaginatedParams {
	page?: number;
	limit?: number;
}
