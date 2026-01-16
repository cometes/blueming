import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";

export interface ImageWidgetSettings {
	images: string[];
	fits?: Array<"cover" | "contain">;
}

export const setSettingsMainImageWidget = async (
	imageWidget: ImageWidgetSettings
) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		"https://api-w5buphcleq-du.a.run.app/settings/main/imageWidget",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			body: JSON.stringify({ value: imageWidget }),
		}
	);

	const data = await result.json();
	await revalidateSettingsCache();
	return { data };
};
