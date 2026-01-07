import { getAuthHeader } from "@/queries/getAuthHeader";

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
		"https://api-w5buphcleq-du.a.run.app/settings/main/profile",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...authHeader,
			},
			body: JSON.stringify({ value: profileData }),
		}
	);

	const data = await result.json();

	return {
		data,
	};
};
