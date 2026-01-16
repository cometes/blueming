import { apiClient, getApiErrorMessage } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { LibrarySettings } from "@/contexts/SettingsContext";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";

export type SetSettingsLibraryPayload = Partial<LibrarySettings>;

export interface SetSettingsLibraryResponse {
	library: LibrarySettings;
}

export const setSettingsLibrary = async (
	payload: SetSettingsLibraryPayload
): Promise<SetSettingsLibraryResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.post<SetSettingsLibraryResponse>(
			"/settings/library",
			payload,
			{ headers }
		);

		await revalidateSettingsCache();
		return response.data;
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "라이브러리 설정 업데이트에 실패했습니다.")
		);
	}
};
