import "server-only";
import type { AuthContext } from "@/app/api/_lib/auth";
import admin from "firebase-admin";

export const parsePositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	if (Number.isNaN(parsed) || parsed <= 0) return fallback;
	return parsed;
};

export const parseSortOrder = (value: unknown) =>
	value === "asc" || value === "desc" ? value : "desc";

const toIso = (value: unknown) => {
	if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
		return (value as { toDate: () => Date }).toDate().toISOString();
	}
	return null;
};

export const normalizeUserDoc = (uid: string, data: FirebaseFirestore.DocumentData) => {
	return {
		uid,
		email: data.email ?? "",
		displayName: data.displayName ?? null,
		photoURL: data.photoURL ?? null,
		status: data.status ?? "active",
		role: data.role ?? "user",
		createdAt: toIso(data.createdAt),
		lastLoginAt: toIso(data.lastLoginAt),
		postCount: data.postCount ?? undefined,
		commentCount: data.commentCount ?? undefined,
		suspendedReason: data.suspendedReason ?? undefined,
		approvedAt: toIso(data.approvedAt),
		approvedBy: data.approvedBy ?? undefined,
	};
};

export const getUserDoc = async (
	db: FirebaseFirestore.Firestore,
	uid: string
) => {
	const docRef = db.collection("users").doc(uid);
	const snapshot = await docRef.get();
	if (!snapshot.exists) return null;
	return normalizeUserDoc(uid, snapshot.data() || {});
};

export const getCustomClaimsForRole = (role: string) => {
	return {
		role,
		isAdmin: role === "admin",
		admin: role === "admin",
		isManager: role === "manager",
		manager: role === "manager",
	};
};

export const isHigherRole = (targetRole: string, auth: AuthContext | null) => {
	if (!auth) return false;
	if (targetRole !== "admin") return false;
	return auth.role !== "admin";
};

export const getAuthUserRecord = async (uid: string) => {
	return admin.auth().getUser(uid);
};
