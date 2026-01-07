import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";

export interface DeleteLibraryResponse {
	postId: string;
	deletedAt?: string | null;
}

export const deleteLibraryPost = async (
	postId: string
): Promise<DeleteLibraryResponse> => {
	const headers = await getAuthHeader();
	const response = await axios.delete<DeleteLibraryResponse>(
		`https://api-w5buphcleq-du.a.run.app/library/delete/${postId}`,
		{ headers }
	);

	return response.data;
};
