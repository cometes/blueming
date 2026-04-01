import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "./admin";
import { normalizeGeneralData } from "./settings";
import type { SettingsSnapshot, FontRegistryItem } from "@/features/settings/types";

export type { FontRegistryItem };
export type ServerSettings = SettingsSnapshot;

const _fetchServerSettings = unstable_cache(
	async (): Promise<ServerSettings | null> => {
		try {
			const db = getDb();
			const settingsSnapshot = await db.collection("settings").get();
			const settingsDataPromises = settingsSnapshot.docs.map(async (doc) => {
				const docData = doc.exists ? doc.data() : {};
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
			return normalized as ServerSettings;
		} catch {
			return null;
		}
	},
	["server-settings"],
	{ tags: ["settings"] }
);

// React cache for within-request deduplication on top of Next.js Data Cache
export const getServerSettings = cache(_fetchServerSettings);
