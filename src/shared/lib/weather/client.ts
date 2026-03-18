import { CACHE_POLICY } from "@/shared/lib/cachePolicy";
import { API_BASE } from "@/shared/lib/http/client";

export interface WeatherData {
	city: string;
	temperature: number;
	feelsLike: number;
	condition: "sunny" | "rainy" | "cloudy" | "thunder-storm" | "flurries" | "sun-shower";
	description: string;
	humidity: number;
	timezone: number;
}

interface WeatherCacheEntry {
	data: WeatherData;
	timestamp: number;
}

interface WeatherOptions {
	staleTimeMs?: number;
	useCache?: boolean;
	signal?: AbortSignal;
}

const weatherCache = new Map<string, WeatherCacheEntry>();
const defaultWeatherStaleMs = CACHE_POLICY.weatherStaleMs;

export const getWeather = async (
	city: string,
	options: WeatherOptions = {},
): Promise<WeatherData> => {
	const useCache = options.useCache !== false && typeof window !== "undefined";
	const staleTimeMs = options.staleTimeMs ?? defaultWeatherStaleMs;
	const cacheKey = city.toLowerCase();

	if (useCache) {
		const cached = weatherCache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < staleTimeMs) {
			return cached.data;
		}
	}

	const response = await fetch(`${API_BASE}/weather/${encodeURIComponent(city)}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		signal: options.signal,
	});

	if (!response.ok) {
		const errorData = await response
			.json()
			.catch(() => ({ error: "Failed to fetch weather data" }));
		throw new Error(errorData.error || "Failed to fetch weather data");
	}

	const data = (await response.json()) as WeatherData;
	if (useCache) {
		weatherCache.set(cacheKey, { data, timestamp: Date.now() });
	}
	return data;
};
