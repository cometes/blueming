import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

interface OpenWeatherMapResponse {
	weather: Array<{
		id: number;
		main: string;
		description: string;
		icon: string;
	}>;
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
	};
	timezone: number;
	name: string;
}

type WeatherCondition =
	| "sunny"
	| "rainy"
	| "cloudy"
	| "thunder-storm"
	| "flurries"
	| "sun-shower";

const mapWeatherIdToCondition = (weatherId: number): WeatherCondition => {
	if (weatherId >= 200 && weatherId < 300) return "thunder-storm";
	if (weatherId >= 300 && weatherId < 400) return "rainy";
	if (weatherId >= 500 && weatherId < 600) {
		if (weatherId === 500 || weatherId === 501) return "sun-shower";
		return "rainy";
	}
	if (weatherId >= 600 && weatherId < 700) return "flurries";
	if (weatherId >= 700 && weatherId < 800) return "cloudy";
	if (weatherId === 800) return "sunny";
	if (weatherId > 800) return "cloudy";
	return "sunny";
};

const getWeatherKeyForUid = async (uid: string) => {
	const db = getDb();
	const docRef = db
		.collection("userSecrets")
		.doc(uid)
		.collection("weather")
		.doc("openweathermap");
	const snapshot = await docRef.get();
	const data = snapshot.exists ? snapshot.data() : null;
	const apiKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : "";
	return apiKey || null;
};

const getFallbackAdminUid = async () => {
	const db = getDb();
	const snapshot = await db
		.collection("users")
		.where("role", "==", "admin")
		.limit(5)
		.get();
	for (const doc of snapshot.docs) {
		const data = doc.data() || {};
		if (data.status === "active") {
			return doc.id;
		}
	}
	return snapshot.docs[0]?.id ?? null;
};

// API 키는 거의 변하지 않으므로 인스턴스 메모리에 캐시한다.
// 캐시 미스 시에만 (본인 키 → 관리자 폴백) 최대 3회의 Firestore 왕복이 발생.
const KEY_CACHE_TTL_MS = 10 * 60 * 1000;
const apiKeyCache = new Map<string, { key: string; expiresAt: number }>();

const resolveApiKey = async (uid: string | null): Promise<string> => {
	const cacheKey = uid ?? "anon";
	const cached = apiKeyCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) return cached.key;

	let key = "";
	if (uid) {
		key = (await getWeatherKeyForUid(uid)) ?? "";
	}
	if (!key) {
		const adminUid = await getFallbackAdminUid();
		if (adminUid) {
			key = (await getWeatherKeyForUid(adminUid)) ?? "";
		}
	}
	if (!key) {
		key = process.env.OPENWEATHERMAP_API_KEY ?? "";
	}
	apiKeyCache.set(cacheKey, { key, expiresAt: Date.now() + KEY_CACHE_TTL_MS });
	return key;
};

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ city?: string }> }
) {
	try {
		const { city } = await params;

		const auth = await getAuthContext();
		const apiKey = await resolveApiKey(auth?.uid ?? null);

		if (!apiKey) {
			console.error("OPENWEATHERMAP_API_KEY is not set");
			return jsonError(500, "Weather service is not configured");
		}

		if (!city || !city.trim()) {
			return jsonError(400, "City name is required");
		}

		const query = new URLSearchParams({
			q: city.trim(),
			appid: apiKey,
			units: "metric",
			lang: "kr",
		});

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);
		const response = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?${query.toString()}`,
			{ cache: "no-store", signal: controller.signal }
		).finally(() => clearTimeout(timeoutId));

		if (!response.ok) {
			if (response.status === 404) {
				return jsonError(404, "City not found");
			}
			if (response.status === 401) {
				return jsonError(500, "Invalid API key");
			}
			return jsonError(500, "Failed to fetch weather data");
		}

		const data = (await response.json()) as OpenWeatherMapResponse;
		const weather = data.weather?.[0];
		if (!weather) {
			return jsonError(500, "Failed to fetch weather data");
		}

		return jsonOk(
			{
				city: data.name,
				temperature: Math.round(data.main.temp),
				feelsLike: Math.round(data.main.feels_like),
				condition: mapWeatherIdToCondition(weather.id),
				description: weather.description,
				humidity: data.main.humidity,
				timezone: data.timezone,
			},
			{
				// 날씨는 10분 정도의 신선도면 충분 — CDN이 도시별로 캐시해
				// OpenWeatherMap 왕복과 함수 실행 자체를 흡수한다.
				headers: {
					"Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
				},
			}
		);
	} catch (error) {
		console.error("Error fetching weather data:", error);
		if ((error as Error)?.name === "AbortError") {
			return jsonError(504, "Weather request timeout");
		}
		return jsonError(500, "Failed to fetch weather data");
	}
}
