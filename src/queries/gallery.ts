import { API_BASE, apiClient } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { GalleryImage } from "@/types/gallery";

export interface GalleryListResponse {
	items: GalleryImage[];
	total: number;
	page: number;
	limit: number;
}

export interface GalleryListParams {
	page?: number;
	limit?: number;
	sort?: "latest" | "oldest";
	tag?: string;
	query?: string;
}

export const fetchGalleryImages = async (params: GalleryListParams = {}) => {
	const response = await apiClient.get<GalleryListResponse>("/gallery", {
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
	const response = await apiClient.get<string[]>("/gallery/tags");
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
	const response = await apiClient.post<GalleryImage>("/gallery", payload, {
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
	}
) => {
	const headers = await getAuthHeader();
	const response = await apiClient.put<GalleryImage>(`/gallery/${id}`, payload, {
		headers,
	});
	return response.data;
};

export const deleteGalleryImage = async (id: string) => {
	const headers = await getAuthHeader();
	const response = await apiClient.delete<{ id: string }>(`/gallery/${id}`, {
		headers,
	});
	return response.data;
};

export const uploadGalleryImage = async (file: File) => {
	const formData = new FormData();
	const sanitizedFileName = encodeURIComponent(file.name);
	const processedFile = new File([file], sanitizedFileName, {
		type: file.type,
	});
	formData.append("file", processedFile);

	const headers = await getAuthHeader();
	const response = await fetch(`${API_BASE}/gallery/uploadImage`, {
		method: "POST",
		headers,
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const data = await response.json();
	const url = data.files?.[0]?.url;
	if (!url) {
		throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
	}

	return url as string;
};
