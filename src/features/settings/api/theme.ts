import { getAuthHeader } from "@/shared/lib/auth/client";
import {
	getApiErrorMessage,
	httpClient,
} from "@/shared/lib/http/client";
import { revalidateSettingsCache } from "@/shared/lib/http/revalidateSettings";

export const setSettingsTheme = async (value: unknown) => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.post("/settings/general/theme", value, {
			headers,
		});
		await revalidateSettingsCache();
		return { data: response.data };
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "테마 저장에 실패했습니다."),
		);
	}
};

export const getSettingsTheme = async () => {
	try {
		const response = await httpClient.get("/settings/general/theme");
		return { data: response.data };
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "테마를 불러오지 못했습니다."),
		);
	}
};

export const deleteSettingsTheme = async (themeId: string) => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.delete(
			`/settings/general/theme/${themeId}`,
			{ headers },
		);
		await revalidateSettingsCache();
		return { data: response.data };
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "테마 삭제에 실패했습니다."),
		);
	}
};
