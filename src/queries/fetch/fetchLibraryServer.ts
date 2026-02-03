import { cache } from "react";
import { API_BASE } from "@/queries/apiClient";
import { headers } from "next/headers";

const resolveOrigin = async () => {
	if (API_BASE.startsWith("http")) {
		const parsed = new URL(API_BASE);
		return parsed.origin;
	}
	const hdrs = await headers();
	const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
	const proto = hdrs.get("x-forwarded-proto") ?? "http";
	return `${proto}://${host}`;
};

const buildUrl = async (path: string) => {
	if (API_BASE.startsWith("http")) {
		return new URL(path, API_BASE).toString();
	}
	const origin = await resolveOrigin();
	const basePath = API_BASE.startsWith("/") ? API_BASE : `/${API_BASE}`;
	const suffix = path.startsWith("/") ? path : `/${path}`;
	return `${origin}${basePath}${suffix}`;
};

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
		const url = await buildUrl(
			`/library/list${query ? `?${query}` : ""}`
		);
		const response = await fetch(url, {
			next: { revalidate: defaultRevalidateSeconds },
		});
		if (!response.ok) {
			throw new Error("Failed to fetch list");
		}
		const data = await response.json();
		return { data };
	}
);

export const fetchLibrarySeriesServer = cache(async () => {
	const url = await buildUrl("/library/series");
	const response = await fetch(url, {
		next: { revalidate: defaultRevalidateSeconds },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch series");
	}
	const data = await response.json();
	return { data };
});

export const fetchLibraryTagsServer = cache(async () => {
	const url = await buildUrl("/library/tags");
	const response = await fetch(url, {
		next: { revalidate: defaultRevalidateSeconds },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch tags");
	}
	const data = await response.json();
	return { data };
});

export const fetchLibraryDetailServer = async (id: string | string[]) => {
	const resolvedId = Array.isArray(id) ? id.join("/") : id;
	const url = await buildUrl(`/library/detail/${resolvedId}`);
	const response = await fetch(url, {
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
	const resolvedSeries = Array.isArray(series) ? series.join("/") : series;
	const url = await buildUrl(`/library/series/${resolvedSeries}`);
	const response = await fetch(url, {
		next: { revalidate: defaultRevalidateSeconds },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch series list");
	}
	const data = await response.json();
	return { data };
});
