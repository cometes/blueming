import { auth, db, storage } from "@/lib/Firebase";
import type { StickerAsset, StickerAssetTab } from "@/types/stickerBoard";
import { getAuthHeader } from "@/queries/getAuthHeader";
import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
	type Timestamp,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const requireUid = () => {
	const uid = auth.currentUser?.uid;
	if (!uid) throw new Error("로그인이 필요합니다.");
	return uid;
};

const toMs = (ts: unknown) => {
	const t = ts as Timestamp | undefined;
	if (!t) return undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const anyT: any = t as any;
	if (typeof anyT?.toMillis === "function") return anyT.toMillis() as number;
	return undefined;
};

const getExt = (file: File) => {
	const fromType = file.type?.split("/")?.[1];
	if (fromType) return fromType.toLowerCase();
	const fromName = file.name?.split(".")?.pop();
	return (fromName || "png").toLowerCase();
};

const uploadImageViaApi = async (file: File): Promise<string> => {
	const formData = new FormData();
	// NOTE: `useFileUpload` uses "file". We match that for compatibility.
	formData.append("file", file);
	const authHeader = await getAuthHeader();
	const response = await fetch(
		"https://api-w5buphcleq-du.a.run.app/images/uploadImage",
		{
			method: "POST",
			headers: authHeader,
			body: formData,
		}
	);
	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}
	const data = (await response.json()) as {
		file?: { url?: string };
		files?: Array<{ url?: string }>;
	};
	const url = data?.files?.[0]?.url;
	if (!url) throw new Error("서버에서 URL을 받지 못했습니다.");
	return url;
};

const readImageSize = async (file: File): Promise<{ width?: number; height?: number }> => {
	try {
		const url = URL.createObjectURL(file);
		try {
			const img = new Image();
			img.src = url;
			try {
				await img.decode();
			} catch {
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error("failed to load image"));
				});
			}
			return {
				width: img.naturalWidth || undefined,
				height: img.naturalHeight || undefined,
			};
		} finally {
			URL.revokeObjectURL(url);
		}
	} catch {
		return {};
	}
};

export async function listStickerAssets(tab: StickerAssetTab): Promise<StickerAsset[]> {
	const uid = requireUid();
	const col = collection(db, "users", uid, "stickerAssets");

	const q = (() => {
		switch (tab) {
			case "favorites":
				// Avoid composite index requirement by sorting client-side.
				return query(col, where("favorite", "==", true), limit(60));
			case "recent":
				return query(col, orderBy("lastUsedAt", "desc"), limit(60));
			case "all":
			default:
				return query(col, orderBy("createdAt", "desc"), limit(60));
		}
	})();

	const snap = await getDocs(q);
	const list = snap.docs.map((d) => {
		const data = d.data() as Record<string, unknown>;
		return {
			id: d.id,
			url: String(data.url || ""),
			name: typeof data.name === "string" ? data.name : undefined,
			width: typeof data.width === "number" ? data.width : undefined,
			height: typeof data.height === "number" ? data.height : undefined,
			favorite: Boolean(data.favorite),
			storagePath: typeof data.storagePath === "string" ? data.storagePath : undefined,
			createdAtMs: toMs(data.createdAt),
			lastUsedAtMs: toMs(data.lastUsedAt),
		};
	});
	if (tab === "favorites") {
		return list
			.slice()
			.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
	}
	return list;
}

export async function createStickerAssetFromFile(file: File): Promise<StickerAsset> {
	const uid = requireUid();
	const assetId = uuidv4();
	const ext = getExt(file);
	const storagePath = `users/${uid}/stickerAssets/${assetId}.${ext}`;

	const size = await readImageSize(file);

	let url = "";
	let storedPath: string | undefined = storagePath;
	try {
		const storageRef = ref(storage, storagePath);
		await uploadBytes(storageRef, file, {
			contentType: file.type || undefined,
		});
		url = await getDownloadURL(storageRef);
	} catch (e) {
		// If Storage Rules are not configured, fall back to existing upload API.
		const msg = e instanceof Error ? e.message : "";
		const isUnauthorized = msg.includes("storage/unauthorized") || msg.includes("unauthorized");
		if (!isUnauthorized) throw e;
		url = await uploadImageViaApi(file);
		storedPath = undefined;
	}

	const docRef = doc(db, "users", uid, "stickerAssets", assetId);
	const data: Record<string, unknown> = {
		url,
		name: file.name || null,
		width: size.width ?? null,
		height: size.height ?? null,
		favorite: false,
		createdAt: serverTimestamp(),
		lastUsedAt: serverTimestamp(),
	};
	if (storedPath) data.storagePath = storedPath;
	// Firestore doesn't allow `undefined`; use nulls for optional fields.
	await setDoc(docRef, data);

	return {
		id: assetId,
		url,
		name: file.name || undefined,
		width: size.width ?? undefined,
		height: size.height ?? undefined,
		favorite: false,
		storagePath: storedPath,
	};
}

export async function setStickerAssetFavorite(assetId: string, favorite: boolean) {
	const uid = requireUid();
	const docRef = doc(db, "users", uid, "stickerAssets", assetId);
	await updateDoc(docRef, { favorite });
}

export async function markStickerAssetUsed(assetId: string) {
	const uid = requireUid();
	const docRef = doc(db, "users", uid, "stickerAssets", assetId);
	await updateDoc(docRef, { lastUsedAt: serverTimestamp() });
}

export async function deleteStickerAsset(asset: Pick<StickerAsset, "id" | "storagePath">) {
	const uid = requireUid();
	if (asset.storagePath) {
		try {
			await deleteObject(ref(storage, asset.storagePath));
		} catch {
			// ignore storage delete failure; still try to delete doc
		}
	}
	await deleteDoc(doc(db, "users", uid, "stickerAssets", asset.id));
}
