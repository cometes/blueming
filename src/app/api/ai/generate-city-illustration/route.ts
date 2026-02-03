import type { NextRequest } from "next/server";
import mime from "mime";
import { GoogleGenAI } from "@google/genai";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getBucket, getDb } from "@/app/api/_lib/admin";
import { requireAdmin } from "@/app/api/_lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const getUserApiKey = async (uid: string) => {
	const db = getDb();
	const docRef = db.collection("userSecrets").doc(uid).collection("ai").doc("gemini");
	const snapshot = await docRef.get();
	if (!snapshot.exists) return null;
	const data = snapshot.data();
	return typeof data?.apiKey === "string" ? data.apiKey : null;
};

const buildPrompt = (city: string) =>
	`Create a clean, modern cityscape illustration of ${city}. Soft lighting, minimal clouds, clear sky, vibrant yet calm colors. No text.`;

const sanitizeCity = (value: string) =>
	value.trim().replace(/[^\w가-힣-_]+/g, "_").slice(0, 40);

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = await req.json();
		const city = typeof body?.city === "string" ? body.city.trim() : "";
		const promptRaw = typeof body?.prompt === "string" ? body.prompt.trim() : "";
		if (!city) {
			return jsonError(400, "City is required.", { code: "CITY_REQUIRED" });
		}

		const apiKey = await getUserApiKey(auth.auth.uid);
		if (!apiKey) {
			return jsonError(400, "API key is missing.", { code: "MISSING_API_KEY" });
		}

		const prompt = promptRaw || buildPrompt(city);
		const ai = new GoogleGenAI({ apiKey });
		const response = await ai.models.generateContent({
			model: "gemini-3-pro-image-preview",
			config: {
				responseModalities: ["IMAGE", "TEXT"],
				imageConfig: {
					imageSize: "1K",
				},
			},
			contents: [
				{
					role: "user",
					parts: [{ text: prompt }],
				},
			],
		});

		const parts = response.candidates?.[0]?.content?.parts ?? [];
		const inlineData = parts.find((part) => part.inlineData)?.inlineData;
		if (!inlineData?.data) {
			return jsonError(500, "Failed to generate image.", {
				code: "GENERATION_FAILED",
				details: response,
			});
		}

		const buffer = Buffer.from(inlineData.data, "base64");
		const ext = mime.getExtension(inlineData.mimeType || "") || "png";
		const filename = `${Date.now()}_${sanitizeCity(city)}.${ext}`;
		const storagePath = `users/${auth.auth.uid}/ai/illustrations/${filename}`;
		const fileRef = getBucket().file(storagePath);

		await fileRef.save(buffer, {
			contentType: inlineData.mimeType || "image/png",
		});
		await fileRef.makePublic();

		const publicUrl = fileRef.publicUrl();
		return jsonOk({ success: true, imageUrl: publicUrl, city });
	} catch (error) {
		console.error("Error generating city illustration:", error);
		return jsonError(500, "Failed to generate image.", {
			code: "UNKNOWN_ERROR",
			details: error instanceof Error ? { message: error.message } : { message: "Unknown error" },
		});
	}
}
