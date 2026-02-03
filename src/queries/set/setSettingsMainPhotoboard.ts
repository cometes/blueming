import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import type { PhotoboardSettings } from "@/contexts/SettingsContext";
import { API_BASE } from "@/queries/apiClient";

export const setSettingsMainPhotoboard = async (
	photoboard: PhotoboardSettings
) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/photoboard`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: photoboard }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
