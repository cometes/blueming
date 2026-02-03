import "server-only";
import admin from "firebase-admin";

let app: admin.app.App | undefined;

export const getAdmin = () => {
	if (!app) {
		const existing = admin.apps?.[0];
		if (existing) {
			app = existing;
			return admin;
		}
		const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
		if (!raw) {
			throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
		}
		const parsed = JSON.parse(raw) as admin.ServiceAccount;
		app = admin.initializeApp({
			credential: admin.credential.cert(parsed),
			storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
		});
	}
	return admin;
};

export const getDb = () => getAdmin().firestore();
export const getBucket = () => getAdmin().storage().bucket();
export const getFireAuth = () => getAdmin().auth();
