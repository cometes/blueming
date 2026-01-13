export interface WeatherData {
	city: string;
	temperature: number;
	feelsLike: number;
	condition: "sunny" | "rainy" | "cloudy" | "thunder-storm" | "flurries" | "sun-shower";
	description: string;
	humidity: number;
	timezone: number; // UTC offset in seconds
}

export const getWeather = async (city: string): Promise<WeatherData> => {
	const response = await fetch(
		`https://api-w5buphcleq-du.a.run.app/weather/${encodeURIComponent(city)}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: "Failed to fetch weather data" }));
		throw new Error(errorData.error || "Failed to fetch weather data");
	}

	const data = await response.json();
	return data as WeatherData;
};
