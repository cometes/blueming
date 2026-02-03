import { getAuthHeader } from "@/queries/getAuthHeader";
import { API_BASE } from "@/queries/apiClient";

export interface FontRegistryItem {
	id: string;
	name: string;
	family: string;
	source: "url" | "file";
	url: string;
}

export const setSettingsGeneralFontRegistry = async (
	fontRegistry: FontRegistryItem[]
) => {
	const authHeader = await getAuthHeader();
	const response = await fetch(
		`${API_BASE}/settings/general/fontRegistry`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: fontRegistry }),
		}
	);

	if (!response.ok) {
		throw new Error("폰트 레지스트리 저장에 실패했습니다.");
	}

	const data = await response.json();
	return { data };
};
