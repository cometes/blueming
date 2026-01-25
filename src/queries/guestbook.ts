import axios from "axios";
import { auth } from "@/lib/Firebase";

export interface GuestbookEntry {
	id: string;
	authorType: "user" | "anon";
	displayName: string;
	uid?: string | null;
	photoURL?: string | null;
	imageUrls: string[];
	message: string;
	isSecret?: boolean;
	isAdmin?: boolean;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface GuestbookListResponse {
	items: GuestbookEntry[];
	total: number;
	page: number;
	limit: number;
}

interface GuestbookListParams {
	page?: number;
	limit?: number;
}

const API_BASE = "https://api-w5buphcleq-du.a.run.app";

const getAuthHeader = async () => {
	const currentUser = auth.currentUser;
	if (!currentUser) return {};
	const token = await currentUser.getIdToken();
	return { Authorization: `Bearer ${token}` };
};

export const fetchGuestbookList = async (
	params: GuestbookListParams = {}
) => {
	const searchParams = new URLSearchParams();
	if (params.page) {
		searchParams.set("page", params.page.toString());
	}
	if (params.limit) {
		searchParams.set("limit", params.limit.toString());
	}

	const url = searchParams.toString()
		? `${API_BASE}/guestbook?${searchParams.toString()}`
		: `${API_BASE}/guestbook`;

	const headers = await getAuthHeader();
	const response = await axios.get<GuestbookListResponse>(url, { headers });
	return response.data;
};

export const createGuestbookEntry = async (payload: {
	message: string;
	displayName?: string;
	pin?: string;
	isSecret?: boolean;
	imageUrls?: string[];
}) => {
	const headers = await getAuthHeader();
	const response = await axios.post(`${API_BASE}/guestbook`, payload, {
		headers,
	});
	return response.data as { id: string };
};

export const updateGuestbookEntry = async (
	id: string,
	payload: {
		message: string;
		pin?: string;
		isSecret?: boolean;
		imageUrls?: string[];
	}
) => {
	const headers = await getAuthHeader();
	const response = await axios.put(`${API_BASE}/guestbook/${id}`, payload, {
		headers,
	});
	return response.data as { id: string };
};

export const deleteGuestbookEntry = async (
	id: string,
	payload?: { pin?: string }
) => {
	const headers = await getAuthHeader();
	const response = await axios.delete(`${API_BASE}/guestbook/${id}`, {
		data: payload,
		headers,
	});
	return response.data as { id: string };
};

export const verifyGuestbookSecret = async (
	id: string,
	payload?: { pin?: string }
) => {
	const headers = await getAuthHeader();
	const response = await axios.post(`${API_BASE}/guestbook/${id}/verify`, payload, {
		headers,
	});
	return response.data as {
		message: string;
		imageUrls?: string[];
	};
};

export const uploadGuestbookImages = async (files: File[]) => {
	if (files.length === 0) return [];
	const formData = new FormData();
	files.forEach((file) => {
		formData.append("file", file);
	});
	const response = await fetch(`${API_BASE}/guestbook/uploadImage`, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const data = await response.json();
	const urls = Array.isArray(data.files)
		? data.files.map((file: { url?: string }) => file.url).filter(Boolean)
		: data.file?.url
			? [data.file.url]
			: [];
	if (urls.length === 0) {
		throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
	}
	return urls as string[];
};
