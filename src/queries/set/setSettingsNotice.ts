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
	const result = await fetch(
		"https://api-w5buphcleq-du.a.run.app/settings/main/notice",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ value: noticeData }),
		}
	);

	const data = await result.json();

	return {
		data,
	};
};
