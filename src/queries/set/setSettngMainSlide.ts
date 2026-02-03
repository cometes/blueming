import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

export interface SlideData {
	id: string;
	uniqueId: string;
	url: string;
	image: string;
	target: boolean;
}

export const setSettingsMainSlide = async (slides: SlideData[]) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/slide`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: slides }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
