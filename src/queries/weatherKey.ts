import { getAuthHeader } from "@/queries/getAuthHeader";
import { API_BASE } from "@/queries/apiClient";

export interface WeatherApiKeyStatus {
	hasKey: boolean;
	keyHint?: string | null;
	updatedAt?: string | null;
}

export const fetchWeatherApiKeyStatus = async (): Promise<WeatherApiKeyStatus> => {
	const authHeader = await getAuthHeader();
	const response = await fetch(`${API_BASE}/settings/weather-key`, {
		headers: {
			"Content-Type": "application/json",
			...authHeader,
		},
		credentials: "include",
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({
			error: "API 키 정보를 불러오지 못했습니다.",
		}));
		throw new Error(errorData.error || "API 키 정보를 불러오지 못했습니다.");
	}

	return response.json();
};

export const saveWeatherApiKey = async (apiKey: string) => {
	const authHeader = await getAuthHeader();
	const response = await fetch(`${API_BASE}/settings/weather-key`, {
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
			error: "API 키 저장에 실패했습니다.",
		}));
		throw new Error(errorData.error || "API 키 저장에 실패했습니다.");
	}

	return response.json();
};
