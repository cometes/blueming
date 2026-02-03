import { getAuthHeader } from "@/queries/getAuthHeader";
import { API_BASE } from "@/queries/apiClient";

export interface GeminiApiKeyStatus {
	hasKey: boolean;
	keyHint?: string | null;
	updatedAt?: string | null;
}

export const fetchGeminiApiKeyStatus = async (): Promise<GeminiApiKeyStatus> => {
	const authHeader = await getAuthHeader();
	const response = await fetch(`${API_BASE}/settings/ai-key`, {
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

export const saveGeminiApiKey = async (apiKey: string) => {
	const authHeader = await getAuthHeader();
	const response = await fetch(`${API_BASE}/settings/ai-key`, {
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
