import { getAuthHeader } from "@/queries/getAuthHeader";

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
		"https://api-w5buphcleq-du.a.run.app/ai/generate-city-illustration",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
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
