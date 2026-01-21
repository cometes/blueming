import { apiClient } from "@/queries/apiClient";
import { CACHE_POLICY } from "@/queries/cachePolicy";

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

const listCache = new Map<string, { data: unknown; timestamp: number }>();
const sharedCache = new Map<string, { data: unknown; timestamp: number }>();
const defaultStaleTimeMs = CACHE_POLICY.libraryStaleMs;

const getSharedCache = (cacheKey: string, staleTimeMs: number) => {
	const cached = sharedCache.get(cacheKey);
	if (!cached) return undefined;
	if (Date.now() - cached.timestamp < staleTimeMs) {
		return cached.data;
	}
	return undefined;
};

const setSharedCache = (cacheKey: string, data: unknown) => {
	sharedCache.set(cacheKey, { data, timestamp: Date.now() });
};

const buildListCacheKey = (params: FetchLibraryListParams) => {
	const entries = Object.entries(params)
		.filter(([, value]) => value !== undefined && value !== "")
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${key}=${value}`);
	return entries.join("&") || "default";
};

export const fetchLibraryList = async (
	params: FetchLibraryListParams = {},
	options: FetchLibraryListOptions = {}
) => {
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

	const useCache = options.useCache !== false && typeof window !== "undefined";
	const staleTimeMs = options.staleTimeMs ?? defaultStaleTimeMs;
	const cacheKey = buildListCacheKey(params);

	if (useCache) {
		const cached = listCache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < staleTimeMs) {
			return {
				data: cached.data,
			};
		}
	}

	const result = await apiClient.get("/library/list", {
		params: requestParams,
	});

	const data = result.data;
	if (useCache) {
		listCache.set(cacheKey, { data, timestamp: Date.now() });
	}

	return {
		data,
	};
};

export const fetchLibrarySeries = async () => {
	const cacheKey = "library:series";
	const useCache = typeof window !== "undefined";
	const cached = useCache ? getSharedCache(cacheKey, defaultStaleTimeMs) : undefined;
	if (cached) {
		return { data: cached };
	}

	const result = await apiClient.get("/library/series");

	const data = result.data;
	if (useCache) {
		setSharedCache(cacheKey, data);
	}

	return {
		data,
	};
};

export async function fetchLibraryDetail(
	id: string | string[],
	options: FetchLibraryListOptions = {}
) {
	const cacheKey = `library:detail:${id}`;
	const useCache = options.useCache !== false && typeof window !== "undefined";
	const staleTimeMs = options.staleTimeMs ?? defaultStaleTimeMs;
	const cached = useCache ? getSharedCache(cacheKey, staleTimeMs) : undefined;
	if (cached) {
		return { data: cached };
	}

	const request = await apiClient.get(`/library/detail/${id}`);

	const data = request.data;
	if (useCache) {
		setSharedCache(cacheKey, data);
	}

	return {
		data,
	};
}

export const fetchLibrarySeriesList = async (
	series: string | string[],
	options: FetchLibraryListOptions = {}
) => {
	const cacheKey = `library:series:${series}`;
	const useCache = options.useCache !== false && typeof window !== "undefined";
	const staleTimeMs = options.staleTimeMs ?? defaultStaleTimeMs;
	const cached = useCache ? getSharedCache(cacheKey, staleTimeMs) : undefined;
	if (cached) {
		return { data: cached };
	}

	const result = await apiClient.get(`/library/series/${series}`);

	const data = result.data;
	if (useCache) {
		setSharedCache(cacheKey, data);
	}

	return {
		data,
	};
};

export const fetchLibraryTags = async (options: FetchLibraryListOptions = {}) => {
	const cacheKey = "library:tags";
	const useCache = options.useCache !== false && typeof window !== "undefined";
	const staleTimeMs = options.staleTimeMs ?? defaultStaleTimeMs;
	const cached = useCache ? getSharedCache(cacheKey, staleTimeMs) : undefined;
	if (cached) {
		return { data: cached };
	}

	const result = await apiClient.get("/library/tags");

	const data = result.data;
	if (useCache) {
		setSharedCache(cacheKey, data);
	}

	return {
		data,
	};
};
