import { httpClient } from "@/shared/lib/http/client";
import { getAuthHeader } from "@/shared/lib/auth/client";
import type {
	UserManagementSettings,
	UsersListParams,
	UsersListResponse,
	UpdateUserRoleRequest,
	UpdateUserStatusRequest,
	ApproveUserRequest,
	User,
	UserStats,
} from "@/features/admin/types";

const compactParams = (params: Record<string, string | number | undefined>) => {
	const result: Record<string, string | number> = {};
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== "") {
			result[key] = value;
		}
	});
	return result;
};

export const fetchAdminUsers = async (params: UsersListParams = {}) => {
	const headers = await getAuthHeader();
	const response = await httpClient.get<UsersListResponse>("/admin/users", {
		headers,
		params: compactParams({
			page: params.page,
			limit: params.limit,
			search: params.search,
			status: params.status,
			role: params.role,
			sortBy: params.sortBy,
			sortOrder: params.sortOrder,
		}),
	});
	return response.data;
};

export const fetchAdminUser = async (uid: string) => {
	const headers = await getAuthHeader();
	const response = await httpClient.get<User>(`/admin/users/${uid}`, {
		headers,
	});
	return response.data;
};

export const fetchUserStats = async () => {
	const headers = await getAuthHeader();
	const response = await httpClient.get<UserStats>("/admin/users/stats", {
		headers,
	});
	return response.data;
};

export const updateUserStatus = async (
	uid: string,
	payload: UpdateUserStatusRequest,
) => {
	const headers = await getAuthHeader();
	const response = await httpClient.patch<{ uid: string }>(
		`/admin/users/${uid}/status`,
		payload,
		{ headers },
	);
	return response.data;
};

export const updateUserRole = async (
	uid: string,
	payload: UpdateUserRoleRequest,
) => {
	const headers = await getAuthHeader();
	const response = await httpClient.patch<{ uid: string }>(
		`/admin/users/${uid}/role`,
		payload,
		{ headers },
	);
	return response.data;
};

export const approveUser = async (uid: string, payload: ApproveUserRequest) => {
	const headers = await getAuthHeader();
	const response = await httpClient.post<{ uid: string }>(
		`/admin/users/${uid}/approve`,
		payload,
		{ headers },
	);
	return response.data;
};

export const deleteUser = async (uid: string) => {
	const headers = await getAuthHeader();
	const response = await httpClient.delete<{ uid: string }>(
		`/admin/users/${uid}`,
		{ headers },
	);
	return response.data;
};

export const fetchUserManagementSettings = async () => {
	const headers = await getAuthHeader();
	const response = await httpClient.get<UserManagementSettings>(
		"/admin/settings/user-management",
		{ headers },
	);
	return response.data;
};

export const updateUserManagementSettings = async (
	payload: UserManagementSettings,
) => {
	const headers = await getAuthHeader();
	const response = await httpClient.put<{ ok: boolean }>(
		"/admin/settings/user-management",
		payload,
		{ headers },
	);
	return response.data;
};
