import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";

export interface SetSettingsImportPayload {
	general: unknown;
	main: unknown;
}

export interface SetSettingsImportResponse {
	success: boolean;
	data: {
		general: unknown;
		main: unknown;
	};
	message?: string;
}

/**
 * 전체 설정(general + main)을 한 번에 업데이트합니다.
 * 주로 테마 적용 시 사용됩니다.
 * @param payload general과 main 설정 데이터
 * @returns 업데이트된 전체 설정 정보
 */
export const setSettingsImport = async (
	payload: SetSettingsImportPayload
): Promise<SetSettingsImportResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await axios.post<SetSettingsImportResponse>(
			"https://api-w5buphcleq-du.a.run.app/settings/import",
			payload,
			{ headers }
		);

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message || "설정 가져오기에 실패했습니다."
			);
		}
		throw error;
	}
};
