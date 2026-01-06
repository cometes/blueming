import axios from "axios";
import type { EffectSettings } from "@/contexts/SettingsContext";

export interface SetSettingsEffectPayload extends EffectSettings {}

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
		const response = await axios.post<SetSettingsEffectResponse>(
			"https://api-w5buphcleq-du.a.run.app/settings/general/effect",
			payload
		);

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
