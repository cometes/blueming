import axios from "axios";
import { auth } from "@/lib/Firebase";
import { API_BASE } from "@/queries/apiClient";

export interface Comment {
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

export interface CommentListResponse {
	items: Comment[];
	total: number;
	page: number;
	limit: number;
}

interface CommentListParams {
	page?: number;
	limit?: number;
}

const getAuthHeader = async () => {
	const currentUser = auth.currentUser;
	if (!currentUser) return {};
	const token = await currentUser.getIdToken();
	return { Authorization: `Bearer ${token}` };
};

export const fetchCommentList = async (
	postId: string,
	params: CommentListParams = {}
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

	const headers = await getAuthHeader();
	const response = await axios.get<CommentListResponse>(url, { headers });
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
	}
) => {
	const headers = await getAuthHeader();
	const response = await axios.post(
		`${API_BASE}/library/${postId}/comments`,
		payload,
		{ headers }
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
	}
) => {
	const headers = await getAuthHeader();
	const response = await axios.put(
		`${API_BASE}/library/${postId}/comments/${commentId}`,
		payload,
		{ headers }
	);
	return response.data as { id: string };
};

export const deleteComment = async (
	postId: string,
	commentId: string,
	payload?: { pin?: string }
) => {
	const headers = await getAuthHeader();
	const response = await axios.delete(
		`${API_BASE}/library/${postId}/comments/${commentId}`,
		{
			data: payload,
			headers,
		}
	);
	return response.data as { id: string };
};

export const verifyCommentSecret = async (
	postId: string,
	commentId: string,
	payload?: { pin?: string }
) => {
	const headers = await getAuthHeader();
	const response = await axios.post(
		`${API_BASE}/library/${postId}/comments/${commentId}/verify`,
		payload,
		{ headers }
	);
	return response.data as {
		message: string;
		imageUrls?: string[];
	};
};

export const uploadCommentImages = async (files: File[]) => {
	if (files.length === 0) return [];
	const formData = new FormData();
	files.forEach((file) => {
		formData.append("file", file);
	});
	const response = await fetch(`${API_BASE}/library/comments/uploadImage`, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const data = await response.json();
	const urls = Array.isArray(data.files)
		? data.files.map((file: { url?: string }) => file.url).filter(Boolean)
		: data.file?.url
			? [data.file.url]
			: [];
	if (urls.length === 0) {
		throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
	}
	return urls as string[];
};
