import { apiClient } from "@/queries/apiClient";

interface FetchLibraryListParams {
	page?: number;
	limit?: number;
	sort?: "latest" | "oldest" | "title";
	tag?: string;
	query?: string;
}

interface FetchLibraryListOptions {
	useCache?: boolean;
	staleTimeMs?: number;
}

export const fetchLibraryList = async (
	params: FetchLibraryListParams = {},
	options: FetchLibraryListOptions = {}
) => {
	void options;
	const requestParams: Record<string, string | number> = {};
	if (params.page) {
		requestParams.page = params.page;
	}
	if (params.limit) {
		requestParams.limit = params.limit;
	}
	if (params.sort) {
		requestParams.sort = params.sort;
	}
	if (params.tag) {
		requestParams.tag = params.tag;
	}
	if (params.query) {
		requestParams.q = params.query;
		requestParams.query = params.query;
	}

	const result = await apiClient.get("/library/list", {
		params: requestParams,
	});

	const data = result.data;

	return {
		data,
	};
};

export const fetchLibrarySeries = async () => {
	const result = await apiClient.get("/library/series");

	const data = result.data;

	return {
		data,
	};
};

export async function fetchLibraryDetail(
	id: string | string[],
	options: FetchLibraryListOptions = {}
) {
	void options;
	const request = await apiClient.get(`/library/detail/${id}`);

	const data = request.data;

	return {
		data,
	};
}

export const fetchLibrarySeriesList = async (
	series: string | string[],
	options: FetchLibraryListOptions = {}
) => {
	void options;
	const result = await apiClient.get(`/library/series/${series}`);

	const data = result.data;

	return {
		data,
	};
};

export const fetchLibraryTags = async (options: FetchLibraryListOptions = {}) => {
	void options;
	const result = await apiClient.get("/library/tags");

	const data = result.data;

	return {
		data,
	};
};
