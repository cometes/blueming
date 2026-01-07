import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { LibrarySettings } from "@/contexts/SettingsContext";

export type SetSettingsLibraryPayload = Partial<LibrarySettings>;

export interface SetSettingsLibraryResponse {
	library: LibrarySettings;
}

export const setSettingsLibrary = async (
	payload: SetSettingsLibraryPayload
): Promise<SetSettingsLibraryResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await axios.post<SetSettingsLibraryResponse>(
			"https://api-w5buphcleq-du.a.run.app/settings/library",
			payload,
			{ headers }
		);

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message ||
					"라이브러리 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};
