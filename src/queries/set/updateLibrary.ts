import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { CreateLibraryPayload } from "@/queries/set/createLibrary";

export interface UpdateLibraryResponse {
	postId: string;
	updatedAt?: string | null;
}

export const updateLibraryPost = async (
	postId: string,
	payload: CreateLibraryPayload
): Promise<UpdateLibraryResponse> => {
	const allow = payload.visibility;
	const slug = payload.slug?.trim() || undefined;
	const headers = await getAuthHeader();
	const response = await axios.put<UpdateLibraryResponse>(
		`https://api-w5buphcleq-du.a.run.app/library/update/${postId}`,
		{
			title: payload.title,
			subtitle: payload.subtitle,
			content: payload.content,
			slug,
			summary: payload.summary,
			tags: payload.tags,
			series: payload.series,
			allow,
			password: allow === "password" ? payload.password : null,
			thumbnail: payload.thumbnail,
			pinned: payload.pinned ?? false,
		},
		{ headers }
	);

	return response.data;
};
