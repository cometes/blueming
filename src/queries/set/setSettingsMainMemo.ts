import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import type { MemoSettings } from "@/contexts/SettingsContext";

export const setSettingsMainMemo = async (memo: MemoSettings) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		"https://api-w5buphcleq-du.a.run.app/settings/main/memo",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			body: JSON.stringify({ value: memo }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
