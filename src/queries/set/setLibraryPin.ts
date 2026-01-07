import axios from "axios";

const API_BASE = "https://api-w5buphcleq-du.a.run.app";

export const setLibraryPin = async (id: string, pinned: boolean) => {
	const response = await axios.post(`${API_BASE}/library/pin/${id}`, {
		pinned,
	});
	return response.data as { id: string; pinned: boolean };
};
