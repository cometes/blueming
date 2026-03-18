import { getAuthHeader } from "@/shared/lib/auth/client";
import {
	getApiErrorMessage,
	httpClient,
} from "@/shared/lib/http/client";
import { revalidateSettingsCache } from "@/shared/lib/http/revalidateSettings";
import type { Design } from "@/features/settings/types";

export type SetSettingsGeneralDesignPayload = Partial<Design>;

export interface SetSettingsGeneralDesignResponse {
	general: {
		design: Design;
	};
}

export const setSettingsGeneralDesign = async (
	payload: SetSettingsGeneralDesignPayload,
): Promise<SetSettingsGeneralDesignResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.post<SetSettingsGeneralDesignResponse>(
			"/settings/general/design",
			payload,
			{ headers },
		);
		await revalidateSettingsCache();
		return response.data;
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "디자인 설정 업데이트에 실패했습니다."),
		);
	}
};
