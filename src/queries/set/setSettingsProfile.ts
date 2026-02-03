import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

export interface ProfileData {
	headerImage: string;
	profileImage: string;
	nickname: string;
	introduction: string;
	etc: string;
}

export const setSettingsProfile = async (profileData: ProfileData) => {
	const authHeader = await getAuthHeader();
	const result = await fetch(
		`${API_BASE}/settings/main/profile`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			credentials: "include",
			body: JSON.stringify({ value: profileData }),
		}
	);

	const data = await result.json();

	await revalidateSettingsCache();
	return {
		data,
	};
};
