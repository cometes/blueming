import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";

export const runtime = "nodejs";

export async function GET() {
	try {
		const db = getDb();
		const seriesCollectionRef = db.collection("series");
		const snapshot = await seriesCollectionRef.get();

		if (snapshot.empty) {
			return jsonOk([]);
		}

		const result = snapshot.docs.map((doc) => {
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
			const lastUpdatedPost = sortedPosts[0] || null;

			return {
				series: seriesName,
				postLength: posts.length,
				lastUpdatedThumbnail: lastUpdatedPost?.thumbnail || "",
				lastUpdatedDate: lastUpdatedPost?.createdAt || "",
				lastUpdatedSlug: lastUpdatedPost?.slug || null,
			};
		});

		return jsonOk(result);
	} catch (error) {
		console.error("Error summarizing series data:", error);
		return jsonError(500, "Failed to summarize series data.");
	}
}
