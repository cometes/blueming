import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

interface MarqueeSettings {
	type: string;
	gradientColor: string;
	gradientWidth: number;
	textColor: string;
	backgroundColor: string;
}

interface EditorDimensions {
	width: number;
	height: number;
}

export interface NoticeData {
	bannerText: string;
	noticeContent: string;
	marqueeSettings: MarqueeSettings;
	editorDimensions: EditorDimensions;
}

export const setSettingsNotice = async (noticeData: NoticeData) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/notice`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: noticeData }),
		}
	);

	const data = await result.json();

	await revalidateSettingsCache();
	return {
		data,
	};
};
