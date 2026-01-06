import axios from "axios";

export interface DeleteLibraryResponse {
	postId: string;
	deletedAt?: string | null;
}

export const deleteLibraryPost = async (
	postId: string
): Promise<DeleteLibraryResponse> => {
	const response = await axios.delete<DeleteLibraryResponse>(
		`https://api-w5buphcleq-du.a.run.app/library/delete/${postId}`
	);

	return response.data;
};
