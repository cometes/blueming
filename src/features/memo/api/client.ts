import { httpClient, getApiErrorMessage } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";
import { uploadFiles } from "@/shared/lib/http/uploads";
import type {
	MemoDetail,
	MemoItem,
	MemoListParams,
	MemoListResponse,
	MemoVisibility,
} from "@/features/memo/types";

export const fetchMemoList = async (params: MemoListParams = {}) => {
	const response = await httpClient.get<MemoListResponse>("/memo", {
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
	options: { password?: string; includeAuth?: boolean } = {},
) => {
	const headers: Record<string, string> = {};
	if (options.password) headers["x-memo-password"] = options.password;
	if (options.includeAuth) {
		const authHeaders = await getAuthHeader();
		if (authHeaders.Authorization) {
			headers.Authorization = authHeaders.Authorization;
		}
	}
	const response = await httpClient.get<MemoDetail>(`/memo/${id}`, { headers });
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
		const response = await httpClient.post<MemoDetail>("/memo", payload, {
			headers,
		});
		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "메모 작성에 실패했습니다."));
	}
};

export const createMemoReply = async (
	id: string,
	payload: {
		content: string;
		imageUrls?: string[];
		mentions?: Array<{ uid: string; name: string }>;
	},
) => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.post(`/memo/${id}/replies`, payload, {
			headers,
		});
		return response.data as { id: string };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "답글 작성에 실패했습니다."));
	}
};

export const updateMemoReply = async (
	id: string,
	replyId: string,
	payload: { content: string; imageUrls?: string[] },
) => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.patch(
			`/memo/${id}/replies/${replyId}`,
			payload,
			{ headers },
		);
		return response.data as { id: string };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "답글 수정에 실패했습니다."));
	}
};

export const deleteMemoReply = async (id: string, replyId: string) => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.delete(`/memo/${id}/replies/${replyId}`, {
			headers,
		});
		return response.data as { success?: boolean };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "답글 삭제에 실패했습니다."));
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
	},
) => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.patch<MemoItem>(`/memo/${id}`, payload, {
			headers,
		});
		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "메모 수정에 실패했습니다."));
	}
};

export const deleteMemo = async (id: string) => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.delete(`/memo/${id}`, { headers });
		return response.data as { success?: boolean };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "메모 삭제에 실패했습니다."));
	}
};

export const uploadMemoImages = async (files: File[]) =>
	uploadFiles({ files, endpoint: "/api/memo/uploadImage" });
