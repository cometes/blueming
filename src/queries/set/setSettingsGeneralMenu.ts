import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type { Menu } from "@/contexts/SettingsContext";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";

export interface SetSettingsGeneralMenuResponse {
	general: {
		menu: Menu;
	};
}

/**
 * 홈페이지 메뉴 설정을 업데이트합니다.
 * @param payload 메뉴 설정 데이터
 * @returns 업데이트된 설정 정보
 */
export const setSettingsGeneralMenu = async (
	payload: Menu
): Promise<SetSettingsGeneralMenuResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await axios.post<SetSettingsGeneralMenuResponse>(
			"https://api-w5buphcleq-du.a.run.app/settings/general/menu",
			payload,
			{ headers }
		);

		await revalidateSettingsCache();
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message || "메뉴 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};
