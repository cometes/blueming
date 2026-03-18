import { getAuthHeader } from "@/shared/lib/auth/client";
import {
	getApiErrorMessage,
	httpClient,
} from "@/shared/lib/http/client";
import { revalidateSettingsCache } from "@/shared/lib/http/revalidateSettings";

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

export const setSettingsImport = async (
	payload: SetSettingsImportPayload,
): Promise<SetSettingsImportResponse> => {
	try {
		const headers = await getAuthHeader();
		const response = await httpClient.post<SetSettingsImportResponse>(
			"/settings/import",
			payload,
			{ headers },
		);
		await revalidateSettingsCache();
		return response.data;
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "설정 가져오기에 실패했습니다."),
		);
	}
};
