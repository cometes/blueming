import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";
import { requireAdmin } from "@/app/api/_lib/auth";
import { generateColorPalette } from "@/shared/lib/utils";

export const runtime = "nodejs";

const validateUrl = (url: string): boolean => {
	if (!url || typeof url !== "string") return false;
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
};

const YT_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const YT_PLAYLIST_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

const extractYouTubeVideoId = (input: unknown): string | null => {
	if (typeof input !== "string") return null;
	const raw = input.trim();
	if (!raw) return null;
	if (YT_VIDEO_ID_RE.test(raw)) return raw;
	try {
		const u = new URL(raw);
		const host = u.hostname.replace(/^www\./, "");
		if (host === "youtu.be") {
			const id = u.pathname.split("/").filter(Boolean)[0] || "";
			return YT_VIDEO_ID_RE.test(id) ? id : null;
		}
		if (host === "youtube.com" || host === "m.youtube.com") {
			if (u.pathname === "/watch") {
				const id = u.searchParams.get("v") || "";
				return YT_VIDEO_ID_RE.test(id) ? id : null;
			}
			if (u.pathname.startsWith("/shorts/")) {
				const id = u.pathname.split("/").filter(Boolean)[1] || "";
				return YT_VIDEO_ID_RE.test(id) ? id : null;
			}
			if (u.pathname.startsWith("/embed/")) {
				const id = u.pathname.split("/").filter(Boolean)[1] || "";
				return YT_VIDEO_ID_RE.test(id) ? id : null;
			}
		}
		return null;
	} catch {
		return null;
	}
};

const extractYouTubePlaylistId = (input: unknown): string | null => {
	if (typeof input !== "string") return null;
	const raw = input.trim();
	if (!raw) return null;
	if (YT_PLAYLIST_ID_RE.test(raw)) return raw;
	try {
		const u = new URL(raw);
		const listId = u.searchParams.get("list") || "";
		return YT_PLAYLIST_ID_RE.test(listId) ? listId : null;
	} catch {
		return null;
	}
};

type ImportObject = Record<string, unknown>;

const asObj = (v: unknown): ImportObject | null =>
	v !== null && typeof v === "object" && !Array.isArray(v)
		? (v as ImportObject)
		: null;

const validateGeneralData = (general: ImportObject): string[] => {
	const errors: string[] = [];

	const g = asObj(general.general);
	if (g) {
		if (g.title && typeof g.title !== "string") {
			errors.push("general.general.title must be a string");
		}
		if (g.desc && typeof g.desc !== "string") {
			errors.push("general.general.desc must be a string");
		}
		if (g.logoImage && !validateUrl(String(g.logoImage))) {
			errors.push("general.general.logoImage must be a valid URL");
		}
		if (g.favicon && !validateUrl(String(g.favicon))) {
			errors.push("general.general.favicon must be a valid URL");
		}
		if (g.shareImage && !validateUrl(String(g.shareImage))) {
			errors.push("general.general.shareImage must be a valid URL");
		}
	}

	const menu = asObj(general.menu);
	if (menu) {
		if (menu.menus && !Array.isArray(menu.menus)) {
			errors.push("general.menu.menus must be an array");
		} else if (Array.isArray(menu.menus)) {
			(menu.menus as ImportObject[]).forEach((item, index) => {
				if (!item.id || !item.uniqueId || !item.name) {
					errors.push(
						`general.menu.menus[${index}] must have id, uniqueId, and name`
					);
				}
				if (item.image && !validateUrl(String(item.image))) {
					errors.push(`general.menu.menus[${index}].image must be a valid URL`);
				}
				if (item.iconImage && !validateUrl(String(item.iconImage))) {
					errors.push(
						`general.menu.menus[${index}].iconImage must be a valid URL`
					);
				}
			});
		}

		const menuDesign = asObj(menu.design);
		if (menuDesign) {
			if (menuDesign.backgroundImage && !validateUrl(String(menuDesign.backgroundImage))) {
				errors.push("general.menu.design.backgroundImage must be a valid URL");
			}
			if (menuDesign.logoImage && !validateUrl(String(menuDesign.logoImage))) {
				errors.push("general.menu.design.logoImage must be a valid URL");
			}
			if (menuDesign.iconBarLogoImage && !validateUrl(String(menuDesign.iconBarLogoImage))) {
				errors.push("general.menu.design.iconBarLogoImage must be a valid URL");
			}
			if (menuDesign.iconBarBackgroundImage && !validateUrl(String(menuDesign.iconBarBackgroundImage))) {
				errors.push("general.menu.design.iconBarBackgroundImage must be a valid URL");
			}
		}
	}

	const design = asObj(general.design);
	if (design) {
		const bg = asObj(design.background);
		if (bg?.image && !validateUrl(String(bg.image))) {
			errors.push("general.design.background.image must be a valid URL");
		}
		const widget = asObj(design.widget);
		if (widget?.borderImage && !validateUrl(String(widget.borderImage))) {
			errors.push("general.design.widget.borderImage must be a valid URL");
		}
	}

	if (general.theme) {
		const themeValue = Array.isArray(general.theme)
			? general.theme
			: asObj(general.theme)?.value;
		if (!Array.isArray(themeValue)) {
			errors.push("general.theme must be an array");
		}
	}

	const effect = asObj(general.effect);
	if (effect) {
		if (typeof effect.enabled !== "boolean") {
			errors.push("general.effect.enabled must be a boolean");
		}
		if (effect.type && typeof effect.type !== "string") {
			errors.push("general.effect.type must be a string");
		}
	}

	return errors;
};

const validateMainData = (main: ImportObject): string[] => {
	const errors: string[] = [];

	const layout = asObj(main.customLayout);
	if (layout) {
		if (layout.layout && !Array.isArray(layout.layout)) {
			errors.push("main.customLayout.layout must be an array");
		}
		if (layout.mobileLayout && !Array.isArray(layout.mobileLayout)) {
			errors.push("main.customLayout.mobileLayout must be an array");
		}
		if (layout.desktopWidgets && !Array.isArray(layout.desktopWidgets)) {
			errors.push("main.customLayout.desktopWidgets must be an array");
		}
		if (layout.mobileWidgets && !Array.isArray(layout.mobileWidgets)) {
			errors.push("main.customLayout.mobileWidgets must be an array");
		}
	}

	if (main.slide) {
		if (!Array.isArray(main.slide)) {
			errors.push("main.slide must be an array");
		} else {
			(main.slide as ImportObject[]).forEach((slide, index) => {
				if (slide.image && !validateUrl(String(slide.image))) {
					errors.push(`main.slide[${index}].image must be a valid URL`);
				}
			});
		}
	}

	if (main.dday) {
		if (!Array.isArray(main.dday)) {
			errors.push("main.dday must be an array");
		} else {
			(main.dday as ImportObject[]).forEach((item, index) => {
				if (item.image && !validateUrl(String(item.image))) {
					errors.push(`main.dday[${index}].image must be a valid URL`);
				}
			});
		}
	}

	const profile = asObj(main.profile);
	if (profile) {
		if (profile.headerImage && !validateUrl(String(profile.headerImage))) {
			errors.push("main.profile.headerImage must be a valid URL");
		}
		if (profile.profileImage && !validateUrl(String(profile.profileImage))) {
			errors.push("main.profile.profileImage must be a valid URL");
		}
	}

	const notice = asObj(main.notice);
	if (notice) {
		const marqueeSettings = asObj(notice.marqueeSettings);
		if (
			marqueeSettings?.backgroundColor &&
			typeof marqueeSettings.backgroundColor !== "string"
		) {
			errors.push("main.notice.marqueeSettings.backgroundColor must be a string");
		}
	}

	const mp = asObj(main.musicPlayer);
	if (main.musicPlayer !== undefined) {
		if (!mp) {
			errors.push("main.musicPlayer must be an object");
		} else {
			if (typeof mp.enabled !== "boolean") {
				errors.push("main.musicPlayer.enabled must be a boolean");
			}
			if (!Array.isArray(mp.items)) {
				errors.push("main.musicPlayer.items must be an array");
			} else {
				(mp.items as unknown[]).forEach((rawItem, index) => {
					const item = asObj(rawItem);
					if (!item) {
						errors.push(`main.musicPlayer.items[${index}] must be an object`);
						return;
					}
					if (!item.id || typeof item.id !== "string") {
						errors.push(`main.musicPlayer.items[${index}].id must be a string`);
					}
					if (typeof item.title !== "string") {
						errors.push(`main.musicPlayer.items[${index}].title must be a string`);
					}
					const url = typeof item.url === "string" ? item.url : "";
					const hasVideoId =
						typeof item.videoId === "string" &&
						Boolean(extractYouTubeVideoId(item.videoId));
					const hasPlaylistId =
						typeof item.playlistId === "string" &&
						Boolean(extractYouTubePlaylistId(item.playlistId));
					const hasVideoUrl = validateUrl(url) && Boolean(extractYouTubeVideoId(url));
					const hasPlaylistUrl = validateUrl(url) && Boolean(extractYouTubePlaylistId(url));
					if (!hasVideoId && !hasPlaylistId && !hasVideoUrl && !hasPlaylistUrl) {
						errors.push(
							`main.musicPlayer.items[${index}] must have a valid videoId or playlistId`
						);
					}
				});
			}
			if (mp.defaultItemId !== undefined && typeof mp.defaultItemId !== "string") {
				errors.push("main.musicPlayer.defaultItemId must be a string");
			}
		}
	}

	const wc = asObj(main.weatherClock);
	if (main.weatherClock !== undefined) {
		if (!wc) {
			errors.push("main.weatherClock must be an object");
		} else {
			if (typeof wc.enabled !== "boolean") {
				errors.push("main.weatherClock.enabled must be a boolean");
			}
			if (typeof wc.city !== "string" || !String(wc.city).trim()) {
				errors.push("main.weatherClock.city must be a non-empty string");
			}
		}
	}

	return errors;
};

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { general, main } = await req.json();

		if (!general && !main) {
			return jsonError(400, "At least one of 'general' or 'main' data is required");
		}

		const validationErrors: string[] = [];
		if (general) validationErrors.push(...validateGeneralData(general as ImportObject));
		if (main) validationErrors.push(...validateMainData(main as ImportObject));
		if (validationErrors.length > 0) {
			return NextResponse.json(
				{ error: "Validation failed", details: validationErrors },
				{ status: 400 }
			);
		}

		const db = getDb();
		const batch = db.batch();
		const updatedSections: string[] = [];

		if (general) {
			const generalDocRef = db.collection("settings").doc("general");
			const generalDoc = await generalDocRef.get();
			if (!generalDoc.exists) {
				batch.set(generalDocRef, {});
			}
			if (general.general) {
				const primaryColorPalette = general.general.primaryColor
					? generateColorPalette(general.general.primaryColor)
					: general.general.primaryColorPalette;
				const secondaryColorPalette = general.general.secondaryColor
					? generateColorPalette(general.general.secondaryColor)
					: general.general.secondaryColorPalette;
				const generalPayload = {
					...general.general,
					primaryColorPalette,
					secondaryColorPalette,
				};
				batch.set(generalDocRef, { general: generalPayload }, { merge: true });
			}
			if (general.design) {
				batch.set(generalDocRef, { design: general.design }, { merge: true });
			}
			if (general.menu) {
				batch.set(generalDocRef, { menu: general.menu }, { merge: true });
			}
			if (general.theme) {
				batch.set(generalDocRef, { theme: general.theme }, { merge: true });
			}
			if (general.effect) {
				batch.set(generalDocRef, { effect: general.effect }, { merge: true });
			}
			updatedSections.push("general");
		}

		if (main) {
			const mainDocRef = db.collection("settings").doc("main");
			const mainDoc = await mainDocRef.get();
			if (!mainDoc.exists) {
				batch.set(mainDocRef, {});
			}
			if (main.customLayout) {
				batch.set(mainDocRef, { customLayout: main.customLayout }, { merge: true });
			}
			if (main.slide) {
				batch.set(mainDocRef, { slide: main.slide }, { merge: true });
			}
			if (main.notice) {
				batch.set(mainDocRef, { notice: main.notice }, { merge: true });
			}
			if (main.profile) {
				batch.set(mainDocRef, { profile: main.profile }, { merge: true });
			}
			if (main.dday) {
				batch.set(mainDocRef, { dday: main.dday }, { merge: true });
			}
			if (main.musicPlayer) {
				batch.set(mainDocRef, { musicPlayer: main.musicPlayer }, { merge: true });
			}
			if (main.weatherClock) {
				batch.set(
					mainDocRef,
					{ weatherClock: main.weatherClock },
					{ merge: true }
				);
			}
			updatedSections.push("main");
		}

		await batch.commit();
		revalidateTag("settings");

		return NextResponse.json({
			message: "Settings imported successfully",
			updatedSections,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error importing settings:", error);
		return jsonError(500, "Failed to import settings");
	}
}
