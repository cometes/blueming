import axios from "axios";
import type { Menu } from "@/contexts/SettingsContext";

export interface SetSettingsGeneralMenuResponse {
	success: boolean;
	data: {
		general: {
			menu: Menu;
		};
	};
	message?: string;
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
		const response = await axios.post<SetSettingsGeneralMenuResponse>(
			"https://api-w5buphcleq-du.a.run.app/settings/general/menu",
			payload
		);

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
