import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireManager } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function GET() {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const usersRef = db.collection("users");
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const daysAgo = (days: number) =>
			new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

		const toCount = async (query: FirebaseFirestore.Query) => {
			const snapshot = await query.count().get();
			return snapshot.data().count || 0;
		};

		const [
			totalUsers,
			activeUsers,
			suspendedUsers,
			pendingUsers,
			managerCount,
			adminCount,
			newUsersToday,
			newUsersWeek,
			newUsersMonth,
			activeUsersWeek,
			activeUsersMonth,
		] = await Promise.all([
			toCount(usersRef),
			toCount(usersRef.where("status", "==", "active")),
			toCount(usersRef.where("status", "==", "suspended")),
			toCount(usersRef.where("status", "==", "pending")),
			toCount(usersRef.where("role", "==", "manager")),
			toCount(usersRef.where("role", "==", "admin")),
			toCount(
				usersRef.where(
					"createdAt",
					">=",
					admin.firestore.Timestamp.fromDate(startOfToday)
				)
			),
			toCount(
				usersRef.where(
					"createdAt",
					">=",
					admin.firestore.Timestamp.fromDate(daysAgo(7))
				)
			),
			toCount(
				usersRef.where(
					"createdAt",
					">=",
					admin.firestore.Timestamp.fromDate(daysAgo(30))
				)
			),
			toCount(
				usersRef.where(
					"lastLoginAt",
					">=",
					admin.firestore.Timestamp.fromDate(daysAgo(7))
				)
			),
			toCount(
				usersRef.where(
					"lastLoginAt",
					">=",
					admin.firestore.Timestamp.fromDate(daysAgo(30))
				)
			),
		]);

		return jsonOk({
			totalUsers,
			activeUsers,
			suspendedUsers,
			pendingUsers,
			managerCount,
			adminCount,
			newUsersToday,
			newUsersWeek,
			newUsersMonth,
			activeUsersWeek,
			activeUsersMonth,
		});
	} catch (error) {
		console.error("Error fetching user stats:", error);
		return jsonError(500, "Failed to fetch user stats.");
	}
}
