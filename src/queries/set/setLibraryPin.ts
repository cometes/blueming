import { apiClient, getApiErrorMessage } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";

export const setLibraryPin = async (id: string, pinned: boolean) => {
	try {
		const headers = await getAuthHeader();
		const response = await apiClient.post(
			`/library/pin/${id}`,
			{ pinned },
			{ headers }
		);
		return response.data as { id: string; pinned: boolean };
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "고정 상태 변경에 실패했습니다."));
	}
};
