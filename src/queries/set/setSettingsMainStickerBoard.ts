import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import type { StickerBoardSettings } from "@/types/stickerBoard";
import { API_BASE } from "@/queries/apiClient";

export const setSettingsMainStickerBoard = async (
	stickerBoard: StickerBoardSettings
) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/stickerBoard`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: stickerBoard }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
