import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireManager } from "@/app/api/_lib/auth";
import {
	parsePositiveInt,
	parseSortOrder,
	normalizeUserDoc,
} from "@/app/api/_lib/adminUsers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();
		const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1);
		const limit = parsePositiveInt(req.nextUrl.searchParams.get("limit"), 25);
		const search = req.nextUrl.searchParams.get("search") || "";
		const status = req.nextUrl.searchParams.get("status");
		const role = req.nextUrl.searchParams.get("role");
		const sortBy = req.nextUrl.searchParams.get("sortBy") || "createdAt";
		const sortOrder = parseSortOrder(req.nextUrl.searchParams.get("sortOrder"));

		let queryRef: FirebaseFirestore.Query = db.collection("users");
		if (status) queryRef = queryRef.where("status", "==", status);
		if (role) queryRef = queryRef.where("role", "==", role);

		const snapshot = await queryRef.get();
		let users = snapshot.docs.map((doc) => normalizeUserDoc(doc.id, doc.data()));

		if (search.trim()) {
			const searchLower = search.toLowerCase();
			users = users.filter(
				(user) =>
					user.displayName?.toLowerCase().includes(searchLower) ||
					user.email.toLowerCase().includes(searchLower)
			);
		}

		const sortKey =
			sortBy === "lastLoginAt" || sortBy === "displayName"
				? sortBy
				: "createdAt";
		const toTime = (value: string | null) => (value ? new Date(value).getTime() : 0);

		users.sort((a, b) => {
			if (sortKey === "displayName") {
				const left = a.displayName || "";
				const right = b.displayName || "";
				return sortOrder === "asc"
					? left.localeCompare(right)
					: right.localeCompare(left);
			}
			const leftTime = toTime((a as Record<string, string | null>)[sortKey] || null);
			const rightTime = toTime((b as Record<string, string | null>)[sortKey] || null);
			return sortOrder === "asc" ? leftTime - rightTime : rightTime - leftTime;
		});

		const total = users.length;
		const totalPages = Math.max(1, Math.ceil(total / limit));
		const startIndex = (page - 1) * limit;
		const paginatedUsers = users.slice(startIndex, startIndex + limit);

		return jsonOk({
			users: paginatedUsers,
			total,
			page,
			limit,
			totalPages,
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		return jsonError(500, "Failed to fetch users.");
	}
}
