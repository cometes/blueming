import { cache } from "react";
import { API_BASE } from "@/queries/apiClient";

const defaultRevalidateSeconds = 60;

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
