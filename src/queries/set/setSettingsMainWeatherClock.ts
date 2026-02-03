import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import type { WeatherClockSettings } from "@/contexts/SettingsContext";
import { API_BASE } from "@/queries/apiClient";

export const setSettingsMainWeatherClock = async (weatherClock: WeatherClockSettings) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/weatherClock`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: weatherClock }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
