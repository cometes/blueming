import { httpClient, getApiErrorMessage } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";
import { uploadFiles } from "@/shared/lib/http/uploads";
import type {
	CreateThreadPayload,
	ThreadFeedResponse,
	ThreadPost,
	ThreadTab,
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

export const uploadThreadImages = async (files: File[]): Promise<string[]> =>
	uploadFiles({ files, endpoint: "/api/thread/uploadImage" });
