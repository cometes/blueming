import { headers } from "next/headers";
import { API_BASE } from "@/shared/lib/http/client";
import type { GuestbookListParams, GuestbookListResponse } from "@/features/guestbook/types";

const resolveOrigin = async () => {
	if (API_BASE.startsWith("http")) {
		return new URL(API_BASE).origin;
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

export const fetchGuestbookListServer = async (
	params: GuestbookListParams = {},
) => {
	const searchParams = new URLSearchParams();
	if (params.page) searchParams.set("page", params.page.toString());
	if (params.limit) searchParams.set("limit", params.limit.toString());
	const query = searchParams.toString();
	const url = await buildUrl(`/guestbook${query ? `?${query}` : ""}`);
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) {
		return {
			items: [],
			total: 0,
			page: params.page ?? 1,
			limit: params.limit ?? 10,
		} as GuestbookListResponse;
	}
	return (await response.json()) as GuestbookListResponse;
};
