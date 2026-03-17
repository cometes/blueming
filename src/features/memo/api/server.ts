import { headers } from "next/headers";
import { API_BASE } from "@/shared/lib/http/client";
import type {
	MemoDetail,
	MemoListParams,
	MemoListResponse,
} from "@/features/memo/types";

const resolveOrigin = async () => {
	if (API_BASE.startsWith("http")) {
		const parsed = new URL(API_BASE);
		return parsed.origin;
	}
	const hdrs = await headers();
	const host =
		hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
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

export const fetchMemoListServer = async (params: MemoListParams = {}) => {
	try {
		const query = params.query ? `q=${encodeURIComponent(params.query)}` : "q=";
		const page = params.page ?? 1;
		const limit = params.limit ?? 24;
		const url = await buildUrl(`/memo?page=${page}&limit=${limit}&${query}`);
		const response = await fetch(url, { next: { revalidate: 60 } });
		if (!response.ok) {
			return { items: [], total: 0, page, limit } as MemoListResponse;
		}
		return (await response.json()) as MemoListResponse;
	} catch {
		return {
			items: [],
			total: 0,
			page: params.page ?? 1,
			limit: params.limit ?? 24,
		};
	}
};

export const fetchMemoDetailServer = async (id: string) => {
	try {
		const url = await buildUrl(`/memo/${id}`);
		const response = await fetch(url, {
			next: { revalidate: 60 },
		});
		if (!response.ok) return null;
		return (await response.json()) as MemoDetail;
	} catch {
		return null;
	}
};
