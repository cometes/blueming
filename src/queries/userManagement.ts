import axios from "axios";
import { API_BASE } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";
import type {
	UserManagementSettings,
	UsersListParams,
	UsersListResponse,
	UpdateUserRoleRequest,
	UpdateUserStatusRequest,
	ApproveUserRequest,
	User,
	UserStats,
} from "@/types/user";

const buildQuery = (params: Record<string, string | number | undefined>) => {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== "") {
			searchParams.set(key, String(value));
		}
	});
	return searchParams.toString();
};

export const fetchAdminUsers = async (params: UsersListParams = {}) => {
	const query = buildQuery({
		page: params.page,
		limit: params.limit,
		search: params.search,
		status: params.status,
		role: params.role,
		sortBy: params.sortBy,
		sortOrder: params.sortOrder,
	});
	const url = query ? `${API_BASE}/admin/users?${query}` : `${API_BASE}/admin/users`;
	const headers = await getAuthHeader();
	const response = await axios.get<UsersListResponse>(url, {
		headers,
		withCredentials: true,
	});
	return response.data;
};

export const fetchAdminUser = async (uid: string) => {
	const headers = await getAuthHeader();
	const response = await axios.get<User>(`${API_BASE}/admin/users/${uid}`, {
		headers,
		withCredentials: true,
	});
	return response.data;
};

export const fetchUserStats = async () => {
	const headers = await getAuthHeader();
	const response = await axios.get<UserStats>(`${API_BASE}/admin/users/stats`, {
		headers,
		withCredentials: true,
	});
	return response.data;
};

export const updateUserStatus = async (uid: string, payload: UpdateUserStatusRequest) => {
	const headers = await getAuthHeader();
	const response = await axios.patch(
		`${API_BASE}/admin/users/${uid}/status`,
		payload,
		{ headers, withCredentials: true }
	);
	return response.data as { uid: string };
};

export const updateUserRole = async (uid: string, payload: UpdateUserRoleRequest) => {
	const headers = await getAuthHeader();
	const response = await axios.patch(
		`${API_BASE}/admin/users/${uid}/role`,
		payload,
		{ headers, withCredentials: true }
	);
	return response.data as { uid: string };
};

export const approveUser = async (uid: string, payload: ApproveUserRequest) => {
	const headers = await getAuthHeader();
	const response = await axios.post(
		`${API_BASE}/admin/users/${uid}/approve`,
		payload,
		{ headers, withCredentials: true }
	);
	return response.data as { uid: string };
};

export const deleteUser = async (uid: string) => {
	const headers = await getAuthHeader();
	const response = await axios.delete(`${API_BASE}/admin/users/${uid}`, {
		headers,
		withCredentials: true,
	});
	return response.data as { uid: string };
};

export const fetchUserManagementSettings = async () => {
	const headers = await getAuthHeader();
	const response = await axios.get<UserManagementSettings>(
		`${API_BASE}/admin/settings/user-management`,
		{ headers, withCredentials: true }
	);
	return response.data;
};

export const updateUserManagementSettings = async (
	payload: UserManagementSettings
) => {
	const headers = await getAuthHeader();
	const response = await axios.put(
		`${API_BASE}/admin/settings/user-management`,
		payload,
		{ headers, withCredentials: true }
	);
	return response.data as { ok: boolean };
};
