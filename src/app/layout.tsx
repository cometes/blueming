import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import Providers from "@/providers/Providers";
import { getServerSettings, type ServerSettings, type FontRegistryItem } from "@/app/api/_lib/settingsServer";
import { getFontFormat, isFontFileUrl } from "@/shared/lib/fonts";

type AppSettings = ServerSettings;

const resolveGeneralSettings = (settings: ServerSettings | null) => {
	const raw = settings?.general as Record<string, unknown> | undefined;
	if (!raw || typeof raw !== "object") return { general: undefined, design: undefined };
	const nestedGeneral = (raw as { general?: unknown }).general;
	const general =
		nestedGeneral && typeof nestedGeneral === "object"
			? (nestedGeneral as Record<string, unknown>)
			: ("primaryColor" in raw ||
				"secondaryColor" in raw ||
				"title" in raw ||
				"logoType" in raw
					? raw
					: undefined);
	const design = (raw as { design?: unknown }).design as Record<string, unknown> | undefined;
	return { general, design };
};

const buildThemeStyle = (settings: ServerSettings | null) => {
	const { general, design } = resolveGeneralSettings(settings);
	if (!general && !design) return "";

	const variables: string[] = [];

	if (general?.primaryColor !== undefined) {
		variables.push(`--primary-color:${general.primaryColor}`);
	}
	if (general?.secondaryColor !== undefined) {
		variables.push(`--secondary-color:${general.secondaryColor}`);
	}

	const font = (design as Record<string, unknown> | undefined)?.font as Record<string, unknown> | undefined;
	// 멀티 워드 폰트명은 따옴표로 감싸야 CSS font-family에서 올바르게 동작 (예: "Noto Sans KR")
	const formatFontFamilySSR = (value: string) => {
		const v = value.trim();
		if (!v) return v;
		if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v;
		if (v.includes(" ")) return `"${v}"`;
		return v;
	};
	if (font?.bodyFontFamily !== undefined) {
		variables.push(`--font-body:${formatFontFamilySSR(String(font.bodyFontFamily))}`);
	}
	if (font?.titleFontFamily !== undefined) {
		variables.push(`--font-title:${formatFontFamilySSR(String(font.titleFontFamily))}`);
	}
	if (font?.mainFontColor !== undefined) {
		variables.push(`--color-main:${font.mainFontColor}`);
	}
	if (font?.subFontColor !== undefined) {
		variables.push(`--color-sub:${font.subFontColor}`);
	}

	const background = (design as Record<string, unknown> | undefined)?.background as
		| { type?: string; color?: string; image?: string }
		| undefined;
	if (background?.color !== undefined) {
		variables.push(`--bg-color:${background.color}`);
	}
	if (background?.type === "이미지" && background.image) {
		variables.push(`--bg-image:url("${background.image}")`);
	}

	const widget = (design as Record<string, unknown> | undefined)?.widget as Record<string, unknown> | undefined;
	if (widget?.background !== undefined) {
		variables.push(`--widget-bg:${widget.background}`);
	}
	if (widget?.borderColor !== undefined) {
		variables.push(`--widget-border-color:${widget.borderColor}`);
	}
	if (widget?.borderRadius !== undefined) {
		variables.push(`--widget-border-radius:${widget.borderRadius}px`);
	}
	if (widget?.borderWidth !== undefined) {
		variables.push(`--widget-border-width:${widget.borderWidth}px`);
	}
	if (widget?.borderStyle !== undefined) {
		variables.push(`--widget-border-style:${widget.borderStyle}`);
	}
	if (widget?.blur !== undefined) {
		variables.push(`--widget-blur:${widget.blur}px`);
	}

	const card = (design as Record<string, unknown> | undefined)?.card as Record<string, unknown> | undefined;
	if (card?.background !== undefined) {
		variables.push(`--card-bg:${card.background}`);
	}
	if (card?.borderColor !== undefined) {
		variables.push(`--card-border-color:${card.borderColor}`);
	}
	if (card?.borderActiveColor !== undefined) {
		variables.push(`--card-border-active:${card.borderActiveColor}`);
	}
	if (card?.borderRadius !== undefined) {
		variables.push(`--card-border-radius:${card.borderRadius}px`);
	}
	if (card?.borderStyle !== undefined) {
		variables.push(`--card-border-style:${card.borderStyle}`);
	}
	if (card?.boxShadow !== undefined) {
		variables.push(`--card-shadow:${card.boxShadow}`);
	}
	if (card?.translateY !== undefined) {
		variables.push(`--card-translate-y:${card.translateY}px`);
	}

	return variables.length > 0 ? `:root{${variables.join(";")}}` : "";
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

const getFontRegistry = (settings: ServerSettings | null): FontRegistryItem[] =>
	settings?.general?.fontRegistry ?? [];


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

const getSettings = getServerSettings;

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
