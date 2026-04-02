import { httpClient, getApiErrorMessage } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";
import type {
	CreateLibraryPayload,
	CreateLibraryResponse,
	DeleteLibraryResponse,
	FetchLibraryListOptions,
	FetchLibraryListParams,
	LibraryDetailAccessOptions,
	LibraryPinResponse,
	RecordViewResponse,
	UpdateLibraryResponse,
} from "@/features/library/types";

export const fetchLibraryList = async (
	params: FetchLibraryListParams = {},
	options: FetchLibraryListOptions = {},
) => {
	void options;
	const requestParams: Record<string, string | number> = {};
	if (params.page) requestParams.page = params.page;
	if (params.limit) requestParams.limit = params.limit;
	if (params.sort) requestParams.sort = params.sort;
	if (params.tag) requestParams.tag = params.tag;
	if (params.query) {
		requestParams.q = params.query;
		requestParams.query = params.query;
	}

	const result = await httpClient.get("/library/list", {
		params: requestParams,
	});

	return { data: result.data };
};

export const fetchLibrarySeries = async () => {
	const result = await httpClient.get("/library/series");
	return { data: result.data };
};

export const fetchLibraryDetail = async (
	id: string | string[],
	options: FetchLibraryListOptions = {},
) => {
	void options;
	const request = await httpClient.get(`/library/detail/${id}`);
	return { data: request.data };
};

export const fetchLibrarySeriesList = async (
	series: string | string[],
	options: FetchLibraryListOptions = {},
) => {
	void options;
	const result = await httpClient.get(`/library/series/${series}`);
	return { data: result.data };
};

export const fetchLibraryTags = async (
	options: FetchLibraryListOptions = {},
) => {
	void options;
	const result = await httpClient.get("/library/tags");
	return { data: result.data };
};

export const fetchLibraryDetailWithAccess = async (
	id: string,
	options: LibraryDetailAccessOptions = {},
) => {
	const headers: Record<string, string> = {};
	if (options.password) {
		headers["x-post-password"] = encodeURIComponent(options.password);
	}
	if (options.includeAuth) {
		const authHeaders = await getAuthHeader();
		Object.assign(headers, authHeaders);
	}

	const response = await httpClient.get(`/library/detail/${id}`, {
		headers,
	});
	return response.data;
};

export const createLibraryPost = async (
	payload: CreateLibraryPayload,
): Promise<CreateLibraryResponse> => {
	try {
		const allow = payload.visibility;
		const slug = payload.slug?.trim() || undefined;
		const headers = await getAuthHeader();
		const response = await httpClient.post<CreateLibraryResponse>(
			"/library/create",
			{
				title: payload.title,
				subtitle: payload.subtitle,
				content: payload.content,
				slug,
				tags: payload.tags,
				series: payload.series,
				backgroundType: payload.backgroundType,
				backgroundColor: payload.backgroundColor,
				backgroundImage: payload.backgroundImage,
				enableBackdrop: payload.enableBackdrop,
				allow,
				password: allow === "password" ? payload.password : null,
				thumbnail: payload.thumbnail,
				pinned: payload.pinned ?? false,
			},
			{ headers },
		);

		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "게시글 생성에 실패했습니다."));
	}
};

export const updateLibraryPost = async (
	postId: string,
	payload: CreateLibraryPayload,
): Promise<UpdateLibraryResponse> => {
	try {
		const allow = payload.visibility;
		const slug = payload.slug?.trim() || undefined;
		const headers = await getAuthHeader();
		const response = await httpClient.put<UpdateLibraryResponse>(
			`/library/update/${postId}`,
			{
				title: payload.title,
				subtitle: payload.subtitle,
				content: payload.content,
				slug,
				tags: payload.tags,
				series: payload.series,
				backgroundType: payload.backgroundType,
				backgroundColor: payload.backgroundColor,
				backgroundImage: payload.backgroundImage,
				enableBackdrop: payload.enableBackdrop,
				allow,
				password: allow === "password" ? payload.password : null,
				thumbnail: payload.thumbnail,
				pinned: payload.pinned ?? false,
			},
			{ headers },
		);

		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "게시글 수정에 실패했습니다."));
	}
};

export const deleteLibraryPost = async (
	postId: string,
): Promise<DeleteLibraryResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.delete<DeleteLibraryResponse>(
			`/library/delete/${postId}`,
			{ headers },
		);
		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "게시글 삭제에 실패했습니다."));
	}
};

export const setLibraryPin = async (
	id: string,
	pinned: boolean,
): Promise<LibraryPinResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.post(
			`/library/pin/${id}`,
			{ pinned },
			{ headers },
		);
		return response.data as LibraryPinResponse;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "고정 상태 변경에 실패했습니다."));
	}
};

export const recordLibraryView = async (postId: string): Promise<RecordViewResponse> => {
	try {
		const response = await httpClient.post<RecordViewResponse>(
			`/library/view/${postId}`,
		);
		return response.data;
	} catch {
		return { counted: false, viewCount: 0 };
	}
};

export const checkSlugAvailability = async (slug: string): Promise<boolean> => {
	try {
		const response = await httpClient.get<{ available: boolean }>(
			`/library/check-slug/${slug}`,
		);

		return response.data.available;
	} catch {
		return true;
	}
};
