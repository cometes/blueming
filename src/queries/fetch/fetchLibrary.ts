import axios from "axios";

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
const defaultStaleTimeMs = 30_000;

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
	const searchParams = new URLSearchParams();
	if (params.page) {
		searchParams.set("page", params.page.toString());
	}
	if (params.limit) {
		searchParams.set("limit", params.limit.toString());
	}
	if (params.sort) {
		searchParams.set("sort", params.sort);
	}
	if (params.tag) {
		searchParams.set("tag", params.tag);
	}
	if (params.query) {
		searchParams.set("q", params.query);
	}

	const url = searchParams.toString()
		? `https://api-w5buphcleq-du.a.run.app/library/list?${searchParams.toString()}`
		: "https://api-w5buphcleq-du.a.run.app/library/list";

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

	const result = await axios.get(url);

	const data = result.data;
	if (useCache) {
		listCache.set(cacheKey, { data, timestamp: Date.now() });
	}

	return {
		data,
	};
};

export const fetchLibrarySeries = async () => {
	const result = await axios.get(
		"https://api-w5buphcleq-du.a.run.app/library/series"
	);

	const data = result.data;

	return {
		data,
	};
};

export async function fetchLibraryDetail(id: string | string[]) {
	const request = await axios.get(
		`https://api-w5buphcleq-du.a.run.app/library/detail/${id}`
	);

	const data = request.data;

	return {
		data,
	};
}

export const fetchLibrarySeriesList = async (series: string | string[]) => {
	const result = await axios.get(
		`https://api-w5buphcleq-du.a.run.app/library/series/${series}`
	);

	const data = result.data;

	return {
		data,
	};
};

export const fetchLibraryTags = async () => {
	const result = await axios.get(
		"https://api-w5buphcleq-du.a.run.app/library/tags"
	);

	const data = result.data;

	return {
		data,
	};
};
