import "server-only";
import admin from "firebase-admin";
import type { AuthContext } from "@/app/api/_lib/auth";

const normalizeEmail = (email: string | null | undefined) =>
	(email || "").trim().toLowerCase();

const matchesEmailRule = (email: string, rule: string) => {
	const normalizedRule = rule.trim().toLowerCase();
	if (!normalizedRule) return false;
	if (normalizedRule.startsWith("@")) {
		const domain = normalizedRule.slice(1);
		return email.endsWith(`@${domain}`) || email.endsWith(domain);
	}
	if (normalizedRule.includes("@")) {
		return email === normalizedRule;
	}
	return email.endsWith(`@${normalizedRule}`) || email.endsWith(normalizedRule);
};

const isEmailInList = (email: string, list: unknown) => {
	if (!Array.isArray(list)) return false;
	return list.some((item) => typeof item === "string" && matchesEmailRule(email, item));
};

type UserManagementSettings = {
	registrationMode?: "open" | "closed" | "approval";
	whitelist?: string[];
	blacklist?: string[];
	autoApprove?: boolean;
};

const deriveUserStatus = (settings: UserManagementSettings, email: string) => {
	const registrationMode = settings.registrationMode ?? "open";
	const whitelist = settings.whitelist ?? [];
	const blacklist = settings.blacklist ?? [];
	const autoApprove = settings.autoApprove === true;

	const isWhitelisted = email ? isEmailInList(email, whitelist) : false;
	const isBlacklisted = email ? isEmailInList(email, blacklist) : false;

	let derivedStatus: "active" | "pending" | "suspended" = "active";
	let suspendedReason: string | null = null;
	let shouldSetApproved = false;

	if (isBlacklisted) {
		derivedStatus = "suspended";
		suspendedReason = "blacklisted";
	} else if (registrationMode === "closed") {
		derivedStatus = "suspended";
		suspendedReason = "registration_closed";
	} else if (registrationMode === "approval" && !isWhitelisted) {
		derivedStatus = "pending";
	} else if (registrationMode === "approval" && isWhitelisted && autoApprove) {
		shouldSetApproved = true;
	}

	return { derivedStatus, suspendedReason, shouldSetApproved };
};

export const ensureUserDoc = async (
	db: FirebaseFirestore.Firestore,
	authContext: AuthContext
) => {
	const settingsDoc = await db.collection("siteSettings").doc("userManagement").get();
	const settings = (settingsDoc.exists ? settingsDoc.data() || {} : {}) as UserManagementSettings;

	const email = normalizeEmail(authContext.email);
	const { derivedStatus, suspendedReason, shouldSetApproved } = deriveUserStatus(
		settings,
		email
	);

	const docRef = db.collection("users").doc(authContext.uid);
	const snapshot = await docRef.get();

	const basePayload = {
		email: authContext.email ?? "",
		displayName: authContext.displayName ?? null,
		photoURL: authContext.photoURL ?? null,
		lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	if (!snapshot.exists) {
		await docRef.set(
			{
				uid: authContext.uid,
				role: authContext.role ?? "user",
				status: derivedStatus,
				suspendedReason,
				approvedAt: shouldSetApproved
					? admin.firestore.FieldValue.serverTimestamp()
					: null,
				approvedBy: shouldSetApproved ? "system" : null,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				...basePayload,
			},
			{ merge: true }
		);
	} else {
		const data = snapshot.data() || {};
		const updates: Record<string, unknown> = { ...basePayload };

		if (!data.status) {
			updates.status = derivedStatus;
			if (suspendedReason) updates.suspendedReason = suspendedReason;
		}

		if (!data.role) {
			updates.role = authContext.role ?? "user";
		}

		if (!data.createdAt) {
			updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
		}

		if (!data.approvedAt && shouldSetApproved) {
			updates.approvedAt = admin.firestore.FieldValue.serverTimestamp();
			updates.approvedBy = "system";
		}

		await docRef.set(updates, { merge: true });
	}

	return {
		uid: authContext.uid,
		role: authContext.role ?? "user",
		status: snapshot.exists ? snapshot.data()?.status ?? derivedStatus : derivedStatus,
	};
};
