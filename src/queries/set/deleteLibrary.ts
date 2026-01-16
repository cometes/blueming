import { apiClient, getApiErrorMessage } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";

export interface DeleteLibraryResponse {
	postId: string;
	deletedAt?: string | null;
}

export const deleteLibraryPost = async (
	postId: string
): Promise<DeleteLibraryResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.delete<DeleteLibraryResponse>(
			`/library/delete/${postId}`,
			{ headers }
		);

		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "게시글 삭제에 실패했습니다."));
	}
};
