import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

export interface ImageWidgetSettings {
	images: string[];
	fits?: Array<"cover" | "contain">;
}

export const setSettingsMainImageWidget = async (
	imageWidget: ImageWidgetSettings
) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/imageWidget`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: imageWidget }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
