import { apiClient, getApiErrorMessage } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { CreateLibraryPayload } from "@/queries/set/createLibrary";

export interface UpdateLibraryResponse {
	postId: string;
	updatedAt?: string | null;
	slug?: string | null;
}

export const updateLibraryPost = async (
	postId: string,
	payload: CreateLibraryPayload
): Promise<UpdateLibraryResponse> => {
	try {
		const allow = payload.visibility;
		const slug = payload.slug?.trim() || undefined;
		const headers = await getAuthHeader();
		const response = await apiClient.put<UpdateLibraryResponse>(
			`/library/update/${postId}`,
			{
				title: payload.title,
				subtitle: payload.subtitle,
				content: payload.content,
				slug,
				tags: payload.tags,
				series: payload.series,
				backgroundType: payload.backgroundType,
				backgroundColor: payload.backgroundColor,
				backgroundImage: payload.backgroundImage,
				enableBackdrop: payload.enableBackdrop,
				allow,
				password: allow === "password" ? payload.password : null,
				thumbnail: payload.thumbnail,
				pinned: payload.pinned ?? false,
			},
			{ headers }
		);

		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "게시글 수정에 실패했습니다."));
	}
};
