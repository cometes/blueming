import { httpClient } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";
import { uploadSingleFile } from "@/shared/lib/http/uploads";
import type { GalleryImage, GallerySettings } from "@/features/gallery/types";
import type { PaginatedResponse } from "@/shared/types/api";

export type GalleryListResponse = PaginatedResponse<GalleryImage>;

export interface GalleryListParams {
	page?: number;
	limit?: number;
	sort?: "latest" | "oldest";
	tag?: string;
	query?: string;
}

export const fetchGalleryImages = async (params: GalleryListParams = {}) => {
	const response = await httpClient.get<GalleryListResponse>("/gallery", {
		params: {
			page: params.page ?? 1,
			limit: params.limit ?? 24,
			sort: params.sort ?? "latest",
			tag: params.tag ?? "",
			q: params.query ?? "",
		},
	});
	return response.data;
};

export const fetchGalleryTags = async () => {
	const response = await httpClient.get<string[]>("/gallery/tags");
	return response.data;
};

export const createGalleryImage = async (payload: {
	title: string;
	imageUrl: string;
	tags?: string[];
	category?: string;
	description?: string;
}) => {
	const headers = await getAuthHeader();
	const response = await httpClient.post<GalleryImage>("/gallery", payload, {
		headers,
	});
	return response.data;
};

export const updateGalleryImage = async (
	id: string,
	payload: {
		title?: string;
		imageUrl?: string;
		tags?: string[];
		category?: string;
		description?: string;
	},
) => {
	const headers = await getAuthHeader();
	const response = await httpClient.patch<GalleryImage>(`/gallery/${id}`, payload, {
		headers,
	});
	return response.data;
};

export const deleteGalleryImage = async (id: string) => {
	const headers = await getAuthHeader();
	const response = await httpClient.delete<{ id: string }>(`/gallery/${id}`, {
		headers,
	});
	return response.data;
};

export const uploadGalleryImage = async (file: File) =>
	uploadSingleFile(file, { endpoint: "/api/gallery/uploadImage" });

export const saveGallerySettings = async (
	payload: GallerySettings,
	saveSettings: (payload: { gallery: GallerySettings }) => Promise<void>,
) => saveSettings({ gallery: payload });
