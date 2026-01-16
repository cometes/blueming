import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { Design } from "@/contexts/SettingsContext";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";

export type SetSettingsGeneralDesignPayload = Partial<Design>;

export interface SetSettingsGeneralDesignResponse {
	general: {
		design: Design;
	};
}

/**
 * 홈페이지 디자인 설정을 업데이트합니다.
 * @param payload 디자인 설정 데이터 (변경된 필드만 전송)
 * @returns 업데이트된 디자인 설정 정보
 */
export const setSettingsGeneralDesign = async (
	payload: SetSettingsGeneralDesignPayload
): Promise<SetSettingsGeneralDesignResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await axios.post<SetSettingsGeneralDesignResponse>(
			"https://api-w5buphcleq-du.a.run.app/settings/general/design",
			payload,
			{ headers }
		);

		await revalidateSettingsCache();
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message ||
					"디자인 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};
