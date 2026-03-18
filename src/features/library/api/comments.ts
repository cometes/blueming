import axios from "axios";
import { API_BASE } from "@/shared/lib/http/client";
import type {
	FetchLibraryCommentListParams,
	LibraryCommentListResponse,
} from "@/features/library/types";
import { uploadFiles } from "@/shared/lib/http/uploads";

export const fetchCommentList = async (
	postId: string,
	params: FetchLibraryCommentListParams = {},
) => {
	const searchParams = new URLSearchParams();
	if (params.page) {
		searchParams.set("page", params.page.toString());
	}
	if (params.limit) {
		searchParams.set("limit", params.limit.toString());
	}

	const url = searchParams.toString()
		? `${API_BASE}/library/${postId}/comments?${searchParams.toString()}`
		: `${API_BASE}/library/${postId}/comments`;

	const response = await axios.get<LibraryCommentListResponse>(url, {
		withCredentials: true,
	});
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
	const response = await axios.post(
		`${API_BASE}/library/${postId}/comments`,
		payload,
		{ withCredentials: true },
	);
	return response.data as { id: string };
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
	const response = await axios.put(
		`${API_BASE}/library/${postId}/comments/${commentId}`,
		payload,
		{ withCredentials: true },
	);
	return response.data as { id: string };
};

export const deleteComment = async (
	postId: string,
	commentId: string,
	payload?: { pin?: string },
) => {
	const response = await axios.delete(
		`${API_BASE}/library/${postId}/comments/${commentId}`,
		{
			data: payload,
			withCredentials: true,
		},
	);
	return response.data as { id: string };
};

export const verifyCommentSecret = async (
	postId: string,
	commentId: string,
	payload?: { pin?: string },
) => {
	const response = await axios.post(
		`${API_BASE}/library/${postId}/comments/${commentId}/verify`,
		payload,
		{ withCredentials: true },
	);
	return response.data as {
		message: string;
		imageUrls?: string[];
	};
};

export const uploadCommentImages = async (files: File[]) =>
	uploadFiles({
		endpoint: `${API_BASE}/library/comments/uploadImage`,
		files,
		includeAuth: false,
	});
