import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";

export const runtime = "nodejs";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ series?: string }> }
) {
	const { series: seriesName } = await params;
	if (!seriesName) {
		return jsonError(400, "Series name is required.");
	}

	const decoded = decodeURIComponent(seriesName);
	const originalSeriesName = decoded.replace(/_/g, " ");

	try {
		const db = getDb();
		const seriesDoc = await db.collection("series").doc(originalSeriesName).get();

		if (!seriesDoc.exists) {
			return jsonOk({
				series: originalSeriesName,
				lastUpdatedThumbnail: "",
				lastUpdatedDate: "",
				data: [],
			});
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
			return jsonOk({
				series: originalSeriesName,
				lastUpdatedThumbnail: "",
				lastUpdatedDate: "",
				data: [],
			});
		}

		const sortedPosts = posts.sort((a, b) =>
			(a.createdAt ?? "") > (b.createdAt ?? "") ? -1 : 1
		);
		const lastUpdatedPost = sortedPosts[0] || null;

		return jsonOk({
			series: originalSeriesName,
			lastUpdatedThumbnail: lastUpdatedPost?.thumbnail || "",
			lastUpdatedDate: lastUpdatedPost?.createdAt || "",
			data: sortedPosts.map((post) => ({
				id: post.id,
				title: post.title,
				subtitle: post.subtitle,
				slug: post.slug || null,
				createdAt: post.createdAt,
				thumbnail: post.thumbnail,
			})),
		});
	} catch (error) {
		console.error("Error fetching posts for series:", error);
		return jsonError(500, "Failed to fetch posts for series.");
	}
}
