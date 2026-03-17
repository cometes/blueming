import { httpClient, API_BASE } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";
import { uploadSingleFile } from "@/shared/lib/http/uploads";
import type { PhotoBoardPost } from "@/data/photoboard";

export interface PhotoboardListResponse {
	items: PhotoBoardPost[];
}

export const fetchPhotoboardPosts = async (limit = 18) => {
	const response = await httpClient.get<PhotoboardListResponse>("/photoboard", {
		params: { limit },
	});
	return response.data;
};

export const fetchPhotoboardPostsServer = async (limit = 18) => {
	try {
		const response = await fetch(`${API_BASE}/photoboard?limit=${limit}`, {
			next: { revalidate: 60 },
		});
		if (!response.ok) {
			return { data: { items: [] } };
		}
		const data = await response.json();
		return { data };
	} catch {
		return { data: { items: [] } };
	}
};

export const createPhotoboardPost = async (payload: {
	caption: string;
	imageUrl: string;
	tags?: string[];
}) => {
	const headers = await getAuthHeader();
	const response = await httpClient.post<PhotoBoardPost>("/photoboard", payload, {
		headers,
	});
	return response.data;
};

export const updatePhotoboardPost = async (
	id: string,
	payload: {
		caption?: string;
		imageUrl?: string;
		tags?: string[];
	},
) => {
	const headers = await getAuthHeader();
	const response = await httpClient.put<PhotoBoardPost>(`/photoboard/${id}`, payload, {
		headers,
	});
	return response.data;
};

export const deletePhotoboardPost = async (id: string) => {
	const headers = await getAuthHeader();
	const response = await httpClient.delete<{ id: string }>(`/photoboard/${id}`, {
		headers,
	});
	return response.data;
};

export const uploadPhotoboardImage = async (file: File) =>
	uploadSingleFile(file, { endpoint: "/api/photoboard/uploadImage" });
