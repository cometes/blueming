import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";

const API_BASE = "https://api-w5buphcleq-du.a.run.app";

export const setLibraryPin = async (id: string, pinned: boolean) => {
	const headers = await getAuthHeader();
	const response = await axios.post(
		`${API_BASE}/library/pin/${id}`,
		{ pinned },
		{ headers }
	);
	return response.data as { id: string; pinned: boolean };
};
