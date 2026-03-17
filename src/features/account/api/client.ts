import { API_BASE } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";

export interface GeminiApiKeyStatus {
	hasKey: boolean;
	keyHint?: string | null;
	updatedAt?: string | null;
}

export interface WeatherApiKeyStatus {
	hasKey: boolean;
	keyHint?: string | null;
	updatedAt?: string | null;
}

const fetchKeyStatus = async <T>(path: string, fallback: string): Promise<T> => {
	const authHeader = await getAuthHeader();
	const response = await fetch(`${API_BASE}${path}`, {
		headers: {
			"Content-Type": "application/json",
			...authHeader,
		},
		credentials: "include",
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({
			error: fallback,
		}));
		throw new Error(errorData.error || fallback);
	}

	return response.json();
};

const saveKey = async <T>(
	path: string,
	apiKey: string,
	fallback: string,
): Promise<T> => {
	const authHeader = await getAuthHeader();
	const response = await fetch(`${API_BASE}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...authHeader,
		},
		credentials: "include",
		body: JSON.stringify({ apiKey }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({
			error: fallback,
		}));
		throw new Error(errorData.error || fallback);
	}

	return response.json();
};

export const fetchGeminiApiKeyStatus = () =>
	fetchKeyStatus<GeminiApiKeyStatus>(
		"/settings/ai-key",
		"API 키 정보를 불러오지 못했습니다.",
	);

export const saveGeminiApiKey = (apiKey: string) =>
	saveKey<{ keyHint?: string | null }>(
		"/settings/ai-key",
		apiKey,
		"API 키 저장에 실패했습니다.",
	);

export const fetchWeatherApiKeyStatus = () =>
	fetchKeyStatus<WeatherApiKeyStatus>(
		"/settings/weather-key",
		"API 키 정보를 불러오지 못했습니다.",
	);

export const saveWeatherApiKey = (apiKey: string) =>
	saveKey<{ keyHint?: string | null }>(
		"/settings/weather-key",
		apiKey,
		"API 키 저장에 실패했습니다.",
	);
