import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { EffectSettings } from "@/contexts/SettingsContext";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

export type SetSettingsEffectPayload = EffectSettings;

export interface SetSettingsEffectResponse {
	general: {
		effect: EffectSettings;
	};
}

/**
 * 배경 이펙트 설정을 업데이트합니다.
 * @param payload 이펙트 설정 데이터
 * @returns 업데이트된 이펙트 설정 정보
 */
export const setSettingsEffect = async (
	payload: SetSettingsEffectPayload
): Promise<SetSettingsEffectResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await axios.post<SetSettingsEffectResponse>(
			`${API_BASE}/settings/general/effect`,
			payload,
			{ headers, withCredentials: true }
		);

		await revalidateSettingsCache();
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message ||
					"이펙트 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};
