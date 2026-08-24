import { httpClient, getApiErrorMessage } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";
import { uploadFiles } from "@/shared/lib/http/uploads";
import type {
	CreateThreadPayload,
	ThreadFeedResponse,
	ThreadPost,
	ThreadTab,
	UpdateThreadPayload,
} from "@/features/thread/types";

export const fetchThreadFeed = async (params: {
	tab: ThreadTab;
	tag?: string;
	cursor?: string | null;
	limit?: number;
}): Promise<ThreadFeedResponse> => {
	const requestParams: Record<string, string | number> = { tab: params.tab };
	if (params.tag) requestParams.tag = params.tag;
	if (params.cursor) requestParams.cursor = params.cursor;
	if (params.limit) requestParams.limit = params.limit;
	const response = await httpClient.get<ThreadFeedResponse>("/thread", {
		params: requestParams,
	});
	return response.data;
};

export const createThreadPost = async (
	payload: CreateThreadPayload,
): Promise<ThreadPost> => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.post<ThreadPost>("/thread", payload, {
			headers,
		});
		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "글 작성에 실패했습니다."));
	}
};

export interface ThreadDetailResponse {
	requiresMemberAccess: boolean;
	root: ThreadPost | null;
	replies: ThreadPost[];
	focusId?: string | null;
}

export const fetchThreadDetail = async (
	id: string,
): Promise<ThreadDetailResponse> => {
	const response = await httpClient.get<ThreadDetailResponse>(`/thread/${id}`);
	return response.data;
};

export const updateThreadPost = async (
	id: string,
	payload: UpdateThreadPayload,
): Promise<ThreadPost> => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.patch<ThreadPost>(
			`/thread/${id}`,
			payload,
			{ headers },
		);
		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "글 수정에 실패했습니다."));
	}
};

export const deleteThreadPost = async (id: string): Promise<void> => {
	try {
		const headers = await getAuthHeader();
		await httpClient.delete(`/thread/${id}`, { headers });
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "글 삭제에 실패했습니다."));
	}
};

export const uploadThreadImages = async (files: File[]): Promise<string[]> =>
	uploadFiles({ files, endpoint: "/api/thread/uploadImage" });
