import { getAuthHeader } from "@/shared/lib/auth/client";
import { revalidateSettingsCache } from "@/shared/lib/http/revalidateSettings";
import { httpClient, isHttpError } from "@/shared/lib/http/client";
import type {
	EffectSettings,
	General,
	LibrarySettings,
	Menu,
	SettingsSnapshot,
} from "@/features/settings/types";

export type SetSettingsGeneralGeneralPayload = Partial<General>;
export type SetSettingsEffectPayload = EffectSettings;

export interface SetSettingsGeneralGeneralResponse {
	general: SettingsSnapshot["general"];
}

export interface SetSettingsGeneralMenuResponse {
	general: SettingsSnapshot["general"];
}

export interface SetSettingsEffectResponse {
	general: SettingsSnapshot["general"];
}

export interface SetSettingsLibraryResponse {
	library: LibrarySettings;
}

const withSettingsRevalidation = async <T>(request: () => Promise<T>) => {
	const response = await request();
	await revalidateSettingsCache();
	return response;
};

export const setSettingsGeneralGeneral = async (
	payload: SetSettingsGeneralGeneralPayload
): Promise<SetSettingsGeneralGeneralResponse> => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post<SetSettingsGeneralGeneralResponse>(
				"/settings/general/general",
				payload,
				{ headers }
			);
			return response.data;
		});
	} catch (error) {
		if (isHttpError(error)) {
			throw new Error(
				error.response?.data?.message || "일반 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};

export const setSettingsGeneralMenu = async (
	payload: Menu
): Promise<SetSettingsGeneralMenuResponse> => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post<SetSettingsGeneralMenuResponse>(
				"/settings/general/menu",
				payload,
				{ headers }
			);
			return response.data;
		});
	} catch (error) {
		if (isHttpError(error)) {
			throw new Error(
				error.response?.data?.message || "메뉴 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};

export const setSettingsEffect = async (
	payload: SetSettingsEffectPayload
): Promise<SetSettingsEffectResponse> => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post<SetSettingsEffectResponse>(
				"/settings/general/effect",
				payload,
				{ headers }
			);
			return response.data;
		});
	} catch (error) {
		if (isHttpError(error)) {
			throw new Error(
				error.response?.data?.message || "이펙트 설정 업데이트에 실패했습니다."
			);
		}
		throw error;
	}
};

export const setSettingsLibrary = async (
	payload: Partial<LibrarySettings>,
): Promise<SetSettingsLibraryResponse> => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post<SetSettingsLibraryResponse>(
				"/settings/library",
				payload,
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		if (isHttpError(error)) {
			throw new Error(
				error.response?.data?.message || "라이브러리 설정 업데이트에 실패했습니다.",
			);
		}
		throw error;
	}
};
