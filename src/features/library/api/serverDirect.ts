import "server-only";
import { unstable_cache } from "next/cache";
import { getDb, getBucket } from "@/app/api/_lib/admin";
import {
	parsePositiveInt,
	buildQueryTokens,
	toLibraryItem,
	matchesQuery,
	sortItems,
} from "@/app/api/_lib/library";
import { getAuthContext } from "@/app/api/_lib/auth";
import type { FetchLibraryListParams } from "@/features/library/types";

export type LibraryListResult = {
	items: ReturnType<typeof toLibraryItem>[];
	pinnedItems: ReturnType<typeof toLibraryItem>[];
	total: number;
	page: number;
	limit: number;
};

export async function fetchLibraryListDirect(
	params: FetchLibraryListParams = {}
): Promise<LibraryListResult> {
	const db = getDb();
	const limit = parsePositiveInt(params.limit, 10);
	const page = parsePositiveInt(params.page, 1);
	const sort = params.sort ?? "latest";
	const tag = params.tag ?? "";
	const query = (params.query ?? "").trim().toLowerCase();

	const hasTagFilter = tag && tag !== "전체";
	let baseQuery: FirebaseFirestore.Query = db.collection("library");
	if (hasTagFilter) {
		baseQuery = baseQuery.where("tags", "array-contains", tag);
	}

	if (hasTagFilter) {
		const snapshot = await baseQuery.get();
		const allItems = snapshot.docs.map(toLibraryItem);
		const filtered = query
			? allItems.filter((item) => matchesQuery(item, query))
			: allItems;
		const sorted = sortItems(filtered, sort);
		const total = sorted.length;
		const startIndex = (page - 1) * limit;
		const items = sorted.slice(startIndex, startIndex + limit);
		return { items, pinnedItems: [], total, page, limit };
	}

	if (sort === "title") {
		baseQuery = baseQuery.orderBy("pinned", "desc").orderBy("title", "asc");
	} else {
		baseQuery = baseQuery
			.orderBy("pinned", "desc")
			.orderBy("createdAt", sort === "oldest" ? "asc" : "desc");
	}

	if (query) {
		const tokens = buildQueryTokens(query);
		let searchQuery: FirebaseFirestore.Query = baseQuery;
		let usedTokenSearch = false;
		if (tokens.length > 0) {
			searchQuery = searchQuery.where(
				"searchTokens",
				"array-contains-any",
				tokens
			);
			usedTokenSearch = true;
		}

		const snapshot = await searchQuery.get();
		let searchItems = snapshot.docs.map(toLibraryItem);

		if (snapshot.empty && usedTokenSearch) {
			const fallbackSnapshot = await baseQuery.get();
			searchItems = fallbackSnapshot.docs.map(toLibraryItem);
		}

		let filtered = searchItems.filter((item) => matchesQuery(item, query));
		if (filtered.length === 0 && usedTokenSearch) {
			const fallbackSnapshot = await baseQuery.get();
			const fallbackItems = fallbackSnapshot.docs.map(toLibraryItem);
			filtered = fallbackItems.filter((item) => matchesQuery(item, query));
		}

		if (filtered.length === 0) {
			const broadSnapshot = await db.collection("library").get();
			const broadItems = broadSnapshot.docs.map(toLibraryItem);
			filtered = broadItems.filter((item) => matchesQuery(item, query));
		}

		if (filtered.length === 0) {
			return { items: [], pinnedItems: [], total: 0, page, limit };
		}
		const sorted = sortItems(filtered, sort);
		const total = sorted.length;
		const startIndex = (page - 1) * limit;
		const items = sorted.slice(startIndex, startIndex + limit);
		return { items, pinnedItems: [], total, page, limit };
	}

	const snapshot = await db.collection("library").get();
	if (snapshot.empty) {
		return { items: [], pinnedItems: [], total: 0, page, limit };
	}

	const allItems = snapshot.docs.map(toLibraryItem);
	const pinnedItems = allItems.filter((item) => item.pinned);
	const nonPinnedItems = allItems.filter((item) => !item.pinned);
	const sorted = sortItems(nonPinnedItems, sort);
	const total = sorted.length;
	const startIndex = (page - 1) * limit;
	const items = sorted.slice(startIndex, startIndex + limit);
	return { items, pinnedItems, total, page, limit };
}

export type SeriesItem = {
	series: string;
	postLength: number;
	lastUpdatedThumbnail: string;
	lastUpdatedDate: string;
	lastUpdatedSlug?: string | null;
};

export async function fetchLibrarySeriesDirect(): Promise<SeriesItem[]> {
	const db = getDb();
	const snapshot = await db.collection("series").get();

	if (snapshot.empty) return [];

	return snapshot.docs.map((doc) => {
		const seriesName = doc.id;
		const posts = (doc.data().posts || []) as Array<{
			createdAt?: string;
			thumbnail?: string;
			slug?: string | null;
		}>;

		if (posts.length === 0) {
			return {
				series: seriesName,
				postLength: 0,
				lastUpdatedThumbnail: "",
				lastUpdatedDate: "",
			};
		}

		const sortedPosts = posts.sort((a, b) =>
			(a.createdAt ?? "") > (b.createdAt ?? "") ? -1 : 1
		);
		const lastUpdatedPost = sortedPosts[0] ?? null;

		return {
			series: seriesName,
			postLength: posts.length,
			lastUpdatedThumbnail: lastUpdatedPost?.thumbnail ?? "",
			lastUpdatedDate: lastUpdatedPost?.createdAt ?? "",
			lastUpdatedSlug: lastUpdatedPost?.slug ?? null,
		};
	});
}

export async function fetchLibraryTagsDirect(): Promise<string[]> {
	const db = getDb();
	const snapshot = await db.collection("tags").get();
	if (snapshot.empty) return [];
	return snapshot.docs.map((doc) => doc.id);
}

async function fetchLibrarySettingsDirect(): Promise<Record<string, unknown>> {
	const db = getDb();
	const snap = await db.collection("settings").doc("library").get();
	return snap.exists ? (snap.data() ?? {}) : {};
}

export const fetchLibrarySettingsCached = unstable_cache(
	fetchLibrarySettingsDirect,
	["library-settings"],
	{ tags: ["library-settings"], revalidate: 3600 }
);

export const fetchLibrarySeriesCached = unstable_cache(
	fetchLibrarySeriesDirect,
	["library-series"],
	{ tags: ["library-series"], revalidate: 300 }
);

export const fetchLibraryTagsCached = unstable_cache(
	fetchLibraryTagsDirect,
	["library-tags"],
	{ tags: ["library-tags"], revalidate: 300 }
);

export type LibraryDetailResult = {
	id: string;
	title: string;
	subtitle?: string;
	author?: string | null;
	authorPhotoURL?: string | null;
	backgroundType?: string;
	backgroundColor?: string | null;
	backgroundImage?: string | null;
	enableBackdrop?: boolean;
	slug?: string;
	createdAt: string | null;
	allow?: string;
	password?: null;
	thumbnail?: string;
	series?: string;
	tags?: string[];
	pinned?: boolean;
	content: string | null;
	requiresPassword?: boolean;
	prevPost?: { id?: string; title?: string; slug?: string } | null;
	nextPost?: { id?: string; title?: string; slug?: string } | null;
};

export async function fetchLibraryDetailDirect(
	id: string
): Promise<LibraryDetailResult | null> {
	const decodedId = decodeURIComponent(id);
	try {
		const db = getDb();
		const bucket = getBucket();

		// 1) 직접 ID 조회
		const directSnapshot = await db.collection("library").doc(decodedId).get();

		// 2) ID로 못 찾으면 slug 쿼리
		let resolvedId: string;
		let docData: FirebaseFirestore.DocumentData;

		if (directSnapshot.exists) {
			resolvedId = decodedId;
			docData = directSnapshot.data()!;
		} else {
			const slugSnapshot = await db
				.collection("library")
				.where("slug", "==", decodedId)
				.limit(1)
				.get();
			if (slugSnapshot.empty) return null;
			const slugDoc = slugSnapshot.docs[0];
			resolvedId = slugDoc.id;
			docData = slugDoc.data();
		}

		const metadata = docData;
		const formattedCreatedAt =
			metadata.createdAt && metadata.createdAt.toDate
				? metadata.createdAt.toDate().toISOString()
				: null;

		const requiresPassword = metadata.allow === "password";
		const authContext = await getAuthContext();
		const authorUid =
			typeof metadata.authorUid === "string" ? metadata.authorUid : null;
		const isOwner = Boolean(authorUid) && authContext?.uid === authorUid;
		const bypassPassword = Boolean(authContext?.isAdmin || isOwner);

		if (requiresPassword && !bypassPassword) {
			return {
				id: resolvedId,
				title: metadata.title,
				subtitle: metadata.subtitle,
				author: metadata.author || null,
				authorPhotoURL: metadata.authorPhotoURL || null,
				backgroundType: metadata.backgroundType || "default",
				backgroundColor: metadata.backgroundColor || null,
				backgroundImage: metadata.backgroundImage || null,
				enableBackdrop:
					typeof metadata.enableBackdrop === "boolean"
						? metadata.enableBackdrop
						: true,
				slug: metadata.slug || undefined,
				createdAt: formattedCreatedAt,
				allow: metadata.allow,
				password: null,
				thumbnail: metadata.thumbnail,
				series: metadata.series,
				tags: metadata.tags,
				pinned: metadata.pinned === true,
				content: null,
				requiresPassword: true,
				prevPost: null,
				nextPost: null,
			};
		}

		const contentPath = `library/create/contents/${resolvedId}/content.json`;
		const file = bucket.file(contentPath);
		const collectionRef = db.collection("library");
		const currentCreatedAt = metadata.createdAt;

		type PostRef = { id: string; title: string; slug?: string } | null;
		const toPostRef = (snap: FirebaseFirestore.QuerySnapshot): PostRef => {
			const doc = snap.docs[0];
			if (!doc) return null;
			return {
				id: doc.id,
				title: doc.data().title as string,
				slug: (doc.data().slug as string) || undefined,
			};
		};

		const contentPromise = file
			.download()
			.then(([data]) => data.toString())
			.catch((storageError) => {
				console.error(
					`[fetchLibraryDetailDirect] Storage download failed for id="${resolvedId}":`,
					storageError,
				);
				return "";
			});

		const prevPromise = currentCreatedAt
			? collectionRef
					.where("createdAt", "<", currentCreatedAt)
					.orderBy("createdAt", "desc")
					.limit(1)
					.get()
					.then(toPostRef)
			: Promise.resolve<PostRef>(null);

		const nextPromise = currentCreatedAt
			? collectionRef
					.where("createdAt", ">", currentCreatedAt)
					.orderBy("createdAt", "asc")
					.limit(1)
					.get()
					.then(toPostRef)
			: Promise.resolve<PostRef>(null);

		const [content, prevPost, nextPost] = await Promise.all([
			contentPromise,
			prevPromise,
			nextPromise,
		]);

		return {
			id: resolvedId,
			title: metadata.title,
			subtitle: metadata.subtitle,
			author: metadata.author || null,
			authorPhotoURL: metadata.authorPhotoURL || null,
			backgroundType: metadata.backgroundType || "default",
			backgroundColor: metadata.backgroundColor || null,
			backgroundImage: metadata.backgroundImage || null,
			enableBackdrop:
				typeof metadata.enableBackdrop === "boolean"
					? metadata.enableBackdrop
					: true,
			slug: metadata.slug || undefined,
			createdAt: formattedCreatedAt,
			allow: metadata.allow,
			password: bypassPassword ? (metadata.password ?? null) : null,
			thumbnail: metadata.thumbnail,
			series: metadata.series,
			tags: metadata.tags,
			pinned: metadata.pinned === true,
			content,
			requiresPassword: false,
			prevPost: prevPost
				? { id: prevPost.id, title: prevPost.title, slug: prevPost.slug }
				: null,
			nextPost: nextPost
				? { id: nextPost.id, title: nextPost.title, slug: nextPost.slug }
				: null,
		};
	} catch (error) {
		console.error("[fetchLibraryDetailDirect] Unexpected error:", error);
		return null;
	}
}

export type SeriesListResult = {
	series: string;
	lastUpdatedThumbnail: string;
	lastUpdatedDate: string;
	data: Array<{
		id?: string;
		title?: string;
		subtitle?: string;
		slug?: string | null;
		createdAt?: string;
		thumbnail?: string;
	}>;
};

export async function fetchLibrarySeriesListDirect(
	series: string
): Promise<SeriesListResult> {
	const db = getDb();
	const originalSeriesName = decodeURIComponent(series).replace(/_/g, " ");

	const seriesDoc = await db
		.collection("series")
		.doc(originalSeriesName)
		.get();

	if (!seriesDoc.exists) {
		return {
			series: originalSeriesName,
			lastUpdatedThumbnail: "",
			lastUpdatedDate: "",
			data: [],
		};
	}

	const posts = (seriesDoc.data()?.posts || []) as Array<{
		id?: string;
		title?: string;
		subtitle?: string;
		slug?: string | null;
		createdAt?: string;
		thumbnail?: string;
	}>;

	if (posts.length === 0) {
		return {
			series: originalSeriesName,
			lastUpdatedThumbnail: "",
			lastUpdatedDate: "",
			data: [],
		};
	}

	const sortedPosts = posts.sort((a, b) =>
		(a.createdAt ?? "") > (b.createdAt ?? "") ? -1 : 1
	);
	const lastUpdatedPost = sortedPosts[0] ?? null;

	return {
		series: originalSeriesName,
		lastUpdatedThumbnail: lastUpdatedPost?.thumbnail ?? "",
		lastUpdatedDate: lastUpdatedPost?.createdAt ?? "",
		data: sortedPosts.map((post) => ({
			id: post.id,
			title: post.title,
			subtitle: post.subtitle,
			slug: post.slug ?? null,
			createdAt: post.createdAt,
			thumbnail: post.thumbnail,
		})),
	};
}
