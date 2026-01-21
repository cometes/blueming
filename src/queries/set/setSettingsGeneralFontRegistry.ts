import { getAuthHeader } from "@/queries/getAuthHeader";

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
		"https://api-w5buphcleq-du.a.run.app/settings/general/fontRegistry",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			body: JSON.stringify({ value: fontRegistry }),
		}
	);

	if (!response.ok) {
		throw new Error("폰트 레지스트리 저장에 실패했습니다.");
	}

	const data = await response.json();
	return { data };
};
