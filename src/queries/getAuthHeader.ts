import { auth } from "@/lib/Firebase";

export const getAuthHeader = async (): Promise<Record<string, string>> => {
	const currentUser = auth.currentUser;
	if (!currentUser) return {};
	const token = await currentUser.getIdToken();
	return { Authorization: `Bearer ${token}` };
};
