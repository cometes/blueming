import { getAuthHeader } from "@/queries/getAuthHeader";
import { API_BASE } from "@/queries/apiClient";

export interface GenerateCityIllustrationRequest {
	city: string;
	prompt?: string;
}

export interface GenerateCityIllustrationResponse {
	success: boolean;
	imageUrl?: string;
	city?: string;
	error?: string;
	code?: string;
}

export const generateCityIllustration = async (
	request: GenerateCityIllustrationRequest
): Promise<GenerateCityIllustrationResponse> => {
	const authHeader = await getAuthHeader();

	const response = await fetch(
		`${API_BASE}/ai/generate-city-illustration`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify(request),
		}
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({
			error: "이미지 생성에 실패했습니다.",
		}));
		return {
			success: false,
			error: errorData.error || "이미지 생성에 실패했습니다.",
			code: errorData.code || "UNKNOWN_ERROR",
		};
	}

	return response.json();
};
