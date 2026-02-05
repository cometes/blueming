import type express from "express";
import admin from "firebase-admin";

export type AuthContext = {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	isAdmin: boolean;
};

const OWNER_UID = process.env.FIREBASE_OWNER_UID?.trim() ?? "";

export const getAuthContext = async (
	req: express.Request
): Promise<AuthContext | null> => {
	const header = req.headers.authorization;
	if (!header || !header.startsWith("Bearer ")) return null;
	const token = header.slice("Bearer ".length);
	try {
		const decoded = await admin.auth().verifyIdToken(token);
		const isOwner = OWNER_UID !== "" && decoded.uid === OWNER_UID;
		const isAdmin = decoded.admin === true || decoded.isAdmin === true || isOwner;
		return {
			uid: decoded.uid,
			email: decoded.email ?? null,
			displayName: decoded.name ?? null,
			photoURL: decoded.picture ?? null,
			isAdmin,
		};
	} catch {
		return null;
	}
};

export const requireAdmin: express.RequestHandler = async (req, res, next) => {
	const authContext = await getAuthContext(req);
	if (!authContext?.isAdmin) {
		res.status(403).json({ error: "Admin permission required." });
		return;
	}
	(req as express.Request & { auth?: AuthContext }).auth = authContext;
	next();
};
