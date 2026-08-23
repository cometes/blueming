import { httpClient, getApiErrorMessage } from "@/shared/lib/http/client";
import { uploadFiles } from "@/shared/lib/http/uploads";
import type {
	GuestbookEntry,
	GuestbookListParams,
	GuestbookListResponse,
} from "@/features/guestbook/types";

export const fetchGuestbookList = async (
	params: GuestbookListParams = {},
) => {
	const response = await httpClient.get<GuestbookListResponse>("/guestbook", {
		params: {
			...(params.page && { page: params.page }),
			...(params.limit && { limit: params.limit }),
		},
	});
	return response.data;
};

export const createGuestbookEntry = async (payload: {
	message: string;
	displayName?: string;
	pin?: string;
	isSecret?: boolean;
	imageUrls?: string[];
	mentions?: Array<{ uid: string; name: string }>;
}) => {
	try {
		const response = await httpClient.post("/guestbook", payload);
		return response.data as { id: string };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "방명록 작성에 실패했습니다."));
	}
};

export const updateGuestbookEntry = async (
	id: string,
	payload: {
		message: string;
		pin?: string;
		isSecret?: boolean;
		imageUrls?: string[];
	},
) => {
	try {
		const response = await httpClient.patch(`/guestbook/${id}`, payload);
		return response.data as { id: string };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "방명록 수정에 실패했습니다."));
	}
};

export const deleteGuestbookEntry = async (
	id: string,
	payload?: { pin?: string },
) => {
	try {
		const response = await httpClient.delete(`/guestbook/${id}`, {
			data: payload,
		});
		return response.data as { id: string };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "방명록 삭제에 실패했습니다."));
	}
};

export const verifyGuestbookSecret = async (
	id: string,
	payload?: { pin?: string },
) => {
	try {
		const response = await httpClient.post(`/guestbook/${id}/verify`, payload);
		return response.data as {
			message: string;
			imageUrls?: string[];
		};
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "비밀글 확인에 실패했습니다."));
	}
};

export const uploadGuestbookImages = async (files: File[]) =>
	uploadFiles({ files, endpoint: "/api/guestbook/uploadImage" });

export type { GuestbookEntry };
