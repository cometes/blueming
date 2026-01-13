import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import type { WeatherClockSettings } from "@/contexts/SettingsContext";

export const setSettingsMainWeatherClock = async (weatherClock: WeatherClockSettings) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		"https://api-w5buphcleq-du.a.run.app/settings/main/weatherClock",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			body: JSON.stringify({ value: weatherClock }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
