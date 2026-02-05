import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import Providers from "@/providers/Providers";
import { getDb } from "@/app/api/_lib/admin";
import { normalizeGeneralData } from "@/app/api/_lib/settings";

export const dynamic = "force-dynamic";

type ThemeSettings = {
	general?: {
		general?: {
			primaryColor?: string;
			secondaryColor?: string;
			favicon?: string;
			title?: string;
			desc?: string;
			shareImage?: string;
		};
		fontRegistry?: FontRegistryItem[];
		design?: {
			font?: {
				bodyFontFamily?: string;
				titleFontFamily?: string;
				mainFontColor?: string;
				subFontColor?: string;
			};
			background?: {
				type?: string;
				color?: string;
				image?: string;
			};
			widget?: {
				background?: string;
				borderColor?: string;
				borderRadius?: number;
				borderWidth?: number;
				blur?: number;
			};
			card?: {
				background?: string;
				borderColor?: string;
				borderActiveColor?: string;
				borderRadius?: number;
				boxShadow?: string;
				translateY?: number;
			};
		};
	};
};

type FontRegistryItem = {
	id?: string;
	name?: string;
	family?: string;
	url?: string;
	source?: "url" | "file";
};

type AppSettings = ThemeSettings & {
	general?: ThemeSettings["general"] & {
		menu?: {
			design?: {
				backgroundImage?: string;
				iconBarBackgroundImage?: string;
				logoImage?: string;
				iconBarLogoImage?: string;
			};
		};
	};
};

const buildThemeStyle = (settings: ThemeSettings | null) => {
	const general = settings?.general?.general;
	const design = settings?.general?.design;
	if (!general || !design) return "";

	const variables = [
		`--primary-color:${general.primaryColor ?? "#007bff"}`,
		`--secondary-color:${general.secondaryColor ?? "#6c757d"}`,
		`--font-body:${design.font?.bodyFontFamily ?? "sans-serif"}`,
		`--font-title:${design.font?.titleFontFamily ?? "sans-serif"}`,
		`--color-main:${design.font?.mainFontColor ?? "#111111"}`,
		`--color-sub:${design.font?.subFontColor ?? "#666666"}`,
		`--bg-color:${design.background?.color ?? "#ffffff"}`,
		`--widget-bg:${design.widget?.background ?? "rgba(255,255,255,0.8)"}`,
		`--widget-border-color:${design.widget?.borderColor ?? "rgba(0,0,0,0.1)"}`,
		`--widget-border-radius:${design.widget?.borderRadius ?? 16}px`,
		`--widget-border-width:${design.widget?.borderWidth ?? 1}px`,
		`--widget-border-style:solid`,
		`--widget-blur:${design.widget?.blur ?? 0}px`,
		`--card-bg:${design.card?.background ?? "rgba(255,255,255,0.9)"}`,
		`--card-border-color:${design.card?.borderColor ?? "rgba(0,0,0,0.08)"}`,
		`--card-border-active:${design.card?.borderActiveColor ?? "rgba(0,0,0,0.2)"}`,
		`--card-border-radius:${design.card?.borderRadius ?? 20}px`,
		`--card-border-style:solid`,
		`--card-shadow:${design.card?.boxShadow ?? "none"}`,
		`--card-translate-y:${design.card?.translateY ?? 0}px`,
	];

	if (design.background?.type === "이미지" && design.background?.image) {
		variables.push(`--bg-image:url("${design.background.image}")`);
	}

	return `:root{${variables.join(";")}}`;
};

const getPreloadImageUrls = (settings: AppSettings | null) => {
	if (!settings) return [];

	const backgroundImage =
		settings.general?.design?.background?.type === "이미지" ?
			settings.general?.design?.background?.image :
			undefined;
	const menuDesign = settings.general?.menu?.design;

	const urls = [
		backgroundImage,
		menuDesign?.backgroundImage,
		menuDesign?.iconBarBackgroundImage,
		menuDesign?.logoImage,
		menuDesign?.iconBarLogoImage,
	];

	return Array.from(
		new Set(urls.filter((url): url is string => !!url))
	);
};

const getFontRegistry = (settings: ThemeSettings | null) =>
	settings?.general?.fontRegistry ?? [];

const getFontFormat = (url: string) => {
	const cleanUrl = url.split("?")[0];
	const ext = cleanUrl.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "woff2":
			return "woff2";
		case "woff":
			return "woff";
		case "ttf":
			return "truetype";
		case "otf":
			return "opentype";
		case "eot":
			return "embedded-opentype";
		default:
			return undefined;
	}
};

const isFontFileUrl = (url: string) => {
	const cleanUrl = url.split("?")[0].toLowerCase();
	return /\.(woff2|woff|ttf|otf|eot)$/.test(cleanUrl);
};

const buildFontFaceCSS = (fonts: FontRegistryItem[]) =>
	fonts
		.filter(
			(font) =>
				font?.family &&
				font?.url &&
				(font?.source === "file" || isFontFileUrl(font.url))
		)
		.map((font) => {
			const format = getFontFormat(font.url as string);
			const formatValue = format ? ` format("${format}")` : "";
			return `@font-face{font-family:"${font.family}";src:url("${font.url}")${formatValue};font-display:swap;}`;
		})
		.join("");

async function getSettings(): Promise<AppSettings | null> {
	try {
		const db = getDb();
		const settingsSnapshot = await db.collection("settings").get();
		const settingsDataPromises = settingsSnapshot.docs.map(async (doc) => {
			const docSnapshot = await doc.ref.get();
			const docData = docSnapshot.exists ? docSnapshot.data() : {};
			const subCollections = await doc.ref.listCollections();
			const subCollectionPromises = subCollections.map(async (subCollection) => {
				const subCollectionSnapshot = await subCollection.get();
				const subCollectionData = subCollectionSnapshot.docs.reduce(
					(acc, subDoc) => {
						acc[subDoc.id] = subDoc.data();
						return acc;
					},
					{} as Record<string, unknown>
				);
				return { [subCollection.id]: subCollectionData };
			});
			const subCollectionResults = await Promise.all(subCollectionPromises);
			const fullData = subCollectionResults.reduce(
				(acc, curr) => ({ ...acc, ...curr }),
				docData ?? {}
			);
			return { [doc.id]: fullData };
		});
		const settingsData = await Promise.all(settingsDataPromises);
		const result = settingsData.reduce(
			(acc, curr) => ({ ...acc, ...curr }),
			{} as Record<string, unknown>
		);
		const normalized = {
			...result,
			general: normalizeGeneralData(result.general),
		};
		return normalized as AppSettings;
	} catch {
		return null;
	}
}

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSettings();
	const title = settings?.general?.general?.title || "Create Next App";
	const description = settings?.general?.general?.desc || "Generated by create next app";
	const shareImage = settings?.general?.general?.shareImage;

	const favicon = settings?.general?.general?.favicon;

	return {
		title,
		description,
		icons: {
			icon: favicon || "/favicon.ico",
		},
		openGraph: {
			title,
			description,
			...(shareImage && {
				images: [
					{
						url: shareImage,
						width: 1200,
						height: 630,
						alt: title,
					},
				],
			}),
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			...(shareImage && {
				images: [shareImage],
			}),
		},
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const settings = await getSettings();
	const themeStyle = buildThemeStyle(settings);
	const preloadImages = getPreloadImageUrls(settings);
	const fontRegistry = getFontRegistry(settings);
	const fontFaceCSS = buildFontFaceCSS(fontRegistry);

	return (
		<html lang="en">
			<head>
				<link rel="preconnect" href="https://cdn.jsdelivr.net" />
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
				/>
				{preloadImages.map((url) => (
					<link key={url} rel="preload" as="image" href={url} />
				))}
				{fontRegistry
					.filter(
						(font) =>
							font?.source === "url" && font?.url && !isFontFileUrl(font.url)
					)
					.map((font) => (
						<link
							key={font.id || font.url}
							rel="stylesheet"
							href={font.url as string}
							data-font-registry="true"
						/>
					))}
				{fontFaceCSS ? (
					<style data-font-registry="true">{fontFaceCSS}</style>
				) : null}
				{themeStyle ? <style>{themeStyle}</style> : null}
			</head>
			<body>
				<Providers initialSettings={settings}>
					<Layout>{children}</Layout>
				</Providers>
			</body>
		</html>
	);
}
