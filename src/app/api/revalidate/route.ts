import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const SETTINGS_TAG = "settings";

export async function POST(req: NextRequest) {
	const secret = process.env.REVALIDATE_SECRET;
	if (secret) {
		const provided = req.headers.get("x-revalidate-token");
		if (provided !== secret) {
			return NextResponse.json(
				{ revalidated: false, message: "Invalid token" },
				{ status: 401 }
			);
		}
	}

	let tag = SETTINGS_TAG;
	try {
		const body = await req.json();
		if (body?.tag === SETTINGS_TAG) {
			tag = SETTINGS_TAG;
		}
	} catch {
	}

	revalidateTag(tag);
	return NextResponse.json({ revalidated: true, tag });
}
