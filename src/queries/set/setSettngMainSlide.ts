import { getAuthHeader } from "@/queries/getAuthHeader";

export interface SlideData {
	id: string;
	uniqueId: string;
	url: string;
	image: string;
	target: boolean;
}

export const setSettingsMainSlide = async (slides: SlideData[]) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		"https://api-w5buphcleq-du.a.run.app/settings/main/slide",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			body: JSON.stringify({ value: slides }),
		}
	);

	const data = await result.json();
	return { data };
};
