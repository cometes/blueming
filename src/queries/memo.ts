import { apiClient, getApiErrorMessage, API_BASE } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";

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

export const fetchMemoList = async (params: MemoListParams = {}) => {
	const response = await apiClient.get<MemoListResponse>("/memo", {
		params: {
			page: params.page ?? 1,
			limit: params.limit ?? 24,
			q: params.query ?? "",
		},
	});
	return response.data;
};

export const fetchMemoDetail = async (
	id: string,
	options: { password?: string; includeAuth?: boolean } = {}
) => {
	const headers: Record<string, string> = {};
	if (options.password) {
		headers["x-memo-password"] = options.password;
	}
	if (options.includeAuth) {
		const authHeaders = await getAuthHeader();
		if (authHeaders.Authorization) {
			headers.Authorization = authHeaders.Authorization;
		}
	}
	const response = await apiClient.get<MemoDetail>(`/memo/${id}`, {
		headers,
	});
	return response.data;
};

export const createMemo = async (payload: {
	title: string;
	content: string;
	tags?: string[];
	visibility: MemoVisibility;
	password?: string;
	imageUrls?: string[];
}) => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.post<MemoDetail>("/memo", payload, {
			headers,
		});
		return response.data;
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "메모 작성에 실패했습니다.")
		);
	}
};

export const createMemoReply = async (
	id: string,
	payload: { content: string; imageUrls?: string[] }
) => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.post(`/memo/${id}/replies`, payload, {
			headers,
		});
		return response.data as { id: string };
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "답글 작성에 실패했습니다.")
		);
	}
};

export const updateMemoReply = async (
	id: string,
	replyId: string,
	payload: { content: string; imageUrls?: string[] }
) => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.patch(
			`/memo/${id}/replies/${replyId}`,
			payload,
			{ headers }
		);
		return response.data as { id: string };
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "답글 수정에 실패했습니다.")
		);
	}
};

export const deleteMemoReply = async (id: string, replyId: string) => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.delete(
			`/memo/${id}/replies/${replyId}`,
			{ headers }
		);
		return response.data as { success?: boolean };
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "답글 삭제에 실패했습니다.")
		);
	}
};

export const updateMemo = async (
	id: string,
	payload: {
		title: string;
		content: string;
		tags?: string[];
		visibility: MemoVisibility;
		password?: string;
		imageUrls?: string[];
	}
) => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.patch<MemoItem>(`/memo/${id}`, payload, {
			headers,
		});
		return response.data;
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "메모 수정에 실패했습니다.")
		);
	}
};

export const deleteMemo = async (id: string) => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.delete(`/memo/${id}`, { headers });
		return response.data as { success?: boolean };
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "메모 삭제에 실패했습니다.")
		);
	}
};

export const uploadMemoImages = async (files: File[]) => {
	if (files.length === 0) return [];
	const formData = new FormData();
	files.forEach((file) => {
		formData.append("file", file);
	});
	const headers = await getAuthHeader();
	const response = await fetch(`${API_BASE}/memo/uploadImage`, {
		method: "POST",
		body: formData,
		headers,
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}
	const data = await response.json();
	const urls = Array.isArray(data.files)
		? data.files.map((file: { url?: string }) => file.url).filter(Boolean)
		: [];
	if (urls.length === 0) {
		throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
	}
	return urls as string[];
};
