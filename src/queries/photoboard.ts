import { API_BASE, apiClient } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { PhotoBoardPost } from "@/data/photoboard";

export interface PhotoboardListResponse {
	items: PhotoBoardPost[];
}

export const fetchPhotoboardPosts = async (limit = 18) => {
	const response = await apiClient.get<PhotoboardListResponse>("/photoboard", {
		params: { limit },
	});
	return response.data;
};

// 서버 사이드에서 사용하는 fetch 함수
export const fetchPhotoboardPostsServer = async (limit = 18) => {
	try {
		const response = await fetch(`${API_BASE}/photoboard?limit=${limit}`, {
			cache: "no-store",
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
	const response = await apiClient.post<PhotoBoardPost>("/photoboard", payload, {
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
	}
) => {
	const headers = await getAuthHeader();
	const response = await apiClient.put<PhotoBoardPost>(
		`/photoboard/${id}`,
		payload,
		{
			headers,
		}
	);
	return response.data;
};

export const deletePhotoboardPost = async (id: string) => {
	const headers = await getAuthHeader();
	const response = await apiClient.delete<{ id: string }>(`/photoboard/${id}`, {
		headers,
	});
	return response.data;
};

export const uploadPhotoboardImage = async (file: File) => {
	const formData = new FormData();
	const sanitizedFileName = encodeURIComponent(file.name);
	const processedFile = new File([file], sanitizedFileName, {
		type: file.type,
	});
	formData.append("file", processedFile);

	const headers = await getAuthHeader();
	const response = await fetch(`${API_BASE}/photoboard/uploadImage`, {
		method: "POST",
		headers,
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const data = await response.json();
	const url = data.file?.url || data.files?.[0]?.url;
	if (!url) {
		throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
	}

	return url as string;
};
