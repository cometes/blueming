import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const SETTINGS_TAG = "settings";

export async function POST(req: NextRequest) {
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
