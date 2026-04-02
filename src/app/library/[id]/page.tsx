import type { Metadata } from "next";
import { fetchLibraryDetailDirect } from "@/features/library/api/serverDirect";
import { getServerSettings } from "@/app/api/_lib/settingsServer";
import DetailClient from "./DetailClient";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	try {
		const { id } = await params;
		const [detailData, settings] = await Promise.all([
			fetchLibraryDetailDirect(id),
			getServerSettings(),
		]);

		const siteTitle = settings?.general?.general?.title || "";
		const defaultShareImage = settings?.general?.general?.shareImage;
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";

		if (!detailData) return {};

		const title = detailData.title
			? `${detailData.title}${siteTitle ? ` | ${siteTitle}` : ""}`
			: siteTitle;
		const description = detailData.subtitle || siteTitle || "";
		const image = detailData.thumbnail || defaultShareImage;

		return {
			title,
			description,
			...(siteUrl && { metadataBase: new URL(siteUrl) }),
			openGraph: {
				title,
				description,
				...(image && {
					images: [{ url: image, width: 1200, height: 630, alt: title }],
				}),
			},
			twitter: {
				card: "summary_large_image",
				title,
				description,
				...(image && {
					images: [{ url: image, width: 1200, height: 630, alt: title }],
				}),
			},
		};
	} catch {
		return {};
	}
}

export default async function LibararyDetailPage({ params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const detailData = await fetchLibraryDetailDirect(id);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return <DetailClient detailData={detailData as any} />;
	} catch {
		return <DetailClient detailData={null} />;
	}
}
