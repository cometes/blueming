import "server-only";
import { v4 as uuidv4 } from "uuid";

export const parsePositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	if (Number.isNaN(parsed) || parsed <= 0) return fallback;
	return parsed;
};

export const buildQueryTokens = (query: string) =>
	query
		.toLowerCase()
		.split(/[\s,./\\|_!@#$%^&*()+={}[\]:;"'<>?-]+/)
		.map((token) => token.trim())
		.filter(Boolean)
		.slice(0, 10);

export const toLibraryItem = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
	const data = doc.data();
	const formattedCreatedAt =
		data.createdAt && data.createdAt.toDate
			? data.createdAt.toDate().toISOString()
			: null;

	return {
		id: doc.id,
		title: data.title,
		subtitle: data.subtitle || "",
		author: data.author || null,
		authorPhotoURL: data.authorPhotoURL || null,
		slug: data.slug || null,
		createdAt: formattedCreatedAt,
		allow: data.allow,
		thumbnail: data.thumbnail,
		series: data.series,
		tags: data.tags,
		pinned: data.pinned === true,
		commentCount: typeof data.commentCount === "number" ? data.commentCount : 0,
	};
};

export const matchesQuery = (
	item: ReturnType<typeof toLibraryItem>,
	query: string
) => {
	if (!query) return true;
	const haystack = [
		item.title,
		item.subtitle,
		item.slug,
		...(Array.isArray(item.tags) ? item.tags : []),
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	if (haystack.includes(query)) {
		return true;
	}

	const tokens = buildQueryTokens(query);
	if (tokens.length === 0) {
		return false;
	}

	const haystackTokens = buildQueryTokens(haystack);
	return tokens.every((token) =>
		haystackTokens.some((value) => value.includes(token))
	);
};

export const sortItems = (
	items: ReturnType<typeof toLibraryItem>[],
	sort: string
) => {
	if (sort === "title") {
		return [...items].sort((a, b) => {
			if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
			return a.title.localeCompare(b.title);
		});
	}
	return [...items].sort((a, b) => {
		if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
		const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return sort === "oldest" ? aTime - bTime : bTime - aTime;
	});
};

export const buildSearchTokens = (payload: {
	title: string;
	subtitle: string;
	slug: string | null;
	tags: string[];
}) => {
	const raw = [payload.title, payload.subtitle, payload.slug ?? "", ...payload.tags]
		.join(" ")
		.toLowerCase();

	const tokens = raw
		.split(/[\s,./\\|_!@#$%^&*()+={}[\]:;"'<>?-]+/)
		.map((token) => token.trim())
		.filter(Boolean);

	return Array.from(new Set(tokens)).slice(0, 30);
};

export const normalizeSlug = (value: unknown) => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim().toLowerCase();
	if (!trimmed) return null;
	const normalized = trimmed
		.replace(/\s+/g, "-")
		.replace(/[^\p{L}\p{N}-]+/gu, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	return normalized || null;
};

export const ensureUniqueSlug = async (
	db: FirebaseFirestore.Firestore,
	baseSlug: string | null,
	excludedId?: string
): Promise<string | null> => {
	if (!baseSlug) return null;
	const baseSnapshot = await db
		.collection("library")
		.where("slug", "==", baseSlug)
		.limit(1)
		.get();

	if (baseSnapshot.empty) return baseSlug;
	if (excludedId && baseSnapshot.docs[0]?.id === excludedId) return baseSlug;

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const token = uuidv4().replace(/-/g, "").slice(0, 6);
		const candidate = `${baseSlug}-${token}`;
		const snapshot = await db
			.collection("library")
			.where("slug", "==", candidate)
			.limit(1)
			.get();
		if (snapshot.empty || (excludedId && snapshot.docs[0]?.id === excludedId)) {
			return candidate;
		}
	}

	return `${baseSlug}-${uuidv4().replace(/-/g, "").slice(0, 8)}`;
};

export const normalizeStringArray = (value: unknown) => {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => typeof item === "string" && item.trim());
};
