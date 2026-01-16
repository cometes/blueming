import type express from "express";
import admin from "firebase-admin";

export type AuthContext = {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	isAdmin: boolean;
};

export const getAuthContext = async (
	req: express.Request
): Promise<AuthContext | null> => {
	const header = req.headers.authorization;
	if (!header || !header.startsWith("Bearer ")) return null;
	const token = header.slice("Bearer ".length);
	try {
		const decoded = await admin.auth().verifyIdToken(token);
		const isAdmin = decoded.admin === true || decoded.isAdmin === true;
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
