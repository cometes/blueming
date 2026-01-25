import { cache } from "react";
import { API_BASE } from "@/queries/apiClient";

const defaultRevalidateSeconds = 60;

interface FetchLibraryListParams {
	page?: number;
	limit?: number;
	sort?: "latest" | "oldest" | "title";
	tag?: string;
	query?: string;
}

export const fetchLibraryListServer = cache(
	async (params: FetchLibraryListParams = {}) => {
		const searchParams = new URLSearchParams();
		if (params.page) {
			searchParams.set("page", String(params.page));
		}
		if (params.limit) {
			searchParams.set("limit", String(params.limit));
		}
		if (params.sort) {
			searchParams.set("sort", params.sort);
		}
		if (params.tag) {
			searchParams.set("tag", params.tag);
		}
		if (params.query) {
			searchParams.set("q", params.query);
			searchParams.set("query", params.query);
		}

		const query = searchParams.toString();
		const response = await fetch(
			`${API_BASE}/library/list${query ? `?${query}` : ""}`,
			{
				next: { revalidate: defaultRevalidateSeconds },
			}
		);
		if (!response.ok) {
			throw new Error("Failed to fetch list");
		}
		const data = await response.json();
		return { data };
	}
);

export const fetchLibrarySeriesServer = cache(async () => {
	const response = await fetch(`${API_BASE}/library/series`, {
		next: { revalidate: defaultRevalidateSeconds },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch series");
	}
	const data = await response.json();
	return { data };
});

export const fetchLibraryTagsServer = cache(async () => {
	const response = await fetch(`${API_BASE}/library/tags`, {
		next: { revalidate: defaultRevalidateSeconds },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch tags");
	}
	const data = await response.json();
	return { data };
});

export const fetchLibraryDetailServer = async (id: string | string[]) => {
	const response = await fetch(`${API_BASE}/library/detail/${id}`, {
		cache: "no-store",
	});
	if (!response.ok) {
		throw new Error("Failed to fetch detail");
	}
	const data = await response.json();
	return { data };
};

export const fetchLibrarySeriesListServer = cache(async (
	series: string | string[]
) => {
	const response = await fetch(`${API_BASE}/library/series/${series}`, {
		next: { revalidate: defaultRevalidateSeconds },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch series list");
	}
	const data = await response.json();
	return { data };
});
