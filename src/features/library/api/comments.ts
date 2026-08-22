import { httpClient, API_BASE } from "@/shared/lib/http/client";
import type {
	FetchLibraryCommentListParams,
	LibraryCommentListResponse,
} from "@/features/library/types";
import { uploadFiles } from "@/shared/lib/http/uploads";

export const fetchCommentList = async (
	postId: string,
	params: FetchLibraryCommentListParams = {},
) => {
	const response = await httpClient.get<LibraryCommentListResponse>(
		`/library/${postId}/comments`,
		{
			params: {
				page: params.page,
				limit: params.limit,
			},
		},
	);
	return response.data;
};

export const createComment = async (
	postId: string,
	payload: {
		message: string;
		displayName?: string;
		pin?: string;
		isSecret?: boolean;
		imageUrls?: string[];
	},
) => {
	const response = await httpClient.post<{ id: string }>(
		`/library/${postId}/comments`,
		payload,
	);
	return response.data;
};

export const updateComment = async (
	postId: string,
	commentId: string,
	payload: {
		message: string;
		pin?: string;
		isSecret?: boolean;
		imageUrls?: string[];
	},
) => {
	const response = await httpClient.put<{ id: string }>(
		`/library/${postId}/comments/${commentId}`,
		payload,
	);
	return response.data;
};

export const deleteComment = async (
	postId: string,
	commentId: string,
	payload?: { pin?: string },
) => {
	const response = await httpClient.delete<{ id: string }>(
		`/library/${postId}/comments/${commentId}`,
		{ data: payload },
	);
	return response.data;
};

export const verifyCommentSecret = async (
	postId: string,
	commentId: string,
	payload?: { pin?: string },
) => {
	const response = await httpClient.post<{
		message: string;
		imageUrls?: string[];
	}>(`/library/${postId}/comments/${commentId}/verify`, payload);
	return response.data;
};

export const uploadCommentImages = async (files: File[]) =>
	uploadFiles({
		endpoint: `${API_BASE}/library/comments/uploadImage`,
		files,
		includeAuth: false,
	});
