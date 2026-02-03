import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import type { MemoSettings } from "@/contexts/SettingsContext";
import { API_BASE } from "@/queries/apiClient";

export const setSettingsMainMemo = async (memo: MemoSettings) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/memo`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: memo }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
