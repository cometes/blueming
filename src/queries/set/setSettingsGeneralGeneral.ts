import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { General } from "@/contexts/SettingsContext";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

export type SetSettingsGeneralGeneralPayload = Partial<General>;

export interface SetSettingsGeneralGeneralResponse {
	general: {
		general: General;
	};
}

/**
 * 홈페이지 일반 설정을 업데이트합니다.
 * @param payload 일반 설정 데이터 (변경된 필드만 전송)
 * @returns 업데이트된 일반 설정 정보
 */
export const setSettingsGeneralGeneral = async (
	payload: SetSettingsGeneralGeneralPayload
): Promise<SetSettingsGeneralGeneralResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await axios.post<SetSettingsGeneralGeneralResponse>(
			`${API_BASE}/settings/general/general`,
			payload,
			{ headers, withCredentials: true }
		);

		await revalidateSettingsCache();
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message ||
					"일반 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};
