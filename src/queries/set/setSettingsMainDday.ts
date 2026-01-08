import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";

export interface DdayData {
	id: string;
	uniqueId: string;
	title: string;
	date: string; // YYYY-MM-DD
	image: string;
	target: string;
}

export const setSettingsMainDday = async (ddayList: DdayData[]) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		"https://api-w5buphcleq-du.a.run.app/settings/main/dday",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			body: JSON.stringify({ value: ddayList }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
