import axios from "axios";
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
		}
	);

	return response.data;
};
